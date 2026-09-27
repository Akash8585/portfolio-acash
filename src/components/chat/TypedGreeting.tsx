"use client";

import profile from "@/data/profile.json";
import { useEffect, useState } from "react";

const GREETING = profile.assistantGreeting;

/** Module-level so navigating between pages does not replay the intro. */
let hasPlayed = false;

export default function TypedGreeting() {
  const [shown, setShown] = useState(hasPlayed ? GREETING : "");
  const [done, setDone] = useState(hasPlayed);

  useEffect(() => {
    if (hasPlayed) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      hasPlayed = true;
      setShown(GREETING);
      setDone(true);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setShown(GREETING.slice(0, i));
      if (i >= GREETING.length) {
        window.clearInterval(id);
        hasPlayed = true;
        setDone(true);
      }
    }, 14);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="text-sm leading-relaxed" aria-live="polite">
      <span className={done ? undefined : "caret"}>{shown}</span>
    </p>
  );
}
