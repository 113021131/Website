// Generated route file: binds a page view to one language. Edit the view, not this file.
import View, { generateMetadata as viewMetadata } from "@/views/katalog";

const params = Promise.resolve({ locale: "id" });

export const generateMetadata = () => viewMetadata({ params, searchParams: Promise.resolve({}) });

export default function Page({ searchParams }: PageProps<"/katalog">) {
  return <View params={params} searchParams={searchParams} />;
}
