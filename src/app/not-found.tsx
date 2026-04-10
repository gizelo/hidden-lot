import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <div className="max-w-sm space-y-6 text-center">
        <span className="text-6xl block">🔍</span>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Nothing here
          </h1>
          <p className="text-muted-foreground">
            This page doesn&apos;t exist. Maybe it was hidden too well.
          </p>
        </div>
        <Link href="/feed">
          <Button>Back to feed</Button>
        </Link>
      </div>
    </div>
  );
}
