
import React, { useRef, useState } from 'react';
import { GYM_INFO } from '../../../constants';
import { UploadIcon } from '../icons/UploadIcon';
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
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [logoSrc, setLogoSrc] = useState(GYM_INFO.logo);

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setIsGenerating(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(receiptRef.current, {
                scale: 3, 
                backgroundColor: '#ffffff', // White background for print
                useCORS: true, 
                logging: false,
                allowTaint: true,
                ignoreElements: (element) => element.hasAttribute('data-html2canvas-ignore') 
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

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setLogoSrc(event.target.result as string);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

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

                {/* THE RECEIPT CANVAS (White Background for Print Quality) */}
                <div ref={receiptRef} className="bg-white relative overflow-hidden shadow-2xl min-h-[700px] flex flex-col justify-between border-b-4 border-yellow-600">
                    
                    {/* Background Watermark */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none z-0">
                        <img 
                            src={logoSrc} 
                            crossOrigin="anonymous"
                            alt="Watermark"
                            className="w-[400px] h-[400px] object-contain grayscale"
                        />
                    </div>

                    <div className="relative z-10 p-8">
                        {/* Header with Logo Centered and Above Name */}
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                {/* LOGO SLOT */}
                                <div 
                                    className="w-24 h-24 relative group cursor-pointer"
                                    onClick={() => logoInputRef.current?.click()}
                                    title="Click to upload custom logo"
                                >
                                    <img 
                                        src={logoSrc} 
                                        alt="Royal Gym Logo" 
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-contain filter drop-shadow-md"
                                    />
                                    
                                    {/* Upload Overlay */}
                                    <div 
                                        data-html2canvas-ignore="true"
                                        className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <UploadIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={logoInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleLogoUpload}
                                    />
                                </div>
                                
                                <div>
                                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                                        Royal <span className="text-yellow-600">The Gym</span>
                                    </h1>
                                    <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Jhunjhunu Premium Fitness</p>
                                    <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                                        <p>{GYM_INFO.address}</p>
                                        <p>{GYM_INFO.contact} • {GYM_INFO.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest">Receipt</h2>
                                <p className="font-mono text-lg font-bold text-slate-700">#{invoiceId}</p>
                                <p className="text-sm text-slate-500">{date}</p>
                            </div>
                        </div>

                        {/* Golden Divider Line */}
                        <div className="w-full h-1 bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 mb-8"></div>

                        {/* Bill To Info */}
                        <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div>
                                <p className="text-[10px] text-yellow-600 uppercase font-bold mb-2 tracking-wider">Billed To</p>
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">{memberName}</h3>
                                <p className="text-sm text-slate-500 font-mono">{memberPhone}</p>
                            </div>
                            <div className="text-right flex flex-col justify-center items-end">
                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-wider">Payment Status</p>
                                <div className="inline-flex items-center bg-green-100 border border-green-200 px-6 py-2 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-green-600 mr-2"></div>
                                    <span className="text-green-700 font-black uppercase tracking-widest text-sm">PAID</span>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="mb-8">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-white border-b border-slate-700">
                                    <tr className="text-[10px] uppercase font-bold tracking-wider">
                                        <th className="p-4 pl-6 rounded-tl-lg">Description</th>
                                        <th className="p-4 text-center">Type</th>
                                        <th className="p-4 text-right pr-6 rounded-tr-lg">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm border border-slate-200">
                                    {lineItems.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 last:border-0 even:bg-slate-50">
                                            <td className="p-6 text-slate-900 font-medium">
                                                <div className="flex items-center">
                                                    <SparkleIcon className="w-4 h-4 text-yellow-500 mr-3" />
                                                    <div>
                                                        <p className="text-lg font-bold">{item.description}</p>
                                                        {idx === 0 && <p className="text-xs text-slate-500 mt-1">Gym Service</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center text-slate-500 font-mono uppercase">
                                                {(item as any).type || 'Service'}
                                            </td>
                                            <td className="p-6 text-right text-slate-900 font-bold font-mono text-lg">
                                                ₹{item.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end mb-12">
                            <div className="w-full max-w-xs space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Method</span>
                                    <span className="font-mono uppercase text-slate-900 font-bold">{method}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Subtotal</span>
                                    <span className="font-mono">₹{amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Tax (Included)</span>
                                    <span className="font-mono">₹0.00</span>
                                </div>
                                <div className="flex justify-between text-3xl font-black text-yellow-600 border-t border-slate-300 pt-3 mt-2">
                                    <span className="text-lg text-slate-900 font-bold self-end mb-1">Total</span>
                                    <span>₹{amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signature Section */}
                    <div className="relative z-10 bg-slate-50 p-8 border-t border-slate-200">
                        <div className="grid grid-cols-2 gap-8 items-end">
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-wider">Terms & Conditions</p>
                                <ul className="text-[9px] text-slate-500 list-disc list-inside space-y-1.5 font-medium opacity-80">
                                    <li>Fees once paid are non-refundable & non-transferable.</li>
                                    <li>Member agrees to follow all gym safety rules.</li>
                                    <li>This is a computer generated receipt.</li>
                                </ul>
                            </div>
                            
                            <div className="flex flex-col items-center justify-end">
                                <div className="relative mb-2 px-8">
                                    <p className="font-signature text-4xl text-blue-600 transform -rotate-2 leading-none whitespace-nowrap opacity-80" style={{ textShadow: '0 0 1px rgba(37, 99, 235, 0.3)' }}>
                                        Mahesh Saini
                                    </p>
                                </div>
                                <div className="w-48 h-px bg-slate-400 mb-2"></div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">Authorized Signature</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 text-center">
                            <p className="text-[10px] text-yellow-700 font-bold uppercase tracking-[0.5em] opacity-80">COMMIT TO BE FIT</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptTemplate;
