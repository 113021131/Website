"use client";

import { Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { buttonSecondary } from "@/components/ui/styles";

/** Opens the phone's share sheet; falls back to copying the link. */
export function ShareButton({ title, label, copiedLabel }: { title: string; label: string; copiedLabel: string }) {
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(copiedLabel);
    } catch {
      // The visitor closed the share sheet; nothing to report.
    }
  }

  return (
    <button type="button" onClick={share} className={buttonSecondary}>
      <Share2Icon className="size-5" aria-hidden="true" />
      {label}
    </button>
  );
}
