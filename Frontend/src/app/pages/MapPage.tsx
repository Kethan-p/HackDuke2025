import React, { useEffect, useRef, useState, useCallback } from 'react';

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
  marker: google.maps.Marker;
  displayName: string;
}

const CLUSTER_RADIUS = 800; // Increased cluster radius
const DEFAULT_ZOOM = 13;

const MapPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clustersRef = useRef<TrailCluster[]>([]);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const activeClusterRef = useRef<TrailCluster | null>(null);

  // Increased cluster marker sizes substantially
  const getHikingIcon = (count: number) => {
    if (!window.google?.maps) return null;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 15 + Math.log2(count) * 2, // Larger base size and scaling
      fillColor: '#2d5b27',
      fillOpacity: 0.9,
      strokeColor: '#fff',
      strokeWeight: 3
    };
  };

  const haversineDistance = (point1: google.maps.LatLngLiteral, point2: google.maps.LatLngLiteral) => {
    const R = 6371e3;
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const createClusters = (trails: Trail[]): TrailCluster[] => {
    const clusters: TrailCluster[] = [];
    
    trails.forEach(trail => {
      let addedToCluster = false;
      
      // Try to add to existing cluster
      for (const cluster of clusters) {
        const distance = haversineDistance(trail.midPoint, cluster.center);
        if (distance < CLUSTER_RADIUS) {
          cluster.trails.push(trail);
          addedToCluster = true;
          // Update cluster center to average position
          cluster.center = {
            lat: (cluster.center.lat + trail.midPoint.lat) / 2,
            lng: (cluster.center.lng + trail.midPoint.lng) / 2
          };
          break;
        }
      }

      // Create new cluster if none found
      if (!addedToCluster) {
        clusters.push({
          center: trail.midPoint,
          trails: [trail],
          marker: null as any,
          displayName: trail.name
        });
      }
    });

    return clusters;
  };

  const handleClusterClick = (cluster: TrailCluster) => {
    if (!window.google?.maps) return;
  
    // Reset previous cluster
    if (activeClusterRef.current) {
      activeClusterRef.current.trails.forEach(trail => {
        trail.polyline.setMap(null); // Remove from map completely
      });
      activeClusterRef.current.marker.setIcon(getHikingIcon(activeClusterRef.current.trails.length));
    }

  // Show and highlight new cluster trails
  cluster.trails.forEach(trail => {
    trail.polyline.setMap(mapInstanceRef.current); // Add to map
    trail.polyline.setOptions({
      strokeColor: '#FF0000',
      strokeWeight: 6,
      strokeOpacity: 0.9,
      zIndex: 2
    });
  });

  // Update cluster marker appearance
  cluster.marker.setIcon({
    ...getHikingIcon(cluster.trails.length),
    fillColor: '#FF0000',
    scale: 18 + Math.log2(cluster.trails.length) * 2
  });

  // Zoom to cluster bounds
  const bounds = new window.google.maps.LatLngBounds();
  cluster.trails.forEach(trail => {
    trail.polyline.getPath().forEach(latLng => bounds.extend(latLng));
  });
  mapInstanceRef.current?.fitBounds(bounds, { maxZoom: 16 });

  activeClusterRef.current = cluster;
};

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
    } catch (err) {
      setError('Failed to initialize Google Maps');
    }
  }, []);

  const fetchTrailsFromOSM = async () => {
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
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`
      );
      
      if (!response.ok) throw new Error('Network response failed');
      
      const data = await response.json();
      console.log('OSM Data:', data); // Debugging log
      
      if (!data.elements?.length) {
        setError('No hiking trails found in this area');
        return;
      }

      // Clear existing elements
      clustersRef.current.forEach(cluster => {
        cluster.marker.setMap(null);
        cluster.trails.forEach(trail => trail.polyline.setMap(null));
      });
      clustersRef.current = [];

      // Create trail objects
      const trails: Trail[] = [];
      data.elements.forEach((element: any) => {
        if (element.geometry && element.tags?.name) {
          const path = element.geometry.map((point: any) => ({
            lat: point.lat,
            lng: point.lon,
          }));

          const isOfficialHiking = element.tags?.route === 'hiking';
          const originalColor = isOfficialHiking ? '#2d5b27' : '#FF5733';
          const originalWeight = isOfficialHiking ? 4 : 3;

        // In the trail creation part, modify the polyline initialization:
        const polyline = new window.google.maps.Polyline({
            path,
            map: null, // Start with map null instead of visible: false
            strokeColor: originalColor,
            strokeOpacity: 0.9,
            strokeWeight: originalWeight
        });

          const midPoint = path[Math.floor(path.length / 2)];
          
          trails.push({
            polyline,
            originalColor,
            originalWeight,
            name: element.tags.name,
            midPoint
          });
        }
      });

      // Create clusters
      const clusters = createClusters(trails);
      console.log('Created clusters:', clusters); // Debugging log
      
      // Create cluster markers
      clusters.forEach(cluster => {
        // Determine most common name
        const nameCounts = cluster.trails.reduce((acc, trail) => {
          acc[trail.name] = (acc[trail.name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const mostCommonName = Object.entries(nameCounts)
          .sort((a, b) => b[1] - a[1])[0][0];

        // Create marker
        const marker = new window.google.maps.Marker({
          position: cluster.center,
          map: mapInstanceRef.current,
          icon: getHikingIcon(cluster.trails.length),
          title: mostCommonName,
          zIndex: 999
        });

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="text-sm p-2">
              <strong class="text-lg">${mostCommonName}</strong><br>
              Contains ${cluster.trails.length} trail segments
            </div>
          `
        });

        // Add click handlers
        marker.addListener('click', () => {
          infoWindow.close();
          handleClusterClick(cluster);
          infoWindow.open(mapInstanceRef.current, marker);
        });

        cluster.marker = marker;
        cluster.displayName = mostCommonName;
        clustersRef.current.push(cluster);
      });
    } catch (err) {
      setError('Failed to load trail data');
      console.error('OSM Error:', err);
    }
  };

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
      clustersRef.current.forEach(cluster => {
        cluster.marker.setMap(null);
        cluster.trails.forEach(trail => trail.polyline.setMap(null));
      });
    };
  }, [initMap]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-green-100">
      <h2 className="text-3xl font-bold text-green-800 mb-6">
        Durham Hiking Trails
      </h2>

      {isLoading && !error && (
        <div className="text-lg text-gray-600 mb-4">Loading map...</div>
      )}

      {error && (
        <div className="text-red-600 mb-4">
          {error} - Please try refreshing the page
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600">
        Click cluster markers to explore trails
      </div>

      <div
        ref={mapRef}
        className="w-full max-w-5xl h-[600px] border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden bg-white"
      />
    </div>
  );
};

export default MapPage;