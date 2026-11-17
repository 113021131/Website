import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { ownerValue } from "@/config/owner";
import { localePath, type Dictionary } from "@/i18n";
import { LocaleSwitch } from "./locale-switch";
import type { Store } from "@/lib/data/public";
import { navLinks } from "./site-header";

const linkClass =
  "text-board-muted hover:text-board-foreground flex min-h-11 items-center underline-offset-4 hover:underline";
const headingClass = "text-board-accent font-sans text-xs font-semibold tracking-[0.18em] uppercase";

export function SiteFooter({ store, t }: { store: Store; t: Dictionary }) {
  const tagline = ownerValue(store.tagline) ?? t.footer.tagline;
  const address = [ownerValue(store.address), ownerValue(store.city), ownerValue(store.province)]
    .filter(Boolean)
    .join(", ");
  const phone = ownerValue(store.phone);
  const to = (path: string) => localePath(t.locale, path);

  return (
    <footer className="on-dark bg-board text-board-foreground mt-auto pb-[env(safe-area-inset-bottom,0px)]">
      <div className="page-gutter mx-auto grid w-full max-w-[76rem] gap-x-10 gap-y-8 py-12 sm:grid-cols-2 md:py-16 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Wordmark name={store.name} tone="dark" />
          <p className="text-board-muted mt-4 max-w-[32ch]">{tagline}</p>
          <LocaleSwitch locale={t.locale} label={t.common.switchLocale} ariaLabel={t.common.switchLocaleLabel} />
        </div>
        <nav aria-label={t.footer.explore}>
          <h2 className={headingClass}>{t.footer.explore}</h2>
          <ul className="mt-3">
            {navLinks(t).map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t.footer.legal}>
          <h2 className={headingClass}>{t.footer.legal}</h2>
          <ul className="mt-3">
            <li>
              <Link href={to("/artikel")} className={linkClass}>
                {t.nav.articles}
              </Link>
            </li>
            <li>
              <Link href={to("/privasi")} className={linkClass}>
                {t.footer.privacy}
              </Link>
            </li>
            <li>
              <Link href={to("/syarat")} className={linkClass}>
                {t.footer.terms}
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className={headingClass}>{t.footer.contact}</h2>
          <div className="text-board-muted mt-3 space-y-2">
            {address ? <p className="max-w-[34ch] break-words">{address}</p> : null}
            {phone ? <p className="price">{phone}</p> : null}
          </div>
          <Link href={to("/toko")} className={linkClass}>
            {t.footer.hours}
          </Link>
        </div>
      </div>
      <div className="border-board-rule border-t">
        <p className="page-gutter text-board-muted mx-auto w-full max-w-[76rem] py-5 text-sm">{t.footer.disclaimer}</p>
      </div>
    </footer>
  );
}
