import { getCurrencySymbol } from '../../store/useCurrencyStore';
import React, { useState } from 'react';
import { ShoppingBag, QrCode, CreditCard, Package, ShieldCheck, Tag } from 'lucide-react';
import Modal from '../common/Modal';

const inventoryItems = [
    { id: '1', name: 'Optimum Nutrition Gold Standard Whey', category: 'Supplement', price: 6500, stock: 12, image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80' },
    { id: '2', name: 'C4 Original Pre-Workout', category: 'Supplement', price: 2200, stock: 8, image: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&q=80' },
    { id: '3', name: 'Fitness Future Premium T-Shirt', category: 'Merchandise', price: 999, stock: 45, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80' },
    { id: '4', name: 'BCAA Energy Drink', category: 'Beverage', price: 150, stock: 120, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80' },
];

export default function FitnessFuturePOS() {
    const [cart, setCart] = useState<{item: any, quantity: number}[]>([]);
    const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success'>('pending');

    const addToCart = (item: any) => {
        const existing = cart.find(c => c.item.id === item.id);
        if (existing) {
            setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, { item, quantity: 1 }]);
        }
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(c => c.item.id !== id));
    };

    const total = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);

    const handleCheckout = () => {
        setCheckoutModalOpen(true);
        setPaymentStatus('pending');
    };

    const simulateUPIPayment = () => {
        setTimeout(() => {
            setPaymentStatus('success');
            setTimeout(() => {
                setCheckoutModalOpen(false);
                setCart([]);
                setPaymentStatus('pending');
            }, 3000);
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            <div className="bg-black border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-3 relative z-10">
                    <ShoppingBag className="w-8 h-8 text-fuchsia-400" /> Smart POS & Marketplace
                </h1>
                <p className="text-gray-400 text-sm font-mono uppercase tracking-widest relative z-10">Cashless Gym Store & Inventory (UPI: your-upi@bank)</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Store Front */}
                <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {inventoryItems.map((item) => (
                        <div key={item.id} className="bg-black/60 border border-white/10 rounded-[2rem] overflow-hidden group hover:border-fuchsia-500/30 transition-all">
                            <div className="h-40 overflow-hidden relative">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                                <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest border border-white/10">
                                    {item.category}
                                </span>
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{item.name}</h3>
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-xl font-black italic text-white flex items-center gap-1">{getCurrencySymbol()}{item.price}
                                    </p>
                                    <p className="text-xs font-mono text-gray-500">Stock: {item.stock}</p>
                                </div>
                                <button 
                                    onClick={() => addToCart(item)}
                                    className="w-full py-3 bg-white/5 hover:bg-fuchsia-600/20 text-fuchsia-400 hover:text-fuchsia-300 border border-fuchsia-500/30 rounded-xl font-black uppercase tracking-widest text-xs transition-colors"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cart Terminal */}
                <div className="col-span-1">
                    <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md sticky top-6">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-2">
                            <CreditCard className="text-fuchsia-400" /> Digital Terminal
                        </h3>
                        
                        {cart.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <Package className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm font-mono">Cart is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-6">
                                {cart.map((c, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="flex-1">
                                            <p className="text-sm text-white font-bold line-clamp-1">{c.item.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{getCurrencySymbol()}{c.item.price} x {c.quantity}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="text-sm font-bold text-white mb-1">{getCurrencySymbol()}{c.item.price * c.quantity}</p>
                                            <button onClick={() => removeFromCart(c.item.id)} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase underline">Remove</button>
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-white/10 pt-4 mt-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-sm text-gray-400 font-mono uppercase tracking-widest">Total Due</span>
                                        <span className="text-3xl font-black text-white italic">{getCurrencySymbol()}{total}</span>
                                    </div>
                                    <button 
                                        onClick={handleCheckout}
                                        className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(192,38,211,0.4)]"
                                    >
                                        Proceed to Pay
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Checkout Modal */}
            <Modal isOpen={isCheckoutModalOpen} onClose={() => setCheckoutModalOpen(false)} title="UPI Payment Gateway">
                {paymentStatus === 'pending' ? (
                    <div className="text-center py-6">
                        <div className="bg-white p-4 rounded-2xl inline-block mb-6 relative">
                            <QrCode className="w-48 h-48 text-black" />
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="bg-black text-white px-3 py-1 rounded font-bold text-sm">SCAN TO PAY</span>
                            </div>
                        </div>
                        <h4 className="text-xl font-black text-white mb-2 italic tracking-tight">{getCurrencySymbol()}{total}</h4>
                        <p className="text-sm text-gray-400 font-mono mb-6">Pay to: <strong>your-upi@bank</strong></p>
                        
                        <div className="flex gap-4">
                            <button onClick={simulateUPIPayment} className="flex-1 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-colors">
                                Process Success
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-4"><ShieldCheck className="inline w-3 h-3 mb-0.5" /> Secured by Supabase & Razorpay UPI Infrastructure</p>
                    </div>
                ) : (
                    <div className="text-center py-10 animate-fade-in">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-widest mb-2">Payment Received</h3>
                        <p className="text-gray-400 text-sm font-mono">Inventory automatically synced.</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}
