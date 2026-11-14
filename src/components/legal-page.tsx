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
    <div className={`${container} py-8 md:py-12`}>
      <h1 className="text-[1.875rem] font-semibold md:text-[2.5rem]">{title}</h1>
      <p className="bg-notice text-notice-foreground mt-4 max-w-[70ch] rounded-sm px-3 py-2">{draftNotice}</p>
      <div className="mt-8 max-w-[70ch] space-y-7">
        {sections.map((section) => (
          <section key={section.h}>
            <h2 className="text-xl font-semibold">{section.h}</h2>
            <p className="mt-2">{section.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
