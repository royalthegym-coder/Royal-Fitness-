
import React, { useRef, useState, useEffect } from 'react';
import { GYM_INFO } from '../../../constants';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { X, Printer, Smartphone, Star as StarIcon } from 'lucide-react';
import { toDataURL } from 'qrcode';

interface ReceiptProps {
    invoiceId: string;
    memberName: string;
    memberPhone: string;
    amount: number;
    date: string;
    method: string;
    items?: { description: string; amount: number; type?: string }[]; 
    onClose: () => void;
}

const ReceiptTemplate: React.FC<ReceiptProps> = ({ 
    invoiceId, 
    memberName, 
    memberPhone, 
    amount, 
    date, 
    method,
    items,
    onClose 
}) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQr, setGeneratedQr] = useState<string>('');
    const [reviewQr, setReviewQr] = useState<string>('');

    // Generate QRs on mount
    useEffect(() => {
        const generateQRs = async () => {
            try {
                // Payment Verification QR (UPI String)
                const upiString = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${amount.toFixed(2)}&cu=INR&tn=Inv-${invoiceId}`;
                const payUrl = await toDataURL(upiString, { width: 100, margin: 0, color: { dark: '#000000', light: '#ffffff' } });
                setGeneratedQr(payUrl);

                // Review QR (Google Business)
                const reviewLink = "https://g.page/r/royal-the-gym/review";
                const reviewUrl = await toDataURL(reviewLink, { width: 100, margin: 0, color: { dark: '#000000', light: '#ffffff' } });
                setReviewQr(reviewUrl);
            } catch (e) {
                console.error("QR Gen Error", e);
            }
        };
        generateQRs();
    }, [amount, invoiceId]);

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setIsGenerating(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 800)); 

            const canvas = await html2canvas(receiptRef.current, {
                scale: 3, 
                backgroundColor: '#ffffff',
                useCORS: true,
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
            console.error("Receipt generation error", error);
            alert("Error generating receipt PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Default items if none provided
    const lineItems = items && items.length > 0 ? items : [{ description: 'Gym Membership Fees', amount: amount, type: 'Membership' }];
    const subTotal = lineItems.filter(i => i.amount > 0).reduce((acc, item) => acc + item.amount, 0);
    const totalDiscount = Math.abs(lineItems.filter(i => i.amount < 0).reduce((acc, item) => acc + item.amount, 0));

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl overflow-y-auto p-4 font-sans">
            <div className="w-full max-w-[210mm] flex flex-col gap-6 animate-fade-in-up">
                
                {/* Control Bar */}
                <div className="flex justify-between items-center bg-gray-900/90 p-4 rounded-2xl border border-amber-500/30 backdrop-blur-md shadow-2xl sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_15px_#22c55e]">
                            <CheckCircleIcon className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-sm uppercase tracking-wider">Receipt Generated</h3>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="bg-amber-500 hover:bg-amber-400 text-black font-black py-2 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 text-sm uppercase tracking-wider"
                        >
                            {isGenerating ? 'Rendering...' : <><Printer className="w-4 h-4" /> Download PDF</>}
                        </button>
                    </div>
                </div>

                {/* --- FINAL A4 RECEIPT CANVAS --- */}
                <div 
                    ref={receiptRef} 
                    className="bg-white text-slate-900 relative shadow-2xl mx-auto overflow-hidden w-full flex flex-col"
                    style={{ aspectRatio: '1/1.414', maxWidth: '800px', fontFamily: "'Inter', sans-serif" }} 
                >
                    {/* TOP ACCENT LINE */}
                    <div className="h-2 w-full bg-[#1e293b]"></div>

                    {/* WATERMARK BACKGROUND */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.06]">
                         <div className="transform -rotate-45 flex flex-col items-center justify-center whitespace-nowrap select-none">
                             <h1 className="text-6xl font-black text-slate-900 uppercase tracking-tighter">ROYAL THE GYM</h1>
                             <h1 className="text-[8rem] font-black text-slate-900 uppercase tracking-[0.2em] -mt-4 opacity-50">OFFICIAL</h1>
                         </div>
                    </div>

                    {/* --- HEADER SECTION --- */}
                    <div className="p-10 pb-4 flex justify-between items-start relative z-10">
                        {/* Logo & Name */}
                        <div className="flex gap-4">
                             <img 
                                src={GYM_INFO.logo} 
                                alt="Logo" 
                                className="w-20 h-20 object-contain drop-shadow-md"
                                crossOrigin="anonymous"
                            />
                            <div className="flex flex-col justify-center">
                                <h1 className="text-5xl font-black text-[#1e293b] tracking-tighter uppercase leading-none" style={{ fontFamily: "'Russo One', sans-serif" }}>
                                    ROYAL
                                </h1>
                                <h2 className="text-2xl font-bold text-[#d97706] tracking-[0.3em] uppercase leading-tight font-serif-display">
                                    THE GYM
                                </h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">International Fitness Hub</p>
                            </div>
                        </div>

                        {/* Invoice Label */}
                        <div className="text-right">
                            <h2 className="text-6xl font-black text-slate-100 uppercase tracking-tighter leading-none select-none">INVOICE</h2>
                            <p className="text-lg font-bold text-[#1e293b] font-mono mt-[-10px] relative z-10">#{invoiceId}</p>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{date}</p>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200 mx-auto w-[90%] mb-8"></div>

                    {/* --- BODY SECTION --- */}
                    <div className="px-12 flex-grow relative z-10 flex flex-col">
                        
                        {/* ADDRESS & BILL INFO GRID */}
                        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-dashed border-slate-300">
                            {/* LEFT: Billed To + QR Codes */}
                            <div className="flex flex-col justify-between">
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
                                    <h3 className="text-2xl font-black text-[#1e293b] capitalize leading-none">{memberName}</h3>
                                    <p className="text-sm font-medium text-slate-600 mt-1 flex items-center gap-1">
                                        <Smartphone className="w-3 h-3" /> {memberPhone}
                                    </p>
                                    <span className="inline-block mt-2 text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                                        Premium Member
                                    </span>
                                </div>
                                
                                {/* QR CODES - Positioned under Candidate Name */}
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                        <div className="bg-white p-1 rounded border border-slate-100">
                                             {reviewQr && <img src={reviewQr} className="w-10 h-10 object-contain mix-blend-multiply" alt="Review" />}
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Rate Us</p>
                                            <p className="text-[8px] font-bold text-[#fbbf24]">Google</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                        <div className="bg-white p-1 rounded border border-slate-100">
                                             {generatedQr && <img src={generatedQr} className="w-10 h-10 object-contain mix-blend-multiply" alt="Pay" />}
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Verify</p>
                                            <p className="text-[8px] font-bold text-green-600">Payment</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Invoice Details & Payable To */}
                            <div className="text-right flex flex-col justify-between">
                                <div className="mb-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payable To</p>
                                    <h3 className="text-lg font-bold text-[#1e293b]">Royal The Gym</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed max-w-[220px] ml-auto">
                                        2nd floor, Vishwakarma Complex, Gandhi Chowk, Khemi Sati Road, Jhunjhunu (Raj.) 333001
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">{GYM_INFO.email}</p>
                                </div>
                                <div>
                                    <div className="inline-block text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</p>
                                        <p className="text-sm font-bold text-slate-800">{method}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ITEMS TABLE */}
                        <div className="mb-8">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-[#1e293b]">
                                        <th className="py-3 text-left text-xs font-black text-[#1e293b] uppercase tracking-widest">Description</th>
                                        <th className="py-3 text-center text-xs font-black text-[#1e293b] uppercase tracking-widest">Type</th>
                                        <th className="py-3 text-right text-xs font-black text-[#1e293b] uppercase tracking-widest">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-700">
                                    {lineItems.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-100">
                                            <td className="py-4 font-bold text-[#1e293b]">
                                                {item.description}
                                            </td>
                                            <td className="py-4 text-center text-xs uppercase font-medium text-slate-500">{item.type || 'Service'}</td>
                                            <td className={`py-4 text-right font-mono font-bold text-lg ${item.amount < 0 ? 'text-green-600' : 'text-[#1e293b]'}`}>
                                                {item.amount < 0 ? `- ₹${Math.abs(item.amount).toLocaleString()}` : `₹${item.amount.toLocaleString()}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* TOTALS */}
                            <div className="flex justify-end mt-6">
                                <div className="w-64">
                                    <div className="flex justify-between py-2 text-xs font-medium text-slate-500">
                                        <span>Subtotal</span>
                                        <span>₹{subTotal.toLocaleString()}</span>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div className="flex justify-between py-2 text-xs font-medium text-green-600">
                                            <span>Discount</span>
                                            <span>- ₹{totalDiscount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-2 text-xs font-medium text-slate-500 border-b border-slate-200 pb-2">
                                        <span>Tax (Incl.)</span>
                                        <span>₹0.00</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4">
                                        <span className="text-sm font-black text-[#1e293b] uppercase tracking-widest">Total</span>
                                        <span className="text-3xl font-black text-[#d97706] font-serif-display">₹{amount.toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase tracking-wider">Paid via {method}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- FOOTER: TERMS & SIGNATURE --- */}
                        <div className="mt-auto grid grid-cols-2 gap-12 items-end border-t-4 border-[#b45309] pt-8 pb-12">
                            
                            {/* Terms */}
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] mb-3">Terms & Conditions</h4>
                                <ul className="text-[9px] text-slate-500 space-y-1.5 list-disc list-inside font-medium leading-tight">
                                    <li>Fees once paid are <span className="text-red-600 font-bold">NON-REFUNDABLE</span> under any circumstances.</li>
                                    <li>Membership is non-transferable & valid for paid duration only.</li>
                                    <li>Please carry your digital ID for entry. Gym rules apply.</li>
                                    <li>This receipt is electronically generated & valid without physical signature.</li>
                                </ul>
                            </div>

                            {/* Signature & Stamp */}
                            <div className="flex justify-end relative">
                                <div className="relative w-56 h-56 flex items-center justify-center">
                                    {/* AUTHENTIC CIRCULAR STAMP */}
                                    <div className="absolute inset-0 z-0">
                                        <svg viewBox="0 0 200 200" className="w-full h-full text-red-700 opacity-85 mix-blend-multiply transform -rotate-12">
                                            {/* Rings */}
                                            <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="4" />
                                            <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1" />
                                            
                                            {/* Paths for text */}
                                            <defs>
                                                <path id="curveTop" d="M 30,100 A 70,70 0 1,1 170,100" fill="none" />
                                                <path id="curveBottom" d="M 40,100 A 60,60 0 0,0 160,100" fill="none" />
                                            </defs>

                                            {/* Circular Text */}
                                            <text fill="currentColor" fontSize="16" fontWeight="bold" letterSpacing="0.05em">
                                                <textPath href="#curveTop" startOffset="50%" textAnchor="middle" className="uppercase font-black" style={{fontFamily: "'Russo One', sans-serif"}}>
                                                    ROYAL THE GYM
                                                </textPath>
                                            </text>
                                            
                                            {/* Bottom Text - Jhunjhunu */}
                                            <text x="100" y="150" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor" letterSpacing="0.1em" style={{fontFamily: "'Inter', sans-serif"}}>
                                                JHUNJHUNU
                                            </text>

                                            {/* Center Content */}
                                            <g transform="translate(100, 95)">
                                                <rect x="-65" y="-20" width="130" height="40" fill="none" stroke="currentColor" strokeWidth="2" />
                                                <text x="0" y="5" textAnchor="middle" fontSize="28" fontWeight="900" fill="currentColor" style={{fontFamily: "'Inter', sans-serif"}}>PAID</text>
                                                <text x="0" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" letterSpacing="0.3em" style={{fontFamily: "'Inter', sans-serif"}}>VERIFIED</text>
                                            </g>
                                        </svg>
                                    </div>

                                    {/* Signature Overlay (Matching Uploaded Image Style - Single Line Forced - NO UNDERLINE) */}
                                    <div className="relative z-10 transform -rotate-6 translate-y-[-20px] flex flex-col items-center">
                                        {/* Signature Text - Dark Blue, Bold, Cursive - whitespace-nowrap added */}
                                        <p className="font-signature text-6xl font-bold text-[#000080] leading-none whitespace-nowrap" 
                                           style={{ 
                                               fontFamily: "'Great Vibes', cursive", 
                                               textShadow: "0.5px 0.5px 0px #000080" 
                                           }}>
                                            Mahesh Saini
                                        </p>
                                    </div>
                                </div>
                                <p className="absolute bottom-6 right-2 text-[8px] font-black text-[#1e293b] uppercase tracking-[0.2em]">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bottom Bar */}
                    <div className="h-8 w-full bg-slate-100 flex items-center justify-between px-12">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">Thank you for choosing Royal The Gym</p>
                        <p className="text-[8px] font-mono text-slate-300">1/1</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptTemplate;
