"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import { fill, type Dictionary } from "@/i18n";
import { parseWeightInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import { importProducts, type ImportRow } from "./actions";

type Copy = Dictionary["admin"]["importCsv"];
type Preview = { line: number; name: string; detail: string; errors: string[]; row: ImportRow | null };

const FEE_TYPES = ["per_gram", "fixed", "percent"] as const;
const MAX_ROWS = 300;

/** Minimal RFC 4180 reader: quoted cells, doubled quotes, commas or semicolons, CRLF. */
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const delimiter = (clean.split("\n")[0].match(/;/g)?.length ?? 0) > (clean.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;
  for (let index = 0; index < clean.length; index++) {
    const char = clean[index];
    if (quoted) {
      if (char === '"' && clean[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && clean[index + 1] === "\n") index++;
      row.push(cell);
      rows.push(row);
      cell = "";
      row = [];
    } else cell += char;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ""));
}

function parseAmount(text: string): number | null {
  if (text.trim() === "") return 0;
  const number = Number(text.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function ImportForm({
  karatCodes,
  categorySlugs,
  t,
}: {
  karatCodes: string[];
  categorySlugs: string[];
  t: Copy;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview[] | null>(null);
  const [problem, setProblem] = useState("");
  const [pending, startTransition] = useTransition();

  async function read(file: File | undefined) {
    setPreview(null);
    setProblem("");
    if (!file) return;
    const table = parseCsv(await file.text());
    const header = table[0]?.map((value) => value.trim().toLowerCase()) ?? [];
    const column = (name: string) => header.indexOf(name);
    if (table.length < 2 || column("nama") < 0 || column("kadar") < 0 || column("berat") < 0) {
      setProblem(t.parseFailed);
      return;
    }
    if (table.length - 1 > MAX_ROWS) {
      setProblem(t.tooMany);
      return;
    }

    const get = (cells: string[], name: string) => (column(name) >= 0 ? (cells[column(name)] ?? "").trim() : "");
    const list = (value: string) => value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);

    setPreview(
      table.slice(1).map((cells, index) => {
        const errors: string[] = [];
        const name = get(cells, "nama");
        if (name.length < 1 || name.length > 200) errors.push(t.errors.name);
        const karatCode = get(cells, "kadar").toUpperCase();
        if (!karatCodes.includes(karatCode)) errors.push(t.errors.karat);
        const weightG = parseWeightInput(get(cells, "berat"));
        if (weightG === null) errors.push(t.errors.weight);
        const categorySlug = get(cells, "jenis").toLowerCase();
        if (categorySlug && !categorySlugs.includes(categorySlug)) errors.push(t.errors.category);
        const feeType = (get(cells, "jenis_ongkos") || "per_gram") as (typeof FEE_TYPES)[number];
        if (!FEE_TYPES.includes(feeType)) errors.push(t.errors.feeType);
        const feeValue = parseAmount(get(cells, "nilai_ongkos"));
        if (feeValue === null || (feeType === "percent" && feeValue > 100)) errors.push(t.errors.feeValue);

        return {
          line: index + 2,
          name: name || "—",
          detail: `${karatCode || "?"}, ${get(cells, "berat") || "?"} g`,
          errors,
          row:
            errors.length === 0 && weightG !== null && feeValue !== null
              ? {
                  name,
                  categorySlug,
                  karatCode,
                  weightG,
                  feeType,
                  feeValue,
                  sizes: list(get(cells, "ukuran")),
                  occasions: list(get(cells, "acara")),
                  description: get(cells, "deskripsi"),
                }
              : null,
        };
      }),
    );
  }

  const valid = preview?.filter((entry) => entry.row !== null) ?? [];
  const invalid = (preview?.length ?? 0) - valid.length;

  function submit() {
    startTransition(async () => {
      const result = await importProducts(valid.map((entry) => entry.row as ImportRow));
      if (result.ok) {
        toast.success(fill(t.done, { count: String(result.count) }));
        router.push("/admin/produk");
      } else {
        toast.error(t.failed);
      }
    });
  }

  return (
    <div className="mt-5 space-y-4">
      <div>
        <label htmlFor="csv-file" className={`${buttonSecondary} cursor-pointer`}>
          {t.choose}
        </label>
        <input id="csv-file" name="csv" type="file" accept=".csv,text/csv" onChange={(event) => read(event.target.files?.[0])} className="sr-only" />
      </div>
      <p role="alert" className="text-destructive empty:hidden">
        {problem}
      </p>

      {preview ? (
        <>
          <p role="status" className="font-semibold">
            {fill(t.summary, { valid: String(valid.length), invalid: String(invalid) })}
          </p>
          <ul className="space-y-2">
            {preview.map((entry) => (
              <li key={entry.line} className={cn("rounded-lg border bg-background p-3", entry.errors.length > 0 && "border-destructive")}>
                <p className="text-muted-foreground text-xs">{fill(t.row, { row: String(entry.line) })}</p>
                <p className="font-semibold break-words">{entry.name}</p>
                <p className="price text-muted-foreground text-sm">{entry.detail}</p>
                <p className={cn("text-sm font-semibold", entry.errors.length > 0 ? "text-destructive" : "text-success")}>
                  {entry.errors.length > 0 ? entry.errors.join("; ") : t.ok}
                </p>
              </li>
            ))}
          </ul>
          {valid.length > 0 ? (
            <button type="button" disabled={pending} onClick={submit} className={`${buttonPrimary} w-full sm:w-auto`}>
              {pending ? t.submitting : fill(t.submit, { count: String(valid.length) })}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
