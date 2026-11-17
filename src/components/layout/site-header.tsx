import { Suspense } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { localePath, type Dictionary } from "@/i18n";
import type { PriceBoard } from "@/lib/data/public";
import { formatIdr } from "@/lib/format";
import { MobileMenu, type NavLink } from "./mobile-menu";

export function navLinks(t: Dictionary): NavLink[] {
  const to = (path: string) => localePath(t.locale, path);
  return [
    { href: to("/harga-emas"), label: t.nav.prices },
    { href: to("/katalog"), label: t.nav.catalog },
    { href: to("/kalkulator"), label: t.nav.calculator },
    { href: to("/layanan"), label: t.nav.services },
    { href: to("/kepercayaan"), label: t.nav.trust },
    { href: to("/toko"), label: t.nav.store },
  ];
}

/**
 * Two rows on every public page: a slim charcoal strip with today's 24K price
 * (the number a gold shop's customer looks for first), then the ivory bar with
 * the wordmark and the navigation.
 */
export function SiteHeader({ brand, board, t }: { brand: string; board: PriceBoard; t: Dictionary }) {
  const links = navLinks(t);
  const top = board.rows.find((row) => row.karatCode === "24K") ?? board.rows[0];

  return (
    <header className="border-b bg-background">
      {top ? (
        <div className="on-dark bg-board text-board-foreground">
          <Link
            href={localePath(t.locale, "/harga-emas")}
            className="page-gutter mx-auto flex min-h-9 w-full max-w-[76rem] flex-wrap items-center justify-center gap-x-2 py-1.5 text-center text-[0.8125rem] underline-offset-4 hover:underline"
          >
            <span className="text-board-muted">
              {top.karatCode === "24K" ? t.price.todayShort : `${t.price.title} ${top.karatCode}`}
            </span>
            <span className="price text-board-accent font-semibold">
              {formatIdr(top.sellIdr)}
              {t.price.perGramShort}
            </span>
            {board.status !== "current" ? (
              <span className="text-board-muted">· {t.price.status[board.status]}</span>
            ) : null}
          </Link>
        </div>
      ) : null}
      <div className="page-gutter relative mx-auto flex min-h-16 w-full max-w-[76rem] flex-wrap items-center justify-between gap-x-6 md:min-h-[4.5rem]">
        <Link href={localePath(t.locale, "/")} className="-ml-1 flex min-h-12 min-w-0 items-center rounded-md px-1">
          <Wordmark name={brand} />
        </Link>
        <nav aria-label={t.common.menu} className="hidden md:block">
          <ul className="flex items-center gap-1 lg:gap-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-gold-ink flex min-h-11 items-center px-2 text-[0.8125rem] font-semibold tracking-[0.1em] uppercase"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* usePathname needs a boundary on routes whose params are not known at build time. */}
        <Suspense fallback={<span className="size-12 md:hidden" />}>
          <MobileMenu links={links} openLabel={t.common.menu} closeLabel={t.common.closeMenu} />
        </Suspense>
      </div>
    </header>
  );
}
