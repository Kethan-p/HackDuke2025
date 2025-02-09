'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { auth } from '../firebase';
import { User } from 'firebase/auth';
import Link from 'next/link';
import Image from 'next/image';

declare global {
  interface Window {
    google?: typeof google;
    initGoogleMap?: () => void;
  }
}

interface Trail {
  polyline: google.maps.Polyline;
  originalColor: string;
  originalWeight: number;
  name: string;
  midPoint: google.maps.LatLngLiteral;
}

interface TrailCluster {
  center: google.maps.LatLngLiteral;
  trails: Trail[];
  marker: google.maps.Marker | null;
  displayName: string;
}

interface OSMElement {
  type: string;
  id: number;
  geometry: Array<{ lat: number; lon: number }>;
  tags?: {
    name?: string;
    highway?: string;
    foot?: string;
    route?: string;
  };
}

const CLUSTER_RADIUS = 1000;
const DEFAULT_ZOOM = 13;

const MapPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clustersRef = useRef<TrailCluster[]>([]);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const activeClusterRef = useRef<TrailCluster | null>(null);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Add user state to hold the current authenticated user.
  const [user, setUser] = useState<User | null>(null);

  // Listen for auth state changes.
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Returns a complete icon always as a google.maps.Symbol
  const getHikingIcon = useCallback((count: number): google.maps.Symbol => {
    return {
      path: window.google!.maps.SymbolPath.CIRCLE,
      scale: 15 + Math.log2(count) * 0,
      fillColor: '#2d5b27',
      fillOpacity: 0.9,
      strokeColor: '#fff',
      strokeWeight: 3,
    };
  }, []);

  const haversineDistance = (
    point1: google.maps.LatLngLiteral,
    point2: google.maps.LatLngLiteral
  ) => {
    const R = 6371e3;
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) *
        Math.cos(φ2) *
        Math.sin(Δλ / 2) *
        Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const createClusters = useCallback((trails: Trail[]): TrailCluster[] => {
    const clusters: TrailCluster[] = [];

    trails.forEach((trail) => {
      let addedToCluster = false;

      // Try to add to an existing cluster
      for (const cluster of clusters) {
        const distance = haversineDistance(trail.midPoint, cluster.center);
        if (distance < CLUSTER_RADIUS) {
          cluster.trails.push(trail);
          addedToCluster = true;
          // Update cluster center to the average position
          cluster.center = {
            lat: (cluster.center.lat + trail.midPoint.lat) / 2,
            lng: (cluster.center.lng + trail.midPoint.lng) / 2,
          };
          break;
        }
      }

      // If not added, create a new cluster
      if (!addedToCluster) {
        clusters.push({
          center: trail.midPoint,
          trails: [trail],
          marker: null,
          displayName: trail.name,
        });
      }
    });

    return clusters;
  }, []);

  const handleClusterClick = useCallback(
    (cluster: TrailCluster) => {
      if (!window.google?.maps) return;

      // Toggle: if clicking the already active cluster, unhighlight it.
      if (activeClusterRef.current === cluster) {
        cluster.trails.forEach((trail) => trail.polyline.setMap(null));
        cluster.marker!.setIcon(
          getHikingIcon(cluster.trails.length) as google.maps.Symbol
        );
        activeClusterRef.current = null;
        return;
      }

      // Unhighlight previously active cluster, if any.
      if (activeClusterRef.current) {
        activeClusterRef.current.trails.forEach((trail) => {
          trail.polyline.setMap(null);
        });
        activeClusterRef.current.marker!.setIcon(
          getHikingIcon(activeClusterRef.current.trails.length) as google.maps.Symbol
        );
      }

      // Highlight the clicked cluster's trails.
      cluster.trails.forEach((trail) => {
        trail.polyline.setMap(mapInstanceRef.current);
        trail.polyline.setOptions({
          strokeColor: '#FF0000',
          strokeWeight: 6,
          strokeOpacity: 0.9,
          zIndex: 2,
        });
      });

      // Update marker icon to indicate highlight.
      cluster.marker!.setIcon({
        ...getHikingIcon(cluster.trails.length),
        fillColor: '#FF0000',
        scale: 18 + Math.log2(cluster.trails.length) * 2,
        path: window.google!.maps.SymbolPath.CIRCLE,
      } as google.maps.Symbol);

      // Zoom the map to the bounds of the selected cluster.
      const bounds = new window.google.maps.LatLngBounds();
      cluster.trails.forEach((trail) => {
        trail.polyline.getPath().forEach((latLng) => bounds.extend(latLng));
      });
      mapInstanceRef.current?.fitBounds(bounds);

      // Optional: Limit maximum zoom level.
      const currentZoom = mapInstanceRef.current?.getZoom() || DEFAULT_ZOOM;
      if (currentZoom > 16) {
        mapInstanceRef.current?.setZoom(16);
      }

      activeClusterRef.current = cluster;
    },
    [getHikingIcon]
  );

  const fetchTrailsFromOSM = useCallback(async () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const overpassQuery = `
      [out:json];
      (
        way["highway"~"path|footway"]["foot"="yes"](35.8,-79.4,36.4,-78.6);
        way["route"="hiking"](35.8,-79.4,36.4,-78.6);
        relation["route"="hiking"](35.8,-79.4,36.4,-78.6);
      );
      out geom;
    `;

    try {
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
          overpassQuery
        )}`
      );
      if (!response.ok) throw new Error('Network response failed');

      const data = await response.json();
      if (!data.elements?.length) {
        setError('No hiking trails found in this area');
        return;
      }

      // Clear existing clusters and trails.
      clustersRef.current.forEach((cluster) => {
        if (cluster.marker) cluster.marker.setMap(null);
        cluster.trails.forEach((trail) => trail.polyline.setMap(null));
      });
      clustersRef.current = [];

      // Create trail objects.
      const trails: Trail[] = [];
      data.elements.forEach((element: OSMElement) => {
        if (element.geometry && element.tags?.name) {
          const path = element.geometry.map((point) => ({
            lat: point.lat,
            lng: point.lon,
          }));

          const isOfficialHiking = element.tags?.route === 'hiking';
          const originalColor = isOfficialHiking ? '#2d5b27' : '#FF5733';
          const originalWeight = isOfficialHiking ? 4 : 3;

          const polyline = new window.google!.maps.Polyline({
            path,
            map: null,
            strokeColor: originalColor,
            strokeOpacity: 0.9,
            strokeWeight: originalWeight,
          });

          const midPoint = path[Math.floor(path.length / 2)];
          trails.push({
            polyline,
            originalColor,
            originalWeight,
            name: element.tags.name,
            midPoint,
          });
        }
      });

      // Create clusters and markers.
      const clusters = createClusters(trails);
      clusters.forEach((cluster) => {
        const nameCounts: Record<string, number> = {};
        cluster.trails.forEach((trail) => {
          nameCounts[trail.name] = (nameCounts[trail.name] || 0) + 1;
        });
        const mostCommonName = Object.entries(nameCounts)
          .sort((a, b) => b[1] - a[1])[0][0];

        const marker = new window.google!.maps.Marker({
          position: cluster.center,
          map: mapInstanceRef.current,
          icon: getHikingIcon(cluster.trails.length),
          title: mostCommonName,
          zIndex: 999,
        });

        const infoWindow = new window.google!.maps.InfoWindow({
          content: `
            <div class="text-sm p-2">
              <strong class="text-lg">${mostCommonName}</strong><br>
              Contains ${cluster.trails.length} trail segments
            </div>
          `,
        });

        marker.addListener('click', () => {
          // Close any previously open infoWindow
          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close();
          }
          handleClusterClick(cluster);
          infoWindow.open(mapInstanceRef.current, marker);
          activeInfoWindowRef.current = infoWindow;
        });

        // Optionally, clear the active infoWindow ref when it is closed by the user
        infoWindow.addListener('closeclick', () => {
          activeInfoWindowRef.current = null;
        });

        cluster.marker = marker;
        cluster.displayName = mostCommonName;
        clustersRef.current.push(cluster);
      });
    } catch (error) {
      console.error('OSM Error:', error);
      setError('Failed to load trail data');
    }
  }, [createClusters, handleClusterClick, getHikingIcon]);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) return;
    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 36.0014, lng: -78.9382 },
        zoom: DEFAULT_ZOOM,
        mapTypeControl: false,
        streetViewControl: false,
      });
      fetchTrailsFromOSM();
      setIsLoading(false);
    } catch {
      setError('Failed to initialize Google Maps');
    }
  }, [fetchTrailsFromOSM]);

  useEffect(() => {
    const loadMapScript = () => {
      const scriptId = 'google-maps-script';
      if (document.getElementById(scriptId)) return;
      window.initGoogleMap = initMap;
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}&callback=initGoogleMap`;
      script.async = true;
      script.defer = true;
      script.onerror = () => setError('Failed to load Google Maps');
      document.head.appendChild(script);
    };

    if (window.google?.maps) {
      initMap();
    } else {
      loadMapScript();
    }

    return () => {
      clustersRef.current.forEach((cluster) => {
        if (cluster.marker) cluster.marker.setMap(null);
        cluster.trails.forEach((trail) => trail.polyline.setMap(null));
      });
    };
  }, [initMap]);

  return (
    <>
      {/* Fixed Navbar overlay */}
      <div className="fixed top-0 left-0 right-0 z-20">
        <Navbar
          isAuthenticated={true}
          displayName={user ? (user.displayName || user.email) : undefined}
        />
      </div>

      {/* Full-screen container for map and overlays */}
      <div className="relative h-screen bg-green-100">
        {/* Optional loading and error messages as overlays */}
        {isLoading && !error && (
          <div className="absolute z-10 top-16 left-1/2 transform -translate-x-1/2 text-lg text-gray-600">
            Loading map...
          </div>
        )}
        {error && (
          <div className="absolute z-10 top-16 left-1/2 transform -translate-x-1/2 text-red-600">
            {error} - Please try refreshing the page
          </div>
        )}

        {/* Map container takes the full viewport height */}
        <div
          ref={mapRef}
          className="w-full h-full border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden bg-white relative z-0"
        />

        {/* Camera button in the bottom left corner (5x larger, without circular styling) */}
        <Link href="/image">
          <div className="absolute bottom-4 left-4 z-30">
            <Image src="/camera.png" alt="Camera" width={120} height={120} />
          </div>
        </Link>
      </div>
    </>
  );
};

export default MapPage;
