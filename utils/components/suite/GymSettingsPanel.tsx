import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RotateCcw,
  Globe,
  MapPin,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { useGym, GymSocialLinks } from '../../context/GymProvider';
import {
  useSocialLinksStore,
  normalizeSocialLink,
  SocialPlatformKey,
} from '../../store/useSocialLinksStore';
import { normalizeSafeExternalUrl } from '../../imageUpload';
import { useToast } from '../../hooks/useToast';
import { View } from '../../../types';

interface GymSettingsPanelProps {
  setCurrentView?: (view: View) => void;
}

interface SocialFieldMeta {
  key: SocialPlatformKey;
  label: string;
  placeholder: string;
  hint: string;
  actionLabel: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SOCIAL_FIELDS: SocialFieldMeta[] = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    placeholder: 'https://wa.me/919876543210 or 9876543210',
    hint: 'Enter a 10-digit WhatsApp number or wa.me / whatsapp.com link',
    actionLabel: 'Chat on WhatsApp',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
    icon: MessageCircle,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/yourgym or @yourgym',
    hint: 'Enter your official Instagram profile URL or @username',
    actionLabel: 'Follow on Instagram',
    accentText: 'text-pink-400',
    accentBg: 'bg-pink-500/10',
    accentBorder: 'border-pink-500/30',
    icon: Instagram,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/yourgympage',
    hint: 'Enter your official Facebook Page URL or page username',
    actionLabel: 'Visit Facebook Page',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    icon: Facebook,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    placeholder: 'https://youtube.com/@yourgymchannel',
    hint: 'Enter your official YouTube channel URL or @handle',
    actionLabel: 'Subscribe on YouTube',
    accentText: 'text-rose-400',
    accentBg: 'bg-rose-500/10',
    accentBorder: 'border-rose-500/30',
    icon: Youtube,
  },
];

const buildInitialInputs = (
  gymLinks: GymSocialLinks | undefined,
  fallbackStorePlatforms: Record<SocialPlatformKey, { url: string; connected: boolean }>
): Record<SocialPlatformKey, string> => {
  const hasGymKey = Boolean(
    gymLinks &&
      (gymLinks.whatsapp !== undefined ||
        gymLinks.instagram !== undefined ||
        gymLinks.facebook !== undefined ||
        gymLinks.youtube !== undefined)
  );

  if (hasGymKey) {
    return {
      whatsapp: gymLinks?.whatsapp || '',
      instagram: gymLinks?.instagram || '',
      facebook: gymLinks?.facebook || '',
      youtube: gymLinks?.youtube || '',
    };
  }

  return {
    whatsapp: fallbackStorePlatforms.whatsapp?.connected ? fallbackStorePlatforms.whatsapp.url : '',
    instagram: fallbackStorePlatforms.instagram?.connected ? fallbackStorePlatforms.instagram.url : '',
    facebook: fallbackStorePlatforms.facebook?.connected ? fallbackStorePlatforms.facebook.url : '',
    youtube: fallbackStorePlatforms.youtube?.connected ? fallbackStorePlatforms.youtube.url : '',
  };
};

