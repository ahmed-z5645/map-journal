import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f3ea" }}>
        <div style={{ width: 140, height: 95, background: "#c8553d", borderRadius: 6, border: "5px solid white" }} />
      </div>
    ),
    size,
  );
}
