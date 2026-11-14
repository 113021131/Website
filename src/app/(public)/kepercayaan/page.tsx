import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { container } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary } from "@/i18n";
import { getPrimaryStore, getSiteSettings, getTestimonials } from "@/lib/data/public";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

const t = getDictionary();
const c = t.trust;

export const metadata: Metadata = {
  title: c.metaTitle,
  description: c.metaDescription,
  alternates: { canonical: "/kepercayaan" },
};

export default async function TrustPage() {
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
        ])}
      />

      <div className={`${container} py-8 md:py-12`}>
        <h1 className="text-[1.875rem] font-semibold md:text-[2.5rem]">{c.title}</h1>
        <p className="text-muted-foreground mt-3 max-w-[60ch] text-lg">{c.lead}</p>

        <section id="surat-emas" aria-labelledby="surat-title" className="mt-10 scroll-mt-4">
          <h2 id="surat-title" className="text-2xl font-semibold">
            {c.suratTitle}
          </h2>
          <p className="mt-3 max-w-[65ch]">{c.suratBody}</p>

          {/* A labelled sample, with zeros instead of amounts, so it cannot be mistaken for a real receipt. */}
          <figure className="mt-5 max-w-xl rounded-sm border border-t-4 border-t-brand p-4">
            <figcaption className="bg-notice text-notice-foreground inline-block rounded-sm px-2 py-0.5 text-sm font-semibold">
              {c.suratSample}
            </figcaption>
            <dl className="mt-3">
              {c.suratFields.map((field) => (
                <div
                  key={field.label}
                  className="border-nota-leader grid grid-cols-[1fr_auto] items-baseline gap-x-3 border-b border-dotted py-2.5 last:border-b-0"
                >
                  <dt className="font-semibold">{field.label}</dt>
                  <dd className="price font-display">{field.value}</dd>
                  <dd className="text-muted-foreground col-span-2 text-sm">{field.note}</dd>
                </div>
              ))}
            </dl>
          </figure>
        </section>

        <section id="kadar" aria-labelledby="karat-title" className="mt-12 scroll-mt-4">
          <h2 id="karat-title" className="text-2xl font-semibold">
            {c.karatTitle}
          </h2>
          <p className="mt-3 max-w-[65ch]">{c.karatBody}</p>
          <div tabIndex={0} role="region" aria-labelledby="karat-title" className="mt-4 max-w-2xl overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse">
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
                    <td className="price py-2.5 pr-4">{row.purity}</td>
                    <td className="py-2.5">{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground mt-3 max-w-[65ch] text-sm">{c.karatNote}</p>
        </section>

        <section id="kebijakan" aria-labelledby="policy-title" className="mt-12 scroll-mt-4">
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
          <section aria-labelledby="cert-title" className="mt-12">
            <h2 id="cert-title" className="text-2xl font-semibold">
              {c.certificatesTitle}
            </h2>
            <p className="mt-3 max-w-[65ch] break-words whitespace-pre-line">{certificates}</p>
          </section>
        ) : null}

        {story ? (
          <section aria-labelledby="story-title" className="mt-12">
            <h2 id="story-title" className="text-2xl font-semibold">
              {c.storyTitle}
            </h2>
            <p className="mt-3 max-w-[65ch] break-words whitespace-pre-line">{story}</p>
          </section>
        ) : null}

        {testimonials.length > 0 ? (
          <section aria-labelledby="reviews-title" className="mt-12">
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
          <dl className="mt-5 max-w-[70ch] space-y-5">
            {c.faq.map((item) => (
              <div key={item.q}>
                <dt className="font-display text-lg font-semibold">{item.q}</dt>
                <dd className="mt-1">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
