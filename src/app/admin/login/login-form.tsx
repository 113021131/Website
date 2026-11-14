"use client";

import { useActionState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { buttonPrimary, buttonSecondary, fieldInput, fieldLabel } from "@/components/ui/styles";
import type { Dictionary } from "@/i18n";
import { requestLoginLink, signInWithPassword, type LoginState } from "./actions";

type LoginCopy = Dictionary["admin"]["login"];
const initialState: LoginState = { status: "idle", message: "" };

function StatusLine({ id, state }: { id: string; state: LoginState }) {
  return (
    <p id={id} role="status" className={state.status === "error" ? "text-destructive text-sm" : "text-sm"}>
      {state.message}
    </p>
  );
}

export function PasswordForm({ t }: { t: LoginCopy }) {
  const [state, formAction, pending] = useActionState(signInWithPassword, initialState);
  const emailRef = useRef<HTMLInputElement>(null);

  // Put the cursor back on the form when something needs fixing.
  useEffect(() => {
    if (state.status === "error") emailRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="login-email" className={fieldLabel}>
          {t.emailLabel}
        </label>
        <input
          id="login-email"
          ref={emailRef}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          aria-describedby="login-status"
          aria-invalid={state.status === "error" || undefined}
          className={fieldInput}
        />
      </div>
      <div>
        <label htmlFor="login-password" className={fieldLabel}>
          {t.passwordLabel}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby="login-status"
          className={fieldInput}
        />
      </div>
      <button type="submit" disabled={pending} className={`${buttonPrimary} w-full`}>
        {pending ? t.submitting : t.submit}
      </button>
      <StatusLine id="login-status" state={state} />
    </form>
  );
}

export function LinkForm({ t }: { t: LoginCopy }) {
  const [state, formAction, pending] = useActionState(requestLoginLink, initialState);

  return (
    <details className="mt-4 border-t pt-2">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">{t.linkTitle}</summary>
      <form action={formAction} className="space-y-3 pb-1" noValidate>
        <p className="text-muted-foreground text-sm">{t.linkLead}</p>
        <div>
          <label htmlFor="link-email" className={fieldLabel}>
            {t.emailLabel}
          </label>
          <input
            id="link-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-describedby="link-status"
            className={fieldInput}
          />
        </div>
        <button type="submit" disabled={pending} className={`${buttonSecondary} w-full`}>
          {pending ? t.linkSubmitting : t.linkSubmit}
        </button>
        <StatusLine id="link-status" state={state} />
      </form>
    </details>
  );
}

/** Explains why the visitor was sent back to the login page, when there is a reason. */
export function LoginReason({ t }: { t: LoginCopy }) {
  const reason = useSearchParams().get("alasan");
  const message = reason === "akses" ? t.noAccess : reason === "tautan" ? t.linkExpired : null;
  if (!message) return null;
  return (
    <p role="alert" className="bg-notice text-notice-foreground mt-4 rounded-sm px-3 py-2 text-sm">
      {message}
    </p>
  );
}
