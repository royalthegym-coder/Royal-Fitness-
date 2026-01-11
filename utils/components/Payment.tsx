
import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import { GYM_INFO, INITIAL_TRANSACTIONS, INITIAL_INVOICES, INITIAL_MEMBERS } from '../../constants';
import { Transaction, Invoice } from '../../types';
import { CopyIcon } from './icons/CopyIcon';
import { toDataURL } from 'qrcode';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { sendPaymentReceipt } from '../../lib/whatsapp';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

const Payment: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'qr' | 'cash'>('qr');
    
    // Form State
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | ''>('');
    const [memberName, setMemberName] = useState('');
    const [memberPhone, setMemberPhone] = useState(''); // New state for receipt
    const [amount, setAmount] = useState('');
    const [sendReceipt, setSendReceipt] = useState(true);

    const [generatedQr, setGeneratedQr] = useState<{ url: string; upi: string; name: string; amt: string; } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
    const [copied, setCopied] = useState(false);

    // Filter only pending/overdue invoices
    const pendingInvoices = useMemo(() => {
        return INITIAL_INVOICES.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue');
    }, []);

    const handleInvoiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
        setSelectedInvoiceId(id);
        const invoice = pendingInvoices.find(inv => inv.id === id);
        if (invoice) {
            setMemberName(invoice.memberName);
            setAmount(invoice.amount.toString());
            // Find member phone for receipt
            const member = INITIAL_MEMBERS.find(m => m.id === invoice.memberId);
            if (member) setMemberPhone(member.phone);
        } else {
            setMemberName('');
            setAmount('');
            setMemberPhone('');
        }
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

            // Simulate payment confirmation
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
        setTransactions(prev => [newTransaction, ...prev]);
        
        // Automated Receipt Logic
        if (sendReceipt && memberPhone) {
            await sendPaymentReceipt(memberName, memberPhone, numericAmount, txnId);
            alert(`Payment Recorded! Receipt sent to ${memberName} via WhatsApp.`);
        } else {
            alert(`Payment Recorded successfully.`);
        }

        handleClear();
    };

    const handleClear = () => {
        setMemberName('');
        setAmount('');
        setMemberPhone('');
        setSelectedInvoiceId('');
        setGeneratedQr(null);
        setIsProcessing(false);
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
                                    onChange={handleInvoiceSelect}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-amber-500"
                                    disabled={isProcessing}
                                >
                                    <option value="">-- Manual Entry --</option>
                                    {pendingInvoices.map(inv => (
                                        <option key={inv.id} value={inv.id}>
                                            #{inv.id} - {inv.memberName} (₹{inv.amount}) - {inv.packageName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="memberName" className="block text-sm font-medium text-gray-300">Member Name</label>
                                <input
                                    type="text" id="memberName" value={memberName} onChange={(e) => setMemberName(e.target.value)}
                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Enter member's full name"
                                    disabled={isProcessing}
                                />
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Amount (₹)</label>
                                <input
                                    type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="e.g., 1500"
                                    disabled={isProcessing}
                                />
                            </div>

                            {/* Automation Toggle */}
                            <div className="flex items-center pt-2">
                                <input 
                                    id="receipt" 
                                    type="checkbox" 
                                    checked={sendReceipt} 
                                    onChange={(e) => setSendReceipt(e.target.checked)}
                                    className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                                    disabled={!memberPhone}
                                />
                                <label htmlFor="receipt" className={`ml-2 text-sm font-medium ${memberPhone ? 'text-gray-300' : 'text-gray-500'}`}>
                                    Send WhatsApp Receipt {memberPhone ? '' : '(No phone linked)'}
                                </label>
                                {sendReceipt && memberPhone && <WhatsAppIcon className="w-4 h-4 text-green-500 ml-2" />}
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
