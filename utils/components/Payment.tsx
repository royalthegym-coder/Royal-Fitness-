
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { GYM_INFO } from '../../constants';
import { Transaction, Invoice, InvoiceItem } from '../../types';
import { CopyIcon } from './icons/CopyIcon';
import { toDataURL } from 'qrcode';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { sendPaymentReceipt } from '../../lib/whatsapp';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import ReceiptTemplate from './common/ReceiptTemplate';
import { SparkleIcon } from './icons/SparkleIcon';
import { DumbbellIcon } from './icons/DumbbellIcon';
import { UserIcon } from './icons/UserIcon';
import { useData } from '../context/DataProvider'; // Import Context

export const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const Payment: React.FC = () => {
    // Consume Context
    const { invoices, updateInvoiceStatus, transactions, addTransaction, members } = useData();

    const [activeTab, setActiveTab] = useState<'qr' | 'cash'>('qr');
    
    // Form State
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | ''>('');
    const [memberName, setMemberName] = useState('');
    const [memberPhone, setMemberPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [packageName, setPackageName] = useState('');
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[] | undefined>(undefined);
    const [sendReceipt, setSendReceipt] = useState(true);

    // Manual Entry Smart State
    const [manualItems, setManualItems] = useState<InvoiceItem[]>([]);

    const [generatedQr, setGeneratedQr] = useState<{ url: string; upi: string; name: string; amt: string; } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    // Receipt State
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

    // Derived from Context
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue');

    // Auto-select invoice passed from Billing
    useEffect(() => {
        const pendingId = sessionStorage.getItem('latest_invoice_id');
        if (pendingId) {
            const id = parseInt(pendingId);
            const invoice = pendingInvoices.find(inv => inv.id === id);
            if (invoice) {
                handleInvoiceSelection(invoice);
            }
            sessionStorage.removeItem('latest_invoice_id');
        }
    }, [pendingInvoices]); // Trigger when pendingInvoices updates (e.g. initial load)

    useEffect(() => {
        if (!selectedInvoiceId && manualItems.length > 0) {
            const total = manualItems.reduce((sum, item) => sum + item.amount, 0);
            setAmount(total.toString());
        }
    }, [manualItems, selectedInvoiceId]);

    const handleInvoiceSelection = (invoice: Invoice) => {
        setSelectedInvoiceId(invoice.id);
        setMemberName(invoice.memberName);
        setAmount(invoice.amount.toString());
        setPackageName(invoice.packageName);
        setInvoiceItems(invoice.items);
        setManualItems([]);
        
        const member = members.find(m => m.id === invoice.memberId);
        if (member) setMemberPhone(member.phone);
    };

    const handleInvoiceSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
        if (!id) {
            handleClear();
            return;
        }
        const invoice = pendingInvoices.find(inv => inv.id === id);
        if (invoice) handleInvoiceSelection(invoice);
    };

    const handleAddManualItem = (description: string, price: number, type: InvoiceItem['type']) => {
        if (selectedInvoiceId) {
            setSelectedInvoiceId('');
            setPackageName('');
            setInvoiceItems(undefined);
        }
        setManualItems(prev => [...prev, { description, amount: price, type }]);
    };

    const handleClearManualItems = () => {
        setManualItems([]);
        setAmount('');
    };

    const handleGenerateQr = async () => {
        if (!memberName.trim() || !amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid member name and amount.');
            return;
        }

        const numericAmount = parseFloat(amount);
        const upiUri = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${numericAmount.toFixed(2)}&cu=INR&tn=Payment for ${encodeURIComponent(memberName)}`;
        
        try {
            const qrCodeUrl = await toDataURL(upiUri, { width: 250, margin: 2 });
            setGeneratedQr({
                url: qrCodeUrl,
                upi: GYM_INFO.upiIds.gpay1,
                name: memberName,
                amt: numericAmount.toFixed(2),
            });
            setIsProcessing(true);

            setTimeout(async () => {
                await processSuccess('QR Code', numericAmount);
            }, 5000);
        } catch (err) {
            console.error("Error generating QR code", err);
            alert("Failed to generate QR code");
        }
    };

    const handleRecordCashPayment = async () => {
        if (!memberName.trim() || !amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid member name and amount.');
            return;
        }
        const numericAmount = parseFloat(amount);
        setIsProcessing(true);
        await processSuccess('Cash', numericAmount);
    };

    const processSuccess = async (method: 'QR Code' | 'Cash', numericAmount: number) => {
        const txnId = `TXN${Math.floor(Math.random() * 90000) + 10000}`;
        const newTransaction: Transaction = {
            id: txnId,
            memberName: memberName,
            amount: numericAmount,
            date: new Date().toISOString().split('T')[0],
            method: method,
        };
        
        // --- GLOBAL STATE UPDATE ---
        addTransaction(newTransaction);
        if (selectedInvoiceId) {
            updateInvoiceStatus(Number(selectedInvoiceId), 'Paid');
        }
        // ---------------------------
        
        setLastTransaction(newTransaction);
        
        if (sendReceipt && memberPhone) {
            sendPaymentReceipt(memberName, memberPhone, numericAmount, txnId);
        }

        setShowReceipt(true);
        setIsProcessing(false);
        setGeneratedQr(null);
    };

    const handleReceiptClose = () => {
        setShowReceipt(false);
        handleClear();
    };

    const handleClear = () => {
        setMemberName('');
        setAmount('');
        setMemberPhone('');
        setPackageName('');
        setInvoiceItems(undefined);
        setManualItems([]);
        setSelectedInvoiceId('');
        setGeneratedQr(null);
        setIsProcessing(false);
        setLastTransaction(null);
    };
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const getMethodColor = (method: 'QR Code' | 'Cash') => {
        return method === 'QR Code' ? 'bg-blue-500' : 'bg-green-500';
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-6">Point of Sale</h1>
            
            {showReceipt && lastTransaction && (
                <ReceiptTemplate 
                    invoiceId={lastTransaction.id}
                    memberName={lastTransaction.memberName}
                    memberPhone={memberPhone || "N/A"}
                    amount={lastTransaction.amount}
                    date={lastTransaction.date}
                    method={lastTransaction.method}
                    packageName={packageName || (manualItems.length > 0 ? "Custom Payment" : "Gym Service")}
                    items={selectedInvoiceId ? invoiceItems : (manualItems.length > 0 ? manualItems : undefined)}
                    onClose={handleReceiptClose}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Terminal Card */}
                <Card>
                    <div className="border-b border-gray-700">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => setActiveTab('qr')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'qr' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                                Pay via QR Code
                            </button>
                            <button onClick={() => setActiveTab('cash')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cash' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                                Record Cash Payment
                            </button>
                        </nav>
                    </div>
                    <div className="pt-6">
                         {/* Common Form Fields */}
                        <div className="space-y-4">
                            {/* Invoice Selection */}
                            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Pending Invoice</label>
                                <select 
                                    value={selectedInvoiceId} 
                                    onChange={handleInvoiceSelectChange}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-amber-500"
                                    disabled={isProcessing}
                                >
                                    <option value="">-- Manual Entry / POS --</option>
                                    {pendingInvoices.map(inv => (
                                        <option key={inv.id} value={inv.id}>
                                            #{inv.id} - {inv.memberName} (₹{inv.amount})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Smart Add-ons for Manual Mode */}
                            {!selectedInvoiceId && (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Quick Add (Smart POS)</p>
                                    <div className="flex gap-2 flex-wrap">
                                        <button 
                                            onClick={() => handleAddManualItem("Personal Training", 5000, 'training')}
                                            className="flex items-center text-xs bg-purple-900/30 text-purple-400 border border-purple-500/30 px-3 py-2 rounded hover:bg-purple-900/50 transition-colors"
                                        >
                                            <DumbbellIcon className="w-3 h-3 mr-1" /> + PT (₹5000)
                                        </button>
                                        <button 
                                            onClick={() => handleAddManualItem("Monthly Membership", 1500, 'membership')}
                                            className="flex items-center text-xs bg-amber-900/30 text-amber-400 border border-amber-500/30 px-3 py-2 rounded hover:bg-amber-900/50 transition-colors"
                                        >
                                            <UserIcon className="w-3 h-3 mr-1" /> + Gym Fee (₹1500)
                                        </button>
                                        <button 
                                            onClick={() => handleAddManualItem("Supplements", 2000, 'product')}
                                            className="flex items-center text-xs bg-green-900/30 text-green-400 border border-green-500/30 px-3 py-2 rounded hover:bg-green-900/50 transition-colors"
                                        >
                                            <SparkleIcon className="w-3 h-3 mr-1" /> + Product (₹2000)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Item Display */}
                            {(selectedInvoiceId ? (invoiceItems && invoiceItems.length > 0) : (manualItems.length > 0)) && (
                                <div className="bg-gray-800/50 p-2 rounded text-xs text-gray-300 relative group">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold">Billing Items:</p>
                                        {!selectedInvoiceId && <button onClick={handleClearManualItems} className="text-[10px] text-red-400 hover:underline">Clear All</button>}
                                    </div>
                                    <ul className="space-y-1">
                                        {(selectedInvoiceId ? invoiceItems : manualItems)?.map((item, idx) => (
                                            <li key={idx} className="flex justify-between border-b border-gray-700/50 pb-1 last:border-0 last:pb-0">
                                                <span>{item.description}</span>
                                                <span className="font-mono text-white">₹{item.amount}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <label htmlFor="memberName" className="block text-sm font-medium text-gray-300">Member Name</label>
                                <input
                                    type="text" id="memberName" value={memberName} onChange={(e) => setMemberName(e.target.value)}
                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Enter member's full name"
                                    disabled={isProcessing || !!selectedInvoiceId}
                                />
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Total Amount (₹)</label>
                                <input
                                    type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 font-bold text-lg"
                                    placeholder="0.00"
                                    disabled={isProcessing || !!selectedInvoiceId || manualItems.length > 0}
                                />
                            </div>

                            {/* Automation Toggle */}
                            <div className="flex items-center pt-2 p-3 bg-green-900/10 rounded-lg border border-green-500/20">
                                <input 
                                    id="receipt" 
                                    type="checkbox" 
                                    checked={sendReceipt} 
                                    onChange={(e) => setSendReceipt(e.target.checked)}
                                    className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                                    disabled={!memberPhone && !selectedInvoiceId} 
                                />
                                <div className="ml-2">
                                    <label htmlFor="receipt" className={`text-sm font-bold ${memberPhone || selectedInvoiceId ? 'text-green-400' : 'text-gray-500'}`}>
                                        Auto-Send Digital Receipt via WhatsApp
                                    </label>
                                    <p className="text-xs text-gray-400">Includes Transaction ID & Royal Branding.</p>
                                </div>
                                {sendReceipt && <WhatsAppIcon className="w-5 h-5 text-green-500 ml-auto" />}
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'qr' && (
                            !generatedQr ? (
                                <div className="flex justify-end pt-4">
                                    <button onClick={handleGenerateQr} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors shadow-lg">
                                        Generate QR
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center mt-4">
                                    <p className="mb-2 text-gray-300">Scan to pay <span className="font-bold text-amber-400">₹{generatedQr.amt}</span> for {generatedQr.name}.</p>
                                    <div className="bg-white p-4 inline-block rounded-lg mt-2 shadow-xl border-4 border-white">
                                        <img src={generatedQr.url} alt="Generated UPI QR Code" />
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg mt-4 max-w-sm mx-auto border border-gray-600">
                                        <div>
                                            <p className="text-sm text-gray-400">UPI ID</p>
                                            <p className="font-mono text-white text-sm sm:text-base break-all">{generatedQr.upi}</p>
                                        </div>
                                        <button onClick={() => handleCopy(generatedQr.upi)} className={`text-sm font-bold py-1 px-3 rounded-md transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}>
                                            {copied ? 'Copied!' : <CopyIcon />}
                                        </button>
                                    </div>
                                    {isProcessing && (
                                        <div className="mt-4 text-center text-blue-400 animate-pulse flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Waiting for payment confirmation...
                                        </div>
                                    )}
                                    <button onClick={handleClear} className="mt-4 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">
                                        Cancel Transaction
                                    </button>
                                </div>
                            )
                        )}
                        {activeTab === 'cash' && (
                            <div className="flex justify-end pt-4">
                                <button 
                                    onClick={handleRecordCashPayment} 
                                    disabled={isProcessing}
                                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
                                >
                                    {isProcessing ? 'Recording...' : <><CheckCircleIcon className="w-5 h-5 mr-2" /> Record Cash Payment</>}
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Recent Transactions Card */}
                <Card title="Recent Transactions">
                    <div className="overflow-x-auto h-96 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-400">
                                    <th className="p-3">Member</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(txn => (
                                    <tr key={txn.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="p-3">
                                            <p>{txn.memberName}</p>
                                            <p className="text-xs text-gray-500 font-mono">{txn.id}</p>
                                        </td>
                                        <td className="p-3 font-semibold">₹{txn.amount.toLocaleString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getMethodColor(txn.method)}`}>
                                                {txn.method}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Payment;
