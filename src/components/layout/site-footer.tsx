import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { ownerValue } from "@/config/owner";
import type { Dictionary } from "@/i18n";
import type { Store } from "@/lib/data/public";
import { navLinks } from "./site-header";

export function SiteFooter({ store, t }: { store: Store; t: Dictionary }) {
  const tagline = ownerValue(store.tagline) ?? t.footer.tagline;
  const address = [ownerValue(store.address), ownerValue(store.city), ownerValue(store.province)]
    .filter(Boolean)
    .join(", ");

  return (
    <footer className="bg-surface-muted mt-auto border-t pb-[env(safe-area-inset-bottom,0px)]">
      <div className="page-gutter mx-auto grid w-full max-w-[72rem] gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark name={store.name} />
          <p className="text-muted-foreground mt-3 max-w-[32ch]">{tagline}</p>
          {address ? <p className="mt-3 max-w-[40ch] break-words">{address}</p> : null}
        </div>
        <nav aria-label={t.footer.explore}>
          <h2 className="font-sans text-sm font-semibold">{t.footer.explore}</h2>
          <ul className="mt-2">
            {navLinks(t).map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="flex min-h-11 items-center underline-offset-4 hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t.footer.legal}>
          <h2 className="font-sans text-sm font-semibold">{t.footer.legal}</h2>
          <ul className="mt-2">
            <li>
              <Link href="/privasi" className="flex min-h-11 items-center underline-offset-4 hover:underline">
                {t.footer.privacy}
              </Link>
            </li>
            <li>
              <Link href="/syarat" className="flex min-h-11 items-center underline-offset-4 hover:underline">
                {t.footer.terms}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
