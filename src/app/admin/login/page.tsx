import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { siteConfig } from "@/config/owner";
import { getDictionary } from "@/i18n";
import { LoginForm, LoginReason } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  const t = getDictionary().admin.login;

  return (
    <main id="isi" className="bg-surface-muted page-gutter flex flex-1 items-start justify-center py-10 md:items-center">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6">
        <Wordmark name={siteConfig.name} />
        <h1 className="mt-6 text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground mt-2">{t.lead}</p>
        <Suspense fallback={null}>
          <LoginReason t={t} />
        </Suspense>
        <LoginForm t={t} />
      </div>
    </main>
  );
}
