import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";
import { CreateLotTrigger } from "@/components/lot/create-lot-modal";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/feed" className="text-xl font-bold tracking-tight">
          🪎 HiddenLot
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-7">
          <Link
            href="/feed"
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Feed
          </Link>
          <CreateLotTrigger className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">
            Create
          </CreateLotTrigger>
          <Link
            href="/profile"
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Profile
          </Link>
          <form action={signOut}>
            <Button variant="ghost" type="submit">
              Sign out
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
