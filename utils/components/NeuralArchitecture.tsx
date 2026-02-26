import React, { useState } from 'react';
import Card from './common/Card';
import { 
    Brain, MessageSquare, Camera, CreditCard, 
    Globe, Database, Zap, Cpu, Activity, 
    ShieldCheck, Network, Sparkles, Layers,
    Bot, Fingerprint, RefreshCw, Eye, Clock, Smartphone, Star
} from 'lucide-react';

const NeuralArchitecture: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'stack' | 'god-tier' | 'roadmap' | 'comparison'>('stack');

    const godTierTools = [
        {
            id: 'orion',
            name: 'Orion Nexus (The Multi-Agent Orchestrator)',
            tech: 'LangGraph + CrewAI',
            desc: 'यह अकेला बोट नहीं है, बल्कि "बोट्स की सेना" को मैनेज करता है। अगर कोई मेंबर जिम में अपनी फीस जमा करता है, तो Orion तुरंत "Financial Bot" को रसीद काटने, "WhatsApp Bot" को मैसेज भेजने और "Diet Bot" को उसकी प्रोग्रेस के हिसाब से डाइट अपडेट करने का आदेश देता है।',
            icon: <Network className="w-6 h-6 text-purple-400" />,
            color: 'from-purple-500/20 to-fuchsia-500/20',
            border: 'border-purple-500/30'
        },
        {
            id: 'titan',
            name: 'Titan Vision Pro v5.0 (The Pose Correction Engine)',
            tech: 'Google MediaPipe + OpenCV-AI',
            desc: 'यूजर मोबाइल कैमरा के सामने एक्सरसाइज करेगा और यह टूल रीयल-टाइम में उसकी हड्डियों और जोड़ों (Skeletal tracking) को ट्रैक करके 99.9% सटीकता के साथ बताएगा कि उसकी पोजीशन सही है या नहीं। यह "जिम कोच" की फिजिकल मौजूदगी की कमी को पूरी तरह खत्म कर देगा।',
            icon: <Eye className="w-6 h-6 text-cyan-400" />,
            color: 'from-cyan-500/20 to-blue-500/20',
            border: 'border-cyan-500/30'
        },
        {
            id: 'gastronoma',
            name: 'Gastronoma Scientific AI (The Advanced Kitchen Chief)',
            tech: 'ChefGPT 2026 Enterprise + Nutritics API',
            desc: 'यह केवल डाइट चार्ट नहीं बनाता, बल्कि यूजर के Blood Biomarkers और जिम के Smart Scale डेटा को पढ़कर हर दिन की कैलोरी बदलता है। इसे "Latest AI Kitchen Chief" के साथ इंटीग्रेट करें ताकि यूजर को उनकी रेसिपी का "Visual AI Guide" भी मिले।',
            icon: <Activity className="w-6 h-6 text-green-400" />,
            color: 'from-green-500/20 to-emerald-500/20',
            border: 'border-green-500/30'
        },
        {
            id: 'aegis',
            name: 'Aegis Flow (The WhatsApp & Google Business Automation)',
            tech: 'n8n.io + Twilio Autopilot',
            desc: 'जैसे ही कोई गूगल मैप्स पर आपके जिम को सर्च करेगा, Aegis Flow खुद उसे मैसेज करेगा, उसे वर्चुअल टूर दिखाएगा और बिना किसी इंसानी मदद के उसका एडमिशन फॉर्म भरवा लेगा। यह "Royal Overlord" की तरह आपके पूरे बिजनेस ऑपरेशंस को कंट्रोल करेगा।',
            icon: <MessageSquare className="w-6 h-6 text-pink-400" />,
            color: 'from-pink-500/20 to-rose-500/20',
            border: 'border-pink-500/30'
        },
        {
            id: 'chronos',
            name: 'Chronos Mirror v11.5 (Predictive Retention Bot)',
            tech: 'Predictive AI',
            desc: 'यह बोट प्रेडिक्ट करता है कि कौन सा मेंबर अगले 10 दिनों में जिम छोड़ सकता है (Attendance और Behavior के आधार पर)। यह उन मेंबर्स को ऑटोमैटिक "Motivational Offers" या मैसेज भेजकर उन्हें वापस लाएगा।',
            icon: <Clock className="w-6 h-6 text-amber-400" />,
            color: 'from-amber-500/20 to-orange-500/20',
            border: 'border-amber-500/30'
        },
        {
            id: 'nano',
            name: 'Gemini Nano-Banana (On-Device Edge AI)',
            tech: 'Google Edge AI',
            desc: 'गूगल का यह लेटेस्ट मॉडल ऐप के अंदर बिना इंटरनेट के भी काम कर सकता है। वर्कआउट के दौरान अगर इंटरनेट चला जाए, तो भी मेंबर का डेटा ट्रैक होता रहेगा और उसे गाइडेंस मिलती रहेगी।',
            icon: <Smartphone className="w-6 h-6 text-indigo-400" />,
            color: 'from-indigo-500/20 to-blue-500/20',
            border: 'border-indigo-500/30'
        },
        {
            id: 'frontier',
            name: 'Llama-4 / GPT-5 Frontier (The Core Intelligence)',
            tech: 'Frontier Level Models API',
            desc: 'यह आपके "God Tier" का असली दिमाग होगा, जो मेंबर के साथ "इमोशनल इंटेलिजेंस" के साथ बात करेगा (जैसे: "आज आप थके हुए लग रहे हैं, चलो आज लाइट वर्कआउट करते हैं")।',
            icon: <Brain className="w-6 h-6 text-rose-400" />,
            color: 'from-rose-500/20 to-red-500/20',
            border: 'border-rose-500/30'
        }
    ];

    const techStack = [
        {
            id: 'core',
            title: 'Core Management & AI Architecture (The Brain)',
            description: 'आपके "Neural OS" और "Singularity" विज़न को चलाने के लिए मुख्य इंजन:',
            icon: <Brain className="w-8 h-8 text-purple-400" />,
            color: 'from-purple-500/20 to-fuchsia-500/20',
            border: 'border-purple-500/30',
            tools: [
                { name: 'Gemini 1.5 Pro / GPT-4o API', desc: 'वैज्ञानिक डाइट प्लान और वर्कआउट शेड्यूलिंग के लिए। 100% सटीक डाइट चार्ट।', icon: <Sparkles className="w-5 h-5 text-purple-400" /> },
                { name: 'n8n.io (Workflow Automation)', desc: 'पूरे जिम मैनेजमेंट को बैकएंड में "ऑटो-पायलट" पर डाल देगा।', icon: <Network className="w-5 h-5 text-purple-400" /> },
                { name: 'Pinecone (Vector Database)', desc: 'ऐप को "याददाश्त" देगा। हर मेंबर की प्रोग्रेस याद रखकर पर्सनलाइज्ड सजेशन।', icon: <Database className="w-5 h-5 text-purple-400" /> }
            ]
        },
        {
            id: 'whatsapp',
            title: 'WhatsApp Business & Comm Automation',
            description: 'Intelligent Conversational AI जो इंसानों की तरह बात करे:',
            icon: <MessageSquare className="w-8 h-8 text-green-400" />,
            color: 'from-green-500/20 to-emerald-500/20',
            border: 'border-green-500/30',
            tools: [
                { name: 'Interakt / Wati.io', desc: 'WhatsApp API के लिए। ऑटोमैटिक पेमेंट लिंक और फीस कन्फर्मेशन।', icon: <MessageSquare className="w-5 h-5 text-green-400" /> },
                { name: 'Typebot.io', desc: 'विजुअल चैटबॉट बिल्डर जो एडमिशन फॉर्म को बातचीत के जरिए भरवाएगा।', icon: <Bot className="w-5 h-5 text-green-400" /> },
                { name: 'Twilio Autopilot', desc: 'पेमेंट रिमाइंडर्स और कस्टमर सपोर्ट को ऑटोमेट करने के लिए एडवांस बोट।', icon: <RefreshCw className="w-5 h-5 text-green-400" /> }
            ]
        },
        {
            id: 'vision',
            title: 'AI Fitness & Exercise Vision (God Tier)',
            description: 'एक्सरसाइज पोजीशन और वर्चुअल गाइडेंस के लिए अनिवार्य टूल्स:',
            icon: <Camera className="w-8 h-8 text-cyan-400" />,
            color: 'from-cyan-500/20 to-blue-500/20',
            border: 'border-cyan-500/30',
            tools: [
                { name: 'Google MediaPipe / TensorFlow.js', desc: 'रीयल-टाइम "Pose Estimation"। एआई बताएगा कि पोजीशन सही है या नहीं।', icon: <Activity className="w-5 h-5 text-cyan-400" /> },
                { name: 'Synthesia / HeyGen API', desc: 'वर्कआउट वीडियो के लिए एआई अवतार। खुद-ब-खुद इंस्ट्रक्शनल वीडियो।', icon: <Fingerprint className="w-5 h-5 text-cyan-400" /> },
                { name: 'YouTube Data API & Pinterest API', desc: 'ऑटो-अपलोड और कंटेंट सिंकिंग ताकि ऐप हमेशा लेटेस्ट ट्रेंड्स से अपडेट रहे।', icon: <Layers className="w-5 h-5 text-cyan-400" /> }
            ]
        },
        {
            id: 'finance',
            title: 'Payment & Finance Automation',
            description: 'कैश, UPI, और कार्ड्स को एक ही डैशबोर्ड पर सिंक करने के लिए:',
            icon: <CreditCard className="w-8 h-8 text-amber-400" />,
            color: 'from-amber-500/20 to-orange-500/20',
            border: 'border-amber-500/30',
            tools: [
                { name: 'Razorpay / Stripe Smart Checkout', desc: 'वन-क्लिक UPI और कार्ड पेमेंट इंटीग्रेशन।', icon: <CreditCard className="w-5 h-5 text-amber-400" /> },
                { name: 'Auto-Reconciliation Bot', desc: 'बैंक स्टेटमेंट चेक करके खुद-ब-खुद फीस को "Paid" मार्क कर देगा।', icon: <ShieldCheck className="w-5 h-5 text-amber-400" /> }
            ]
        },
        {
            id: 'marketing',
            title: 'Marketing & Smart Diet Algorithm',
            description: 'स्थानीय SEO और "Scientific" डाइट प्लान के लिए APIs:',
            icon: <Globe className="w-8 h-8 text-pink-400" />,
            color: 'from-pink-500/20 to-rose-500/20',
            border: 'border-pink-500/30',
            tools: [
                { name: 'BrightLocal / Geotargeting API', desc: 'स्थानीय (Local) SEO ऑटोमेशन के लिए।', icon: <Globe className="w-5 h-5 text-pink-400" /> },
                { name: 'GMB API (Google My Business)', desc: 'रिव्यूज का एआई के जरिए जवाब देना और ऑटोमैटिक पोस्टिंग।', icon: <Zap className="w-5 h-5 text-pink-400" /> },
                { name: 'Edamam Nutrition Analysis API', desc: 'हर मील की कैलोरी और माइक्रोन्यूट्रिएंट्स को सटीक मापने के लिए।', icon: <Activity className="w-5 h-5 text-pink-400" /> },
                { name: 'Nutritics', desc: 'प्रोफेशनल बॉडीबिल्डिंग डाइट डेटाबेस के लिए।', icon: <Database className="w-5 h-5 text-pink-400" /> }
            ]
        }
    ];

    const comparisonTable = [
        { feature: 'Diet AI', tool: 'LangChain + Gemini 1.5', desc: 'वैज्ञानिक और रिसर्च-बेस्ड प्लान' },
        { feature: 'Pose Detection', tool: 'MediaPipe', desc: 'रीयल-टाइम एक्सरसाइज पोजीशन चेक' },
        { feature: 'Automation', tool: 'n8n', desc: 'बिना कोडिंग के पूरा जिम मैनेजमेंट' },
        { feature: 'Payment', tool: 'Razorpay Intent', desc: 'वन-क्लिक UPI और कार्ड पेमेंट' },
        { feature: 'Content', tool: 'Midjourney / Runway', desc: 'अल्ट्रा-रियलिस्टिक एक्सरसाइज विजुअल्स' }
    ];

    const summaryTable = [
        { section: 'Brain', tool: 'Gemini 1.5 Pro + Pinecone', role: 'याददाश्त (Memory) और बुद्धिमत्ता' },
        { section: 'Vision', tool: 'Google MediaPipe', role: 'एक्सरसाइज की सटीक पोजीशन चेक करना' },
        { section: 'Automation', tool: 'n8n / Zapier Central', role: 'फीस, रिमाइंडर और एडमिशन का ऑटोमेशन' },
        { section: 'Diet AI', tool: 'Edamam + Nutrition AI', role: 'साइंटिफिक और मेडिकल-ग्रेड डाइट' },
        { section: 'Media', tool: 'Pinterest & YouTube API', role: 'ऑटो-अपलोड और कंटेंट डिस्ट्रीब्यूशन' }
    ];

    const masterArchitecture = [
        { layer: 'User Interface', tool: 'Flutter', work: 'आधुनिक और स्मूथ डिजाइन के लिए।' },
        { layer: 'Logic Layer', tool: 'n8n', work: 'एडमिशन, फीस और ऑटो-रिमाइंडर के लिए।' },
        { layer: 'Intelligence', tool: 'Gemini 1.5 API', work: 'डाइट और वर्कआउट रिसर्च के लिए।' },
        { layer: 'Vision Layer', tool: 'MediaPipe', work: 'एक्सरसाइज पोजीशन की सटीक जानकारी।' },
        { layer: 'Communication', tool: 'Twilio / Wati', work: 'व्हाट्सएप और एसएमएस ऑटोमेशन।' }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-indigo-400" />
                        Neural OS & Singularity Stack
                    </h1>
                    <p className="text-gray-400 mt-2">
                        दुनिया के सबसे आधुनिक Production-Ready AI स्टैक और Automation Frameworks
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
                    Tech Stack Architecture
                </button>
                <button
                    onClick={() => setActiveTab('god-tier')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'god-tier' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    7 God-Tier Bots
                </button>
                <button
                    onClick={() => setActiveTab('roadmap')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'roadmap' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Technical Roadmap
                </button>
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'comparison' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Future-Ready Comparison
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
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-900/60 rounded text-xs font-medium text-gray-300 border border-gray-700/50">
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
                            <h3 className="text-xl font-bold text-white">Neural Stack Summary</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-900/30">
                                        <th className="py-4 px-6 text-gray-400 font-medium">सेक्शन (Section)</th>
                                        <th className="py-4 px-6 text-gray-400 font-medium">सजेस्टेड टूल / बोट (Suggested Tool)</th>
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
                        <div className="p-4 bg-indigo-500/10 border-t border-indigo-500/20 text-sm text-indigo-200 flex items-start gap-3">
                            <Zap className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                            <p>
                                <strong>प्रो टिप:</strong> "दुनिया की सबसे बेहतरीन ऐप" बनाने के लिए आपको "Vector Database" (जैसे Pinecone) का उपयोग करना चाहिए। यह आपके ऐप को हर मेंबर की पसंद-नापसंद 'याद' रखने की शक्ति देगा, जिससे वह वास्तव में एक Neural OS की तरह महसूस होगी।
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
                                <h3 className="text-xl font-bold text-white">1. n8n Integration: ऐप का 'Neural OS'</h3>
                            </div>
                            <p className="text-sm text-gray-300 mb-4">
                                n8n एक वर्कफ्लो ऑटोमेशन टूल है जो आपके जिम के सभी ऐप्स (WhatsApp, Google Sheets, Razorpay, AI) को आपस में जोड़ता है।
                            </p>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-indigo-300 text-sm">Trigger (Webhook)</h4>
                                    <p className="text-xs text-gray-400 mt-1">जैसे ही कोई मेंबर 'Royal The Gym' के एडमिशन फॉर्म को सबमिट करता है।</p>
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-purple-300 text-sm">AI Node (Gemini 1.5)</h4>
                                    <p className="text-xs text-gray-400 mt-1">मेंबर के डेटा (उम्र, वजन, गोल) को एनालाइज करके Scientific Diet जनरेट करना।</p>
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-blue-300 text-sm">Database Node (Supabase/PostgreSQL)</h4>
                                    <p className="text-xs text-gray-400 mt-1">मेंबर का डेटा सिक्योरली सेव करना।</p>
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-green-300 text-sm">WhatsApp Node</h4>
                                    <p className="text-xs text-gray-400 mt-1">मेंबर को पेमेंट लिंक और स्वागत संदेश भेजना।</p>
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-amber-300 text-sm">Payment Check</h4>
                                    <p className="text-xs text-gray-400 mt-1">पेमेंट मिलते ही वर्कआउट प्लान अनलॉक करना।</p>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-200">
                                <strong>प्रो टिप:</strong> n8n को आप अपने खुद के सर्वर (Self-hosting) पर चला सकते हैं, जिससे आपका डेटा पूरी तरह प्राइवेट और कंट्रोल में रहेगा।
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Eye className="w-6 h-6 text-cyan-400" />
                                <h3 className="text-xl font-bold text-white">2. MediaPipe Integration: 'God Tier' वर्कआउट विज़न</h3>
                            </div>
                            <p className="text-sm text-gray-300 mb-4">
                                यह आपके ऐप का सबसे शानदार फीचर होगा। जब यूजर कैमरा ऑन करेगा, तो MediaPipe Pose उसे रीयल-टाइम में गाइड करेगा।
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-cyan-300 text-sm mb-2">तकनीकी आर्किटेक्चर:</h4>
                                    <ul className="space-y-2 text-sm text-gray-400 list-disc pl-5">
                                        <li><strong>Front-end:</strong> Flutter या React Native का उपयोग करें (ताकि Android और iOS दोनों पर चले)।</li>
                                        <li><strong>On-Device Processing:</strong> MediaPipe की खासियत यह है कि यह फोटो/वीडियो को सर्वर पर नहीं भेजता, बल्कि यूजर के फोन पर ही प्रोसेस करता है। इससे ऐप सुपर-फास्ट चलता है।</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium text-blue-300 text-sm mb-2">Feedback System:</h4>
                                    <ul className="space-y-2 text-sm text-gray-400 list-disc pl-5">
                                        <li>अगर मेंबर स्क्वाट्स (Squats) कर रहा है और घुटने ज्यादा आगे जा रहे हैं, तो AI तुरंत बोलेगा—"घुटने पीछे रखें।"</li>
                                        <li>यह X, Y, Z कोऑर्डिनेट्स के आधार पर जॉइंट एंगल्स (Joint Angles) की गणना करता है।</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="bg-gray-900/50 border-gray-800">
                        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                            <Layers className="w-6 h-6 text-purple-400" />
                            <h3 className="text-xl font-bold text-white">3. सुपर ऐप का 'Master Architecture'</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-900/30">
                                        <th className="py-4 px-6 text-gray-400 font-medium">लेयर (Layer)</th>
                                        <th className="py-4 px-6 text-gray-400 font-medium">टेक्नोलॉजी / टूल (Technology)</th>
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

                    <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                        <div className="flex items-start gap-4 p-2">
                            <div className="p-3 bg-amber-500/20 rounded-full">
                                <Star className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-amber-400 mb-2">Golden Suggestion: Progressive Overload Tracking</h3>
                                <p className="text-sm text-amber-100/80 leading-relaxed">
                                    अपने ऐप में "Progressive Overload Tracking" फीचर जोड़ें। यह एक ऐसा बॉट होगा जो हर हफ्ते मेंबर की प्रोग्रेस देखेगा और खुद-ब-खुद उसका वजन (Weight) या रेप्स (Reps) बढ़ाने का सुझाव देगा। इसे ही असली "Neural OS" कहा जाएगा।
                                </p>
                            </div>
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
                                    <th className="py-4 px-6 text-gray-400 font-medium">टूल / सॉफ्टवेयर (Tool)</th>
                                    <th className="py-4 px-6 text-gray-400 font-medium">विशेषता (Capability)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonTable.map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                        <td className="py-4 px-6 font-medium text-indigo-300">{row.feature}</td>
                                        <td className="py-4 px-6 text-gray-200">
                                            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm border border-gray-700">
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
