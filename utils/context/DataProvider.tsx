
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Member, Invoice, Package, Lead, Transaction } from '../../types';
import { INITIAL_MEMBERS, INITIAL_INVOICES, INITIAL_PACKAGES, INITIAL_LEADS, INITIAL_TRANSACTIONS } from '../../constants';

interface DataContextType {
    members: Member[];
    invoices: Invoice[];
    packages: Package[];
    leads: Lead[];
    transactions: Transaction[];
    
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
        const saved = localStorage.getItem('royal_members');
        return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    });

    const [invoices, setInvoices] = useState<Invoice[]>(() => {
        const saved = localStorage.getItem('royal_invoices');
        return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    });

    const [packages, setPackages] = useState<Package[]>(() => {
        const saved = localStorage.getItem('royal_packages');
        return saved ? JSON.parse(saved) : INITIAL_PACKAGES;
    });

    const [leads, setLeads] = useState<Lead[]>(() => {
        const saved = localStorage.getItem('royal_leads');
        return saved ? JSON.parse(saved) : INITIAL_LEADS;
    });

    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        const saved = localStorage.getItem('royal_transactions');
        return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    });

    // --- Persistence Effects ---
    useEffect(() => localStorage.setItem('royal_members', JSON.stringify(members)), [members]);
    useEffect(() => localStorage.setItem('royal_invoices', JSON.stringify(invoices)), [invoices]);
    useEffect(() => localStorage.setItem('royal_packages', JSON.stringify(packages)), [packages]);
    useEffect(() => localStorage.setItem('royal_leads', JSON.stringify(leads)), [leads]);
    useEffect(() => localStorage.setItem('royal_transactions', JSON.stringify(transactions)), [transactions]);

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
    
    // Calculate total revenue from PAID invoices + Cash Transactions
    const totalRevenue = invoices
        .filter(i => i.status === 'Paid')
        .reduce((sum, i) => sum + i.amount, 0);

    return (
        <DataContext.Provider value={{
            members, invoices, packages, leads, transactions,
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
