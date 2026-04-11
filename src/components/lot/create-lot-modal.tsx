"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PhotoUploadStep } from "./photo-upload-step";
import { EditListingStep } from "./edit-listing-step";

export function CreateLotModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        // Reset wizard state on close
        setStep(1);
        setPhotoUrl(null);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  function handlePhotoComplete(uploadedUrl: string) {
    setPhotoUrl(uploadedUrl);
    setStep(2);
  }

  function handlePublished() {
    handleClose(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent variant="sheet" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Add a photo"}
            {step === 2 && "Review listing"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Take a snap or pick from your gallery."}
            {step === 2 && "Edit the AI-generated listing and publish."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <PhotoUploadStep onComplete={handlePhotoComplete} />
        )}

        {step === 2 && photoUrl && (
          <EditListingStep
            photoUrl={photoUrl}
            onBack={() => setStep(1)}
            onPublished={handlePublished}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CreateLotTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <CreateLotModal open={open} onOpenChange={setOpen} />
    </>
  );
}
