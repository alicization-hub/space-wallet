const { heroui } = require('@heroui/react')

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {}
        }
      }
    })
  ]
}
