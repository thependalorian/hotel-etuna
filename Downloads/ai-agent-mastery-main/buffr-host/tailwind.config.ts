/**
 * Tailwind CSS Configuration - Unified Design System
 * 
 * Purpose: Comprehensive design tokens combining mobile-first approach,
 * emotional design patterns, and accessibility best practices
 * Location: /tailwind.config.ts
 * 
 * Version: 3.11.0 - Unified Mobile-First Design System
 * Last Updated: February 2026
 */

import type { Config } from "tailwindcss";
import daisyui from "daisyui";

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
      colors: {
        surface: {
          canvas: "var(--surface-canvas)",
          panel: "var(--surface-panel)",
          strong: "var(--surface-panel-strong)",
          muted: "var(--surface-muted)",
          sidebar: "var(--surface-sidebar)",
        },
        ink: {
          950: "var(--ink-950)",
          900: "var(--ink-900)",
          800: "var(--ink-800)",
          700: "var(--ink-700)",
          600: "var(--ink-600)",
          500: "var(--ink-500)",
          400: "var(--ink-400)",
          300: "var(--ink-300)",
        },
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
        },
        nude: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
          950: "var(--ink-950)",
        },
        luxury: {
          charlotte: "var(--brand-400)",
          champagne: "var(--brand-100)",
          rose: "#d8a08c",
          bronze: "var(--brand-600)",
        },
        semantic: {
          success: "#22C55E",
          "success-light": "#DCFCE7",
          "success-dark": "#15803D",
          warning: "#F59E0B",
          "warning-light": "#FEF3C7",
          "warning-dark": "#B45309",
          error: "#EF4444",
          "error-light": "#FEE2E2",
          "error-dark": "#B91C1C",
          info: "#0EA5E9",
          "info-light": "#E0F2FE",
          "info-dark": "#0369A1",
        },
      },
      fontFamily: {
        display: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        signature: ["Dancing Script", "cursive"],
      },
      fontSize: {
        "5xl": ["3rem", { lineHeight: "1.1" }],
        "4xl": ["2.25rem", { lineHeight: "1.1" }],
        "3xl": ["1.875rem", { lineHeight: "1.25" }],
        "2xl": ["1.5rem", { lineHeight: "1.25" }],
        xl: ["1.25rem", { lineHeight: "1.25" }],
      },
      spacing: {
        "0.5": "0.125rem",
        "1.5": "0.375rem",
        "2.5": "0.625rem",
        "3.5": "0.875rem",
        "touch-mobile": "44px",
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        "nude-soft": "0 2px 8px rgba(212, 175, 140, 0.15)",
        "nude-medium": "0 4px 16px rgba(212, 175, 140, 0.2)",
        "nude-strong": "0 8px 24px rgba(212, 175, 140, 0.25)",
        "luxury-soft": "0 2px 12px rgba(212, 175, 55, 0.1)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        focus: "var(--shadow-focus)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 200ms ease-out",
        "slide-down": "slideDown 200ms ease-out",
        "scale-in": "scaleIn 200ms ease-out",
        "gentle-lift": "gentleLift 300ms ease-out",
        "ai-pulse": "aiPulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideDown: { "0%": { transform: "translateY(-10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        scaleIn: { "0%": { transform: "scale(0.95)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        gentleLift: { "0%": { transform: "scale(1) translateY(0)" }, "50%": { transform: "scale(1.02) translateY(-2px)" }, "100%": { transform: "scale(1) translateY(0)" } },
        aiPulse: { "0%, 100%": { boxShadow: "0 0 20px rgba(212, 165, 116, 0.3)" }, "50%": { boxShadow: "0 0 30px rgba(212, 165, 116, 0.5)" } },
        shimmer: { "0%": { backgroundPosition: "-1000px 0" }, "100%": { backgroundPosition: "1000px 0" } },
      },
    },
  },
  plugins: [daisyui],
  // DaisyUI plugin options (not in Tailwind Config type; see https://daisyui.com/docs/config/)
  daisyui: {
    themes: [
      {
        buffr: {
          primary: "#a96332",
          "primary-content": "#ffffff",
          secondary: "#0f766e",
          "secondary-content": "#ffffff",
          accent: "#d9a76f",
          "accent-content": "#241711",
          neutral: "#33231a",
          "neutral-content": "#fffaf3",
          "base-100": "#fffaf3",
          "base-200": "#f1e8da",
          "base-300": "#e4d6c6",
          "base-content": "#33231a",
          info: "#0EA5E9",
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
} as Config;

export default config;