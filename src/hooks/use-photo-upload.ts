"use client";

import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { generateStoragePath, getPublicUrl, BUCKET } from "@/lib/storage";

type Status = "idle" | "compressing" | "uploading" | "done" | "error";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function usePhotoUpload() {
  const [status, setStatus] = useState<Status>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStatus("idle");
    setPreviewUrl(null);
    setUploadedUrl(null);
    setError(null);
  }, [previewUrl]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WebP, etc.)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be under 10MB");
      return;
    }

    // Show preview immediately
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Compress
    setStatus("compressing");
    let compressed: File;
    try {
      compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
    } catch {
      setStatus("error");
      setError("Failed to compress image. Try a different file.");
      return;
    }

    // Upload
    setStatus("uploading");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("error");
        setError("Not authenticated. Please sign in again.");
        return;
      }

      const path = generateStoragePath(user.id, file.name);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed);

      if (uploadError) {
        setStatus("error");
        setError("Upload failed. Check your connection and try again.");
        return;
      }

      setUploadedUrl(getPublicUrl(path));
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Upload failed. Check your connection and try again.");
    }
  }, []);

  return { status, previewUrl, uploadedUrl, error, handleFile, reset };
}
