"use client"
import Image from 'next/image';
import Script from 'next/script';

export default function Layout({ children }) {
  // Local business structured data for SEO
  const localBusinessData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Matbakh Gedity",
    "image": "https://matbakhgedity.com/logo.svg",
    "@id": "https://matbakhgedity.com",
    "url": "https://matbakhgedity.com",
    "telephone": "+201234567890",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Cairo",
      "addressRegion": "Cairo",
      "addressCountry": "EG"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "30.0444",
      "longitude": "31.2357"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
        "opens": "10:00",
        "closes": "23:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Friday", "Saturday"],
        "opens": "12:00",
        "closes": "23:00"
      }
    ],
    "servesCuisine": ["Egyptian", "Middle Eastern", "Traditional", "Home-Style Meals"],
    "priceRange": "$$",
    "description": "Authentic Egyptian home-style cooking delivered across Cairo"
  };

  return (
    <div className="bg-white">
      <Script
        id="local-business-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessData) }}
      />

      <header className="flex flex-col items-center w-full pt-6 pb-0">
        <div className="mb-4 flex justify-center items-center w-full max-w-[800px]">
          {/* Centered Logo */}
          <Image
            src="/logo.svg"
            alt="Matbakh Gedity Logo"
            width={190}
            height={62}
            className="h-auto py-0 max-w-full mx-auto"
            priority
          />
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-4">
        {children}
      </main>
    </div>
  );
}