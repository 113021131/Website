import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { siteConfig } from "@/config/owner";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const t = getDictionary().admin;
  const links = [
    { href: "/admin/harga", label: t.nav.harga },
    { href: "/admin/produk", label: t.nav.produk },
    { href: "/admin/leads", label: t.nav.leads },
    { href: "/admin/artikel", label: t.nav.artikel },
    { href: "/admin/toko", label: t.nav.toko },
  ];

  return (
    <div className="bg-surface-muted flex flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="page-gutter mx-auto flex min-h-14 w-full max-w-3xl flex-wrap items-center justify-between gap-x-4 py-1">
          <Link href="/admin" className="flex min-h-12 items-center">
            <Wordmark name={siteConfig.name} />
          </Link>
          <Suspense fallback={<span className="bg-surface-muted h-11 w-24 rounded-md" />}>
            <AdminIdentityBar />
          </Suspense>
        </div>
        <nav aria-label={t.title} className="page-gutter mx-auto w-full max-w-3xl">
          <ul className="-mx-2 flex gap-1 overflow-x-auto">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:bg-surface-muted flex min-h-12 items-center rounded-md px-3 font-semibold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="isi" className="page-gutter mx-auto w-full max-w-3xl flex-1 py-6">
        {children}
      </main>
    </div>
  );
}

async function AdminIdentityBar() {
  await requireAdmin();
  const t = getDictionary().admin.dashboard;
  return (
    <form action={signOut}>
      <button type="submit" className="hover:bg-surface-muted min-h-11 rounded-md border px-3 text-sm font-semibold">
        {t.signOut}
      </button>
    </form>
  );
}
