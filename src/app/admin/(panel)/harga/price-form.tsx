"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonPrimary, buttonSecondary, fieldInput, fieldLabel } from "@/components/ui/styles";
import type { Dictionary } from "@/i18n";
import { formatIdrPlain } from "@/lib/format";
import { savePrices } from "./actions";

export type PriceFormRow = { karatId: number; karatCode: string; sellIdr: number | null; buybackIdr: number | null };

type Draft = { sell: string; buyback: string };

/** "2.000.000" as typed → digits only. */
function digits(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 10);
}

function show(value: string): string {
  return value === "" ? "" : formatIdrPlain(Number(value));
}

export function PriceForm({ rows, t }: { rows: PriceFormRow[]; t: Dictionary["admin"]["prices"] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<number, Draft>>(() =>
    Object.fromEntries(
      rows.map((row) => [row.karatId, { sell: row.sellIdr?.toString() ?? "", buyback: row.buybackIdr?.toString() ?? "" }]),
    ),
  );
  const [percent, setPercent] = useState("");
  const [warnings, setWarnings] = useState<string[] | null>(null);
  const [error, setError] = useState("");

  function update(karatId: number, field: keyof Draft, value: string) {
    setWarnings(null);
    setDrafts((previous) => ({ ...previous, [karatId]: { ...previous[karatId], [field]: digits(value) } }));
  }

  function applyPercent() {
    const value = Number(percent.trim().replace(",", "."));
    if (percent.trim() === "" || !Number.isFinite(value) || value < -50 || value > 50) {
      setError(t.adjustError);
      return;
    }
    setError("");
    setWarnings(null);
    // Rounded to the nearest Rp 1.000 so the board keeps clean numbers.
    const adjust = (text: string) =>
      text === "" ? "" : String(Math.max(0, Math.round((Number(text) * (1 + value / 100)) / 1000) * 1000));
    setDrafts((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([id, draft]) => [id, { sell: adjust(draft.sell), buyback: adjust(draft.buyback) }]),
      ),
    );
  }

  function submit(confirmed: boolean) {
    const payload = rows.map((row) => ({
      karatId: row.karatId,
      sellIdr: Number(drafts[row.karatId].sell),
      buybackIdr: Number(drafts[row.karatId].buyback),
    }));
    if (payload.some((row, index) => drafts[rows[index].karatId].buyback === "" || row.sellIdr <= 0)) {
      setError(t.invalid);
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await savePrices({ rows: payload, confirmed });
      if (result.status === "confirm") {
        setWarnings(result.warnings);
      } else if (result.status === "saved") {
        setWarnings(null);
        toast.success(result.message);
        router.refresh();
      } else if (result.status === "unchanged") {
        setWarnings(null);
        toast.info(result.message);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit(false);
      }}
    >
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.karatId} className="rounded-lg border bg-background p-3">
            <fieldset className="grid grid-cols-2 gap-3">
              <legend className="font-display float-left col-span-2 mb-1 w-full text-xl font-semibold">{row.karatCode}</legend>
              <div>
                <label htmlFor={`sell-${row.karatId}`} className={fieldLabel}>
                  {t.sell}
                </label>
                <input
                  id={`sell-${row.karatId}`}
                  name={`sell-${row.karatCode}`}
                  inputMode="numeric"
                  autoComplete="off"
                  value={show(drafts[row.karatId].sell)}
                  onChange={(event) => update(row.karatId, "sell", event.target.value)}
                  className={`${fieldInput} price text-lg font-semibold`}
                />
              </div>
              <div>
                <label htmlFor={`buyback-${row.karatId}`} className={fieldLabel}>
                  {t.buyback}
                </label>
                <input
                  id={`buyback-${row.karatId}`}
                  name={`buyback-${row.karatCode}`}
                  inputMode="numeric"
                  autoComplete="off"
                  value={show(drafts[row.karatId].buyback)}
                  onChange={(event) => update(row.karatId, "buyback", event.target.value)}
                  className={`${fieldInput} price text-lg font-semibold`}
                />
              </div>
            </fieldset>
          </li>
        ))}
      </ul>

      <details className="mt-4 rounded-lg border bg-background">
        <summary className="flex min-h-12 cursor-pointer items-center px-3 font-semibold">{t.adjustTitle}</summary>
        <div className="flex flex-wrap items-end gap-3 border-t p-3">
          <div className="min-w-0 flex-1 basis-40">
            <label htmlFor="adjust-percent" className={fieldLabel}>
              {t.adjustLabel}
            </label>
            <input
              id="adjust-percent"
              name="percent"
              inputMode="decimal"
              autoComplete="off"
              value={percent}
              onChange={(event) => setPercent(event.target.value)}
              className={fieldInput}
            />
          </div>
          <button type="button" onClick={applyPercent} className={buttonSecondary}>
            {t.adjustApply}
          </button>
        </div>
      </details>

      <p role="alert" className="text-destructive mt-3 min-h-6 text-sm">
        {error}
      </p>

      {warnings ? (
        <div role="alertdialog" aria-labelledby="confirm-title" className="bg-notice text-notice-foreground rounded-lg p-4">
          <h2 id="confirm-title" className="text-lg font-semibold">
            {t.confirmTitle}
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={pending} onClick={() => submit(true)} className={buttonPrimary}>
              {pending ? t.saving : t.confirm}
            </button>
            <button type="button" disabled={pending} onClick={() => setWarnings(null)} className={buttonSecondary}>
              {t.cancel}
            </button>
          </div>
        </div>
      ) : (
        <button type="submit" disabled={pending} className={`${buttonPrimary} w-full sm:w-auto`}>
          {pending ? t.saving : t.save}
        </button>
      )}
    </form>
  );
}
