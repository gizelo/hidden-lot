"use client";

import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhotoUploadStep } from "./photo-upload-step";
import { EditListingStep } from "./edit-listing-step";
import { analyzeLot } from "@/actions/lot";
import type { LotAnalysis } from "@/lib/openai";
import { ShieldAlert } from "lucide-react";

export function CreateLotModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LotAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setStep(1);
        setPhotoUrl(null);
        setAnalysis(null);
        setAnalyzing(false);
        setAnalyzeError(null);
        setRejection(null);
        setUploadKey((k) => k + 1);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  async function handleUploaded(url: string) {
    setPhotoUrl(url);
    setAnalyzing(true);
    setAnalyzeError(null);
    const result = await analyzeLot(url);
    setAnalyzing(false);
    if ("error" in result) {
      setAnalyzeError(result.error);
      return;
    }
    if (result.data.rejected) {
      setRejection(
        result.data.rejectionReason ?? "This photo is not suitable for our marketplace."
      );
      return;
    }
    setAnalysis(result.data);
    setStep(2);
  }

  function handleRejectionClose() {
    setRejection(null);
    setPhotoUrl(null);
    setAnalyzeError(null);
    setUploadKey((k) => k + 1); // force fresh upload state
  }

  function handleBack() {
    setStep(1);
    setPhotoUrl(null);
    setAnalysis(null);
    setAnalyzeError(null);
    setUploadKey((k) => k + 1);
  }

  function handlePublished() {
    handleClose(false);
  }

  return (
    <>
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
            <PhotoUploadStep
              key={uploadKey}
              analyzing={analyzing}
              analyzeError={analyzeError}
              onUploaded={handleUploaded}
              onClearError={() => setAnalyzeError(null)}
            />
          )}

          {step === 2 && photoUrl && analysis && (
            <EditListingStep
              photoUrl={photoUrl}
              analysis={analysis}
              onBack={handleBack}
              onPublished={handlePublished}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejection !== null}
        onOpenChange={(o) => {
          if (!o) handleRejectionClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="size-8 text-destructive" />
            </div>
            <DialogTitle className="text-center">
              We can&apos;t list this photo
            </DialogTitle>
            <DialogDescription className="text-center">
              {rejection}
            </DialogDescription>
          </DialogHeader>
          <Button size="lg" onClick={handleRejectionClose} className="w-full">
            Try another photo
          </Button>
        </DialogContent>
      </Dialog>
    </>
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
