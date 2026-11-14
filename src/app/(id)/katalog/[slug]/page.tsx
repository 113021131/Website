// Generated route file: binds a page view to one language. Edit the view, not this file.
import View, { generateMetadata as viewMetadata, generateStaticParams as viewStaticParams } from "@/views/produk";

type Props = PageProps<"/katalog/[slug]">;

const withLocale = (params: Props["params"]) => params.then((value) => ({ ...value, locale: "id" }));

export async function generateStaticParams() {
  return viewStaticParams();
}

export const generateMetadata = ({ params }: Props) => viewMetadata({ params: withLocale(params) });

export default function Page({ params }: Props) {
  return <View params={withLocale(params)} />;
}
