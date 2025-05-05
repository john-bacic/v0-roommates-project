import { Caveat } from 'next/font/google';

export const caveat = Caveat({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caveat',
  preload: true,
  fallback: ['cursive']
});
