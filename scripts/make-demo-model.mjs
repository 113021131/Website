/**
 * Generates a small procedural 3D ring (a gold torus, about 40 kB) and attaches
 * it to the DEMO product "demo-cincin-polos-22k", so the 3D preview tab can be
 * seen and tested before any real model exists. It is a geometric stand-in, not
 * a scan of a product.
 *
 *   node scripts/make-demo-model.mjs
 */
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } =
  process.env;
if (!url || !key || !E2E_ADMIN_EMAIL || !E2E_ADMIN_PASSWORD) throw new Error("Missing values in .env.local");

const SLUG = "demo-cincin-polos-22k";
const PATH = `demo/${SLUG}.glb`;

/** Binary glTF 2.0 with one torus mesh and a metallic gold material. */
function torusGlb({ radius = 0.9, tube = 0.14, radial = 64, tubular = 20 } = {}) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let i = 0; i <= radial; i++) {
    const u = (i / radial) * Math.PI * 2;
    for (let j = 0; j <= tubular; j++) {
      const v = (j / tubular) * Math.PI * 2;
      const nx = Math.cos(v) * Math.cos(u);
      const ny = Math.sin(v);
      const nz = Math.cos(v) * Math.sin(u);
      positions.push((radius + tube * Math.cos(v)) * Math.cos(u), tube * Math.sin(v), (radius + tube * Math.cos(v)) * Math.sin(u));
      normals.push(nx, ny, nz);
    }
  }
  for (let i = 0; i < radial; i++) {
    for (let j = 0; j < tubular; j++) {
      const a = i * (tubular + 1) + j;
      const b = (i + 1) * (tubular + 1) + j;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }

  const position = new Float32Array(positions);
  const normal = new Float32Array(normals);
  const index = new Uint16Array(indices);
  const indexBytes = Math.ceil(index.byteLength / 4) * 4;
  const bin = Buffer.alloc(position.byteLength + normal.byteLength + indexBytes);
  Buffer.from(position.buffer).copy(bin, 0);
  Buffer.from(normal.buffer).copy(bin, position.byteLength);
  Buffer.from(index.buffer).copy(bin, position.byteLength + normal.byteLength);

  const outer = radius + tube;
  const gltf = {
    asset: { version: "2.0", generator: "toko-sinar-mas demo ring" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "Cincin contoh", rotation: [0.35, 0, 0, 0.94] }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
    materials: [
      {
        name: "Emas",
        pbrMetallicRoughness: { baseColorFactor: [0.83, 0.62, 0.17, 1], metallicFactor: 1, roughnessFactor: 0.28 },
      },
    ],
    buffers: [{ byteLength: bin.byteLength }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: position.byteLength, target: 34962 },
      { buffer: 0, byteOffset: position.byteLength, byteLength: normal.byteLength, target: 34962 },
      { buffer: 0, byteOffset: position.byteLength + normal.byteLength, byteLength: index.byteLength, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: position.length / 3, type: "VEC3", min: [-outer, -tube, -outer], max: [outer, tube, outer] },
      { bufferView: 1, componentType: 5126, count: normal.length / 3, type: "VEC3" },
      { bufferView: 2, componentType: 5123, count: index.length, type: "SCALAR" },
    ],
  };

  let json = Buffer.from(JSON.stringify(gltf), "utf8");
  if (json.byteLength % 4 !== 0) json = Buffer.concat([json, Buffer.alloc(4 - (json.byteLength % 4), 0x20)]);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF"
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.byteLength + 8 + bin.byteLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(json.byteLength, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.byteLength, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // "BIN\0"
  return Buffer.concat([header, jsonHeader, json, binHeader, bin]);
}

const glb = torusGlb();
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const signIn = await supabase.auth.signInWithPassword({ email: E2E_ADMIN_EMAIL, password: E2E_ADMIN_PASSWORD });
if (signIn.error) throw new Error(`Sign-in failed: ${signIn.error.message}`);

const upload = await supabase.storage.from("product-models").upload(PATH, glb, { contentType: "model/gltf-binary", upsert: true });
if (upload.error) throw new Error(`Upload failed: ${upload.error.message}`);

const update = await supabase.from("products").update({ model_glb_path: PATH }).eq("slug", SLUG).select("id");
if (update.error || update.data.length === 0) throw new Error(`Could not attach the model to ${SLUG}`);

console.log(`Demo ring (${(glb.byteLength / 1024).toFixed(1)} kB) attached to ${SLUG}.`);
await supabase.auth.signOut();
