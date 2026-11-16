import { describe, expect, it } from "vitest";
import { ownerValue } from "@/config/owner";
import { formatDateTime, formatIdr, formatIdrPlain, formatWeight, isPriceStale } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const nbsp = " ";

describe("formatIdr", () => {
  it("uses Indonesian thousands separators and no decimals", () => {
    expect(formatIdr(2_346_000)).toBe(`Rp${nbsp}2.346.000`);
  });

  it("handles Rp 100 juta+", () => {
    expect(formatIdr(169_032_000)).toBe(`Rp${nbsp}169.032.000`);
    expect(formatIdrPlain(169_032_000)).toBe("169.032.000");
  });
});

describe("formatWeight", () => {
  it("uses a decimal comma and trims trailing zeros", () => {
    expect(formatWeight(0.1)).toBe(`0,1${nbsp}g`);
    expect(formatWeight("12.500")).toBe(`12,5${nbsp}g`);
    expect(formatWeight(3)).toBe(`3${nbsp}g`);
  });
});

describe("formatDateTime", () => {
  it("shows shop-local time with the WIB label", () => {
    // 02:30 UTC is 09:30 in Jakarta (UTC+7).
    expect(formatDateTime("2026-11-14T02:30:00Z")).toBe("14 Nov 2026 09:30 WIB");
  });

  it("crosses midnight correctly", () => {
    expect(formatDateTime("2026-12-31T18:05:00Z")).toBe("01 Jan 2027 01:05 WIB");
  });

  it("supports other Indonesian time zones", () => {
    expect(formatDateTime("2026-11-14T02:30:00Z", "Asia/Makassar")).toBe("14 Nov 2026 10:30 WITA");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatDateTime("not a date")).toBe("");
  });
});

describe("isPriceStale", () => {
  const updatedAt = "2026-11-14T02:00:00Z";
  const updatedMs = new Date(updatedAt).getTime();
  const hour = 60 * 60 * 1000;

  it("is fresh within 24 hours", () => {
    expect(isPriceStale(updatedAt, updatedMs + 23 * hour)).toBe(false);
    expect(isPriceStale(updatedAt, updatedMs + 24 * hour)).toBe(false);
  });

  it("is stale after 24 hours", () => {
    expect(isPriceStale(updatedAt, updatedMs + 24 * hour + 1)).toBe(true);
  });

  it("treats an unreadable timestamp as stale", () => {
    expect(isPriceStale("", updatedMs)).toBe(true);
  });
});

describe("ownerValue", () => {
  it("treats TODO_OWNER placeholders and blanks as missing", () => {
    expect(ownerValue("TODO_OWNER")).toBeNull();
    expect(ownerValue("TODO_OWNER: alamat")).toBeNull();
    expect(ownerValue("  ")).toBeNull();
    expect(ownerValue(null)).toBeNull();
  });

  it("returns real values trimmed", () => {
    expect(ownerValue("  Jl. Contoh No. 1 ")).toBe("Jl. Contoh No. 1");
  });
});

describe("buildWhatsAppUrl", () => {
  it("returns null while the number is a placeholder", () => {
    expect(buildWhatsAppUrl("TODO_OWNER", "Halo")).toBeNull();
    expect(buildWhatsAppUrl(null, "Halo")).toBeNull();
  });

  it("normalises a local 08… number to 62… and encodes the message", () => {
    expect(buildWhatsAppUrl("0812-3456-7890", "Halo, saya mau tanya")).toBe(
      "https://wa.me/6281234567890?text=Halo%2C%20saya%20mau%20tanya",
    );
  });

  it("keeps a number that already has the country code", () => {
    expect(buildWhatsAppUrl("+62 812 3456 7890", "Halo")).toBe("https://wa.me/6281234567890?text=Halo");
    // A number outside Indonesia keeps its own country code (a Taiwan mobile here).
    expect(buildWhatsAppUrl("+886 912 345 678", "Halo")).toBe("https://wa.me/886912345678?text=Halo");
  });
});
