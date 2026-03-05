import React, { useEffect, useState } from 'react';
import { Shield, Smartphone, AlertTriangle, Lock } from 'lucide-react';

interface SecurityLayerProps {
    children: React.ReactNode;
    className?: string;
}

const SecurityLayer: React.FC<SecurityLayerProps> = ({ children, className }) => {
    const [isMobile, setIsMobile] = useState(true);
    const [isSecure, setIsSecure] = useState(true);
    const [violationCount, setViolationCount] = useState(0);

    useEffect(() => {
        // 1. Mobile Device Check (Simulation)
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            // Simple regex for mobile devices
            if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
                setIsMobile(true);
            } else {
                // For development purposes, we might want to allow desktop but show a warning
                // In production, this would be strict
                setIsMobile(false); 
                console.warn("Security Warning: Non-mobile device detected.");
            }
        };

        checkMobile();

        // 2. Disable Right Click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            setViolationCount(prev => prev + 1);
        };

        // 3. Disable Keyboard Shortcuts (PrintScreen, Ctrl+S, Ctrl+U, F12)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === 'PrintScreen' ||
                (e.ctrlKey && (e.key === 's' || e.key === 'u' || e.key === 'p')) ||
                e.key === 'F12'
            ) {
                e.preventDefault();
                setViolationCount(prev => prev + 1);
                alert("Security Alert: This action is restricted.");
            }
        };

        // 4. Blur on Focus Loss (Privacy Shield)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsSecure(false);
            } else {
                setIsSecure(true);
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    if (!isMobile) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 text-center">
                <Smartphone className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Mobile Access Only</h2>
                <p className="text-gray-400 max-w-md">
                    This application is secured and can only be accessed via the official gym member mobile app.
                </p>
                <button 
                    onClick={() => setIsMobile(true)} // Dev bypass
                    className="mt-8 px-4 py-2 bg-gray-800 text-gray-500 text-xs rounded hover:text-white"
                >
                    [Developer Bypass]
                </button>
            </div>
        );
    }

    return (
        <div className={`relative ${className} select-none`}>
            {/* Privacy Shield Overlay */}
            {!isSecure && (
                <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center backdrop-blur-xl">
                    <Shield className="w-20 h-20 text-cyan-500 mb-6 animate-pulse" />
                    <h2 className="text-3xl font-black text-white tracking-widest uppercase">Privacy Shield Active</h2>
                    <p className="text-cyan-400 mt-2 font-mono text-sm">Tap to Resume Session</p>
                </div>
            )}

            {/* Violation Warning */}
            {violationCount > 0 && violationCount % 3 === 0 && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-3 animate-bounce">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold text-sm">Security Alert: Screenshot Attempt Detected</span>
                </div>
            )}

            {/* Watermark */}
            <div className="pointer-events-none fixed inset-0 z-[60] opacity-[0.03] flex items-center justify-center overflow-hidden">
                <div className="rotate-45 transform text-9xl font-black text-white whitespace-nowrap">
                    CONFIDENTIAL • DO NOT SHARE • CONFIDENTIAL
                </div>
            </div>

            {children}
        </div>
    );
};

export default SecurityLayer;
