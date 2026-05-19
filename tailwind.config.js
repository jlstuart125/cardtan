/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,ts,js}'],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#1a130c',
        'bg-surface': '#261d12',
        'bg-card': '#3a2c1c',
        'gold': '#d4a24c',
        'wood': '#5a8a3a',
        'brick': '#c44a2a',
        'grain': '#e8c468',
        'wool': '#f0e6d2',
        'ore': '#6b6b6b',
        'text-warm': '#f4e9d5',
        'muted': '#a89880',
      },
      fontFamily: {
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float-up': 'floatUp 1s ease-out forwards',
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'dice-roll': 'diceRoll 0.8s ease-out',
        'glow-pulse': 'glowPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-40px)' },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        diceRoll: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(180deg) scale(1.2)' },
          '75%': { transform: 'rotate(540deg) scale(0.9)' },
          '100%': { transform: 'rotate(720deg) scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(212,162,76,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(212,162,76,0.8)' },
        },
      },
    },
  },
  plugins: [],
}

