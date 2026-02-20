
import React, { useRef, useEffect, useState } from 'react';
import { GoogleIcon } from '../icons/GoogleIcon';
import { StarIcon } from '../icons/StarIcon';
import { GYM_INFO } from '../../../constants';
import { toDataURL } from 'qrcode';
import { Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface GoogleReviewQRProps {
    className?: string;
    showControls?: boolean;
}

const GoogleReviewQR: React.FC<GoogleReviewQRProps> = ({ className = "", showControls = true }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    
    // Use the actual Google Review Link here
    const reviewLink = "https://g.page/r/royal-the-gym/review"; 

    useEffect(() => {
        toDataURL(reviewLink, { width: 500, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
            .then(url => setQrCodeUrl(url));
    }, []);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        try {
            const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
            const link = document.createElement('a');
            link.download = 'Royal_Google_Review_Card.png';
            link.href = canvas.toDataURL();
            link.click();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={`flex flex-col items-center gap-4 ${className}`}>
            {/* THE CARD DESIGN */}
            <div 
                ref={cardRef}
                className="bg-white w-[300px] aspect-[4/5] rounded-3xl shadow-2xl p-6 flex flex-col items-center justify-between relative overflow-hidden text-black select-none"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                {/* Google Bar */}
                <div className="w-full h-2 absolute top-0 left-0 flex">
                    <div className="h-full w-1/4 bg-[#4285F4]"></div>
                    <div className="h-full w-1/4 bg-[#34A853]"></div>
                    <div className="h-full w-1/4 bg-[#FBBC05]"></div>
                    <div className="h-full w-1/4 bg-[#EA4335]"></div>
                </div>

                <div className="mt-4 text-center w-full">
                    <GoogleIcon className="w-12 h-12 mx-auto mb-3 drop-shadow-sm" />
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-none mb-3">Rate us on Google</h2>
                    <div className="flex gap-1.5 justify-center">
                        {[1,2,3,4,5].map(i => (
                            <StarIcon key={i} className="w-6 h-6 text-[#FBBC05] fill-current drop-shadow-sm" />
                        ))}
                    </div>
                </div>

                <div className="relative">
                    {/* The Qr Code */}
                    {qrCodeUrl && <img src={qrCodeUrl} alt="Review QR" className="w-40 h-40 object-contain mix-blend-multiply" />}
                    
                    {/* Center Star Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white p-1.5 rounded-full shadow-lg border border-gray-100">
                            <StarIcon className="w-6 h-6 text-[#FBBC05] fill-current" />
                        </div>
                    </div>
                </div>

                <div className="text-center w-full pb-2">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">{GYM_INFO.name.toUpperCase()}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">Jhunjhunu</p>
                </div>
            </div>

            {/* Controls */}
            {showControls && (
                <div className="flex gap-3">
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                        <Download className="w-4 h-4" /> Save Card
                    </button>
                    <a 
                        href={reviewLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                        <Share2 className="w-4 h-4" /> Open Link
                    </a>
                </div>
            )}
        </div>
    );
};

export default GoogleReviewQR;
