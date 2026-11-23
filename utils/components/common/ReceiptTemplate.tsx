import { getCurrencySymbol } from '../../store/useCurrencyStore';

import React, { useRef, useState, useEffect } from 'react';
import { GYM_INFO } from '../../../constants';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { X, Printer, Smartphone, MapPin, Phone, Mail, User } from 'lucide-react';
import { toDataURL } from 'qrcode';
import { useGym } from '../../context/GymProvider';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { normalizeSafeExternalUrl } from '../../imageUpload';

interface ReceiptProps {
    invoiceId: string;
    memberName: string;
    memberId?: number | string;
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
    memberId,
    memberPhone,
    amount,
    date,
    method,
    items,
    onClose
}) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const { currentGym } = useGym();
    const { globalFees } = useData();
    const { addToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQr, setGeneratedQr] = useState<string>('');
    const [locationQr, setLocationQr] = useState<string>('');

    const gymName = currentGym?.gymName || GYM_INFO.name || 'Fitness Future';
    const ownerName = currentGym?.ownerName || (GYM_INFO as any).ownerName || '';
    const gymAddress = currentGym?.address || GYM_INFO.address || 'Address configured in Gym Settings';
    const gymPhone = currentGym?.phone || GYM_INFO.contact || '';
    const gymEmail = currentGym?.email || GYM_INFO.email || '';
    const gymUpiId = currentGym?.paymentUpiId || currentGym?.upiId || GYM_INFO.upiIds?.gpay1 || '';
    const gymLogoUrl = currentGym?.logoUrl || (GYM_INFO as any).logoUrl || '';
    const ownerSignatureUrl = currentGym?.signatureUrl || globalFees?.receiptSignature || (GYM_INFO as any).signatureUrl || '';
    const googleLocationLink = normalizeSafeExternalUrl(
        currentGym?.googleLocationUrl || (GYM_INFO as any).googleLocationUrl || gymAddress
    );

    // Generate Payment Verification & Google Location QRs dynamically from currentGym
    useEffect(() => {
        const generateQRs = async () => {
            try {
                if (gymUpiId) {
                    const upiString = `upi://pay?pa=${encodeURIComponent(gymUpiId)}&pn=${encodeURIComponent(gymName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Inv-${invoiceId}`)}`;
                    const payUrl = await toDataURL(upiString, { width: 100, margin: 0, color: { dark: '#000000', light: '#ffffff' } });
                    setGeneratedQr(payUrl);
                } else {
                    setGeneratedQr('');
                }

                if (googleLocationLink) {
                    const locUrl = await toDataURL(googleLocationLink, { width: 100, margin: 0, color: { dark: '#000000', light: '#ffffff' } });
                    setLocationQr(locUrl);
                } else {
                    setLocationQr('');
                }
            } catch (e) {
                console.error("QR Gen Error", e);
            }
        };
        generateQRs();
    }, [amount, invoiceId, gymName, gymUpiId, googleLocationLink]);

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setIsGenerating(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 600));

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
            pdf.save(`${gymName.replace(/\s+/g, '_')}_Receipt_${invoiceId}.pdf`);
            addToast('Official receipt PDF downloaded!', 'success');
        } catch (error) {
            console.error("Receipt generation error", error);
            addToast('Error generating receipt PDF. Please try again.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const lineItems = items && items.length > 0 ? items : [{ description: 'Gym Membership Fees', amount: amount, type: 'Membership' }];
    const subTotal = lineItems.filter(i => i.amount > 0).reduce((acc, item) => acc + item.amount, 0);
    const totalDiscount = Math.abs(lineItems.filter(i => i.amount < 0).reduce((acc, item) => acc + item.amount, 0));
    const stampLabel = gymName.toUpperCase().slice(0, 22);

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
                            <h3 className="text-white font-black text-sm uppercase tracking-wider">{gymName} — Official Receipt</h3>
                            {ownerName && <p className="text-[11px] text-gray-400">Authorized by {ownerName}</p>}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                        <button
                            type="button"
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.05]">
                        <div className="transform -rotate-45 flex flex-col items-center justify-center whitespace-nowrap select-none">
                            <h1 className="text-6xl font-black text-slate-900 uppercase tracking-tighter">{gymName}</h1>
                            <h1 className="text-[8rem] font-black text-slate-900 uppercase tracking-[0.2em] -mt-4 opacity-50">OFFICIAL</h1>
                        </div>
                    </div>

                    {/* --- HEADER SECTION --- */}
                    <div className="p-10 pb-4 flex justify-between items-start relative z-10">
                        {/* Gym Logo & Name */}
                        <div className="flex gap-4 items-center">
                            {gymLogoUrl ? (
                                <img
                                    src={gymLogoUrl}
                                    alt={gymName}
                                    className="w-16 h-16 rounded-xl object-contain bg-slate-50 p-1 border border-slate-300"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-[#1e293b] text-white flex items-center justify-center font-black text-2xl uppercase">
                                    {gymName.charAt(0)}
                                </div>
                            )}
                            <div className="flex flex-col justify-center">
                                <h1 className="text-3xl font-black text-[#1e293b] tracking-tighter uppercase leading-none" style={{ fontFamily: "'Russo One', sans-serif" }}>
                                    {gymName}
                                </h1>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 max-w-[320px]">{gymAddress}</p>
                                {ownerName && (
                                    <p className="text-[10px] font-semibold text-slate-600 mt-0.5 flex items-center gap-1">
                                        <User className="w-3 h-3 text-amber-600" /> Owner: {ownerName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Invoice Label */}
                        <div className="text-right">
                            <h2 className="text-6xl font-black text-slate-100 uppercase tracking-tighter leading-none select-none">INVOICE</h2>
                            <p className="text-lg font-bold text-[#1e293b] font-mono mt-[-10px] relative z-10">#{invoiceId}</p>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{date}</p>
                        </div>
                    </div>

                    <div className="w-[90%] h-px bg-slate-200 mx-auto mb-8"></div>

                    {/* --- BODY SECTION --- */}
                    <div className="px-12 flex-grow relative z-10 flex flex-col">

                        {/* ADDRESS & BILL INFO GRID */}
                        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-dashed border-slate-300">
                            {/* LEFT: Billed To + QR Codes */}
                            <div className="flex flex-col justify-between">
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
                                    <h3 className="text-2xl font-black text-[#1e293b] capitalize leading-none">{memberName}</h3>
                                    {memberId && (
                                        <p className="text-sm font-bold text-[#d97706] mt-1">
                                            Member ID: #{memberId}
                                        </p>
                                    )}
                                    <p className="text-sm font-medium text-slate-600 mt-1 flex items-center gap-1">
                                        <Smartphone className="w-3 h-3" /> {memberPhone}
                                    </p>
                                    <span className="inline-block mt-2 text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                                        Registered Member
                                    </span>
                                </div>

                                {/* QR CODES - Google Location & UPI Payment Verification */}
                                <div className="flex gap-4">
                                    {locationQr && (
                                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                            <div className="bg-white p-1 rounded border border-slate-100">
                                                <img src={locationQr} alt="Google Location QR" className="w-16 h-16 object-contain mx-auto" />
                                            </div>
                                            <div>
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Google</p>
                                                <p className="text-[8px] font-bold text-indigo-600">Location</p>
                                            </div>
                                        </div>
                                    )}
                                    {generatedQr && (
                                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                            <div className="bg-white p-1 rounded border border-slate-100">
                                                <img src={generatedQr} alt="UPI Verification QR" className="w-16 h-16 object-contain mx-auto" />
                                            </div>
                                            <div>
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">UPI Verify</p>
                                                <p className="text-[8px] font-bold text-green-600">Payment</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: Payable To (Dynamic Gym Owner Details) */}
                            <div className="text-right flex flex-col justify-between">
                                <div className="mb-4 space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payable To</p>
                                    <h3 className="text-lg font-black text-[#1e293b]">{gymName}</h3>
                                    {ownerName && (
                                        <p className="text-xs font-bold text-slate-700">Owner: {ownerName}</p>
                                    )}
                                    <p className="text-xs text-slate-500 leading-relaxed max-w-[240px] ml-auto">
                                        {gymAddress}
                                    </p>
                                    {gymPhone && (
                                        <p className="text-xs text-slate-600 font-semibold flex items-center justify-end gap-1">
                                            <Phone className="w-3 h-3 text-slate-400" /> {gymPhone}
                                        </p>
                                    )}
                                    {gymEmail && (
                                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                            <Mail className="w-3 h-3 text-slate-400" /> {gymEmail}
                                        </p>
                                    )}
                                    {gymUpiId && (
                                        <p className="text-xs font-mono font-bold text-emerald-700 pt-0.5">
                                            UPI: {gymUpiId}
                                        </p>
                                    )}
                                    {currentGym?.googleLocationUrl && (
                                        <a
                                            href={googleLocationLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-end gap-1 text-[10px] font-bold text-indigo-600 hover:underline pt-0.5"
                                        >
                                            <MapPin className="w-3 h-3" /> Google Maps Location
                                        </a>
                                    )}
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
                                                {item.amount < 0 ? `- ${getCurrencySymbol()}${Math.abs(item.amount).toLocaleString()}` : `${getCurrencySymbol()}${item.amount.toLocaleString()}`}
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
                                        <span>{getCurrencySymbol()}{subTotal.toLocaleString()}</span>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div className="flex justify-between py-2 text-xs font-medium text-green-600">
                                            <span>Discount</span>
                                            <span>- {getCurrencySymbol()}{totalDiscount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-2 text-xs font-medium text-slate-500 border-b border-slate-200 pb-2">
                                        <span>Tax (Incl.)</span>
                                        <span>{getCurrencySymbol()}0.00</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4">
                                        <span className="text-sm font-black text-[#1e293b] uppercase tracking-widest">Total</span>
                                        <span className="text-3xl font-black text-[#d97706] font-serif-display">{getCurrencySymbol()}{amount.toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase tracking-wider">Paid via {method}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- FOOTER: TERMS & OWNER SIGNATURE + STAMP --- */}
                        <div className="mt-auto grid grid-cols-2 gap-12 items-end border-t-4 border-[#b45309] pt-8 pb-10">

                            {/* Terms */}
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] mb-3">Terms &amp; Conditions</h4>
                                <ul className="text-[9px] text-slate-500 space-y-1.5 list-disc list-inside font-medium leading-tight">
                                    <li>Fees once paid are <span className="text-red-600 font-bold">NON-REFUNDABLE</span> under any circumstances.</li>
                                    <li>Membership is non-transferable &amp; valid for paid duration only.</li>
                                    <li>Please carry your digital ID for entry. Gym rules apply.</li>
                                    <li>Official receipt issued by {gymName}{ownerName ? ` (${ownerName})` : ''}.</li>
                                </ul>
                            </div>

                            {/* Dynamic Circular Stamp & Uploaded Gym Owner Signature */}
                            <div className="flex justify-end relative">
                                <div className="relative w-56 h-52 flex flex-col items-center justify-end pb-6">
                                    {/* AUTHENTIC CIRCULAR STAMP */}
                                    <div className="absolute top-0 right-2 w-40 h-40 z-0 pointer-events-none">
                                        <svg viewBox="0 0 200 200" className="w-full h-full text-red-700 opacity-75 mix-blend-multiply transform -rotate-12">
                                            <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="4" />
                                            <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1" />
                                            <defs>
                                                <path id="curveTop" d="M 30,100 A 70,70 0 1,1 170,100" fill="none" />
                                            </defs>
                                            <text fill="currentColor" fontSize="14" fontWeight="bold" letterSpacing="0.05em">
                                                <textPath href="#curveTop" startOffset="50%" textAnchor="middle" className="uppercase font-black" style={{ fontFamily: "'Russo One', sans-serif" }}>
                                                    {stampLabel}
                                                </textPath>
                                            </text>
                                            <text x="100" y="152" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" letterSpacing="0.08em" style={{ fontFamily: "'Inter', sans-serif" }}>
                                                {(ownerName || gymName).toUpperCase().slice(0, 20)}
                                            </text>
                                            <g transform="translate(100, 95)">
                                                <rect x="-65" y="-20" width="130" height="40" fill="none" stroke="currentColor" strokeWidth="2" />
                                                <text x="0" y="5" textAnchor="middle" fontSize="26" fontWeight="900" fill="currentColor" style={{ fontFamily: "'Inter', sans-serif" }}>PAID</text>
                                                <text x="0" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" letterSpacing="0.3em" style={{ fontFamily: "'Inter', sans-serif" }}>VERIFIED</text>
                                            </g>
                                        </svg>
                                    </div>

                                    {/* Uploaded Gym Owner Signature Image */}
                                    <div className="relative z-10 flex flex-col items-center mt-auto">
                                        {ownerSignatureUrl ? (
                                            <img
                                                src={ownerSignatureUrl}
                                                alt={`${ownerName || gymName} Signature`}
                                                className="max-h-16 max-w-[190px] object-contain mb-1 mix-blend-multiply"
                                            />
                                        ) : (
                                            <p
                                                className="font-signature text-5xl font-bold text-[#000080] leading-none whitespace-nowrap mb-1"
                                                style={{
                                                    fontFamily: "'Great Vibes', cursive",
                                                    textShadow: "0.5px 0.5px 0px #000080"
                                                }}
                                            >
                                                {ownerName || 'Authorized'}
                                            </p>
                                        )}
                                        <div className="w-44 h-px bg-slate-400 mb-1"></div>
                                        <p className="text-[8px] font-black text-[#1e293b] uppercase tracking-[0.15em] text-center">
                                            Authorized Signatory{ownerName ? ` • ${ownerName}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="h-8 w-full bg-slate-100 flex items-center justify-between px-12">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">Thank you for choosing {gymName}</p>
                        <p className="text-[8px] font-mono text-slate-400">1/1</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptTemplate;
