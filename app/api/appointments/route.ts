import { NextResponse } from "next/server";
import { z } from "zod";
import { appointmentFormSchema, PHOTO_LIMITS } from "@/lib/validations/appointment";
import { uploadAppointmentPhotos } from "@/lib/storage";
import { db } from "@/lib/db/client";
import { appointmentRequests } from "@/lib/db/schema";
import { sendOwnerNewRequestEmail } from "@/lib/email";
import { sendOwnerNewRequestSms } from "@/lib/sms";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  let serviceTypes: unknown = [];
  try {
    serviceTypes = JSON.parse(String(formData.get("serviceTypes") ?? "[]"));
  } catch {
    return NextResponse.json({ error: "Invalid service selection." }, { status: 400 });
  }

  const parsed = appointmentFormSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    bikeYearMakeModel: formData.get("bikeYearMakeModel"),
    serviceTypes,
    details: formData.get("details"),
    preferredDropoffDate: formData.get("preferredDropoffDate"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: z.prettifyError(parsed.error) },
      { status: 400 },
    );
  }

  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (photos.length > PHOTO_LIMITS.maxFiles) {
    return NextResponse.json(
      { error: `You can upload up to ${PHOTO_LIMITS.maxFiles} photos.` },
      { status: 400 },
    );
  }
  for (const photo of photos) {
    if (photo.size > PHOTO_LIMITS.maxFileSizeBytes) {
      return NextResponse.json({ error: "Each photo must be under 8MB." }, { status: 400 });
    }
    if (!PHOTO_LIMITS.acceptedTypes.includes(photo.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, or HEIC photos are supported." },
        { status: 400 },
      );
    }
  }

  let photoUrls: string[] = [];
  try {
    photoUrls = await uploadAppointmentPhotos(photos);
  } catch (error) {
    console.error("[api/appointments] photo upload failed:", error);
    return NextResponse.json(
      { error: "Could not upload photos. Please try again." },
      { status: 502 },
    );
  }

  const { preferredDropoffDate, ...fields } = parsed.data;

  let created;
  try {
    [created] = await db
      .insert(appointmentRequests)
      .values({
        ...fields,
        photoUrls,
        preferredDropoffAt: preferredDropoffDate ? new Date(preferredDropoffDate) : null,
      })
      .returning();
  } catch (error) {
    console.error("[api/appointments] failed to save request:", error);
    return NextResponse.json(
      { error: "Could not submit your request right now. Please try again shortly." },
      { status: 502 },
    );
  }

  const notifications = await Promise.allSettled([
    sendOwnerNewRequestEmail(created),
    sendOwnerNewRequestSms(created),
  ]);
  notifications.forEach((result) => {
    if (result.status === "rejected") {
      console.error("[api/appointments] owner notification failed:", result.reason);
    }
  });

  return NextResponse.json({ ok: true });
}
