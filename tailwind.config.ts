import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plex-arabic)", "Tahoma", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      colors: {
        void: "#0A0D12",
        panel: "#12161F",
        panel2: "#171C27",
        line: "#232935",
        ink: "#EDEFF2",
        muted: "#8B94A3",
        copper: { 400: "#F0B673", 500: "#E0A458", 600: "#C98B3E" },
        signal: { 400: "#7FE3F0", 500: "#4FD1E8", 600: "#33B4CC" },
        success: { 400: "#4ADE93", 600: "#1D7A46" },
        warning: { 400: "#F5C36B", 600: "#B4720F" },
        danger: { 400: "#F2726E", 600: "#B3261E" },
      },
    },
  },
  plugins: [],
};
export default config;
