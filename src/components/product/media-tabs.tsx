"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Tab = "photos" | "model";

/**
 * "Foto | Pratinjau 3D" for products that have a model. The 3D library is about
 * 250 kB, so it is fetched only when a visitor opens the 3D tab; it never slows
 * the first paint. Switching is instant: no animation on a control used this often.
 */
export function MediaTabs({
  photos,
  modelSrc,
  iosSrc,
  poster,
  productName,
  slug,
  labels,
}: {
  photos: ReactNode;
  modelSrc: string;
  iosSrc: string | null;
  poster: string | null;
  productName: string;
  slug: string;
  labels: { photos: string; model: string; note: string; loading: string };
}) {
  const ids = useId();
  const [tab, setTab] = useState<Tab>("photos");
  const [viewerReady, setViewerReady] = useState(false);

  function select(next: Tab) {
    setTab(next);
    if (next === "model" && !viewerReady) {
      track({ name: "model_3d_open", props: { product: slug } });
      void import("@google/model-viewer").then(() => setViewerReady(true));
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next: Tab = tab === "photos" ? "model" : "photos";
    select(next);
    document.getElementById(`${ids}-tab-${next}`)?.focus();
  }

  const tabButton = (value: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      id={`${ids}-tab-${value}`}
      aria-selected={tab === value}
      aria-controls={`${ids}-panel-${value}`}
      tabIndex={tab === value ? 0 : -1}
      onClick={() => select(value)}
      className={cn(
        "min-h-12 flex-1 rounded-md px-3 font-semibold",
        tab === value ? "bg-brand text-brand-foreground" : "hover:bg-surface-muted",
      )}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div role="tablist" aria-label={productName} onKeyDown={onKeyDown} className="mb-3 flex gap-1 rounded-lg border p-1">
        {tabButton("photos", labels.photos)}
        {tabButton("model", labels.model)}
      </div>

      <div role="tabpanel" id={`${ids}-panel-photos`} aria-labelledby={`${ids}-tab-photos`} hidden={tab !== "photos"}>
        {photos}
      </div>

      <div role="tabpanel" id={`${ids}-panel-model`} aria-labelledby={`${ids}-tab-model`} hidden={tab !== "model"}>
        <div className="bg-surface-tint relative aspect-[4/5] overflow-hidden rounded-lg">
          {viewerReady ? (
            <model-viewer
              src={modelSrc}
              ios-src={iosSrc ?? undefined}
              poster={poster ?? undefined}
              alt={`${labels.model}: ${productName}`}
              camera-controls
              ar
              ar-modes="webxr scene-viewer quick-look"
              touch-action="pan-y"
              shadow-intensity="0.6"
              style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
            />
          ) : (
            <p role="status" className="text-muted-foreground flex h-full items-center justify-center">
              {tab === "model" ? labels.loading : ""}
            </p>
          )}
          <span className="bg-notice text-notice-foreground absolute top-2 left-2 rounded-sm px-1.5 py-0.5 text-xs font-semibold">
            {labels.model}
          </span>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">{labels.note}</p>
      </div>
    </div>
  );
}
