"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonSecondary, fieldInput } from "@/components/ui/styles";
import { fill, type Dictionary } from "@/i18n";
import { deleteLead, setLeadStatus } from "./actions";

export type ListedLead = {
  id: number;
  name: string;
  phone: string;
  status: "new" | "contacted" | "done";
  productName: string | null;
  productSlug: string | null;
  preferredDate: string | null;
  note: string | null;
  receivedLabel: string;
  whatsappUrl: string | null;
};

export function LeadList({ leads, canDelete, t }: { leads: ListedLead[]; canDelete: boolean; t: Dictionary["admin"]["leads"] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<number | null>(null);

  function run(action: () => Promise<{ ok: boolean }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        setConfirming(null);
        router.refresh();
      } else {
        toast.error(t.failed);
      }
    });
  }

  return (
    <ul className="mt-4 space-y-3">
      {leads.map((lead) => (
        <li key={lead.id} className="rounded-lg border bg-background p-4">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold break-words">{lead.name}</p>
              <a href={`tel:${lead.phone}`} className="price text-brand inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline">
                {lead.phone}
              </a>
            </div>
            <select
              aria-label={fill(t.statusLabel, { name: lead.name })}
              value={lead.status}
              disabled={pending}
              onChange={(event) => run(() => setLeadStatus(lead.id, event.target.value), t.statusSaved)}
              className={`${fieldInput} mt-0 w-auto`}
            >
              {Object.entries(t.status).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{t.product}</dt>
            <dd className="min-w-0 break-words">
              {lead.productSlug && lead.productName ? (
                <a href={`/katalog/${lead.productSlug}`} className="underline underline-offset-4">
                  {lead.productName}
                </a>
              ) : (
                t.productRemoved
              )}
            </dd>
            <dt className="text-muted-foreground">{t.date}</dt>
            <dd className="price">{lead.preferredDate ?? t.dateUnset}</dd>
            {lead.note ? (
              <>
                <dt className="text-muted-foreground">{t.note}</dt>
                <dd className="break-words whitespace-pre-line">{lead.note}</dd>
              </>
            ) : null}
          </dl>
          <p className="text-muted-foreground price mt-2 text-xs">{fill(t.received, { when: lead.receivedLabel })}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {lead.whatsappUrl ? (
              <a href={lead.whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonSecondary}>
                {t.chat}
              </a>
            ) : null}
            {canDelete && confirming !== lead.id ? (
              <button type="button" onClick={() => setConfirming(lead.id)} className={`${buttonSecondary} text-destructive border-destructive`}>
                {t.delete}
              </button>
            ) : null}
          </div>
          {confirming === lead.id ? (
            <div
              role="alertdialog"
              aria-label={t.delete}
              tabIndex={-1}
              ref={(element) => element?.focus()}
              className="bg-notice text-notice-foreground mt-3 rounded-lg p-3"
            >
              <p>{fill(t.deleteConfirm, { name: lead.name })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={pending} onClick={() => run(() => deleteLead(lead.id), t.deleted)} className={`${buttonSecondary} bg-destructive border-destructive text-white hover:bg-destructive`}>
                  {t.deleteYes}
                </button>
                <button type="button" disabled={pending} onClick={() => setConfirming(null)} className={buttonSecondary}>
                  {t.deleteCancel}
                </button>
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
