"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { buttonPrimary, buttonSecondary, fieldError, fieldHint, fieldInput, fieldLabel } from "@/components/ui/styles";
import type { Dictionary } from "@/i18n";
import { deleteArticle, saveArticle, type ArticleFormState } from "./actions";

export type ArticleFormValues = { title: string; slug: string; excerpt: string; body: string; status: "draft" | "published" };

const initialState: ArticleFormState = { status: "idle", message: "", errors: {} };

export function ArticleForm({
  articleId,
  values,
  t,
}: {
  articleId: number | null;
  values: ArticleFormValues;
  t: Dictionary["admin"]["articles"];
}) {
  const [state, formAction, actionPending] = useActionState(saveArticle.bind(null, articleId), initialState);
  const [transitionPending, startTransition] = useTransition();
  const pending = actionPending || transitionPending;
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const f = t.fields;

  useEffect(() => {
    if (state.status === "saved") toast.success(state.message);
    if (state.status === "error") formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  // Submitted by hand so React does not reset the fields after the action.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  const invalid = (key: keyof ArticleFormState["errors"]) =>
    state.errors[key] ? ({ "aria-invalid": true, "aria-describedby": `article-error-${key}` } as const) : {};
  const error = (key: keyof ArticleFormState["errors"]) =>
    state.errors[key] ? (
      <p id={`article-error-${key}`} className={fieldError}>
        {state.errors[key]}
      </p>
    ) : null;

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4 rounded-lg border bg-background p-4">
        <div>
          <label htmlFor="article-title" className={fieldLabel}>
            {f.title}
          </label>
          <input id="article-title" name="title" defaultValue={values.title} maxLength={200} autoComplete="off" className={fieldInput} {...invalid("title")} />
          {error("title")}
        </div>
        <div>
          <label htmlFor="article-excerpt" className={fieldLabel}>
            {f.excerpt}
          </label>
          <textarea id="article-excerpt" name="excerpt" rows={2} maxLength={300} defaultValue={values.excerpt} className={fieldInput} />
        </div>
        <div>
          <label htmlFor="article-body" className={fieldLabel}>
            {f.body}
          </label>
          <textarea
            id="article-body"
            name="body"
            rows={18}
            defaultValue={values.body}
            spellCheck
            aria-describedby="article-body-hint"
            className={`${fieldInput} font-mono text-[0.9375rem] leading-relaxed`}
            {...invalid("body")}
          />
          {error("body") ?? (
            <p id="article-body-hint" className={fieldHint}>
              {f.bodyHint}
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="article-status" className={fieldLabel}>
              {f.status}
            </label>
            <select id="article-status" name="status" defaultValue={values.status} className={fieldInput}>
              {Object.entries(t.status).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="article-slug" className={fieldLabel}>
              {f.slug}
            </label>
            <input id="article-slug" name="slug" defaultValue={values.slug} autoComplete="off" autoCapitalize="none" spellCheck={false} className={fieldInput} {...invalid("slug")} />
            {error("slug") ?? <p className={fieldHint}>{f.slugHint}</p>}
          </div>
        </div>
        <button type="submit" disabled={pending} className={`${buttonPrimary} w-full sm:w-auto`}>
          {pending ? t.saving : t.save}
        </button>
        <p role="status" className={state.status === "error" ? "text-destructive text-sm" : "sr-only"}>
          {state.message}
        </p>
      </form>

      {articleId !== null ? (
        confirming ? (
          <div role="alertdialog" aria-label={t.delete} tabIndex={-1} ref={(element) => element?.focus()} className="bg-notice text-notice-foreground rounded-lg p-4">
            <p>{t.deleteConfirm}</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => deleteArticle(articleId))}
                className={`${buttonSecondary} bg-destructive border-destructive text-white hover:bg-destructive`}
              >
                {t.delete}
              </button>
              <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={buttonSecondary}>
                {t.deleteCancel}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={`${buttonSecondary} text-destructive border-destructive`}>
            {t.delete}
          </button>
        )
      ) : null}
    </>
  );
}
