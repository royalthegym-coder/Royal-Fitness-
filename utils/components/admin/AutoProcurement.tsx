
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { ShoppingCart, Truck, AlertTriangle, Plus, Package, Check } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const AutoProcurement: React.FC = () => {
    const { inventory, updateInventory, orders, addOrder } = useData();
    const { addToast } = useToast();
    
    // In v31.0, Orders are managed centrally in DataProvider based on inventory state.
    // This component now just displays them and allows manual overrides.

    const handleOrder = (itemName: string) => {
        const newOrder = { 
            id: `ORD-${Date.now()}`, 
            item: itemName, 
            status: 'Processing',
            quantity: 10,
            timestamp: new Date().toISOString()
        };
        addOrder(newOrder); // Use Context Action
        addToast(`Auto-Order dispatched for ${itemName}.`, "success");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
             <div className="flex justify-between items-center bg-[#050505] p-8 rounded-[3rem] border border-amber-500/20">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Truck className="w-8 h-8 text-amber-500" />
                        Auto <span className="text-amber-500">Procurement</span>
                    </h1>
                    <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Supply Chain Neural Network</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inventory List */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-white pl-4">Live Inventory Matrix</h3>
                    {inventory.map(item => (
                        <div key={item.id} className="bg-gray-900 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center hover:border-amber-500/30 transition-all">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-2xl ${item.stock <= item.threshold ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">{item.name}</h4>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</p>
                                </div>
                            </div>
                            
                            <div className="text-right flex items-center gap-6">
                                <div>
                                    <p className={`text-2xl font-black italic ${item.stock <= item.threshold ? 'text-red-500' : 'text-white'}`}>{item.stock}</p>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold">In Stock</p>
                                </div>
                                {item.stock <= item.threshold && (
                                    <button 
                                        onClick={() => handleOrder(item.name)}
                                        className="bg-amber-500 text-black p-3 rounded-xl hover:bg-amber-400 transition-all shadow-lg active:scale-95"
                                        title="Order Restock"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Orders Panel - Now Linked to Context */}
                <div className="space-y-6">
                    <Card title="Active Orders (Live)" className="bg-black border-white/10 h-full">
                        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {orders.length === 0 && <p className="text-gray-600 text-center py-10 text-xs uppercase">No active shipments.</p>}
                            {orders.map(order => (
                                <div key={order.id} className="p-4 rounded-2xl bg-gray-900 border border-white/5 flex justify-between items-center animate-fade-in">
                                    <div>
                                        <p className="text-white font-bold text-sm">{order.item}</p>
                                        <p className="text-[10px] text-gray-500 font-mono">{order.id}</p>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${order.status === 'Shipped' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AutoProcurement;
