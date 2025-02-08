import React, { useEffect, useRef } from 'react';

/// <reference types="google.maps" />

declare global {
  interface Window {
    google?: typeof google;
    initGoogleMap?: () => void; // Prevents duplicate initialization
  }
}

const MapPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scriptId = "google-maps-script";

    // ✅ Prevent multiple script injections
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    // ✅ If script is already in the document, wait for it to load
    if (document.getElementById(scriptId)) {
      window.initGoogleMap = () => initMap();
      return;
    }

    // ✅ Add Google Maps script dynamically
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // ✅ Attach callback function to window to avoid multiple executions
    window.initGoogleMap = () => initMap();

    return () => {
      // ✅ Cleanup: Do NOT remove script to prevent unnecessary reloading
      delete window.initGoogleMap;
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 40.7128, lng: -74.0060 }, // New York City
      zoom: 12,
    });

    new window.google.maps.Marker({
      position: { lat: 40.7128, lng: -74.0060 },
      map,
      title: "New York City",
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-green-800 mb-4">Forest Map</h2>
      <div ref={mapRef} className="w-full h-96 border-2 border-gray-300"></div>
    </div>
  );
};

export default MapPage;