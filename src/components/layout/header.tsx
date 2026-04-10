import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/feed" className="text-lg font-bold tracking-tight">
          🪎 HiddenLot
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          <Link
            href="/feed"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Feed
          </Link>
          <Link
            href="/create"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Create
          </Link>
          <Link
            href="/profile"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Profile
          </Link>
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
