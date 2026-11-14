import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/owner";

export const alt = "Toko Emas Sinar Mas: harga emas hari ini dan perhiasan emas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share image: the brand on the maroon board. Product pages use their own photo. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "#5e0f1f",
          color: "#ffffff",
          fontFamily: "serif",
        }}
      >
        <div style={{ width: 120, height: 8, background: "#e0b341", marginBottom: 40 }} />
        <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>{siteConfig.name}</div>
        <div style={{ fontSize: 44, marginTop: 28, color: "#f0cf7a" }}>Harga emas hari ini dan perhiasan emas</div>
      </div>
    ),
    size,
  );
}
