import type { Metadata } from "next";
import type { ViewProps } from "./types";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonSecondary, container } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary } from "@/i18n";
import { getPrimaryStore } from "@/lib/data/public";
import { breadcrumbJsonLd, parseOpeningHours, storeJsonLd, pageMetadata } from "@/lib/seo";

type Props = ViewProps;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return pageMetadata(t, "/toko", t.store.metaTitle, t.store.metaDescription);
}

export default async function StorePage({ params }: Props) {
  const t = getDictionary((await params).locale);
  const s = t.store;
  const store = await getPrimaryStore();
  const address = ownerValue(store.address);
  const locality = [ownerValue(store.city), ownerValue(store.province), ownerValue(store.postal_code)].filter(Boolean).join(", ");
  const landmarks = ownerValue(store.landmarks);
  const mapsUrl = ownerValue(store.maps_url);
  const phone = ownerValue(store.phone);
  const whatsapp = ownerValue(store.whatsapp);
  const reviewUrl = ownerValue(store.google_review_url);
  const hours = parseOpeningHours(store.opening_hours);

  return (
    <div className={`${container} py-8 md:py-12`}>
      <JsonLd data={storeJsonLd(store, t.locale)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.common.home, path: "/" },
          { name: t.nav.store, path: "/toko" },
        ], t.locale)}
      />
      <h1 className="text-[1.875rem] font-semibold md:text-[2.5rem]">{s.title}</h1>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="store-address">
          <h2 id="store-address" className="text-xl font-semibold">
            {s.address}
          </h2>
          {address ? (
            <address className="mt-2 max-w-[45ch] break-words not-italic">
              {address}
              {locality ? <span className="block">{locality}</span> : null}
            </address>
          ) : (
            <p className="text-muted-foreground mt-2">{s.pending}</p>
          )}
          {landmarks ? (
            <p className="mt-3 max-w-[45ch] break-words">
              <span className="font-semibold">{s.landmarks}: </span>
              {landmarks}
            </p>
          ) : null}

          <h2 className="mt-8 text-xl font-semibold">{s.contact}</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <WhatsAppButton
              number={whatsapp}
              message={fill(t.whatsappMessage.general, { brand: store.name })}
              label={t.cta.whatsapp}
              missingLabel={t.cta.whatsappMissing}
              placement="store_page"
            />
            {phone ? (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={buttonSecondary}>
                {t.cta.call}
              </a>
            ) : null}
            {mapsUrl ? (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={buttonSecondary}>
                {t.cta.directions}
              </a>
            ) : null}
            {reviewUrl ? (
              <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className={buttonSecondary}>
                {t.cta.reviews}
              </a>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="store-hours">
          <h2 id="store-hours" className="text-xl font-semibold">
            {s.hours}
          </h2>
          {hours.length > 0 ? (
            <table className="mt-2 w-full max-w-sm border-collapse">
              <caption className="sr-only">{s.hours}</caption>
              <tbody>
                {hours.map((entry) => (
                  <tr key={entry.day} className="border-b last:border-b-0">
                    <th scope="row" className="py-2.5 text-left font-medium">
                      {s.days[entry.day - 1]}
                    </th>
                    <td className="price py-2.5 text-right">
                      {entry.closed ? s.closed : `${entry.open}–${entry.close}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground mt-2">{s.pending}</p>
          )}
        </section>
      </div>
    </div>
  );
}
