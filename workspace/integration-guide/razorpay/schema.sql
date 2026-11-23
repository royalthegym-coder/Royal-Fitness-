-- ====================================================================
-- COHESIVE RAZORPAY SUBSCRIPTION SCHEMA (SUPABASE POSTGRES)
-- Designed for Multi-Tenant SaaS Subscriptions
-- ====================================================================

-- Enable UUID extension just in case it's not active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table indicating Subscriptions mapping to individual client tenants
CREATE TABLE IF NOT EXISTS razorpay_subscriptions (
    id TEXT PRIMARY KEY, -- maps to razorpay_subscription_id (e.g. sub_Dl78XyA91k)
    tenant_id UUID REFERENCES members(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed')),
    current_start TIMESTAMPTZ,
    current_end TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    quantity INTEGER DEFAULT 1,
    charge_at TIMESTAMPTZ,
    auth_attempts INTEGER DEFAULT 0,
    total_count INTEGER,
    paid_count INTEGER DEFAULT 0,
    upi_emandate_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking recurring bills/invoices pushed via webhook notifications
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id TEXT PRIMARY KEY, -- maps to razorpay_invoice_id (e.g. inv_Dl78R2A)
    subscription_id TEXT REFERENCES razorpay_subscriptions(id) ON DELETE SET NULL,
    tenant_id UUID,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('unpaid', 'paid', 'partially_paid', 'cancelled')),
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    pdf_receipt_url TEXT, -- populated dynamically by n8n or server workers
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index optimizations for high queries throughput
CREATE INDEX IF NOT EXISTS idx_rzp_sub_tenant ON razorpay_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sub_invoice_sub_id ON subscription_invoices(subscription_id);

-- Enable Row Level Security (RLS)
ALTER TABLE razorpay_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Dynamic Row Visibility Policies mapping to Supabase authenticated users
CREATE POLICY "Tenant Select Policy" 
    ON razorpay_subscriptions 
    FOR SELECT 
    USING (auth.uid() = tenant_id);

CREATE POLICY "Invoice Tenant Access Policy" 
    ON subscription_invoices 
    FOR SELECT 
    USING (auth.uid() = tenant_id);

-- Auto updated_at Trigger Strategy
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rzp_subscriptions_modtime
    BEFORE UPDATE ON razorpay_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sub_invoices_modtime
    BEFORE UPDATE ON subscription_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
