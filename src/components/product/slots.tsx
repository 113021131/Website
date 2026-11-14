import type { Dictionary } from "@/i18n";
import type { FeatureFlags, Product } from "@/lib/data/public";

/**
 * Reserved place on the product page for "Coba Pakai" (virtual try-on). It renders
 * nothing until the feature flag is on AND the product has a try-on asset, so no
 * product ever shows a dead button.
 *
 * Phase 2.5 replaces TryOnSlot with a button driving getTryOnProvider() (src/lib/tryon).
 * The 3D preview that used to be reserved here is now components/product/media-tabs.tsx.
 */
export function TryOnSlot({ product, flags, t }: { product: Product; flags: FeatureFlags; t: Dictionary }) {
  if (!flags.tryon || !product.tryonEnabled || !product.tryonAssetRef) return null;
  return <div data-slot="try-on" aria-label={t.product.tryOn} hidden />;
}
