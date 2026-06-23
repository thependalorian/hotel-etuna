/**
 * Hotel Etuna — Tailwind configuration
 * Design System: v1.1.0 (June 2026). All color hex lives here; use theme utilities in UI.
 *
 * Source of truth for colour = docs/brand/Hotel-Etuna-CI-Guide-Extract.pdf (CI palette).
 * v1.1.0 changes:
 *   - taupe corrected to CI value #A58B72 (was #B58B72)
 *   - `ink` text ramp re-anchored to CI chocolate, WCAG-AA verified (was nude-aliased; nude-700 failed AA on cream)
 *   - surface.scrim added for text-over-photography
 *   - elevation discipline codified: flat browse/ops cards, etuna-elevated/control on floating UI only
 * Full reference: docs/brand/DESIGN_SYSTEM.md
 */

import type { Config } from "tailwindcss";
import daisyui from "daisyui";
import tailwindPlugin from "tailwindcss/plugin";

/** Official CI palette — docs/brand/Hotel-Etuna-CI-Guide-Extract.pdf */
const ci = {
  primary: "#790C19",
  cream: "#F3E8D7",
  secondary: {
    tan: "#DABC92",
    taupe: "#A58B72", // CI-corrected: guide page 3 swatch is #A58B72 (was mis-transcribed #B58B72)
    chocolate: "#4B3428",
    gold: "#D4AF37",
    crimson: "#BA082C",
    // Note: CI page-3 prints a 6th swatch mislabeled "#4B3428" that renders red — a guide typo
    // (chocolate is already swatch 3). Resolved to these 5 secondary tokens; crimson covers the red accent.
  },
  accent: {
    ochre: "#9A7D43",
    gold: "#C6A46A",
    offWhite: "#FAF6F0",
    forest: "#5E6651",
    sage: "#9BAE8A",
    terracotta: "#6D3722",
    rose: "#C89B95",
  },
} as const;

/** Nude Foundation — digital UI extension (warm surfaces) */
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
  charlotte: ci.accent.gold,
  champagne: ci.cream,
  rose: ci.accent.rose,
  bronze: ci.accent.ochre,
  gold: ci.secondary.gold,
} as const;

const sage = {
  DEFAULT: ci.accent.sage,
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

/** Surfaces — CI off-white / cream hierarchy */
const surface = {
  background: ci.accent.offWhite,
  canvas: ci.accent.offWhite,
  foreground: ci.secondary.chocolate,
  muted: ci.cream,
  elevated: "#ffffff",
  card: "#ffffff",
  header: "#ffffff",
  input: "#ffffff",
  hover: nude[100],
  sidebar: "#ffffff",
  placeholder: nude[200],
  skeleton: nude[300],
  /** Scrim for text overlaid on photography — espresso-tinted, never pure black (Airbnb gem, CI-warmed) */
  scrim: "rgba(42, 29, 21, 0.55)",
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
        ci,
        nude,
        luxury,
        sage,
        rustic,
        semantic,
        surface,
        /** Legacy aliases → map to DS tokens for gradual migration */
        /**
         * Body / ink text ramp — CI-chocolate-anchored warm neutrals (single source of truth
         * for text color). Resolves the prior §9 contradiction (nude-alias vs text-nude-900 vs
         * terracotta). WCAG contrast verified against the three light surfaces (offwhite/cream/white):
         *   900 #4B3428 (CI chocolate) 9.5:1 cream  — body, headings
         *   800 #5A4133                7.7:1 cream  — strong text
         *   700 #6E5343                5.8:1 cream  — secondary text (AA normal, all surfaces)
         *   600 #785B49                5.1:1 cream  — muted text     (AA normal, all surfaces)
         *   500 #927862                3.4:1 cream  — tertiary / large / UI only (AA large)
         *   400/300                                 — decorative / dividers, not text
         * (Legacy nude-700 #9d5a3a was only 4.38:1 on cream — failed AA for normal text.)
         * `nude-*` now scopes to surfaces/borders; prefer `text-ink-*` for all type.
         */
        ink: {
          950: "#2A1D15",
          900: "#4B3428",
          800: "#5A4133",
          700: "#6E5343",
          600: "#785B49",
          500: "#927862",
          400: "#B6A493",
          300: "#D2C6BA",
        },
        /** shadcn-style ring offset token */
        background: surface.background,
        foreground: surface.foreground,
        brand: {
          primary: ci.primary,
          deep: ci.secondary.chocolate,
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
          primary: ci.primary,
          secondary: ci.secondary.chocolate,
          vip: nude[500],
          luxury: ci.secondary.gold,
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
        caption: ["0.6875rem", { lineHeight: "1.29", letterSpacing: "0.04em" }],
        body: ["0.875rem", { lineHeight: "1.43", letterSpacing: "-0.008em" }],
        "heading-sm": ["1.25rem", { lineHeight: "1.25", letterSpacing: "-0.011em" }],
        heading: ["1.375rem", { lineHeight: "1.23", letterSpacing: "-0.014em" }],
        display: ["1.75rem", { lineHeight: "1.18", letterSpacing: "-0.035em" }],
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
        "etuna-page": "110rem",
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
        "section-gap": "3rem",
        "card-pad": "0.75rem",
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
        "etuna-badge": "4px",
        "etuna-button": "8px",
        "etuna-input": "14px",
        "etuna-card": "20px",
        "etuna-pill": "32px",
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
        /**
         * Warm card/CTA elevation — LEGACY / marketing-hero use only.
         * Locked browse + ops direction: listing tiles and dashboard cards carry NO shadow
         * (border + surface colour do the work). Reserve these warm shadows for marketing hero
         * moments; do not reintroduce them on `.etuna-listing-card` / `.dashboard-card`.
         */
        card: "0 4px 16px rgba(212, 175, 140, 0.2)",
        "card-hover": "0 8px 24px rgba(212, 175, 140, 0.25)",
        /**
         * Airy UI elevation — the ONLY shadows allowed on floating surfaces
         * (modals, popovers, dropdowns, sticky search/booking panels). Adapted from the
         * Airbnb three-/two-value stack. Flat browse + ops cards never use these.
         */
        "etuna-elevated":
          "0 0 0 1px rgba(0,0,0,0.02), 0 2px 6px 0 rgba(0,0,0,0.04), 0 4px 8px 0 rgba(0,0,0,0.1)",
        "etuna-control":
          "0 0 0 1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.16)",
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
          primary: ci.primary,
          "primary-content": ci.cream,
          secondary: ci.secondary.chocolate,
          "secondary-content": ci.cream,
          accent: ci.accent.ochre,
          "accent-content": ci.cream,
          neutral: ci.secondary.chocolate,
          "neutral-content": ci.cream,
          "base-100": ci.accent.offWhite,
          "base-200": ci.cream,
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
