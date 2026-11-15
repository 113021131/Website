import { InfoIcon } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { container } from "@/components/ui/styles";

/** Shared layout for the draft legal pages. The draft notice is always shown first. */
export function LegalPage({
  title,
  draftNotice,
  sections,
}: {
  title: string;
  draftNotice: string;
  sections: readonly { h: string; p: string }[];
}) {
  return (
    <>
      <PageHero title={title} />
      <div className={`${container} py-8 md:py-12`}>
        <p className="bg-notice text-notice-foreground flex max-w-[70ch] items-start gap-2 rounded-sm px-3 py-2.5">
          <InfoIcon className="mt-1 size-4 shrink-0" aria-hidden="true" />
          <span>{draftNotice}</span>
        </p>
        <div className="mt-8 max-w-[70ch] divide-y">
          {sections.map((section) => (
            <section key={section.h} className="py-6 first:pt-0">
              <h2 className="text-xl font-semibold">{section.h}</h2>
              <p className="mt-2">{section.p}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