export const GymSettingsPanel: React.FC<GymSettingsPanelProps> = ({ setCurrentView }) => {
  const { currentGym, updateGymSocialLinks } = useGym();
  const gymSocialProfile = useSocialLinksStore((s) => s.profiles.gym);
  const { addToast } = useToast();

  const [inputs, setInputs] = useState<Record<SocialPlatformKey, string>>(() =>
    buildInitialInputs(currentGym.socialLinks, gymSocialProfile.platforms)
  );
  const [touched, setTouched] = useState<Partial<Record<SocialPlatformKey, boolean>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // Keep form synced whenever active gym changes
  useEffect(() => {
    setInputs(buildInitialInputs(currentGym.socialLinks, gymSocialProfile.platforms));
    setTouched({});
    setSavedBanner(null);
  }, [currentGym.gymId, currentGym.socialLinks]);

  const validations = useMemo(() => {
    const map: Record<
      SocialPlatformKey,
      { valid: boolean; normalizedUrl: string; handle: string; error?: string }
    > = {
      whatsapp: { valid: true, normalizedUrl: '', handle: '' },
      instagram: { valid: true, normalizedUrl: '', handle: '' },
      facebook: { valid: true, normalizedUrl: '', handle: '' },
      youtube: { valid: true, normalizedUrl: '', handle: '' },
    };

    for (const meta of SOCIAL_FIELDS) {
      const raw = inputs[meta.key].trim();
      if (!raw) {
        map[meta.key] = { valid: true, normalizedUrl: '', handle: '' };
        continue;
      }
      const res = normalizeSocialLink(meta.key, raw);
      map[meta.key] = {
        valid: res.valid,
        normalizedUrl: res.url,
        handle: res.handle,
        error: res.error,
      };
    }
    return map;
  }, [inputs]);

  const hasValidationErrors = SOCIAL_FIELDS.some(
    (f) => inputs[f.key].trim().length > 0 && !validations[f.key].valid
  );

  const connectedPreviewChannels = SOCIAL_FIELDS.filter(
    (f) => validations[f.key].valid && Boolean(validations[f.key].normalizedUrl)
  );

  const handleInputChange = (key: SocialPlatformKey, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
    if (savedBanner) setSavedBanner(null);
  };

  const handleReset = () => {
    setInputs(buildInitialInputs(currentGym.socialLinks, gymSocialProfile.platforms));
    setTouched({});
    setSavedBanner(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ whatsapp: true, instagram: true, facebook: true, youtube: true });

    if (hasValidationErrors) {
      addToast('Please fix the highlighted social media link before saving.', 'error');
      return;
    }

    setIsSaving(true);
    setSavedBanner(null);
    try {
      const payload: GymSocialLinks = {
        whatsapp: validations.whatsapp.normalizedUrl || '',
        instagram: validations.instagram.normalizedUrl || '',
        facebook: validations.facebook.normalizedUrl || '',
        youtube: validations.youtube.normalizedUrl || '',
      };

      await updateGymSocialLinks(payload);
      setInputs({
        whatsapp: payload.whatsapp || '',
        instagram: payload.instagram || '',
        facebook: payload.facebook || '',
        youtube: payload.youtube || '',
      });

      const activeCount = Object.values(payload).filter(Boolean).length;
      const msg =
        activeCount > 0
          ? `Saved ${activeCount} social media ${activeCount === 1 ? 'link' : 'links'} to the gym configuration database and updated the public profile.`
          : 'Cleared social media links from the gym configuration database and public profile.';
      setSavedBanner(msg);
      addToast('Social media links saved to gym configuration.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to save social media links.';
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const safeMapUrl = normalizeSafeExternalUrl(currentGym.googleLocationUrl || '');

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1 max-w-2xl">
          <p className="text-xs font-medium text-amber-400">
            Gym Management Settings · Configuration Database
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
            Gym Settings &amp; Integrations
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Manage your active gym configuration and connect official social media channels reflected directly on your public gym profile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {setCurrentView && (
            <>
              <button
                type="button"
                onClick={() => setCurrentView('gymRegistration')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Edit Gym Registration
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('publicProfile')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                View Public Profile
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Gym Configuration Summary Strip */}
      <section className="rounded-xl border border-white/10 bg-[#111318] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {currentGym.logoUrl ? (
                <img
                  src={currentGym.logoUrl}
                  alt={currentGym.gymName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Building2 className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white truncate">
                {currentGym.gymName || 'Fitness Future'}
              </h2>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {currentGym.ownerName || 'Gym Owner'}
                {' · '}
                {currentGym.email || 'owner@fitnessfuture.in'}
                {currentGym.phone ? ` · ${currentGym.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-300">
            <div>
              <span className="text-zinc-500">UPI ID: </span>
              <span className="font-mono text-emerald-400">
                {currentGym.paymentUpiId || currentGym.upiId || 'Not configured'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Connected Channels: </span>
              <span className="font-mono tabular-nums font-semibold text-white">
                {connectedPreviewChannels.length} / 4
              </span>
            </div>
            {safeMapUrl && (
              <a
                href={safeMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap"
              >
                <MapPin className="w-3.5 h-3.5" />
                Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Social Media Integration Section + Live Public Profile Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Social Media Integration Form */}
        <form
          onSubmit={handleSave}
          noValidate
          className="xl:col-span-7 rounded-xl border border-white/10 bg-[#111318] p-6 space-y-6"
        >
          <div className="border-b border-white/10 pb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Social Media Integration
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Add your WhatsApp, Instagram, Facebook, and YouTube links. Saved URLs are stored in the gym configuration database and published automatically on your public profile.
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs text-zinc-400 whitespace-nowrap shrink-0 pt-0.5">
              {connectedPreviewChannels.length} / 4 active
            </span>
          </div>

          {savedBanner && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{savedBanner}</span>
            </div>
          )}

          <div className="space-y-5">
            {SOCIAL_FIELDS.map((field) => {
              const Icon = field.icon;
              const rawVal = inputs[field.key];
              const validation = validations[field.key];
              const showError = Boolean(rawVal.trim()) && !validation.valid && Boolean(touched[field.key]);
              const isValidConnected = Boolean(rawVal.trim()) && validation.valid;

              return (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={`social-input-${field.key}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-zinc-200"
                    >
                      <Icon className={`w-4 h-4 ${field.accentText}`} />
                      <span>{field.label} Link</span>
                    </label>
                    <span className="text-xs text-zinc-500">
                      {isValidConnected ? (
                        <span className="text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : showError ? (
                        <span className="text-red-400 inline-flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Invalid format
                        </span>
                      ) : (
                        'Optional'
                      )}
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      id={`social-input-${field.key}`}
                      type="text"
                      value={rawVal}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, [field.key]: true }))}
                      placeholder={field.placeholder}
                      aria-invalid={showError}
                      aria-describedby={showError ? `social-err-${field.key}` : undefined}
                      className={`w-full rounded-lg border bg-zinc-900/90 px-3.5 py-2.5 pr-9 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${
                        showError
                          ? 'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                          : isValidConnected
                            ? 'border-emerald-500/45 focus:border-emerald-400 focus:ring-emerald-400'
                            : 'border-white/15 focus:border-amber-400 focus:ring-amber-400'
                      }`}
                    />
                    {rawVal.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleInputChange(field.key, '')}
                        aria-label={`Clear ${field.label} link`}
                        className="absolute right-2.5 p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {showError ? (
                    <p
                      id={`social-err-${field.key}`}
                      className="text-xs text-red-400 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{validation.error}</span>
                    </p>
                  ) : isValidConnected ? (
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                      <span className="truncate font-mono text-[11px] text-zinc-400">
                        Will save as: <span className="text-zinc-200">{validation.normalizedUrl}</span>
                      </span>
                      <a
                        href={validation.normalizedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${field.accentText} hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0`}
                      >
                        Test Link
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">{field.hint}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={isSaving || hasValidationErrors}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving to Configuration...' : 'Save Social Links'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Changes
            </button>
          </div>
        </form>

        {/* Right: Live Public Profile Reflection Preview */}
        <aside className="xl:col-span-5 rounded-xl border border-white/10 bg-[#111318] p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Public Profile Preview</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                How visitors and members see your social channels
              </p>
            </div>
            {setCurrentView && (
              <button
                type="button"
                onClick={() => setCurrentView('publicProfile')}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                Open Full View
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Public Profile Identity Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {currentGym.logoUrl ? (
                <img
                  src={currentGym.logoUrl}
                  alt={currentGym.gymName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Building2 className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {currentGym.gymName || 'Fitness Future'}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {currentGym.address || 'Official Public Gym Profile'}
              </p>
            </div>
          </div>

          {/* Connected Social Links List */}
          {connectedPreviewChannels.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 bg-zinc-950/60 p-6 text-center space-y-1.5">
              <p className="text-sm font-medium text-zinc-300">
                No social media channels linked yet
              </p>
              <p className="text-xs text-zinc-500">
                Enter your WhatsApp, Instagram, Facebook, or YouTube links on the left and save to publish them on your public profile.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10 border border-white/10 rounded-lg overflow-hidden bg-zinc-950/70">
              {connectedPreviewChannels.map((field) => {
                const Icon = field.icon;
                const val = validations[field.key];
                return (
                  <a
                    key={field.key}
                    href={val.normalizedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg ${field.accentBg} ${field.accentText} flex items-center justify-center shrink-0`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white">{field.label}</div>
                        <div className="text-xs text-zinc-400 truncate">
                          {val.handle || val.normalizedUrl}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-white inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                      {field.actionLabel}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </a>
                );
              })}
            </div>
          )}

          <p className="text-xs text-zinc-500 leading-relaxed">
            Changes saved here persist in IndexedDB and Cloud Firestore and automatically reflect on the Public Profile, Member Portal, and Social Connect Hub.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default GymSettingsPanel;
