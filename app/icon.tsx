import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 96,
          border: "16px solid #e2e8f0",
          fontSize: 120,
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
