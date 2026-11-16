"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "lucide-react";

export type NavLink = { href: string; label: string };

/** Phone navigation: a button that opens a panel of links. Closes on navigation and on Escape. */
export function MobileMenu({ links, openLabel, closeLabel }: { links: NavLink[]; openLabel: string; closeLabel: string }) {
  const [openAt, setOpenAt] = useState<string | null>(null);
  const pathname = usePathname();
  const panelId = useId();
  // The panel is open only for the page it was opened on, so navigating closes it.
  const open = openAt === pathname;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenAt(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpenAt(open ? null : pathname)}
        className="hover:bg-brand-hover -mr-2 inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-sm font-semibold"
      >
        {open ? <XIcon className="size-5" aria-hidden="true" /> : <MenuIcon className="size-5" aria-hidden="true" />}
        {open ? closeLabel : openLabel}
      </button>
      {open ? (
        <nav
          id={panelId}
          aria-label={openLabel}
          className="text-foreground absolute inset-x-4 top-full z-40 overscroll-contain rounded-md border bg-background p-2 shadow-lg"
        >
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
                  onClick={() => setOpenAt(null)}
                  className="hover:bg-surface-muted aria-[current=page]:text-brand flex min-h-12 items-center rounded-md px-3 font-semibold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
