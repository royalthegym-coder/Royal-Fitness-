import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { Package, Plus, ShoppingCart, TrendingUp, AlertTriangle, ArrowUpRight, Search, BarChart2, ShieldCheck, Zap } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { StoreProduct, StoreOrder } from '../../types';
import { useToast } from '../../hooks/useToast';
import { motion } from 'framer-motion';

export default function InventoryPortal() {
    const { storeTransactions, members } = useData();
    const { storeProducts, storeOrders, addStoreProduct, updateStoreProduct, deleteStoreProduct } = useData();
    const { addToast } = useToast();

    const [isAddMode, setIsAddMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<StoreProduct>>({ category: 'Supplement', stock: 10, price: 0, initialStock: 10, soldStock: 0 });
    const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
    const [autoOrderedItems, setAutoOrderedItems] = useState<Set<string>>(new Set());

    const handleAddProduct = () => {
        if (!formData.name || formData.price === undefined || formData.stock === undefined) {
            addToast('Please fill all required fields.', 'error');
            return;
        }

        const newProduct: StoreProduct = {
            id: `PRD-${Date.now()}`,
            name: formData.name,
            category: formData.category as StoreProduct['category'],
            price: Number(formData.price),
            stock: Number(formData.stock),
            initialStock: Number(formData.stock),
            soldStock: 0,
            reorder_threshold: formData.reorder_threshold || 5,
            image: formData.image || 'https://via.placeholder.com/150',
            description: formData.description || '',
        };

        addStoreProduct(newProduct);
        addToast('Product added to inventory.', 'success');
        setIsAddMode(false);
        setFormData({ category: 'Supplement', stock: 10, price: 0, initialStock: 10, soldStock: 0 });
    };

    const handleUpdateStock = (id: string, currentStock: number, additionalStock: number) => {
        const product = storeProducts.find(p => p.id === id);
        if (!product) return;
        
        const newStock = Number(currentStock) + Number(additionalStock);
        updateStoreProduct({ 
             ...product, 
             stock: newStock,
             initialStock: (product.initialStock || 0) + Number(additionalStock) 
        });
        addToast(`Stock added. New count: ${newStock}`, 'success');
    };

    // Calculate totals
    const totalInventoryValue = storeProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const lowStockItems = storeProducts.filter(p => p.stock < (p.reorder_threshold || 5));
    const totalSales = storeOrders.filter(o => o.status === 'Completed').reduce((acc, o) => acc + o.total, 0);

    useEffect(() => {
        lowStockItems.forEach(item => {
            if (!autoOrderedItems.has(item.id)) {
                addToast(`CRITICAL STOCK ALERT: ${item.name} is running low. Auto-Order protocol initiated via procurement bot.`, 'info');
                setAutoOrderedItems(prev => new Set(prev).add(item.id));
            }
        });
    }, [lowStockItems, autoOrderedItems, addToast]);

    const filteredProducts = storeProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-black/40 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                        <Package className="w-8 h-8 text-fuchsia-400" />
                        AI Supply Core
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-mono flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Inventory & Order Ledger
                    </p>
                </div>
                <div className="flex gap-4">
                     <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'inventory' ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Inventory List
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'orders' ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Order History
                    </button>
                    <button
                        onClick={() => setActiveTab('recent_sales' as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'recent_sales' as any ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Recent Sales Feed
                    </button>
                    <button
                        onClick={() => { setActiveTab('inventory'); setIsAddMode(true); }}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
                    >
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-black/40 border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-500/10 rounded-xl">
                            <Package className="w-6 h-6 text-fuchsia-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 uppercase tracking-wider font-mono">Stock Assets</div>
                            <div className="text-2xl font-black text-white">₹{totalInventoryValue.toLocaleString()}</div>
                        </div>
                    </div>
                </Card>
                <Card className="bg-black/40 border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-500/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 uppercase tracking-wider font-mono">Total Sales</div>
                            <div className="text-2xl font-black text-white">₹{totalSales.toLocaleString()}</div>
                        </div>
                    </div>
                </Card>
                <Card className="bg-red-500/5 border-red-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 uppercase tracking-wider font-mono">Low Stock Alerts</div>
                            <div className="text-2xl font-black text-red-400">{lowStockItems.length} Items</div>
                        </div>
                    </div>
                </Card>
            </div>

            {activeTab === 'inventory' && (
                <>
                    {/* Add Mode Modal */}
                    {isAddMode && (
                         <motion.div 
                             initial={{ opacity: 0, y: -20 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="bg-black/60 p-6 rounded-3xl border border-cyan-500/30 backdrop-blur-sm relative"
                         >
                            <div className="flex items-center gap-2 mb-6">
                                <Zap className="w-5 h-5 text-cyan-400" />
                                <h3 className="text-xl font-bold text-white uppercase italic tracking-wider">Initialize New Product</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-mono">Product Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                                        placeholder="e.g. Whey Protein Isolate"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-mono">Category</label>
                                    <select 
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value as StoreProduct['category']})}
                                    >
                                        <option value="Supplement">Supplement</option>
                                        <option value="Gear">Gym Gear</option>
                                        <option value="Beverage">Beverage</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-mono">Price (₹)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                                        value={formData.price || ''}
                                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-mono">Initial Stock Quantity</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                                        value={formData.stock || ''}
                                        onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-mono">Reorder Threshold</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                                        value={formData.reorder_threshold || ''}
                                        onChange={e => setFormData({...formData, reorder_threshold: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button 
                                    onClick={() => setIsAddMode(false)}
                                    className="px-6 py-2 rounded-xl text-gray-400 hover:bg-gray-800 text-sm font-bold uppercase tracking-wider transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAddProduct}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition"
                                >
                                    Launch Product
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Inventory Table */}
                     <Card className="bg-black/40 border-white/5">
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-xl font-bold text-white uppercase italic tracking-wider flex items-center gap-2">
                                 <BarChart2 className="w-5 h-5 text-fuchsia-400" /> Stock Index
                             </h2>
                             <div className="relative">
                                 <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                                 <input 
                                     type="text"
                                     placeholder="Search products..."
                                     className="bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                                     value={searchTerm}
                                     onChange={(e) => setSearchTerm(e.target.value)}
                                 />
                             </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-widest font-mono text-xs">
                                        <th className="pb-4 font-normal">Product</th>
                                        <th className="pb-4 font-normal">Category</th>
                                        <th className="pb-4 font-normal">Price</th>
                                        <th className="pb-4 font-normal">Stock Level</th>
                                        <th className="pb-4 font-normal">Sold</th>
                                        <th className="pb-4 font-normal text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className="group">
                                            <td className="py-4">
                                                <div className="font-bold text-white">{product.name}</div>
                                                <div className="text-[10px] text-gray-500 font-mono mt-1">{product.id}</div>
                                            </td>
                                            <td className="py-4 text-gray-300">
                                                <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="py-4 text-emerald-400 font-mono">₹{product.price}</td>
                                            <td className="py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                                        product.stock < (product.reorder_threshold || 5) 
                                                          ? 'bg-red-500/20 text-red-400' 
                                                          : product.stock < (product.reorder_threshold || 5) * 2 
                                                              ? 'bg-amber-500/20 text-amber-400'
                                                              : 'bg-emerald-500/20 text-emerald-400'
                                                    }`}>
                                                        {product.stock} units
                                                    </span>
                                                    {product.stock < (product.reorder_threshold || 5) && (
                                                        <span className="text-red-400 text-[9px] font-bold uppercase tracking-wider animate-pulse whitespace-nowrap">
                                                            Low Alert (Auto-Order Triggered)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 text-cyan-400 font-mono">{product.soldStock || 0} units</td>
                                            <td className="py-4 text-right">
                                                 <div className="flex justify-end gap-2">
                                                     <button 
                                                        onClick={() => handleUpdateStock(product.id, product.stock, 10)}
                                                        className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition"
                                                     >
                                                         +10 Stock
                                                     </button>
                                                     <button 
                                                        onClick={() => deleteStoreProduct(product.id)}
                                                        className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition"
                                                     >
                                                         Del
                                                     </button>
                                                 </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-gray-500 italic">No products found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                     </Card>
                </>
            )}

            {activeTab === 'orders' && (
                <Card className="bg-black/40 border-white/5">
                    <div className="flex gap-2 items-center mb-6">
                        <ShoppingCart className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-xl font-bold text-white uppercase italic tracking-wider">Automated Sales Ledger</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-widest font-mono text-xs">
                                    <th className="pb-4 font-normal">Order ID</th>
                                    <th className="pb-4 font-normal">Date</th>
                                    <th className="pb-4 font-normal">Items</th>
                                    <th className="pb-4 font-normal">Total</th>
                                    <th className="pb-4 font-normal">Payment</th>
                                    <th className="pb-4 font-normal">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {storeOrders.map((order) => (
                                    <tr key={order.id} className="group">
                                        <td className="py-4">
                                            <div className="font-mono text-white text-xs">{order.id}</div>
                                            <div className="text-[10px] text-gray-500 mt-1">Member ID: {order.memberId}</div>
                                        </td>
                                        <td className="py-4 text-gray-400 font-mono text-xs text-nowrap">
                                            {new Date(order.date).toLocaleString()}
                                        </td>
                                        <td className="py-4 text-gray-300">
                                            <div className="text-xs space-y-1">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx}>• {item.name} (x{item.qty})</div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-4 text-emerald-400 font-mono font-bold">₹{order.total}</td>
                                        <td className="py-4">
                                            <span className="text-xs text-fuchsia-300 bg-fuchsia-500/10 px-2 py-0.5 rounded whitespace-nowrap">
                                                {order.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded whitespace-nowrap ${
                                                order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                order.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {storeOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500 italic">No sales recorded yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            {activeTab === 'recent_sales' as any && (
                <Card className="bg-black/40 border-white/5">
                    <div className="flex gap-2 items-center mb-6">
                        <ShoppingCart className="w-5 h-5 text-fuchsia-400" />
                        <h2 className="text-xl font-bold text-white uppercase italic tracking-wider">Recent Sales Feed</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-widest font-mono text-xs">
                                    <th className="pb-4 font-normal">Txn ID</th>
                                    <th className="pb-4 font-normal">Date/Time</th>
                                    <th className="pb-4 font-normal">Product</th>
                                    <th className="pb-4 font-normal">Member</th>
                                    <th className="pb-4 font-normal">Qty</th>
                                    <th className="pb-4 font-normal">Total Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {storeTransactions.map((tx) => {
                                    const productName = storeProducts.find(p => p.id === tx.product_id)?.name || 'Unknown Product';
                                    const memberName = members?.find(m => m.id === tx.member_id)?.name || 'Unknown Member';
                                    return (
                                        <tr key={tx.id} className="group">
                                            <td className="py-4">
                                                <div className="font-mono text-white text-xs">{tx.id}</div>
                                            </td>
                                            <td className="py-4 text-gray-400 font-mono text-xs text-nowrap">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-4 text-cyan-300 font-bold text-xs">
                                                {productName}
                                            </td>
                                            <td className="py-4 text-white text-xs">
                                                {memberName}
                                            </td>
                                            <td className="py-4 text-emerald-400 font-mono font-bold">{tx.quantity}</td>
                                            <td className="py-4 text-fuchsia-400 font-mono font-bold">₹{tx.total_price}</td>
                                        </tr>
                                    );
                                })}
                                {storeTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500 italic">No recent sales.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
