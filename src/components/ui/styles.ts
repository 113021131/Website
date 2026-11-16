/** Shared class strings for the site's own buttons (48 px touch target, see DESIGN.md §4). */

// Side padding is capped at 5% of the screen width, so on a small phone with large
// text the padding does not grow with the text and push the button off-screen; for
// the same reason the icon may sit above the label when the two don't fit side by side.
export const buttonBase =
  "inline-flex min-h-12 flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-md px-[min(1.25rem,5vw)] py-2 text-center text-base font-semibold " +
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

/**
 * Product card grid. Columns follow the width of the surrounding box measured in
 * rem, so they also respond to the phone's text size: two cards side by side on
 * a normal phone, one per row when text is set very large, up to four on a wide
 * screen. The grid's parent must carry the `@container` class (see CardGrid).
 */
export const cardGridColumns =
  "grid grid-cols-1 gap-3 @min-[17.5rem]:grid-cols-2 @min-[36rem]:grid-cols-3 @min-[52rem]:grid-cols-4";
