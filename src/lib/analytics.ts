/**
 * Privacy-friendly analytics events. One wrapper, swappable provider.
 *
 * No analytics script is loaded yet: the provider is the owner's choice
 * (TODO_OWNER — see docs/OWNER-CHECKLIST.md). When one is added, events flow to
 * it without touching any component. No personal data is ever sent: no names,
 * phone numbers or message text.
 */
export type AnalyticsEvent =
  | { name: "whatsapp_click"; props: { placement: string; product?: string } }
  | { name: "price_page_view"; props?: undefined }
  | { name: "reserve_submit"; props: { product: string } }
  | { name: "model_3d_open"; props: { product: string } }
  | { name: "tryon_open"; props: { product: string } };

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    /** Vercel Web Analytics */
    va?: (event: "event", payload: { name: string; data?: Props }) => void;
    /** Plausible */
    plausible?: (name: string, options?: { props?: Props }) => void;
    /** Umami */
    umami?: { track: (name: string, props?: Props) => void };
  }
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  const props = event.props as Props | undefined;
  try {
    window.va?.("event", { name: event.name, data: props });
    window.plausible?.(event.name, props ? { props } : undefined);
    window.umami?.track(event.name, props);
  } catch {
    // Analytics must never break the page.
  }
}
