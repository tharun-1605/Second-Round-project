/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-indigo-50',
    'bg-indigo-100',
    'bg-indigo-600',
    'bg-indigo-700',
    'border-indigo-300',
    'border-indigo-500',
    'text-indigo-600',
    'text-indigo-700',
    'hover:bg-indigo-700',
    'hover:bg-indigo-800',
    'focus:ring-indigo-500',
    'shadow-indigo-200',
    {
      pattern: /^(bg|text|border|ring|shadow)-(indigo|purple|gray|red)-(50|100|200|300|400|500|600|700|800|900)/,
    },
  ],
}