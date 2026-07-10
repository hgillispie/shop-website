"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { PHOTO_LIMITS } from "@/lib/validations/appointment";
import { cn } from "@/lib/utils";

type PhotoUploadProps = {
  files: File[];
  onChange: (files: File[]) => void;
};

export function PhotoUpload({ files, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function addFiles(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return;

    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (next.length >= PHOTO_LIMITS.maxFiles) {
        setError(`You can upload up to ${PHOTO_LIMITS.maxFiles} photos.`);
        break;
      }
      if (!PHOTO_LIMITS.acceptedTypes.includes(file.type)) {
        setError("Only JPG, PNG, WEBP, or HEIC photos are supported.");
        continue;
      }
      if (file.size > PHOTO_LIMITS.maxFileSizeBytes) {
        setError("Each photo must be under 8MB.");
        continue;
      }
      next.push(file);
    }
    onChange(next);
    if (next.length && next.length <= PHOTO_LIMITS.maxFiles) setError(null);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
    setError(null);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface px-4 py-10 text-center transition-colors",
          dragActive && "border-accent bg-accent-soft",
        )}
      >
        <ImagePlus className="h-6 w-6 text-muted" aria-hidden="true" />
        <p className="text-sm text-foreground">
          Drop photos here, or tap to upload from your phone
        </p>
        <p className="text-xs text-muted">
          Bike overview, damage, or wiring — up to {PHOTO_LIMITS.maxFiles} photos, 8MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_LIMITS.acceptedTypes.join(",")}
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {previews.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map((src, index) => (
            <li key={src} className="relative aspect-square overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
