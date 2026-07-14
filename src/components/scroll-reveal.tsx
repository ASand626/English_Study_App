"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

function subscribeToReducedMotion(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

// useSyncExternalStore is the React-blessed way to read a value that can
// differ between server and client (matchMedia doesn't exist during SSR)
// without a hydration mismatch: it renders the server snapshot on the
// client's first pass, then re-renders with the real value right after —
// no manual setState-in-effect needed (and thus no cascading-render lint
// warning either).
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

// Lightweight Apple-style "fade + rise into view" on scroll. Uses
// IntersectionObserver rather than a scroll listener so it's cheap, and
// respects prefers-reduced-motion by skipping straight to visible.
export default function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || reducedMotion) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, reducedMotion]);

  const shown = visible || reducedMotion;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
