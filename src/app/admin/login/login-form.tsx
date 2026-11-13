"use client";

import { useActionState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/i18n";
import { requestLoginLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle", message: "" };

export function LoginForm({ t }: { t: Dictionary["admin"]["login"] }) {
  const [state, formAction, pending] = useActionState(requestLoginLink, initialState);
  const emailRef = useRef<HTMLInputElement>(null);

  // Put the cursor back on the field that needs fixing.
  useEffect(() => {
    if (state.status === "error") emailRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-semibold">
          {t.emailLabel}
        </Label>
        <Input
          id="email"
          ref={emailRef}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          aria-describedby="login-status"
          aria-invalid={state.status === "error"}
          className="border-input h-12 text-base"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-brand text-brand-foreground hover:bg-brand-hover inline-flex h-12 w-full items-center justify-center rounded-md px-5 font-semibold disabled:opacity-60"
      >
        {pending ? t.submitting : t.submit}
      </button>
      <p
        id="login-status"
        role="status"
        className={state.status === "error" ? "text-destructive text-sm" : "text-sm"}
      >
        {state.message}
      </p>
    </form>
  );
}

/** Explains why the visitor was sent back to the login page, when there is a reason. */
export function LoginReason({ t }: { t: Dictionary["admin"]["login"] }) {
  const reason = useSearchParams().get("alasan");
  const message = reason === "akses" ? t.noAccess : reason === "tautan" ? t.linkExpired : null;
  if (!message) return null;
  return (
    <p role="alert" className="bg-notice text-notice-foreground mt-4 rounded-sm px-3 py-2 text-sm">
      {message}
    </p>
  );
}
