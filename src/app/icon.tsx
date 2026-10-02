import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Placeholder app icon: a blank postcard.
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f3ea" }}>
        <div style={{ width: 400, height: 270, background: "#c8553d", borderRadius: 16, border: "14px solid white", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }} />
      </div>
    ),
    size,
  );
}
