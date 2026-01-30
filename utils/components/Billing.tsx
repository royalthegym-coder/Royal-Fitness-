
import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, InvoiceItem } from '../../types';
import { INITIAL_STAFF } from '../../constants';
import Card from './common/Card';
import Modal from './common/Modal';
import { View } from '../../types';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { BotIcon } from './icons/BotIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { useData } from '../context/DataProvider'; // Import Context
import { DumbbellIcon } from './icons/DumbbellIcon';
import { UserIcon } from './icons/UserIcon';

interface BillingProps {
    setCurrentView: (view: View) => void;
}

const getLocalToday = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const Billing: React.FC<BillingProps> = ({ setCurrentView }) => {
    // Consume Data Context
    const { members, invoices, packages, addInvoice } = useData();

    const [filter, setFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
    
    // Smart Wizard State
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    
    // Wizard Data
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
    const [includeMembership, setIncludeMembership] = useState(true);
    const [includeTraining, setIncludeTraining] = useState(false);
    
    // Custom Items for Accessories/Admission
    const [customItem, setCustomItem] = useState({ desc: '', amount: 0, type: 'product' as const });
    
    const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);

    // Derived Wizard Data (Using Live Context Data)
    const selectedMember = useMemo(() => members.find(m => m.id === selectedMemberId), [selectedMemberId, members]);
    const memberPackage = useMemo(() => packages.find(p => p.id === selectedMember?.packageId), [selectedMember, packages]);
    const memberTrainer = useMemo(() => INITIAL_STAFF.find(s => s.id === selectedMember?.trainerId), [selectedMember]);

    // Auto-select checkboxes based on member data
    useEffect(() => {
        if (selectedMember) {
            setIncludeMembership(true);
            setIncludeTraining(!!selectedMember.trainerId);
        }
    }, [selectedMember]);

    const filteredInvoices = useMemo(() => {
        if (filter === 'All') return invoices;
        return invoices.filter(invoice => invoice.status === filter);
    }, [invoices, filter]);

    // --- WIZARD HANDLERS ---

    const handleGeneratePreview = async () => {
        setIsAiProcessing(true);
        // Simulate AI Thinking
        await new Promise(r => setTimeout(r, 1000));
        
        const items: InvoiceItem[] = [];
        let total = 0;

        if (includeMembership && memberPackage) {
            items.push({
                description: `Membership Due: ${memberPackage.name}`,
                amount: memberPackage.price,
                type: 'membership'
            });
            total += memberPackage.price;
        }

        if (includeTraining && memberTrainer) {
            const ptPrice = selectedMember?.trainerFees || 5000; 
            items.push({
                description: `Personal Training (${memberTrainer.name})`,
                amount: ptPrice,
                type: 'training'
            });
            total += ptPrice;
        }

        if (customItem.desc && customItem.amount > 0) {
            items.push({
                description: customItem.desc,
                amount: customItem.amount,
                type: customItem.type as any
            });
            total += customItem.amount;
        }

        const newInv: Invoice = {
            id: invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1,
            memberId: selectedMember!.id,
            memberName: selectedMember!.name,
            packageId: memberPackage?.id || 0,
            packageName: items.map(i => i.description).join(' + '),
            amount: total,
            items: items,
            date: getLocalToday(),
            status: 'Pending'
        };

        setGeneratedInvoice(newInv);
        setIsAiProcessing(false);
        setWizardStep(2);
    };

    const handleFinalizeInvoice = () => {
        if (generatedInvoice) {
            // Use Context to add invoice globally
            addInvoice(generatedInvoice);
            
            setIsWizardOpen(false);
            // Don't redirect, just close so Admin can create more
            alert(`Payment Barcode Generated for ${generatedInvoice.memberName}. It is now visible on their Member Panel.`);
            setWizardStep(1);
            setGeneratedInvoice(null);
        }
    };

    const getStatusColor = (status: Invoice['status']) => {
        switch(status) {
            case 'Paid': return 'bg-green-500';
            case 'Pending': return 'bg-yellow-500';
            case 'Overdue': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Quick add helpers
    const setQuickItem = (desc: string, amt: number, type: 'product' | 'membership' | 'other') => {
        setCustomItem({ desc, amount: amt, type: type as any });
    };
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-400">Smart Billing & Barcode Gen</h1>
                    <p className="text-gray-400 text-sm">Generate Payment Requests for Admission, Fees & Accessories</p>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={() => { 
                         setWizardStep(1); 
                         setGeneratedInvoice(null); 
                         setSelectedMemberId('');
                         setIsWizardOpen(true); 
                     }} className="bg-amber-500 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors shadow-lg flex items-center">
                        <QrCodeIcon className="w-5 h-5 mr-2" />
                        Generate Member Bill
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
                                <th className="p-3 hidden md:table-cell">Breakdown</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(invoice => (
                                <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 font-mono text-gray-400">#{invoice.id.toString().padStart(4, '0')}</td>
                                    <td className="p-3 font-medium text-white">{invoice.memberName}</td>
                                    <td className="p-3 hidden md:table-cell text-sm text-gray-300 truncate max-w-xs">{invoice.packageName}</td>
                                    <td className="p-3 font-bold text-amber-400">₹{invoice.amount.toLocaleString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-400">{invoice.date}</td>
                                    <td className="p-3">
                                        {invoice.status !== 'Paid' && (
                                            <button 
                                                onClick={() => {
                                                    sessionStorage.setItem('latest_invoice_id', invoice.id.toString());
                                                    setCurrentView('payment');
                                                }}
                                                className="text-blue-400 hover:text-blue-300 font-semibold text-xs flex items-center bg-blue-400/10 px-3 py-1.5 rounded transition-colors"
                                            >
                                                <QrCodeIcon className="w-3 h-3 mr-1" /> View Code
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            {/* SMART BILLING WIZARD MODAL */}
            <Modal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} title="Generate Payment Barcode">
                {wizardStep === 1 && (
                    <div className="space-y-6">
                        {/* Member Select */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">1. Select Member</label>
                            <select 
                                value={selectedMemberId} 
                                onChange={(e) => setSelectedMemberId(parseInt(e.target.value))}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            >
                                <option value="">-- Choose Member --</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        {selectedMember && (
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 animate-fade-in space-y-4">
                                <div className="flex items-center gap-3 border-b border-gray-700 pb-3">
                                    <div className="p-2 bg-blue-900/30 rounded-full text-blue-400">
                                        <BotIcon className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Create Bill For:</p>
                                        <p className="text-xs text-gray-400">Select categories to include in QR Code.</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* Membership Fee Toggle */}
                                    <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${includeMembership ? 'bg-amber-900/20 border-amber-500/50' : 'bg-gray-900 border-gray-700'}`}>
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={includeMembership} onChange={e => setIncludeMembership(e.target.checked)} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500 bg-gray-700 border-gray-600" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-200">Admission / Due Fees</p>
                                                <p className="text-xs text-gray-400">{memberPackage?.name} ({memberPackage?.duration})</p>
                                            </div>
                                        </div>
                                        <span className="font-mono text-amber-400 font-bold">₹{memberPackage?.price}</span>
                                    </label>

                                    {/* Accessory / Other */}
                                    <div className="pt-2 border-t border-gray-700">
                                        <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Add Accessories / One-time Charge</p>
                                        
                                        <div className="flex gap-2 mb-3">
                                            <button type="button" onClick={() => setQuickItem('Protein Shake', 150, 'product')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">Protein</button>
                                            <button type="button" onClick={() => setQuickItem('Gym Belt', 500, 'product')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">Belt</button>
                                            <button type="button" onClick={() => setQuickItem('Water Bottle', 200, 'product')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">Bottle</button>
                                            <button type="button" onClick={() => setQuickItem('Admission Fee', 1000, 'membership')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-amber-400 border border-amber-500/30">Admission</button>
                                        </div>

                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Item Name (e.g. Protein, Belt)" value={customItem.desc} onChange={e => setCustomItem({...customItem, desc: e.target.value})} className="flex-grow bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white" />
                                            <input type="number" placeholder="₹" value={customItem.amount || ''} onChange={e => setCustomItem({...customItem, amount: parseFloat(e.target.value)})} className="w-24 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button 
                                onClick={handleGeneratePreview}
                                disabled={!selectedMember}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAiProcessing ? (
                                    <>
                                        <AutoUpdateIcon className="w-5 h-5 mr-2 animate-spin" /> Generating Code...
                                    </>
                                ) : (
                                    'Create & Send to Member'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {wizardStep === 2 && generatedInvoice && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                            <div className="inline-block p-3 bg-green-500/20 rounded-full mb-2">
                                <CheckCircleIcon className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Bill Created Successfully</h3>
                            <p className="text-gray-400 text-sm">The payment barcode is now available on the Member's Panel.</p>
                        </div>

                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                            <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-3">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Billed To</p>
                                    <p className="font-bold text-white">{generatedInvoice.memberName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase">Type</p>
                                    <p className="text-white">
                                        {generatedInvoice.items?.some(i => i.type === 'product') ? 'Accessories' : 'Fees/Admission'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                {generatedInvoice.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-300">{item.description}</span>
                                        <span className="text-white font-mono">₹{item.amount}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-800 pt-3 mt-3 flex justify-between items-center">
                                <span className="text-lg font-bold text-amber-400">Total Payable</span>
                                <span className="text-2xl font-black text-white">₹{generatedInvoice.amount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setWizardStep(1)} className="py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 font-bold transition-colors">
                                Edit
                            </button>
                            <button onClick={handleFinalizeInvoice} className="py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold transition-colors shadow-lg shadow-green-900/20 flex items-center justify-center">
                                <CheckCircleIcon className="w-5 h-5 mr-2" />
                                Confirm & Publish
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Billing;
