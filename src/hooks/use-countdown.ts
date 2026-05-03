"use client";

import { useEffect, useState } from "react";

export function useCountdown(endsAt: Date | string | null | undefined): string {
  const endMs = endsAt ? new Date(endsAt).getTime() : null;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (endMs === null) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [endMs]);

  return formatRemaining(endMs);
}

function formatRemaining(endMs: number | null): string {
  if (endMs === null) return "";
  const diff = endMs - Date.now();
  if (diff <= 0) return "ended";
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
