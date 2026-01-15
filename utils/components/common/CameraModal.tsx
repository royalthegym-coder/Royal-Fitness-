
import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { CameraIcon } from '../icons/CameraIcon';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      if (isOpen) {
        try {
          setError(null);
          // Use facingMode: "environment" to prefer the back camera
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          console.error("Error accessing camera (environment):", err);
          // Fallback to any available video source if environment camera fails
          try {
             const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
             setStream(fallbackStream);
             if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
             }
          } catch (fallbackErr) {
             console.error("Error accessing camera (fallback):", fallbackErr);
             setError("Could not access the camera. Please check permissions.");
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Capture Photo">
      <div className="relative">
        {error ? (
          <div className="text-red-400 p-4 text-center">{error}</div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleCapture}
          disabled={!!error}
          className="bg-amber-500 text-gray-900 font-bold py-2 px-6 rounded-full hover:bg-amber-400 transition-colors flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            <CameraIcon className="w-5 h-5 mr-2" />
            Capture
        </button>
      </div>
    </Modal>
  );
};

export default CameraModal;
