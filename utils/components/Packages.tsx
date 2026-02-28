
import React, { useState, useMemo, useEffect } from 'react';
import { Package } from '../../types';
import { useData } from '../context/DataProvider';
import Card from './common/Card';
import Modal from './common/Modal';
import { 
    Plus, Save, X, DollarSign, Clock, Tag, 
    ShieldCheck, Zap, Crown, Target, Cpu, 
    Layers, CheckCircle2, Info, ChevronRight, 
    Sparkles, Flame, ShieldAlert, Fingerprint, Lock,
    Activity, Users, QrCode, RefreshCw, BarChart3
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { BotIcon } from './icons/BotIcon';
import { getComplexResponse } from '../../lib/gemini';
import { toDataURL } from 'qrcode';

const EditIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const TrashIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const ProtocolCard: React.FC<{ 
    pkg: Package; 
    activeCount: number;
    onEdit: (p: Package) => void; 
    onDelete: (id: number) => void;
    isRecommended?: boolean;
    onGenerateToken: (p: Package) => void;
}> = ({ pkg, activeCount, onEdit, onDelete, isRecommended, onGenerateToken }) => {
    
    const annualPrice = useMemo(() => {
        const months = parseInt(pkg.duration.split(' ')[0]) || 1;
        const base = (pkg.price / months) * 12;
        return Math.round(base * 0.8); // 20% Sovereign Discount
    }, [pkg]);

    return (
        <div className={`relative flex flex-col h-full bg-[#080808] border-2 rounded-[2.5rem] p-8 transition-all duration-500 group overflow-hidden ${isRecommended ? 'border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.2)] scale-[1.02]' : 'border-white/5 hover:border-amber-500/50 shadow-2xl'}`}>
            {/* Background Tech Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
            {isRecommended && (
                <div className="absolute top-0 right-0 bg-amber-500 text-black px-6 py-1.5 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest z-20 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Recommended Node
                </div>
            )}
            
            <div className="flex-grow relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] bg-white/5 px-3 py-1 rounded-full border border-white/5 mb-3 inline-block">KEY_ID: 0{pkg.id}</span>
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{pkg.name}</h3>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                         <button onClick={() => onEdit(pkg)} className="p-3 bg-gray-900 border border-white/10 text-cyan-400 rounded-2xl hover:bg-cyan-500 hover:text-black transition-all shadow-xl"><EditIcon className="w-4 h-4"/></button>
                         <button onClick={() => onDelete(pkg.id)} className="p-3 bg-gray-900 border border-white/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                </div>

                <div className="mb-6 relative">
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-white italic tracking-tighter">₹{pkg.price.toLocaleString()}</span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">/ {pkg.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-[10px] font-mono text-gray-400">
                        <div className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                        <span>LIVE NODES: {activeCount} USERS</span>
                    </div>
                    <div className="w-full h-1 bg-gray-900 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-amber-500 w-1/3 animate-shimmer"></div>
                    </div>
                </div>
                
                <ul className="space-y-4 mb-10">
                    {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-4 group/item">
                            <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover/item:bg-amber-500 transition-colors">
                                <CheckCircle2 className="w-3 h-3 text-amber-500 group-hover/item:text-black" />
                            </div>
                            <span className="text-gray-300 text-xs font-bold uppercase tracking-wide group-hover/item:text-white transition-colors">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="mt-auto space-y-4 relative z-10">
                 <div className="bg-green-500/5 p-5 rounded-3xl border border-green-500/20 group-hover:bg-green-500/10 transition-all border-dashed">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[9px] text-green-400 uppercase font-black tracking-widest flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" /> Yearly Sovereign Shield
                        </p>
                        <span className="text-[9px] bg-green-500 text-black px-2 py-0.5 rounded font-black italic">SAVE 20%</span>
                    </div>
                    <p className="text-3xl font-black text-white italic tracking-tighter">₹{annualPrice.toLocaleString()}</p>
                </div>
                <button 
                    onClick={() => onGenerateToken(pkg)}
                    className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-amber-500 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 uppercase tracking-widest text-[11px] italic flex items-center justify-center gap-3 group/btn"
                >
                    <QrCode className="w-4 h-4"/> Generate Digital Key
                </button>
            </div>
        </div>
    );
};

const Packages: React.FC = () => {
    const { packages = [], addPackage, updatePackage, deletePackage, members = [] } = useData();
    const { addToast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPkg, setEditingPkg] = useState<Package | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'grid' | 'comparison'>('grid');
    
    // Neural Recommendation State
    const [isThinking, setIsThinking] = useState(false);
    const [recPackageId, setRecPackageId] = useState<number | null>(null);
    const [recReason, setRecReason] = useState("");

    // Token Modal
    const [tokenPkg, setTokenPkg] = useState<Package | null>(null);
    const [generatedToken, setGeneratedToken] = useState('');

    // Simulate AI Recommendation for current logged in user (or global trend)
    const runNeuralRecommendation = async () => {
        setIsThinking(true);
        // Using members context to create a target persona
        const prompt = `Based on a gym with ${members.length} members and these packages: ${JSON.stringify(packages)}, suggest the most popular node. Return JSON: {id: number, reason: string}`;
        try {
            const res = await getComplexResponse(prompt);
            const cleanJson = res.replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleanJson);
            setRecPackageId(data.id);
            setRecReason(data.reason);
        } catch (e) {
            setRecPackageId(packages[packages.length-1]?.id);
            setRecReason("Popular choice for high-intensity athletes.");
        } finally {
            setIsThinking(false);
        }
    };

    useEffect(() => {
        runNeuralRecommendation();
    }, [packages.length]);

    const handleCreate = () => {
        setEditingPkg(undefined);
        setIsModalOpen(true);
    };

    const handleSave = (pkg: Package) => {
        if (editingPkg) {
            updatePackage(pkg);
            addToast("Protocol Node Calibrated.", "success");
        } else {
            addPackage(pkg);
            addToast("New Access Key Forged.", "success");
        }
        setIsModalOpen(false);
    };

    const handleGenerateToken = async (pkg: Package) => {
        const token = `ROYAL_ACCESS_${pkg.id}_${Date.now()}`;
        try {
            const url = await toDataURL(token, { width: 300, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
            setGeneratedToken(url);
            setTokenPkg(pkg);
        } catch(e) {
            addToast("Hologram Projector Offline.", "error");
        }
    };

    const categories = Array.from(new Set(packages.map(p => p.category)));

    return (
        <div className="space-y-10 animate-fade-in pb-24">
            {/* God-Tier Header */}
            <div className="bg-[#050505] p-10 rounded-[3.5rem] border border-amber-500/20 relative overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-8">
                        <div className="p-6 bg-gradient-to-tr from-amber-600 to-yellow-400 rounded-[2.5rem] text-black shadow-[0_0_50px_rgba(245,158,11,0.4)] transform group-hover:rotate-12 transition-transform">
                            <Crown className="w-12 h-12 fill-current" />
                        </div>
                        <div>
                            <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Access <span className="text-amber-500">Keys</span>
                            </h1>
                            <p className="text-gray-500 text-[10px] font-mono tracking-[0.6em] mt-3 uppercase italic leading-none font-bold">
                                Inbuilt v31.0 Sovereign Protocols
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex bg-gray-900/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <button onClick={() => setActiveTab('grid')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'grid' ? 'bg-white text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                                <Layers className="w-4 h-4"/> Grid
                            </button>
                            <button onClick={() => setActiveTab('comparison')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'comparison' ? 'bg-white text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                                <Activity className="w-4 h-4"/> Matrix
                            </button>
                        </div>
                        <button onClick={handleCreate} className="bg-amber-500 text-black font-black px-8 py-3 rounded-2xl shadow-xl hover:bg-amber-400 transition-all uppercase tracking-widest text-[10px] italic flex items-center gap-3 active:scale-95">
                            <Plus className="w-5 h-5" /> Forge Key
                        </button>
                    </div>
                </div>
            </div>

            {/* Neural Recommendation Bar */}
            <div className="bg-indigo-900/10 border border-indigo-500/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <div className="flex items-center gap-6">
                    <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/40">
                        <BotIcon className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-indigo-400 font-black uppercase text-xs tracking-widest flex items-center gap-2 mb-1">
                            <Zap className="w-3 h-3 fill-current" /> Neural Advisor
                        </h4>
                        <p className="text-white text-sm italic font-medium">
                            {isThinking ? 'Processing community biomechanics...' : recReason || 'Analyzing optimal protocols for Jhunjhunu Prime.'}
                        </p>
                    </div>
                </div>
                {recPackageId && !isThinking && (
                    <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        View Node
                    </button>
                )}
            </div>

            {activeTab === 'grid' ? (
                <div className="space-y-16">
                    {categories.map(category => (
                        <div key={category} className="space-y-8 animate-slide-up">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-widest flex-shrink-0">{category} Modules</h2>
                                <div className="h-px bg-white/10 flex-grow"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {packages.filter(p => p.category === category).map(pkg => (
                                    <ProtocolCard 
                                        key={pkg.id} 
                                        pkg={pkg}
                                        activeCount={members.filter(m => m.packageId === pkg.id && m.status === 'Active').length} 
                                        isRecommended={pkg.id === recPackageId}
                                        onEdit={(p) => { setEditingPkg(p); setIsModalOpen(true); }}
                                        onDelete={(id) => confirm("Revoke this Access Protocol?") && deletePackage(id)}
                                        onGenerateToken={handleGenerateToken}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="bg-[#050505] border-white/5 p-0 overflow-hidden rounded-[3rem] shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/80 text-gray-500 font-black uppercase text-[10px] tracking-[0.3em] italic border-b border-white/5">
                                <tr>
                                    <th className="p-10">Protocol Name</th>
                                    <th className="p-10">Neural Sync</th>
                                    <th className="p-10">Bio-Scout Access</th>
                                    <th className="p-10">Recovery Pods</th>
                                    <th className="p-10 text-right">Fiscal Input</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {packages.map(pkg => (
                                    <tr key={pkg.id} className="hover:bg-white/5 transition-all">
                                        <td className="p-10">
                                            <p className="text-lg font-black text-white uppercase italic tracking-tighter">{pkg.name}</p>
                                            <p className="text-[9px] text-gray-500 font-mono mt-1">CAT: {pkg.category}</p>
                                        </td>
                                        <td className="p-10">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        </td>
                                        <td className="p-10">
                                            {pkg.price > 1500 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-gray-700" />}
                                        </td>
                                        <td className="p-10">
                                            {pkg.price > 5000 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Lock className="w-4 h-4 text-gray-800" />}
                                        </td>
                                        <td className="p-10 text-right">
                                            <p className="text-2xl font-black text-amber-500 italic">₹{pkg.price.toLocaleString()}</p>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase">{pkg.duration}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <PackageFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingPkg}
            />

            {/* HOLOGRAPHIC TOKEN MODAL */}
            <Modal isOpen={!!tokenPkg} onClose={() => setTokenPkg(null)} title="Access Token Generated">
                <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
                    <div className="bg-white p-6 rounded-[2.5rem] border-[10px] border-white ring-4 ring-amber-500/20 relative shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <img src={generatedToken} alt="QR Token" className="w-64 h-64 mix-blend-multiply relative z-10" />
                        <Fingerprint className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-black opacity-10 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{tokenPkg?.name}</h3>
                        <p className="text-gray-500 font-mono text-xs mt-2 uppercase tracking-widest">Single-Use Key Valid for 5 Mins</p>
                    </div>
                    <button onClick={() => setTokenPkg(null)} className="text-xs font-bold text-gray-500 hover:text-white underline decoration-dashed">Close Hologram</button>
                </div>
            </Modal>
        </div>
    );
};

const PackageFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (pkg: Package) => void; 
    initialData?: Package; 
}> = ({ isOpen, onClose, onSave, initialData }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Partial<Package>>({
        name: '', price: 0, duration: '1 Month', category: 'Strength', features: ['Gym Access'], details: ''
    });
    const [featureInput, setFeatureInput] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        if (initialData) setFormData(initialData);
        else setFormData({ name: '', price: 0, duration: '1 Month', category: 'Strength', features: ['Gym Access'], details: '' });
    }, [initialData, isOpen]);

    const handleAddFeature = () => {
        if (featureInput.trim()) {
            setFormData(prev => ({ ...prev, features: [...(prev.features || []), featureInput.trim()] }));
            setFeatureInput('');
        }
    };

    const handleAIPrice = async () => {
        if (!formData.name || !formData.duration) return;
        setIsCalculating(true);
        addToast("Neural Market Analysis Initiated...", "info");
        
        try {
            const prompt = `Act as a Gym Business Consultant. Suggest a price for a gym package named "${formData.name}" with duration "${formData.duration}". Features: ${formData.features?.join(', ')}. Return ONLY the number (integer).`;
            const res = await getComplexResponse(prompt);
            const price = parseInt(res.replace(/\D/g, ''));
            if (!isNaN(price)) {
                setFormData(prev => ({ ...prev, price }));
                addToast(`Optimized Value: ₹${price}`, "success");
            }
        } catch (e) {
            addToast("AI Offline. Manual Input Required.", "error");
        } finally {
            setIsCalculating(false);
        }
    };

    const inputClass = "w-full bg-black border border-white/10 rounded-2xl p-4 text-white text-sm font-black italic uppercase tracking-tighter outline-none focus:border-amber-500 transition-all shadow-inner";
    const labelClass = "text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-2 block";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Calibrate Access Node' : 'Forge New Access Key'}>
            <form onSubmit={(e) => { e.preventDefault(); onSave({ id: initialData?.id || Date.now(), ...formData } as Package); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Node Identity</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} placeholder="PROTOCOL_NAME_V1" />
                    </div>
                    <div>
                        <label className={labelClass}>Fiscal Value (INR)</label>
                        <div className="relative flex items-center">
                            <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className={`${inputClass} pl-10 pr-12`} />
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                            <button type="button" onClick={handleAIPrice} disabled={isCalculating} className="absolute right-2 p-2 bg-gray-900 rounded-xl text-cyan-400 hover:text-white transition-colors">
                                {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin"/> : <BarChart3 className="w-4 h-4"/>}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Validity Span</label>
                        <div className="relative">
                            <input required value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className={`${inputClass} pl-10`} placeholder="1 Month" />
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Core category</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inputClass}>
                            <option>Strength</option>
                            <option>Cardio</option>
                            <option>Aerobics</option>
                            <option>Personal Training</option>
                            <option>PT: Weight Loss</option>
                            <option>PT: Muscle Gain</option>
                            <option>PT: Bodybuilding</option>
                            <option>PT: Powerlifting</option>
                            <option>PT: General Fitness</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Protocol Tag</label>
                         <div className="relative">
                            <input value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} className={`${inputClass} pl-10`} placeholder="BEST_YIELD" />
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5">
                    <label className={labelClass}>Neural Privileges</label>
                    <div className="flex gap-2 mb-4">
                        <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} className={`${inputClass} text-xs`} placeholder="Add Data Point..." onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())} />
                        <button type="button" onClick={handleAddFeature} className="bg-amber-500 text-black px-4 rounded-xl hover:bg-amber-400 transition-all"><Plus className="w-5 h-5"/></button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {formData.features?.map((f, i) => (
                            <span key={i} className="text-[9px] font-black bg-black border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-gray-400 uppercase tracking-widest">
                                {f}
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, features: prev.features?.filter((_, idx) => idx !== i) }))} className="text-gray-600 hover:text-red-500 transition-colors"><X className="w-3 h-3"/></button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black uppercase text-gray-500 hover:text-white transition-colors italic">[ Abort ]</button>
                    <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-black py-4 px-10 rounded-2xl uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3">
                        <Save className="w-4 h-4" /> Finalize Key
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default Packages;
