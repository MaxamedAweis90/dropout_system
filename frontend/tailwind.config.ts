import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07111f",
          900: "#0c1727",
          800: "#122138",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#4f46e5",
          600: "#4338ca",
          700: "#3730a3",
        },
        accent: {
          500: "#14b8a6",
          600: "#0f766e",
        },
      },
      boxShadow: {
        glow: "0 16px 40px rgba(79, 70, 229, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
