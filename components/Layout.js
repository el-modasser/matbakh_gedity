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
    <div className="min-h-screen bg-white">
      <Script
        id="local-business-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessData) }}
      />

      {/* Clean Static Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="w-full py-4 px-6">
          <div className="flex justify-center items-center">
            {/* Centered logo */}
            <div className="py-1">
              <Image
                src="/logo.svg"
                alt="Matbakh Gedity - Authentic Egyptian Cuisine"
                width={160}
                height={52}
                className="h-auto object-contain"
                priority
                quality={100}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = document.getElementById('logo-fallback');
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              {/* Minimal fallback */}
              <div
                id="logo-fallback"
                className="hidden text-xl font-semibold text-gray-900 tracking-tight text-center"
              >
                Matbakh Gedity
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>

      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        html {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          scroll-behavior: smooth;
        }
        
        body {
          background: #ffffff;
          color: #000000;
          line-height: 1.6;
          font-weight: 400;
        }
        
        /* Clean scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #fafafa;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #d4d4d4;
        }
        
        /* Focus styles */
        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 2px solid #000000;
          outline-offset: 1px;
        }
        
        /* Selection */
        ::selection {
          background: #000000;
          color: white;
        }
      `}</style>
    </div>
  );
}