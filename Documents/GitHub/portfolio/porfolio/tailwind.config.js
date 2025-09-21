/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#fdfaf6',
          100: '#f9f2e9',
          200: '#f2e4d3',
          300: '#e8d1b9',
          400: '#d9b895',
          500: '#c99e73', 
          600: '#b88556', // Main Primary
          700: '#9d6a43',
          800: '#845636',
          900: '#6f482f',
          950: '#402518',
        },
        gray: colors.stone,
        // BuffrSign chart colors
        chart: {
          1: '#3b82f6', // Digital Signatures (Primary)
          2: '#10b981', // Compliance & Success
          3: '#f59e0b', // Warnings & Notifications
          4: '#8b5cf6', // AI Features & Intelligence
          5: '#ef4444', // Security & Alerts
        },
        // CSS Variables for BuffrSign
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "light", 
      "dark",
      {
        buffrlend: {
          "primary": "#3b82f6", // Blue
          "secondary": "#06b6d4", // Cyan
          "accent": "#14b8a6", // Teal
          "neutral": "#1e293b", // Slate
          "base-100": "#0f172a", // Dark slate
          "info": "#0ea5e9", // Sky blue
          "success": "#10b981", // Emerald
          "warning": "#0ea5e9", // Sky blue instead of amber
          "error": "#ef4444", // Red
        },
        buffrhost: {
          "primary": "#b88556", // sand-600
          "primary-focus": "#9d6a43", // sand-700
          "primary-content": "#ffffff",
          
          "secondary": "#e8d1b9", // sand-300
          "secondary-focus": "#f2e4d3", // sand-200
          "secondary-content": "#6f482f", // sand-900

          "base-100": "#ffffff",
          "base-200": "#f9fafb", // gray-50
          "base-300": "#f3f4f6", // gray-100
          "base-content": "#1f2937", // gray-800
        },
        buffrsign: {
          "primary": "#3b82f6", // #3b82f6 - BuffrSign Blue
          "primary-content": "#fafafa",
          "secondary": "#8b5cf6", // #8b5cf6 - AI Purple
          "secondary-content": "#fafafa",
          "accent": "#10b981", // #10b981 - Compliance Green
          "accent-content": "#fafafa",
          "neutral": "#f5f5f5",
          "neutral-content": "#737373",
          "base-100": "#ffffff", // #ffffff - White background
          "base-200": "#f5f5f5", // #f5f5f5 - Light gray
          "base-300": "#e5e7eb", // #e5e7eb - Border color
          "base-content": "#0a0a0a", // #0a0a0a - Dark text
          "info": "#8b5cf6", // #8b5cf6 - AI Purple
          "success": "#10b981", // #10b981 - Compliance Green
          "warning": "#f59e0b", // #f59e0b - Warning Orange
          "error": "#ef4444", // #ef4444 - Security Red
        },
        "buffrsign-dark": {
          "primary": "#60a5fa", // Brighter blue for dark mode
          "primary-content": "#fafafa",
          "secondary": "#8b5cf6", // #8b5cf6 - AI Purple
          "secondary-content": "#fafafa",
          "accent": "#10b981", // #10b981 - Compliance Green
          "accent-content": "#fafafa",
          "neutral": "#262626",
          "neutral-content": "#a3a3a3",
          "base-100": "#0a0a0a", // #0a0a0a - Dark background
          "base-200": "#262626", // #262626 - Dark gray
          "base-300": "#262626", // #262626 - Dark border
          "base-content": "#fafafa", // #fafafa - Light text
          "info": "#8b5cf6", // #8b5cf6 - AI Purple
          "success": "#10b981", // #10b981 - Compliance Green
          "warning": "#f59e0b", // #f59e0b - Warning Orange
          "error": "#ef4444", // #ef4444 - Security Red
        },
      },
    ],
  },
}

