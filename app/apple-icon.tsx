import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8f9fb",
          color: "#0f172a",
          borderRadius: 36,
          border: "8px solid #e2e8f0",
          fontSize: 52,
          fontWeight: 700
        }}
      >
        メモ
      </div>
    ),
    {
      ...size
    }
  );
}
