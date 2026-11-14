"use client";

import { MessageCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { buttonOnDark, buttonWhatsApp, buttonWhatsAppOutline } from "@/components/ui/styles";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const VARIANTS = {
  solid: buttonWhatsApp,
  outline: buttonWhatsAppOutline,
  "outline-on-dark": buttonOnDark,
} as const;

/**
 * The site's main call to action. Opens WhatsApp with a prefilled message and
 * records a `whatsapp_click` event. While the shop's number is still a
 * TODO_OWNER placeholder it says so instead of linking nowhere.
 */
export function WhatsAppButton({
  number,
  message,
  label,
  missingLabel,
  placement,
  product,
  variant = "solid",
  className,
}: {
  number: string | null;
  message: string;
  label: string;
  missingLabel: string;
  /** Where on the site the button sits, for analytics (e.g. "home_hero"). */
  placement: string;
  product?: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const url = buildWhatsAppUrl(number, message);
  const classes = cn(VARIANTS[variant], className);
  const content = (
    <>
      <MessageCircleIcon className="size-5 shrink-0" aria-hidden="true" />
      {label}
    </>
  );

  if (!url) {
    return (
      <button type="button" className={classes} onClick={() => toast.info(missingLabel)}>
        {content}
      </button>
    );
  }
  return (
    <a
      className={classes}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track({ name: "whatsapp_click", props: product ? { placement, product } : { placement } })}
    >
      {content}
    </a>
  );
}
