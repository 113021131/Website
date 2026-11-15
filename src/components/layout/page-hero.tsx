import type { ReactNode } from "react";
import { container } from "@/components/ui/styles";

/**
 * The title band at the top of every public page: the page heading on the same
 * maroon surface as the site header, so each page opens the way the home page
 * and the price board do. `children` is for a short extra line under the lead
 * (an update time, a notice).
 */
export function PageHero({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="on-dark bg-board text-board-foreground">
      <div className={`${container} pt-3 pb-8 md:pt-12 md:pb-12`}>
        <h1 className="max-w-[22ch] text-[1.875rem] font-semibold break-words md:text-[2.75rem]">{title}</h1>
        {lead ? <p className="text-board-muted mt-3 max-w-[38rem] md:text-lg">{lead}</p> : null}
        {children}
      </div>
    </div>
  );
}

/** Shared panel looks, so every page groups its content the same way. */
export const panel = "rounded-lg border bg-background p-4 md:p-6";
export const slipPanel = "border-t-brand rounded-sm border border-t-4 bg-background p-4 md:p-6";
