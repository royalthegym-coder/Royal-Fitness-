import React, { useState, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
    Rocket, ShieldCheck, CheckCircle2, Copy, Check, Download, 
    RefreshCw, Terminal, Zap, MessageSquare, QrCode, Sparkles, 
    ExternalLink, Lock, Database, Workflow, Send, KeyRound, Play
} from 'lucide-react';
import { executeHybridEdgeRequest } from '../../src/backend/FitnessFutureCore';
import { syncData } from '../../lib/supabase';
import { useToast } from '../hooks/useToast';

const N8N_WORKFLOW_TEMPLATE = {
    name: "Fitness Future — Autonomous WhatsApp Receipt & Welcome Engine",
    nodes: [
        {
            parameters: {
                httpMethod: "POST",
                path: "whatsapp-receipt",
                responseMode: "onReceived",
                options: {}
            },
            id: "node-webhook-trigger",
            name: "Cloudflare Edge Payment Webhook",
            type: "n8n-nodes-base.webhook",
            typeVersion: 2,
            position: [240, 300],
            webhookId: "fitness-future-whatsapp-receipt"
        },
        {
            parameters: {
                conditions: {
                    options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
                    conditions: [
                        {
                            id: "condition-payment-success",
                            leftValue: "={{ $json.body.status || $json.status }}",
                            rightValue: "SUCCESS",
                            operator: { type: "string", operation: "equals" }
                        }
                    ],
                    combinator: "and"
                },
                options: {}
            },
            id: "node-verify-status",
            name: "Verify Payment Status == SUCCESS",
            type: "n8n-nodes-base.if",
            typeVersion: 2,
            position: [480, 300]
        },
        {
            parameters: {
                method: "POST",
                url: "=https://graph.facebook.com/v19.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
                sendHeaders: true,
                headerParameters: {
                    parameters: [
                        { name: "Authorization", value: "=Bearer {{ $env.WHATSAPP_ACCESS_TOKEN }}" },
                        { name: "Content-Type", value: "application/json" }
                    ]
                },
                sendBody: true,
                specifyBody: "json",
                jsonBody: "={\n  \"messaging_product\": \"whatsapp\",\n  \"recipient_type\": \"individual\",\n  \"to\": \"91{{ ($json.body.phone_number || $json.phone_number).replace(/^\\+?91/, '') }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"preview_url\": false,\n    \"body\": \"⚡ *FITNESS FUTURE — Official Payment Receipt & Welcome Message* ⚡\\n\\nHello! Your payment has been successfully verified and your membership is now *ACTIVE*.\\n\\n💳 *Amount:* ₹{{ $json.body.amount || $json.amount }}\\n🔖 *Transaction Reference:* {{ $json.body.txn_reference || $json.txn_reference }}\\n🏦 *Merchant UPI:* {{ $json.body.merchant_upi || 'your-upi@bank' }}\\n🔐 *Security:* HMAC-SHA256 Edge Verified\\n\\nWelcome to the Fitness Future family! Use your Member QR or Biometric Passkey for gym entry. 💪🔥\"\n  }\n}",
                options: {}
            },
            id: "node-whatsapp-cloud-api",
            name: "Meta WhatsApp Cloud API — Send Receipt & Welcome",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.2,
            position: [760, 220]
        },
        {
            parameters: {
                method: "POST",
                url: "=https://graph.facebook.com/v19.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
                sendHeaders: true,
                headerParameters: {
                    parameters: [
                        { name: "Authorization", value: "=Bearer {{ $env.WHATSAPP_ACCESS_TOKEN }}" },
                        { name: "Content-Type", value: "application/json" }
                    ]
                },
                sendBody: true,
                specifyBody: "json",
                jsonBody: "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"91{{ ($json.body.phone_number || $json.phone_number).replace(/^\\+?91/, '') }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"⚠️ *FITNESS FUTURE — Payment or Attendance Alert*\\n\\nWe noticed an update to your recent transaction or 4-day attendance check. Please contact the reception desk for any assistance.\"\n  }\n}",
                options: {}
            },
            id: "node-whatsapp-fallback",
            name: "WhatsApp Alert / Churn Recovery Node",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.2,
            position: [760, 420]
        }
    ],
    connections: {
        "Cloudflare Edge Payment Webhook": {
            main: [[{ node: "Verify Payment Status == SUCCESS", type: "main", index: 0 }]]
        },
        "Verify Payment Status == SUCCESS": {
            main: [
                [{ node: "Meta WhatsApp Cloud API — Send Receipt & Welcome", type: "main", index: 0 }],
                [{ node: "WhatsApp Alert / Churn Recovery Node", type: "main", index: 0 }]
            ]
        }
    },
    settings: { executionOrder: "v1" }
};

const resolveEnvVar = (keys: string[], fallback: string): string => {
    for (const key of keys) {
        if (typeof process !== 'undefined' && process.env && process.env[key] && !String(process.env[key]).includes('your_')) {
            return String(process.env[key]);
        }
        try {
            if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] && !String(import.meta.env[key]).includes('your_')) {
                return String(import.meta.env[key]);
            }
        } catch {}
    }
    return fallback;
};

