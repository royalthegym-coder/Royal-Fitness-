
import React, { useState, useMemo } from 'react';
import { Invoice } from '../types';
import { INITIAL_INVOICES, INITIAL_MEMBERS, INITIAL_PACKAGES } from '../constants';
import Card from './common/Card';
import Modal from './common/Modal';
import { View } from '../App';
import { QrCodeIcon } from './icons/QrCodeIcon';

interface BillingProps {
    setCurrentView: (view: View) => void;
}

const Billing: React.FC<BillingProps> = ({ setCurrentView }) => {
    const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
    const [filter, setFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
    const [isModalOpen, setModalOpen] = useState(false);
    
    const filteredInvoices = useMemo(() => {
        if (filter === 'All') return invoices;
        return invoices.filter(invoice => invoice.status === filter);
    }, [invoices, filter]);

    const handleGenerateInvoice = (newInvoiceData: Omit<Invoice, 'id'>) => {
        const newId = Math.max(...invoices.map(i => i.id)) + 1;
        setInvoices([...invoices, { ...newInvoiceData, id: newId }]);
        setModalOpen(false);
    };

    const getStatusColor = (status: Invoice['status']) => {
        switch(status) {
            case 'Paid': return 'bg-green-500';
            case 'Pending': return 'bg-yellow-500';
            case 'Overdue': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-amber-400">Billing</h1>
                <div className="flex items-center gap-2">
                     <button onClick={() => setModalOpen(true)} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors">
                        New Invoice
                    </button>
                    <button 
                        onClick={() => setCurrentView('payment')}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors flex items-center"
                    >
                        <QrCodeIcon className="w-5 h-5 mr-2" />
                        Go to Payment Page
                    </button>
                </div>
            </div>
            <Card>
                <div className="flex space-x-2 mb-4 border-b border-gray-700 pb-4">
                    {(['All', 'Paid', 'Pending', 'Overdue'] as const).map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f)} 
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400">
                                <th className="p-3">Invoice ID</th>
                                <th className="p-3">Member</th>
                                <th className="p-3 hidden md:table-cell">Package</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(invoice => (
                                <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 font-mono text-gray-400">#{invoice.id.toString().padStart(4, '0')}</td>
                                    <td className="p-3">{invoice.memberName}</td>
                                    <td className="p-3 hidden md:table-cell">{invoice.packageName}</td>
                                    <td className="p-3">₹{invoice.amount.toLocaleString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-400">{invoice.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            <NewInvoiceModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleGenerateInvoice} />
        </div>
    );
};

interface NewInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invoice: Omit<Invoice, 'id'>) => void;
}

const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({ isOpen, onClose, onSave }) => {
    const [memberId, setMemberId] = useState<number>(INITIAL_MEMBERS[0]?.id || 0);
    const [packageId, setPackageId] = useState<number>(INITIAL_PACKAGES[0]?.id || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const member = INITIAL_MEMBERS.find(m => m.id === memberId);
        const pkg = INITIAL_PACKAGES.find(p => p.id === packageId);
        if (member && pkg) {
            onSave({
                memberId: member.id,
                memberName: member.name,
                packageId: pkg.id,
                packageName: pkg.name,
                amount: pkg.price,
                date: new Date().toISOString().split('T')[0],
                status: 'Pending',
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate New Invoice">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Select Member</label>
                    <select value={memberId} onChange={(e) => setMemberId(parseInt(e.target.value))} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                        {INITIAL_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Select Package</label>
                    <select value={packageId} onChange={(e) => setPackageId(parseInt(e.target.value))} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                        {INITIAL_PACKAGES.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>)}
                    </select>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors mr-2">Cancel</button>
                    <button type="submit" className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors">Generate</button>
                </div>
            </form>
        </Modal>
    );
};

export default Billing;