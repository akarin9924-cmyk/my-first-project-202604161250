import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "自分専用チャットメモ",
    short_name: "チャットメモ",
    description: "超シンプルな自分専用チャットメモアプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#f8f9fb",
    lang: "ja",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
