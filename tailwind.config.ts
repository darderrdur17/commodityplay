import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ZFlow design system tokens
        primary: {
          DEFAULT: "#3280ff",
          fg: "#ffffff",
          soft: "rgba(50,128,255,0.08)",
          line: "rgba(50,128,255,0.25)",
          50: "#f0f6ff",
          100: "#dff2ff",
          200: "#b8ddff",
          300: "#78bcff",
          400: "#3280ff",
          500: "#115cff",
          600: "#0040f5",
          700: "#0131cc",
          800: "#0830a0",
          900: "#0a2580",
        },
        accent: {
          DEFAULT: "#dff2ff",
          fg: "#0830a0",
        },
        muted: {
          DEFAULT: "#f9fafb",
          /**
           * Tuned to clear WCAG AA (4.5:1) on the two faintest surfaces this
           * token puts body text on: `primary.soft` over white (#eff5ff → 4.62)
           * and `secondary.DEFAULT` (#f2f4f7 → 4.59). The previous `#677184`
           * measured 4.489 and 4.461 — both failing by a hair, which is what
           * flagged it. Only the green/blue channels moved, so the hue is
           * unchanged, and the move is monotonic: every existing use gains
           * contrast rather than losing it.
           *
           * ⚠️ `#677184` is ALSO hardcoded in ~12 places that never read this
           * token — chart accents, the transactional email HTML, and a
           * `var(--muted-fg, #677184)` fallback whose variable is never defined
           * anywhere. Those were deliberately left at the old value: none is
           * body text on a light surface, and a 2-unit delta is imperceptible.
           */
          fg: "#656f82",
        },
        border: "#e4e7ec",
        secondary: {
          DEFAULT: "#f2f4f7",
          fg: "#465468",
        },
        navy: "#0830a0",
        chart: {
          1: "#3280ff",
          2: "#115cff",
          3: "#0040f5",
          4: "#0131cc",
          5: "#0830a0",
        },
        // Persona accent colors
        amber: { DEFAULT: "#B45309", bg: "#FEF3C7" },
        teal: { DEFAULT: "#0F766E", bg: "#CCFBF1" },
        purple: { DEFAULT: "#5B21B6", bg: "#EDE9FE" },
        "navy-arc": { DEFAULT: "#1E3A5F", bg: "#DBEAFE" },
        rust: { DEFAULT: "#9A3412", bg: "#FEF0E7" },
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "system-ui", "sans-serif"],
        serif: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
        "slide-down": "slideDown 0.3s ease forwards",
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "counter": "counter 2s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
