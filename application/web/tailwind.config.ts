import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f3f1ff",
          100: "#ebe5ff",
          200: "#d9ceff",
          300: "#bea6ff",
          400: "#9f75ff",
          500: "#6C5CE7",
          600: "#6741d9",
          700: "#5932b5",
          800: "#4a2994",
          900: "#3d2579",
        },
        secondary: {
          50: "#e6fff7",
          100: "#b3ffe6",
          200: "#80ffd5",
          300: "#4dffc4",
          400: "#1affb3",
          500: "#00B894",
          600: "#009977",
          700: "#00735a",
          800: "#004d3c",
          900: "#00261e",
        },
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#FDCB6E",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans JP"',
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
