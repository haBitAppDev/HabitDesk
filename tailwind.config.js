/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          background: "#F5F7FB",
          surface: "#FFFFFF",
          primary: "#1F6FEB",
          "primary-dark": "#2563EB",
          accent: "#10B981",
          light: "#D7E4FF",
          text: "#111827",
          "text-muted": "#6B7280",
          divider: "#E5E7EB",
        },
        patient: {
          primary: "#AD8501",
          accent: "#8BC34A",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 24px rgba(17, 24, 39, 0.06)",
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
