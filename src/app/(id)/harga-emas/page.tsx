// Generated route file: binds a page view to one language. Edit the view, not this file.
import View, { generateMetadata as viewMetadata } from "@/views/harga-emas";

const params = Promise.resolve({ locale: "id" });

export const generateMetadata = () => viewMetadata({ params });

export default function Page() {
  return <View params={params} />;
}
