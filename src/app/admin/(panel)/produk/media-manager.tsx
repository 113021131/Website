"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { buttonSecondary, fieldHint, fieldInput, fieldLabel } from "@/components/ui/styles";
import { fill, type Dictionary } from "@/i18n";
import { storageUrl } from "@/lib/storage";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { addImage, moveImage, removeImage, setModel, updateImageAlt } from "./actions";

export type ManagedImage = { id: number; path: string; alt: string };
type Copy = Dictionary["admin"]["products"];

const MAX_EDGE = 1600;
const MODEL_WARN_BYTES = 5 * 1024 * 1024;

/**
 * Shrinks a phone photo in the browser before upload: a 6 MB camera file becomes
 * roughly 200–400 kB, so uploads work on a slow connection. WebP where the
 * browser can encode it, JPEG otherwise (Safari).
 */
async function resizePhoto(file: File): Promise<{ blob: Blob; width: number; height: number; extension: "webp" | "jpg" }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await encode("image/webp", 0.82);
  if (webp && webp.type === "image/webp") return { blob: webp, width, height, extension: "webp" };
  const jpeg = await encode("image/jpeg", 0.85);
  if (!jpeg) throw new Error("Could not encode image");
  return { blob: jpeg, width, height, extension: "jpg" };
}

export function PhotoManager({ productId, images, t }: { productId: number; images: ManagedImage[]; t: Copy }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const busy = uploading || pending;

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createBrowserSupabase();
    let failed = false;

    for (const file of Array.from(files).slice(0, 12)) {
      try {
        const photo = await resizePhoto(file);
        const path = `p/${productId}/${crypto.randomUUID()}.${photo.extension}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, photo.blob, { contentType: photo.blob.type, cacheControl: "31536000" });
        if (error) throw error;
        const saved = await addImage(productId, path, photo.width, photo.height);
        if (!saved.ok) throw new Error("row not saved");
      } catch {
        failed = true;
      }
    }

    if (inputRef.current) inputRef.current.value = "";
    setUploading(false);
    if (failed) toast.error(t.uploadFailed);
    else toast.success(t.photoSaved);
    router.refresh();
  }

  function run(action: () => Promise<{ ok: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else toast.error(t.uploadFailed);
    });
  }

  return (
    <section aria-labelledby="photos-title" className="rounded-lg border bg-background p-4">
      <h2 id="photos-title" className="text-lg font-semibold">
        {t.photosTitle}
      </h2>
      <p className={fieldHint}>{t.photosLead}</p>

      {images.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {images.map((image, index) => (
            <li key={image.id} className="flex gap-3 rounded-md border p-2">
              <div className="bg-surface-tint relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-sm">
                <Image src={storageUrl("product-images", image.path)} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor={`alt-${image.id}`} className={fieldLabel}>
                  {t.alt}
                </label>
                <input
                  id={`alt-${image.id}`}
                  name={`alt-${image.id}`}
                  defaultValue={image.alt}
                  maxLength={200}
                  autoComplete="off"
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (value !== image.alt) run(() => updateImageAlt(image.id, value));
                  }}
                  className={fieldInput}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    aria-label={t.moveUp}
                    onClick={() => run(() => moveImage(image.id, "up"))}
                    className="hover:bg-surface-muted inline-flex size-11 items-center justify-center rounded-md border disabled:opacity-40"
                  >
                    <ArrowUpIcon className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === images.length - 1}
                    aria-label={t.moveDown}
                    onClick={() => run(() => moveImage(image.id, "down"))}
                    className="hover:bg-surface-muted inline-flex size-11 items-center justify-center rounded-md border disabled:opacity-40"
                  >
                    <ArrowDownIcon className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={t.removePhoto}
                    onClick={() => run(() => removeImage(image.id))}
                    className="text-destructive hover:bg-surface-muted ml-auto inline-flex size-11 items-center justify-center rounded-md border disabled:opacity-40"
                  >
                    <Trash2Icon className="size-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        <label htmlFor="photo-files" className={`${buttonSecondary} w-full cursor-pointer sm:w-auto`}>
          {uploading ? t.uploading : t.addPhotos}
        </label>
        <input
          id="photo-files"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          onChange={(event) => upload(event.target.files)}
          className="sr-only"
        />
      </div>
    </section>
  );
}

export function ModelManager({
  productId,
  hasGlb,
  hasUsdz,
  t,
}: {
  productId: number;
  hasGlb: boolean;
  hasUsdz: boolean;
  t: Copy;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState("");

  async function upload(kind: "glb" | "usdz", file: File | undefined) {
    if (!file) return;
    setWarning(
      file.size > MODEL_WARN_BYTES ? fill(t.modelLarge, { size: (file.size / 1024 / 1024).toFixed(1).replace(".", ",") }) : "",
    );
    setBusy(true);
    try {
      const path = `p/${productId}/${crypto.randomUUID()}.${kind}`;
      const { error } = await createBrowserSupabase()
        .storage.from("product-models")
        .upload(path, file, {
          contentType: kind === "glb" ? "model/gltf-binary" : "model/vnd.usdz+zip",
          cacheControl: "31536000",
        });
      if (error) throw error;
      const saved = await setModel(productId, kind, path);
      if (!saved.ok) throw new Error("not saved");
      toast.success(t.modelSaved);
      router.refresh();
    } catch {
      toast.error(t.uploadFailed);
    } finally {
      setBusy(false);
    }
  }

  const field = (kind: "glb" | "usdz", label: string, present: boolean) => (
    <div>
      <label htmlFor={`model-${kind}`} className={fieldLabel}>
        {label}
        {present ? <span className="text-success ml-2 font-normal">({t.modelCurrent})</span> : null}
      </label>
      <input
        id={`model-${kind}`}
        name={`model-${kind}`}
        type="file"
        accept={`.${kind}`}
        disabled={busy}
        onChange={(event) => upload(kind, event.target.files?.[0])}
        className={`${fieldInput} file:mr-3 file:font-semibold`}
      />
    </div>
  );

  return (
    <section aria-labelledby="models-title" className="rounded-lg border bg-background p-4">
      <h2 id="models-title" className="text-lg font-semibold">
        {t.modelsTitle}
      </h2>
      <p className={fieldHint}>{t.modelsLead}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {field("glb", t.modelGlb, hasGlb)}
        {field("usdz", t.modelUsdz, hasUsdz)}
      </div>
      <p role="status" className="bg-notice text-notice-foreground mt-3 rounded-sm px-3 py-2 text-sm empty:hidden">
        {warning}
      </p>
    </section>
  );
}
