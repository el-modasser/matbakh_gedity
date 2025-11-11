import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { finger, nexa, niramit, poppins } from "./fonts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://matbakhgedity.com'),
  title: "Matbakh Gedity | Authentic Egyptian Cloud Kitchen in Cairo",
  description: "Experience authentic Egyptian home-style cooking with Matbakh Gedity cloud kitchen in Cairo. Fresh, traditional Egyptian dishes delivered to your door across Cairo.",
  keywords: "Egyptian food, cloud kitchen, Cairo, Egyptian cuisine, traditional dishes, home cooking, food delivery, Matbakh Gedity, Egyptian meals, Cairo food delivery",
  openGraph: {
    title: "Matbakh Gedity | Authentic Egyptian Cloud Kitchen in Cairo",
    description: "Experience authentic Egyptian home-style cooking with Matbakh Gedity cloud kitchen in Cairo. Fresh, traditional Egyptian dishes delivered to your door across Cairo.",
    url: "https://matbakhgedity.com",
    siteName: "Matbakh Gedity",
    locale: "ar_EG",
    type: "website",
    images: [{
      url: "/logo.svg",
      width: 150,
      height: 52,
      alt: "Matbakh Gedity Logo",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Matbakh Gedity | Authentic Egyptian Cloud Kitchen in Cairo",
    description: "Experience authentic Egyptian home-style cooking with Matbakh Gedity cloud kitchen in Cairo. Fresh, traditional Egyptian dishes delivered to your door across Cairo.",
    images: ["/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nexa.variable} ${poppins.variable} ${finger.variable} ${niramit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}