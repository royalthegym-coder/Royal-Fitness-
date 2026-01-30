
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { GYM_INFO } from '../../constants';

// Declare google as any to avoid namespace errors without @types/google.maps
declare var google: any;

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  borderRadius: '24px',
};

// Custom Dark Mode Map Style
const mapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#263c3f" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6b9a76" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#38414e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#212a37" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9ca5b3" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#1f2835" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#f3d19c" }]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{ "color": "#2f3948" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#17263c" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#515c6d" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#17263c" }]
  }
];

const GymLocationMap: React.FC = () => {
  // Safe access to process.env for browser environments
  const apiKey = (window as any).process?.env?.API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    // Removed mapId to prevent InvalidKey error and style conflicts
  });

  const [map, setMap] = useState<any | null>(null);
  const markerRef = useRef<any | null>(null);

  const center = {
    lat: GYM_INFO.coordinates.latitude,
    lng: GYM_INFO.coordinates.longitude
  };

  const onLoad = useCallback((mapInstance: any) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    markerRef.current = null;
  }, []);

  useEffect(() => {
    if (map && !markerRef.current && (window as any).google && (window as any).google.maps.Marker) {
        // Fallback to standard Marker when AdvancedMarkerElement is unavailable
        markerRef.current = new google.maps.Marker({
            position: center,
            map: map,
            title: GYM_INFO.name,
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
            }
        });
    }
  }, [map, center]);

  if (!apiKey || loadError) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-900 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center grayscale"></div>
        
        <div className="flex flex-col items-center z-10 p-6 text-center max-w-sm">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border-2 border-gray-700 shadow-xl overflow-hidden p-3">
                <img src={GYM_INFO.logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Location Data</h3>
            <p className="text-gray-400 text-sm mb-6">
                Map view unavailable. Please check API configuration.
            </p>

            <div className="w-full bg-gray-800/80 backdrop-blur-md rounded-xl p-4 border border-gray-700 text-left">
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">Address</p>
                <p className="text-sm text-white font-medium leading-relaxed">{GYM_INFO.address}</p>
                <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
                    <span className="text-[10px] text-green-400 font-bold uppercase flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span> Open Now
                    </span>
                    <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:text-white font-bold underline transition-colors"
                    >
                        Get Directions &rarr;
                    </a>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-900 rounded-3xl border border-white/5">
        <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Initializing Satellite Link...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={16}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        styles: mapStyles
      }}
    />
  );
};

export default React.memo(GymLocationMap);
