
import React, { useRef, useState } from 'react';
import { GYM_INFO } from '../../../constants';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon'; // Fallback icon
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { SparkleIcon } from '../icons/SparkleIcon';
import { InvoiceItem } from '../../../types';

interface ReceiptProps {
    invoiceId: string;
    memberName: string;
    memberPhone: string;
    amount: number;
    date: string;
    method: string;
    packageName?: string;
    // New prop for detailed items. If missing, we fallback to packageName
    items?: InvoiceItem[]; 
    onClose: () => void;
}

const ReceiptTemplate: React.FC<ReceiptProps> = ({ 
    invoiceId, 
    memberName, 
    memberPhone, 
    amount, 
    date, 
    method,
    packageName = "Gym Membership",
    items,
    onClose 
}) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setIsGenerating(true);

        try {
            // Wait a moment for images to ensure loading
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(receiptRef.current, {
                scale: 3, 
                backgroundColor: '#111827', 
                useCORS: true, // Critical for external images
                logging: false,
                allowTaint: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Royal_Receipt_${invoiceId}.pdf`);
        } catch (error) {
            console.error("Receipt generation failed", error);
            alert("Could not generate PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Determine lines to show
    const lineItems = items && items.length > 0 ? items : [{ description: packageName, amount: amount, type: 'membership' }];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto p-4">
            <div className="w-full max-w-xl">
                {/* Actions Header */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-lg">Payment Receipt</h3>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-lg">Close</button>
                        <button 
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-2 px-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <span className="flex items-center"><span className="animate-spin mr-2">⏳</span> Generating...</span>
                            ) : (
                                <span>Download PDF</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* THE RECEIPT CANVAS */}
                <div ref={receiptRef} className="bg-[#111827] border-[6px] border-double border-amber-600/60 p-8 rounded-none relative overflow-hidden shadow-2xl min-h-[700px] flex flex-col justify-between">
                    
                    {/* 1. Background Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-[0.05]">
                        <img 
                            src={GYM_INFO.logo} 
                            crossOrigin="anonymous"
                            alt="Watermark"
                            className="w-[500px] h-[500px] object-contain grayscale"
                        />
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full z-0"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full z-0"></div>

                    <div className="relative z-10">
                        {/* 2. Header with Logo (Top Left) */}
                        <div className="border-b-2 border-amber-500/30 pb-6 mb-8 flex items-start justify-between">
                            <div className="flex flex-col items-start gap-4">
                                {/* LOGO SLOT - Enhanced for the Crest */}
                                <div className="w-40 h-40 relative z-10 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                    <img 
                                        src={GYM_INFO.logo} 
                                        alt="Royal Gym Logo" 
                                        crossOrigin="anonymous" // Essential for HTML2Canvas
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'; // Hide if fails
                                            const fallback = document.getElementById('logo-fallback');
                                            if(fallback) fallback.style.display = 'flex';
                                        }} 
                                    />
                                    {/* Fallback Icon */}
                                    <div id="logo-fallback" className="hidden items-center justify-center bg-black/50 rounded-full border-2 border-amber-500 w-full h-full">
                                         <ShieldCheckIcon className="w-16 h-16 text-amber-400" />
                                    </div>
                                </div>
                                
                                {/* Address Details */}
                                <div className="mt-2 pl-3 border-l-2 border-amber-500/50">
                                    <h1 className="text-xl font-display font-black text-white tracking-wide leading-none mb-1">ROYAL THE GYM</h1>
                                    <div className="text-[10px] text-gray-400 font-mono leading-relaxed max-w-[200px]">
                                        <p>{GYM_INFO.address}</p>
                                        <p className="mt-1 text-amber-500 font-semibold">{GYM_INFO.contact}</p>
                                        <p className="text-gray-500">{GYM_INFO.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right pt-2">
                                <div className="inline-block border-2 border-amber-500/50 px-4 py-1 rounded mb-3 bg-amber-900/10">
                                    <h2 className="text-2xl font-bold text-amber-400 uppercase tracking-widest">
                                        RECEIPT
                                    </h2>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Invoice No.</p>
                                    <p className="font-mono text-xl text-white font-bold mb-2">#{invoiceId}</p>
                                    
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
                                    <p className="text-sm text-white font-medium">{date}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bill To Info */}
                        <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/10 to-transparent"></div>
                            <div>
                                <p className="text-[10px] text-amber-500 uppercase font-bold mb-2 tracking-wider">Billed To</p>
                                <h3 className="text-2xl font-bold text-white mb-1 font-display tracking-wide">{memberName}</h3>
                                <p className="text-sm text-gray-400 font-mono">{memberPhone}</p>
                            </div>
                            <div className="text-right flex flex-col justify-center items-end">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-wider">Payment Status</p>
                                <div className="inline-flex items-center bg-green-900/30 border border-green-500/50 px-6 py-2 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                    <span className="text-green-400 font-black uppercase tracking-widest text-sm">PAID</span>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 mb-8">
                            <table className="w-full text-left">
                                <thead className="bg-gray-900 text-gray-400 border-b border-gray-700">
                                    <tr className="text-[10px] uppercase font-bold tracking-wider">
                                        <th className="p-4 pl-6">Description</th>
                                        <th className="p-4 text-center">Type</th>
                                        <th className="p-4 text-right pr-6">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {lineItems.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-700/50 last:border-0">
                                            <td className="p-6 text-white font-medium">
                                                <div className="flex items-center">
                                                    <SparkleIcon className="w-4 h-4 text-amber-500 mr-3" />
                                                    <div>
                                                        <p className="text-lg font-bold">{item.description}</p>
                                                        {idx === 0 && <p className="text-xs text-gray-500 mt-1">Gym Service</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center text-gray-400 font-mono uppercase">
                                                {/* Use item type if available, else generic */}
                                                {(item as any).type || 'Service'}
                                            </td>
                                            <td className="p-6 text-right text-white font-bold font-mono text-lg">
                                                ₹{item.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end mb-12">
                            <div className="w-full max-w-xs space-y-3">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Method</span>
                                    <span className="font-mono uppercase">{method}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="font-mono">₹{amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Tax (Included)</span>
                                    <span className="font-mono">₹0.00</span>
                                </div>
                                <div className="flex justify-between text-3xl font-black text-amber-400 border-t border-gray-600 pt-3 mt-2">
                                    <span className="text-lg text-white font-bold self-end mb-1">Total</span>
                                    <span>₹{amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Footer / Signature Section */}
                    <div className="relative z-10">
                        <div className="grid grid-cols-2 gap-8 items-end border-t-2 border-dashed border-gray-700 pt-8">
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-3 tracking-wider">Terms & Conditions</p>
                                <ul className="text-[9px] text-gray-500 list-disc list-inside space-y-1.5 font-medium opacity-80">
                                    <li>Fees once paid are non-refundable & non-transferable.</li>
                                    <li>Member agrees to follow all gym safety rules.</li>
                                    <li>This is a computer generated receipt.</li>
                                </ul>
                            </div>
                            
                            <div className="flex flex-col items-center justify-end">
                                {/* SIGNATURE: Using 'Great Vibes' font to simulate realistic signature */}
                                <div className="relative mb-2 px-8">
                                    <p className="font-signature text-4xl text-blue-400 transform -rotate-2 leading-none whitespace-nowrap" style={{ textShadow: '0 0 1px rgba(96, 165, 250, 0.5)' }}>
                                        Mahesh Saini
                                    </p>
                                </div>
                                <div className="w-48 h-px bg-gray-600 mb-2"></div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">Authorized Signature</p>
                            </div>
                        </div>
                        
                        <div className="mt-8 text-center">
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.5em] opacity-80">COMMIT TO BE FIT</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReceiptTemplate;
