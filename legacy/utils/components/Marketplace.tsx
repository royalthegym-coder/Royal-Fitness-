import { getCurrencySymbol } from '../store/useCurrencyStore';
import React, { useState, useRef } from 'react';
import { useData } from '../context/DataProvider';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { 
    ShoppingBag, Plus, Edit2, Trash2, Search, Filter, 
    ShoppingCart, Upload, AlertTriangle, FileText, 
    Calendar, Inbox, Check, X, ShieldAlert, Archive, 
    PlusCircle, ArrowUpRight, TrendingUp, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import Card from './common/Card';
import { StoreProduct, StoreOrder } from '../../types';
import { useToast } from '../hooks/useToast';
import { motion, AnimatePresence } from 'motion/react';

// Beautiful sample preset images
const PRESET_IMAGES = [
    { name: 'Whey Protein', url: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=600&auto=format&fit=crop&q=80' },
    { name: 'Creatine Monohydrate', url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600&auto=format&fit=crop&q=80' },
    { name: 'Pre Workout Juice', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80' },
    { name: 'Gym T-Shirt', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80' },
    { name: 'Protein Shaker Bottle', url: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=600&auto=format&fit=crop&q=80' }
];

const Marketplace: React.FC = () => {
    const isOnline = useNetworkStatus();
    const { 
        storeProducts, 
        storeOrders, 
        addStoreProduct, 
        updateStoreProduct, 
        deleteStoreProduct,
        updateStoreOrderStatus 
    } = useData();
    const { addToast } = useToast();

    // Tab view selection
    const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'stock_audit'>('products');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Modals state
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
    const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
    const [damageProduct, setDamageProduct] = useState<StoreProduct | null>(null);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [restockProduct, setRestockProduct] = useState<StoreProduct | null>(null);

    // Image upload ref and preview
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    // Product Form Fields
    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState(0);
    const [prodStock, setProdStock] = useState(0);
    const [prodCategory, setProdCategory] = useState<'Supplement' | 'Gear' | 'Beverage' | 'Other'>('Supplement');
    const [prodDesc, setProdDesc] = useState('');
    const [prodImage, setProdImage] = useState('');

    // Damage Log Fields
    const [damageQty, setDamageQty] = useState(1);
    const [damageReason, setDamageReason] = useState('Expired');
    const [damageDetail, setDamageDetail] = useState('');
    const [damageDate, setDamageDate] = useState(new Date().toISOString().split('T')[0]);

    // Restock Fields
    const [restockQty, setRestockQty] = useState(10);

    // Handle Local Image Upload to Base64
    const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setProdImage(base64String);
                setImagePreview(base64String);
                addToast("Photo uploaded and encoded successfully!", "success");
            };
            reader.readAsDataURL(file);
        }
    };

    // Open Modal to Add/Create Product
    const handleOpenAddProduct = () => {
        setEditingProduct(null);
        setProdName('');
        setProdPrice(0);
        setProdStock(0);
        setProdCategory('Supplement');
        setProdDesc('');
        setProdImage(PRESET_IMAGES[0].url); // default preset
        setImagePreview(PRESET_IMAGES[0].url);
        setIsProductModalOpen(true);
    };

    // Open Modal to Edit Product
    const handleOpenEditProduct = (product: StoreProduct) => {
        setEditingProduct(product);
        setProdName(product.name);
        setProdPrice(product.price);
        setProdStock(product.stock);
        setProdCategory(product.category);
        setProdDesc(product.description);
        setProdImage(product.image);
        setImagePreview(product.image);
        setIsProductModalOpen(true);
    };

    // Save added or edited product
    const handleSaveProductSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isOnline) {
            addToast("Cannot save product. Working in offline mode.", "error");
            return;
        }

        if (!prodName.trim()) {
            addToast("Please enter product name!", "error");
            return;
        }
        if (prodPrice <= 0) {
            addToast("Please enter a valid price!", "error");
            return;
        }
        if (prodStock < 0) {
            addToast("Stock cannot be negative!", "error");
            return;
        }

        if (editingProduct) {
            // Edit mode
            const updated: StoreProduct = {
                ...editingProduct,
                name: prodName,
                price: prodPrice,
                stock: prodStock,
                category: prodCategory,
                description: prodDesc,
                image: prodImage || PRESET_IMAGES[0].url,
                // keep tracking fields, initialize if empty
                initialStock: editingProduct.initialStock !== undefined ? editingProduct.initialStock : prodStock,
                soldStock: editingProduct.soldStock || 0,
                failedStock: editingProduct.failedStock || 0,
                failedDetails: editingProduct.failedDetails || []
            };
            updateStoreProduct(updated);
            addToast(`Successfully updated ${prodName}!`, "success");
        } else {
            // Add mode
            const newProduct: StoreProduct = {
                id: 'prod_' + Date.now(),
                name: prodName,
                price: prodPrice,
                stock: prodStock,
                category: prodCategory,
                description: prodDesc,
                image: prodImage || PRESET_IMAGES[0].url,
                initialStock: prodStock,
                soldStock: 0,
                failedStock: 0,
                failedDetails: []
            };
            addStoreProduct(newProduct);
            addToast(`Product "${prodName}" added successfully!`, "success");
        }

        setIsProductModalOpen(false);
    };

    // Open Modal to restock
    const handleOpenRestock = (product: StoreProduct) => {
        setRestockProduct(product);
        setRestockQty(10);
        setIsRestockModalOpen(true);
    };

    // Submit restock values
    const handleRestockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!restockProduct) return;

        if (restockQty <= 0) {
            addToast("Enter a valid restock status qty (> 0)!", "error");
            return;
        }

        const currentInitial = restockProduct.initialStock !== undefined ? restockProduct.initialStock : restockProduct.stock;
        
        const updated: StoreProduct = {
            ...restockProduct,
            stock: restockProduct.stock + restockQty,
            initialStock: currentInitial + restockQty
        };

        updateStoreProduct(updated);
        addToast(`Successfully added ${restockQty} units to ${restockProduct.name} stock!`, "success");
        setIsRestockModalOpen(false);
    };

    // Open Modal for Logging Damage/Expiry
    const handleOpenDamageLog = (product: StoreProduct) => {
        setDamageProduct(product);
        setDamageQty(1);
        setDamageReason('Expired');
        setDamageDetail('');
        setDamageDate(new Date().toISOString().split('T')[0]);
        setIsDamageModalOpen(true);
    };

    // Save logged defect/damage/expiry
    const handleDamageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!damageProduct) return;

        if (damageQty <= 0) {
            addToast("Quantity must be greater than 0!", "error");
            return;
        }

        if (damageQty > damageProduct.stock) {
            addToast(`Damage qty cannot exceed active stock (${damageProduct.stock} units available)!`, "error");
            return;
        }

        const currentFailed = damageProduct.failedStock || 0;
        const currentFailedDetails = damageProduct.failedDetails || [];

        const newLog = {
            qty: damageQty,
            reason: damageReason,
            date: damageDate,
            detail: damageDetail.trim() || 'No additional details'
        };

        const updated: StoreProduct = {
            ...damageProduct,
            stock: damageProduct.stock - damageQty,
            failedStock: currentFailed + damageQty,
            failedDetails: [newLog, ...currentFailedDetails]
        };

        updateStoreProduct(updated);
        addToast(`Successfully logged ${damageQty} units as Wasted/Damage!`, "success");
        setIsDamageModalOpen(false);
    };

    // Handle Deletion with alert confirm
    const handleDeleteConfirm = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}" from the store?`)) {
            deleteStoreProduct(id);
            addToast(`Successfully deleted ${name}`, "info");
        }
    };

    // Filtered Products list
    const filteredProducts = storeProducts.filter(p => 
        (categoryFilter === 'All' || p.category === categoryFilter) &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate total values for the Stock Audit Dashboard
    const totalInventoryValue = storeProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const totalActiveStockUnits = storeProducts.reduce((acc, p) => acc + p.stock, 0);
    const totalDamagedUnitsLogged = storeProducts.reduce((acc, p) => acc + (p.failedStock || 0), 0);
    
    // Total Failed Stock estimated market value
    const totalDamagedValueLost = storeProducts.reduce((acc, p) => acc + (p.price * (p.failedStock || 0)), 0);

    // Extract all individual wasted stock audit logs for chronological list
    const allWastedAuditLogs = storeProducts.flatMap(p => {
        const details = p.failedDetails || [];
        return details.map(d => ({
            productId: p.id,
            productName: p.name,
            category: p.category,
            image: p.image,
            price: p.price,
            qty: d.qty,
            reason: d.reason,
            date: d.date,
            detail: (d as any).detail
        }));
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-gray-300">
            {/* Ambient Background decoration */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none z-0"></div>

            {/* Header section with rich UI summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-wider">
                        <ShoppingBag className="w-8 h-8 text-amber-500 animate-pulse" />
                        FUTURE MARKETPLACE ADMIN
                    </h1>
                    <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">
                        SUPPLEMENTS, GEAR & MERCHANDISE INVENTORY JOURNAL
                    </p>
                </div>

                {/* Tab layout button toggler */}
                <div className="flex gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800/80">
                    <button 
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'products' 
                                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-900'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Products
                    </button>
                    <button 
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'orders' 
                                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-900'
                        }`}
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Orders ({storeOrders.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('stock_audit')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'stock_audit' 
                                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-400/20' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-900'
                        }`}
                    >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Stock & Waste Auditing
                    </button>
                </div>
            </div>

            {/* TAB 1: PRODUCTS SHOWCASE & MANAGEMENT */}
            {activeTab === 'products' && (
                <div className="space-y-6 relative z-10">
                    {/* Control Panel: Search & Filters */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search products by brand, keyword..." 
                                    className="w-full bg-zinc-950 border border-gray-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none font-mono"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select 
                                className="bg-zinc-950 border border-gray-800 text-xs rounded-xl px-4 py-2.5 text-gray-300 pointer-events-auto outline-none focus:border-amber-500"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                <option value="Supplement">Supplements</option>
                                <option value="Gear">Gear & Apparel</option>
                                <option value="Beverage">Beverages</option>
                                <option value="Other">Other Products</option>
                            </select>
                        </div>

                        <button 
                            onClick={handleOpenAddProduct}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                        >
                            <Plus className="w-4 h-4 stroke-[3px]" /> Add New Product
                        </button>
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-24 bg-zinc-950/80 border border-gray-900 rounded-[2rem] space-y-3">
                            <Inbox className="w-12 h-12 text-zinc-600 mx-auto" />
                            <h3 className="text-sm font-bold text-gray-400">No products match your criteria.</h3>
                            <p className="text-xs text-zinc-500">Tap "Add New Product" to manually populate items in your database.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(product => {
                                const currentFailed = product.failedStock || 0;
                                return (
                                    <div 
                                        key={product.id} 
                                        className="bg-black/80 hover:bg-zinc-950/90 border border-gray-800/80 hover:border-amber-500/40 rounded-[2rem] overflow-hidden flex flex-col transition-all duration-300 shadow-xl group"
                                    >
                                        {/* Product image space */}
                                        <div className="h-52 bg-zinc-900/40 relative overflow-hidden flex items-center justify-center">
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-black uppercase text-amber-500 border border-amber-500/20">
                                                {product.category}
                                            </div>

                                            {/* Stock badge indicator */}
                                            <div className="absolute bottom-3 right-3 bg-black/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-800 flex flex-col items-center">
                                                <span className="text-[9px] text-gray-500 font-bold uppercase block tracking-tighter">STOCK LEFT</span>
                                                <span className={`text-sm font-black ${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-amber-400 animate-pulse' : 'text-red-500 font-bold'}`}>
                                                    {product.stock} pcs
                                                </span>
                                            </div>
                                        </div>

                                        {/* Product specifications */}
                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-extrabold text-white line-clamp-1 uppercase group-hover:text-amber-400 transition-colors">
                                                    {product.name}
                                                </h3>
                                                <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-2 h-8">
                                                    {product.description || 'No detailed specifications entered.'}
                                                </p>
                                            </div>

                                            {/* Sub ledger statistics for this item */}
                                            <div className="bg-zinc-950/90 p-3 rounded-xl border border-white/5 space-y-1.5">
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-500">Total Added:</span>
                                                    <span className="text-white font-bold">{product.initialStock !== undefined ? product.initialStock : product.stock} pcs</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-500 font-medium">Sold Out:</span>
                                                    <span className="text-amber-500 font-bold">{product.soldStock || 0} pcs</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-[#ef4444] font-medium flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3 text-[#ef4444]" /> Wasted / Expired:
                                                    </span>
                                                    <span className="text-red-400 font-bold">{currentFailed} pcs</span>
                                                </div>
                                            </div>

                                            <div className="flex items-end justify-between border-t border-gray-800/40 pt-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-[#8c8c8c]">PRODUCT PRICE</span>
                                                    <span className="text-lg font-black text-emerald-400 font-sans">
                                                        {getCurrencySymbol()}{product.price.toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => handleOpenRestock(product)}
                                                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg hover:shadow-[0_0_8px_rgba(34,197,94,0.15)] transition-all"
                                                        title="Add Stock"
                                                    >
                                                        <PlusCircle className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenDamageLog(product)}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg hover:shadow-[0_0_8px_rgba(239,68,68,0.15)] transition-all"
                                                        title="Log Expired/Broken Stock"
                                                    >
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Primary buttons container */}
                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-900">
                                                <button 
                                                    onClick={() => handleOpenEditProduct(product)}
                                                    className="flex items-center justify-center gap-1.5 py-2 bg-zinc-90 w-full bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] uppercase font-bold rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-3 h-3" /> Edit Detail
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteConfirm(product.id, product.name)}
                                                    className="flex items-center justify-center gap-1.5 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-[10px] uppercase font-bold rounded-lg transition-all border border-red-500/10"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: STORE ORDERS */}
            {activeTab === 'orders' && (
                <div className="space-y-6 relative z-10 transition-all">
                    <Card className="p-6 bg-[#040404] border border-gray-800 rounded-[2rem]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#f0f0f0] flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-amber-500" />
                                Store Purchase Invoices
                            </h3>
                            <span className="text-zinc-500 text-[11px] font-mono block">
                                TOTAL RECORDED: {storeOrders.length} ORDERS
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            {/* Desktop Table */}
                            <table className="w-full text-left border-collapse hidden md:table">
                                <thead>
                                    <tr className="border-b border-gray-800 text-zinc-500 text-xs">
                                        <th className="pb-3.5 font-bold uppercase tracking-wider whitespace-nowrap">Order ID</th>
                                        <th className="pb-3.5 font-bold uppercase tracking-wider whitespace-nowrap">Date</th>
                                        <th className="pb-3.5 font-bold uppercase tracking-wider whitespace-nowrap">Member ID</th>
                                        <th className="pb-3.5 font-bold uppercase tracking-wider whitespace-nowrap">Items Purchased</th>
                                        <th className="pb-3.5 font-bold uppercase tracking-wider whitespace-nowrap">Total</th>
                                        <th className="pb-3.5 font-bold uppercase tracking-wider whitespace-nowrap">Payment Method</th>
                                        <th className="pb-3.5 font-bold uppercase tracking-wider whitespace-nowrap">Status</th>
                                        <th className="pb-3.5 font-bold uppercase tracking-wider text-right whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px]">
                                    {storeOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-zinc-600">
                                                <Inbox className="w-10 h-10 mx-auto mb-2 text-zinc-800" />
                                                No direct gym orders have been registered yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        storeOrders.map(order => (
                                            <tr key={order.id} className="border-b border-gray-900/40 hover:bg-zinc-950/60 transition-colors">
                                                <td className="py-4 text-white font-mono font-bold tracking-wider whitespace-nowrap">#{order.id}</td>
                                                <td className="py-4 text-zinc-400 whitespace-nowrap">{new Date(order.date).toLocaleDateString()}</td>
                                                <td className="py-4 text-zinc-300 whitespace-nowrap">Member ID: {order.memberId}</td>
                                                <td className="py-4 text-zinc-400 max-w-xs truncate whitespace-nowrap">
                                                    {order.items.map(it => `${it.name} (${it.qty}x)`).join(', ')}
                                                </td>
                                                <td className="py-4 text-emerald-400 font-extrabold text-xs font-sans whitespace-nowrap">
                                                    {getCurrencySymbol()}{order.total.toLocaleString()}
                                                </td>
                                                <td className="py-4 text-zinc-400 whitespace-nowrap">
                                                    <span className="px-2.5 py-1 bg-zinc-900 text-zinc-300 rounded-md border border-white/5 font-bold text-[9px] uppercase">
                                                        {order.paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                                        order.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        order.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right whitespace-nowrap">
                                                    <div className="flex justify-end gap-1">
                                                        {order.status === 'Pending' && (
                                                            <button 
                                                                onClick={() => {
                                                                    updateStoreOrderStatus(order.id, 'Completed');
                                                                    addToast(`Order #${order.id} completed!`, "success");
                                                                }}
                                                                className="px-2 py-1 bg-green-500 text-black rounded font-black text-[9px] uppercase"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        <span className="text-zinc-500 text-[10px] self-center">No actions needed</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Mobile Card Layout */}
                            <div className="md:hidden flex flex-col space-y-4">
                                {storeOrders.length === 0 ? (
                                    <div className="py-12 text-center text-zinc-600">
                                        <Inbox className="w-10 h-10 mx-auto mb-2 text-zinc-800" />
                                        No direct gym orders have been registered yet.
                                    </div>
                                ) : (
                                    storeOrders.map(order => (
                                        <div key={order.id} className="bg-[#050505] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-white font-mono font-bold tracking-wider text-sm">#{order.id}</span>
                                                    <div className="text-[10px] text-zinc-500 mt-0.5">{new Date(order.date).toLocaleDateString()}</div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border ${
                                                    order.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    order.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            
                                            <div className="text-[11px] text-zinc-400 bg-zinc-900/50 p-2.5 rounded-lg border border-white/5">
                                                <div className="text-zinc-300 font-bold mb-1">Items:</div>
                                                {order.items.map(it => `${it.name} (${it.qty}x)`).join(', ')}
                                            </div>
                                            
                                            <div className="flex justify-between items-center border-t border-gray-800 pt-3">
                                                <div>
                                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block mb-0.5">Total Amount</span>
                                                    <span className="text-emerald-400 font-extrabold text-sm font-sans">{getCurrencySymbol()}{order.total.toLocaleString()}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="px-2 py-0.5 bg-zinc-900 text-zinc-300 rounded border border-white/5 font-bold text-[8px] uppercase">
                                                        {order.paymentMethod}
                                                    </span>
                                                    {order.status === 'Pending' && (
                                                        <button 
                                                            onClick={() => {
                                                                updateStoreOrderStatus(order.id, 'Completed');
                                                                addToast(`Order #${order.id} completed!`, "success");
                                                            }}
                                                            className="px-3 py-1.5 bg-green-500 hover:bg-green-400 transition-colors text-black rounded font-black text-[9px] uppercase"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* TAB 3: STOCK & WASTE AUDITING TAB */}
            {activeTab === 'stock_audit' && (
                <div className="space-y-6 relative z-10 transition-all">
                    
                    {/* Multi KPI metric grid highlight */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-[#050505] border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">Active Inventory Value</span>
                                <h4 className="text-2xl font-black text-white font-sans mt-1">
                                    {getCurrencySymbol()}{totalInventoryValue.toLocaleString()}
                                </h4>
                                <span className="text-[9px] text-[#4ade80] block mt-1">FOR {totalActiveStockUnits} PIECES OF STOCK ALIVE</span>
                            </div>
                            <div className="p-3 bg-zinc-900 text-green-400 rounded-xl border border-white/5">
                                <Archive className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-[#050505] border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">Defective Stock Quantities</span>
                                <h4 className="text-2xl font-black text-red-500 font-sans mt-1">
                                    {totalDamagedUnitsLogged} units
                                </h4>
                                <span className="text-[9px] text-[#ef4444] block mt-1">WASTED / EXPIRED</span>
                            </div>
                            <div className="p-3 bg-red-950/20 text-[#ef4444] rounded-xl border border-red-500/10">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-[#050505] border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">Estimated Revenue Lost</span>
                                <h4 className="text-2xl font-black text-red-400 font-sans mt-1">
                                    {getCurrencySymbol()}{totalDamagedValueLost.toLocaleString()}
                                </h4>
                                <span className="text-[9px] text-zinc-500 block mt-1">TOTAL EXPIRY LOSS ACCORDING TO MRP</span>
                            </div>
                            <div className="p-3 bg-zinc-900 text-red-400 rounded-xl border border-white/5">
                                <TrendingUp className="w-6 h-6 stroke-[1.5px]" />
                            </div>
                        </div>

                        <div className="bg-[#050505] border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">Database Completeness</span>
                                <h4 className="text-2xl font-black text-cyan-400 font-sans mt-1">
                                    100% SECURE
                                </h4>
                                <span className="text-[9px] text-zinc-500 block mt-1">GATT CHANNELS SYNCHRONIZED</span>
                            </div>
                            <div className="p-3 bg-zinc-900 text-cyan-400 rounded-xl border border-white/5">
                                <Sparkles className="w-6 h-6 text-cyan-400" />
                            </div>
                        </div>
                    </div>

                    {/* Left & Right layout: Consolidated Stock Ledger & Damaged Stock details */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
                        
                        {/* Consolidated overview table of all product metrics */}
                        <div className="lg:col-span-7 bg-[#040404] border border-gray-800 p-6 rounded-[2rem] space-y-4">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-gray-800 pb-3 flex items-center gap-2">
                                <Archive className="w-4 h-4 text-amber-500" /> Stock Audit Ledger
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-950 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                                            <th className="pb-2.5">Item Name</th>
                                            <th className="pb-2.5">Initial Added</th>
                                            <th className="pb-2.5 text-amber-500">Sold</th>
                                            <th className="pb-2.5 text-red-500">Failed</th>
                                            <th className="pb-2.5 text-green-400">Available</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[11px] font-mono">
                                        {storeProducts.map(p => {
                                            const original = p.initialStock !== undefined ? p.initialStock : p.stock;
                                            return (
                                                <tr key={p.id} className="border-b border-gray-900/40 hover:bg-zinc-900/10">
                                                    <td className="py-3 font-bold text-white flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                        {p.name}
                                                    </td>
                                                    <td className="py-3 text-zinc-400">{original} pcs</td>
                                                    <td className="py-3 text-amber-400 font-extrabold">{p.soldStock || 0} pcs</td>
                                                    <td className="py-3 text-red-400 font-extrabold">{p.failedStock || 0} pcs</td>
                                                    <td className="py-3">
                                                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                                                            p.stock > 10 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                        }`}>
                                                            {p.stock} pcs
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Wasted Stock Chronological History Log */}
                        <div className="lg:col-span-5 bg-[#040404] border border-red-500/20 p-6 rounded-[2rem] space-y-4">
                            <h3 className="text-xs font-black text-red-400 uppercase tracking-widest border-b border-gray-800 pb-3 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                Wasted & Defective Stock Journal
                            </h3>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {allWastedAuditLogs.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500 text-xs">
                                        No failed or wasted stock items have been recorded yet. Healthy operations.
                                    </div>
                                ) : (
                                    allWastedAuditLogs.map((log, i) => (
                                        <div 
                                            key={i} 
                                            className="p-4 bg-zinc-950 rounded-xl border border-red-500/15 relative overflow-hidden space-y-1.5"
                                        >
                                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-500"></div>
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-xs text-white font-extrabold uppercase line-clamp-1">{log.productName}</h4>
                                                <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded uppercase font-mono">
                                                    -{log.qty} pcs
                                                </span>
                                            </div>
                                            <div className="flex gap-4 text-[9px] text-zinc-500 font-mono">
                                                <span>Reason: {log.reason}</span>
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-zinc-600" /> {log.date}</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 leading-relaxed pt-1 bg-black/40 p-2 rounded border border-white/5 font-mono italic">
                                                &gt; "{log.detail}"
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: CREATE OR EDIT PRODUCT FORM MODULE */}
            <AnimatePresence>
                {isProductModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="bg-zinc-950 border-2 border-amber-500/30 p-8 rounded-[2.5rem] w-full max-w-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] my-8"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">
                                        {editingProduct ? '✏️ Edit Product details' : '➕ create new product'}
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 uppercase mt-1">
                                        {editingProduct ? 'Update catalogue specifications' : 'Surgical entry to product index register'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="p-1.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white"
                                    type="button"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProductSubmit} className="space-y-6 text-left">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* Left field bundle: text configs */}
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Product Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Rule 1 Whey Protein Isolate"
                                                className="w-full bg-black border border-gray-800 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                                                value={prodName}
                                                onChange={(e) => setProdName(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Category</label>
                                                <select 
                                                    className="w-full bg-black border border-gray-800 focus:border-amber-500 rounded-xl px-3 py-3 text-xs text-white outline-none font-mono"
                                                    value={prodCategory}
                                                    onChange={(e) => setProdCategory(e.target.value as any)}
                                                >
                                                    <option value="Supplement">Supplement</option>
                                                    <option value="Gear">Gear & Apparel</option>
                                                    <option value="Beverage">Beverage</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Unit Price (INR)</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-black border border-gray-800 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                                                    value={prodPrice}
                                                    onChange={(e) => setProdPrice(Number(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Initial Stock Quantities</label>
                                            <input 
                                                type="number" 
                                                disabled={!!editingProduct}
                                                title={editingProduct ? "Available stock is managed on cards or added via restock action." : "Set initial available stock."}
                                                className="w-full bg-black border border-gray-800 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono disabled:opacity-40"
                                                value={prodStock}
                                                onChange={(e) => setProdStock(Number(e.target.value))}
                                            />
                                            {editingProduct && (
                                                <p className="text-[9px] text-amber-500">
                                                    * Editing product stock is disabled here. Use "+ Stock" action on the active card directly to restock.
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Description & Details</label>
                                            <textarea 
                                                rows={3}
                                                placeholder="Provide detailed protein content, material specification, warnings..."
                                                className="w-full bg-black border border-gray-800 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                                                value={prodDesc}
                                                onChange={(e) => setProdDesc(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Right Field bundle: Image Upload options */}
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                                                Real Photo Upload
                                            </label>
                                            <div 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-800 hover:border-amber-500/50 bg-black/60 rounded-2xl p-4 text-center cursor-pointer transition-colors space-y-2"
                                            >
                                                <Upload className="w-8 h-8 text-zinc-650 mx-auto" />
                                                <span className="text-[10px] block text-gray-500 font-bold uppercase">
                                                    Drag and drop or click to choose local image file
                                                </span>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef}
                                                    accept="image/*"
                                                    onChange={handleLocalImageSelect}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>

                                        {/* Direct image url */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Or Paste Photo Web URL</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-black border border-gray-800 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                                                value={prodImage}
                                                onChange={(e) => {
                                                    setProdImage(e.target.value);
                                                    setImagePreview(e.target.value);
                                                }}
                                            />
                                        </div>

                                        {/* Quick select presets */}
                                        <div className="space-y-2 bg-[#050505] p-3 rounded-xl border border-white/5">
                                            <label className="text-[9px] text-amber-500 font-black uppercase tracking-wider block mb-2">
                                                ⚡ Or pick from High-Quality Preset Covers:
                                            </label>
                                            <div className="grid grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1">
                                                {PRESET_IMAGES.map((img, i) => (
                                                    <div 
                                                        key={i}
                                                        onClick={() => {
                                                            setProdImage(img.url);
                                                            setImagePreview(img.url);
                                                            addToast(`Selected ${img.name.split(' ')[0]} Preset`, "info");
                                                        }}
                                                        className={`p-1.5 rounded-lg bg-black hover:bg-zinc-900 border cursor-pointer text-[9px] truncate transition-all text-gray-400 hover:text-white ${
                                                            prodImage === img.url ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-zinc-800/80'
                                                        }`}
                                                    >
                                                        {img.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Loaded Preview */}
                                        {imagePreview && (
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">PREVIEW OF LOADED FILE</span>
                                                <div className="h-28 bg-black rounded-xl border border-gray-800 overflow-hidden relative">
                                                    <img src={imagePreview} alt="Product Preview" className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Form Action Buttons */}
                                <div className="flex gap-4 border-t border-gray-800 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setIsProductModalOpen(false)}
                                        className="flex-1 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-bold py-3 text-xs uppercase rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-black py-3 text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                    >
                                        {editingProduct ? 'Save Changes' : 'Create Product'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL 2: LOG DAMAGED / WASTED / EXPIRED STOCK */}
            <AnimatePresence>
                {isDamageModalOpen && damageProduct && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="bg-zinc-950 border-2 border-red-500/30 p-8 rounded-[2.5rem] w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.15)]"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-5">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                            Log Expired / Damage Stock
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 uppercase mt-0.5">
                                            (Record damaged or expired inventory details)
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsDamageModalOpen(false)}
                                    className="p-1.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleDamageSubmit} className="space-y-5 text-left">
                                <div className="bg-black/80 p-3 rounded-lg border border-white/5 space-y-1">
                                    <span className="text-[9px] text-zinc-500 block uppercase">Product Chosen:</span>
                                    <h4 className="text-xs text-white font-extrabold uppercase">{damageProduct.name}</h4>
                                    <span className="text-[10px] text-green-400 block font-mono">
                                        Current Available stock: {damageProduct.stock} units
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                                        Quantity Wasted / Expired
                                    </label>
                                    <input 
                                        type="number" 
                                        min={1}
                                        max={damageProduct.stock}
                                        className="w-full bg-black border border-gray-800 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                                        value={damageQty}
                                        onChange={(e) => setDamageQty(Number(e.target.value))}
                                    />
                                    <p className="text-[9px] text-red-400/80 font-mono">
                                        * Subtracts from current active inventory.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Reason for Failure</label>
                                    <select 
                                        className="w-full bg-black border border-gray-800 focus:border-red-500 rounded-xl px-3 py-3 text-xs text-white outline-none font-mono"
                                        value={damageReason}
                                        onChange={(e) => setDamageReason(e.target.value)}
                                    >
                                        <option value="Expired">Expired / Out of Date</option>
                                        <option value="Damaged">Damaged / Broken packaging</option>
                                        <option value="Seal Broken">Seal Broken / Tampered</option>
                                        <option value="Leakage">Liquid Leakage / Defect</option>
                                        <option value="Lost">Lost / Inventory mismatch</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Verified Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-black border border-gray-800 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                                        value={damageDate}
                                        onChange={(e) => setDamageDate(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Additional details notes</label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Explain exactly what happened (e.g., seal checked by staff, container broken during delivery)..."
                                        className="w-full bg-black border border-gray-800 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                                        value={damageDetail}
                                        onChange={(e) => setDamageDetail(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3 pt-3 border-t border-gray-900">
                                    <button 
                                        type="button"
                                        onClick={() => setIsDamageModalOpen(false)}
                                        className="flex-1 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-bold py-3 text-xs uppercase rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                    >
                                        Log Damage
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL 3: INVENTORY RESTOCK / ADD STOCK */}
            <AnimatePresence>
                {isRestockModalOpen && restockProduct && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="bg-zinc-950 border-2 border-green-500/30 p-8 rounded-[2.5rem] w-full max-w-sm shadow-[0_0_50px_rgba(34,197,94,0.15)]"
                        >
                            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-5">
                                <div className="flex items-center gap-2">
                                    <PlusCircle className="w-5 h-5 text-green-400" />
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                            Manually Add Stock Inventory
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 uppercase mt-0.5">
                                            (Increase product stock level)
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsRestockModalOpen(false)}
                                    className="p-1.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleRestockSubmit} className="space-y-5 text-left">
                                <div className="bg-[#050505] p-3 rounded-lg border border-white/5 space-y-0.5">
                                    <span className="text-[8px] text-zinc-500 block uppercase">RESTOCKING TARGET</span>
                                    <h4 className="text-xs text-white font-extrabold uppercase line-clamp-1">{restockProduct.name}</h4>
                                    <p className="text-[9px] text-[#4ade80] font-mono">
                                        Current Quantity: {restockProduct.stock} pcs
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                                        Units to Add / restocked
                                    </label>
                                    <input 
                                        type="number" 
                                        min={1}
                                        className="w-full bg-black border border-gray-800 focus:border-green-500 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                                        value={restockQty}
                                        onChange={(e) => setRestockQty(Number(e.target.value))}
                                    />
                                    <p className="text-[9px] text-zinc-500 font-mono">
                                        * Increments both total stock tracking index and client available quantities.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-3 border-t border-gray-900">
                                    <button 
                                        type="button"
                                        onClick={() => setIsRestockModalOpen(false)}
                                        className="flex-1 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-bold py-3 text-xs uppercase rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-black font-black py-3 text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                                    >
                                        Add Stock
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Marketplace;
