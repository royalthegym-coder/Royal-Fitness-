import React, { useState } from 'react';
import Card from './common/Card';
import { 
    Brain, MessageSquare, Camera, CreditCard, 
    Globe, Database, Zap, Cpu, Activity, 
    ShieldCheck, Network, Sparkles, Layers,
    Bot, Fingerprint, RefreshCw, Eye, Clock, Smartphone, Star, Unlock
} from 'lucide-react';

const NeuralArchitecture: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'stack' | 'god-tier' | 'roadmap' | 'comparison'>('stack');

    const godTierTools = [
        {
            id: 'orion',
            name: 'Orion Nexus (The Multi-Agent Orchestrator)',
            tech: 'n8n (Self-Hosted) + Llama-3 (Local)',
            desc: 'यह अकेला बोट नहीं है, बल्कि "बोट्स की सेना" को मैनेज करता है। 100% मुफ़्त (Cost-Free) और पूरी तरह से ऑटोमेटेड। अगर कोई मेंबर फीस जमा करता है, तो Orion तुरंत "Financial Bot" को रसीद काटने, "WhatsApp Bot" को मैसेज भेजने और "Diet Bot" को अपडेट करने का आदेश देता है। बिना किसी API कॉस्ट के।',
            icon: <Network className="w-6 h-6 text-purple-400" />,
            color: 'from-purple-500/20 to-fuchsia-500/20',
            border: 'border-purple-500/30'
        },
        {
            id: 'titan',
            name: 'Titan Vision Pro v5.0 (The Pose Correction Engine)',
            tech: 'Google MediaPipe + TensorFlow.js (Free Edge AI)',
            desc: 'यूजर मोबाइल कैमरा के सामने एक्सरसाइज करेगा और यह टूल रीयल-टाइम में उसकी हड्डियों और जोड़ों (Skeletal tracking) को ट्रैक करके 99.9% सटीकता के साथ बताएगा कि उसकी पोजीशन सही है या नहीं। यह पूरी तरह से डिवाइस पर चलता है (On-Device), इसलिए इसका कोई सर्वर कॉस्ट नहीं है।',
            icon: <Eye className="w-6 h-6 text-cyan-400" />,
            color: 'from-cyan-500/20 to-blue-500/20',
            border: 'border-cyan-500/30'
        },
        {
            id: 'gastronoma',
            name: 'Gastronoma Scientific AI (The Advanced Kitchen Chief)',
            tech: 'Mistral 8x7B (Open Source) + OpenFoodFacts DB',
            desc: 'यह केवल डाइट चार्ट नहीं बनाता, बल्कि यूजर के Blood Biomarkers और जिम के Smart Scale डेटा को पढ़कर हर दिन की कैलोरी बदलता है। महंगे APIs (जैसे Edamam) की जगह यह 100% मुफ़्त OpenFoodFacts डेटाबेस और ओपन-सोर्स AI का उपयोग करता है।',
            icon: <Activity className="w-6 h-6 text-green-400" />,
            color: 'from-green-500/20 to-emerald-500/20',
            border: 'border-green-500/30'
        },
        {
            id: 'aegis',
            name: 'Aegis Flow (The WhatsApp & Business Automation)',
            tech: 'whatsapp-web.js (Free) + n8n Community',
            desc: 'महंगे Twilio या Wati सब्सक्रिप्शन की कोई जरूरत नहीं। यह आपके मौजूदा WhatsApp नंबर को ही एक स्मार्ट बोट में बदल देता है। कोई भी इंक्वायरी आने पर यह खुद वर्चुअल टूर दिखाएगा और एडमिशन फॉर्म भरवा लेगा, 100% ऑटोमेटेड और मुफ़्त।',
            icon: <MessageSquare className="w-6 h-6 text-pink-400" />,
            color: 'from-pink-500/20 to-rose-500/20',
            border: 'border-pink-500/30'
        },
        {
            id: 'chronos',
            name: 'Chronos Mirror v11.5 (Predictive Retention Bot)',
            tech: 'Scikit-Learn + Local Heuristics',
            desc: 'यह बोट प्रेडिक्ट करता है कि कौन सा मेंबर अगले 10 दिनों में जिम छोड़ सकता है (Attendance और Behavior के आधार पर)। यह बिना किसी क्लाउड कॉस्ट के लोकल मशीन लर्निंग का उपयोग करके उन्हें वापस लाने के लिए ऑटोमैटिक "Motivational Offers" भेजता है।',
            icon: <Clock className="w-6 h-6 text-amber-400" />,
            color: 'from-amber-500/20 to-orange-500/20',
            border: 'border-amber-500/30'
        },
        {
            id: 'nano',
            name: 'Gemma 2 / Llama-3 Nano (On-Device Edge AI)',
            tech: 'WebLLM / ONNX Runtime',
            desc: 'यह लेटेस्ट ओपन-सोर्स मॉडल ऐप के अंदर बिना इंटरनेट के भी काम कर सकता है। वर्कआउट के दौरान अगर इंटरनेट चला जाए, तो भी मेंबर का डेटा ट्रैक होता रहेगा और उसे गाइडेंस मिलती रहेगी। जीरो API कॉस्ट।',
            icon: <Smartphone className="w-6 h-6 text-indigo-400" />,
            color: 'from-indigo-500/20 to-blue-500/20',
            border: 'border-indigo-500/30'
        },
        {
            id: 'frontier',
            name: 'The Core Intelligence (Groq + Llama-3 70B)',
            tech: 'Groq LPU (Free Tier) / HuggingFace',
            desc: 'यह आपके "God Tier" का असली दिमाग होगा। महंगे GPT-4 की जगह यह दुनिया के सबसे तेज़ और मुफ़्त ओपन-सोर्स मॉडल्स का उपयोग करता है, जो मेंबर के साथ "इमोशनल इंटेलिजेंस" के साथ बात करेगा।',
            icon: <Brain className="w-6 h-6 text-rose-400" />,
            color: 'from-rose-500/20 to-red-500/20',
            border: 'border-rose-500/30'
        }
    ];

    const techStack = [
        {
            id: 'core',
            title: 'Core Management & AI Architecture (The Brain)',
            description: 'आपके "Neural OS" को चलाने के लिए 100% मुफ़्त और ओपन-सोर्स इंजन:',
            icon: <Brain className="w-8 h-8 text-purple-400" />,
            color: 'from-purple-500/20 to-fuchsia-500/20',
            border: 'border-purple-500/30',
            tools: [
                { name: 'Llama-3 / Mistral (via Groq/HF)', desc: 'वैज्ञानिक डाइट प्लान और वर्कआउट शेड्यूलिंग के लिए। GPT-4 के बराबर लेकिन 100% मुफ़्त।', icon: <Sparkles className="w-5 h-5 text-purple-400" /> },
                { name: 'n8n (Self-Hosted Community Edition)', desc: 'पूरे जिम मैनेजमेंट को बैकएंड में "ऑटो-पायलट" पर डाल देगा। कोई मासिक शुल्क नहीं।', icon: <Network className="w-5 h-5 text-purple-400" /> },
                { name: 'ChromaDB / FAISS (Local Vector DB)', desc: 'ऐप को "याददाश्त" देगा। हर मेंबर की प्रोग्रेस याद रखकर पर्सनलाइज्ड सजेशन, बिना Pinecone के बिल के।', icon: <Database className="w-5 h-5 text-purple-400" /> }
            ]
        },
        {
            id: 'whatsapp',
            title: 'WhatsApp Business & Comm Automation',
            description: 'Intelligent Conversational AI जो इंसानों की तरह बात करे (Zero Cost):',
            icon: <MessageSquare className="w-8 h-8 text-green-400" />,
            color: 'from-green-500/20 to-emerald-500/20',
            border: 'border-green-500/30',
            tools: [
                { name: 'whatsapp-web.js / Baileys', desc: 'बिना WhatsApp API फीस दिए अपने नंबर को स्मार्ट बोट बनाएं।', icon: <MessageSquare className="w-5 h-5 text-green-400" /> },
                { name: 'Flowise AI (Open Source)', desc: 'विजुअल चैटबॉट बिल्डर जो एडमिशन फॉर्म को बातचीत के जरिए भरवाएगा।', icon: <Bot className="w-5 h-5 text-green-400" /> },
                { name: 'Local Whisper (Speech-to-Text)', desc: 'मेंबर्स के वॉइस नोट्स को मुफ़्त में टेक्स्ट में बदलकर समझने के लिए।', icon: <RefreshCw className="w-5 h-5 text-green-400" /> }
            ]
        },
        {
            id: 'vision',
            title: 'AI Fitness & Exercise Vision (God Tier)',
            description: 'एक्सरसाइज पोजीशन और वर्चुअल गाइडेंस के लिए 100% मुफ़्त टूल्स:',
            icon: <Camera className="w-8 h-8 text-cyan-400" />,
            color: 'from-cyan-500/20 to-blue-500/20',
            border: 'border-cyan-500/30',
            tools: [
                { name: 'Google MediaPipe / TensorFlow.js', desc: 'रीयल-टाइम "Pose Estimation"। एआई बताएगा कि पोजीशन सही है या नहीं (On-Device, Free)।', icon: <Activity className="w-5 h-5 text-cyan-400" /> },
                { name: 'SadTalker / Wav2Lip (Open Source)', desc: 'महंगे Synthesia की जगह ओपन-सोर्स AI अवतार जो खुद-ब-खुद इंस्ट्रक्शनल वीडियो बनाएंगे।', icon: <Fingerprint className="w-5 h-5 text-cyan-400" /> },
                { name: 'YouTube Data API (Free Tier)', desc: 'ऑटो-अपलोड और कंटेंट सिंकिंग ताकि ऐप हमेशा लेटेस्ट ट्रेंड्स से अपडेट रहे।', icon: <Layers className="w-5 h-5 text-cyan-400" /> }
            ]
        },
        {
            id: 'finance',
            title: 'Payment & Finance Automation',
            description: 'कैश और UPI को एक ही डैशबोर्ड पर सिंक करने के लिए (Zero Gateway Fees):',
            icon: <CreditCard className="w-8 h-8 text-amber-400" />,
            color: 'from-amber-500/20 to-orange-500/20',
            border: 'border-amber-500/30',
            tools: [
                { name: 'Direct UPI Intent / Dynamic QR', desc: 'बिना किसी पेमेंट गेटवे फीस (0% MDR) के सीधे बैंक खाते में पेमेंट।', icon: <CreditCard className="w-5 h-5 text-amber-400" /> },
                { name: 'Auto-Reconciliation Bot (Local)', desc: 'बैंक के SMS या ईमेल को पढ़कर खुद-ब-खुद फीस को "Paid" मार्क कर देगा।', icon: <ShieldCheck className="w-5 h-5 text-amber-400" /> }
            ]
        },
        {
            id: 'marketing',
            title: 'Marketing & Smart Diet Algorithm',
            description: 'स्थानीय SEO और "Scientific" डाइट प्लान के लिए Free APIs:',
            icon: <Globe className="w-8 h-8 text-pink-400" />,
            color: 'from-pink-500/20 to-rose-500/20',
            border: 'border-pink-500/30',
            tools: [
                { name: 'OpenStreetMap / Nominatim', desc: 'मुफ़्त जिओ-टार्गेटिंग और लोकेशन सेवाओं के लिए।', icon: <Globe className="w-5 h-5 text-pink-400" /> },
                { name: 'GMB API (Free Tier)', desc: 'रिव्यूज का एआई के जरिए जवाब देना और ऑटोमैटिक पोस्टिंग।', icon: <Zap className="w-5 h-5 text-pink-400" /> },
                { name: 'OpenFoodFacts API', desc: 'हर मील की कैलोरी और माइक्रोन्यूट्रिएंट्स को सटीक मापने के लिए 100% मुफ़्त डेटाबेस।', icon: <Activity className="w-5 h-5 text-pink-400" /> },
                { name: 'USDA FoodData Central', desc: 'प्रोफेशनल बॉडीबिल्डिंग डाइट डेटाबेस के लिए मुफ़्त सरकारी API।', icon: <Database className="w-5 h-5 text-pink-400" /> }
            ]
        }
    ];

    const comparisonTable = [
        { feature: 'Diet AI', tool: 'Llama-3 + OpenFoodFacts', desc: 'वैज्ञानिक और रिसर्च-बेस्ड प्लान (100% Free)' },
        { feature: 'Pose Detection', tool: 'MediaPipe (On-Device)', desc: 'रीयल-टाइम एक्सरसाइज पोजीशन चेक (Zero Server Cost)' },
        { feature: 'Automation', tool: 'n8n (Self-Hosted)', desc: 'बिना कोडिंग के पूरा जिम मैनेजमेंट (No Monthly Fees)' },
        { feature: 'Payment', tool: 'Dynamic UPI QR', desc: 'वन-क्लिक पेमेंट (0% Transaction Fee)' },
        { feature: 'Content', tool: 'Stable Diffusion / Flux', desc: 'अल्ट्रा-रियलिस्टिक एक्सरसाइज विजुअल्स (Open Source)' }
    ];

    const summaryTable = [
        { section: 'Brain', tool: 'Llama-3 + ChromaDB', role: 'याददाश्त (Memory) और बुद्धिमत्ता (Cost-Free)' },
        { section: 'Vision', tool: 'Google MediaPipe', role: 'एक्सरसाइज की सटीक पोजीशन चेक करना (Local)' },
        { section: 'Automation', tool: 'n8n / Flowise', role: 'फीस, रिमाइंडर और एडमिशन का ऑटोमेशन (Self-Hosted)' },
        { section: 'Diet AI', tool: 'USDA DB + Mistral AI', role: 'साइंटिफिक और मेडिकल-ग्रेड डाइट (Open Source)' },
        { section: 'Media', tool: 'Local Whisper + SadTalker', role: 'ऑटो-अपलोड और कंटेंट डिस्ट्रीब्यूशन (Free)' }
    ];

    const masterArchitecture = [
        { layer: 'User Interface', tool: 'React / Tailwind', work: 'आधुनिक और स्मूथ डिजाइन के लिए।' },
        { layer: 'Logic Layer', tool: 'n8n (Community)', work: 'एडमिशन, फीस और ऑटो-रिमाइंडर के लिए 100% मुफ़्त।' },
        { layer: 'Intelligence', tool: 'Llama-3 / Groq', work: 'डाइट और वर्कआउट रिसर्च के लिए बिना API कॉस्ट के।' },
        { layer: 'Vision Layer', tool: 'MediaPipe', work: 'एक्सरसाइज पोजीशन की सटीक जानकारी (On-Device)।' },
        { layer: 'Communication', tool: 'whatsapp-web.js', work: 'व्हाट्सएप और एसएमएस ऑटोमेशन बिना Twilio फीस के।' }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 flex items-center gap-3">
                        <Unlock className="w-8 h-8 text-indigo-400" />
                        100% Free & Open-Source Neural OS
                    </h1>
                    <p className="text-gray-400 mt-2">
                        दुनिया के सबसे आधुनिक, पूरी तरह से ऑटोमेटेड और <span className="text-green-400 font-bold">Cost-Free (मुफ़्त)</span> AI स्टैक
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-800 mb-6">
                <button
                    onClick={() => setActiveTab('stack')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'stack' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Cost-Free Tech Stack
                </button>
                <button
                    onClick={() => setActiveTab('god-tier')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'god-tier' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    7 Open-Source Bots
                </button>
                <button
                    onClick={() => setActiveTab('roadmap')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'roadmap' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Automation Roadmap
                </button>
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'comparison' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Free vs Paid Comparison
                </button>
            </div>

            {/* Content */}
            {activeTab === 'stack' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {techStack.map((section) => (
                        <Card key={section.id} className={`bg-gradient-to-br ${section.color} border ${section.border} backdrop-blur-sm`}>
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                                    {section.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{section.title}</h3>
                                    <p className="text-sm text-gray-300 mt-1">{section.description}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {section.tools.map((tool, idx) => (
                                    <div key={idx} className="flex gap-3 p-3 bg-gray-900/40 rounded-lg border border-gray-700/30 hover:bg-gray-900/60 transition-colors">
                                        <div className="mt-1">{tool.icon}</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-100">{tool.name}</h4>
                                            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{tool.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {activeTab === 'god-tier' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {godTierTools.map((tool) => (
                            <Card key={tool.id} className={`bg-gradient-to-br ${tool.color} border ${tool.border} backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300`}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                                        {tool.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-tight">{tool.name}</h3>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-900/60 rounded text-xs font-medium text-green-400 border border-green-500/30">
                                            {tool.tech}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {tool.desc}
                                </p>
                            </Card>
                        ))}
                    </div>

                    <Card className="bg-gray-900/50 border-gray-800 mt-8">
                        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                            <Star className="w-6 h-6 text-amber-400" />
                            <h3 className="text-xl font-bold text-white">Open-Source Stack Summary</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-900/30">
                                        <th className="py-4 px-6 text-gray-400 font-medium">सेक्शन (Section)</th>
                                        <th className="py-4 px-6 text-gray-400 font-medium">मुफ़्त ओपन-सोर्स टूल (Free Tool)</th>
                                        <th className="py-4 px-6 text-gray-400 font-medium">मुख्य भूमिका (Main Role)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryTable.map((row, idx) => (
                                        <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-purple-400">{row.section}</td>
                                            <td className="py-4 px-6 text-gray-200">
                                                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm border border-gray-700">
                                                    {row.tool}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-400">{row.role}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-green-500/10 border-t border-green-500/20 text-sm text-green-200 flex items-start gap-3">
                            <Unlock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <p>
                                <strong>प्रो टिप:</strong> "दुनिया की सबसे बेहतरीन ऐप" बनाने के लिए आपको महंगे APIs की जरूरत नहीं है। Llama-3, n8n, और MediaPipe जैसे ओपन-सोर्स टूल्स का उपयोग करके आप 100% मुफ़्त और पूरी तरह से ऑटोमेटेड सिस्टम बना सकते हैं जो आपके डेटा को प्राइवेट भी रखता है।
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'roadmap' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Network className="w-6 h-6 text-indigo-400" />
                                <h3 className="text-xl font-bold text-white">1. n8n (Self-Hosted): 100% Free Automation</h3>
                            </div>
                            <p className="text-sm text-gray-300 mb-4">
                                n8n का कम्युनिटी एडिशन पूरी तरह मुफ़्त है। यह आपके जिम के सभी काम (WhatsApp, Google Sheets, AI) को बिना किसी मासिक शुल्क के ऑटोमेट करता है।
                            </p>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-indigo-300 text-sm">Trigger (Webhook)</h4>
                                    <p className="text-xs text-gray-400 mt-1">जैसे ही कोई मेंबर एडमिशन फॉर्म सबमिट करता है।</p>
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-purple-300 text-sm">AI Node (Llama-3 Local)</h4>
                                    <p className="text-xs text-gray-400 mt-1">मेंबर के डेटा को एनालाइज करके Scientific Diet जनरेट करना (Zero API Cost)।</p>
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-green-300 text-sm">WhatsApp Node (whatsapp-web.js)</h4>
                                    <p className="text-xs text-gray-400 mt-1">मेंबर को मुफ़्त में स्वागत संदेश और डाइट प्लान भेजना।</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Eye className="w-6 h-6 text-cyan-400" />
                                <h3 className="text-xl font-bold text-white">2. MediaPipe: 'God Tier' Free Vision</h3>
                            </div>
                            <p className="text-sm text-gray-300 mb-4">
                                यह आपके ऐप का सबसे शानदार फीचर है। यह पूरी तरह से यूजर के फोन पर चलता है, इसलिए इसका कोई सर्वर या API कॉस्ट नहीं है।
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-cyan-300 text-sm mb-2">तकनीकी आर्किटेक्चर:</h4>
                                    <ul className="space-y-2 text-sm text-gray-400 list-disc pl-5">
                                        <li><strong>On-Device Processing:</strong> MediaPipe फोटो/वीडियो को सर्वर पर नहीं भेजता। यह 100% मुफ़्त और प्राइवेट है।</li>
                                        <li><strong>Feedback System:</strong> अगर मेंबर स्क्वाट्स कर रहा है और घुटने ज्यादा आगे जा रहे हैं, तो AI तुरंत बोलेगा—"घुटने पीछे रखें।"</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="bg-gray-900/50 border-gray-800">
                        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                            <Layers className="w-6 h-6 text-purple-400" />
                            <h3 className="text-xl font-bold text-white">3. सुपर ऐप का 'Cost-Free Master Architecture'</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-900/30">
                                        <th className="py-4 px-6 text-gray-400 font-medium">लेयर (Layer)</th>
                                        <th className="py-4 px-6 text-gray-400 font-medium">मुफ़्त टेक्नोलॉजी (Free Tech)</th>
                                        <th className="py-4 px-6 text-gray-400 font-medium">काम (Work)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {masterArchitecture.map((row, idx) => (
                                        <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-indigo-300">{row.layer}</td>
                                            <td className="py-4 px-6 text-gray-200">
                                                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm border border-gray-700">
                                                    {row.tool}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-400">{row.work}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'comparison' && (
                <Card className="bg-gray-900/50 border-gray-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="py-4 px-6 text-gray-400 font-medium">फीचर (Feature)</th>
                                    <th className="py-4 px-6 text-gray-400 font-medium">ओपन-सोर्स टूल (Free Tool)</th>
                                    <th className="py-4 px-6 text-gray-400 font-medium">विशेषता (Capability)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonTable.map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                        <td className="py-4 px-6 font-medium text-indigo-300">{row.feature}</td>
                                        <td className="py-4 px-6 text-gray-200">
                                            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm border border-green-500/30 text-green-400">
                                                {row.tool}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-400">{row.desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default NeuralArchitecture;
