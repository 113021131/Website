export type JewelKind = "cincin" | "kalung" | "gelang" | "anting" | "liontin" | "rantai" | "mas-kawin" | "perhiasan-anak";

const KINDS: readonly string[] = ["cincin", "kalung", "gelang", "anting", "liontin", "rantai", "mas-kawin", "perhiasan-anak"];

export function toJewelKind(slug: string | null | undefined): JewelKind {
  return slug && KINDS.includes(slug) ? (slug as JewelKind) : "cincin";
}

/** Neutral line drawings: category icons, and the stand-in when a product has no photo. */
export function JewelArt({ kind, className }: { kind: JewelKind; className?: string }) {
  const common = { fill: "none", stroke: "var(--gold-ink)", strokeWidth: 2.5, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      {kind === "cincin" ? (
        <>
          <circle cx="40" cy="48" r="20" {...common} />
          <polygon points="40,14 31,24 40,34 49,24" {...common} strokeLinejoin="round" />
        </>
      ) : null}
      {kind === "mas-kawin" ? (
        <>
          <circle cx="31" cy="42" r="17" {...common} />
          <circle cx="49" cy="42" r="17" {...common} />
        </>
      ) : null}
      {kind === "kalung" ? (
        <>
          <path d="M14 14 Q40 74 66 14" {...common} />
          <circle cx="40" cy="51" r="6" {...common} />
        </>
      ) : null}
      {kind === "rantai" ? (
        <>
          <path d="M14 14 Q40 78 66 14" {...common} />
          <path d="M22 14 Q40 60 58 14" {...common} strokeWidth={1.5} />
        </>
      ) : null}
      {kind === "liontin" ? (
        <>
          <path d="M26 12 L40 30 L54 12" {...common} strokeLinejoin="round" />
          <path d="M40 30 C26 44 30 64 40 66 C50 64 54 44 40 30 Z" {...common} strokeLinejoin="round" />
        </>
      ) : null}
      {kind === "gelang" ? (
        <>
          <ellipse cx="40" cy="40" rx="27" ry="17" {...common} />
          <ellipse cx="40" cy="40" rx="19" ry="10" {...common} strokeWidth={1.5} />
        </>
      ) : null}
      {kind === "perhiasan-anak" ? (
        <>
          <ellipse cx="40" cy="42" rx="20" ry="13" {...common} />
          <circle cx="40" cy="22" r="5" {...common} />
        </>
      ) : null}
      {kind === "anting" ? (
        <>
          <path d="M27 14 v14" {...common} />
          <circle cx="27" cy="40" r="11" {...common} />
          <path d="M53 14 v14" {...common} />
          <circle cx="53" cy="40" r="11" {...common} />
        </>
      ) : null}
    </svg>
  );
}
