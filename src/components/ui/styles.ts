/** Shared class strings for the site's own buttons (48 px touch target, see DESIGN.md §4). */

export const buttonBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 py-2 text-base font-semibold " +
  "transition-transform duration-150 ease-out-strong active:scale-[0.98] select-none " +
  "disabled:pointer-events-none disabled:opacity-60";

export const buttonPrimary = `${buttonBase} bg-brand text-brand-foreground hover:bg-brand-hover`;
export const buttonSecondary = `${buttonBase} border border-foreground/70 hover:bg-surface-muted`;
export const buttonOnDark = `${buttonBase} border border-board-accent text-board-foreground hover:bg-brand-hover`;
export const buttonWhatsApp = `${buttonBase} bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp-hover`;
export const buttonWhatsAppOutline = `${buttonBase} border border-whatsapp text-whatsapp hover:bg-surface-muted`;

export const fieldLabel = "block text-sm font-semibold";
export const fieldInput =
  "border-input placeholder:text-muted-foreground mt-1.5 block min-h-12 w-full rounded-md border bg-background px-3 py-2 text-base " +
  "focus-visible:border-brand aria-invalid:border-destructive";
export const fieldHint = "text-muted-foreground mt-1.5 text-sm";
export const fieldError = "text-destructive mt-1.5 text-sm";

export const container = "page-gutter mx-auto w-full max-w-[72rem]";
