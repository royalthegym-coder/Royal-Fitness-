
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
  const apiKey = process.env.API_KEY; // This should ideally be a MAPS key, but for demo we assume logic exists
  const [mapId] = useState("4504f8b37365c3d0"); 

  // Guard against missing key
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    mapIds: [mapId]
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
    if (map && !markerRef.current && (window as any).google && (window as any).google.maps.marker) {
      try {
        const pinElement = document.createElement('div');
        pinElement.className = 'custom-marker';
        pinElement.innerHTML = `
          <div style="
            background: #f59e0b; 
            padding: 8px; 
            border-radius: 50%; 
            border: 2px solid white; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
          ">
            <img src="${GYM_INFO.logo}" style="width: 24px; height: 24px; object-fit: contain;" alt="Gym Logo" />
          </div>
          <div style="
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid white;
          "></div>
        `;

        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: center,
          title: GYM_INFO.name,
          content: pinElement,
        });
      } catch (e) {
        console.warn("AdvancedMarkerElement failed to initialize", e);
      }
    }
  }, [map, center]);

  // Robust check for missing key or load errors - Displays "Holographic" Offline Mode
  if (!apiKey || loadError) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-900 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950"></div>
        
        {/* Holographic Radar Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-cyan-500/20 rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-cyan-500/30 rounded-full"></div>
        
        <div className="flex flex-col items-center z-10 p-6 text-center max-w-sm relative">
            <div className="w-20 h-20 bg-gray-800/80 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-2xl overflow-hidden p-4 relative">
                <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>
                <img src={GYM_INFO.logo} alt="Logo" className="w-full h-full object-contain relative z-10" />
            </div>
            
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Satellite Link Offline</h3>
            <p className="text-gray-400 text-sm mb-6 font-medium">
                HQ Coordinates Locked. Visual feed unavailable.
            </p>

            <div className="w-full bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-left shadow-2xl">
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-2">Base Location</p>
                <p className="text-sm text-white font-bold leading-relaxed">{GYM_INFO.address}</p>
                
                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] text-green-400 font-bold uppercase flex items-center bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span> Active
                    </span>
                    <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:text-white font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                        Navigate &rarr;
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
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Calibrating GPS...</p>
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
        mapId: mapId, 
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
