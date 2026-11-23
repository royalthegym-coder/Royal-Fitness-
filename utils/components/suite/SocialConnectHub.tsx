import React, { useState } from 'react';
import {
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Link2,
  CheckCircle2,
  ExternalLink,
  Play,
  Plus,
  Trash2,
  Unlink,
  Building2,
  ShieldCheck,
  Eye,
  Settings2,
} from 'lucide-react';
import {
  useSocialLinksStore,
  normalizeSocialLink,
  SocialPlatformKey,
  SocialProfileScope,
  SocialVideoItem,
} from '../../store/useSocialLinksStore';
import { useGym } from '../../context/GymProvider';
import { useToast } from '../../hooks/useToast';

const PLATFORM_META: {
  key: SocialPlatformKey;
  label: string;
  placeholder: string;
  helper: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    placeholder: '9876543210 or https://wa.me/919876543210',
    helper: 'Paste 10-digit WhatsApp number or wa.me link',
    accentBg: 'bg-emerald-500/15',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/30',
    icon: MessageCircle,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: '@yourgym or https://instagram.com/yourgym',
    helper: 'Paste Instagram profile URL or @username',
    accentBg: 'bg-pink-500/15',
    accentText: 'text-pink-400',
    accentBorder: 'border-pink-500/30',
    icon: Instagram,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/yourgympage',
    helper: 'Paste Facebook page URL or username',
    accentBg: 'bg-blue-500/15',
    accentText: 'text-blue-400',
    accentBorder: 'border-blue-500/30',
    icon: Facebook,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    placeholder: 'https://youtube.com/@yourgymchannel',
    helper: 'Paste YouTube channel URL or @handle',
    accentBg: 'bg-rose-500/15',
    accentText: 'text-rose-400',
    accentBorder: 'border-rose-500/30',
    icon: Youtube,
  },
];

/**
 * Reusable Customer-Facing Showcase for viewing Gym & Super Admin social profiles and watching videos in-app.
 * Used both inside SocialConnectHub ("Customer View" tab) and directly inside Member Portal.
 */
