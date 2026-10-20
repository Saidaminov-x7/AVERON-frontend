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
        secondary: 'var(--color-secondary)',
        page: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-soft': 'var(--color-surface-soft)',
        'image-surface': 'var(--color-image-surface)',
        base: 'var(--color-text)',
        'muted-strong': 'var(--color-text-secondary)',
        muted: 'var(--color-muted)',
        'border-default': 'var(--color-border)',
        'border-hover': 'var(--color-border-hover)',
        sale: 'var(--color-sale)',
        'on-primary': 'var(--color-on-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        // The accent is dynamically supplied through CSS variables.
        primary: {
          DEFAULT: "var(--color-primary)",
          50: "color-mix(in srgb, var(--color-primary) 5%, white)",
          100: "color-mix(in srgb, var(--color-primary) 10%, white)",
          200: "color-mix(in srgb, var(--color-primary) 20%, white)",
          300: "color-mix(in srgb, var(--color-primary) 40%, white)",
          400: "color-mix(in srgb, var(--color-primary) 60%, white)",
          500: "var(--color-primary)",
          600: "var(--color-primary)",
          700: "var(--color-secondary, color-mix(in srgb, var(--color-primary) 80%, black))",
          800: "color-mix(in srgb, var(--color-primary) 70%, black)",
          900: "color-mix(in srgb, var(--color-primary) 60%, black)",
          950: "color-mix(in srgb, var(--color-primary) 50%, black)",
        },
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
