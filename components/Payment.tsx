
import React, { useState } from 'react';
import Card from './common/Card';
import { GYM_INFO, INITIAL_TRANSACTIONS } from '../constants';
import { Transaction } from '../types';
import { CopyIcon } from './icons/CopyIcon';

const Payment: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'qr' | 'cash'>('qr');
    const [memberName, setMemberName] = useState('');
    const [amount, setAmount] = useState('');
    const [generatedQr, setGeneratedQr] = useState<{ url: string; upi: string; name: string; amt: string; } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
    const [copied, setCopied] = useState(false);

    const handleGenerateQr = () => {
        if (!memberName.trim() || !amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid member name and amount.');
            return;
        }

        const numericAmount = parseFloat(amount);
        const upiUri = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${numericAmount.toFixed(2)}&cu=INR&tn=Payment for ${encodeURIComponent(memberName)}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

        setGeneratedQr({
            url: qrCodeUrl,
            upi: GYM_INFO.upiIds.gpay1,
            name: memberName,
            amt: numericAmount.toFixed(2),
        });
        setIsProcessing(true);

        // Simulate payment confirmation
        setTimeout(() => {
            const newTransaction: Transaction = {
                id: `TXN${Math.floor(Math.random() * 90000) + 10000}`,
                memberName: memberName,
                amount: numericAmount,
                date: new Date().toISOString().split('T')[0],
                method: 'QR Code',
            };
            setTransactions(prev => [newTransaction, ...prev]);
            handleClear();
        }, 5000);
    };

    const handleRecordCashPayment = () => {
        if (!memberName.trim() || !amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid member name and amount.');
            return;
        }
        const numericAmount = parseFloat(amount);
        const newTransaction: Transaction = {
            id: `TXN${Math.floor(Math.random() * 90000) + 10000}`,
            memberName: memberName,
            amount: numericAmount,
            date: new Date().toISOString().split('T')[0],
            method: 'Cash',
        };
        setTransactions(prev => [newTransaction, ...prev]);
        alert(`Cash payment of ₹${numericAmount} for ${memberName} recorded successfully.`);
        handleClear();
    };


    const handleClear = () => {
        setMemberName('');
        setAmount('');
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
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'qr' && (
                            !generatedQr ? (
                                <div className="flex justify-end pt-4">
                                    <button onClick={handleGenerateQr} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors">
                                        Generate QR
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center mt-4">
                                    <p className="mb-2 text-gray-300">Scan to pay <span className="font-bold text-amber-400">₹{generatedQr.amt}</span> for {generatedQr.name}.</p>
                                    <div className="bg-white p-4 inline-block rounded-lg mt-2">
                                        <img src={generatedQr.url} alt="Generated UPI QR Code" />
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg mt-4 max-w-sm mx-auto">
                                        <div>
                                            <p className="text-sm text-gray-400">UPI ID</p>
                                            <p className="font-mono text-white text-sm sm:text-base break-all">{generatedQr.upi}</p>
                                        </div>
                                        <button onClick={() => handleCopy(generatedQr.upi)} className={`text-sm font-bold py-1 px-3 rounded-md transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}>
                                            {copied ? 'Copied!' : <CopyIcon />}
                                        </button>
                                    </div>
                                    {isProcessing && (
                                        <div className="mt-4 text-center text-blue-400 animate-pulse">
                                            <p>Waiting for payment confirmation...</p>
                                        </div>
                                    )}
                                    <button onClick={handleClear} className="mt-4 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            )
                        )}
                        {activeTab === 'cash' && (
                            <div className="flex justify-end pt-4">
                                <button onClick={handleRecordCashPayment} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-400 transition-colors">
                                    Record Cash Payment
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Recent Transactions Card */}
                <Card title="Recent Transactions">
                    <div className="overflow-x-auto h-96 overflow-y-auto">
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
