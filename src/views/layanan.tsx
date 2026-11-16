import type { Metadata } from "next";
import type { ViewProps } from "./types";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { container } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary } from "@/i18n";
import { getPrimaryStore } from "@/lib/data/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = ViewProps;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return pageMetadata(t, "/layanan", t.services.metaTitle, t.services.metaDescription);
}

export default async function ServicesPage({ params }: Props) {
  const t = getDictionary((await params).locale);
  const s = t.services;
  const store = await getPrimaryStore();
  const whatsapp = ownerValue(store.whatsapp);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.common.home, path: "/" },
          { name: t.nav.services, path: "/layanan" },
        ], t.locale)}
      />
      <PageHero title={s.title} lead={s.lead} />
      <div className={`${container} py-8 md:py-12`}>

      <ul className="grid gap-5 md:grid-cols-2">
        {s.items.map((item) => (
          // Padding is capped at 5% of the screen width so the card stays on screen on a
          // small phone with very large text (the same rule as the buttons).
          <li key={item.key} id={item.key} className="border-t-gold flex scroll-mt-4 flex-col rounded-sm border border-t-4 bg-background p-[min(1.25rem,5vw)] md:p-6">
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 mb-5 max-w-[55ch]">{item.body}</p>
            <WhatsAppButton
              number={whatsapp}
              message={fill(t.whatsappMessage.service, { brand: store.name, service: item.title.toLowerCase() })}
              label={s.ask}
              missingLabel={t.cta.whatsappMissing}
              placement={`service_${item.key}`}
              variant="outline"
              className="mt-auto self-start"
            />
          </li>
        ))}
      </ul>
      </div>
    </>
  );
}
