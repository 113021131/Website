"use client";

import { useId, useState } from "react";
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { fill, type Dictionary, type Locale } from "@/i18n";
import type { PriceHistory } from "@/lib/data/content";
import { formatIdr } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTHS: Record<Locale, string[]> = {
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/** The plot leaves this share of its height empty above the highest and below the lowest point. */
const EDGE = 10;

function dayNumber(date: string): number {
  return Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

/**
 * Selling-price history for one karat.
 *
 * The line is plain SVG stretched to its box (no chart library), with strokes
 * that keep their thickness at any width; every label is ordinary HTML, so text
 * stays the size of the rest of the page instead of scaling with the drawing.
 * The same data is also given as a sentence and a table.
 */
export function PriceHistoryChart({ history, locale, t }: { history: PriceHistory; locale: Locale; t: Dictionary["chart"] }) {
  const ids = useId();
  const [karat, setKarat] = useState(history.find((series) => series.karatCode === "24K")?.karatCode ?? history[0]?.karatCode ?? "");
  const [range, setRange] = useState<30 | 90>(30);

  const all = history.find((entry) => entry.karatCode === karat)?.points ?? [];
  // The window ends at the newest data point, so server and browser agree.
  const lastDay = all.length > 0 ? dayNumber(all[all.length - 1].date) : 0;
  const points = all.filter((point) => dayNumber(point.date) > lastDay - range);
  const enough = points.length >= 2;

  const label = (date: string) => `${Number(date.slice(8, 10))} ${MONTHS[locale][Number(date.slice(5, 7)) - 1]}`;

  const first = points[0];
  const latest = points[points.length - 1];
  const min = enough ? Math.min(...points.map((point) => point.sellIdr)) : 0;
  const max = enough ? Math.max(...points.map((point) => point.sellIdr)) : 0;

  // Coordinates in a 0–100 box; the SVG stretches it to whatever size the page gives it.
  const firstDay = enough ? dayNumber(first.date) : 0;
  const span = Math.max(1, lastDay - firstDay);
  const spread = Math.max(1, max - min);
  const coordinates = enough
    ? points.map((point) => ({
        x: ((dayNumber(point.date) - firstDay) / span) * 100,
        y: EDGE + (1 - (point.sellIdr - min) / spread) * (100 - 2 * EDGE),
      }))
    : [];
  const line = coordinates.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const end = coordinates[coordinates.length - 1];

  const change = enough ? latest.sellIdr - first.sellIdr : 0;
  const percent = enough && first.sellIdr > 0 ? ((Math.abs(change) / first.sellIdr) * 100).toFixed(1).replace(".", locale === "id" ? "," : ".") : "0";
  const changeText = !enough
    ? ""
    : change === 0
      ? fill(t.flat, { start: label(first.date) })
      : fill(change > 0 ? t.up : t.down, { amount: formatIdr(Math.abs(change)), percent, start: label(first.date) });
  const ChangeIcon = change > 0 ? TrendingUpIcon : change < 0 ? TrendingDownIcon : MinusIcon;

  const summary = enough
    ? fill(t.summary, { karat, start: label(first.date), end: label(latest.date), min: formatIdr(min), max: formatIdr(max) })
    : t.empty;

  const chip =
    "border-input flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-semibold " +
    "peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground " +
    "peer-focus-visible:outline-ring peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2";

  return (
    <section aria-labelledby={`${ids}-title`} className="rounded-lg border bg-background p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id={`${ids}-title`} className="text-2xl font-semibold">
          {t.title}
        </h2>
        <div role="group" aria-label={t.range} className="bg-surface-muted flex gap-1 rounded-lg p-1">
          {([30, 90] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={cn(
                "min-h-10 rounded-md px-3.5 text-sm font-semibold",
                range === value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === 30 ? t.range30 : t.range90}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="sr-only">{t.karat}</legend>
        <div className="flex flex-wrap gap-1.5">
          {history.map((entry) => (
            <label key={entry.karatCode} className="relative min-w-12 flex-1 sm:flex-none">
              <input
                type="radio"
                name={`${ids}-karat`}
                value={entry.karatCode}
                checked={entry.karatCode === karat}
                onChange={() => setKarat(entry.karatCode)}
                className="peer sr-only"
              />
              <span className={cn(chip, "font-display sm:min-w-14")}>{entry.karatCode}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {enough ? (
        <>
          <div className="mt-5">
            <p className="text-muted-foreground text-sm">{fill(t.latest, { karat })}</p>
            <p className="font-display price text-[2rem] leading-10 font-semibold">{formatIdr(latest.sellIdr)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
              <ChangeIcon className="text-gold-ink size-4 shrink-0" aria-hidden="true" />
              <span className="price whitespace-normal">{changeText}</span>
            </p>
          </div>

          <figure className="mt-4">
            <div className="relative h-44 md:h-60">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                role="img"
                aria-label={summary}
                className="absolute inset-0 h-full w-full overflow-visible"
              >
                {[EDGE, 50, 100 - EDGE].map((y) => (
                  <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                <path d={`${line} L100 100 L0 100 Z`} fill="var(--brand)" opacity="0.07" />
                <path
                  d={line}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {/* The newest point, drawn in HTML so it stays round whatever the chart's shape. */}
              <span
                aria-hidden="true"
                className="bg-brand absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-background"
                style={{ left: `${end.x}%`, top: `${end.y}%` }}
              />
              <span className="price text-muted-foreground absolute left-0 bg-background/85 pr-1.5 text-xs" style={{ top: `${EDGE}%`, transform: "translateY(-115%)" }}>
                {t.highest} {formatIdr(max)}
              </span>
              <span className="price text-muted-foreground absolute left-0 bg-background/85 pr-1.5 text-xs" style={{ top: `${100 - EDGE}%`, transform: "translateY(15%)" }}>
                {t.lowest} {formatIdr(min)}
              </span>
            </div>
            <div className="text-muted-foreground price mt-1.5 flex justify-between text-xs">
              <span>{label(first.date)}</span>
              <span>{label(latest.date)}</span>
            </div>
            <figcaption className="sr-only">{summary}</figcaption>
          </figure>

          <details className="mt-3 border-t pt-1">
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">{t.tableCaption}</summary>
            <div tabIndex={0} role="region" aria-label={t.tableCaption} className="max-h-72 overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">{t.tableCaption}</caption>
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th scope="col" className="py-1.5 font-medium">
                      {t.date}
                    </th>
                    <th scope="col" className="py-1.5 text-right font-medium">
                      {karat}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...points].reverse().map((point) => (
                    <tr key={point.date} className="border-t">
                      <td className="price py-1.5">
                        {label(point.date)} {point.date.slice(0, 4)}
                      </td>
                      <td className="price py-1.5 text-right">{formatIdr(point.sellIdr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="text-muted-foreground mt-5 max-w-[60ch]">{t.empty}</p>
      )}
    </section>
  );
}
