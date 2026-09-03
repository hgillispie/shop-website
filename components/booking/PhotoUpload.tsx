"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
    setError(null);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-brand-ink/25 bg-brand-paper/60 px-4 py-7 text-center transition-colors focus-visible:outline-2 focus-visible:outline-brand-rust",
          dragActive && "border-brand-rust bg-brand-orange/10",
        )}
      >
        <ImagePlus className="h-6 w-6 text-brand-rust" aria-hidden="true" />
        <p className="text-sm font-semibold text-brand-ink">Tap to add photos</p>
        <p className="text-[11px] leading-5 text-brand-ink/45">
          Overview, damage, or wiring · Up to {PHOTO_LIMITS.maxFiles} files
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_LIMITS.acceptedTypes.join(",")}
          multiple
          capture="environment"
          className="hidden"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      {error && <p className="mt-2 text-xs font-medium text-brand-rust">{error}</p>}

      {previews.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map((src, index) => (
            <li key={src} className="relative aspect-square overflow-hidden border border-brand-ink/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 bg-brand-ink p-1.5 text-white"
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
