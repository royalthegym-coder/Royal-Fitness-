import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera as CameraIcon, RefreshCw, Check, X, SwitchCamera } from 'lucide-react';

interface CameraProps {
    onCapture: (base64Image: string) => void;
    onClose: () => void;
}

export const CameraCapture: React.FC<CameraProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        const startCamera = async () => {
            // Stop any existing stream first
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            try {
                const constraints = {
                    video: { 
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                // Fallback for some browsers/devices
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                } catch (fallbackErr) {
                    console.error("Fallback camera access failed:", fallbackErr);
                    // Only alert if we're not unmounting
                    alert("Could not access camera. Please ensure you have given permission.");
                }
            }
        };

        startCamera();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        };
    }, [facingMode]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageData);
            }
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    };

    const toggleFacingMode = () => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-lg aspect-[3/4] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
                {!capturedImage ? (
                    <>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                            <div className="w-full h-full border border-white/20 rounded-lg"></div>
                        </div>
                    </>
                ) : (
                    <img src={capturedImage} alt="Captured Preview" className="w-full h-full object-cover" />
                )}

                <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-8">
                    {!capturedImage ? (
                        <>
                            <button 
                                onClick={onClose}
                                className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={handleCapture}
                                className="p-6 bg-white rounded-full text-black hover:scale-110 active:scale-95 transition-all shadow-xl"
                            >
                                <CameraIcon className="w-8 h-8" />
                            </button>
                            <button 
                                onClick={toggleFacingMode}
                                className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
                            >
                                <SwitchCamera className="w-6 h-6" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => setCapturedImage(null)}
                                className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
                            >
                                <RefreshCw className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={handleConfirm}
                                className="p-6 bg-emerald-500 rounded-full text-white hover:scale-110 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                            >
                                <Check className="w-8 h-8" />
                            </button>
                        </>
                    )}
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
