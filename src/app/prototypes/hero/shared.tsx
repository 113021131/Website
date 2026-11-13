"use client";

/**
 * Prototype-only building blocks shared by the three hero variants: the page
 * around the hero (header, the next section) and the WhatsApp action.
 * Nothing in production imports from this folder.
 */
import { useId, useState } from "react";
import { InfoIcon, MenuIcon, MessageCircleIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Wordmark } from "@/components/brand/wordmark";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { HeroData } from "./types";

export const buttonBase =
  "inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-base font-semibold " +
  "transition-transform duration-150 ease-out-strong active:scale-[0.98] select-none";

export function WhatsAppButton({
  number,
  message,
  label,
  missingLabel,
  variant = "solid",
  className,
}: {
  number: string | null;
  message: string;
  label: string;
  missingLabel: string;
  variant?: "solid" | "outline" | "outline-on-dark";
  className?: string;
}) {
  const url = buildWhatsAppUrl(number, message);
  const classes = cn(
    buttonBase,
    variant === "solid" && "bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp-hover",
    variant === "outline" && "border border-whatsapp text-whatsapp hover:bg-surface-muted",
    variant === "outline-on-dark" && "border border-board-accent text-board-foreground hover:bg-brand-hover",
    className,
  );
  const content = (
    <>
      <MessageCircleIcon className="size-5" aria-hidden="true" />
      {label}
    </>
  );

  if (!url) {
    // The shop's number is still a TODO_OWNER placeholder: say so instead of linking nowhere.
    return (
      <button type="button" className={classes} onClick={() => toast.info(missingLabel)}>
        {content}
      </button>
    );
  }
  return (
    <a className={classes} href={url} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  );
}

export function SiteHeader({ brand, t, tone = "light" }: { brand: string; t: Dictionary; tone?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const links = Object.values(t.nav);

  return (
    <header className="page-gutter relative mx-auto flex h-14 w-full max-w-[72rem] items-center justify-between">
      <Wordmark name={brand} tone={tone} />
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "-mr-2 inline-flex h-12 items-center gap-2 rounded-md px-2 text-sm font-semibold",
          tone === "dark" ? "hover:bg-brand-hover" : "hover:bg-surface-muted",
        )}
      >
        {open ? <XIcon className="size-5" aria-hidden="true" /> : <MenuIcon className="size-5" aria-hidden="true" />}
        {open ? t.common.closeMenu : t.common.menu}
      </button>
      {open ? (
        <nav
          id={panelId}
          aria-label={t.common.menu}
          className="text-foreground absolute inset-x-4 top-14 z-40 rounded-md border bg-background p-2 shadow-lg"
        >
          <ul>
            {links.map((label) => (
              <li key={label} className="flex h-12 items-center justify-between px-3">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground text-xs">{t.common.comingSoon}</span>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export function PriceNotices({ data, tone = "light" }: { data: HeroData; tone?: "light" | "dark" }) {
  const messages = [
    data.rows.length === 0 ? data.t.price.empty : null,
    data.isStale ? data.t.price.stale : null,
    data.isDemo ? data.t.price.demo : null,
  ].filter((message): message is string => message !== null);

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

export type JewelKind = "cincin" | "kalung" | "gelang" | "anting";

/** Neutral line drawings standing in for product photos. Not real stock. */
export function JewelArt({ kind, className }: { kind: JewelKind; className?: string }) {
  const common = { fill: "none", stroke: "var(--gold-ink)", strokeWidth: 2.5, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      {kind === "cincin" ? (
        <>
          <circle cx="40" cy="48" r="20" {...common} />
          <polygon points="40,14 31,24 40,34 49,24" {...common} strokeLinejoin="round" />
        </>
      ) : null}
      {kind === "kalung" ? (
        <>
          <path d="M14 14 Q40 74 66 14" {...common} />
          <circle cx="40" cy="51" r="6" {...common} />
        </>
      ) : null}
      {kind === "gelang" ? (
        <>
          <ellipse cx="40" cy="40" rx="27" ry="17" {...common} />
          <ellipse cx="40" cy="40" rx="19" ry="10" {...common} strokeWidth={1.5} />
        </>
      ) : null}
      {kind === "anting" ? (
        <>
          <path d="M27 14 v14" {...common} />
          <circle cx="27" cy="40" r="11" {...common} />
          <path d="M53 14 v14" {...common} />
          <circle cx="53" cy="40" r="11" {...common} />
        </>
      ) : null}
    </svg>
  );
}

/** The section that follows the hero on the real page, so the fold can be judged. */
export function CategorySection({ t }: { t: Dictionary }) {
  const items = Object.entries(t.home.categories.items) as [JewelKind, string][];
  return (
    <section id="kategori" className="page-gutter mx-auto w-full max-w-[72rem] scroll-mt-4 py-10">
      <h2 className="text-2xl font-semibold">{t.home.categories.title}</h2>
      <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map(([kind, label]) => (
          <li key={kind} className="bg-surface-muted flex flex-col items-center gap-2 rounded-lg px-3 py-5">
            <JewelArt kind={kind} className="size-16" />
            <span className="font-semibold">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