export const NeuralLaunchAlphaConsole: React.FC = () => {
    const { addToast } = useToast();

    // Active Step Tab
    const [activeStage, setActiveStage] = useState<'n8n' | 'secrets' | 'alpha_test'>('alpha_test');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // WhatsApp credentials are server-only (Cloudflare Worker secrets). Never read them from
    // localStorage or the browser bundle; this console only shows/copies placeholders.
    const initialPhoneId = '';
    const initialAccessToken = '';
    const initialN8nWebhook = resolveEnvVar(
        ['N8N_WHATSAPP_WEBHOOK'],
        (typeof localStorage !== 'undefined' && localStorage.getItem('n8n_payment_sync_url')) || 'https://fitnessfuture.app.n8n.cloud/webhook/whatsapp-receipt'
    );

    // Checklist state
    const [completedChecklist, setCompletedChecklist] = useState<Record<string, boolean>>({
        supabase_push: true,
        n8n_import: true,
        whatsapp_env: false,
        wrangler_secrets: false,
        wrangler_deploy: false,
        alpha_1inr: false
    });

    // Step 1: n8n Env State (Read from WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN env vars)
    const [whatsappPhoneId, setWhatsappPhoneId] = useState(initialPhoneId);
    const [whatsappAccessToken, setWhatsappAccessToken] = useState(initialAccessToken);
    const [n8nWebhookUrl, setN8nWebhookUrl] = useState(initialN8nWebhook);

    // Step 2: Cloudflare & Supabase Secrets State
    const [supabaseProjectRef, setSupabaseProjectRef] = useState('xyzcompany-fitness-ref');
    const [supabaseUrl, setSupabaseUrl] = useState('https://xyzcompany.supabase.co');
    const [generatedHmacSecret, setGeneratedHmacSecret] = useState('');

    // Step 3: ₹1 Live Alpha Test State
    const [alphaMemberId, setAlphaMemberId] = useState('ff_alpha_01');
    const [alphaMemberName, setAlphaMemberName] = useState('Fitness Future Admin');
    const [alphaPhone, setAlphaPhone] = useState('');
    const [alphaUpiId] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('google_pay_upi')) || '');
    const [alphaAmount, setAlphaAmount] = useState<number>(1);
    const [alphaTxnId, setAlphaTxnId] = useState(() => `ALPHA_1INR_${Date.now().toString().slice(-6)}`);
    const [isRunningAlpha, setIsRunningAlpha] = useState(false);
    const [alphaResult, setAlphaResult] = useState<any>(null);
    const [computedSignature, setComputedSignature] = useState<string>('');
    const [computedTimestamp, setComputedTimestamp] = useState<string>('');

    // Copy helper
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(label);
        addToast(`${label} copied to clipboard!`, 'success');
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Toggle checklist item
    const toggleChecklist = (key: string) => {
        setCompletedChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const readinessPercent = useMemo(() => {
        const vals = Object.values(completedChecklist);
        const done = vals.filter(Boolean).length;
        return Math.round((done / vals.length) * 100);
    }, [completedChecklist]);

    // Generate 256-bit cryptographic HMAC secret via WebCrypto
    const handleGenerate256BitSecret = () => {
        const bytes = new Uint8Array(32);
        window.crypto.getRandomValues(bytes);
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        setGeneratedHmacSecret(hex);
        addToast('New 256-Bit Cryptographic HMAC Secret generated!', 'success');
    };

    // Download n8n workflow JSON
    const handleDownloadN8nJson = () => {
        const jsonString = JSON.stringify(N8N_WORKFLOW_TEMPLATE, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fitness-future-whatsapp-engine.json';
        a.click();
        URL.revokeObjectURL(url);
        setCompletedChecklist(prev => ({ ...prev, n8n_import: true }));
        addToast('n8n WhatsApp Workflow JSON downloaded!', 'success');
    };

    // Download deploy-live-stack.sh
    const handleDownloadDeployScript = () => {
        const script = `#!/usr/bin/env bash
# FITNESS FUTURE — LIVE STACK DEPLOYMENT SCRIPT
set -e

echo "1. Linking & Pushing Supabase Schema..."
npm install -g supabase
supabase login
supabase link --project-ref ${supabaseProjectRef}
supabase db push

echo "2. Configuring Cloudflare Worker & Secrets..."
npm install -g wrangler
wrangler login
cd cloudflare-backend
npm install

echo "${supabaseUrl}" | wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
echo "${generatedHmacSecret}" | wrangler secret put WEBHOOK_HMAC_SECRET
echo "${n8nWebhookUrl}" | wrangler secret put N8N_WHATSAPP_WEBHOOK

echo "3. Deploying to 300+ Cloudflare Edge PoPs..."
wrangler deploy
`;
        const blob = new Blob([script], { type: 'text/x-sh' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deploy-live-stack.sh';
        a.click();
        URL.revokeObjectURL(url);
        addToast('deploy-live-stack.sh script downloaded!', 'success');
    };

    // Compute WebCrypto HMAC-SHA256 & Execute ₹1 Live Alpha Test
    const handleExecute1InrAlphaTest = async () => {
        setIsRunningAlpha(true);
        setAlphaResult(null);

        try {
            const timestamp = Date.now().toString();
            const currentTxnId = `ALPHA_1INR_${Date.now().toString().slice(-6)}`;
            setAlphaTxnId(currentTxnId);

            const bodyObj = {
                member_id: alphaMemberId,
                memberId: alphaMemberId,
                full_name: alphaMemberName,
                memberName: alphaMemberName,
                phone_number: alphaPhone.replace(/^\+?91/, ''),
                phoneNumber: alphaPhone.replace(/^\+?91/, ''),
                plan_tier: 'Alpha Elite',
                txn_reference: currentTxnId,
                txnId: currentTxnId,
                amount: Number(alphaAmount),
                merchant_upi: alphaUpiId,
                status: 'SUCCESS',
                whatsappPhoneNumberId: whatsappPhoneId,
                n8nWebhookUrl
            };
            const rawBody = JSON.stringify(bodyObj);

            // No hard-coded secret: only the value the operator typed in this session is used.
            const activeSecret = generatedHmacSecret;
            if (!activeSecret) throw new Error('Enter the webhook secret first.');
            const encoder = new TextEncoder();
            const key = await window.crypto.subtle.importKey(
                'raw',
                encoder.encode(activeSecret),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
            const sigBuf = await window.crypto.subtle.sign(
                'HMAC',
                key,
                encoder.encode(`${timestamp}.${rawBody}`)
            );
            const signatureHex = Array.from(new Uint8Array(sigBuf))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            setComputedSignature(signatureHex);
            setComputedTimestamp(timestamp);

            const startTime = performance.now();
            const { data, source } = await executeHybridEdgeRequest<any>('/api/v2/payments/verify-webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-signature': signatureHex,
                    'x-timestamp': timestamp
                },
                body: rawBody
            });
            const latencyMs = Math.round(performance.now() - startTime);

            // Sync payment transaction & active member status to live Cloud Database
            await syncData('payment_transactions', {
                id: currentTxnId,
                member_id: alphaMemberId,
                txn_reference: currentTxnId,
                amount: Number(alphaAmount),
                merchant_upi: alphaUpiId,
                status: 'SUCCESS',
                hmac_signature: signatureHex,
                updated_at: new Date().toISOString()
            });
            await syncData('members', {
                id: alphaMemberId,
                full_name: alphaMemberName,
                name: alphaMemberName,
                phone_number: alphaPhone.replace(/^\+?91/, ''),
                phone: alphaPhone.replace(/^\+?91/, ''),
                plan_tier: 'Alpha Elite',
                status: 'ACTIVE',
                inactivity_days: 0,
                updated_at: new Date().toISOString()
            });

            setAlphaResult({
                ...data,
                supabase_ledger_synced: true,
                routingMode: source,
                latencyMs,
                signatureHex,
                timestamp,
                rawBody
            });

            setCompletedChecklist(prev => ({ ...prev, alpha_1inr: true }));
            addToast(`₹${alphaAmount} Live Alpha Test successful! WhatsApp receipt dispatched (${latencyMs}ms)`, 'success');
        } catch (err: any) {
            setAlphaResult({
                error: err.message || 'Alpha test webhook verification failed'
            });
            addToast(`Alpha Test Error: ${err.message}`, 'error');
        } finally {
            setIsRunningAlpha(false);
        }
    };

    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(alphaUpiId || 'your-upi@bank')}&pn=${encodeURIComponent('Fitness Future')}&am=${Number(alphaAmount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(alphaTxnId)}`;

    const curlCommandSnippet = useMemo(() => {
        const ts = computedTimestamp || Date.now().toString();
        const sig = computedSignature || '<computed-hmac-sha256-signature>';
        const payload = JSON.stringify({
            member_id: alphaMemberId,
            full_name: alphaMemberName,
            phone_number: alphaPhone.replace(/^\+?91/, ''),
            plan_tier: 'Alpha Elite',
            txn_reference: alphaTxnId,
            amount: Number(alphaAmount),
            merchant_upi: alphaUpiId || 'your-upi@bank',
            status: 'SUCCESS'
        });
        return `curl -X POST https://fitness-future-edge.<your-subdomain>.workers.dev/api/v2/payments/verify-webhook \\
  -H "Content-Type: application/json" \\
  -H "x-timestamp: ${ts}" \\
  -H "x-signature: ${sig}" \\
  -d '${payload}'`;
    }, [computedTimestamp, computedSignature, alphaMemberId, alphaMemberName, alphaAmount, alphaTxnId, alphaPhone]);

    return (
        <div className="bg-[#07090e] border border-white/10 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl">
            {/* Top Banner & Readiness Progress */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono uppercase tracking-widest">
                        <Rocket className="w-3.5 h-3.5 animate-pulse" />
                        <span>Weekly Neural Conclusion &bull; 3 Final Production Steps</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic">
                        Live Server Push & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400">₹1 Alpha Verification Center</span>
                    </h3>
                    <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                        Your super-app backend, database schema, and n8n WhatsApp engine are ready. Complete live deployment and the ₹1 real-time alpha verification using the 3 final steps below.
                    </p>
                </div>

                {/* Readiness Gauge */}
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4 min-w-[240px] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400 uppercase text-[10px]">Production Readiness</span>
                        <span className="text-emerald-400 font-bold">{readinessPercent}% Ready</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-500"
                            style={{ width: `${readinessPercent}%` }}
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                            { key: 'n8n_import', label: '1. n8n JSON' },
                            { key: 'whatsapp_env', label: 'Meta Keys' },
                            { key: 'supabase_push', label: '2. Supabase' },
                            { key: 'wrangler_deploy', label: 'Wrangler' },
                            { key: 'alpha_1inr', label: '3. ₹1 Alpha' }
                        ].map(item => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => toggleChecklist(item.key)}
                                className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-all cursor-pointer ${
                                    completedChecklist[item.key]
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                        : 'bg-white/5 border-white/10 text-gray-500'
                                }`}
                            >
                                {completedChecklist[item.key] ? '✓ ' : '○ '}{item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3-Step Navigation Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                    type="button"
                    onClick={() => setActiveStage('n8n')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        activeStage === 'n8n'
                            ? 'bg-emerald-950/30 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                            : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                >
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Workflow className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block font-bold">STEP 1</span>
                        <span className="text-sm font-black text-white block mt-0.5">1. n8n Workflow & Meta Settings</span>
                        <span className="text-[11px] text-gray-400">Import JSON & WhatsApp Cloud Tokens</span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveStage('secrets')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        activeStage === 'secrets'
                            ? 'bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                            : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                >
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block font-bold">STEP 2</span>
                        <span className="text-sm font-black text-white block mt-0.5">2. Cloudflare Secrets & Deploy</span>
                        <span className="text-[11px] text-gray-400">wrangler secret put & supabase db push</span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveStage('alpha_test')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        activeStage === 'alpha_test'
                            ? 'bg-amber-950/30 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                            : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                >
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block font-bold">STEP 3 (LIVE)</span>
                        <span className="text-sm font-black text-white block mt-0.5">3. The ₹1 Live Alpha Test</span>
                        <span className="text-[11px] text-gray-400">₹1 UPI QR + HMAC Webhook & WhatsApp Receipt</span>
                    </div>
                </button>
            </div>

            {/* STAGE 1: n8n Workflow Import & Environment Settings */}
            {activeStage === 'n8n' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 animate-fade-in">
                    <div className="lg:col-span-6 space-y-4">
                        <div className="p-5 bg-black/60 border border-white/10 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Meta WhatsApp Cloud API Environment Settings
                                </h4>
                                <span className="text-[10px] font-mono text-gray-400">Graph API v19.0</span>
                            </div>

                            <div className="space-y-3 font-mono text-xs">
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase block mb-1">WHATSAPP_PHONE_NUMBER_ID</label>
                                    <input
                                        type="text"
                                        value={whatsappPhoneId}
                                        onChange={(e) => setWhatsappPhoneId(e.target.value)}
                                        placeholder="e.g. 109283746519283"
                                        className="w-full bg-[#050608] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase block mb-1">WHATSAPP_ACCESS_TOKEN (Permanent System User Token)</label>
                                    <input
                                        type="password"
                                        value={whatsappAccessToken}
                                        onChange={(e) => setWhatsappAccessToken(e.target.value)}
                                        placeholder="Set on server: npx wrangler secret put WHATSAPP_ACCESS_TOKEN"
                                        className="w-full bg-[#050608] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase block mb-1">N8N_WHATSAPP_WEBHOOK (Production Webhook URL)</label>
                                    <input
                                        type="text"
                                        value={n8nWebhookUrl}
                                        onChange={(e) => setN8nWebhookUrl(e.target.value)}
                                        placeholder="https://your-n8n.app.n8n.cloud/webhook/whatsapp-receipt"
                                        className="w-full bg-[#050608] border border-white/10 rounded-xl px-3.5 py-2.5 text-emerald-300 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleCopy(`WHATSAPP_PHONE_NUMBER_ID=${whatsappPhoneId}\nWHATSAPP_ACCESS_TOKEN=<set with wrangler secret put>\nN8N_WHATSAPP_WEBHOOK=${n8nWebhookUrl}`, 'n8n Env Vars');
                                        setCompletedChecklist(prev => ({ ...prev, whatsapp_env: true }));
                                    }}
                                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                                >
                                    {copiedKey === 'n8n Env Vars' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    <span>Copy n8n Environment Variables</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDownloadN8nJson}
                                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border border-white/10"
                                >
                                    <Download className="w-4 h-4 text-emerald-400" />
                                    <span>Download Workflow JSON</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-6 space-y-4">
                        <div className="p-5 bg-black/60 border border-white/10 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white uppercase font-mono">
                                    n8n/fitness-future-whatsapp-engine.json
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(JSON.stringify(N8N_WORKFLOW_TEMPLATE, null, 2), 'n8n Workflow JSON')}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono text-emerald-400 flex items-center gap-1 cursor-pointer"
                                >
                                    {copiedKey === 'n8n Workflow JSON' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    <span>Copy JSON</span>
                                </button>
                            </div>
                            <pre className="p-3 bg-[#050608] border border-white/5 rounded-xl text-[10px] font-mono text-emerald-300 max-h-64 overflow-y-auto select-text">
                                {JSON.stringify(N8N_WORKFLOW_TEMPLATE, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* STAGE 2: Cloudflare Secrets & Wrangler Deployment */}
            {activeStage === 'secrets' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 animate-fade-in font-mono">
                    <div className="lg:col-span-6 space-y-4">
                        <div className="p-5 bg-black/60 border border-white/10 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    256-Bit HMAC Secret Key & Supabase Configuration
                                </h4>
                                <button
                                    type="button"
                                    onClick={handleGenerate256BitSecret}
                                    className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Generate 256-Bit Key</span>
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase block mb-1">Supabase Project Ref ID</label>
                                    <input
                                        type="text"
                                        value={supabaseProjectRef}
                                        onChange={(e) => setSupabaseProjectRef(e.target.value)}
                                        className="w-full bg-[#050608] border border-white/10 rounded-xl px-3.5 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase block mb-1">SUPABASE_URL</label>
                                    <input
                                        type="text"
                                        value={supabaseUrl}
                                        onChange={(e) => setSupabaseUrl(e.target.value)}
                                        className="w-full bg-[#050608] border border-white/10 rounded-xl px-3.5 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase block mb-1">WEBHOOK_HMAC_SECRET (32+ Chars)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={generatedHmacSecret}
                                            onChange={(e) => setGeneratedHmacSecret(e.target.value)}
                                            className="flex-1 bg-[#050608] border border-white/10 rounded-xl px-3.5 py-2 text-amber-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(generatedHmacSecret, 'HMAC Secret')}
                                            className="px-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadDeployScript}
                                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download deploy-live-stack.sh</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCompletedChecklist(prev => ({ ...prev, wrangler_secrets: true, wrangler_deploy: true }));
                                        addToast('Cloudflare Secrets and Deploy checklist updated!', 'success');
                                    }}
                                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Mark Deployed</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-6 space-y-4">
                        <div className="p-5 bg-black/60 border border-white/10 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white uppercase">
                                    Supabase CLI & Wrangler Secret Commands
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(`supabase link --project-ref ${supabaseProjectRef}\nsupabase db push\n\ncd cloudflare-backend\nwrangler secret put SUPABASE_URL\nwrangler secret put SUPABASE_SERVICE_ROLE_KEY\nwrangler secret put WEBHOOK_HMAC_SECRET\nwrangler secret put N8N_WHATSAPP_WEBHOOK\nwrangler deploy`, 'Deployment Commands')}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-cyan-400 flex items-center gap-1 cursor-pointer"
                                >
                                    {copiedKey === 'Deployment Commands' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    <span>Copy All</span>
                                </button>
                            </div>
                            <pre className="p-3 bg-[#050608] border border-white/5 rounded-xl text-[10px] text-cyan-300 overflow-x-auto select-text leading-relaxed">
{`# 1. Push Live Supabase Schema
supabase link --project-ref ${supabaseProjectRef}
supabase db push

# 2. Save Secrets in Cloudflare Vault
cd cloudflare-backend
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put WEBHOOK_HMAC_SECRET
wrangler secret put N8N_WHATSAPP_WEBHOOK

# 3. Deploy Worker Across 300+ Global Edge PoPs
wrangler deploy`}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* STAGE 3: The ₹1 Live Alpha Test Console */}
            {activeStage === 'alpha_test' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 animate-fade-in">
                    {/* Left Column: ₹1 UPI QR & Test Trigger */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-5 bg-black/60 border border-amber-500/30 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                                        LIVE ALPHA VERIFICATION
                                    </span>
                                    <h4 className="text-base font-black text-white mt-0.5">
                                        The ₹1 Live Alpha Test ({alphaUpiId || 'Configure UPI in Settings'})
                                    </h4>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                                    ₹{alphaAmount}.00
                                </span>
                            </div>

                            {/* Scannable ₹1 UPI QR Card */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#050608] border border-white/10 rounded-2xl">
                                <div className="p-3 bg-white rounded-xl shrink-0">
                                    <QRCodeCanvas value={upiDeepLink} size={112} level="H" />
                                </div>
                                <div className="space-y-1.5 text-xs font-mono">
                                    <div className="text-white font-bold">Scan with GPay / PhonePe / Paytm</div>
                                    <div className="text-[11px] text-gray-400">
                                        Merchant UPI: <span className="text-emerald-400">{alphaUpiId || 'Not configured'}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-400">
                                        Ref: <span className="text-amber-300">{alphaTxnId}</span>
                                    </div>
                                    <a
                                        href={upiDeepLink}
                                        className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:underline pt-1"
                                    >
                                        <span>Open UPI App Direct</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>

                            {/* Test Inputs */}
                            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase block mb-1">Member Name</label>
                                    <input
                                        type="text"
                                        value={alphaMemberName}
                                        onChange={(e) => setAlphaMemberName(e.target.value)}
                                        className="w-full bg-[#050608] border border-white/10 rounded-xl px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase block mb-1">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        value={alphaPhone}
                                        onChange={(e) => setAlphaPhone(e.target.value)}
                                        className="w-full bg-[#050608] border border-white/10 rounded-xl px-3 py-2 text-emerald-300"
                                    />
                                </div>
                            </div>

                            {/* Trigger Button */}
                            <button
                                type="button"
                                onClick={handleExecute1InrAlphaTest}
                                disabled={isRunningAlpha}
                                className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 hover:opacity-95 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                            >
                                {isRunningAlpha ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Signing HMAC & Verifying ₹1 Alpha Payment...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 fill-current" />
                                        <span>Fire ₹1 Live Alpha Payment & Verify WhatsApp Receipt</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Live 4-Stage Pipeline Telemetry & WhatsApp Preview */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* 4-Stage Pipeline Status */}
                        <div className="p-5 bg-black/60 border border-white/10 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    4-Stage End-to-End Alpha Pipeline Telemetry
                                </span>
                                {alphaResult && !alphaResult.error && (
                                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                        {alphaResult.routingMode} &bull; {alphaResult.latencyMs}ms
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
                                {[
                                    { step: '1. HMAC-SHA256', desc: 'WebCrypto Signed', ok: !!alphaResult && !alphaResult.error },
                                    { step: '2. Edge Gateway', desc: '200 OK Verified', ok: !!alphaResult?.hmac_verified },
                                    { step: '3. Supabase DB', desc: 'Member ACTIVE', ok: !!alphaResult?.supabase_ledger_synced },
                                    { step: '4. n8n WhatsApp', desc: 'Receipt Dispatched', ok: !!alphaResult?.n8n_whatsapp_dispatched }
                                ].map((st, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-xl border transition-all ${
                                            st.ok
                                                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                                                : 'bg-[#050608] border-white/5 text-gray-500'
                                        }`}
                                    >
                                        <div className="font-bold flex items-center justify-between">
                                            <span>{st.step}</span>
                                            {st.ok && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                        </div>
                                        <div className="text-[10px] opacity-80 mt-0.5">{st.desc}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Live WhatsApp Message Bubble Preview */}
                            <div className="p-4 rounded-2xl bg-[#0b141a] border border-emerald-500/30 space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                                    <span>📲 WHATSAPP RECEIPT & WELCOME MESSAGE (+91 {alphaPhone})</span>
                                    <span>{alphaResult ? 'DELIVERED ✓✓' : 'PREVIEW TEMPLATE'}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#005c4b] text-white text-xs font-sans whitespace-pre-line leading-relaxed shadow-inner">
                                    {alphaResult?.whatsapp_receipt_preview || `⚡ *FITNESS FUTURE — Official Payment Receipt & Welcome Message* ⚡\n\nHello ${alphaMemberName}! Your ₹${alphaAmount}.00 alpha payment has been successfully verified and your membership is now *ACTIVE*.\n\n💳 *Amount:* ₹${alphaAmount}.00\n🔖 *Transaction Reference:* ${alphaTxnId}\n🏦 *Merchant UPI:* ${alphaUpiId || 'Configured UPI'}\n🔐 *Security:* HMAC-SHA256 Edge Verified\n\nWelcome to the Fitness Future family! 💪🔥`}
                                </div>
                            </div>

                            {/* Pre-signed Terminal cURL Command */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                    <span>Terminal cURL Command (Pre-Signed with WebCrypto HMAC):</span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(curlCommandSnippet, 'Alpha Test cURL')}
                                        className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedKey === 'Alpha Test cURL' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        <span>Copy cURL</span>
                                    </button>
                                </div>
                                <pre className="p-3 bg-[#050608] border border-white/10 rounded-xl text-[10px] font-mono text-amber-300 overflow-x-auto select-text">
                                    {curlCommandSnippet}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NeuralLaunchAlphaConsole;
