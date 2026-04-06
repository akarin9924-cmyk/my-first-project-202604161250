import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        priority: {
          high: "#ef4444",
          medium: "#f59e0b",
          low: "#22c55e"
        }
      }
    }
  },
  plugins: []
};

export default config;
