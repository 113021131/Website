import { Suspense } from "react";
import Link from "next/link";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";

export default function AdminHomePage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<div className="h-64 rounded-lg bg-background" />}>
      <AdminHome searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminHome({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  // Guarded here as well as in the proxy: every admin page checks for itself.
  const admin = await requireAdmin();
  const t = getDictionary().admin;
  const reason = (await searchParams).alasan;

  const cards = [
    { href: "/admin/harga", ...t.dashboard.cards.harga, show: true },
    { href: "/admin/produk", ...t.dashboard.cards.produk, show: true },
    { href: "/admin/toko", ...t.dashboard.cards.toko, show: admin.role === "owner" },
  ].filter((card) => card.show);

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <p className="text-muted-foreground mt-1 break-words">
        {t.dashboard.signedInAs} {admin.email} ({t.dashboard.roles[admin.role]})
      </p>
      {reason === "khusus-pemilik" ? (
        <p role="alert" className="bg-notice text-notice-foreground mt-4 rounded-sm px-3 py-2">
          {t.dashboard.ownerOnly}
        </p>
      ) : null}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            <Link href={card.href} className="hover:border-brand flex h-full flex-col rounded-lg border bg-background p-4">
              <span className="font-display text-lg font-semibold">{card.title}</span>
              <span className="text-muted-foreground mt-1">{card.body}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link href="/" className="text-brand inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline">
          {t.dashboard.viewSite}
        </Link>
      </p>
    </>
  );
}
