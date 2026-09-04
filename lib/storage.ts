import { put } from "@vercel/blob";

const BLOB_CONFIGURED = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
);

function asDataUri(file: { bytes: Buffer; contentType: string }): string {
  return `data:${file.contentType};base64,${file.bytes.toString("base64")}`;
}

// Uploads intake photos to Vercel Blob so only lightweight URLs (not raw
// binaries) travel through the webhook payload to Zapier/Make.
export async function uploadAppointmentPhotos(photos: File[]): Promise<string[]> {
  if (photos.length === 0) return [];

  if (!BLOB_CONFIGURED) {
    console.warn(
      "[storage] BLOB_READ_WRITE_TOKEN is not set — skipping photo upload. " +
        `${photos.length} photo(s) submitted will not be forwarded.`,
    );
    return [];
  }

  const uploads = await Promise.all(
    photos.map(async (photo, index) => {
      const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const pathname = `appointments/${Date.now()}-${index}-${safeName}`;
      const blob = await put(pathname, photo, {
        access: "public",
        addRandomSuffix: true,
      });
      return blob.url;
    }),
  );

  return uploads;
}

export async function uploadIntakeImages(
  files: { bytes: Buffer; filename: string; contentType: string }[],
): Promise<string[]> {
  if (files.length === 0) return [];

  if (!BLOB_CONFIGURED) {
    console.warn(
      "[storage] Blob is not configured — keeping intake images as data URIs so drafts still have screenshots.",
    );
    return files.map(asDataUri);
  }

  try {
    const uploads = await Promise.all(
      files.map(async (file, index) => {
        const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "-") || `screenshot-${index}.png`;
        const pathname = `intake/${Date.now()}-${index}-${safeName}`;
        const blob = await put(pathname, file.bytes, {
          access: "public",
          addRandomSuffix: true,
          contentType: file.contentType,
        });
        return blob.url;
      }),
    );
    return uploads;
  } catch (error) {
    console.error("[storage] blob upload failed — falling back to data URIs:", error);
    return files.map(asDataUri);
  }
}
