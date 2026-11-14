import Link from "next/link";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";

export default function NotFound() {
  const t = getDictionary();
  return (
    <main id="isi" className="page-gutter mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-16">
      <h1 className="text-[1.875rem] font-semibold">{t.product.notFoundTitle}</h1>
      <p className="text-muted-foreground mt-3">{t.product.notFoundBody}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/katalog" className={buttonPrimary}>
          {t.cta.catalog}
        </Link>
        <Link href="/" className={buttonSecondary}>
          {t.common.home}
        </Link>
      </div>
    </main>
  );
}
