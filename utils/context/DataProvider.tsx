
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Member, Invoice, Package, Lead, Transaction, HealthData } from '../../types';
import { INITIAL_MEMBERS, INITIAL_INVOICES, INITIAL_PACKAGES, INITIAL_LEADS, INITIAL_TRANSACTIONS, INITIAL_HEALTH_DATA } from '../../constants';

// Device Interface
export interface ConnectedDevice {
    id: string;
    name: string;
    type: 'Watch' | 'Band' | 'Ring';
    platform: 'Apple Health' | 'Samsung Health' | 'Google Fit' | 'Proprietary';
    battery: number;
    status: 'Syncing' | 'Connected' | 'Disconnected';
    lastSync: string;
}

interface DataContextType {
    members: Member[];
    invoices: Invoice[];
    packages: Package[];
    leads: Lead[];
    transactions: Transaction[];
    
    // Wearable Integration
    connectedDevice: ConnectedDevice | null;
    setConnectedDevice: (device: ConnectedDevice | null) => void;
    liveHealthData: HealthData;
    updateLiveHealthData: (data: Partial<HealthData>) => void;

    // Actions
    addMember: (member: Member) => void;
    updateMember: (member: Member) => void;
    deleteMember: (id: number) => void;
    
    addInvoice: (invoice: Invoice) => void;
    updateInvoiceStatus: (id: number, status: 'Paid' | 'Pending' | 'Overdue') => void;
    
    addLead: (lead: Lead) => void;
    updateLead: (lead: Lead) => void;
    
    addTransaction: (transaction: Transaction) => void;
    
    // Derived Data
    activeMemberCount: number;
    totalRevenue: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- Initialize State from LocalStorage or Fallback to Constants ---
    const [members, setMembers] = useState<Member[]>(() => {
        try {
            const saved = localStorage.getItem('royal_members');
            return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
        } catch (e) {
            return INITIAL_MEMBERS;
        }
    });

    const [invoices, setInvoices] = useState<Invoice[]>(() => {
        try {
            const saved = localStorage.getItem('royal_invoices');
            return saved ? JSON.parse(saved) : INITIAL_INVOICES;
        } catch (e) {
            return INITIAL_INVOICES;
        }
    });

    const [packages, setPackages] = useState<Package[]>(() => {
        try {
            const saved = localStorage.getItem('royal_packages');
            return saved ? JSON.parse(saved) : INITIAL_PACKAGES;
        } catch (e) {
            return INITIAL_PACKAGES;
        }
    });

    const [leads, setLeads] = useState<Lead[]>(() => {
        try {
            const saved = localStorage.getItem('royal_leads');
            return saved ? JSON.parse(saved) : INITIAL_LEADS;
        } catch (e) {
            return INITIAL_LEADS;
        }
    });

    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        try {
            const saved = localStorage.getItem('royal_transactions');
            return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
        } catch (e) {
            return INITIAL_TRANSACTIONS;
        }
    });

    // --- Wearable State ---
    const [connectedDevice, setConnectedDevice] = useState<ConnectedDevice | null>(null);
    const [liveHealthData, setLiveHealthData] = useState<HealthData>(INITIAL_HEALTH_DATA);

    const updateLiveHealthData = (data: Partial<HealthData>) => {
        setLiveHealthData(prev => ({ ...prev, ...data }));
    };

    // --- Persistence Effects ---
    useEffect(() => {
        try {
            localStorage.setItem('royal_members', JSON.stringify(members));
        } catch (e) {
            console.warn("LocalStorage Quota Exceeded for Members. Attempting optimization...");
            const optimizedMembers = members.map(m => ({
                ...m,
                avatar: m.avatar && m.avatar.startsWith('data:') 
                    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random` 
                    : m.avatar
            }));
            try {
                localStorage.setItem('royal_members', JSON.stringify(optimizedMembers));
            } catch (retryError) {
                console.error("Critical: Failed to save members data even after optimization.", retryError);
            }
        }
    }, [members]);

    useEffect(() => {
        try {
            localStorage.setItem('royal_invoices', JSON.stringify(invoices));
        } catch (e) { console.error("Failed to save invoices", e); }
    }, [invoices]);

    useEffect(() => {
        try {
            localStorage.setItem('royal_packages', JSON.stringify(packages));
        } catch (e) { console.error("Failed to save packages", e); }
    }, [packages]);

    useEffect(() => {
        try {
            localStorage.setItem('royal_leads', JSON.stringify(leads));
        } catch (e) { console.error("Failed to save leads", e); }
    }, [leads]);

    useEffect(() => {
        try {
            localStorage.setItem('royal_transactions', JSON.stringify(transactions));
        } catch (e) { console.error("Failed to save transactions", e); }
    }, [transactions]);

    // --- Actions ---

    const addMember = (member: Member) => {
        setMembers(prev => [member, ...prev]);
    };

    const updateMember = (updatedMember: Member) => {
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    };

    const deleteMember = (id: number) => {
        setMembers(prev => prev.filter(m => m.id !== id));
    };

    const addInvoice = (invoice: Invoice) => {
        setInvoices(prev => [invoice, ...prev]);
    };

    const updateInvoiceStatus = (id: number, status: 'Paid' | 'Pending' | 'Overdue') => {
        setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    };

    const addLead = (lead: Lead) => {
        setLeads(prev => [lead, ...prev]);
    };

    const updateLead = (updatedLead: Lead) => {
        setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    };

    const addTransaction = (transaction: Transaction) => {
        setTransactions(prev => [transaction, ...prev]);
    };

    // --- Derived Data ---
    const activeMemberCount = members.filter(m => m.status === 'Active').length;
    
    const totalRevenue = invoices
        .filter(i => i.status === 'Paid')
        .reduce((sum, i) => sum + i.amount, 0);

    return (
        <DataContext.Provider value={{
            members, invoices, packages, leads, transactions,
            connectedDevice, setConnectedDevice, liveHealthData, updateLiveHealthData,
            addMember, updateMember, deleteMember,
            addInvoice, updateInvoiceStatus,
            addLead, updateLead,
            addTransaction,
            activeMemberCount, totalRevenue
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
