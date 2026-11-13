import { Suspense } from "react";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";

export default function AdminHomePage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-lg bg-background" />}>
      <AdminHome />
    </Suspense>
  );
}

async function AdminHome() {
  // Guarded here as well as in the proxy and the layout: pages render independently.
  const admin = await requireAdmin();
  const t = getDictionary().admin;
  const sections = Object.entries(t.dashboard.sections);

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <p className="text-muted-foreground mt-1">
        {t.dashboard.signedInAs} {admin.email}
      </p>
      <h2 className="mt-8 text-lg font-semibold">{t.dashboard.sectionsTitle}</h2>
      <ul className="mt-3 divide-y rounded-lg border bg-background">
        {sections.map(([key, label]) => (
          <li key={key} className="flex min-h-14 items-center justify-between gap-3 px-4">
            <span className="font-semibold">{label}</span>
            <span className="text-muted-foreground text-sm">{t.dashboard.phaseNote}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
