import type { Dictionary } from "@/i18n";
import type { FeatureFlags, Product } from "@/lib/data/public";

/**
 * Reserved places on the product page for features that ship later. Both render
 * nothing until their feature flag is on AND the product has the asset, so a
 * product without a model or try-on asset never shows an empty tab or dead button.
 *
 * Phase 2 replaces the body of ModelPreviewSlot with a lazy-loaded <model-viewer>.
 * Phase 2.5 replaces TryOnSlot with a button driving getTryOnProvider() (src/lib/tryon).
 */
export function ModelPreviewSlot({ product, flags, t }: { product: Product; flags: FeatureFlags; t: Dictionary }) {
  if (!flags.viewer_3d || !product.modelGlbUrl) return null;
  return (
    <section data-slot="model-preview" aria-label={t.product.preview3d} hidden>
      {/* Phase 2: <model-viewer src={product.modelGlbUrl} ios-src={product.modelUsdzUrl} camera-controls ar /> */}
    </section>
  );
}

export function TryOnSlot({ product, flags, t }: { product: Product; flags: FeatureFlags; t: Dictionary }) {
  if (!flags.tryon || !product.tryonEnabled || !product.tryonAssetRef) return null;
  return <div data-slot="try-on" aria-label={t.product.tryOn} hidden />;
}
