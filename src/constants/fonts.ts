import { Inter, Noto_Sans_Thai as Thai } from 'next/font/google'

export const fontInter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const fontThai = Thai({
  subsets: ['latin', 'thai'],
  display: 'swap',
  variable: '--font-thai'
})
