"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarCheckIcon, MessageCircleIcon } from "lucide-react";
import { submitReservation, type ReserveState } from "@/views/reservation-actions";
import { buttonPrimary, buttonSecondary, buttonWhatsApp, fieldHint, fieldInput, fieldLabel } from "@/components/ui/styles";
import type { Dictionary } from "@/i18n";
import { track } from "@/lib/analytics";

const initialState: ReserveState = { status: "idle", message: "" };

/** "Reserve for pickup": opens a short form, saves the request, then hands over to WhatsApp. */
export function ReserveForm({
  slug,
  locale,
  privacyHref,
  t,
}: {
  slug: string;
  locale: string;
  privacyHref: string;
  t: Dictionary["reserve"];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, actionPending] = useActionState(submitReservation.bind(null, { slug, locale }), initialState);
  const [transitionPending, startTransition] = useTransition();
  const pending = actionPending || transitionPending;
  const formRef = useRef<HTMLFormElement>(null);
  const ids = useId();

  useEffect(() => {
    if (state.status === "saved") track({ name: "reserve_submit", props: { product: slug } });
    if (state.status === "error" && state.field) {
      formRef.current?.querySelector<HTMLElement>(`[name="${state.field}"]`)?.focus();
    }
  }, [state, slug]);

  // Submitted by hand so React does not reset the fields when validation fails.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  if (state.status === "saved") {
    return (
      <div role="status" className="bg-surface-tint mt-3 rounded-lg p-4">
        <p className="font-semibold">{state.message}</p>
        {state.whatsappUrl ? (
          <a href={state.whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${buttonWhatsApp} mt-3 w-full`}>
            <MessageCircleIcon className="size-5" aria-hidden="true" />
            {t.continueWhatsapp}
          </a>
        ) : null}
      </div>
    );
  }

  const invalid = (field: ReserveState["field"]) => (state.field === field ? true : undefined);

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${ids}-form`}
        onClick={() => setOpen((value) => !value)}
        className={`${buttonSecondary} w-full`}
      >
        <CalendarCheckIcon className="size-5" aria-hidden="true" />
        {t.open}
      </button>

      <form
        id={`${ids}-form`}
        ref={formRef}
        hidden={!open}
        onSubmit={onSubmit}
        noValidate
        aria-labelledby={`${ids}-title`}
        className="mt-3 space-y-4 rounded-lg border p-4"
      >
        <div>
          <h2 id={`${ids}-title`} className="text-lg font-semibold">
            {t.title}
          </h2>
          <p className={fieldHint}>{t.lead}</p>
        </div>

        <div>
          <label htmlFor={`${ids}-name`} className={fieldLabel}>
            {t.name}
          </label>
          <input id={`${ids}-name`} name="name" autoComplete="name" maxLength={120} aria-invalid={invalid("name")} className={fieldInput} />
        </div>
        <div>
          <label htmlFor={`${ids}-phone`} className={fieldLabel}>
            {t.phone}
          </label>
          <input
            id={`${ids}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            aria-describedby={`${ids}-phone-hint`}
            aria-invalid={invalid("phone")}
            className={fieldInput}
          />
          <p id={`${ids}-phone-hint`} className={fieldHint}>
            {t.phoneHint}
          </p>
        </div>
        <div>
          <label htmlFor={`${ids}-date`} className={fieldLabel}>
            {t.date}
          </label>
          <input id={`${ids}-date`} name="date" type="date" aria-invalid={invalid("date")} className={fieldInput} />
        </div>
        <div>
          <label htmlFor={`${ids}-note`} className={fieldLabel}>
            {t.note}
          </label>
          <textarea id={`${ids}-note`} name="note" rows={3} maxLength={1000} className={fieldInput} />
        </div>

        {/* Honeypot: hidden from people and assistive technology; only bots fill it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
          <label htmlFor={`${ids}-company`}>Company</label>
          <input id={`${ids}-company`} name="company" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <label className="flex min-h-11 items-start gap-3">
            <input type="checkbox" name="consent" aria-invalid={invalid("consent")} className="accent-brand mt-1 size-5 shrink-0" />
            <span>{t.consent}</span>
          </label>
          <Link href={privacyHref} className="text-brand inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
            {t.privacyLink}
          </Link>
        </div>

        <p role="alert" className="text-destructive text-sm empty:hidden">
          {state.status === "error" ? state.message : ""}
        </p>
        <button type="submit" disabled={pending} className={`${buttonPrimary} w-full`}>
          {pending ? t.submitting : t.submit}
        </button>
      </form>
    </div>
  );
}
