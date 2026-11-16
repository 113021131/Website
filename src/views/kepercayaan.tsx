import type { Metadata } from "next";
import type { ViewProps } from "./types";
import { PageHero, panel } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { container } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary } from "@/i18n";
import { getPrimaryStore, getSiteSettings, getTestimonials } from "@/lib/data/public";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

type Props = ViewProps;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return pageMetadata(t, "/kepercayaan", t.trust.metaTitle, t.trust.metaDescription);
}

export default async function TrustPage({ params }: Props) {
  const t = getDictionary((await params).locale);
  const c = t.trust;
  const [store, settings, testimonials] = await Promise.all([getPrimaryStore(), getSiteSettings(), getTestimonials()]);
  const texts = (settings.trust_texts ?? {}) as Record<string, string | null>;
  const policy = ownerValue(texts.policy);
  const certificates = ownerValue(texts.certificates);
  const story = ownerValue(texts.story);

  return (
    <>
      <JsonLd data={faqJsonLd(c.faq)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.common.home, path: "/" },
          { name: t.nav.trust, path: "/kepercayaan" },
        ], t.locale)}
      />

      <PageHero title={c.title} lead={c.lead} />
      <div className={`${container} space-y-5 py-8 md:py-12`}>

        <section
          id="surat-emas"
          aria-labelledby="surat-title"
          className={`${panel} scroll-mt-4 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-12`}
        >
          <div>
            <h2 id="surat-title" className="text-2xl font-semibold">
              {c.suratTitle}
            </h2>
            <p className="mt-3 max-w-[65ch]">{c.suratBody}</p>
          </div>

          {/* A labelled sample, with zeros instead of amounts, so it cannot be mistaken for a real receipt. */}
          <figure className="mt-5 rounded-sm border border-t-4 border-t-brand p-[min(1rem,4vw)] lg:mt-0">
            <figcaption className="bg-notice text-notice-foreground inline-block rounded-sm px-2 py-0.5 text-sm font-semibold">
              {c.suratSample}
            </figcaption>
            {/* Label and value share a line while they fit; with very large text the value
                drops under the label, right-aligned, instead of pushing the sample off-screen. */}
            <dl className="mt-3">
              {c.suratFields.map((field) => (
                <div
                  key={field.label}
                  className="border-nota-leader flex flex-wrap items-baseline gap-x-3 border-b border-dotted py-2.5 last:border-b-0"
                >
                  <dt className="min-w-0 font-semibold break-words">{field.label}</dt>
                  <dd className="font-display ml-auto text-right tabular-nums">{field.value}</dd>
                  <dd className="text-muted-foreground basis-full text-sm">{field.note}</dd>
                </div>
              ))}
            </dl>
          </figure>
        </section>

        <section
          id="kadar"
          aria-labelledby="karat-title"
          className={`${panel} scroll-mt-4 lg:grid lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-12`}
        >
          <div>
            <h2 id="karat-title" className="text-2xl font-semibold">
              {c.karatTitle}
            </h2>
            <p className="mt-3 max-w-[65ch]">{c.karatBody}</p>
            <p className="text-muted-foreground mt-3 max-w-[65ch] text-sm">{c.karatNote}</p>
          </div>
          {/* Three columns need about 15rem. Measured in rem, so on a phone with very large
              text each karat becomes a small card instead (the price board does the same). */}
          <div className="@container mt-4 lg:mt-0">
            <ul aria-label={c.karatTableCaption} className="@min-[15rem]:hidden">
              {c.karatRows.map((row) => (
                <li key={row.karat} className="border-t py-3 first:border-t-0 first:pt-0">
                  <p className="font-display text-gold-ink text-lg font-semibold">{row.karat}</p>
                  <dl className="mt-1 space-y-1.5">
                    <div>
                      <dt className="text-muted-foreground text-sm">{c.karatColumns.purity}</dt>
                      <dd className="tabular-nums">{row.purity}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-sm">{c.karatColumns.use}</dt>
                      <dd>{row.use}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
            <div tabIndex={0} role="region" aria-labelledby="karat-title" className="hidden overflow-x-auto @min-[15rem]:block">
              <table className="w-full border-collapse">
                <caption className="sr-only">{c.karatTableCaption}</caption>
                <thead>
                  <tr className="text-muted-foreground text-left text-sm">
                    <th scope="col" className="pb-2 font-medium">{c.karatColumns.karat}</th>
                    <th scope="col" className="pb-2 font-medium">{c.karatColumns.purity}</th>
                    <th scope="col" className="pb-2 font-medium">{c.karatColumns.use}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.karatRows.map((row) => (
                    <tr key={row.karat} className="border-t align-top">
                      <th scope="row" className="font-display text-gold-ink py-2.5 pr-4 text-left text-lg font-semibold">
                        {row.karat}
                      </th>
                      <td className="py-2.5 pr-4 tabular-nums">{row.purity}</td>
                      <td className="py-2.5">{row.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="kebijakan" aria-labelledby="policy-title" className={`${panel} scroll-mt-4`}>
          <h2 id="policy-title" className="text-2xl font-semibold">
            {c.policyTitle}
          </h2>
          <p className="mt-3 max-w-[65ch] break-words whitespace-pre-line">{policy ?? c.policyPending}</p>
          <div className="mt-4">
            <WhatsAppButton
              number={ownerValue(store.whatsapp)}
              message={fill(t.whatsappMessage.general, { brand: store.name })}
              label={t.cta.whatsapp}
              missingLabel={t.cta.whatsappMissing}
              placement="trust_policy"
              variant="outline"
            />
          </div>
        </section>

        {/* Shown only when the owner has supplied the real thing. */}
        {certificates ? (
          <section aria-labelledby="cert-title" className={panel}>
            <h2 id="cert-title" className="text-2xl font-semibold">
              {c.certificatesTitle}
            </h2>
            <p className="mt-3 max-w-[65ch] break-words whitespace-pre-line">{certificates}</p>
          </section>
        ) : null}

        {story ? (
          <section aria-labelledby="story-title" className={panel}>
            <h2 id="story-title" className="text-2xl font-semibold">
              {c.storyTitle}
            </h2>
            <p className="mt-3 max-w-[65ch] break-words whitespace-pre-line">{story}</p>
          </section>
        ) : null}

        {testimonials.length > 0 ? (
          <section aria-labelledby="reviews-title" className={panel}>
            <h2 id="reviews-title" className="text-2xl font-semibold">
              {c.reviewsTitle}
            </h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {testimonials.map((review) => (
                <li key={review.id} className="rounded-lg border p-4">
                  <blockquote className="break-words">{review.body}</blockquote>
                  <p className="mt-3 font-semibold">{review.author_name}</p>
                  <a
                    href={review.source_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-muted-foreground text-sm underline underline-offset-4"
                  >
                    {fill(c.reviewSource, { source: review.source_name })}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <section className="bg-surface-muted" aria-labelledby="trust-faq">
        <div className={`${container} py-10`}>
          <h2 id="trust-faq" className="text-2xl font-semibold">
            {c.faqTitle}
          </h2>
          {/* grid-cols-1 caps the column at the screen width, so a long word wraps instead of widening it. */}
          <dl className="mt-6 grid grid-cols-1 gap-x-14 gap-y-7 md:grid-cols-2">
            {c.faq.map((item) => (
              <div key={item.q} className="border-gold border-l-2 pl-4">
                <dt className="font-display text-lg font-semibold">{item.q}</dt>
                <dd className="mt-1.5">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
