import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#2B475C",
          50: "#EEF2F5",
          100: "#DCE4EA",
          200: "#B9C9D5",
          300: "#96AEC0",
          400: "#5F7F98",
          500: "#2B475C",
          600: "#243B4C",
          700: "#1D2F3D",
          800: "#16232D",
          900: "#0F171E",
        },
        orange: {
          DEFAULT: "#E66A2C",
          50: "#FDF1EA",
          100: "#FBE3D5",
          200: "#F6C1A3",
          300: "#F19F71",
          400: "#EC833F",
          500: "#E66A2C",
          600: "#C4551F",
          700: "#9C441A",
          800: "#743314",
          900: "#4C220D",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
