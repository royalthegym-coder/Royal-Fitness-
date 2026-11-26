import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, Mail, Lock, Phone, MapPin, User,
  CreditCard, Sparkles, CheckCircle2, AlertCircle,
  ArrowRight, ArrowLeft, RefreshCw, Smartphone,
  KeyRound, Cpu, ShieldAlert, Check, Upload, PenTool,
  ExternalLink, Trash2, Navigation
} from 'lucide-react';
import { useTenantStore, GymTenant } from '../../store/useTenantStore';
import { useGym, tenantToGymConfig } from '../../context/GymProvider';
import { useToast } from '../../hooks/useToast';
import { compressImageFile, normalizeSafeExternalUrl } from '../../imageUpload';

interface SaaSAdminOnboardingProps {
  onOnboardComplete?: (tenant: GymTenant) => void;
  onBackToDashboard?: () => void;
}

export const SaaSAdminOnboarding: React.FC<SaaSAdminOnboardingProps> = ({
  onOnboardComplete,
  onBackToDashboard
}) => {
  const { addToast } = useToast();
  const { registerGymConfig } = useGym();
  const registerTenant = useTenantStore(state => state.registerTenant);
  const loading = useTenantStore(state => state.loading);
  const loadingMessage = useTenantStore(state => state.loadingMessage);
  const error = useTenantStore(state => state.error);
  const successMessage = useTenantStore(state => state.successMessage);
  const clearMessages = useTenantStore(state => state.clearMessages);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gymName: '',
    ownerName: '',
    email: '',
    password: '',
    phoneNumber: '',
    location: '',
    googleLocationUrl: '',
    whatsappPhoneId: '',
    upiId: '',
    logoUrl: '',
    signatureUrl: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleImageUpload = async (
    field: 'logoUrl' | 'signatureUrl',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: field === 'signatureUrl' ? 520 : 420,
        maxHeight: field === 'signatureUrl' ? 200 : 420,
        quality: 0.88,
        preserveAlpha: true,
      });
      setFormData(prev => ({ ...prev, [field]: compressed }));
      clearFieldError(field);
      addToast(
        field === 'logoUrl' ? 'Gym Logo uploaded successfully!' : 'Gym Owner Signature uploaded successfully!',
        'success'
      );
    } catch (err: any) {
      addToast(err?.message || 'Failed to process image file.', 'error');
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const errors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.gymName.trim()) {
        errors.gymName = 'Gym name is required.';
      } else if (formData.gymName.trim().length < 2) {
        errors.gymName = 'Gym name must be at least 2 characters.';
      }

      if (!formData.ownerName.trim()) {
        errors.ownerName = 'Gym owner name is required.';
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        errors.email = 'Gym owner email ID is required.';
      } else if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please provide a valid email address.';
      }

      if (!formData.password) {
        errors.password = 'A secure password is required.';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
      }

      if (!formData.logoUrl) {
        errors.logoUrl = 'Please upload the Gym Logo (used on receipts & member portal).';
      }

      if (!formData.signatureUrl) {
        errors.signatureUrl = 'Please upload the Gym Owner Signature (used on official receipts).';
      }
    }

    if (stepNumber === 2) {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!formData.phoneNumber.trim()) {
        errors.phoneNumber = 'Owner mobile number is required.';
      } else if (!phoneRegex.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
        errors.phoneNumber = 'Enter a valid 10-15 digit mobile number (e.g. +919876543210).';
      }

      if (!formData.location.trim()) {
        errors.location = 'Physical gym address is required for receipts.';
      }

      if (!formData.googleLocationUrl.trim()) {
        errors.googleLocationUrl = 'Google Location link (Google Maps URL) is required.';
      }
    }

    if (stepNumber === 3) {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!formData.upiId.trim()) {
        errors.upiId = 'Gym UPI ID is mandatory for receipts & member payments.';
      } else if (!upiRegex.test(formData.upiId.trim())) {
        errors.upiId = 'Invalid UPI ID format (e.g. gymname@okaxis or 9876543210@ybl).';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    } else {
      addToast('Please fill all required gym details before proceeding.', 'error');
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) {
      addToast('Please enter a valid UPI ID to complete gym setup.', 'error');
      return;
    }

    const normalizedMapsUrl = normalizeSafeExternalUrl(formData.googleLocationUrl);
    const tenant = await registerTenant({
      gymName: formData.gymName,
      ownerName: formData.ownerName,
      adminName: formData.ownerName,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
      location: formData.location,
      googleLocationUrl: normalizedMapsUrl,
      logoUrl: formData.logoUrl,
      signatureUrl: formData.signatureUrl,
      whatsappPhoneId: formData.whatsappPhoneId || formData.phoneNumber,
      upiId: formData.upiId,
    });

    if (tenant) {
      registerGymConfig(tenantToGymConfig(tenant));
      addToast(`Gym "${formData.gymName}" created! Receipts & Member Portal are now linked to ${formData.ownerName}.`, 'success');
      if (onOnboardComplete) {
        setTimeout(() => {
          onOnboardComplete(tenant);
        }, 1200);
      }
    } else {
      addToast('Gym provisioning failed. Please check details and try again.', 'error');
    }
  };

  const safePreviewMapsUrl = normalizeSafeExternalUrl(formData.googleLocationUrl);

  return (
    <div className="bg-black/80 backdrop-blur-3xl border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(79,70,229,0.15)] relative overflow-hidden max-w-4xl mx-auto">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Cpu className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">New Gym Registration Console</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
            ADD NEW <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">GYM &amp; OWNER PORTAL</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gym Logo, Owner Signature, UPI ID &amp; Google Location automatically power official receipts and the Member Portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-400 transition-colors uppercase tracking-wider font-bold"
            >
              Control Center
            </button>
          )}
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
        {[
          { icon: Building2, title: 'Owner, Logo & Sign', desc: 'Identity & Branding' },
          { icon: MapPin, title: 'Mobile & Location', desc: 'Address & Google Maps' },
          { icon: CreditCard, title: 'UPI & Receipt Preview', desc: 'Payments & Portal' }
        ].map((item, idx) => {
          const num = idx + 1;
          const isActive = step === num;
          const isCompleted = step > num;
          return (
            <div
              key={num}
              className={`p-4 rounded-2xl border transition-all relative ${
                isActive
                  ? 'bg-zinc-900 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                  : isCompleted
                    ? 'bg-indigo-950/20 border-indigo-500/20'
                    : 'bg-zinc-950/50 border-zinc-900 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                  isActive
                    ? 'bg-indigo-500 text-black border-indigo-400'
                    : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4 text-emerald-400" /> : <item.icon className="w-4 h-4" />}
                </div>
                <div className="hidden sm:block">
                  <h4 className={`text-xs font-black uppercase tracking-wider leading-none ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                    Step 0{num}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">{item.title}</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 rounded-b-2xl overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isActive ? 'w-1/2 bg-indigo-500' : isCompleted ? 'w-full bg-emerald-500' : 'w-0'}`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Process Forms */}
      <div className="relative z-10 bg-zinc-950/40 border border-zinc-900 p-6 rounded-3xl min-h-[340px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12 text-center min-h-[250px]"
            >
              <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mb-6" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono animate-pulse">{loadingMessage}</h3>
              <p className="text-xs text-zinc-500 mt-2 font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" /> Syncing Gym Branding, Receipt Signature &amp; Member Portal...
              </p>
            </motion.div>
          ) : successMessage ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-8 text-center min-h-[250px]"
            >
              <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider italic">Gym &amp; Member Portal Activated</h3>
              <p className="text-sm text-zinc-300 max-w-md mt-3 leading-relaxed">{successMessage}</p>
              <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm mx-auto text-left font-mono text-[10px] text-zinc-400 space-y-1">
                <p>GYM_ID: <span className="text-indigo-400">{(useTenantStore.getState().currentTenant as any)?.gym_id}</span></p>
                <p>OWNER: <span className="text-white">{formData.ownerName}</span></p>
                <p>UPI_ID: <span className="text-emerald-400">{formData.upiId}</span></p>
                <p>RECEIPT &amp; PORTAL: <span className="text-amber-400">LOGO + SIGNATURE BOUND</span></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  if (onBackToDashboard) onBackToDashboard();
                }}
                className="mt-6 px-6 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white tracking-widest uppercase hover:bg-zinc-800 transition-colors"
              >
                Launch Tenant Console
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" /> Gym Owner Identity, Logo &amp; Signature
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Enter the Gym Name, Gym Owner Name, Email ID, and upload the official Gym Logo and Owner Signature for receipts.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Gym Name *</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={formData.gymName}
                          onChange={e => handleChange('gymName', e.target.value)}
                          className={`w-full bg-black/50 border ${validationErrors.gymName ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-indigo-500'} rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm`}
                          placeholder="e.g. Fitness Future Studio"
                        />
                      </div>
                      {validationErrors.gymName && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {validationErrors.gymName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Gym Owner Name *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={formData.ownerName}
                          onChange={e => handleChange('ownerName', e.target.value)}
                          className={`w-full bg-black/50 border ${validationErrors.ownerName ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-indigo-500'} rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm`}
                          placeholder="e.g. Vikram Sharma"
                        />
                      </div>
                      {validationErrors.ownerName && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {validationErrors.ownerName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Gym Owner Email ID *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => handleChange('email', e.target.value)}
                          className={`w-full bg-black/50 border ${validationErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-indigo-500'} rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm`}
                          placeholder="owner@yourgym.com"
                        />
                      </div>
                      {validationErrors.email && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {validationErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Admin Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="password"
                          value={formData.password}
                          onChange={e => handleChange('password', e.target.value)}
                          className={`w-full bg-black/50 border ${validationErrors.password ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-indigo-500'} rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm`}
                          placeholder="Minimum 6 characters"
                        />
                      </div>
                      {validationErrors.password && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {validationErrors.password}</p>
                      )}
                    </div>
                  </div>

                  {/* Logo & Owner Signature Upload Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-indigo-400" /> Gym Logo Upload *
                      </label>
                      <div className={`relative border-2 border-dashed rounded-2xl p-4 bg-black/50 transition-colors ${validationErrors.logoUrl ? 'border-red-500/60' : 'border-zinc-800 hover:border-indigo-500/60'}`}>
                        {formData.logoUrl ? (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img src={formData.logoUrl} alt="Gym Logo Preview" className="w-14 h-14 rounded-xl object-contain bg-white p-1 border border-zinc-700" />
                              <div>
                                <p className="text-xs font-bold text-emerald-400">Logo Ready</p>
                                <p className="text-[10px] text-zinc-500">Will appear on receipts &amp; portal</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleChange('logoUrl', '')}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Remove Logo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center py-3 cursor-pointer text-center">
                            <Upload className="w-6 h-6 text-indigo-400 mb-1.5" />
                            <span className="text-xs font-bold text-zinc-300">Click to Upload Gym Logo</span>
                            <span className="text-[10px] text-zinc-500 mt-0.5">PNG, JPG, WebP (Auto-optimized)</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleImageUpload('logoUrl', e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      {validationErrors.logoUrl && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {validationErrors.logoUrl}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-pink-400" /> Gym Owner Signature Upload *
                      </label>
                      <div className={`relative border-2 border-dashed rounded-2xl p-4 bg-black/50 transition-colors ${validationErrors.signatureUrl ? 'border-red-500/60' : 'border-zinc-800 hover:border-pink-500/60'}`}>
                        {formData.signatureUrl ? (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-28 rounded-xl bg-white p-1.5 border border-zinc-700 flex items-center justify-center">
                                <img src={formData.signatureUrl} alt="Owner Signature Preview" className="max-h-full max-w-full object-contain" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-emerald-400">Signature Ready</p>
                                <p className="text-[10px] text-zinc-500">Printed on member receipts</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleChange('signatureUrl', '')}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Remove Signature"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center py-3 cursor-pointer text-center">
                            <PenTool className="w-6 h-6 text-pink-400 mb-1.5" />
                            <span className="text-xs font-bold text-zinc-300">Click to Upload Owner Signature</span>
                            <span className="text-[10px] text-zinc-500 mt-0.5">Transparent PNG or signed paper scan</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleImageUpload('signatureUrl', e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      {validationErrors.signatureUrl && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {validationErrors.signatureUrl}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400" /> Mobile Number, Address &amp; Google Location
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Provide the Owner Mobile Number, full address, and Google Maps Location link for receipts and Member Portal navigation.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Gym Owner Mobile Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={e => handleChange('phoneNumber', e.target.value)}
                          className={`w-full bg-black/50 border ${validationErrors.phoneNumber ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-indigo-500'} rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm`}
                          placeholder="e.g. +919876543210"
                        />
                      </div>
                      {validationErrors.phoneNumber && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {validationErrors.phoneNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Google Location Link (Google Maps URL) *</label>
                      <div className="relative">
                        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                        <input
                          type="text"
                          value={formData.googleLocationUrl}
                          onChange={e => handleChange('googleLocationUrl', e.target.value)}
                          className={`w-full bg-black/50 border ${validationErrors.googleLocationUrl ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-indigo-500'} rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm`}
                          placeholder="https://maps.app.goo.gl/... or Google Maps link"
                        />
                      </div>
                      {safePreviewMapsUrl && (
                        <a
                          href={safePreviewMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline mt-1.5 font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" /> Verify Google Location Link
                        </a>
                      )}
                      {validationErrors.googleLocationUrl && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {validationErrors.googleLocationUrl}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Full Physical Gym Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 w-4 h-4 text-zinc-500" />
                        <textarea
                          rows={3}
                          value={formData.location}
                          onChange={e => handleChange('location', e.target.value)}
                          className={`w-full bg-black/50 border ${validationErrors.location ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-indigo-500'} rounded-xl p-4 pl-12 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm`}
                          placeholder="Complete street address, city, state & PIN code (shown on receipts)"
                        />
                      </div>
                      {validationErrors.location && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {validationErrors.location}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-400" /> UPI Payment ID &amp; Live Receipt Preview
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Set the Gym UPI ID for member fee QR codes &amp; confirm how your branded receipt will look.
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
                      <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Gym UPI ID *</label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={formData.upiId}
                          onChange={e => handleChange('upiId', e.target.value)}
                          className={`w-full bg-black/50 border ${validationErrors.upiId ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-indigo-500'} rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm`}
                          placeholder="e.g. yourgym@okaxis"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-500 font-mono mt-1">All member UPI QR codes &amp; receipts route directly here.</p>
                      {validationErrors.upiId && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {validationErrors.upiId}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">WhatsApp Phone / ID (Optional)</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={formData.whatsappPhoneId}
                          onChange={e => handleChange('whatsappPhoneId', e.target.value)}
                          className="w-full bg-black/50 border border-zinc-800 focus:border-indigo-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                          placeholder={formData.phoneNumber || 'Defaults to Owner Mobile Number'}
                        />
                      </div>
                      <p className="text-[9px] text-zinc-500 font-mono mt-1">Leave blank to use Owner Mobile Number automatically.</p>
                    </div>
                  </div>

                  {/* Live Receipt & Portal Identity Preview Card */}
                  <div className="rounded-2xl bg-white text-slate-900 p-5 border border-zinc-700 shadow-xl">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-3">
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                            {(formData.gymName || 'G').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-slate-900">{formData.gymName || 'Your Gym Name'}</p>
                          <p className="text-[11px] text-slate-600 font-semibold">Owner: {formData.ownerName || 'Owner Name'}</p>
                          <p className="text-[10px] text-slate-500">{formData.location || 'Gym Address'}</p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                        <p className="font-bold uppercase text-indigo-700">Receipt Preview</p>
                        <p>{formData.phoneNumber}</p>
                        <p>{formData.email}</p>
                        <p className="font-mono font-bold text-emerald-700">UPI: {formData.upiId || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between pt-3">
                      <div className="text-[10px] text-slate-500">
                        <p className="font-bold text-slate-700">Member Portal Bound To Owner</p>
                        <p className="truncate max-w-[260px]">Maps: {formData.googleLocationUrl || '—'}</p>
                      </div>
                      <div className="text-right">
                        {formData.signatureUrl && (
                          <img src={formData.signatureUrl} alt="Owner Signature" className="h-10 max-w-[140px] object-contain ml-auto mb-1" />
                        )}
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 border-t border-slate-300 pt-1">
                          Authorized Signatory • {formData.ownerName || 'Owner'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Control Buttons Footer */}
              <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center bg-black/30 -mx-6 -mb-6 p-6 rounded-b-3xl">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2 ${
                    step === 1 ? 'opacity-0 pointer-events-none' : ''
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)]"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-xl text-xs font-black transition-all uppercase tracking-widest flex items-center gap-2 shadow-[0_0_25px_rgba(99,102,241,0.4)]"
                  >
                    Create Gym &amp; Activate Portal <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
