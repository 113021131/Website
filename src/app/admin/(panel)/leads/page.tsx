import type { Metadata } from "next";
import { Suspense } from "react";
import { buttonSecondary } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { LeadList, type ListedLead } from "./lead-list";

const t = getDictionary().admin.leads;

export const metadata: Metadata = { title: t.title };

export default function AdminLeadsPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        {/* A file download must be a normal request, not a client-side navigation.
            The route checks the admin session itself. */}
        <a href="/admin/leads/export" download className={buttonSecondary}>
          {t.export}
        </a>
      </div>
      <p className="text-muted-foreground mt-1">{t.lead}</p>
      <Suspense fallback={<div className="mt-5 h-64 rounded-lg bg-background" />}>
        <Leads />
      </Suspense>
    </>
  );
}

async function Leads() {
  const admin = await requireAdmin();
  const supabase = await createServerSupabase();
  const [{ data }, { data: settings }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, phone, status, preferred_date, note, created_at, products(name, slug)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("site_settings").select("timezone").eq("id", 1).single(),
  ]);

  const leads: ListedLead[] = (data ?? []).map((lead) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    status: lead.status,
    productName: lead.products?.name ?? null,
    productSlug: lead.products?.slug ?? null,
    preferredDate: lead.preferred_date,
    note: lead.note,
    receivedLabel: formatDateTime(lead.created_at, settings?.timezone ?? "Asia/Jakarta"),
    // Opens a chat with the customer's own number.
    whatsappUrl: buildWhatsAppUrl(lead.phone, `Halo ${lead.name},`),
  }));

  if (leads.length === 0) return <p className="text-muted-foreground mt-6">{t.empty}</p>;
  return <LeadList leads={leads} canDelete={admin.role === "owner"} t={t} />;
}
