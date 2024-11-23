/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#3E505B"
        },
        team1: {
          DEFAULT: "#1ABC9C"
        },
        team2: {
          DEFAULT: "#2C3D50"
        }
      },
      backgroundImage: {
        'cross': 'url("/cross.svg")'
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-6deg)' },
          '50%': { transform: 'rotate(6deg)' },
        },
        fadein: {
          from: { marginLeft: '1000px' },
          to: {},
        },
        slidein: {
          from: { marginLeft: '800px' },
          to: { marginTop: '0px' },
        },
        slideup: {
          from: { marginTop: '30px' },
          to: { marginTop: '0px' },
        },
        marquee: {
          '0%': { left: '0' },
          '20%': { left: '0' },
          '100%': { left: '-100%' },
        },
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite',
        fadein: 'fadein 0.4s forwards',
        slidein: 'slidein 0.4s forwards',
        slideup: 'slideup 0.2s forwards',
        marquee: 'marquee 10s linear infinite',
      }
    },
  },
  plugins: [],
}

