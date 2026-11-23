import { createStore } from 'zustand/vanilla';
import { useSyncExternalStore, useCallback } from 'react';

interface CurrencyStore {
    currencyCode: string;
    currencySymbol: string;
    locale: string;
    initCurrency: () => Promise<void>;
    formatCurrency: (amount: number) => string;
}

const getSymbol = (locale: string, currency: string) => {
    return (0).toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/[\d,.]/g, '').trim();
};

export const currencyStore = createStore<CurrencyStore>((set, get) => ({
    currencyCode: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    initCurrency: async () => {
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const data = await response.json();
                if (data.currency) {
                    const symbol = getSymbol(navigator.language || 'en-IN', data.currency);
                    set({ 
                        currencyCode: data.currency, 
                        currencySymbol: symbol || data.currency, 
                        locale: navigator.language || 'en-IN' 
                    });
                    return;
                }
            }
        } catch (error) {
            console.warn('Currency auto-detection failed, using default (INR).', error);
        }
        
        try {
            const locale = navigator.language;
            const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).resolvedOptions().currency || 'INR';
            set({ locale, currencyCode: currency, currencySymbol: getSymbol(locale, currency) });
        } catch (e) {}
    },
    formatCurrency: (amount: number) => {
        const { locale, currencyCode, currencySymbol } = get();
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (e) {
            return currencySymbol + amount.toLocaleString();
        }
    }
}));

export const useCurrencyStore = Object.assign(
    function useCurrencyStoreHook<U = CurrencyStore>(selector?: (state: CurrencyStore) => U): U {
        const sel = selector || ((s: CurrencyStore) => s as unknown as U);
        return useSyncExternalStore(
            currencyStore.subscribe,
            useCallback(() => sel(currencyStore.getState()), [sel]),
            useCallback(() => sel(currencyStore.getInitialState()), [sel])
        );
    },
    currencyStore
);

export const formatCurrency = (amount: number) => currencyStore.getState().formatCurrency(amount);
export const getCurrencySymbol = () => currencyStore.getState().currencySymbol;
