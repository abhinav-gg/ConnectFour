import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Change these to customize your brand
        brand: {
          // Main brand colors
          primary: "#464560", // Main sidebar background (top)
          secondary: "#403855", // Main sidebar background (bottom) & main page background
          hover: "#595974", // Hover states for buttons and links
          border: "#595974", // Borders and dividers (with opacity)

          // Accent colors
          "accent-red": "#e63946", // Red game pieces
          "accent-yellow": "#eab308", // Yellow game pieces
          "accent-blue": "#1d59ae", // Game board blue
          "accent-blue-dark": "#3e71ba", // Game board circles
          "accent-green": "#22c55e", // Success/login button
          "accent-orange": "#ff8c00", // Security modal accent

          // Notification and status
          notification: "#ef4444", // Red notification dots

          // Text colors
          "text-muted": "#828282", // Muted text color
          "text-light": "#a0a0a0", // Light text color
          "text-border": "#6b6b8a", // Form borders
        },

        // Keep existing shadcn colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "#464560",
          foreground: "#ffffff",
          primary: "#595974",
          "primary-foreground": "#ffffff",
          accent: "#595974",
          "accent-foreground": "#ffffff",
          border: "transparent",
          ring: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
