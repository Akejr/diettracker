/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      padding: {
        'safe': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      colors: {
        // Cores para o tema claro
        light: {
          background: '#F9FAFB',
          card: '#FFFFFF',
          text: {
            primary: '#343030',
            secondary: '#706F6F',
            muted: '#B3B3B6'
          },
          border: '#70707033'
        },
        // Cores para o tema escuro
        dark: {
          background: '#121212',
          card: '#1E1E1E',
          text: {
            primary: '#E4E4E4',
            secondary: '#B0B0B0',
            muted: '#8A8A8A'
          },
          border: '#383838'
        }
      }
    },
  },
  plugins: [],
}
