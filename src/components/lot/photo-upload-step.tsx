"use client";

import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { usePhotoUpload } from "@/hooks/use-photo-upload";
import { ImagePlus, Loader2, CheckCircle, X, ArrowRight } from "lucide-react";

export function PhotoUploadStep({
  onComplete,
}: {
  onComplete?: (uploadedUrl: string) => void;
}) {
  const { status, previewUrl, uploadedUrl, error, handleFile, reset } =
    usePhotoUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected after remove
    e.target.value = "";
  }

  const isProcessing = status === "compressing" || status === "uploading";

  return (
    <div className="flex flex-col gap-4">
      {/* Upload zone or preview */}
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full rounded-xl object-cover aspect-square"
          />

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/50">
              <Loader2 className="size-8 animate-spin text-white" />
              <span className="text-sm font-medium text-white">
                {status === "compressing"
                  ? "Compressing..."
                  : "Uploading..."}
              </span>
            </div>
          )}

          {/* Done overlay */}
          {status === "done" && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                <CheckCircle className="size-3.5" />
                Uploaded
              </span>
            </div>
          )}

          {/* Remove button */}
          {!isProcessing && (
            <button
              type="button"
              onClick={reset}
              className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-lg bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <X className="size-4" />
            </button>
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
          className={`flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
          }`}
        >
          <ImagePlus className="size-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Tap or drag a photo</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP — up to 10MB
            </p>
          </div>
        </button>
      )}

      {/* Photo tip */}
      {!previewUrl && (
        <p className="text-xs text-muted-foreground">
          One item per photo, clearly visible, no clutter in the background — helps AI nail the listing.
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Next button */}
      <Button
        disabled={status !== "done"}
        onClick={() => uploadedUrl && onComplete?.(uploadedUrl)}
        className="w-full"
      >
        Next
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}
