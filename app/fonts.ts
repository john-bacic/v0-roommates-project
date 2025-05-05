import { Major_Mono_Display } from 'next/font/google';

export const majorMonoDisplay = Major_Mono_Display({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-major-mono-display',
  preload: true,
  fallback: ['monospace']
});
