import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="space-y-8 text-center">
      {/* Logo */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">HiddenLot</h2>
      </div>

      {/* Icon */}
      <div className="text-6xl">📬</div>

      {/* Message */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Check your email</h3>
        <p className="text-sm text-muted-foreground">
          We sent you a confirmation link. Click it to verify your account and
          start exploring.
        </p>
      </div>

      {/* Footer */}
      <p className="text-sm text-muted-foreground">
        Already verified?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
