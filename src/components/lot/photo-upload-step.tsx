"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { usePhotoUpload } from "@/hooks/use-photo-upload";
import { ImagePlus, Loader2, Sparkles, AlertTriangle } from "lucide-react";

export function PhotoUploadStep({
  analyzing,
  analyzeError,
  onUploaded,
  onClearError,
}: {
  analyzing: boolean;
  analyzeError: string | null;
  onUploaded: (uploadedUrl: string) => void;
  onClearError: () => void;
}) {
  const { status, previewUrl, uploadedUrl, error, handleFile } = usePhotoUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const firedRef = useRef(false);

  // Auto-trigger analysis once upload finishes
  useEffect(() => {
    if (status === "done" && uploadedUrl && !firedRef.current) {
      firedRef.current = true;
      onUploaded(uploadedUrl);
    }
  }, [status, uploadedUrl, onUploaded]);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onClearError();
      handleFile(file);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onClearError();
      handleFile(file);
    }
    e.target.value = "";
  }

  const busy = status === "compressing" || status === "uploading" || analyzing;
  const overlayLabel =
    status === "compressing"
      ? "Compressing..."
      : status === "uploading"
      ? "Uploading..."
      : analyzing
      ? "AI is checking your photo..."
      : null;

  return (
    <div className="flex flex-col gap-4">
      {previewUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full rounded-xl object-cover aspect-square"
          />

          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/55">
              {analyzing ? (
                <Sparkles className="size-10 animate-pulse text-white" />
              ) : (
                <Loader2 className="size-10 animate-spin text-white" />
              )}
              <span className="text-base font-medium text-white">
                {overlayLabel}
              </span>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={`flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
          }`}
        >
          <ImagePlus className="size-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-base font-semibold">Tap or drag a photo</p>
            <p className="text-sm text-muted-foreground">
              JPG, PNG, WebP — up to 10MB
            </p>
          </div>
        </button>
      )}

      {!previewUrl && (
        <p className="text-sm text-muted-foreground">
          One item per photo, clearly visible, no clutter in the background — helps AI nail the listing.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      {(error || analyzeError) && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{error ?? analyzeError}</span>
        </div>
      )}
    </div>
  );
}
