import "server-only";
import { saveIntakeCapture } from "@/lib/intake/create-draft";
import {
  blankToNull,
  htmlToText,
  isAllowedIntakeSender,
  isIntakeImageType,
  parseFromHeader,
} from "@/lib/intake/fields";
import { getIntakeResend } from "@/lib/intake/resend-client";

type ReceivedEmail = {
  id?: string;
  from?: string;
  subject?: string | null;
  text?: string | null;
  html?: string | null;
  headers?: Record<string, string> | null;
  attachments?: Array<{
    id: string;
    filename?: string | null;
    content_type?: string | null;
  }> | null;
};

type AttachmentListItem = {
  id: string;
  filename?: string | null;
  content_type?: string | null;
  download_url?: string | null;
};

export async function processReceivedEmail(emailId: string): Promise<{
  ok: true;
  skipped?: string;
  jobId?: string;
}> {
  const resend = getIntakeResend();
  if (!resend) {
    throw new Error("RESEND_API_KEY is not set.");
  }

  const { data: email, error } = await resend.emails.receiving.get(emailId);
  if (error || !email) {
    throw new Error(error?.message ?? "Could not load received email.");
  }

  const received = email as ReceivedEmail;
  const fromHeader = received.headers?.from || received.from || "";
  const parsedFrom = parseFromHeader(fromHeader);

  if (!isAllowedIntakeSender(parsedFrom.email || fromHeader)) {
    console.info("[intake] ignored email from", parsedFrom.email);
    return { ok: true, skipped: "sender not allowed" };
  }

  const bodyText =
    blankToNull(received.text) ||
    (received.html ? htmlToText(received.html) : null);
  const images = await downloadIntakeImages(emailId, received);
  const saved = await saveIntakeCapture({
    source: "email",
    resendEmailId: emailId,
    fromEmail: parsedFrom.email || null,
    subject: blankToNull(received.subject),
    bodyText,
    fallbackName: parsedFrom.name,
    images,
  });

  return { ok: true, jobId: saved.job.id };
}

async function downloadIntakeImages(
  emailId: string,
  received: ReceivedEmail,
): Promise<{ bytes: Buffer; filename: string; contentType: string }[]> {
  const resend = getIntakeResend();
  if (!resend) return [];

  const listed = await resend.emails.receiving.attachments.list({ emailId });
  const attachments = (listed.data?.data ?? listed.data ?? []) as AttachmentListItem[];
  const candidates =
    attachments.length > 0
      ? attachments
      : (received.attachments ?? []).map((att) => ({
          id: att.id,
          filename: att.filename,
          content_type: att.content_type,
          download_url: null,
        }));

  const images: { bytes: Buffer; filename: string; contentType: string }[] = [];

  for (const attachment of candidates) {
    const contentType = attachment.content_type ?? "";
    if (!isIntakeImageType(contentType)) continue;

    let downloadUrl = attachment.download_url ?? null;
    if (!downloadUrl) {
      const detail = await resend.emails.receiving.attachments.get({
        emailId,
        id: attachment.id,
      });
      const detailData = detail.data as AttachmentListItem | null;
      downloadUrl = detailData?.download_url ?? null;
    }
    if (!downloadUrl) continue;

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      console.error("[intake] failed to download attachment", attachment.id, response.status);
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    images.push({
      bytes,
      filename: attachment.filename || `${attachment.id}.png`,
      contentType,
    });
  }

  return images;
}
