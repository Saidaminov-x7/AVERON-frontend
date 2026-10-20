/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enable dark mode through the CSS class on the html element.
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        page: "var(--color-bg)",
        surface: "var(--color-surface)",
        surfaceSoft: "var(--color-surface-soft)",
        imageSurface: "var(--color-image-surface)",
        ink: "var(--color-text)",
        inkSoft: "var(--color-text-secondary)",
        muted: "var(--color-muted)",
        line: "var(--color-border)",
        lineHover: "var(--color-border-hover)",
        sale: "var(--color-sale)",
        onPrimary: "var(--color-on-primary)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        // Preserve existing numbered primary utilities while exposing flat semantic primary.
        "primary-50": "color-mix(in srgb, var(--color-primary) 5%, white)",
        "primary-100": "color-mix(in srgb, var(--color-primary) 10%, white)",
        "primary-200": "color-mix(in srgb, var(--color-primary) 20%, white)",
        "primary-300": "color-mix(in srgb, var(--color-primary) 40%, white)",
        "primary-400": "color-mix(in srgb, var(--color-primary) 60%, white)",
        "primary-500": "var(--color-primary)",
        "primary-600": "var(--color-primary)",
        "primary-700": "var(--color-secondary, color-mix(in srgb, var(--color-primary) 80%, black))",
        "primary-800": "color-mix(in srgb, var(--color-primary) 70%, black)",
        "primary-900": "color-mix(in srgb, var(--color-primary) 60%, black)",
        "primary-950": "color-mix(in srgb, var(--color-primary) 50%, black)",
      },
      borderRadius: {
        theme: "var(--border-radius, 0.125rem)",
      },
      fontFamily: {
        theme: ["var(--font-family)", "var(--font-inter)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};