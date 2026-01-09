// tailwind.config.js
module.exports = {
  content: ["./*.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        brandIndigo: "#4F46E5",
        brandOrange: "#F97316",
      },
      boxShadow: {
        cinematic: "0 10px 25px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
}