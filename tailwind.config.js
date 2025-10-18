/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        glass: {
          'white-5': 'rgba(255, 255, 255, 0.05)',
          'white-10': 'rgba(255, 255, 255, 0.1)',
          'white-15': 'rgba(255, 255, 255, 0.15)',
          'white-20': 'rgba(255, 255, 255, 0.2)',
          'black-5': 'rgba(0, 0, 0, 0.05)',
          'black-10': 'rgba(0, 0, 0, 0.1)',
          'black-20': 'rgba(0, 0, 0, 0.2)',
        }
      },
      backdropBlur: {
        'xs': '2px',
        '4xl': '72px',
        '5xl': '100px',
      },
      animation: {
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite -2s',
        'float-delayed-2': 'float 6s ease-in-out infinite -4s',
        'gradient-shift': 'gradientShift 4s ease-in-out infinite',
        'liquid-move': 'liquidMove 20s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'floating-orbs': 'floatingOrbs 20s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' }
        },
        float: {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg)' 
          },
          '33%': { 
            transform: 'translateY(-20px) rotate(1deg)' 
          },
          '66%': { 
            transform: 'translateY(-10px) rotate(-1deg)' 
          }
        },
        floatingOrbs: {
          '0%, 100%': {
            transform: 'translateX(0px) translateY(0px)'
          },
          '25%': {
            transform: 'translateX(10px) translateY(-10px)'
          },
          '50%': {
            transform: 'translateX(-5px) translateY(-20px)'
          },
          '75%': {
            transform: 'translateX(-10px) translateY(-5px)'
          }
        },
        gradientShift: {
          '0%, 100%': {
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          }
        },
        liquidMove: {
          '0%': {
            transform: 'translateX(0px) translateY(0px) scale(1)',
            opacity: '0.3'
          },
          '33%': {
            transform: 'translateX(30px) translateY(-30px) scale(1.1)',
            opacity: '0.4'
          },
          '66%': {
            transform: 'translateX(-20px) translateY(-60px) scale(0.9)',
            opacity: '0.2'
          },
          '100%': {
            transform: 'translateX(0px) translateY(0px) scale(1)',
            opacity: '0.3'
          }
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        'glass-lg': '0 20px 60px 0 rgba(31, 38, 135, 0.4)',
        'glass-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
      }
    },
  },
  plugins: [],
}



