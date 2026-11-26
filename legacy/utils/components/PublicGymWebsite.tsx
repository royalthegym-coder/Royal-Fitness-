import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  ScanFace,
  Activity,
  Phone,
  Mail,
  MapPin,
  Languages,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lock,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useAutomationStore, bi } from '../store/useAutomationStore';
import { normalizeIndianPhone } from '../../src/backend/FitnessFutureService';
import PWAInstallButton from './common/PWAInstallButton';
import FeatureImage from './common/FeatureImage';
import {
  ALL_18_MODULE_MEDIA,
  FEATURE_IMAGES,
  PACKAGE_TIER_MEDIA,
} from '../data/featureMedia';
import heroGymImg from '../../src/assets/images/hero_luxury_gym_1795098930587.jpg';

interface PublicGymWebsiteProps {
  onOpenPortalLogin: () => void;
  onOpenPoseStudio: () => void;
  onOpenFitnessSuite?: (tab?: 'planner' | 'progress' | 'community') => void;
}

type ModuleLaneFilter = 'all' | 'operations' | 'members' | 'training' | 'finance';

const MODULE_LANE_TABS: { id: ModuleLaneFilter; en: string; hi: string }[] = [
  { id: 'all', en: 'All 18 Modules', hi: 'सभी 18 मॉड्यूल' },
  { id: 'operations', en: 'Operations Core', hi: 'ऑपरेशंस कोर' },
  { id: 'members', en: 'Members & CRM', hi: 'मेंबर्स व CRM' },
  { id: 'training', en: 'Training & Biometrics', hi: 'ट्रेनिंग व बायोमेट्रिक्स' },
  { id: 'finance', en: 'Finance & Growth', hi: 'फाइनेंस व ग्रोथ' },
];

const LANE_LABEL_MAP: Record<Exclude<ModuleLaneFilter, 'all'>, { en: string; hi: string }> = {
  operations: { en: 'Operations Core', hi: 'ऑपरेशंस कोर' },
  members: { en: 'Members & CRM', hi: 'मेंबर्स व CRM' },
  training: { en: 'Training & Biometrics', hi: 'ट्रेनिंग व बायोमेट्रिक्स' },
  finance: { en: 'Finance & Growth', hi: 'फाइनेंस व ग्रोथ' },
};

const FLAGSHIP_PLATFORM_PREVIEWS = [
  {
    en: 'Multi-Device Club Command Suite',
    hi: 'मल्टी-डिवाइस क्लब कमांड सूट',
    subEn: 'Desktop · Tablet · Live Equipment Sync',
    subHi: 'डेस्कटॉप · टैबलेट · लाइव उपकरण सिंक',
    image: FEATURE_IMAGES.clubManagementSuite,
    alt: 'Fitness Future multi-device club management workspace on laptop and tablet',
    moduleNum: '15',
  },
  {
    en: 'Smart Billing & Automated UPI GST',
    hi: 'स्मार्ट बिलिंग व ऑटोमेटेड UPI GST',
    subEn: 'Razorpay · Stripe · Automated Invoicing',
    subHi: 'रेज़रपे · स्ट्राइप · ऑटोमेटेड इनवॉइसिंग',
    image: FEATURE_IMAGES.billingPayments,
    alt: 'Fitness Future automated billing, invoices, and payment analytics',
    moduleNum: '06',
  },
  {
    en: 'Android & iOS Athlete Companion',
    hi: 'Android व iOS एथलीट साथी ऐप',
    subEn: 'Heart Rate · Activity Rings · Video Drills',
    subHi: 'हार्ट रेट · एक्टिविटी रिंग्स · वीडियो ड्रिल्स',
    image: FEATURE_IMAGES.memberMobileSuite,
    alt: 'Fitness Future mobile companion app with vitals, workouts, and profile controls',
    moduleNum: '02',
  },
];

