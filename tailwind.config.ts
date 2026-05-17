/**
 * Buffr Host — Tailwind configuration
 * Design System: v1.0.0 (January 2026). All color hex lives here; use theme utilities in UI.
 */

import type { Config } from "tailwindcss";
import daisyui from "daisyui";
import tailwindPlugin from "tailwindcss/plugin";

/** Nude Foundation — exact palette from Design System v1.0.0 */
const nude = {
  50: "#fef7f0",
  100: "#fceee0",
  200: "#f8dcc0",
  300: "#f2c49f",
  400: "#e8a87a",
  500: "#d18b5c",
  600: "#b8704a",
  700: "#9d5a3a",
  800: "#7d452e",
  900: "#5d3322",
} as const;

const luxury = {
  charlotte: "#d4a574",
  champagne: "#f7e7ce",
  rose: "#e8b4a0",
  bronze: "#cd853f",
  gold: "#d4af37",
} as const;

/** Hotel Etuna brand accents */
const khaki = {
  50: "#faf6f0",
  100: "#f3ebdc",
  200: "#e8dcc4",
  300: "#d9c9a8",
  400: "#c9b38c",
  sand: "#c4a97d",
  600: "#b8955a",
  700: "#9a7d43",
} as const;

const terracotta = {
  700: "#a85a38",
  800: "#8b4a2e",
  900: "#6d3722",
} as const;

const sage = {
  DEFAULT: "#9bae8a",
} as const;

const rustic = {
  DEFAULT: "#480404",
  50: "#fdf2f2",
  100: "#fde8e8",
  200: "#fbd0d0",
  300: "#f7a8a8",
  400: "#f17070",
  500: "#e54545",
  600: "#c53030",
  700: "#9b2020",
  800: "#822222",
  900: "#480404",
} as const;

const semantic = {
  success: "#22c55e",
  "success-light": "#dcfce7",
  "success-dark": "#15803d",
  warning: "#f59e0b",
  "warning-light": "#fef3c7",
  "warning-dark": "#b45309",
  error: "#ef4444",
  "error-light": "#fee2e2",
  "error-dark": "#b91c1c",
  info: "#0ea5e9",
  "info-light": "#e0f2fe",
  "info-dark": "#0369a1",
} as const;

/** Surfaces — Design System §2 */
const surface = {
  background: nude[50],
  canvas: nude[50],
  foreground: nude[800],
  muted: nude[200],
  elevated: "#ffffff",
  card: "#ffffff",
  input: "#ffffff",
  hover: nude[100],
  sidebar: nude[100],
} as const;

const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "2rem",
        },
        screens: {
          "2xl": "1400px",
        },
      },
      colors: {
        nude,
        luxury,
        khaki,
        terracotta,
        sage,
        rustic,
        semantic,
        surface,
        /** Legacy aliases → map to DS tokens for gradual migration */
        /** Body / ink text ramp — maps to nude scale for WCAG AA on warm surfaces */
        ink: {
          950: nude[900],
          900: nude[900],
          800: nude[800],
          700: nude[700],
          600: nude[600],
          500: nude[600],
          400: nude[500],
          300: nude[400],
        },
        /** shadcn-style ring offset token */
        background: surface.background,
        foreground: surface.foreground,
        brand: {
          50: nude[50],
          100: nude[100],
          200: nude[200],
          300: nude[300],
          400: nude[400],
          500: nude[500],
          600: nude[600],
          700: nude[700],
          800: nude[800],
          900: nude[900],
        },
        cta: {
          primary: khaki[600],
          secondary: khaki[700],
          vip: nude[500],
          luxury: "#d4af37",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: [
          "var(--font-playfair-display)",
          "Playfair Display",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        body: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        signature: ["var(--font-dancing-script)", "Dancing Script", "cursive"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.025em" }],
        sm: ["0.875rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        base: ["1rem", { lineHeight: "1.5", letterSpacing: "0" }],
        lg: ["1.125rem", { lineHeight: "1.625", letterSpacing: "-0.01em" }],
        xl: ["1.25rem", { lineHeight: "1.25", letterSpacing: "-0.025em" }],
        "2xl": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.025em" }],
        "3xl": ["1.875rem", { lineHeight: "1.25", letterSpacing: "-0.025em" }],
        "4xl": ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.025em" }],
        "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.025em" }],
        "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.025em" }],
      },
      maxWidth: {
        "prose-sm": "45ch",
        "prose-lg": "75ch",
        "container-xs": "20rem",
        "container-sm": "24rem",
        "container-md": "28rem",
        "container-lg": "32rem",
        "container-xl": "36rem",
        "container-2xl": "42rem",
      },
      spacing: {
        "touch-mobile": "44px",
        "touch-desktop": "32px",
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        "nude-soft": "0 2px 8px rgba(212, 175, 140, 0.15)",
        "nude-medium": "0 4px 16px rgba(212, 175, 140, 0.2)",
        "nude-strong": "0 8px 24px rgba(212, 175, 140, 0.25)",
        "nude-primary": "0 4px 14px 0 rgba(184, 112, 74, 0.25)",
        "luxury-soft": "0 2px 12px rgba(212, 175, 55, 0.1)",
        "luxury-medium": "0 4px 20px rgba(212, 175, 55, 0.15)",
        "luxury-strong": "0 8px 32px rgba(212, 175, 55, 0.2)",
        /** Card / CTA elevation aliases */
        card: "0 4px 16px rgba(212, 175, 140, 0.2)",
        "card-hover": "0 8px 24px rgba(212, 175, 140, 0.25)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
        slower: "500ms",
      },
      transitionTimingFunction: {
        "in-expo": "cubic-bezier(0.4, 0, 1, 1)",
        "out-expo": "cubic-bezier(0, 0, 0.2, 1)",
        "in-out-expo": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "fade-out": "fadeOut 150ms ease-in forwards",
        "slide-up": "slideUp 200ms ease-out",
        "slide-down": "slideDown 200ms ease-out",
        "scale-in": "scaleIn 200ms ease-out",
        "gentle-lift": "gentleLift 300ms ease-out",
        "ai-pulse": "aiPulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "spin-slow": "spin 2s linear infinite",
        "bounce-subtle": "bounceSubtle 1.2s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeOut: { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        gentleLift: {
          "0%": { transform: "scale(1) translateY(0)" },
          "50%": { transform: "scale(1.02) translateY(-2px)" },
          "100%": { transform: "scale(1) translateY(0)" },
        },
        aiPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(212, 165, 116, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(212, 165, 116, 0.5)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
      },
    },
  },
  plugins: [
    daisyui,
    tailwindPlugin(({ addUtilities }) => {
      addUtilities({
        ".scrollbar-thin": {
          "scrollbar-width": "thin",
          "scrollbar-color": `${nude[300]} transparent`,
        },
      });
    }),
  ],
  daisyui: {
    themes: [
      {
        hoteletuna: {
          primary: khaki[600],
          "primary-content": nude[50],
          secondary: khaki[700],
          "secondary-content": nude[50],
          accent: khaki.sand,
          "accent-content": nude[900],
          neutral: terracotta[900],
          "neutral-content": nude[100],
          "base-100": surface.background,
          "base-200": nude[100],
          "base-300": nude[200],
          "base-content": nude[900],
          info: semantic["info-light"],
          success: semantic["success-light"],
          warning: semantic["warning-light"],
          error: semantic["error-light"],
        },
      },
    ],
    defaultTheme: "hoteletuna",
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
} as Config;

export default config;
