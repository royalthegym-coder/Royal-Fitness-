import { getCurrencySymbol } from '../store/useCurrencyStore';
import GooglePayButton from '@google-pay/button-react';

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
    Pill, Apple, AlertTriangle, Flame, Crown, Zap, Key, ShieldAlert,
    Heart, Moon
} from 'lucide-react';
import { GYM_INFO } from '../../constants';
import { sendPaymentRequest, sendWhatsAppWelcomeMessage, sendPaymentReceipt, sendWhatsAppOTP } from '../../lib/whatsapp';
import CameraModal from './common/CameraModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    const [activeTab, setActiveTab] = useState<'personal' | 'billing' | 'health' | 'live_data'>('personal');
    const [formData, setFormData] = useState<Partial<Member>>(member || {
        name: '', email: '', phone: '', joinDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        avatar: '',
        password: '', // Added
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
    const [includeRegFee, setIncludeRegFee] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'Google Pay' | 'UPI' | 'Cash' | 'Card (NFC)'>('UPI');
    const [isPaid, setIsPaid] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived State for Packages
    const selectedPkg = packages.find(p => p.id === Number(selectedPkgId));

    const pkgPrice = selectedPkg?.price || 0;
    const registrationFee = includeRegFee ? 1000 : 0; 
    
    const accessoriesTotal = cart.filter(i => i.type === 'Accessory' || i.type === 'Apparel').reduce((sum, i) => sum + (i.price * i.qty), 0);
    const supplementsTotal = cart.filter(i => i.type === 'Food Supplement' || i.type === 'Supplement').reduce((sum, i) => sum + (i.price * i.qty), 0);
    const medicineTotal = cart.filter(i => i.type === 'Medicine').reduce((sum, i) => sum + (i.price * i.qty), 0);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalAmount = pkgPrice + registrationFee + cartTotal;

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
            paymentDetails: {
                totalAmount,
                paymentMethod,
                isPaid,
                cart,
                pkgPrice,
                registrationFee
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
                <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
                    {(['personal', 'billing', 'health', 'live_data'] as const).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            {tab === 'personal' ? 'Personal Details' : 
                             tab === 'billing' ? 'Membership & Billing' : 
                             tab === 'health' ? 'Physical & Medical' : 
                             tab === 'live_data' ? 'Biometrics' : 'Other'}
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
                                <img src={formData.avatar} alt={formData.name || "Member Avatar"} className="w-full h-full object-cover" />
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
                            className="p-4 bg-gray-800 rounded-full hover:bg-amber-500 hover:text-black transition-all border border-white/10 cursor-pointer active:scale-95"
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
                        <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="9800000000" />
                    </div>
                    <div>
                        <label className={labelClass}>Email Address</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="rahul@example.com" />
                    </div>
                     <div>
                        <label className={labelClass}>Gender</label>
                        <select value={gender} onChange={e => setGender(e.target.value as any)} className={inputClass}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
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
                    <div>
                        <label className={labelClass}>Login ID</label>
                        <input 
                            type="text" 
                            value={formData.loginId || ''} 
                            onChange={e => setFormData({...formData, loginId: e.target.value})} 
                            className={inputClass} 
                            placeholder="Set login ID" 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Login Password</label>
                        <input 
                            type="password" 
                            value={formData.password || ''} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                            className={inputClass} 
                            placeholder="Set password" 
                        />
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
                                placeholder="98765xxxxx"
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
                                <option value="">-- Select Relation --</option>
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
                        {/* Membership Structure */}
                        <div className="bg-gray-900/50 p-5 rounded-3xl border border-white/5 space-y-5">
                    
                    {/* Standard Membership */}
                    <div>
                        <label className={labelClass}>Gym Fee Category</label>
                        <div className="relative">
                            <select value={selectedPkgId} onChange={e => setSelectedPkgId(e.target.value === '' ? '' : Number(e.target.value))} className={inputClass}>
                                <option value="">-- Select Gym Plan --</option>
                                {packages.map(p => <option key={p.id} value={p.id}>{p.name} - {getCurrencySymbol()}{p.price} ({p.duration})</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <Wallet className="w-4 h-4"/>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input type="checkbox" id="regFee" checked={includeRegFee} onChange={e => setIncludeRegFee(e.target.checked)} className="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
                        <label htmlFor="regFee" className="text-sm font-bold text-gray-300 cursor-pointer">Include Registration Fee (+{getCurrencySymbol()}1000)</label>
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
                                        <ShoppingBag className="w-3 h-3 text-cyan-400"/> {item.name} <span className="text-gray-400">{getCurrencySymbol()}{item.price}</span>
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
                                        <Apple className="w-3 h-3 text-green-400"/> {item.name} <span className="text-gray-400">{getCurrencySymbol()}{item.price}</span>
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
                                        <Pill className="w-3 h-3 text-red-400"/> {item.name} <span className="text-gray-400">{getCurrencySymbol()}{item.price}</span>
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
                                            <span className="font-mono text-amber-500">{getCurrencySymbol()}{c.price * c.qty}</span>
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
                                 <span>{getCurrencySymbol()}{pkgPrice}</span>
                             </div>
                             {registrationFee > 0 && (
                                 <div className="flex justify-between text-xs text-gray-400">
                                     <span>Registration</span>
                                     <span>{getCurrencySymbol()}{registrationFee}</span>
                                 </div>
                             )}
                             {accessoriesTotal > 0 && (
                                 <div className="flex justify-between text-xs text-cyan-400">
                                     <span>Gym Accessories</span>
                                     <span>{getCurrencySymbol()}{accessoriesTotal}</span>
                                 </div>
                             )}
                             {supplementsTotal > 0 && (
                                 <div className="flex justify-between text-xs text-green-400">
                                     <span>Food Supplements</span>
                                     <span>{getCurrencySymbol()}{supplementsTotal}</span>
                                 </div>
                             )}
                             {medicineTotal > 0 && (
                                 <div className="flex justify-between text-xs text-red-400">
                                     <span>Medicine</span>
                                     <span>{getCurrencySymbol()}{medicineTotal}</span>
                                 </div>
                             )}

                             <div className="h-px bg-white/10 my-1"></div>
                             <div className="flex justify-between items-center">
                                 <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Total Payable</span>
                                 <span className="text-2xl font-black text-white italic">{getCurrencySymbol()}{totalAmount.toFixed(0)}</span>
                             </div>
                        </div>

                         <div>
                            <label className={labelClass}>Payment Options</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {(['Google Pay', 'UPI', 'Cash', 'Card (NFC)'] as const).map(method => (
                                    <button type="button" key={method} onClick={() => setPaymentMethod(method)} className={`p-4 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all ${paymentMethod === method ? 'bg-white text-black border-white' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'}`}>
                                        {method === 'Google Pay' ? <svg viewBox="0 0 48 48" className="w-5 h-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg> : method === 'UPI' ? <Fingerprint className="w-5 h-5"/> : method === 'Card (NFC)' ? <Nfc className="w-5 h-5"/> : <Wallet className="w-5 h-5"/>}
                                        <span className="text-[10px] font-bold uppercase">{method}</span>
                                    </button>
                                ))}
                            </div>
                         </div>

                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 min-h-[150px] flex flex-col items-center justify-center text-center">
                            {paymentMethod === 'Google Pay' && (
                                <div className="text-center animate-fade-in w-full flex flex-col items-center justify-center h-full">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Complete in-app purchase via Google Pay</p>
                                    <GooglePayButton
                                        environment="TEST"
                                        buttonColor="black"
                                        buttonType="pay"
                                        paymentRequest={{
                                            apiVersion: 2,
                                            apiVersionMinor: 0,
                                            allowedPaymentMethods: [
                                            {
                                                type: 'CARD',
                                                parameters: {
                                                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                                allowedCardNetworks: ['MASTERCARD', 'VISA'],
                                                },
                                                tokenizationSpecification: {
                                                type: 'PAYMENT_GATEWAY',
                                                parameters: {
                                                    gateway: 'example',
                                                    gatewayMerchantId: 'exampleGatewayMerchantId',
                                                },
                                                },
                                            },
                                            ],
                                            merchantInfo: {
                                                merchantId: '12345678901234567890',
                                                merchantName: GYM_INFO.name,
                                            },
                                            transactionInfo: {
                                                totalPriceStatus: 'FINAL',
                                                totalPriceLabel: 'Total',
                                                totalPrice: totalAmount.toString(),
                                                currencyCode: 'INR',
                                                countryCode: 'IN',
                                            },
                                        }}
                                        onLoadPaymentData={paymentRequest => {
                                            console.log('load payment data', paymentRequest);
                                            setIsPaid(true);
                                        }}
                                        onError={error => {
                                            console.error('Google Pay Error', error);
                                        }}
                                    />
                                    {isPaid && <p className="text-green-400 text-sm mt-4 font-bold">Payment Setup Successful!</p>}
                                </div>
                            )}
                            {paymentMethod === 'UPI' && (
                                <div className="text-center animate-fade-in w-full">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-3 bg-green-500/10 px-3 py-1 rounded-full inline-block">Future Official UPI</p>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="bg-white p-2 rounded-xl shadow-lg border-4 border-white">
                                            <img src={member.avatar || "https://i.pravatar.cc/150?u=" + member.id} alt={member.name} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                                        </div>
                                        <div className="text-left space-y-1">
                                            <p className="text-[10px] text-gray-400 font-mono">Primary: <span className="text-white font-bold">{GYM_INFO.upiIds.gpay1}</span></p>
                                            <p className="text-[10px] text-gray-400 font-mono">Secondary: <span className="text-white font-bold">{GYM_INFO.upiIds.gpay2}</span></p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {paymentMethod === 'Cash' && <p className="text-gray-400 text-sm">Please pay ${getCurrencySymbol()}{totalAmount} at the counter.<br/><span className="text-xs text-gray-600">Cash drawer will open upon saving.</span></p>}
                            {paymentMethod === 'Card (NFC)' && <div className="text-gray-400"><Nfc className="w-12 h-12 mx-auto mb-2" /><p className="text-sm">Tap card on admin's device to pay.</p></div>}
                        </div>

                        <div className="flex items-center bg-black border border-white/10 rounded-2xl px-4 py-3 cursor-pointer" onClick={() => setIsPaid(!isPaid)}>
                            <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"/>
                            <label className="ml-3 text-sm font-bold text-gray-400 cursor-pointer select-none">Mark as Paid</label>
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

            {/* Live Data Tab */}
            {activeTab === 'live_data' && (
                <div className="space-y-6 animate-fade-in">
                    {member?.liveHealthData ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                                    <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-white">{member.liveHealthData.steps.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Steps Today</p>
                                </div>
                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                                    <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-white">{member.liveHealthData.heartRate} <span className="text-sm">bpm</span></p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Avg Heart Rate</p>
                                </div>
                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                                    <Moon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-white">{member.liveHealthData.sleepHours} <span className="text-sm">h</span></p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Sleep Last Night</p>
                                </div>
                            </div>

                            <div className="h-64 w-full bg-black/40 p-4 rounded-2xl border border-white/5">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={member.liveHealthData.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorStepsAdmin" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorHeartAdmin" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="date" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="left" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#000000', borderColor: '#ffffff20', borderRadius: '12px' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#ffffff50', fontSize: '10px', textTransform: 'uppercase' }}
                                        />
                                        <Area yAxisId="left" type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorStepsAdmin)" name="Steps" />
                                        <Area yAxisId="right" type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorHeartAdmin)" name="Heart Rate (bpm)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-black/40 rounded-2xl border border-white/5">
                            <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-400 text-sm">No live health data synced for this member.</p>
                            <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">Connect wearable device to sync</p>
                        </div>
                    )}
                </div>
            )}

                <div className="flex gap-4 pt-4 border-t border-white/10">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-800 rounded-xl text-gray-400 font-bold text-xs hover:bg-gray-700">Cancel</button>
                    <button type="submit" className="flex-[2] py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-xl font-black uppercase text-xs hover:from-amber-400 hover:to-orange-500 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-400/50 border-dashed relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <span className="relative z-10">{member ? 'Update Profile' : 'Register Member'}</span>
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
    
    // Secure Removal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
    const [removalOtp, setRemovalOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);

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
            updateMember({ 
                ...editingMember, 
                ...memberData,
                height: memberData.physical_metrics?.height || editingMember.height,
                weight: memberData.physical_metrics?.weight || editingMember.weight,
                bodyFat: memberData.physical_metrics?.body_fat || editingMember.bodyFat,
                muscleMass: memberData.physical_metrics?.muscle_mass || editingMember.muscleMass
            });
            addToast("Member profile updated.", "success");
            setIsModalOpen(false);
            setEditingMember(null);
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
                height: memberData.physical_metrics?.height || 0,
                weight: memberData.physical_metrics?.weight || 0,
                bodyFat: memberData.physical_metrics?.body_fat || 0,
                muscleMass: memberData.physical_metrics?.muscle_mass || 0
            };

            const finalizeMemberCreation = (isPaid: boolean) => {
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
                        status: isPaid ? 'Paid' : 'Pending', 
                        items: [
                            { description: `Membership: ${packages.find(p => p.id === newMember.packageId)?.name}`, amount: paymentDetails.pkgPrice, type: 'Membership' },
                            ...(paymentDetails.registrationFee > 0 ? [{ description: 'Registration Fee', amount: paymentDetails.registrationFee, type: 'Fee' }] : []),
                            ...paymentDetails.cart.map((c: CartItem) => ({ description: `${c.name} x${c.qty}`, amount: c.price * c.qty, type: c.type }))
                        ]
                    };
                    addInvoice(invoice);

                    if (isPaid) {
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
                
                addToast("New Member Onboarded. Welcome to Future.", "success");
                setIsModalOpen(false);
                setEditingMember(null);
            };

                finalizeMemberCreation(paymentDetails?.isPaid || false);
        }
    };

    const initiateRemoval = async (member: Member) => {
        setMemberToDelete(member);
        setIsSendingOtp(true);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        
        addToast(`Sending authorization code to admin...`, "info");
        const success = await sendWhatsAppOTP(GYM_INFO.whatsappNumber.replace(/\D/g, ''), otp);
        
        if (success) {
            setIsDeleteModalOpen(true);
            addToast("Authorization code sent to admin WhatsApp.", "success");
        } else {
            addToast("Failed to send authorization code. Check WhatsApp API.", "error");
        }
        setIsSendingOtp(false);
    };

    const confirmRemoval = () => {
        if (removalOtp === generatedOtp && memberToDelete) {
            deleteMember(memberToDelete.id);
            addToast(`Member ${memberToDelete.name} removed successfully.`, "success");
            setIsDeleteModalOpen(false);
            setMemberToDelete(null);
            setRemovalOtp('');
            setGeneratedOtp('');
        } else {
            addToast("Invalid authorization code.", "error");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
             {/* Header */}
             <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-[#050505] p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                
                <div className="relative z-10 w-full xl:w-auto text-center xl:text-left">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 italic uppercase tracking-tighter flex flex-col sm:flex-row items-center gap-4 justify-center xl:justify-start">
                        <User className="w-12 h-12 text-cyan-400" />
                        <span>Gym Member Management <span className="text-white">System</span></span>
                    </h1>
                    <p className="text-cyan-500/70 text-[10px] font-mono mt-2 tracking-[0.3em] uppercase font-bold">
                        {members.length} ACTIVE BIOLOGICAL NODES
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto z-10">
                    {/* Button 1: Quick Register Modal */}
                    <button 
                        onClick={() => { setEditingMember(null); setIsModalOpen(true); }}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black px-6 py-4 rounded-2xl uppercase tracking-widest text-[11px] font-sans hover:from-amber-400 hover:to-orange-500 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
                    >
                        <Plus className="w-4 h-4 text-black font-black" />
                        <span>Register Member</span>
                    </button>

                    {/* Button 2: Scientific Onboarding (Advanced) */}
                    <button 
                        onClick={() => setCurrentView('scientificAdmissionForm')}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black px-6 py-4 rounded-2xl uppercase tracking-widest text-[11px] font-sans hover:from-cyan-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2 active:scale-95 border border-cyan-400/50 overflow-hidden group shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
                    >
                        <Plus className="w-4 h-4 text-white" />
                        <span>Scientific Admission</span>
                    </button>
                </div>
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
                                <img src={member.avatar || "https://i.pravatar.cc/150?u=" + member.id} alt={member.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40" />
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
                                className="py-3 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 hover:from-cyan-800/60 hover:to-blue-800/60 text-cyan-300 border border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] backdrop-blur-sm relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <Edit3 className="w-3 h-3 relative z-10"/> <span className="relative z-10">Edit</span>
                             </button>
                             <button 
                                onClick={() => initiateRemoval(member)}
                                disabled={isSendingOtp && memberToDelete?.id === member.id}
                                className="py-3 bg-gradient-to-r from-red-900/40 to-rose-900/40 hover:from-red-800/60 hover:to-rose-800/60 text-red-400 border border-dashed border-red-500/30 hover:border-red-400/60 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.1)] backdrop-blur-sm relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                {isSendingOtp && memberToDelete?.id === member.id ? <Activity className="w-3 h-3 animate-spin relative z-10"/> : <Trash2 className="w-3 h-3 relative z-10"/>}
                                <span className="relative z-10">Remove</span>
                             </button>
                        </div>
                        <div className="mt-3">
                             <button 
                                onClick={() => {
                                    const bypassLink = `https://fitness-neural-os.app/bypass?token=${Math.random().toString(36).substring(2)}&member=${member.id}`;
                                    addToast(`Fail-Safe Bypass Link Generated: ${bypassLink}. Valid for 5 mins.`, "success");
                                    console.log(`[Security] Generated Bypass Link for Member ${member.id}: ${bypassLink}`);
                                }}
                                className="w-full py-3 bg-gradient-to-r from-amber-900/40 to-orange-900/40 hover:from-amber-800/60 hover:to-orange-800/60 text-amber-400 border border-dashed border-amber-500/30 hover:border-amber-400/60 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] backdrop-blur-sm relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <ShieldAlert className="w-3 h-3 relative z-10"/> <span className="relative z-10">Generate Bypass Link (Fail-Safe)</span>
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

            {/* SECURE REMOVAL MODAL */}
            {isDeleteModalOpen && (
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Secure Removal Authorization">
                    <div className="p-6 space-y-6 text-center">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                            <ShieldAlert className="w-10 h-10 text-red-500" />
                        </div>
                        
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic">Confirm Deletion</h3>
                            <p className="text-gray-400 text-xs mt-2">
                                You are about to remove <span className="text-white font-bold">{memberToDelete?.name}</span>. 
                                This action is irreversible and requires admin authorization.
                            </p>
                        </div>

                        <div className="bg-black/40 p-6 rounded-2xl border border-white/10">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Enter Admin Auth Code</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input 
                                    type="text" 
                                    value={removalOtp}
                                    onChange={(e) => setRemovalOtp(e.target.value)}
                                    placeholder="6-Digit Code"
                                    className="w-full bg-black/60 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-center font-mono text-xl tracking-[0.5em] outline-none focus:border-red-500 transition-all"
                                    maxLength={6}
                                />
                            </div>
                            <p className="text-[9px] text-gray-600 mt-3 uppercase tracking-widest">Code sent to {GYM_INFO.whatsappNumber}</p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-4 bg-gray-800 text-gray-400 font-bold rounded-xl text-xs hover:bg-gray-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmRemoval}
                                className="flex-[2] py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white font-black rounded-xl uppercase tracking-widest text-xs hover:from-red-500 hover:to-rose-600 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-400/50 border-dashed relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <span className="relative z-10">Authorize Removal</span>
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Members;
