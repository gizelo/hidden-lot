const FLOATING_EMOJIS = [
  { emoji: "💎", className: "top-[8%] left-[12%] text-4xl rotate-[-15deg]" },
  { emoji: "🔍", className: "top-[15%] right-[18%] text-3xl rotate-[10deg]" },
  { emoji: "🎁", className: "top-[35%] left-[8%] text-5xl rotate-[20deg]" },
  { emoji: "✨", className: "top-[25%] right-[10%] text-2xl rotate-[-8deg]" },
  { emoji: "🗝️", className: "bottom-[30%] left-[15%] text-3xl rotate-[12deg]" },
  { emoji: "🏆", className: "bottom-[20%] right-[14%] text-4xl rotate-[-20deg]" },
  { emoji: "📦", className: "bottom-[10%] left-[25%] text-3xl rotate-[5deg]" },
  { emoji: "🎲", className: "top-[55%] right-[25%] text-2xl rotate-[-12deg]" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* Right: brand panel (hidden on mobile) */}
      <div className="hidden lg:flex relative flex-col items-center justify-center bg-primary p-12 text-primary-foreground overflow-hidden">
        {/* Floating emojis */}
        {FLOATING_EMOJIS.map(({ emoji, className }) => (
          <span
            key={emoji}
            className={`absolute opacity-15 select-none ${className}`}
            aria-hidden="true"
          >
            {emoji}
          </span>
        ))}

        {/* Content */}
        <div className="relative max-w-md space-y-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            🪎 Unhide your lot.
          </h1>
          <p className="text-xl text-primary-foreground/80">
            Turn forgotten things into someone else&apos;s treasure in one
            tap.
          </p>
        </div>
      </div>
    </div>
  );
}
