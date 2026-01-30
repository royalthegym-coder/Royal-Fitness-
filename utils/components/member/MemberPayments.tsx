
import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../context/DataProvider';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { QrCodeIcon } from '../icons/QrCodeIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { GYM_INFO } from '../../../constants';
import { toDataURL } from 'qrcode';
import { Invoice } from '../../../types';
import { DumbbellIcon } from '../icons/DumbbellIcon';
import { UserIcon } from '../icons/UserIcon';
import { PackageIcon } from '../icons/NavIcons';
import { ShareIcon } from '../icons/ShareIcon'; // Need to add this icon or use existing
import html2canvas from 'html2canvas';

const MemberPayments: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { invoices, updateInvoiceStatus, addTransaction, members } = useData();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    
    // Social Victory Share State
    const [showShareCard, setShowShareCard] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const member = members.find(m => m.id === memberId);

    // Filter invoices for this member
    const myInvoices = useMemo(() => 
        invoices.filter(inv => inv.memberId === memberId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [invoices, memberId]);

    const pendingInvoices = myInvoices.filter(inv => inv.status !== 'Paid');
    const paidInvoices = myInvoices.filter(inv => inv.status === 'Paid');

    const handleOpenPayment = async (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setPaymentSuccess(false);
        setIsProcessing(false);
        setShowShareCard(false);
        
        // Generate UPI URI
        const amount = invoice.amount.toFixed(2);
        const upiUri = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${amount}&cu=INR&tn=Inv_${invoice.id}`;
        
        try {
            const url = await toDataURL(upiUri, { width: 300, margin: 2, color: { dark: '#000', light: '#fff' } });
            setQrCodeUrl(url);
        } catch (err) {
            console.error("QR Generation failed", err);
        }
    };

    const handleConfirmPayment = (method: 'UPI' | 'Cash') => {
        if (!selectedInvoice) return;
        setIsProcessing(true);

        // Simulate Gateway Handshake / Admin Verification with "Neural Delay"
        setTimeout(() => {
            updateInvoiceStatus(selectedInvoice.id, 'Paid');
            addTransaction({
                id: `TXN-${method}-${Date.now()}`,
                memberName: selectedInvoice.memberName,
                amount: selectedInvoice.amount,
                date: new Date().toISOString().split('T')[0],
                method: method === 'UPI' ? 'QR Code' : 'Cash'
            });
            setIsProcessing(false);
            setPaymentSuccess(true);
            setShowShareCard(true); // Trigger share card visibility
        }, 1500);
    };

    const handleShareVictory = async () => {
        if (!cardRef.current) return;
        
        try {
            const canvas = await html2canvas(cardRef.current, { backgroundColor: '#000' });
            const dataUrl = canvas.toDataURL('image/png');
            
            // Mobile share
            if (navigator.share) {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], 'royal_victory.png', { type: 'image/png' });
                await navigator.share({
                    title: 'Royal Beast Mode Unlocked',
                    text: `Just crushed my renewal at ${GYM_INFO.name}! Ready for gains. #RoyalTheGym #Fitness`,
                    files: [file],
                });
            } else {
                // Desktop download
                const link = document.createElement('a');
                link.download = 'royal_victory.png';
                link.href = dataUrl;
                link.click();
            }
        } catch (e) {
            console.error("Sharing failed", e);
        }
    };

    const getIconForInvoice = (invoice: Invoice) => {
        if (invoice.packageName.toLowerCase().includes('protein') || invoice.packageName.toLowerCase().includes('bottle') || invoice.packageName.toLowerCase().includes('belt')) {
            return <DumbbellIcon className="w-5 h-5 text-purple-400" />;
        }
        if (invoice.packageName.toLowerCase().includes('admission')) {
            return <UserIcon className="w-5 h-5 text-blue-400" />;
        }
        return <PackageIcon />; // Default membership
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-amber-400 flex items-center">
                        <DollarSignIcon className="mr-2" /> Payments & Dues
                    </h2>
                    <p className="text-gray-400 text-sm">Pay Admission, Fees, and Accessories directly.</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-lg">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Total Due</p>
                    <p className="text-2xl font-black text-red-500">
                        ₹{pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PENDING BILLS */}
                <Card title="Pending Payments (Action Required)" className="border-t-4 border-red-500 bg-gray-900/50">
                    <div className="space-y-4">
                        {pendingInvoices.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <CheckCircleIcon className="w-16 h-16 mx-auto mb-2 text-green-500" />
                                <p className="text-gray-400 text-lg font-bold">All Dues Cleared!</p>
                                <p className="text-xs text-gray-500">No pending admission fees or accessories bills.</p>
                            </div>
                        ) : (
                            pendingInvoices.map(inv => (
                                <div key={inv.id} className="bg-gray-800 p-4 rounded-xl border border-gray-600 flex flex-col sm:flex-row justify-between items-center hover:border-amber-500 transition-all shadow-md group">
                                    <div className="flex items-start gap-3 mb-3 sm:mb-0 w-full sm:w-auto">
                                        <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                                            {getIconForInvoice(inv)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-red-900/40 text-red-300 px-2 py-0.5 rounded border border-red-500/30 uppercase font-bold">Due</span>
                                                <p className="text-xs text-gray-500">#{inv.id}</p>
                                            </div>
                                            <h4 className="font-bold text-white text-md mt-1">{inv.packageName}</h4>
                                            <p className="text-xs text-gray-400">{inv.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                                        <p className="text-xl font-black text-amber-400 mb-0 sm:mb-2">₹{inv.amount.toLocaleString()}</p>
                                        <button 
                                            onClick={() => handleOpenPayment(inv)}
                                            className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-6 rounded-full flex items-center shadow-lg transition-transform active:scale-95 animate-pulse"
                                        >
                                            <QrCodeIcon className="w-4 h-4 mr-2" /> PAY NOW
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* RECENT HISTORY */}
                <Card title="Payment History">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {paidInvoices.map(inv => (
                            <div key={inv.id} className="bg-gray-900/40 p-3 rounded-lg border border-gray-800 flex justify-between items-center hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-900/20 rounded-full">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-200">{inv.packageName}</p>
                                        <p className="text-[10px] text-gray-500">{inv.date} • Paid</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white">₹{inv.amount.toLocaleString()}</p>
                                    <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider">Success</span>
                                </div>
                            </div>
                        ))}
                        {paidInvoices.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No payment records found.</p>}
                    </div>
                </Card>
            </div>

            {/* PAYMENT MODAL */}
            <Modal isOpen={!!selectedInvoice} onClose={() => !isProcessing && setSelectedInvoice(null)} title="Secure Payment Gateway">
                {selectedInvoice && (
                    <div className="space-y-6 text-center">
                        {paymentSuccess ? (
                            <div className="py-6 flex flex-col items-center justify-center">
                                {/* Success Animation */}
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.6)] animate-bounce">
                                    <CheckCircleIcon className="w-12 h-12 text-black" />
                                </div>
                                <h3 className="text-2xl font-black text-white">Payment Successful!</h3>
                                <p className="text-gray-300 mt-2">Transaction Confirmed.</p>
                                
                                {/* Social Share Button */}
                                {showShareCard && (
                                    <button 
                                        onClick={handleShareVictory}
                                        className="mt-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center animate-pulse hover:scale-105 transition-transform"
                                    >
                                        <SparkleIcon className="w-5 h-5 mr-2" /> Share Victory Card
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Bill Details */}
                                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-left relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <DollarSignIcon className="w-24 h-24 text-amber-500"/>
                                    </div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">PAYMENT FOR</p>
                                    <h4 className="text-xl font-bold text-white mb-2">{selectedInvoice.packageName}</h4>
                                    <div className="flex justify-between items-end border-t border-gray-700 pt-3">
                                        <span className="text-sm text-gray-400">Total Amount</span>
                                        <span className="text-3xl font-black text-amber-400">₹{selectedInvoice.amount.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* QR Code Section */}
                                <div className="relative inline-block bg-white p-4 rounded-2xl shadow-2xl border-4 border-amber-500/20">
                                    <p className="text-black font-bold text-sm mb-2">Scan with any UPI App</p>
                                    {qrCodeUrl ? (
                                        <img src={qrCodeUrl} alt="UPI QR Code" className="w-64 h-64 mx-auto" />
                                    ) : (
                                        <div className="w-64 h-64 flex items-center justify-center bg-gray-100">
                                            <AutoUpdateIcon className="animate-spin text-amber-500 w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="flex justify-center gap-4 mt-2 opacity-70">
                                        <span className="text-[10px] font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded">GPay</span>
                                        <span className="text-[10px] font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded">PhonePe</span>
                                        <span className="text-[10px] font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded">Paytm</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <button 
                                        onClick={() => handleConfirmPayment('UPI')}
                                        disabled={isProcessing}
                                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95"
                                    >
                                        {isProcessing ? <AutoUpdateIcon className="animate-spin w-6 h-6 mb-1" /> : <CheckCircleIcon className="w-6 h-6 mb-1" />}
                                        <span className="text-sm">Paid via UPI</span>
                                    </button>
                                    <button 
                                        onClick={() => handleConfirmPayment('Cash')}
                                        disabled={isProcessing}
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95"
                                    >
                                        {isProcessing ? <AutoUpdateIcon className="animate-spin w-6 h-6 mb-1" /> : <DollarSignIcon className="w-6 h-6 mb-1" />}
                                        <span className="text-sm">Pay Cash</span>
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setSelectedInvoice(null)}
                                    className="text-gray-500 hover:text-white text-xs underline mt-2"
                                >
                                    Cancel Transaction
                                </button>
                            </>
                        )}
                    </div>
                )}
            </Modal>

            {/* Hidden Victory Card for Image Generation */}
            {showShareCard && member && (
                <div className="fixed top-0 left-[-9999px]">
                    <div 
                        ref={cardRef} 
                        className="w-[1080px] h-[1920px] bg-black text-white relative overflow-hidden flex flex-col items-center justify-center"
                        style={{ fontFamily: 'sans-serif' }}
                    >
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 z-0"></div>
                        <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] bg-amber-500/20 blur-[150px] rounded-full z-0"></div>

                        {/* Content */}
                        <div className="relative z-10 text-center p-20 border-4 border-amber-500/50 rounded-3xl bg-black/40 backdrop-blur-xl">
                            <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 uppercase italic tracking-tighter mb-4 drop-shadow-2xl">
                                ROYAL THE GYM
                            </h1>
                            <div className="w-32 h-2 bg-amber-500 mx-auto rounded-full mb-12"></div>
                            
                            <h2 className="text-6xl font-bold text-white mb-6">MEMBER UNLOCKED</h2>
                            
                            <div className="my-10">
                                <img src={member.avatar} alt="Profile" className="w-64 h-64 rounded-full border-8 border-amber-500 mx-auto object-cover shadow-[0_0_50px_rgba(245,158,11,0.6)]" />
                            </div>

                            <h3 className="text-7xl font-black text-white uppercase">{member.name}</h3>
                            <p className="text-4xl text-amber-400 font-mono mt-4 uppercase tracking-widest">PRO MEMBER • ACTIVE</p>

                            <div className="mt-16 bg-white/10 px-8 py-4 rounded-xl inline-block">
                                <p className="text-2xl font-bold text-gray-300">"Pain is temporary. Glory is forever."</p>
                            </div>
                        </div>

                        <div className="absolute bottom-10 text-center w-full">
                            <p className="text-3xl text-gray-500 font-bold tracking-[0.5em]">JOIN THE PRIDE</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberPayments;
