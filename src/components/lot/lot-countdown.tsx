"use client";

import { useEffect, useState } from "react";

function computeSegments(endMs: number) {
  const diff = endMs - Date.now();
  if (diff <= 0) {
    return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const total = Math.floor(diff / 1000);
  return {
    ended: false,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export function LotCountdown({ endsAt }: { endsAt: string }) {
  const endMs = new Date(endsAt).getTime();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { ended, days, hours, minutes, seconds } = computeSegments(endMs);

  return (
    <div className="inline-block rounded-xl border-2 border-foreground bg-foreground p-2 shadow-[4px_4px_0_0_var(--color-foreground)]">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="font-pixel text-[11px] uppercase tracking-[0.15em] text-amber-400">
          {ended ? "Auction ended" : "Ends in"}
        </span>
        {!ended && (
          <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
        )}
      </div>
      <div className="flex items-stretch gap-1">
        {days > 0 && <Cell value={pad(days)} label="days" dim={ended} />}
        <Cell value={pad(hours)} label="hrs" dim={ended} />
        <Cell value={pad(minutes)} label="min" dim={ended} />
        <Cell value={pad(seconds)} label="sec" dim={ended} />
      </div>
    </div>
  );
}

function Cell({
  value,
  label,
  dim,
}: {
  value: string;
  label: string;
  dim: boolean;
}) {
  return (
    <div className="flex min-w-[52px] flex-col items-center rounded-md bg-zinc-900 px-2 py-1.5 shadow-inner">
      <span
        className={`font-pixel text-3xl leading-none tabular-nums ${
          dim ? "text-zinc-600" : "text-amber-400"
        }`}
        style={{
          textShadow: dim ? "none" : "0 0 8px rgba(251, 191, 36, 0.45)",
        }}
      >
        {value}
      </span>
      <span className="mt-1 font-pixel text-[10px] uppercase tracking-widest text-zinc-500">
        {label}
      </span>
    </div>
  );
}