export const CustomerSocialShowcase: React.FC = () => {
  const { profiles } = useSocialLinksStore();
  const { currentGym } = useGym();

  const [activeScope, setActiveScope] = useState<SocialProfileScope>('gym');
  const currentProfile = profiles[activeScope];
  const [selectedVideo, setSelectedVideo] = useState<SocialVideoItem | null>(
    profiles.gym.videos[0] || null
  );

  const handleScopeChange = (scope: SocialProfileScope) => {
    setActiveScope(scope);
    setSelectedVideo(profiles[scope].videos[0] || null);
  };

  const profileTitle =
    activeScope === 'gym'
      ? currentGym?.gymName || currentProfile.displayName
      : currentProfile.displayName;

  const hasExplicitGymSocialConfig = Boolean(
    activeScope === 'gym' &&
      currentGym?.socialLinks &&
      (currentGym.socialLinks.whatsapp !== undefined ||
        currentGym.socialLinks.instagram !== undefined ||
        currentGym.socialLinks.facebook !== undefined ||
        currentGym.socialLinks.youtube !== undefined)
  );

  const getResolvedPlatformLink = (key: SocialPlatformKey) => {
    if (hasExplicitGymSocialConfig) {
      const raw = currentGym.socialLinks?.[key] || '';
      if (!raw.trim()) return { connected: false, url: '', handle: '' };
      const parsed = normalizeSocialLink(key, raw);
      return parsed.valid
        ? { connected: true, url: parsed.url, handle: parsed.handle }
        : { connected: false, url: '', handle: '' };
    }
    const stored = currentProfile.platforms[key];
    return {
      connected: Boolean(stored?.connected && stored?.url),
      url: stored?.url || '',
      handle: stored?.handle || '',
    };
  };

  const connectedPlatforms = PLATFORM_META.filter((p) => getResolvedPlatformLink(p.key).connected);

  const playingVideo =
    selectedVideo && currentProfile.videos.some((v) => v.id === selectedVideo.id)
      ? selectedVideo
      : currentProfile.videos[0] || null;

  return (
    <div className="space-y-6">
      {/* Scope Switcher: Gym Profile vs Super Admin Profile */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111318] border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3 min-w-0">
          {activeScope === 'gym' && currentGym?.logoUrl ? (
            <img
              src={currentGym.logoUrl}
              alt={profileTitle}
              className="w-11 h-11 rounded-xl object-cover border border-white/15 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              {activeScope === 'gym' ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white truncate">{profileTitle}</h2>
            <p className="text-xs text-zinc-400 truncate">{currentProfile.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => handleScopeChange('gym')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeScope === 'gym'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Gym Profile
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange('super_admin')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeScope === 'super_admin'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin Profile
          </button>
        </div>
      </div>

      {/* Bio + 1-Click Connected Social Profile Cards */}
      <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
        <p className="text-sm text-zinc-300 leading-relaxed">{currentProfile.bio}</p>

        {connectedPlatforms.length === 0 ? (
          <div className="p-5 rounded-lg bg-zinc-900/70 border border-white/10 text-center text-xs text-zinc-400">
            No social accounts connected yet for this profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {connectedPlatforms.map((meta) => {
              const Icon = meta.icon;
              const linkObj = getResolvedPlatformLink(meta.key);
              return (
                <a
                  key={meta.key}
                  href={linkObj.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group p-4 rounded-xl bg-zinc-900/80 border border-white/10 hover:${meta.accentBorder} transition-colors flex flex-col justify-between gap-3`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-9 h-9 rounded-lg ${meta.accentBg} ${meta.accentText} flex items-center justify-center`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{meta.label}</div>
                    <div className={`text-xs ${meta.accentText} truncate mt-0.5`}>
                      {linkObj.handle}
                    </div>
                  </div>
                  <div className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">
                    {meta.key === 'whatsapp'
                      ? 'Open WhatsApp Chat'
                      : meta.key === 'youtube'
                      ? 'Visit YouTube Channel'
                      : `View ${meta.label} Profile`}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* In-App Video Player + Video Library */}
      <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Youtube className="w-4 h-4 text-rose-400" />
              Official Videos ({currentProfile.videos.length})
            </h3>
            <p className="text-xs text-zinc-400">
              Watch {activeScope === 'gym' ? 'Gym' : 'Super Admin'} workout demos, tutorials, and announcements directly here
            </p>
          </div>
        </div>

        {playingVideo ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Active Video Player */}
            <div className="lg:col-span-2 space-y-3">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
                <iframe
                  key={playingVideo.videoId}
                  src={`https://www.youtube-nocookie.com/embed/${playingVideo.videoId}?rel=0`}
                  title={playingVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300">
                    {playingVideo.category}
                  </span>
                  <h4 className="text-base font-semibold text-white mt-1.5">{playingVideo.title}</h4>
                </div>
                <a
                  href={playingVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5"
                >
                  Watch on YouTube <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Playlist Column */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {currentProfile.videos.map((vid) => {
                const isSelected = vid.id === playingVideo.id;
                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => setSelectedVideo(vid)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-colors flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-zinc-900/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-zinc-950 shrink-0">
                      <img
                        src={`https://i.ytimg.com/vi/${vid.videoId}/mqdefault.jpg`}
                        alt={vid.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white line-clamp-2">{vid.title}</div>
                      <div className="text-[11px] text-zinc-400 mt-1">{vid.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-zinc-400">
            No videos uploaded for this profile yet.
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Full Admin & Super Admin 1-Click Social Link Connector + Customer View Hub
 */
export const SocialConnectHub: React.FC = () => {
  const {
    profiles,
    connectPlatform,
    disconnectPlatform,
    updateProfileMeta,
    addVideo,
    removeVideo,
  } = useSocialLinksStore();
  const { currentGym, updateGymSocialLinks } = useGym();
  const { addToast } = useToast();

  const [mode, setMode] = useState<'manage' | 'customer'>('manage');
  const [scope, setScope] = useState<SocialProfileScope>('gym');

  const activeBundle = profiles[scope];

  const [inputs, setInputs] = useState<Record<SocialPlatformKey, string>>({
    whatsapp: activeBundle.platforms.whatsapp.rawInput,
    instagram: activeBundle.platforms.instagram.rawInput,
    facebook: activeBundle.platforms.facebook.rawInput,
    youtube: activeBundle.platforms.youtube.rawInput,
  });

  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCategory, setVideoCategory] = useState('Workout Demo');

  const switchScope = (nextScope: SocialProfileScope) => {
    setScope(nextScope);
    const b = profiles[nextScope];
    setInputs({
      whatsapp: b.platforms.whatsapp.rawInput,
      instagram: b.platforms.instagram.rawInput,
      facebook: b.platforms.facebook.rawInput,
      youtube: b.platforms.youtube.rawInput,
    });
  };

  const handleOneClickConnect = (platform: SocialPlatformKey) => {
    const res = connectPlatform(scope, platform, inputs[platform]);
    if (!res.ok) {
      addToast(res.error || 'Could not connect account.', 'error');
      return;
    }
    if (scope === 'gym') {
      const normalized = normalizeSocialLink(platform, inputs[platform]);
      if (normalized.valid) {
        void updateGymSocialLinks({
          whatsapp: currentGym.socialLinks?.whatsapp ?? profiles.gym.platforms.whatsapp.url,
          instagram: currentGym.socialLinks?.instagram ?? profiles.gym.platforms.instagram.url,
          facebook: currentGym.socialLinks?.facebook ?? profiles.gym.platforms.facebook.url,
          youtube: currentGym.socialLinks?.youtube ?? profiles.gym.platforms.youtube.url,
          [platform]: normalized.url,
        });
      }
    }
    const label = PLATFORM_META.find((p) => p.key === platform)?.label || platform;
    addToast(`${label} connected in 1 click!`, 'success');
  };

  const handleDisconnect = (platform: SocialPlatformKey) => {
    disconnectPlatform(scope, platform);
    setInputs((prev) => ({ ...prev, [platform]: '' }));
    if (scope === 'gym') {
      void updateGymSocialLinks({
        whatsapp: currentGym.socialLinks?.whatsapp ?? profiles.gym.platforms.whatsapp.url,
        instagram: currentGym.socialLinks?.instagram ?? profiles.gym.platforms.instagram.url,
        facebook: currentGym.socialLinks?.facebook ?? profiles.gym.platforms.facebook.url,
        youtube: currentGym.socialLinks?.youtube ?? profiles.gym.platforms.youtube.url,
        [platform]: '',
      });
    }
    const label = PLATFORM_META.find((p) => p.key === platform)?.label || platform;
    addToast(`${label} disconnected.`, 'info');
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addVideo(scope, videoTitle, videoUrl, videoCategory);
    if (!res.ok) {
      addToast(res.error || 'Invalid video link.', 'error');
      return;
    }
    addToast(`Video "${videoTitle.trim()}" published to ${scope === 'gym' ? 'Gym' : 'Super Admin'} profile!`, 'success');
    setVideoTitle('');
    setVideoUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Header + Manage / Customer Preview Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Social Connect &amp; Official Videos
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Connect WhatsApp, Instagram, Facebook &amp; YouTube in 1 click so customers can view Gym &amp; Super Admin profiles and watch videos
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#111318] p-1 rounded-lg border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('manage')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
              mode === 'manage'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            1-Click Connect
          </button>
          <button
            type="button"
            onClick={() => setMode('customer')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
              mode === 'customer'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Customer View
          </button>
        </div>
      </div>

      {mode === 'customer' ? (
        <CustomerSocialShowcase />
      ) : (
        <div className="space-y-6">
          {/* Profile Scope Selector (Gym vs Super Admin) */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => switchScope('gym')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 cursor-pointer border ${
                  scope === 'gym'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Gym Official Profile
              </button>
              <button
                type="button"
                onClick={() => switchScope('super_admin')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 cursor-pointer border ${
                  scope === 'super_admin'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Super Admin Profile
              </button>
            </div>
            <div className="text-xs text-zinc-400">
              Connected:{' '}
              <span className="text-emerald-400 font-semibold tabular-nums">
                {
                  PLATFORM_META.filter((p) => activeBundle.platforms[p.key]?.connected).length
                }{' '}
                / 4 accounts
              </span>
            </div>
          </div>

          {/* 4 One-Click Social Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLATFORM_META.map((meta) => {
              const Icon = meta.icon;
              const currentLink = activeBundle.platforms[meta.key];
              return (
                <div
                  key={meta.key}
                  className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${meta.accentBg} border ${meta.accentBorder} ${meta.accentText} flex items-center justify-center shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{meta.label}</h3>
                        <p className="text-xs text-zinc-400">{meta.helper}</p>
                      </div>
                    </div>

                    {currentLink.connected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 text-xs font-semibold shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Connected
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs font-medium shrink-0">
                        Not Linked
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={inputs[meta.key]}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, [meta.key]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleOneClickConnect(meta.key);
                        }
                      }}
                      placeholder={meta.placeholder}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleOneClickConnect(meta.key)}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {currentLink.connected ? 'Update Link' : 'Connect'}
                    </button>
                  </div>

                  {currentLink.connected && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                      <a
                        href={currentLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${meta.accentText} hover:underline inline-flex items-center gap-1 truncate`}
                      >
                        <span className="truncate">{currentLink.handle}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDisconnect(meta.key)}
                        className="text-zinc-400 hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Unlink className="w-3 h-3" />
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Profile Bio Editor */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">
              {scope === 'gym' ? 'Gym Profile Bio' : 'Super Admin Profile Bio'} (Visible to Customers)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={activeBundle.displayName}
                onChange={(e) => updateProfileMeta(scope, { displayName: e.target.value })}
                placeholder="Profile Title"
                className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              />
              <input
                type="text"
                value={activeBundle.subtitle}
                onChange={(e) => updateProfileMeta(scope, { subtitle: e.target.value })}
                placeholder="Profile Tagline"
                className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>
            <textarea
              rows={2}
              value={activeBundle.bio}
              onChange={(e) => updateProfileMeta(scope, { bio: e.target.value })}
              placeholder="Short bio visible to members..."
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
            />
          </div>

          {/* YouTube Video Publisher (For Gym & Super Admin) */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Youtube className="w-4 h-4 text-rose-400" />
                Add Featured YouTube Videos ({scope === 'gym' ? 'Gym' : 'Super Admin'})
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Paste any YouTube video or Shorts link — customers can watch it right inside the app
              </p>
            </div>

            <form onSubmit={handleAddVideo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Video title (e.g. Gym Tour / Chest Workout)"
                className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none"
              />
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="YouTube link (youtube.com/watch?v=... or youtu.be/...)"
                className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none"
              />
              <select
                value={videoCategory}
                onChange={(e) => setVideoCategory(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="Workout Demo">Workout Demo</option>
                <option value="Gym Tour">Gym Tour</option>
                <option value="Form & Technique">Form &amp; Technique</option>
                <option value="Nutrition Talk">Nutrition Talk</option>
                <option value="Announcement">Announcement</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Video
              </button>
            </form>

            {activeBundle.videos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {activeBundle.videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="rounded-xl bg-zinc-900/80 border border-white/10 overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-video bg-black">
                      <img
                        src={`https://i.ytimg.com/vi/${vid.videoId}/mqdefault.jpg`}
                        alt={vid.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => setMode('customer')}
                        className="absolute inset-0 bg-black/35 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer"
                        title="Preview video in Customer View"
                      >
                        <span className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </span>
                      </button>
                    </div>
                    <div className="p-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white line-clamp-1">{vid.title}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{vid.category}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          removeVideo(scope, vid.id);
                          addToast('Video removed.', 'info');
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer shrink-0"
                        title="Delete video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialConnectHub;