const FALLBACK_PACKAGES = [
  {
    id: 101,
    name: 'Foundation Strength Monthly',
    category: 'Monthly',
    price: 1500,
    duration: '1 Month',
    features: [
      'Full floor strength & conditioning access',
      'Hybrid Face Geometry & QR check-in pass',
      'Progressive overload workout baseline',
    ],
  },
  {
    id: 102,
    name: 'Fitness Future Transformation Quarterly',
    category: 'Quarterly',
    price: 3999,
    duration: '3 Months',
    features: [
      'Everything in Foundation Monthly',
      'Personalized Regional Indian Diet Plan',
      'Live Pose & Posture Form Studio audits',
      'WhatsApp automated check-in & macro alerts',
    ],
  },
  {
    id: 103,
    name: 'Apex Performance Yearly',
    category: 'Yearly',
    price: 12999,
    duration: '12 Months',
    features: [
      'Priority 1-on-1 scientific biometric profiling',
      'Unlimited workout + regional nutrition protocols',
      'Passkey biometric gate & offline Android/iOS app',
      'Complimentary recovery lounge & body composition scans',
    ],
  },
];

const PublicGymWebsite: React.FC<PublicGymWebsiteProps> = ({
  onOpenPortalLogin,
  onOpenPoseStudio,
  onOpenFitnessSuite,
}) => {
  const { packages, addLead, members } = useData();
  const { language, toggleLanguage, settings, pausedChannels, addLog } = useAutomationStore();

  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [selectedPackageName, setSelectedPackageName] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('Lean Muscle & Strength');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [activeLane, setActiveLane] = useState<ModuleLaneFilter>('all');
  const [previewModuleNum, setPreviewModuleNum] = useState<string | null>(null);

  const filteredModules = useMemo(() => {
    if (activeLane === 'all') return ALL_18_MODULE_MEDIA;
    return ALL_18_MODULE_MEDIA.filter((m) => m.lane === activeLane);
  }, [activeLane]);

  const activePreviewIndex = useMemo(() => {
    if (!previewModuleNum) return -1;
    return ALL_18_MODULE_MEDIA.findIndex((m) => m.num === previewModuleNum);
  }, [previewModuleNum]);

  const activePreviewModule =
    activePreviewIndex >= 0 ? ALL_18_MODULE_MEDIA[activePreviewIndex] : null;

  useEffect(() => {
    if (!previewModuleNum) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewModuleNum(null);
      } else if (event.key === 'ArrowRight') {
        const nextIdx = (activePreviewIndex + 1) % ALL_18_MODULE_MEDIA.length;
        setPreviewModuleNum(ALL_18_MODULE_MEDIA[nextIdx].num);
      } else if (event.key === 'ArrowLeft') {
        const prevIdx =
          (activePreviewIndex - 1 + ALL_18_MODULE_MEDIA.length) % ALL_18_MODULE_MEDIA.length;
        setPreviewModuleNum(ALL_18_MODULE_MEDIA[prevIdx].num);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewModuleNum, activePreviewIndex]);

  const displayedPackages = useMemo(() => {
    if (Array.isArray(packages) && packages.length > 0) {
      return packages.slice(0, 3);
    }
    return FALLBACK_PACKAGES;
  }, [packages]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectPackage = (pkgName: string) => {
    setSelectedPackageName(pkgName);
    scrollToSection('admissions');
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmedName = leadName.trim();
    if (trimmedName.length < 2) {
      setFormError(
        bi(language, 'Please enter your full name (at least 2 characters).', 'कृपया अपना पूरा नाम दर्ज करें।')
      );
      return;
    }

    const phoneResult = normalizeIndianPhone(leadPhone);
    if (!phoneResult.ok) {
      setFormError(
        bi(
          language,
          'Please enter a valid 10-digit Indian mobile number.',
          'कृपया एक मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें।'
        )
      );
      return;
    }

    const trimmedEmail = leadEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError(
        bi(language, 'Please enter a valid email address.', 'कृपया एक मान्य ईमेल पता दर्ज करें।')
      );
      return;
    }

    setSubmitting(true);
    try {
      const normalized10 = phoneResult.data.replace(/^\+91/, '');
      const todayIso = new Date().toISOString().slice(0, 10);
      addLead({
        id: Date.now(),
        name: trimmedName,
        email: trimmedEmail || `${normalized10}@lead.fitnessfuture.in`,
        phone: normalized10,
        source: 'Website',
        status: 'New',
        inquiryDate: todayIso,
        aiScore: selectedPackageName ? 92 : 84,
      });

      // Trigger server-side WhatsApp AI welcome webhook & log to Manual Override Audit Log
      let dispatchNote = '';
      try {
        const resp = await fetch('/api/ai/whatsapp/auto-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: normalized10,
            recipientName: trimmedName,
            intent: 'website_trial_welcome',
            inboundMessage: `Interested in ${selectedPackageName || 'Membership'} for goal: ${fitnessGoal}`,
            autoSend: settings.whatsappAutoSend && settings.leadAutoFollowUp,
            paused: pausedChannels.WHATSAPP,
            language: settings.replyLanguage,
            tone: settings.replyTone,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          await addLog({
            channel: 'WHATSAPP',
            target: `${trimmedName} (${phoneResult.data})`,
            summary: `Website Lead Welcome · ${selectedPackageName || fitnessGoal}`,
            messageBody: data.messageBody || 'Welcome to Fitness Future.',
            status: data.deliveryStatus || 'AUTO_SENT',
            providerStatus: data.providerStatus,
          });
          dispatchNote =
            data.deliveryStatus === 'AUTO_SENT'
              ? bi(
                  language,
                  ' An instant WhatsApp concierge welcome has been dispatched.',
                  ' व्हाट्सएप पर तुरंत वेलकम मैसेज भेज दिया गया है।'
                )
              : bi(
                  language,
                  ' Your inquiry is queued for desk confirmation.',
                  ' आपकी जानकारी रिसेप्शन टीम के लिए सुरक्षित कर ली गई है।'
                );
        }
      } catch {
        // Non-blocking: lead is already saved to state & Firestore
      }

      setFormSuccess(
        bi(
          language,
          `Thank you, ${trimmedName}. Your scientific trial & admission request is registered.${dispatchNote}`,
          `धन्यवाद ${trimmedName}! आपका साइंटिफिक ट्रायल और एडमिशन अनुरोध दर्ज हो गया है।${dispatchNote}`
        )
      );
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-y-auto overflow-x-hidden bg-[#09090B] text-[#F8FAFC] selection:bg-amber-500/30"
      style={{
        fontFamily:
          "'Plus Jakarta Sans', 'Noto Sans Devanagari', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* STRICT 3-ZONE TOP HEADER */}
      <header className="sticky top-0 z-50 pt-safe border-b border-white/[0.08] bg-[#09090B]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => scrollToSection('hero')}
            className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm cursor-pointer"
          >
            <span
              className="text-2xl font-extrabold tracking-tight text-white uppercase"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              FITNESS <span className="text-amber-400">FUTURE</span>
            </span>
          </button>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button
              type="button"
              onClick={() => scrollToSection('spaces')}
              className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              {bi(language, 'Training Spaces', 'ट्रेनिंग स्पेस')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ecosystem')}
              className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              {bi(language, '18 Pro Modules', '18 प्रो मॉड्यूल')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('packages')}
              className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              {bi(language, 'Packages', 'पैकेज')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('admissions')}
              className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              {bi(language, 'Admissions', 'एडमिशन')}
            </button>
            {onOpenFitnessSuite && (
              <button
                type="button"
                onClick={() => onOpenFitnessSuite('planner')}
                className="text-amber-300 hover:text-amber-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                {bi(language, 'Workouts & Forum', 'व्यायाम व मंच')}
              </button>
            )}
          </nav>

          {/* Zone 3: Install App + Language Toggle + Primary Portal CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton compact />
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-white/[0.1] rounded-md transition-colors cursor-pointer"
              title="Toggle Hindi / English"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'hi' ? 'EN' : 'हिंदी'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenPortalLogin}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm px-4 py-2 rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{bi(language, 'Portal Login', 'पोर्टल लॉगिन')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION — FULL-BLEED EDITORIAL PHOTOGRAPHY */}
      <section id="hero" className="relative min-h-[84vh] flex items-end border-b border-white/[0.08]">
        <img
          src={heroGymImg}
          alt="Fitness Future private strength and conditioning floor"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/70 to-[#09090B]/30" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pb-20">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-mono uppercase tracking-[0.24em] text-amber-400">
              {bi(
                language,
                'Fitness Future · Smart Club App (Android & iOS)',
                'फिटनेस फ्यूचर · स्मार्ट क्लब ऐप (Android व iOS)'
              )}
            </p>
            <h1
              className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.03]"
              style={{
                fontFamily: "'Barlow Condensed', 'Noto Sans Devanagari', sans-serif",
                textWrap: 'balance',
              }}
            >
              {bi(
                language,
                'Precision Strength, Biometric Access, and 18 Automated Club Systems.',
                'प्रिसिजन स्ट्रेंथ, बायोमेट्रिक एंट्री और 18 फुल ऑटोमेशन सिस्टम।'
              )}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              {bi(
                language,
                'A private luxury training sanctuary unified with live posture form analysis, hybrid Face Geometry + QR + Passkey attendance, smart Indian nutrition protocols, and automated WhatsApp & Google Business workflows.',
                'आधुनिक जिम ट्रेनिंग के साथ लाइव पोस्चर एनालिसिस, फेस ज्योमेट्री + QR + पासकी अटेंडेंस, स्मार्ट भारतीय डाइट प्लान और लाइव व्हाट्सएप व गूगल बिजनेस ऑटोमेशन एक ही सुपर ऐप में।'
              )}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onOpenPortalLogin}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm sm:text-base px-6 py-3.5 rounded-md transition-colors cursor-pointer"
              >
                <span>{bi(language, 'Member & Admin Portal', 'मेंबर व एडमिन पोर्टल')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {onOpenFitnessSuite && (
                <button
                  type="button"
                  onClick={() => onOpenFitnessSuite('planner')}
                  className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] border border-amber-400/40 text-amber-200 font-semibold text-sm sm:text-base px-5 py-3.5 rounded-md transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{bi(language, 'Workouts, Progress & Forum', 'व्यायाम, प्रगति व समुदाय')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => scrollToSection('admissions')}
                className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.14] text-white font-semibold text-sm sm:text-base px-5 py-3.5 rounded-md transition-colors cursor-pointer"
              >
                <span>{bi(language, 'Book Scientific Trial', 'साइंटिफिक ट्रायल बुक करें')}</span>
              </button>
              <button
                type="button"
                onClick={onOpenPoseStudio}
                className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 font-semibold text-sm px-3 py-3 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>{bi(language, 'Launch Form & Pose Studio', 'फॉर्म व पोज़ स्टूडियो खोलें')}</span>
              </button>
            </div>
          </div>

          {/* Grounded Metric Proof Strip (No floating badges, clean hairline divider) */}
          <div className="mt-12 pt-8 border-t border-white/[0.1] grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">18</p>
              <p className="text-xs text-slate-400 mt-1">
                {bi(language, 'Integrated Club Automation Modules', 'इंटीग्रेटेड ऑटोमेशन मॉड्यूल')}
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">Android · iOS</p>
              <p className="text-xs text-slate-400 mt-1">
                {bi(language, 'Offline-Ready Native App & Auto-Update', 'ऑफलाइन ऐप व ऑटो-अपडेट सपोर्ट')}
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                {members.length > 0 ? members.length : '100%'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {members.length > 0
                  ? bi(language, 'Live Cloud-Synced Athlete Profiles', 'क्लाउड-सिंक एथलीट प्रोफाइल्स')
                  : bi(language, 'Cloud Sync & Offline Support Ready', 'क्लाउड व ऑफलाइन सिंक तैयार')}
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-400">24/7</p>
              <p className="text-xs text-slate-400 mt-1">
                {bi(language, 'WhatsApp & Google Business Automation', 'व्हाट्सएप व गूगल बिजनेस ऑटोमेशन')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ASYMMETRIC ARCHITECTURAL SPACES & PLATFORM SHOWCASE */}
      <section id="spaces" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-b border-white/[0.08]">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400 mb-2">
            {bi(language, 'The Club Environment & Smart Hardware', 'क्लब का वातावरण व स्मार्ट हार्डवेयर')}
          </p>
          <h2
            className="text-3xl sm:text-5xl font-bold text-white tracking-tight"
            style={{
              fontFamily: "'Barlow Condensed', 'Noto Sans Devanagari', sans-serif",
              textWrap: 'balance',
            }}
          >
            {bi(
              language,
              'Engineered for Biomechanical Precision and Seamless Biometric Entry.',
              'बायोमैकेनिकल सटीकता और स्मार्ट बायोमेट्रिक एंट्री के लिए निर्मित।'
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-[#111114] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col group">
            <button
              type="button"
              onClick={() => setPreviewModuleNum('14')}
              className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
              aria-label="Inspect Hybrid Biometric Gate & Floor Attendance"
            >
              <FeatureImage
                src={FEATURE_IMAGES.biometricGate}
                alt="Fitness Future biometric turnstile gate and front desk command console"
                aspectClassName="aspect-[16/10]"
                className="group-hover:scale-[1.03]"
                fallbackTitle="Hybrid Biometric Attendance Floor"
              >
                <div className="absolute right-4 bottom-4 flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-black/60 text-white backdrop-blur-sm opacity-80 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-4 w-4" />
                </div>
              </FeatureImage>
            </button>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-5">
              <div>
                <p className="text-xs font-mono text-slate-400 mb-2">
                  {bi(
                    language,
                    'Face Geometry Gate · QR Pass · Fingerprint Turnstile',
                    'फेस ज्योमेट्री गेट · QR पास · फिंगरप्रिंट टर्नस्टाइल'
                  )}
                </p>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {bi(language, 'Biomechanics & Hybrid Attendance Floor', 'बायोमैकेनिक्स और हाइब्रिड अटेंडेंस फ्लोर')}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {bi(
                    language,
                    'Check in seamlessly via camera face geometry, QR pass, or biometric fingerprint pad at the turnstile desk. Live motion analysis tracks joint symmetry, rep cadence, and safe load progression.',
                    'टर्नस्टाइल डेस्क पर कैमरा फेस ज्योमेट्री, QR पास या बायोमेट्रिक फिंगरप्रिंट से तुरंत एंट्री करें। लाइव मोशन ट्रैकिंग आपके हर रेप, पोस्चर और सुरक्षित वेट प्रोग्रेशन को ट्रैक करती है।'
                  )}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={onOpenPoseStudio}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  <span>{bi(language, 'Try Live Form & Posture Analyzer', 'लाइव पोस्चर एनालाइज़र आज़माएँ')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#111114] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col group">
            <button
              type="button"
              onClick={() => setPreviewModuleNum('16')}
              className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
              aria-label="Inspect 3D Biomechanical Motion and Muscle Profiling"
            >
              <FeatureImage
                src={FEATURE_IMAGES.biomechanicsIntake}
                alt="3D anatomical muscle engagement and core endurance motion analysis"
                aspectClassName="aspect-[4/3]"
                className="group-hover:scale-[1.03]"
                fallbackTitle="3D Biomechanics & Nutrition Suite"
              >
                <div className="absolute right-4 bottom-4 flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-black/60 text-white backdrop-blur-sm opacity-80 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-4 w-4" />
                </div>
              </FeatureImage>
            </button>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-5">
              <div>
                <p className="text-xs font-mono text-slate-400 mb-2">
                  {bi(
                    language,
                    '3D Muscle Engagement · Anthropometric Profiling · Indian Diet',
                    '3D मसल एंगेजमेंट · बायोमेट्रिक प्रोफाइलिंग · भारतीय डाइट'
                  )}
                </p>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {bi(language, '3D Motion & Metabolic Recovery Suite', '3D मोशन और मेटाबॉलिक रिकवरी सूट')}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {bi(
                    language,
                    'Precision body stability scoring paired with regional Indian nutrition protocols—Bajra, Jowar, Paneer, Sattu, sprouts, and balanced hydration—built around your exact height, weight, and goal.',
                    'सटीक बॉडी स्टेबिलिटी और मसल एंगेजमेंट एनालिसिस के साथ बाजरा, ज्वार, पनीर, सत्तू और स्थानीय भारतीय आहार पर आधारित साइंटिफिक डाइट प्लान।'
                  )}
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>{bi(language, 'Body Stability · Daily Macros', 'बॉडी स्टेबिलिटी · दैनिक मैक्रो')}</span>
                <span className="text-emerald-400 font-semibold">
                  {bi(language, 'Synced', 'सिंक सक्रिय')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-COLUMN FLAGSHIP VISUAL PROOF ROW */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {FLAGSHIP_PLATFORM_PREVIEWS.map((item) => (
            <button
              key={item.moduleNum}
              type="button"
              onClick={() => setPreviewModuleNum(item.moduleNum)}
              className="text-left bg-[#111114] border border-white/[0.08] hover:border-amber-500/40 rounded-xl overflow-hidden flex flex-col transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <FeatureImage
                src={item.image}
                alt={item.alt}
                aspectClassName="aspect-[16/10]"
                className="group-hover:scale-[1.03]"
                fallbackTitle={bi(language, item.en, item.hi)}
              >
                <div className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-black/60 text-white backdrop-blur-sm opacity-75 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-3.5 w-3.5" />
                </div>
              </FeatureImage>
              <div className="p-5 space-y-1.5">
                <p className="text-xs font-mono text-slate-400">
                  {bi(language, item.subEn, item.subHi)}
                </p>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {bi(language, item.en, item.hi)}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 18-MODULE FULL AUTOMATION VISUAL SHOWCASE */}
      <section id="ecosystem" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-b border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400 mb-2">
              {bi(language, 'Complete Super App Architecture', 'संपूर्ण सुपर ऐप आर्किटेक्चर')}
            </p>
            <h2
              className="text-3xl sm:text-5xl font-bold text-white tracking-tight"
              style={{
                fontFamily: "'Barlow Condensed', 'Noto Sans Devanagari', sans-serif",
                textWrap: 'balance',
              }}
            >
              {bi(
                language,
                'All 18 Automation Modules — Visual Feature Suite.',
                'सभी 18 स्मार्ट ऑटोमेशन मॉड्यूल — विज़ुअल फीचर सूट।'
              )}
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              {bi(
                language,
                'Select any feature screen below to inspect the full interface in high resolution.',
                'हाई-रेज़ोल्यूशन में पूरा इंटरफ़ेस देखने के लिए किसी भी फीचर कार्ड पर क्लिक करें।'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenPortalLogin}
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 cursor-pointer self-start lg:self-auto whitespace-nowrap shrink-0"
          >
            <span>{bi(language, 'Access Full Command Suite', 'फुल कमांड सूट खोलें')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Category Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#111114] border border-white/[0.08] rounded-lg w-fit mb-8">
          {MODULE_LANE_TABS.map((tab) => {
            const isActive = activeLane === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveLane(tab.id)}
                className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {bi(language, tab.en, tab.hi)}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((mod) => {
            const laneMeta = LANE_LABEL_MAP[mod.lane];
            return (
              <button
                key={mod.num}
                type="button"
                onClick={() => setPreviewModuleNum(mod.num)}
                className="text-left bg-[#111114] hover:bg-[#151519] border border-white/[0.08] hover:border-amber-500/45 rounded-xl overflow-hidden flex flex-col transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <FeatureImage
                  src={mod.image}
                  alt={mod.alt}
                  aspectClassName="aspect-[16/10]"
                  className="group-hover:scale-[1.04]"
                  fallbackTitle={bi(language, mod.en, mod.hi)}
                >
                  <div className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-black/65 text-white backdrop-blur-sm opacity-75 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                </FeatureImage>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
                      <span className="text-amber-400 font-semibold">{mod.num}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{bi(language, laneMeta.en, laneMeta.hi)}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {bi(language, mod.en, mod.hi)}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2">
                      {bi(language, mod.captionEn, mod.captionHi)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400">
                      {bi(language, 'Automated', 'ऑटोमेटेड')}
                    </span>
                    <span className="text-slate-300 group-hover:text-amber-400 transition-colors inline-flex items-center gap-1">
                      {bi(language, 'Preview', 'प्रीव्यू')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* TRANSPARENT MEMBERSHIP PACKAGES */}
      <section id="packages" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-b border-white/[0.08]">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400 mb-2">
            {bi(language, 'Transparent Memberships', 'पारदर्शी मेंबरशिप पैकेज')}
          </p>
          <h2
            className="text-3xl sm:text-5xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', 'Noto Sans Devanagari', sans-serif" }}
          >
            {bi(
              language,
              'Choose Your Performance Tier.',
              'अपना परफॉर्मेंस पैकेज चुनें।'
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedPackages.map((pkg, idx) => {
            const isFeatured = idx === 1;
            const tierImage = PACKAGE_TIER_MEDIA[idx % PACKAGE_TIER_MEDIA.length];
            return (
              <div
                key={pkg.id}
                className={`rounded-xl overflow-hidden flex flex-col justify-between border group ${
                  isFeatured
                    ? 'bg-[#141418] border-amber-500/60'
                    : 'bg-[#111114] border-white/[0.08]'
                }`}
              >
                <div>
                  <FeatureImage
                    src={tierImage}
                    alt={`${pkg.name} training experience preview`}
                    aspectClassName="aspect-[16/9]"
                    className="group-hover:scale-[1.03]"
                    fallbackTitle={pkg.name}
                  />
                  <div className="p-7 pb-0">
                    <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider mb-3">
                      <span className={isFeatured ? 'text-amber-400' : 'text-slate-400'}>
                        {pkg.duration} · {pkg.category}
                      </span>
                      {isFeatured && (
                        <span className="text-amber-400 font-semibold">
                          {bi(language, 'Recommended', 'लोकप्रिय')}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{pkg.name}</h3>
                    <div className="flex items-baseline gap-1.5 mb-6">
                      <span className="text-4xl font-bold font-mono tabular-nums text-white">
                        ₹{Number(pkg.price || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">/ {pkg.duration}</span>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-300 mb-8">
                      {(pkg.features || []).slice(0, 5).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-7 pt-0">
                  <button
                    type="button"
                    onClick={() => handleSelectPackage(pkg.name)}
                    className={`w-full py-3 px-4 rounded-md text-sm font-bold transition-colors cursor-pointer ${
                      isFeatured
                        ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1]'
                    }`}
                  >
                    {bi(language, 'Select & Request Admission', 'पैकेज चुनें व एडमिशन लें')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SCIENTIFIC TRIAL & ADMISSION LEAD CAPTURE */}
      <section id="admissions" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-b border-white/[0.08]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400">
              {bi(language, 'Scientific Intake · Module #08 & #16', 'साइंटिफिक एडमिशन · मॉड्यूल #08 व #16')}
            </p>
            <h2
              className="text-3xl sm:text-5xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Barlow Condensed', 'Noto Sans Devanagari', sans-serif" }}
            >
              {bi(
                language,
                'Start Your Transformation With Data, Not Guesswork.',
                'अंदाज़े से नहीं, वैज्ञानिक डेटा से अपनी फिटनेस शुरू करें।'
              )}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {bi(
                language,
                'Submit your details to enter our automated onboarding pipeline. Your inquiry syncs instantly to our front desk and triggers an instant bilingual WhatsApp confirmation.',
                'अपनी जानकारी भरें। आपका अनुरोध सीधे हमारे स्मार्ट एडमिशन सिस्टम में दर्ज होगा और व्हाट्सएप बिजनेस द्वारा तुरंत कन्फर्मेशन प्राप्त होगा।'
              )}
            </p>

            <div className="pt-4 space-y-3 text-sm text-slate-300 border-t border-white/[0.08]">
              <div className="flex items-center gap-3">
                <ScanFace className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{bi(language, 'Hybrid Face Geometry, QR & WebAuthn Passkey Ready', 'फेस ज्योमेट्री, QR व पासकी अटेंडेंस')}</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{bi(language, 'Verified UPI Billing (your-upi@bank)', 'सत्यापित UPI बिलिंग व GST रसीद')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{bi(language, 'Personalized Workout & Regional Diet Engine', 'पर्सनलाइज़्ड वर्कआउट और भारतीय डाइट प्लान')}</span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmitInquiry}
            className="lg:col-span-7 bg-[#111114] border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  {bi(language, 'Full Name *', 'पूरा नाम *')}
                </label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder={bi(language, 'e.g. Aarav Sharma', 'जैसे: आरव शर्मा')}
                  className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  {bi(language, 'WhatsApp Mobile (10-Digit) *', 'व्हाट्सएप मोबाइल (10 अंक) *')}
                </label>
                <input
                  type="tel"
                  required
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-4 py-3 text-sm text-white font-mono placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  {bi(language, 'Email Address', 'ईमेल पता')}
                </label>
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  {bi(language, 'Primary Goal', 'मुख्य फिटनेस लक्ष्य')}
                </label>
                <select
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value)}
                  className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Lean Muscle & Strength">
                    {bi(language, 'Lean Muscle & Strength', 'लीन मसल और स्ट्रेंथ')}
                  </option>
                  <option value="Scientific Fat Loss">
                    {bi(language, 'Scientific Fat Loss', 'साइंटिफिक फैट लॉस')}
                  </option>
                  <option value="Athletic Conditioning & Mobility">
                    {bi(language, 'Athletic Conditioning & Mobility', 'एथलेटिक कंडीशनिंग व मोबिलिटी')}
                  </option>
                  <option value="Metabolic & Diabetic Wellness">
                    {bi(language, 'Metabolic & Diabetic Wellness', 'मेटाबॉलिक व हेल्थ रिकवरी')}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                {bi(language, 'Preferred Package', 'पसंदीदा पैकेज')}
              </label>
              <select
                value={selectedPackageName}
                onChange={(e) => setSelectedPackageName(e.target.value)}
                className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="">
                  {bi(language, 'Free 1-Day Scientific Trial Pass', 'फ्री 1-डे साइंटिफिक ट्रायल पास')}
                </option>
                {displayedPackages.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} — ₹{Number(p.price || 0).toLocaleString('en-IN')} ({p.duration})
                  </option>
                ))}
              </select>
            </div>

            {formError && (
              <div className="flex items-start gap-2.5 rounded-md border border-red-500/40 bg-red-500/10 p-3.5 text-sm text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-start gap-2.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-bold text-sm py-3.5 px-6 rounded-md transition-colors cursor-pointer"
            >
              <span>
                {submitting
                  ? bi(language, 'Registering Inquiry...', 'अनुरोध दर्ज हो रहा है...')
                  : bi(language, 'Submit Scientific Admission Inquiry', 'साइंटिफिक एडमिशन अनुरोध भेजें')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* CLEAN FOOTER WITH MEMBER & ADMIN PORTAL ACCESS */}
      <footer className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 pb-safe">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p
              className="text-xl font-bold uppercase text-white tracking-tight"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              FITNESS <span className="text-amber-400">FUTURE</span> · PRO CLUB APP
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" /> +91 98XXXXXXXX
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> contact@fitnessfuture.in
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> India · Android & iOS Smart App
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenPortalLogin}
              className="px-4 py-2 text-xs font-semibold text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] rounded-md transition-colors cursor-pointer"
            >
              {bi(language, 'Member Portal Login', 'मेंबर पोर्टल लॉगिन')}
            </button>
            <button
              type="button"
              onClick={onOpenPortalLogin}
              className="px-4 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors cursor-pointer"
            >
              {bi(language, 'Admin Portal Login', 'एडमिन पोर्टल लॉगिन')}
            </button>
          </div>
        </div>
      </footer>

      {/* HIGH-RESOLUTION FEATURE PREVIEW LIGHTBOX */}
      {activePreviewModule && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={bi(language, activePreviewModule.en, activePreviewModule.hi)}
          onClick={() => setPreviewModuleNum(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl rounded-xl border border-white/[0.12] bg-[#111114] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-mono text-amber-400 tabular-nums">
                  {activePreviewModule.num} / 18 ·{' '}
                  {bi(
                    language,
                    LANE_LABEL_MAP[activePreviewModule.lane].en,
                    LANE_LABEL_MAP[activePreviewModule.lane].hi
                  )}
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                  {bi(language, activePreviewModule.en, activePreviewModule.hi)}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setPreviewModuleNum(null)}
                aria-label="Close feature preview"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative bg-[#070709] flex items-center justify-center overflow-hidden min-h-[260px] max-h-[62vh]">
              <img
                src={activePreviewModule.image}
                alt={activePreviewModule.alt}
                referrerPolicy="no-referrer"
                className="max-h-[62vh] w-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  const prevIdx =
                    (activePreviewIndex - 1 + ALL_18_MODULE_MEDIA.length) %
                    ALL_18_MODULE_MEDIA.length;
                  setPreviewModuleNum(ALL_18_MODULE_MEDIA[prevIdx].num);
                }}
                aria-label="Previous feature"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white hover:bg-amber-500 hover:text-zinc-950 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextIdx = (activePreviewIndex + 1) % ALL_18_MODULE_MEDIA.length;
                  setPreviewModuleNum(ALL_18_MODULE_MEDIA[nextIdx].num);
                }}
                aria-label="Next feature"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white hover:bg-amber-500 hover:text-zinc-950 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/[0.08] px-5 py-4">
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                {bi(language, activePreviewModule.captionEn, activePreviewModule.captionHi)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setPreviewModuleNum(null);
                  onOpenPortalLogin();
                }}
                className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{bi(language, 'Open in Portal', 'पोर्टल में खोलें')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicGymWebsite;
