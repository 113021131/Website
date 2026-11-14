"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { GlobeIcon } from "lucide-react";
import type { Locale } from "@/i18n";

/** Links to the same page in the other language. A plain link, so it works without JavaScript too. */
function SwitchLink({ locale, label, ariaLabel }: { locale: Locale; label: string; ariaLabel: string }) {
  const pathname = usePathname();
  const bare = pathname.replace(/^\/(en|id)(?=\/|$)/, "") || "/";
  const target: Locale = locale === "id" ? "en" : "id";
  const href = target === "en" ? (bare === "/" ? "/en" : `/en${bare}`) : bare;

  return (
    <a
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={`${ariaLabel}: ${label}`}
      className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline"
    >
      <GlobeIcon className="size-4" aria-hidden="true" />
      {label}
    </a>
  );
}

export function LocaleSwitch(props: { locale: Locale; label: string; ariaLabel: string }) {
  return (
    <Suspense fallback={<span className="mt-3 block min-h-11" />}>
      <SwitchLink {...props} />
    </Suspense>
  );
}
