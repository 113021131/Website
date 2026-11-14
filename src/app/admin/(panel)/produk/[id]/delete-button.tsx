"use client";

import { useState, useTransition } from "react";
import { buttonSecondary } from "@/components/ui/styles";
import type { Dictionary } from "@/i18n";
import { deleteProduct } from "../actions";

/** Deleting is permanent, so it takes two deliberate taps. */
export function DeleteProductButton({ productId, t }: { productId: number; t: Dictionary["admin"]["products"] }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={`${buttonSecondary} text-destructive border-destructive`}>
        {t.delete}
      </button>
    );
  }
  return (
    <div role="alertdialog" aria-label={t.delete} className="bg-notice text-notice-foreground rounded-lg p-4">
      <p>{t.deleteConfirm}</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => deleteProduct(productId))}
          className={`${buttonSecondary} bg-destructive border-destructive text-white hover:bg-destructive`}
        >
          {t.delete}
        </button>
        <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={buttonSecondary}>
          {t.deleteCancel}
        </button>
      </div>
    </div>
  );
}
