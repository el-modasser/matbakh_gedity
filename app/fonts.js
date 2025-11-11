import { Poppins, Niramit } from 'next/font/google';
import localFont from 'next/font/local';


export const nexa = localFont({
  src: [
    {
      path: '../public/Nexa-ExtraLight.ttf',
      weight: '200',
    },
    {
      path: '../public/Nexa-Heavy.ttf',
      weight: '900',
    },
  ],
  variable: '--font-nexa',
  display: 'swap',
})

export const finger = localFont({
  src: [
    {
      path: '../public/Boldfinger.ttf',

    },
  ],
  variable: '--font-finger',
  display: 'swap',
})
// Poppins as a substitute for Nexa (since Nexa is not available in Google Fonts)
// We'll keep Poppins as a fallback in case the local Nexa font fails to load
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '700', '900'], // Light, Bold, Heavy
  variable: '--font-poppins',
  display: 'swap',
});

export const niramit = Niramit({
  subsets: ['latin', 'thai'],
  weight: ['200', '400', '700'], // ExtraLight, Regular, Bold
  variable: '--font-niramit',
  display: 'swap',
});