"use client";

import { useId, useState } from "react";
import { fieldInput, fieldLabel } from "@/components/ui/styles";
import { fill, type Dictionary, type Locale } from "@/i18n";
import type { PriceHistory } from "@/lib/data/content";
import { formatIdr } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTHS: Record<Locale, string[]> = {
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const W = 320;
const H = 150;
const PAD = { top: 12, right: 10, bottom: 22, left: 10 };

function dayNumber(date: string): number {
  return Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

/**
 * Selling-price history for one karat as a plain SVG line. No chart library:
 * it is a few hundred bytes and never blocks the page. The same data is given
 * as a sentence and a table, so the chart is not the only way to read it.
 */
export function PriceHistoryChart({ history, locale, t }: { history: PriceHistory; locale: Locale; t: Dictionary["chart"] }) {
  const ids = useId();
  const [karat, setKarat] = useState(history.find((series) => series.karatCode === "24K")?.karatCode ?? history[0]?.karatCode ?? "");
  const [range, setRange] = useState<30 | 90>(30);

  const series = history.find((entry) => entry.karatCode === karat);
  const all = series?.points ?? [];
  // The window ends at the newest data point, so server and browser agree.
  const last = all.length > 0 ? dayNumber(all[all.length - 1].date) : 0;
  const points = all.filter((point) => dayNumber(point.date) > last - range);

  const label = (date: string) => `${Number(date.slice(8, 10))} ${MONTHS[locale][Number(date.slice(5, 7)) - 1]}`;
  const enough = points.length >= 2;

  let path = "";
  let coordinates: { x: number; y: number }[] = [];
  let min = 0;
  let max = 0;
  if (enough) {
    const first = dayNumber(points[0].date);
    const span = Math.max(1, last - first);
    min = Math.min(...points.map((point) => point.sellIdr));
    max = Math.max(...points.map((point) => point.sellIdr));
    const spread = Math.max(1, max - min);
    coordinates = points.map((point) => ({
      x: PAD.left + ((dayNumber(point.date) - first) / span) * (W - PAD.left - PAD.right),
      y: PAD.top + (1 - (point.sellIdr - min) / spread) * (H - PAD.top - PAD.bottom),
    }));
    path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  }

  const summary = enough
    ? fill(t.summary, {
        karat,
        start: label(points[0].date),
        end: label(points[points.length - 1].date),
        min: formatIdr(min),
        max: formatIdr(max),
      })
    : t.empty;

  return (
    <section aria-labelledby={`${ids}-title`}>
      <h2 id={`${ids}-title`} className="text-2xl font-semibold">
        {t.title}
      </h2>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 basis-28">
          <label htmlFor={`${ids}-karat`} className={fieldLabel}>
            {t.karat}
          </label>
          <select id={`${ids}-karat`} name="chart-karat" value={karat} onChange={(event) => setKarat(event.target.value)} className={fieldInput}>
            {history.map((entry) => (
              <option key={entry.karatCode} value={entry.karatCode}>
                {entry.karatCode}
              </option>
            ))}
          </select>
        </div>
        <div role="group" aria-label={t.title} className="flex gap-1.5">
          {([30, 90] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={cn(
                "border-input min-h-12 rounded-md border px-4 font-semibold",
                range === value && "border-brand bg-brand text-brand-foreground",
              )}
            >
              {value === 30 ? t.range30 : t.range90}
            </button>
          ))}
        </div>
      </div>

      {enough ? (
        <figure className="mt-4">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="h-auto w-full max-w-2xl">
            <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--border)" />
            <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {coordinates.length <= 31
              ? coordinates.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="2.5" fill="var(--brand)" />)
              : null}
            <text x={PAD.left} y={H - 6} fontSize="10" fill="var(--muted-foreground)">
              {label(points[0].date)}
            </text>
            <text x={W - PAD.right} y={H - 6} fontSize="10" textAnchor="end" fill="var(--muted-foreground)">
              {label(points[points.length - 1].date)}
            </text>
          </svg>
          <figcaption className="text-muted-foreground mt-2 max-w-[60ch] text-sm">{summary}</figcaption>
        </figure>
      ) : (
        <p className="text-muted-foreground mt-4 max-w-[60ch]">{t.empty}</p>
      )}

      {enough ? (
        <details className="mt-3 max-w-md">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">{t.tableCaption}</summary>
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
        </details>
      ) : null}
    </section>
  );
}
