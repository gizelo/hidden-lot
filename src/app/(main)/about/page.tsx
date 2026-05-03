export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 py-4">
      <header className="space-y-3">
        <span className="text-5xl">🪎</span>
        <h1 className="text-3xl font-bold tracking-tight">About HiddenLot</h1>
        <p className="text-base text-muted-foreground">
          A casual auction marketplace where forgotten things turn into someone
          else&apos;s treasure. Snap a photo — the AI writes the listing — the
          internet decides what it&apos;s worth.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            Upload one clear photo of something you&apos;d like to sell.
          </li>
          <li>
            Our AI writes the title, description, category, suggested starting
            price, and a rarity guess.
          </li>
          <li>
            Review and tweak what the AI got wrong, then publish. The auction
            runs for 24 hours.
          </li>
          <li>
            Buyers scroll the feed, bid on what catches their eye, and the
            highest bid wins when the timer runs out.
          </li>
        </ol>
      </section>

      <section id="rarity" className="space-y-4 scroll-mt-20">
        <h2 className="text-xl font-semibold">Rarity Tier — what does it mean?</h2>
        <p className="text-sm leading-relaxed">
          Every lot gets a rarity label from the AI. It&apos;s a quick hunch
          based on what&apos;s visible in the photo — not an appraisal,
          authentication, or valuation of any kind. Think of it as a fun
          signal, not a grade.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <span className="text-2xl">⚪</span>
            <div className="space-y-1">
              <p className="font-semibold">Common</p>
              <p className="text-sm text-muted-foreground">
                Mass-produced, widely available, or shows no obvious collector
                signals. The default tier — most lots land here.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <span className="text-2xl">🔵</span>
            <div className="space-y-1">
              <p className="font-semibold">Rare</p>
              <p className="text-sm text-muted-foreground">
                The AI spotted something specific: edition markings, apparent
                age, a recognizable collector brand. Interesting, but not
                verified.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <span className="text-2xl">🟡</span>
            <div className="space-y-1">
              <p className="font-semibold">Jackpot</p>
              <p className="text-sm text-muted-foreground">
                Multiple strong visual indicators at once. Still a guess — worth
                your own research before bidding seriously.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-4 text-sm">
          <p className="font-semibold">Heads up</p>
          <p className="mt-1 text-muted-foreground">
            The rarity tier is AI-generated entertainment. It is not a
            certificate, not a guarantee, and not a price. Always do your own
            research before placing a bid, especially on Rare or Jackpot lots.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">House rules</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-muted-foreground/60">•</span>
            <span>
              One item per photo, clearly visible. No people as the main
              subject.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground/60">•</span>
            <span>
              No drugs, weapons, NSFW content, live animals, cash, medications,
              real estate, vehicles, or digital goods.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground/60">•</span>
            <span>
              Listings can&apos;t contain phone numbers, links, emails, or
              social handles — all contact happens through the platform.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground/60">•</span>
            <span>
              Be honest about condition. Describe what you see, don&apos;t
              invent history.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
