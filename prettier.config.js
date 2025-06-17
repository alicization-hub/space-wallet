/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
module.exports = {
  bracketSameLine: true,
  endOfLine: 'lf',
  htmlWhitespaceSensitivity: 'ignore',
  importOrder: [
    '<BUILTIN_MODULES>',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^(?!(.*)[.]css$)(@/)(.*)$',
    '',
    '^(?!(.*)[.]css$)[./](.*)$',
    '',
    '.css$'
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  jsxSingleQuote: true,
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  printWidth: 110,
  proseWrap: 'always',
  quoteProps: 'consistent',
  semi: false,
  singleQuote: true,
  trailingComma: 'none',
  tailwindFunctions: ['cls', 'clsx']
}
