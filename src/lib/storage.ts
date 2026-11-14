import { supabaseUrl } from "@/lib/env";

export type StorageBucket = "product-images" | "product-models";

/** Public CDN URL of a file in a public bucket. Safe on server and client. */
export function storageUrl(bucket: StorageBucket, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
