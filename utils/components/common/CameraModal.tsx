
import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { CameraIcon } from '../icons/CameraIcon';
import { AlertTriangle, Upload } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      if (isOpen) {
        try {
          setError(null);
          // Prefer back camera for documents/gym use
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          console.warn("Primary camera failed:", err);
          // Fallback to any camera
          try {
             const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
             setStream(fallbackStream);
             if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
             }
          } catch (fallbackErr) {
             console.error("All cameras failed:", fallbackErr);
             setError("Camera access denied or unavailable. Please upload a photo instead.");
          }
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        onCapture(imageDataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  onCapture(ev.target.result as string);
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Capture Image">
      <div className="relative min-h-[300px] bg-black rounded-lg flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                  <p className="text-white font-bold mb-1">Camera Offline</p>
                  <p className="text-xs text-gray-400 mb-4">{error}</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-full transition-colors flex items-center gap-2 text-sm mx-auto border border-white/10"
              >
                  <Upload className="w-4 h-4" /> Upload from Gallery
              </button>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>
      
      {!error && (
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-800 text-white font-bold p-3 rounded-full hover:bg-gray-700 transition-colors"
              title="Upload"
            >
                <Upload className="w-5 h-5" />
            </button>
            <button
              onClick={handleCapture}
              className="bg-amber-500 text-black font-bold py-3 px-8 rounded-full hover:bg-amber-400 transition-colors flex items-center shadow-lg active:scale-95"
            >
                <CameraIcon className="w-5 h-5 mr-2" />
                Capture
            </button>
          </div>
      )}
    </Modal>
  );
};

export default CameraModal;
