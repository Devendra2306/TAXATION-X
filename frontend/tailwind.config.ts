import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "hsl(245, 85%, 65%)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "hsl(190, 90%, 55%)",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "hsl(0, 80%, 60%)",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "hsl(145, 70%, 50%)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "hsla(225, 20%, 30%, 0.5)",
          foreground: "hsl(225, 15%, 65%)",
        },
        card: {
          DEFAULT: "hsla(225, 20%, 16%, 0.6)",
          foreground: "hsl(0, 0%, 95%)",
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
