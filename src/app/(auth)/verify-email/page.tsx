"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push("/onboarding");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

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
          We sent you a confirmation link. Click it to verify your account —
          this page will update automatically.
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
