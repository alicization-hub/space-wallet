import { heroui } from '@heroui/react'

/**
 * @type {import('tailwindcss').Config}
 */
const config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/compoments/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'media',
  plugins: [
    heroui({
      prefix: 'space',
      defaultTheme: 'dark',
      defaultExtendTheme: 'dark',
      themes: {
        dark: {
          layout: {},
          colors: {}
        }
      }
    })
  ]
}

export default config
