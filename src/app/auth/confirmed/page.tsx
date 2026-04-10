import Link from "next/link";

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <div className="max-w-sm space-y-8 text-center">
        <span className="text-6xl block">✅</span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Email confirmed!
          </h1>
          <p className="text-sm text-muted-foreground">
            You can close this tab and return to HiddenLot — it will update
            automatically.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-block text-sm text-primary font-medium hover:underline"
        >
          Or continue here →
        </Link>
      </div>
    </div>
  );
}
