import { cn } from "@/lib/utils";

/**
 * Proposed mark (see DESIGN.md §5): an "SM" hallmark cartouche plus the shop name.
 * A placeholder until the owner supplies or approves a logo. TODO_OWNER: logo.
 */
export function Wordmark({
  name,
  tone = "light",
  className,
}: {
  name: string;
  /** "light" sits on a light surface, "dark" on the maroon board. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const stroke = tone === "dark" ? "var(--gold-bright)" : "var(--gold-ink)";
  return (
    <span translate="no" className={cn("inline-flex items-center gap-2.5", className)}>
      <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden="true" className="shrink-0">
        <rect x="0.75" y="0.75" width="28.5" height="20.5" rx="6" fill="none" stroke={stroke} strokeWidth="1.5" />
        <text
          x="15"
          y="15.4"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill={stroke}
          style={{ fontFamily: "var(--font-besley), serif", letterSpacing: "0.04em" }}
        >
          SM
        </text>
      </svg>
      <span className="font-display min-w-0 text-[1.0625rem] leading-tight font-semibold tracking-[-0.01em]">
        {name}
      </span>
    </span>
  );
}
