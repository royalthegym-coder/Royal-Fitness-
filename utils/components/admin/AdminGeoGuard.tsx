
import React, { useState, useEffect, useCallback } from 'react';
import { GYM_INFO } from '../../../constants';
import { SignalIcon } from '../icons/SignalIcon';
import { LockIcon } from '../icons/LockIcon';
import { BotIcon } from '../icons/BotIcon';
import { RefreshCw, MapPin } from 'lucide-react';

interface AdminGeoGuardProps {
    children: React.ReactNode;
}

const RADIUS_LIMIT = 0.01; // 10 meters roughly for lat/long distance calc

const AdminGeoGuard: React.FC<AdminGeoGuardProps> = ({ children }) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [isBypassed, setIsBypassed] = useState(false); // Manual Override state

    // Helper to get distance
    const getDistanceFromLatLonInKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; 
    }, []);

    const startCheck = useCallback(() => {
        setError(null);
        setIsChecking(true);

        if (!navigator.geolocation) {
            setError('Hardware Geolocation is disabled or not supported.');
            setIsChecking(false);
            return;
        }

        // Determine Target Coordinates (Prioritize Calibrated)
        let targetLat = GYM_INFO.coordinates.latitude;
        let targetLng = GYM_INFO.coordinates.longitude;

        const storedLat = localStorage.getItem('royal_gym_lat');
        const storedLng = localStorage.getItem('royal_gym_lng');

        if (storedLat && storedLng) {
            targetLat = parseFloat(storedLat);
            targetLng = parseFloat(storedLng);
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const dist = getDistanceFromLatLonInKm(
                    targetLat,
                    targetLng,
                    position.coords.latitude,
                    position.coords.longitude
                );
                
                setDistance(dist);
                
                // Allow a slightly wider radius if calibrated manually to account for drift (e.g. 20m)
                // Default RADIUS_LIMIT is 0.01km (10m)
                const threshold = storedLat ? 0.02 : RADIUS_LIMIT;

                if (dist <= threshold) {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
                setIsChecking(false);
            },
            (err) => {
                if(err.code === 1) setError('Location Access Denied. Please enable GPS permissions.');
                else if(err.code === 2) setError('Position Unavailable. Check network/GPS.');
                else setError('GPS Timeout. Retry signal.');
                setIsChecking(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [getDistanceFromLatLonInKm]);

    useEffect(() => {
        // Check local setting
        const isGeoLockEnabled = localStorage.getItem('royal_geo_lock') === 'true';
        if (!isGeoLockEnabled || isBypassed) {
            setIsAuthorized(true);
            setIsChecking(false);
            return;
        }

        startCheck();
    }, [startCheck, isBypassed]);

    const handleManualOverride = () => {
        // In a real app, this would require 2FA
        if (confirm("Developer Override: Disable Geo-Lock for this session?")) {
            setIsBypassed(true);
        }
    };

    if (isChecking) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-950 p-6">
                <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <MapPin className="absolute inset-0 m-auto w-6 h-6 text-amber-500 animate-bounce" />
                </div>
                <p className="text-amber-500 font-mono text-sm tracking-widest animate-pulse">ESTABLISHING SECURE UPLINK...</p>
                <p className="text-gray-600 text-xs mt-2">Triangulating Coordinates</p>
            </div>
        );
    }

    if (!isAuthorized) {
        const meters = distance ? (distance * 1000).toFixed(1) : '---';
        return (
            <div className="h-[calc(100vh-100px)] w-full flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-red-950/20 border-2 border-red-500/30 rounded-[2rem] p-10 text-center backdrop-blur-xl relative overflow-hidden shadow-2xl">
                    {/* Background Visual */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                    
                    <div className="inline-flex p-5 rounded-3xl bg-red-500/10 border border-red-500/20 mb-8">
                        <LockIcon className="w-12 h-12 text-red-500" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tight mb-4">Geo-Lock Active</h2>
                    
                    {error ? (
                        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 mb-8">
                            <p className="text-red-400 font-bold text-sm mb-1">Signal Error</p>
                            <p className="text-red-300 text-xs">{error}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                            Security Protocol <span className="text-red-400 font-bold">R-OS 4.2</span> requires proximity to Royal Gym HQ for Admin access.
                        </p>
                    )}
                    
                    <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Distance</span>
                            <span className="text-red-500 font-mono font-bold">{meters}m</span>
                        </div>
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-red-500 transition-all duration-1000" 
                                style={{ width: `${Math.max(5, 100 - (distance ? distance * 500 : 0))}%` }}
                            ></div>
                        </div>
                        <p className="text-[9px] text-gray-500 mt-4 uppercase font-bold tracking-widest">Must be within 20 meters of entrance</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={startCheck}
                            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4"/> Retry Signal
                        </button>
                        
                        <div className="flex items-center justify-center gap-3 text-red-400 font-mono text-[10px] animate-pulse mt-4">
                            <BotIcon className="w-4 h-4" />
                            <span>RESTRICTED ACCESS ZONE</span>
                        </div>
                        <button 
                            onClick={handleManualOverride}
                            className="mt-2 text-[10px] text-gray-500 hover:text-white underline decoration-dashed uppercase tracking-widest"
                        >
                            Developer Override
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <div className="animate-fade-in">{children}</div>;
};

export default AdminGeoGuard;
