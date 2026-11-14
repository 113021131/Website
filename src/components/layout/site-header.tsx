import { Suspense } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import type { Dictionary } from "@/i18n";
import { MobileMenu, type NavLink } from "./mobile-menu";

export function navLinks(t: Dictionary): NavLink[] {
  return [
    { href: "/harga-emas", label: t.nav.prices },
    { href: "/katalog", label: t.nav.catalog },
    { href: "/layanan", label: t.nav.services },
    { href: "/kepercayaan", label: t.nav.trust },
    { href: "/toko", label: t.nav.store },
  ];
}

/** Maroon brand bar on every public page; the home hero continues the same surface below it. */
export function SiteHeader({ brand, t }: { brand: string; t: Dictionary }) {
  const links = navLinks(t);
  return (
    <header className="on-dark bg-board text-board-foreground">
      <div className="page-gutter relative mx-auto flex h-14 w-full max-w-[72rem] items-center justify-between gap-4">
        <Link href="/" className="-ml-1 flex min-h-12 items-center rounded-md px-1">
          <Wordmark name={brand} tone="dark" />
        </Link>
        <nav aria-label={t.common.menu} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:bg-brand-hover flex min-h-11 items-center rounded-md px-3 text-[0.9375rem] font-semibold"
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
