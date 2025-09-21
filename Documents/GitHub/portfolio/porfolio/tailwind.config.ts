import type { Config } from 'tailwindcss';

type DaisyUIConfig = Config & {
  daisyui: {
    themes: Array<{
      [key: string]: {
        [key: string]: string;
      };
    }>;
  };
};

const config: DaisyUIConfig = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Display"', 'Inter', 'sans-serif'],  // Futuristic & system fallback :contentReference[oaicite:6]{index=6}
      },
      colors: {
        // Neon‐glass palette via CSS variables :contentReference[oaicite:7]{index=7}
        glass: 'rgba(255, 255, 255, 0.15)',
        'neon-red': 'hsl(350, 100%, 55%)',
        'neon-blue': 'hsl(210, 100%, 65%)',
        primary: '#FF0080',
        secondary: '#7928CA',
      },
      boxShadow: {
        glow: '0 0 20px var(--tw-shadow-color)',           // Reusable neon glow :contentReference[oaicite:8]{index=8}
      },
      dropShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',             // Soft frosted shadow :contentReference[oaicite:9]{index=9}
      },
      backdropBlur: {
        md: '12px',                                        // For stronger glassmorphism :contentReference[oaicite:10]{index=10}
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
      },
      keyframes: {
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),                         // Optional: better form styles :contentReference[oaicite:11]{index=11}
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          primary: '#FF0080',
          secondary: '#7928CA',
          accent: '#00FF00',
          neutral: '#2A2A2A',
          'base-100': '#1A1A1A',
          'base-200': '#242424',
          'base-300': '#2A2A2A',
        },
      },
    ],
  },
}

export default config;
