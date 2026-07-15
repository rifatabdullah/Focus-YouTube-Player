import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0a0a0a",
        ink: "#f2f2f0",
        accent: "#d4a24c",
      },
    },
  },
  plugins: [],
};

export default config;
