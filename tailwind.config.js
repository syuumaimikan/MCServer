/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"SF Pro"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      colors: {
        apple: {
          blue: '#007AFF',
          indigo: '#5856D6',
          purple: '#AF52DE',
          pink: '#FF2D55',
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          green: '#34C759',
          mint: '#00C7BE',
          teal: '#30B0C7',
          cyan: '#32ADE6',
          gray: {
            50: '#FBFBFD',
            100: '#F5F5F7',
            200: '#E5E5EA',
            300: '#D1D1D6',
            400: '#C7C7CC',
            500: '#AEAEB2',
            600: '#8E8E93',
            700: '#636366',
            800: '#3A3A3C',
            850: '#2C2C2E',
            900: '#1C1C1E',
            950: '#121214',
          }
        },
        macos: {
          sidebar: {
            light: 'rgba(246, 246, 246, 0.75)',
            dark: 'rgba(30, 30, 32, 0.75)',
          },
          card: {
            light: 'rgba(255, 255, 255, 0.85)',
            dark: 'rgba(40, 40, 44, 0.65)',
          },
          border: {
            light: 'rgba(0, 0, 0, 0.08)',
            dark: 'rgba(255, 255, 255, 0.12)',
          }
        }
      },
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'apple-md': '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'apple-lg': '0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)',
        'apple-glow': '0 0 20px rgba(0, 122, 255, 0.35)',
        'apple-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.18)',
      },
      borderRadius: {
        'apple': '10px',
        'apple-lg': '14px',
        'apple-xl': '18px',
        'apple-2xl': '24px',
      }
    },
  },
  plugins: [],
}
