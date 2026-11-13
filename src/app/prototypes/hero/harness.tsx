"use client";

/**
 * Prototype harness: shows one hero direction at a time, full size, with the
 * picker pill to flip between them. Keys 1–3 and ←/→ switch; ?v=2 persists the
 * choice across reloads. Switching is instant and re-mounts the variant.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { HeroData, VariantProps } from "./types";
import { Etalase } from "./variants/etalase";
import { Nota } from "./variants/nota";
import { PapanHarga } from "./variants/papan-harga";
import "./picker.css";

const VARIANTS: { name: string; Component: (props: VariantProps) => React.ReactNode }[] = [
  { name: "Papan", Component: PapanHarga },
  { name: "Etalase", Component: Etalase },
  { name: "Nota", Component: Nota },
];

function clampIndex(index: number): number {
  return Number.isInteger(index) && index >= 0 && index < VARIANTS.length ? index : 0;
}

export function Harness({ data }: { data: HeroData }) {
  const searchParams = useSearchParams();
  const [current, setCurrent] = useState(() => clampIndex(Number.parseInt(searchParams.get("v") ?? "1", 10) - 1));
  const [ready, setReady] = useState(false);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const highlightRef = useRef<HTMLSpanElement>(null);

  const moveHighlight = useCallback(() => {
    const item = itemRefs.current[current];
    const highlight = highlightRef.current;
    if (!item || !highlight) return;
    highlight.style.width = `${item.offsetWidth}px`;
    highlight.style.transform = `translateX(${item.offsetLeft}px)`;
  }, [current]);

  useLayoutEffect(() => {
    moveHighlight();
    window.addEventListener("resize", moveHighlight);
    return () => window.removeEventListener("resize", moveHighlight);
  }, [moveHighlight]);

  // Enable the highlight slide only after first paint, so load doesn't animate.
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  const select = useCallback((index: number) => {
    if (index < 0 || index >= VARIANTS.length) return;
    setCurrent(index);
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(index + 1));
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number.parseInt(event.key, 10);
      if (number >= 1 && number <= VARIANTS.length) select(number - 1);
      else if (event.key === "ArrowRight") select((current + 1) % VARIANTS.length);
      else if (event.key === "ArrowLeft") select((current - 1 + VARIANTS.length) % VARIANTS.length);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [current, select]);

  const Variant = VARIANTS[current].Component;

  return (
    <>
      <main id="isi" key={current} className="flex-1 pb-24">
        <Variant data={data} />
      </main>

      <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready ? "" : undefined}>
        <span className="proto-picker-highlight" aria-hidden="true" ref={highlightRef} />
        {VARIANTS.map((variant, index) => (
          <button
            key={variant.name}
            type="button"
            className="proto-picker-item"
            data-active={index === current ? "" : undefined}
            aria-current={index === current ? "true" : undefined}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            onClick={() => select(index)}
          >
            {variant.name}
          </button>
        ))}
      </nav>
    </>
  );
}
