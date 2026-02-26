
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Member, Package, InventoryItem, Invoice, Transaction, InvoiceItem } from '../../types';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import Card from './common/Card';
import Modal from './common/Modal';
import { 
    User, Plus, Search, Filter, Phone, Mail, Calendar, 
    CheckCircle, XCircle, MoreHorizontal, Trash2, Edit3,
    Fingerprint, Wallet, Landmark, Nfc, Minus, ShoppingBag, 
    CreditCard, Activity, ShieldCheck, Camera, UploadCloud, Dumbbell,
    Pill, Apple, AlertTriangle
} from 'lucide-react';
import { GYM_INFO } from '../../constants';
import { sendPaymentRequest, sendWhatsAppWelcomeMessage, sendPaymentReceipt } from '../../lib/whatsapp';
import CameraModal from './common/CameraModal';

interface CartItem {
    itemId: string;
    name: string;
    price: number;
    qty: number;
    type: string;
}

const MemberForm: React.FC<{
    member?: Member | null;
    onClose: () => void;
    onSave: (data: any) => void;
    packages: Package[];
    inventory: InventoryItem[];
}> = ({ member, onClose, onSave, packages, inventory }) => {
    const [activeTab, setActiveTab] = useState<'personal' | 'billing' | 'health'>('personal');
    const [formData, setFormData] = useState<Partial<Member>>(member || {
        name: '', email: '', phone: '', joinDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        avatar: '',
        aadhaar: '',
        dob: '',
        address: '',
        emergency_contact: { name: '', phone: '', relation: '' },
        physical_metrics: { height: 0, weight: 0, body_fat: 0, muscle_mass: 0, target_weight: 0, body_type: 'Mesomorph', activity_level: 'Moderate' },
        medical_history: { conditions: [], pastInjuries: '', medications: '', lifestyle: {} },
        initial_assessment: { fitness_level: 'Beginner', pushup_count: 0, plank_time: '0s', squat_count: 0, comments: '' }
    });
    const [gender, setGender] = useState(member?.gender || 'Male');
    
    const [selectedPkgId, setSelectedPkgId] = useState<number | ''>(member?.packageId || '');
    const [selectedPtPkgId, setSelectedPtPkgId] = useState<number | ''>(member?.trainingPackageId || '');
    const [includeRegFee, setIncludeRegFee] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card (NFC)'>('UPI');
    const [isPaid, setIsPaid] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [trainingCategory, setTrainingCategory] = useState<string>('Personal Training');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived State for Packages
    const selectedPkg = packages.find(p => p.id === Number(selectedPkgId));
    const selectedPtPkg = packages.find(p => p.id === Number(selectedPtPkgId));
    
    // Improved Filtering Logic
    const gymPackages = useMemo(() => packages.filter(p => !p.category.toLowerCase().includes('personal') && !p.category.toLowerCase().includes('training')), [packages]);
    const uniqueTrainingCategories = useMemo(() => Array.from(new Set(packages.filter(p => !gymPackages.includes(p)).map(p => p.category))), [packages, gymPackages]);
    const availableTrainingPackages = useMemo(() => packages.filter(p => p.category === trainingCategory), [packages, trainingCategory]);

    const pkgPrice = selectedPkg?.price || 0;
    const ptPrice = selectedPtPkg?.price || 0;
    const registrationFee = includeRegFee ? 1000 : 0; 
    
    const accessoriesTotal = cart.filter(i => i.type === 'Accessory' || i.type === 'Apparel').reduce((sum, i) => sum + (i.price * i.qty), 0);
    const supplementsTotal = cart.filter(i => i.type === 'Food Supplement' || i.type === 'Supplement').reduce((sum, i) => sum + (i.price * i.qty), 0);
    const medicineTotal = cart.filter(i => i.type === 'Medicine').reduce((sum, i) => sum + (i.price * i.qty), 0);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalAmount = pkgPrice + ptPrice + registrationFee + cartTotal;

    const labelClass = "text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block ml-1";
    const inputClass = "w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-white font-medium text-sm focus:border-amber-500 outline-none transition-all";

    const addToCart = (item: InventoryItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.itemId === item.id);
            if (existing) {
                return prev.map(i => i.itemId === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { itemId: item.id, name: item.name, price: item.price || 0, qty: 1, type: item.category }];
        });
    };

    const updateCartQty = (itemId: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.itemId === itemId) {
                return { ...i, qty: Math.max(0, i.qty + delta) };
            }
            return i;
        }).filter(i => i.qty > 0));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraCapture = (imageData: string) => {
        setFormData(prev => ({ ...prev, avatar: imageData }));
        setIsCameraOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            gender, 
            packageId: Number(selectedPkgId),
            trainingPackageId: selectedPtPkgId ? Number(selectedPtPkgId) : undefined,
            paymentDetails: {
                totalAmount,
                paymentMethod,
                isPaid,
                cart,
                pkgPrice,
                registrationFee,
                ptPrice,
                ptPackageName: selectedPtPkg?.name
            }
        });
    };

    const accessories = inventory.filter(i => i.category === 'Accessory' || i.category === 'Apparel');
    const foodSupplements = inventory.filter(i => i.category === 'Food Supplement' || i.category === 'Supplement');
    const medicines = inventory.filter(i => i.category === 'Medicine');

    return (
        <Modal isOpen={true} onClose={onClose} title={member ? 'Edit Member Profile' : 'New Member Registration'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-xl border border-white/5">
                    {(['personal', 'billing', 'health'] as const).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Personal Tab */}
                {activeTab === 'personal' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* 1. Photo Upload */}
                        <div className="flex flex-col items-center justify-center mb-6">
                    <div className="flex gap-4 items-center">
                        <div 
                            className="relative w-28 h-28 rounded-full border-4 border-amber-500/30 group cursor-pointer overflow-hidden bg-black"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                                    <User className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <UploadCloud className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        
                        <button 
                            type="button"
                            onClick={() => setIsCameraOpen(true)}
                            className="p-4 bg-gray-800 rounded-full hover:bg-amber-500 hover:text-black transition-all border border-white/10"
                            title="Open Camera"
                        >
                            <Camera className="w-6 h-6" />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-3">Upload or Capture Photo</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                    />
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Full Name</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} placeholder="Rahul Saini" />
                    </div>
                    <div>
                        <label className={labelClass}>Phone Number</label>
                        <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="9785300123" />
                    </div>
                    <div>
                        <label className={labelClass}>Email Address</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="rahul@example.com" />
                    </div>
                     <div>
                        <label className={labelClass}>Gender</label>
                        <select value={gender} onChange={e => setGender(e.target.value)} className={inputClass}>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Date of Birth</label>
                        <input type="date" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Aadhaar Number</label>
                        <input value={formData.aadhaar || ''} onChange={e => setFormData({...formData, aadhaar: e.target.value})} className={inputClass} placeholder="1234 5678 9012" />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Address</label>
                        <textarea value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className={inputClass} placeholder="Full residential address" rows={2} />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-red-900/10 p-5 rounded-3xl border border-red-500/20 space-y-4">
                    <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" /> Emergency Contact
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Contact Name</label>
                            <input
                                value={formData.emergency_contact?.name || ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    emergency_contact: { ...formData.emergency_contact!, name: e.target.value }
                                })}
                                className={`${inputClass} border-red-500/20 focus:border-red-500`}
                                placeholder="Guardian Name"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Contact Number</label>
                            <input
                                value={formData.emergency_contact?.phone || ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    emergency_contact: { ...formData.emergency_contact!, phone: e.target.value }
                                })}
                                className={`${inputClass} border-red-500/20 focus:border-red-500`}
                                placeholder="98765..."
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Relationship</label>
                            <select
                                value={formData.emergency_contact?.relation || ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    emergency_contact: { ...formData.emergency_contact!, relation: e.target.value }
                                })}
                                className={`${inputClass} border-red-500/20 focus:border-red-500`}
                            >
                                <option value="">-- Select --</option>
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Spouse">Spouse</option>
                                <option value="Sibling">Sibling</option>
                                <option value="Friend">Friend</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        )}

                {/* Billing Tab */}
                {activeTab === 'billing' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Membership & PT Structure */}
                        <div className="bg-gray-900/50 p-5 rounded-3xl border border-white/5 space-y-5">
                    
                    {/* Standard Membership */}
                    <div>
                        <label className={labelClass}>Gym Fee Category</label>
                        <div className="relative">
                            <select value={selectedPkgId} onChange={e => setSelectedPkgId(e.target.value === '' ? '' : Number(e.target.value))} className={inputClass}>
                                <option value="">-- Select Gym Plan --</option>
                                {gymPackages.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <Wallet className="w-4 h-4"/>
                            </div>
                        </div>
                    </div>

                    {/* Personal Training / Training Fees Section */}
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-2"><Dumbbell className="w-3 h-3 text-amber-500"/> Training Fees (Category Wise)</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                             {/* Category Selector */}
                             <select 
                                value={trainingCategory} 
                                onChange={e => { setTrainingCategory(e.target.value); setSelectedPtPkgId(''); }} 
                                className={`${inputClass} border-amber-500/30 focus:border-amber-500`}
                            >
                                <option value="">-- Select Category --</option>
                                {uniqueTrainingCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {/* Package Selector */}
                             <select 
                                value={selectedPtPkgId} 
                                onChange={e => setSelectedPtPkgId(e.target.value === '' ? '' : Number(e.target.value))} 
                                className={`${inputClass} border-amber-500/30 focus:border-amber-500`}
                                disabled={!trainingCategory}
                            >
                                <option value="">-- Select Plan --</option>
                                {availableTrainingPackages.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                                ))}
                            </select>
                        </div>
                        {selectedPtPkg && (
                            <div className="mt-2 text-[10px] text-amber-400 bg-amber-900/20 p-2 rounded-lg border border-amber-500/20 flex justify-between items-center">
                                <span>Selected: {selectedPtPkg.name} ({selectedPtPkg.category})</span>
                                <span className="font-bold text-white">₹{selectedPtPkg.price}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input type="checkbox" id="regFee" checked={includeRegFee} onChange={e => setIncludeRegFee(e.target.checked)} className="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
                        <label htmlFor="regFee" className="text-sm font-bold text-gray-300 cursor-pointer">Include Registration Fee (₹1000)</label>
                    </div>
                </div>

                {/* Inventory / POS */}
                {!member && (
                    <div className="space-y-4">
                        {/* Gym Accessories */}
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <h4 className={labelClass}>Gym Accessories</h4>
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar">
                                {accessories.length > 0 ? accessories.map(item => (
                                    <button key={item.id} type="button" onClick={() => addToCart(item)} className="bg-gray-800 text-xs px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-gray-700 transition-colors text-white border border-white/5 flex items-center gap-2">
                                        <ShoppingBag className="w-3 h-3 text-cyan-400"/> {item.name} <span className="text-gray-400">₹{item.price}</span>
                                    </button>
                                )) : <span className="text-xs text-gray-500 italic">No accessories available</span>}
                            </div>
                        </div>

                        {/* Food Supplements */}
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <h4 className={labelClass}>Food Supplements</h4>
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar">
                                {foodSupplements.length > 0 ? foodSupplements.map(item => (
                                    <button key={item.id} type="button" onClick={() => addToCart(item)} className="bg-gray-800 text-xs px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-gray-700 transition-colors text-white border border-white/5 flex items-center gap-2">
                                        <Apple className="w-3 h-3 text-green-400"/> {item.name} <span className="text-gray-400">₹{item.price}</span>
                                    </button>
                                )) : <span className="text-xs text-gray-500 italic">No food supplements available</span>}
                            </div>
                        </div>

                        {/* Medicine */}
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <h4 className={labelClass}>Medicine</h4>
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar">
                                {medicines.length > 0 ? medicines.map(item => (
                                    <button key={item.id} type="button" onClick={() => addToCart(item)} className="bg-gray-800 text-xs px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-gray-700 transition-colors text-white border border-white/5 flex items-center gap-2">
                                        <Pill className="w-3 h-3 text-red-400"/> {item.name} <span className="text-gray-400">₹{item.price}</span>
                                    </button>
                                )) : <span className="text-xs text-gray-500 italic">No medicine available</span>}
                            </div>
                        </div>

                        {/* Cart Summary */}
                        {cart.length > 0 && (
                            <div className="space-y-2 mt-3 bg-gray-900 p-3 rounded-xl border border-white/5">
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Selected Items</h5>
                                {cart.map(c => (
                                    <div key={c.itemId} className="flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0">
                                        <span className="text-gray-300">{c.name} <span className="text-gray-500">x{c.qty}</span></span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-amber-500">₹{c.price * c.qty}</span>
                                            <button type="button" onClick={() => updateCartQty(c.itemId, -1)} className="p-1 bg-gray-700 rounded hover:bg-gray-600"><Minus className="w-3 h-3 text-white"/></button>
                                            <button type="button" onClick={() => updateCartQty(c.itemId, 1)} className="p-1 bg-gray-700 rounded hover:bg-gray-600"><Plus className="w-3 h-3 text-white"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Payment Breakdown */}
                        <div className="bg-gray-900/50 p-4 rounded-2xl border border-white/5 space-y-2">
                             <div className="flex justify-between text-xs text-gray-400">
                                 <span>Gym Fee ({selectedPkg?.name || 'None'})</span>
                                 <span>₹{pkgPrice}</span>
                             </div>
                             {ptPrice > 0 && (
                                 <div className="flex justify-between text-xs text-amber-400 font-medium">
                                     <span>Personal Training ({selectedPtPkg?.name})</span>
                                     <span>₹{ptPrice}</span>
                                 </div>
                             )}
                             {registrationFee > 0 && (
                                 <div className="flex justify-between text-xs text-gray-400">
                                     <span>Registration</span>
                                     <span>₹{registrationFee}</span>
                                 </div>
                             )}
                             {accessoriesTotal > 0 && (
                                 <div className="flex justify-between text-xs text-cyan-400">
                                     <span>Gym Accessories</span>
                                     <span>₹{accessoriesTotal}</span>
                                 </div>
                             )}
                             {supplementsTotal > 0 && (
                                 <div className="flex justify-between text-xs text-green-400">
                                     <span>Food Supplements</span>
                                     <span>₹{supplementsTotal}</span>
                                 </div>
                             )}
                             {medicineTotal > 0 && (
                                 <div className="flex justify-between text-xs text-red-400">
                                     <span>Medicine</span>
                                     <span>₹{medicineTotal}</span>
                                 </div>
                             )}

                             <div className="h-px bg-white/10 my-1"></div>
                             <div className="flex justify-between items-center">
                                 <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Total Payable</span>
                                 <span className="text-2xl font-black text-white italic">₹{totalAmount.toFixed(0)}</span>
                             </div>
                        </div>

                         <div>
                            <label className={labelClass}>Payment Options (भुगतान विकल्प)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {(['UPI', 'Cash', 'Card (NFC)'] as const).map(method => (
                                    <button type="button" key={method} onClick={() => setPaymentMethod(method)} className={`p-4 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all ${paymentMethod === method ? 'bg-white text-black border-white' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'}`}>
                                        {method === 'UPI' ? <Fingerprint className="w-5 h-5"/> : method === 'Card (NFC)' ? <Nfc className="w-5 h-5"/> : <Wallet className="w-5 h-5"/>}
                                        <span className="text-[10px] font-bold uppercase">{method}</span>
                                    </button>
                                ))}
                            </div>
                         </div>

                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 min-h-[150px] flex items-center justify-center text-center">
                            {paymentMethod === 'UPI' && (
                                <div className="text-center animate-fade-in w-full">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-3 bg-green-500/10 px-3 py-1 rounded-full inline-block">Royal Official UPI</p>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="bg-white p-2 rounded-xl shadow-lg border-4 border-white">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${totalAmount}&cu=INR`}
                                                alt="UPI QR" 
                                                className="w-32 h-32 object-contain mix-blend-multiply" 
                                            />
                                        </div>
                                        <div className="text-left space-y-1">
                                            <p className="text-[10px] text-gray-400 font-mono">Primary: <span className="text-white font-bold">{GYM_INFO.upiIds.gpay1}</span></p>
                                            <p className="text-[10px] text-gray-400 font-mono">Secondary: <span className="text-white font-bold">{GYM_INFO.upiIds.gpay2}</span></p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {paymentMethod === 'Cash' && <p className="text-gray-400 text-sm">Please pay ₹{totalAmount} at the counter.<br/><span className="text-xs text-gray-600">Cash drawer will open upon saving.</span></p>}
                            {paymentMethod === 'Card (NFC)' && <div className="text-gray-400"><Nfc className="w-12 h-12 mx-auto mb-2" /><p className="text-sm">Tap card on admin's device to pay.</p></div>}
                        </div>

                         <div className="flex items-center bg-black border border-white/10 rounded-2xl px-4 py-3 cursor-pointer" onClick={() => setIsPaid(!isPaid)}>
                            <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"/>
                            <label className="ml-3 text-sm font-bold text-gray-400 cursor-pointer select-none">Mark as Paid (भुगतान हो गया)</label>
                        </div>
                    </div>
                )}
            </div>
        )}

            {/* Health Tab */}
            {activeTab === 'health' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Height (cm)</label>
                            <input 
                                type="number" 
                                value={formData.physical_metrics?.height || ''} 
                                onChange={e => setFormData({
                                    ...formData, 
                                    physical_metrics: { ...formData.physical_metrics!, height: Number(e.target.value) }
                                })} 
                                className={inputClass} 
                                placeholder="175" 
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Weight (kg)</label>
                            <input 
                                type="number" 
                                value={formData.physical_metrics?.weight || ''} 
                                onChange={e => setFormData({
                                    ...formData, 
                                    physical_metrics: { ...formData.physical_metrics!, weight: Number(e.target.value) }
                                })} 
                                className={inputClass} 
                                placeholder="70" 
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Body Fat (%)</label>
                            <input 
                                type="number" 
                                value={formData.physical_metrics?.body_fat || ''} 
                                onChange={e => setFormData({
                                    ...formData, 
                                    physical_metrics: { ...formData.physical_metrics!, body_fat: Number(e.target.value) }
                                })} 
                                className={inputClass} 
                                placeholder="15" 
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Fitness Level</label>
                            <select 
                                value={formData.initial_assessment?.fitness_level || 'Beginner'} 
                                onChange={e => setFormData({
                                    ...formData, 
                                    initial_assessment: { ...formData.initial_assessment!, fitness_level: e.target.value }
                                })} 
                                className={inputClass}
                            >
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                                <option>Elite</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Pushups (Max)</label>
                            <input 
                                type="number" 
                                value={formData.initial_assessment?.pushup_count || 0} 
                                onChange={e => setFormData({
                                    ...formData, 
                                    initial_assessment: { ...formData.initial_assessment!, pushup_count: Number(e.target.value) }
                                })} 
                                className={inputClass} 
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Plank Time</label>
                            <input 
                                type="text" 
                                value={formData.initial_assessment?.plank_time || '0s'} 
                                onChange={e => setFormData({
                                    ...formData, 
                                    initial_assessment: { ...formData.initial_assessment!, plank_time: e.target.value }
                                })} 
                                className={inputClass} 
                                placeholder="e.g. 60s"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Squats (Max)</label>
                            <input 
                                type="number" 
                                value={formData.initial_assessment?.squat_count || 0} 
                                onChange={e => setFormData({
                                    ...formData, 
                                    initial_assessment: { ...formData.initial_assessment!, squat_count: Number(e.target.value) }
                                })} 
                                className={inputClass} 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Medical Conditions / History</label>
                            <textarea 
                                value={formData.medical_history?.conditions?.join(', ') || ''} 
                                onChange={e => setFormData({
                                    ...formData, 
                                    medical_history: { ...formData.medical_history!, conditions: e.target.value.split(',').map(s => s.trim()) }
                                })} 
                                className={inputClass} 
                                placeholder="e.g. Asthma, Diabetes (comma separated)" 
                                rows={2} 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Past Injuries</label>
                            <textarea 
                                value={formData.medical_history?.pastInjuries || ''} 
                                onChange={e => setFormData({
                                    ...formData, 
                                    medical_history: { ...formData.medical_history!, pastInjuries: e.target.value }
                                })} 
                                className={inputClass} 
                                placeholder="e.g. ACL tear in 2020" 
                                rows={2} 
                            />
                        </div>
                    </div>
                </div>
            )}

                <div className="flex gap-4 pt-4 border-t border-white/10">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-800 rounded-xl text-gray-400 font-bold text-xs hover:bg-gray-700">Cancel</button>
                    <button type="submit" className="flex-[2] py-4 bg-white text-black rounded-xl font-black uppercase text-xs hover:bg-amber-500 transition-colors shadow-xl">
                        {member ? 'Update Profile' : 'Register Member'}
                    </button>
                </div>
            </form>
            <CameraModal 
                isOpen={isCameraOpen} 
                onClose={() => setIsCameraOpen(false)} 
                onCapture={handleCameraCapture} 
            />
        </Modal>
    );
};

const Members: React.FC<{ setCurrentView: (view: any) => void }> = ({ setCurrentView }) => {
    const { members, packages, inventory, addMember, updateMember, deleteMember, addInvoice, addTransaction, updateInventory } = useData();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);

    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm);
            const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [members, searchTerm, statusFilter]);

    const handleSaveMember = (data: any) => {
        const { paymentDetails, ...memberData } = data;
        
        if (editingMember) {
            updateMember({ ...editingMember, ...memberData });
            addToast("Member profile updated.", "success");
        } else {
            const newId = Math.max(0, ...members.map(m => m.id)) + 1;
            const newMember: Member = {
                id: newId,
                ...memberData,
                joinDate: new Date().toISOString().split('T')[0],
                avatar: memberData.avatar || `https://i.pravatar.cc/150?u=${newId}`,
                achievements: [],
                xp: 0,
                level: 1,
                hrv: 0,
                lbm: 0,
                health_score: 80,
                bio_age: 0,
                assigned_tests: [],
                medical_history: memberData.medical_history || { conditions: [], pastInjuries: '', medications: '', lifestyle: {} },
                physical_metrics: memberData.physical_metrics || { height: 0, weight: 0, body_fat: 0, muscle_mass: 0, target_weight: 0, body_type: 'Mesomorph', activity_level: 'Moderate' },
                automation_settings: { remind_12hrs_before: true, auto_renewal: false, ai_coaching: true, sync_id: '' },
                rpeHistory: [],
                anatomicalStatus: {},
                emergency_contact: memberData.emergency_contact || { name: '', phone: '', relation: '' },
                initial_assessment: memberData.initial_assessment || { fitness_level: 'Beginner', pushup_count: 0, plank_time: '0s', squat_count: 0, comments: '' },
                gender: memberData.gender,
                aadhaar: memberData.aadhaar,
                dob: memberData.dob,
                address: memberData.address,
                trainingPackageId: memberData.trainingPackageId
            };
            addMember(newMember);
            
            if (paymentDetails) {
                const invoice: Invoice = {
                    id: Date.now(),
                    memberId: newId,
                    memberName: newMember.name,
                    packageId: newMember.packageId,
                    packageName: packages.find(p => p.id === newMember.packageId)?.name || 'Custom',
                    amount: paymentDetails.totalAmount,
                    date: new Date().toISOString().split('T')[0],
                    status: paymentDetails.isPaid ? 'Paid' : 'Pending', 
                    items: [
                        { description: `Membership: ${packages.find(p => p.id === newMember.packageId)?.name}`, amount: paymentDetails.pkgPrice, type: 'Membership' },
                        ...(paymentDetails.ptPrice > 0 ? [{ description: `Personal Training: ${paymentDetails.ptPackageName}`, amount: paymentDetails.ptPrice, type: 'Training' }] : []),
                        ...(paymentDetails.registrationFee > 0 ? [{ description: 'Registration Fee', amount: paymentDetails.registrationFee, type: 'Fee' }] : []),
                        ...paymentDetails.cart.map((c: CartItem) => ({ description: `${c.name} x${c.qty}`, amount: c.price * c.qty, type: c.type }))
                    ]
                };
                addInvoice(invoice);

                if (paymentDetails.isPaid) {
                    addTransaction({
                        id: `TXN-${Date.now()}`,
                        memberName: newMember.name,
                        amount: paymentDetails.totalAmount,
                        date: invoice.date,
                        method: paymentDetails.paymentMethod
                    });
                    
                    paymentDetails.cart.forEach((c: CartItem) => {
                         const item = inventory.find(i => i.id === c.itemId);
                         if (item) {
                             updateInventory({ ...item, stock: Math.max(0, item.stock - c.qty) });
                         }
                    });

                    if (newMember.whatsappConsent) {
                        sendPaymentReceipt(newMember.name, newMember.phone, paymentDetails.totalAmount, `TXN-${Date.now()}`, invoice.packageName);
                    }
                } 
                else {
                    if (newMember.whatsappConsent) {
                        sendPaymentRequest(newMember, paymentDetails.totalAmount, invoice.packageName);
                    }
                    addToast(`Invoice Created. Payment Link sent to ${newMember.name}`, "info");
                }
            }
            
            if(newMember.whatsappConsent) {
                sendWhatsAppWelcomeMessage(newMember);
            }
            
            addToast("New Member Onboarded. Welcome to Royal.", "success");
        }
        setIsModalOpen(false);
        setEditingMember(null);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
             {/* Header */}
             <div className="flex flex-col md:flex-row justify-between items-center bg-[#050505] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <User className="w-12 h-12 text-white" />
                        Royal <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Census</span>
                    </h1>
                    <p className="text-gray-500 text-xs font-mono mt-2 tracking-widest uppercase">
                        {members.length} Active Biological Nodes
                    </p>
                </div>
                <button 
                    onClick={() => setCurrentView('scientificAdmissionForm')}
                    className="bg-white text-black font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-xs shadow-xl hover:bg-amber-400 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> AI Admission
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                     <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                     <div className="relative bg-black rounded-2xl flex items-center p-1 border border-white/10">
                         <Search className="ml-4 w-5 h-5 text-gray-500" />
                         <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Search by name or ID..."
                            className="w-full bg-transparent text-white text-sm font-medium px-4 py-3 outline-none placeholder-gray-700"
                        />
                     </div>
                </div>
                <div className="flex bg-gray-900/50 p-1 rounded-2xl border border-white/5">
                    {['All', 'Active', 'Pending', 'Expired'].map(status => (
                        <button 
                            key={status} 
                            onClick={() => setStatusFilter(status)} 
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map(member => (
                    <Card key={member.id} className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2.5rem] hover:border-amber-500/30 transition-all group shadow-xl">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <img src={member.avatar} className="w-16 h-16 rounded-2xl object-cover border border-white/10" alt={member.name} />
                                <div>
                                    <h3 className="font-black text-white text-lg italic uppercase">{member.name}</h3>
                                    <p className="text-[10px] text-gray-500 font-mono tracking-widest">ID: #{member.id}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase ${member.status === 'Active' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>{member.status}</span>
                                </div>
                            </div>
                            <button className="text-gray-600 hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-xs text-gray-400 bg-black/40 p-3 rounded-xl">
                                <Phone className="w-4 h-4 text-gray-600"/> {member.phone}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 bg-black/40 p-3 rounded-xl">
                                <Mail className="w-4 h-4 text-gray-600"/> {member.email}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 bg-black/40 p-3 rounded-xl">
                                <Calendar className="w-4 h-4 text-gray-600"/> Joined: {member.joinDate}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 bg-black/40 p-3 rounded-xl">
                                <Activity className="w-4 h-4 text-gray-600"/> Package ID: {member.packageId}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                             <button 
                                onClick={() => { setEditingMember(member); setIsModalOpen(true); }}
                                className="py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                            >
                                <Edit3 className="w-3 h-3"/> Edit
                             </button>
                             <button 
                                onClick={() => { if(confirm("Delete Member?")) deleteMember(member.id); }}
                                className="py-3 bg-red-900/10 hover:bg-red-900/30 text-red-500 border border-red-900/30 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                            >
                                <Trash2 className="w-3 h-3"/> Remove
                             </button>
                        </div>
                    </Card>
                ))}
            </div>

            {isModalOpen && (
                <MemberForm 
                    member={editingMember} 
                    onClose={() => { setIsModalOpen(false); setEditingMember(null); }} 
                    onSave={handleSaveMember}
                    packages={packages}
                    inventory={inventory}
                />
            )}
        </div>
    );
};

export default Members;
