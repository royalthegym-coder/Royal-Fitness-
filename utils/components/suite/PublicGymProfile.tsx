import React, { useMemo, useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  ExternalLink,
  Settings,
  Play,
  Check,
} from 'lucide-react';
import { useGym } from '../../context/GymProvider';
import { useData } from '../../context/DataProvider';
import {
  useSocialLinksStore,
  normalizeSocialLink,
  SocialPlatformKey,
  SocialVideoItem,
} from '../../store/useSocialLinksStore';
import { normalizeSafeExternalUrl } from '../../imageUpload';
import { View } from '../../../types';

interface PublicGymProfileProps {
  setCurrentView?: (view: View) => void;
}

const SOCIAL_CHANNELS: {
  key: SocialPlatformKey;
  label: string;
  cta: string;
  accentText: string;
  accentBg: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    cta: 'Chat on WhatsApp',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    icon: MessageCircle,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    cta: 'View Instagram',
    accentText: 'text-pink-400',
    accentBg: 'bg-pink-500/10',
    icon: Instagram,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    cta: 'Visit Facebook',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    icon: Facebook,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    cta: 'Open Channel',
    accentText: 'text-rose-400',
    accentBg: 'bg-rose-500/10',
    icon: Youtube,
  },
];

export const PublicGymProfile: React.FC<PublicGymProfileProps> = ({ setCurrentView }) => {
  const { currentGym } = useGym();
  const { packages } = useData();
  const gymSocialProfile = useSocialLinksStore((s) => s.profiles.gym);

  const [selectedVideo, setSelectedVideo] = useState<SocialVideoItem | null>(
    gymSocialProfile.videos[0] || null
  );

  // Resolve social links directly from gym configuration database, falling back cleanly to social store if unconfigured
  const resolvedSocialLinks = useMemo(() => {
    const configLinks = currentGym.socialLinks;
    const hasExplicitConfig = Boolean(
      configLinks &&
        (configLinks.whatsapp !== undefined ||
          configLinks.instagram !== undefined ||
          configLinks.facebook !== undefined ||
          configLinks.youtube !== undefined)
    );

    return SOCIAL_CHANNELS.map((channel) => {
      const raw = hasExplicitConfig
        ? configLinks?.[channel.key] || ''
        : gymSocialProfile.platforms[channel.key]?.connected
          ? gymSocialProfile.platforms[channel.key].url
          : '';

      if (!raw.trim()) return null;
      const parsed = normalizeSocialLink(channel.key, raw);
      if (!parsed.valid || !parsed.url) return null;

      return {
        ...channel,
        url: parsed.url,
        handle: parsed.handle,
      };
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [currentGym.socialLinks, gymSocialProfile.platforms]);

  const safeMapUrl = normalizeSafeExternalUrl(currentGym.googleLocationUrl || '');
  const activeVideo =
    selectedVideo && gymSocialProfile.videos.some((v) => v.id === selectedVideo.id)
      ? selectedVideo
      : gymSocialProfile.videos[0] || null;

  return (
    <div className="space-y-8 pb-10">
      {/* Public Gym Identity Header */}
      <section className="rounded-xl border border-white/10 bg-[#111318] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
            <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {currentGym.logoUrl ? (
                <img
                  src={currentGym.logoUrl}
                  alt={currentGym.gymName || 'Gym logo'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <Building2 className="w-7 h-7 text-amber-400" />
              )}
            </div>

            <div className="min-w-0 space-y-1.5">
              <p className="text-xs font-medium text-amber-400">Official Public Profile</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
                {currentGym.gymName || 'Fitness Future'}
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                {gymSocialProfile.bio}
              </p>
            </div>
          </div>

          {setCurrentView && (
            <button
              type="button"
              onClick={() => setCurrentView('settings')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors whitespace-nowrap shrink-0 self-start cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              Edit Social Links in Settings
            </button>
          )}
        </div>

        {/* Contact & Location Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <div className="text-zinc-500">Gym Owner</div>
            <div className="font-medium text-zinc-200">
              {currentGym.ownerName || 'Gym Management'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-zinc-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Contact Number
            </div>
            <div className="font-mono tabular-nums font-medium text-zinc-200">
              {currentGym.phone || 'Available at front desk'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-zinc-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email
            </div>
            <div className="font-medium text-zinc-200 truncate">
              {currentGym.email || 'contact@fitnessfuture.in'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-zinc-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Location
            </div>
            {safeMapUrl ? (
              <a
                href={safeMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 truncate max-w-full"
              >
                <span className="truncate">{currentGym.address || 'Open on Google Maps'}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ) : (
              <div className="font-medium text-zinc-200 truncate">
                {currentGym.address || 'Main Branch'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Official Social Media Channels (Reflected from Gym Configuration DB) */}
      <section className="rounded-xl border border-white/10 bg-[#111318] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Connect With Us</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Official social media profiles synced from the gym configuration database
            </p>
          </div>
          <span className="font-mono tabular-nums text-xs text-zinc-400">
            {resolvedSocialLinks.length} connected
          </span>
        </div>

        {resolvedSocialLinks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/15 bg-zinc-950/60 py-10 px-6 text-center space-y-3">
            <p className="text-sm font-medium text-zinc-200">
              No social media links published yet
            </p>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Add WhatsApp, Instagram, Facebook, or YouTube links in Gym Management Settings to display them here on the public profile.
            </p>
            {setCurrentView && (
              <button
                type="button"
                onClick={() => setCurrentView('settings')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                Configure Social Links
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {resolvedSocialLinks.map((channel) => {
              const Icon = channel.icon;
              return (
                <a
                  key={channel.key}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-white/10 bg-zinc-950/70 hover:border-white/25 p-4 flex flex-col justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-lg ${channel.accentBg} ${channel.accentText} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">{channel.label}</div>
                    <div className={`text-xs ${channel.accentText} truncate mt-0.5`}>
                      {channel.handle}
                    </div>
                  </div>

                  <div className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200">
                    {channel.cta}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured Gym Videos + Membership Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Official Videos */}
        <section className="lg:col-span-7 rounded-xl border border-white/10 bg-[#111318] p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">Featured Gym Videos</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Workout demonstrations and announcements from our trainers
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs text-zinc-400">
              {gymSocialProfile.videos.length} videos
            </span>
          </div>

          {activeVideo ? (
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-white/10">
                <iframe
                  key={activeVideo.videoId}
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?rel=0`}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400">{activeVideo.category}</p>
                  <h3 className="text-sm font-semibold text-white mt-0.5">{activeVideo.title}</h3>
                </div>
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 whitespace-nowrap"
                >
                  Watch on YouTube
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {gymSocialProfile.videos.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                  {gymSocialProfile.videos.map((vid) => {
                    const selected = vid.id === activeVideo.id;
                    return (
                      <button
                        key={vid.id}
                        type="button"
                        onClick={() => setSelectedVideo(vid)}
                        className={`text-left p-2 rounded-lg border flex items-center gap-2.5 transition-colors cursor-pointer ${
                          selected
                            ? 'border-amber-500/50 bg-amber-500/10'
                            : 'border-white/10 bg-zinc-950/60 hover:border-white/20'
                        }`}
                      >
                        <div className="relative w-16 h-10 rounded overflow-hidden bg-black shrink-0">
                          <img
                            src={`https://i.ytimg.com/vi/${vid.videoId}/mqdefault.jpg`}
                            alt={vid.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                            <Play className="w-3 h-3 text-white fill-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">{vid.title}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{vid.category}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 py-6 text-center">
              No featured videos added yet.
            </p>
          )}
        </section>

        {/* Membership Packages Snapshot */}
        <section className="lg:col-span-5 rounded-xl border border-white/10 bg-[#111318] p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Membership Plans</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Current plans offered at {currentGym.gymName || 'Fitness Future'}
            </p>
          </div>

          <div className="divide-y divide-white/10 border border-white/10 rounded-lg overflow-hidden bg-zinc-950/60">
            {packages.slice(0, 4).map((pkg) => (
              <div key={pkg.id} className="p-4 space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{pkg.name}</h3>
                    <p className="text-xs text-zinc-400">
                      {pkg.duration} · {pkg.category}
                    </p>
                  </div>
                  <div className="font-mono tabular-nums text-base font-bold text-amber-400 shrink-0">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </div>
                </div>
                {pkg.features && pkg.features.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {pkg.features.slice(0, 3).map((feat, idx) => (
                      <li key={idx} className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PublicGymProfile;
