import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        ebegOrange: "hsl(var(--ebeg-orange) / <alpha-value>)",
      },
    },
  },
} satisfies Config;
