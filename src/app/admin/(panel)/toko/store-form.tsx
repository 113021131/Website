"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonPrimary, buttonSecondary, fieldHint, fieldInput, fieldLabel } from "@/components/ui/styles";
import type { Dictionary } from "@/i18n";
import { addKarat, saveStore, setKaratActive, type StoreFormState } from "./actions";

type Copy = Dictionary["admin"]["store"];

export type StoreFormValues = {
  text: Record<string, string>;
  hours: { day: number; open: string; close: string; closed: boolean }[];
  roundingMode: string;
  defaultFeeType: string;
  timezone: string;
  checks: Record<"demoMode" | "flagTryon" | "flagViewer" | "flagReserve", boolean>;
};

const initialState: StoreFormState = { status: "idle", message: "", invalid: [] };
const checkboxRow = "flex min-h-11 items-center gap-3";
const checkbox = "accent-brand size-5 shrink-0";
const sectionClass = "rounded-lg border bg-background p-4";

export function StoreForm({
  values,
  days,
  feeTypes,
  t,
}: {
  values: StoreFormValues;
  days: readonly string[];
  feeTypes: Record<string, string>;
  t: Copy;
}) {
  const [state, formAction, pending] = useActionState(saveStore, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const f = t.fields;

  useEffect(() => {
    if (state.status === "saved") toast.success(state.message);
    if (state.status === "error") formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  const field = (
    name: string,
    label: string,
    options: { type?: string; inputMode?: "text" | "tel" | "url" | "email" | "numeric" | "decimal"; hint?: string; rows?: number } = {},
  ) => {
    const invalid = state.invalid.includes(name) || undefined;
    const common = {
      id: `store-${name}`,
      name,
      defaultValue: values.text[name] ?? "",
      autoComplete: "off",
      "aria-invalid": invalid,
      "aria-describedby": options.hint ? `hint-${name}` : undefined,
      className: fieldInput,
    };
    return (
      <div>
        <label htmlFor={`store-${name}`} className={fieldLabel}>
          {label}
        </label>
        {options.rows ? (
          <textarea rows={options.rows} {...common} />
        ) : (
          <input type={options.type ?? "text"} inputMode={options.inputMode} {...common} />
        )}
        {options.hint ? (
          <p id={`hint-${name}`} className={fieldHint}>
            {options.hint}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-5">
      <section className={sectionClass} aria-labelledby="sec-identity">
        <h2 id="sec-identity" className="text-lg font-semibold">{t.sections.identity}</h2>
        <div className="mt-3 space-y-4">
          {field("name", f.name)}
          {field("tagline", f.tagline)}
        </div>
      </section>

      <section className={sectionClass} aria-labelledby="sec-location">
        <h2 id="sec-location" className="text-lg font-semibold">{t.sections.location}</h2>
        <div className="mt-3 space-y-4">
          {field("address", f.address, { rows: 3 })}
          <div className="grid gap-4 sm:grid-cols-3">
            {field("city", f.city)}
            {field("province", f.province)}
            {field("postalCode", f.postalCode, { inputMode: "numeric" })}
          </div>
          {field("landmarks", f.landmarks, { rows: 2 })}
          {field("mapsUrl", f.mapsUrl, { type: "url", inputMode: "url" })}
        </div>
      </section>

      <section className={sectionClass} aria-labelledby="sec-contact">
        <h2 id="sec-contact" className="text-lg font-semibold">{t.sections.contact}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {field("whatsapp", f.whatsapp, { type: "tel", inputMode: "tel", hint: f.whatsappHint })}
          {field("phone", f.phone, { type: "tel", inputMode: "tel" })}
          {field("email", f.email, { type: "email", inputMode: "email" })}
          {field("reviewUrl", f.reviewUrl, { type: "url", inputMode: "url" })}
          {field("reviewCardUrl", f.reviewCardUrl, { type: "url", inputMode: "url" })}
          {field("instagram", f.instagram, { type: "url", inputMode: "url" })}
          {field("facebook", f.facebook, { type: "url", inputMode: "url" })}
          {field("tiktok", f.tiktok, { type: "url", inputMode: "url" })}
        </div>
      </section>

      <section className={sectionClass} aria-labelledby="sec-hours">
        <h2 id="sec-hours" className="text-lg font-semibold">{t.sections.hours}</h2>
        <ul className="mt-3 space-y-3">
          {values.hours.map((entry) => (
            <li key={entry.day}>
              <fieldset className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                <legend className="float-left col-span-3 w-full font-semibold">{days[entry.day - 1]}</legend>
                <div>
                  <label htmlFor={`open-${entry.day}`} className="text-muted-foreground text-sm">{f.open}</label>
                  <input
                    id={`open-${entry.day}`}
                    name={`open-${entry.day}`}
                    type="time"
                    defaultValue={entry.open}
                    aria-invalid={state.invalid.includes(`open-${entry.day}`) || undefined}
                    className={fieldInput}
                  />
                </div>
                <div>
                  <label htmlFor={`close-${entry.day}`} className="text-muted-foreground text-sm">{f.close}</label>
                  <input id={`close-${entry.day}`} name={`close-${entry.day}`} type="time" defaultValue={entry.close} className={fieldInput} />
                </div>
                <label className={checkboxRow}>
                  <input type="checkbox" name={`closed-${entry.day}`} defaultChecked={entry.closed} className={checkbox} />
                  {f.closedDay}
                </label>
              </fieldset>
            </li>
          ))}
        </ul>
      </section>

      <section className={sectionClass} aria-labelledby="sec-trust">
        <h2 id="sec-trust" className="text-lg font-semibold">{t.sections.trust}</h2>
        <div className="mt-3 space-y-4">
          {field("policy", f.policy, { rows: 5 })}
          {field("certificates", f.certificates, { rows: 3 })}
          {field("story", f.story, { rows: 5 })}
        </div>
      </section>

      <section className={sectionClass} aria-labelledby="sec-pricing">
        <h2 id="sec-pricing" className="text-lg font-semibold">{t.sections.pricing}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="store-roundingMode" className={fieldLabel}>{f.roundingMode}</label>
            <select id="store-roundingMode" name="roundingMode" defaultValue={values.roundingMode} className={fieldInput}>
              {Object.entries(f.roundingModes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          {field("roundingStep", f.roundingStep, { inputMode: "numeric" })}
          <div>
            <label htmlFor="store-defaultFeeType" className={fieldLabel}>{f.defaultFeeType}</label>
            <select id="store-defaultFeeType" name="defaultFeeType" defaultValue={values.defaultFeeType} className={fieldInput}>
              {Object.entries(feeTypes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          {field("defaultFeeValue", f.defaultFeeValue, { inputMode: "decimal" })}
          {field("staleHours", f.staleHours, { inputMode: "numeric" })}
          <div>
            <label htmlFor="store-timezone" className={fieldLabel}>{f.timezone}</label>
            <select id="store-timezone" name="timezone" defaultValue={values.timezone} className={fieldInput}>
              <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
              <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
              <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
            </select>
          </div>
        </div>
      </section>

      <section className={sectionClass} aria-labelledby="sec-flags">
        <h2 id="sec-flags" className="text-lg font-semibold">{t.sections.flags}</h2>
        <div className="mt-2">
          {(
            [
              ["demoMode", f.demoMode],
              ["flagViewer", f.flagViewer],
              ["flagReserve", f.flagReserve],
              ["flagTryon", f.flagTryon],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className={checkboxRow}>
              <input type="checkbox" name={name} defaultChecked={values.checks[name]} className={checkbox} />
              {label}
            </label>
          ))}
        </div>
      </section>

      <button type="submit" disabled={pending} className={`${buttonPrimary} w-full sm:w-auto`}>
        {pending ? t.saving : t.save}
      </button>
      <p role="status" className={state.status === "error" ? "text-destructive text-sm" : "sr-only"}>
        {state.message}
      </p>
    </form>
  );
}

export function KaratManager({ karats, t }: { karats: { id: number; code: string; isActive: boolean }[]; t: Copy }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");

  function run(action: () => Promise<{ ok: boolean }>, failMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(t.karatSaved);
        setCode("");
        router.refresh();
      } else {
        toast.error(failMessage);
      }
    });
  }

  return (
    <section className={sectionClass} aria-labelledby="sec-karats">
      <h2 id="sec-karats" className="text-lg font-semibold">{t.sections.karats}</h2>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 sm:grid-cols-3">
        {karats.map((karat) => (
          <li key={karat.id}>
            <label className={checkboxRow}>
              <input
                type="checkbox"
                checked={karat.isActive}
                disabled={pending}
                onChange={(event) => run(() => setKaratActive(karat.id, event.target.checked), t.failed)}
                className={checkbox}
              />
              <span className="font-display font-semibold">{karat.code}</span>
              <span className="text-muted-foreground text-sm">{t.fields.karatActive}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-end gap-3 border-t pt-3">
        <div className="min-w-0 flex-1 basis-40">
          <label htmlFor="new-karat" className={fieldLabel}>{t.fields.newKarat}</label>
          <input
            id="new-karat"
            name="newKarat"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={3}
            className={fieldInput}
          />
        </div>
        <button type="button" disabled={pending || code.trim() === ""} onClick={() => run(() => addKarat(code), t.karatInvalid)} className={buttonSecondary}>
          {t.fields.addKarat}
        </button>
      </div>
    </section>
  );
}
