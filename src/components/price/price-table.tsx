import { InfoIcon } from "lucide-react";
import type { Dictionary } from "@/i18n";
import type { PriceBoard } from "@/lib/data/public";
import { formatIdrPlain } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tone = "dark" | "light";

/**
 * The price board: one row per karat, sell and buyback per gram. `dark` sits on the charcoal board.
 *
 * Three columns need roughly 19rem. When the box is narrower than that, which
 * happens on a 320 px phone or when a phone's text size is set large, each karat
 * is shown as a small block with sell and buyback under it instead, so nothing
 * runs off the screen. The threshold is in rem, so it moves with the text size.
 * Only one of the two is ever displayed; the other is display:none and is
 * skipped by screen readers.
 */
export function PriceTable({ board, t, tone = "light" }: { board: PriceBoard; t: Dictionary; tone?: Tone }) {
  const dark = tone === "dark";
  const rule = dark ? "border-board-rule" : "border-border";
  const muted = dark ? "text-board-muted" : "text-muted-foreground";
  const accent = dark ? "text-board-accent" : "text-gold-ink";

  if (board.rows.length === 0) {
    return <p className={cn("py-6", muted)}>{t.price.empty}</p>;
  }

  return (
    <div className="@container">
      <ul aria-label={`${t.price.title}, ${t.price.perGram}`} className="@min-[19rem]:hidden">
        {board.rows.map((row) => (
          <li key={row.karatCode} className={cn("border-t py-2.5", rule)}>
            <p className={cn("font-display text-xl font-semibold", accent)}>{row.karatCode}</p>
            <dl className="mt-1 space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt className={cn("text-sm", muted)}>{t.price.sell}</dt>
                <dd className="price ml-auto text-lg font-semibold">{formatIdrPlain(row.sellIdr)}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt className={cn("text-sm", muted)}>{t.price.buyback}</dt>
                <dd className={cn("price ml-auto text-lg", muted)}>{formatIdrPlain(row.buybackIdr)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <table className="hidden w-full border-collapse @min-[19rem]:table">
        <caption className="sr-only">
          {t.price.title}, {t.price.perGram}
        </caption>
        <thead>
          <tr className={cn("text-[0.8125rem]", muted)}>
            <th scope="col" className="pb-2 text-left font-medium">
              {t.price.karat}
            </th>
            <th scope="col" className="pb-2 pl-3 text-right font-medium">
              {t.price.sell}
            </th>
            <th scope="col" className="pb-2 pl-3 text-right font-medium">
              {t.price.buyback}
            </th>
          </tr>
        </thead>
        <tbody>
          {board.rows.map((row) => (
            <tr key={row.karatCode} className={cn("border-t", rule)}>
              <th
                scope="row"
                className={cn("font-display h-[2.875rem] text-left text-xl font-semibold", accent)}
              >
                {row.karatCode}
              </th>
              {/* pl-3 keeps a gap between the columns even with 11-digit prices. */}
              <td className="price pl-3 text-right text-lg font-semibold">{formatIdrPlain(row.sellIdr)}</td>
              <td className={cn("price pl-3 text-right text-lg", muted)}>{formatIdrPlain(row.buybackIdr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={cn("border-t pt-2 text-xs", rule, muted)}>{t.price.unit}</p>
    </div>
  );
}

/** Stale-price and demo-data notices. Renders nothing when neither applies. */
export function PriceNotices({ board, t, tone = "light" }: { board: PriceBoard; t: Dictionary; tone?: Tone }) {
  const messages = [board.isStale ? t.price.stale : null, board.isDemo ? t.price.demo : null].filter(
    (message): message is string => message !== null,
  );
  if (messages.length === 0) return null;

  return (
    <ul className="space-y-2">
      {messages.map((message) => (
        <li
          key={message}
          className={cn(
            "flex items-start gap-2 rounded-sm px-3 py-2 text-sm leading-snug",
            tone === "dark" ? "bg-brand-deep text-board-muted" : "bg-notice text-notice-foreground",
          )}
        >
          <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </li>
      ))}
    </ul>
  );
}
