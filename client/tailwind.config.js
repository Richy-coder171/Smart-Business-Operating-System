export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af"
        },
        ink: "#172033",
        mint: "#0f9f6e",
        coral: "#e45757",
        amber: "#d97706"
      }
    }
  },
  plugins: []
};
