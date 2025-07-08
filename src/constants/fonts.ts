import { Inconsolata, Ubuntu } from 'next/font/google'

export const fontUbuntu = Ubuntu({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ubuntu'
})

export const fontNumber = Inconsolata({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-number'
})
