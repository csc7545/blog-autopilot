import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#101010',
        secondary: '#528be6',
        accent: '#ffe683',
        neutral: {
          light: '#ffffff',
          DEFAULT: '#103973',
          dark: '#101010',
        },
      },
    },
  },
  plugins: [],
};

export default config;
