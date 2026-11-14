/**
 * "Coba Pakai" (virtual try-on) adapter.
 *
 * No vendor SDK is integrated. The owner chooses a vendor after getting quotes
 * (candidates: Banuba, Perfect Corp, GlamAR, MirrAR). To add one in Phase 2.5,
 * implement this interface in its own file and return it from getTryOnProvider().
 * Nothing else in the app needs to change.
 */
export type TryOnSession = {
  /** Call to close the camera view and release resources. */
  close: () => void;
};

export type TryOnRequest = {
  /** Vendor-specific reference stored in products.tryon_asset_ref. */
  assetRef: string;
  productName: string;
  /** Element the vendor's camera view should mount into. */
  container: HTMLElement;
};

export interface TryOnProvider {
  readonly id: string;
  /** True when the device and browser can run this provider (camera, WebGL, …). */
  isSupported(): Promise<boolean>;
  start(request: TryOnRequest): Promise<TryOnSession>;
}

/** Placeholder provider: reports "not supported", so the button never appears to work when it cannot. */
export const stubTryOnProvider: TryOnProvider = {
  id: "stub",
  async isSupported() {
    return false;
  },
  async start() {
    throw new Error("No try-on vendor is integrated yet.");
  },
};

export function getTryOnProvider(): TryOnProvider {
  return stubTryOnProvider;
}
