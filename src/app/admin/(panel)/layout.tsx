import type { Metadata } from "next";
import { Suspense } from "react";
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
  return (
    <div className="bg-surface-muted flex flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="page-gutter mx-auto flex min-h-14 w-full max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
          <Wordmark name={siteConfig.name} />
          <Suspense fallback={<span className="bg-surface-muted h-5 w-40 rounded-sm" />}>
            <AdminIdentityBar />
          </Suspense>
        </div>
      </header>
      <main id="isi" className="page-gutter mx-auto w-full max-w-3xl flex-1 py-6">{children}</main>
    </div>
  );
}

async function AdminIdentityBar() {
  const admin = await requireAdmin();
  const t = getDictionary().admin.dashboard;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground min-w-0 truncate">
        {admin.email} ({t.roles[admin.role]})
      </span>
      <form action={signOut}>
        <button type="submit" className="hover:bg-surface-muted h-11 rounded-md border px-3 font-semibold">
          {t.signOut}
        </button>
      </form>
    </div>
  );
}
