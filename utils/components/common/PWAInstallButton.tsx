import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAutomationStore, bi } from '../../store/useAutomationStore';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const { language } = useAutomationStore();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold transition-colors cursor-pointer shrink-0 active:scale-95 ${
          compact ? 'px-2.5 py-2 text-[11px]' : 'px-3 py-2 text-xs'
        }`}
        title={bi(language, 'Install Fitness Future App (Android & iOS)', 'ऐप इंस्टॉल करें (Android और iOS)')}
      >
        {isInstallable ? <Download className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
        <span className={compact ? 'hidden sm:inline' : 'inline'}>
          {isInstallable
            ? bi(language, 'Install App', 'ऐप इंस्टॉल करें')
            : isIOS
            ? bi(language, 'iOS App', 'iOS ऐप')
            : isAndroid
            ? bi(language, 'Android App', 'Android ऐप')
            : bi(language, 'Install App', 'ऐप इंस्टॉल करें')}
        </span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#111114] p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {bi(language, 'Install Fitness Future App', 'Fitness Future ऐप इंस्टॉल करें')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {bi(language, 'Works Offline & Auto-Updates Online', 'ऑफलाइन काम करता है और ऑनलाइन ऑटो-अपडेट होता है')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Close install guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-slate-300">
                <p className="font-semibold text-amber-300">
                  {bi(language, 'iPhone / iPad (iOS Safari):', 'iPhone / iPad (iOS Safari):')}
                </p>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <Share className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {bi(
                      language,
                      '1. Tap the Share button at the bottom of Safari.',
                      '1. Safari में नीचे दिए गए Share बटन पर टैप करें।'
                    )}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    {bi(
                      language,
                      '2. Scroll down and tap "Add to Home Screen", then tap Add.',
                      '2. नीचे स्क्रॉल करके "Add to Home Screen" पर टैप करें और Add दबाएँ।'
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-300">
                <p className="font-semibold text-amber-300">
                  {bi(language, 'Android & Desktop Chrome / Edge:', 'Android व Chrome / Edge:')}
                </p>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  {bi(
                    language,
                    '1. Open the browser menu (⋮) in the top right corner.',
                    '1. ब्राउज़र के ऊपर दाईं ओर मेन्यू (⋮) खोलें।'
                  )}
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  {bi(
                    language,
                    '2. Tap "Install App" or "Add to Home screen" to launch Fitness Future like a native mobile app.',
                    '2. "Install App" या "Add to Home screen" पर टैप करें ताकि Fitness Future नेटिव मोबाइल ऐप की तरह खुले।'
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-950 transition-colors cursor-pointer"
            >
              {bi(language, 'Got It', 'समझ गया')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;
