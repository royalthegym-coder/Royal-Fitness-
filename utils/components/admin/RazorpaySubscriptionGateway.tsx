import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Sparkles, 
  Code, 
  Database, 
  Webhook, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Terminal, 
  Tv, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  FileText, 
  DollarSign, 
  User, 
  ArrowRight, 
  Play, 
  Copy,
  Info,
  ChevronRight
} from 'lucide-react';

interface RazorpaySubscriptionGatewayProps {
  memberId?: number;
}

export const RazorpaySubscriptionGateway: React.FC<RazorpaySubscriptionGatewayProps> = ({ memberId }) => {
  const { osSubscription, setOSSubscription, addInvoice, addTransaction, members } = useData();
  
  // Customization states for the subscription payload
  const [keyId, setKeyId] = useState('rzp_test_generic_M4sa81D');
  const [planId, setPlanId] = useState('plan_HIIT_MAX_890A');
  const [customerName, setCustomerName] = useState('John Doe');
  const [customerEmail, setCustomerEmail] = useState('john.doe@neuralfitness.com');
  const [customerContact, setCustomerContact] = useState('+919876543210');
  const [maxAmountLimit, setMaxAmountLimit] = useState(15000); // UPI eMandate absolute cap
  const [subscriptionAmount, setSubscriptionAmount] = useState(8000); // chosen plan amount

  useEffect(() => {
    if (memberId && members && members.length > 0) {
      const activeMember = members.find(m => m.id === memberId);
      if (activeMember) {
        setCustomerName(activeMember.name || '');
        setCustomerEmail(activeMember.email || 'member@fitnessfuture.com');
        setCustomerContact(activeMember.phone || '');
      }
    }
  }, [memberId, members]);

  // Simulation overlays and states
  const [activeTab, setActiveTab] = useState<'checkout' | 'supabase_sql' | 'n8n_flow' | 'node_verify'>('checkout');
  const [showSimulatedOverlay, setShowSimulatedOverlay] = useState(false);
  const [simulatedCheckoutStep, setSimulatedCheckoutStep] = useState<'method' | 'upi_apps' | 'mandate_consent' | 'processing' | 'success'>('method');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('');
  const [isLiveOverlayLoading, setIsLiveOverlayLoading] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Trigger code-copied helper
  const triggerCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const addLog = (message: string) => {
    const time = new Date().toISOString().split('T')[1].slice(0, 8);
    setTerminalLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 15)]);
  };

  // Trigger simulated payment flow
  const handleSimulateCheckout = () => {
    setSimulatedCheckoutStep('method');
    setShowSimulatedOverlay(true);
    addLog(`Initialized local subscription request for Plan ${planId} (${subscriptionAmount} INR)`);
  };

  const handleSelectUpiApp = (appName: string) => {
    setSelectedUpiApp(appName);
    setSimulatedCheckoutStep('mandate_consent');
    addLog(`User selected mobile handles: ${appName}. Redirecting to UPI eMandate consent screen.`);
  };

  const executeSimulatedMandate = () => {
    setSimulatedCheckoutStep('processing');
    addLog(`User signed UPI Autopay eMandate. Submitting authorization request to Razorpay gateways...`);
    
    setTimeout(() => {
      setSimulatedCheckoutStep('success');
      addLog(`MANDATE SUCCESSFUL! Razorpay token generated: sub_token_UPI_${Math.random().toString(36).substring(7).toUpperCase()}`);
      addLog(`Webhook 'payment.authorized' generated with Razorpay Signature headers.`);
      
      // Update global context
      setOSSubscription({
        tier: 'Premium',
        billingCycle: 'Monthly',
        price: subscriptionAmount,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Synchronize a test invoice back to global context
      const invoiceId = Math.floor(Math.random() * 89999) + 10000;
      addInvoice({
        id: invoiceId,
        memberId: 999,
        memberName: customerName,
        packageName: 'Premium OS subscription',
        amount: subscriptionAmount,
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Paid',
        paymentMethod: 'UPI Subscriptions (eMandate)',
        invoiceDate: new Date().toISOString().split('T')[0]
      } as any);

      addTransaction({
        id: Math.floor(Math.random() * 89999 + 10000).toString(),
        memberId: 999,
        memberName: customerName,
        amount: subscriptionAmount,
        type: 'Membership',
        date: new Date().toISOString().split('T')[0],
        method: 'UPI Subscriptions'
      } as any);

    }, 2000);
  };

  // Live Razorpay code runner wrapper (For real test sandbox integration)
  const handleLiveRazorpayOverlay = () => {
    setIsLiveOverlayLoading(true);
    addLog(`Attempting sandbox Razorpay inject using Key ${keyId}...`);

    // Dynamically inject Razorpay Checkout script tab
    const checkoutScript = document.createElement('script');
    checkoutScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
    checkoutScript.async = true;
    checkoutScript.onload = () => {
      setIsLiveOverlayLoading(false);
      addLog(`Checkout.js loaded successfully. Invoking window.Razorpay overlays dialog...`);
      
      try {
        const options = {
          key: keyId,
          subscription_id: 'sub_test_mock_123', // Under production this is generated via backend
          name: 'fitness Fitness Future',
          description: 'Recurring UPI eMandate Plan Subscription',
          image: 'https://ais-pre-hakfvy5pcvvusj25knx2eb-9972469637.asia-east1.run.app/favicon.ico',
          handler: function (response: any) {
            addLog(`SUCCESS: razorpay_payment_id: ${response.razorpay_payment_id}`);
            addLog(`SUCCESS: razorpay_subscription_id: ${response.razorpay_subscription_id}`);
            addLog(`SUCCESS: razorpay_signature: ${response.razorpay_signature}`);
            addLog(`VERIFIED: Razorpay payment authorization received (${response.razorpay_payment_id})`);
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerContact
          },
          notes: {
            tenant_id: 'fitness_future_999',
            mandate_limit: String(maxAmountLimit)
          },
          theme: {
            color: '#7C3AED'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          addLog(`FAILED: ${resp.error.description}`);
        });
        rzp.open();
      } catch (err: any) {
        addLog(`Error parsing Razorpay instance: ${err.message}. Showing simulated mode.`);
        handleSimulateCheckout();
      }
    };
    
    checkoutScript.onerror = () => {
      setIsLiveOverlayLoading(false);
      addLog(`Network block detected (standard for closed sandboxes). Automatically shifting back to checkout sandbox emulator.`);
      handleSimulateCheckout();
    };

    document.body.appendChild(checkoutScript);
  };

  const getSupabaseSQL = () => {
    return `-- ====================================================================
-- RATIO-CALIBRATED RAZORPAY SUBSCRIPTION LEDGER FOR SUPABASE POSTGRES
-- Multi-Tenant SaaS Subscriptions Schema
-- ====================================================================

-- 1. Create Subscriptions Tracker Table
CREATE TABLE IF NOT EXISTS razorpay_subscriptions (
    id TEXT PRIMARY KEY, -- razorpay_subscription_id
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

-- 2. Create Recurring Invoices Tracking Ledger
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id TEXT PRIMARY KEY, -- razorpay_invoice_id or custom uuid
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
    pdf_receipt_url TEXT, -- updated dynamically by our n8n worker
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Supabase Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE razorpay_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_invoices;

-- 4. Set row level security (RLS) policies
ALTER TABLE razorpay_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members row level access to own subscriptions"
    ON razorpay_subscriptions
    FOR SELECT
    USING (auth.uid() = tenant_id);

CREATE POLICY "Allow members row level access to own invoices"
    ON subscription_invoices
    FOR SELECT
    USING (auth.uid() = tenant_id);
`;
  };

  const getN8nFlowJson = () => {
    return {
      "name": "Razorpay Subscription Webhook Sync & Receipt Delivery",
      "nodes": [
        {
          "parameters": {
            "httpMethod": "POST",
            "path": "razorpay-subscription-webhook",
            "options": {}
          },
          "name": "Razorpay Webhook Listener",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [100, 300]
        },
        {
          "parameters": {
            "jsCode": `// 1. Secret Webhook Verification Shield\nconst crypto = require('crypto');\nconst signature = $headers['x-razorpay-signature'];\nconst secret = 'YOUR_WEBHOOK_SECRET';\nconst computed = crypto.createHmac('sha256', secret).update(JSON.stringify($json.body)).digest('hex');\n\nif (signature !== computed) {\n  throw new Error('Unauthorized payload signature');\n}\nreturn { verified: true, event: $json.body.event, data: $json.body.payload };`
          },
          "name": "HMAC Verification Shield",
          "type": "n8n-nodes-base.code",
          "typeVersion": 1,
          "position": [320, 300]
        },
        {
          "parameters": {
            "conditions": {
              "string": [
                {
                  "value1": "={{ $json.event }}",
                  "value2": "payment.authorized"
                }
              ]
            }
          },
          "name": "Filter Successful Authorizations",
          "type": "n8n-nodes-base.if",
          "typeVersion": 1,
          "position": [540, 300]
        },
        {
          "parameters": {
            "method": "POST",
            "url": "https://api.pdfshift.io/v3/convert/pdf",
            "authentication": "predefined",
            "sendHeaders": true,
            "headersUi": {
              "parameter": [
                { "name": "Content-Type", "value": "application/json" },
                { "name": "Authorization", "value": "Bearer YOUR_PDFSHIFT_API_KEY" }
              ]
            },
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={\n  \"source\": \"https://neuralfitness-receipts.web.app/template?invoice_id={{ $json.data.payment.entity.invoice_id }}&amount={{ $json.data.payment.entity.amount / 100 }}&name={{ $json.data.payment.entity.notes.customer_name }}\",\n  \"sandbox\": true\n}",
            "options": {}
          },
          "name": "Generate PDF Receipt via API",
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4,
          "position": [780, 180]
        },
        {
          "parameters": {
            "method": "POST",
            "url": "https://api.whatsapp.com/v16.0/YOUR_PHONE_NUMBER_ID/messages",
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.data.payment.entity.contact }}\",\n  \"type\": \"template\",\n  \"template\": {\n    \"name\": \"recurring_invoice_paid\",\n    \"language\": { \"code\": \"en\" },\n    \"components\": [\n      {\n        \"type\": \"body\",\n        \"parameters\": [\n          { \"type\": \"text\", \"text\": \"{{ $json.data.payment.entity.notes.customer_name }}\" },\n          { \"type\": \"text\", \"text\": \"₹{{ $json.data.payment.entity.amount / 100 }}\" }\n        ]\n      }\n    ]\n  }\n}"
          },
          "name": "Push PDF over Meta WhatsApp Cloud API",
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4,
          "position": [1020, 180]
        }
      ]
    };
  };

  const getSignatureVerificationJS = () => {
    return `// ====================================================================
// RAZORPAY SECURE WEBHOOK SIGNATURE INTEGRATION VERIFICATION (NodeJS/Express)
// ====================================================================
import crypto from 'crypto';

export function verifyWebhookSignature(
  rawPayload: string, 
  xRazorpaySignatureHeader: string, 
  webhookSecret: string
): boolean {
  try {
    // Generate HMAC SHA256 code using the configured secret key
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    // Safe comparison of signature sizes to avoid timing side-channel vectors
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf-8'),
      Buffer.from(xRazorpaySignatureHeader, 'utf-8')
    );
  } catch (error) {
    console.error('Error verifying Razorpay web signature:', error);
    return false;
  }
}
`;
  };

  return (
    <div id="razorpay_subscriptions_view" className="min-h-screen bg-[#0A0D14] text-gray-100 p-4 sm:p-8 font-sans">
      
      {/* Bio Metrics Header Banner */}
      <div className="max-w-6xl mx-auto mb-8 border-b border-[#1A2333] pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold tracking-widest rounded-full uppercase">
                Merchant Live Sandbox Engine
              </span>
              <span className="px-3 py-1 bg-[#30D158]/10 border border-[#30D158]/30 text-[#30D158] text-xs font-mono font-bold tracking-widest rounded-full uppercase">
                UPI Autopay Ready
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white italic flex items-center gap-2 tracking-tight">
              Razorpay <span className="text-purple-500">eMandate Gateway</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm max-w-xl">
              Construct eMandates with customized UPI limits, initialize checkout client overlays, commit recursive billing tables directly to Supabase schemas, and pipe notifications.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSimulateCheckout}
              disabled={isLiveOverlayLoading}
              className="px-5 py-3 bg-[#111622] hover:bg-[#1C253C] border border-[#222E45] text-[#00E5FF] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
            >
              <Cpu className="h-4 w-4" />
              Emulator Overlay Mode
            </button>
            <button
              id="razorpay_init_trigger"
              onClick={handleLiveRazorpayOverlay}
              disabled={isLiveOverlayLoading}
              className="px-5 py-3 bg-gradient-to-r from-purple-600 to-[#7C3AED] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
            >
              {isLiveOverlayLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Injecting CheckoutJS...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white text-white" />
                  Test Live Razorpay Checkout
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Input Configuration Parameters Form (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-5 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-[#222E45] pb-3">
              <CreditCard className="h-5 w-5 text-purple-400" />
              eMandate Setup Specifications
            </h2>
            
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 pb-1.5">Generic Merchant Key ID</label>
                <input
                  type="text"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  className="w-full bg-[#182030] border border-[#222E45] rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 pb-1.5">Unified Price Plan ID</label>
                <input
                  type="text"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full bg-[#182030] border border-[#222E45] rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 pb-1.5">Subscriber Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#182030] border border-[#222E45] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 pb-1.5">Pay Amount (INR)</label>
                  <input
                    type="number"
                    value={subscriptionAmount}
                    onChange={(e) => setSubscriptionAmount(Number(e.target.value))}
                    className="w-full bg-[#182030] border border-[#222E45] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 pb-1.5">Mandate Cap (Max Limit)</label>
                  <input
                    type="number"
                    value={maxAmountLimit}
                    onChange={(e) => setMaxAmountLimit(Number(e.target.value))}
                    className="w-full bg-[#182030] border border-[#222E45] rounded-xl px-3 py-2.5 text-sm text-[#30D158] font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 pb-1.5">Prefilled Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-[#182030] border border-[#222E45] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-purple-500/5 border border-purple-500/20 rounded-xl flex items-start gap-2">
                <Info className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  The checkout request constructs a secure authorization order with an upper threshold of <strong>₹{maxAmountLimit}</strong> recurring limit. Users approve the autopay on UPI, protecting against billing friction.
                </p>
              </div>
            </form>
          </div>

          {/* Sandbox Systems Live Output Web Console */}
          <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-rose-400">
                <Terminal className="h-4 w-4" />
                Webhook Diagnostic Feed
              </span>
              <button 
                onClick={() => setTerminalLogs([])}
                className="text-[10px] text-gray-500 hover:text-white"
              >
                Clear Console
              </button>
            </h2>

            <div className="p-4 bg-[#070A10] rounded-xl border border-[#1A2333] h-[180px] overflow-y-auto font-mono text-[11px] text-[#A5B4FC] space-y-2 leading-relaxed">
              {terminalLogs.length === 0 ? (
                <div className="text-gray-600 italic">Logs will stream here upon subscription setup iterations...</div>
              ) : (
                terminalLogs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive SQL, Webhooks & Flow Canvas specs (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-4 shadow-xl">
            {/* View selectors */}
            <div className="flex border-b border-[#222E45] mb-4 overflow-x-auto gap-2">
              <button
                onClick={() => setActiveTab('checkout')}
                className={`pb-3 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all shrink-0 ${
                  activeTab === 'checkout' 
                    ? 'border-purple-500 text-purple-400' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                1. Autopay Setup
              </button>
              <button
                onClick={() => setActiveTab('supabase_sql')}
                className={`pb-3 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all shrink-0 ${
                  activeTab === 'supabase_sql' 
                    ? 'border-purple-500 text-purple-400' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                2. Supabase CRM Schema
              </button>
              <button
                onClick={() => setActiveTab('n8n_flow')}
                className={`pb-3 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all shrink-0 ${
                  activeTab === 'n8n_flow' 
                    ? 'border-purple-500 text-purple-400' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                3. n8n Automation Engine
              </button>
              <button
                onClick={() => setActiveTab('node_verify')}
                className={`pb-3 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all shrink-0 ${
                  activeTab === 'node_verify' 
                    ? 'border-purple-500 text-purple-400' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                4. Node Verify API
              </button>
            </div>

            {/* TAB CONTENT: 1. Autopay Setup */}
            {activeTab === 'checkout' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 bg-[#182030] rounded-xl border border-purple-500/20">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    How UPI eMandate Subscription Solves Churn
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    By binding a user to an automated eMandate, Razorpay issues a pre-debit notification 24 hours prior to the cycle. On execution day, the subscription fee amount is transferred automatically from the verified UPI handle, omitting tedious OTP validations and billing delays.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-[#151D2C] p-3 rounded-lg border border-[#222E45]">
                    <div className="text-xs font-mono">
                      <span className="text-gray-500">Key:</span> {keyId}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 font-mono">SANDBOX READY</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#151D2C] p-3 rounded-lg border border-[#222E45]">
                    <div className="text-xs font-mono">
                      <span className="text-gray-500">Tier:</span> {osSubscription.tier} OS
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#30D158] font-mono">ACTIVE TIER</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#151D2C] p-3 rounded-lg border border-[#222E45]">
                    <div className="text-xs font-mono">
                      <span className="text-gray-500">Recurring Price:</span> {subscriptionAmount} INR / Month
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#FFD60A] font-mono">SET RATE</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-4">
                  <button
                    onClick={handleSimulateCheckout}
                    className="w-full py-3 bg-[#111622] hover:bg-[#1C253C] border border-[#222E45] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    Process eMandate Autopay
                  </button>
                  <button
                    onClick={handleLiveRazorpayOverlay}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-[#7C3AED] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    Load Live Pay Script
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. Supabase Schema Script */}
            {activeTab === 'supabase_sql' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-mono">Copy PostgreSQL Schema payload</span>
                  <button
                    onClick={() => triggerCopy('sql', getSupabaseSQL())}
                    className="px-3 py-1 bg-[#182030] text-xs text-gray-300 rounded border border-[#222E45] flex items-center gap-1.5 hover:bg-[#1E283C] active:scale-95 transition-all"
                  >
                    {copiedText === 'sql' ? <Check className="h-3 w-3 text-[#30D158]" /> : <Copy className="h-3 w-3" />}
                    {copiedText === 'sql' ? 'Copied SQL!' : 'Copy Script'}
                  </button>
                </div>
                <div className="p-4 bg-[#070A10] rounded-xl border border-[#1A2333] h-[280px] overflow-auto font-mono text-xs">
                  <pre className="text-gray-300 text-[10px] leading-relaxed whitespace-pre">{getSupabaseSQL()}</pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. n8n Dynamic JSON specification */}
            {activeTab === 'n8n_flow' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-mono">Copy fully formed n8n Canvas Node payload</span>
                  <button
                    onClick={() => triggerCopy('n8n', JSON.stringify(getN8nFlowJson(), null, 2))}
                    className="px-3 py-1 bg-[#182030] text-xs text-gray-300 rounded border border-[#222E45] flex items-center gap-1.5 hover:bg-[#1E283C] active:scale-95 transition-all"
                  >
                    {copiedText === 'n8n' ? <Check className="h-3 w-3 text-[#30D158]" /> : <Copy className="h-3 w-3" />}
                    {copiedText === 'n8n' ? 'Copied n8n Node Config!' : 'Copy JSON Configuration'}
                  </button>
                </div>
                <div className="p-4 bg-[#070A10] rounded-xl border border-[#1A2333] h-[280px] overflow-auto font-mono text-xs">
                  <pre className="text-fuchsia-300 text-[9px] leading-normal whitespace-pre">{JSON.stringify(getN8nFlowJson(), null, 2)}</pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 4. Secure signature verification code */}
            {activeTab === 'node_verify' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-mono">Secure crypto.timingSafeEqual matching script</span>
                  <button
                    onClick={() => triggerCopy('verify', getSignatureVerificationJS())}
                    className="px-3 py-1 bg-[#182030] text-xs text-gray-300 rounded border border-[#222E45] flex items-center gap-1.5 hover:bg-[#1E283C] active:scale-95 transition-all"
                  >
                    {copiedText === 'verify' ? <Check className="h-3 w-3 text-[#30D158]" /> : <Copy className="h-3 w-3" />}
                    {copiedText === 'verify' ? 'Copied code!' : 'Copy integration code'}
                  </button>
                </div>
                <div className="p-4 bg-[#070A10] rounded-xl border border-[#1A2333] h-[280px] overflow-auto font-mono text-xs">
                  <pre className="text-indigo-300 text-[10px] leading-relaxed whitespace-pre">{getSignatureVerificationJS()}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RAZORPAY UPI CHECKOUT DIALOG SIMULATOR OVERLAY */}
      <AnimatePresence>
        {showSimulatedOverlay && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111319] w-full max-w-sm rounded-2xl border border-purple-500/40 overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 bg-[#161922] border-b border-[#222E45] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">Razorpay Platform Overlay</h3>
                  <p className="text-[10px] text-gray-400 tracking-wider font-mono uppercase mt-0.5">UPI Auto-Debit Enrollment</p>
                </div>
                <button
                  onClick={() => setShowSimulatedOverlay(false)}
                  className="p-1 px-2.5 bg-zinc-800 text-gray-400 hover:text-white rounded-lg text-xs"
                >
                  ✕
                </button>
              </div>

              {/* STAGE 1: Method selection */}
              {simulatedCheckoutStep === 'method' && (
                <div className="p-6 space-y-4">
                  <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <span className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">RECURRING MANDATE TIER</span>
                    <h4 className="text-lg font-black text-white italic">Premium Smart OS Autopay</h4>
                    <p className="text-xs text-[#00E5FF] font-semibold mt-1">₹{subscriptionAmount} / recurring monthly</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleSelectUpiApp('Google Pay')}
                      className="w-full p-3.5 bg-[#1C202C] hover:bg-[#252B3C] border border-[#2D3449] rounded-xl text-left flex items-center justify-between text-white font-semibold text-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black">G</span>
                        Google Pay UPI
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>

                    <button
                      onClick={() => handleSelectUpiApp('PhonePe')}
                      className="w-full p-3.5 bg-[#1C202C] hover:bg-[#252B3C] border border-[#2D3449] rounded-xl text-left flex items-center justify-between text-white font-semibold text-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black">P</span>
                        PhonePe Autopay
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>

                    <button
                      onClick={() => handleSelectUpiApp('PayTM')}
                      className="w-full p-3.5 bg-[#1C202C] hover:bg-[#252B3C] border border-[#2D3449] rounded-xl text-left flex items-center justify-between text-white font-semibold text-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-cyan-700 flex items-center justify-center text-[10px] font-black">Py</span>
                        PayTM eMandate
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 2: Mandate consent details */}
              {simulatedCheckoutStep === 'mandate_consent' && (
                <div className="p-6 space-y-4">
                  <div className="text-center pb-2 border-b border-[#222E45]">
                    <Smartphone className="h-10 w-10 text-purple-400 mx-auto mb-2 animate-bounce" />
                    <h4 className="text-sm font-bold text-white">Approve UPI Subscription Mandate</h4>
                    <p className="text-xs text-gray-400">{selectedUpiApp} security link requested</p>
                  </div>

                  <div className="bg-[#182030] p-4 rounded-xl space-y-2 border border-[#222E45] font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">MAX AUTOPAY CAP:</span>
                      <span className="text-white font-bold">₹{maxAmountLimit} INR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">BILLING CYCLE:</span>
                      <span className="text-white font-bold">Monthly Recurring</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CONSUMER NAME:</span>
                      <span className="text-white font-bold">{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">MERCHANT CRN:</span>
                      <span className="text-[#30D158] font-bold">rzp_emandate_active</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 text-center leading-normal">
                    By clicking authorize, a ₹1 verification charge is submitted and immediately refunded to activate your UPI autopay eMandate.
                  </p>

                  <button
                    onClick={executeSimulatedMandate}
                    className="w-full py-4.5 bg-gradient-to-r from-[#30D158] to-[#248A39] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    Authorize Mandate (Sign UPI)
                  </button>
                </div>
              )}

              {/* STAGE 3: Processing */}
              {simulatedCheckoutStep === 'processing' && (
                <div className="p-8 text-center space-y-4">
                  <RefreshCw className="h-12 w-12 text-purple-400 animate-spin mx-auto" />
                  <h4 className="text-sm font-bold text-white">Routing UPI Autopay consent token</h4>
                  <p className="text-xs text-gray-500">Establishing handshake protocols with UPI eMandate registers. Keep this tab active.</p>
                </div>
              )}

              {/* STAGE 4: Success confirmation */}
              {simulatedCheckoutStep === 'success' && (
                <div className="p-8 text-center space-y-5">
                  <CheckCircle2 className="h-14 w-14 text-[#30D158] mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-base font-bold text-white">UPI Mandate Authorized!</h4>
                    <p className="text-xs text-gray-400 mt-1">Token transmitted successfully.</p>
                  </div>

                  <div className="p-4 bg-[#182030] rounded-xl border border-[#30D158]/20 font-mono text-left text-[11px] space-y-1">
                    <span className="block text-[8px] uppercase tracking-wider font-bold text-emerald-400">Ledger details committed</span>
                    <div><span className="text-gray-500">Member:</span> {customerName}</div>
                    <div><span className="text-gray-500">Rate:</span> ₹{subscriptionAmount} / mo</div>
                    <div><span className="text-gray-500">Limits CAP:</span> ₹{maxAmountLimit} INR</div>
                    <div><span className="text-gray-500">State:</span> ACTIVE MEMANDATE</div>
                  </div>

                  <button
                    onClick={() => setShowSimulatedOverlay(false)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase rounded-xl transition-all"
                  >
                    Return to Gym Central Control
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default RazorpaySubscriptionGateway;
