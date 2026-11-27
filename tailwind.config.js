const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff4ff",
          100: "#dbe6fe",
          200: "#bfd3fe",
          300: "#93b4fd",
          400: "#6090fa",
          500: "#3b6cf6",
          600: "#2550eb",
          700: "#1d3fd8",
          800: "#1e35af",
          900: "#0f1f5c",
          950: "#0a1440"
        },
        gold: {
          50: "#fbf8ee",
          100: "#f5edd0",
          200: "#ecdba3",
          300: "#e1c36f",
          400: "#d6aa45",
          500: "#c8923a",
          600: "#b0742f",
          700: "#8e5829"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-display)", ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06)",
        lift: "0 8px 30px rgba(15,23,42,.12)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
