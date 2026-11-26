import React, { useState } from 'react';
import { Cloud, Lock, Share2 } from 'lucide-react';
import { ProgressLog } from '../../../lib/coachData';
import {
  buildSummary, deleteProgressSummary, driveFileName, moveMyDataToDrive, usePersonalSettings, writeProgressSummary,
} from '../../../lib/personalData';
import { cacheGet, connectDrive, disconnectDrive, readJson } from '../../../lib/personalDrive';
import { useSessionStore } from '../../../lib/session';
import { useToast } from '../../hooks/useToast';
import { Badge, Button, Card, CardHeader, cx } from '../ui';

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string; busy?: boolean }> = ({ checked, onChange, disabled, label, busy }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled || busy}
    onClick={() => onChange(!checked)}
    className={cx('relative w-12 h-7 rounded-full transition shrink-0 cursor-pointer disabled:opacity-50', checked ? 'bg-brand' : 'bg-fg/20')}
  >
    <span className={cx('absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all', checked ? 'left-6' : 'left-1', busy && 'animate-pulse')} />
  </button>
);

/** Member setting: keep personal data in my Google Drive + share a small summary with my trainer. */
export const PersonalDataSettings: React.FC<{ gymId: string; memberId: number; targetWeightKg?: number | null }> = ({ gymId, memberId, targetWeightKg }) => {
  const uid = useSessionStore((s) => s.user?.uid || '');
  const { addToast } = useToast();
  const { mode, shareProgress, canUseDrive, update } = usePersonalSettings();
  const [busy, setBusy] = useState<'drive' | 'share' | null>(null);

  const setDrive = async (on: boolean) => {
    setBusy('drive');
    try {
      if (on) {
        await connectDrive(); // Google popup asks only for the hidden app-folder permission
        await update({ personalStorage: 'drive' });
        const moved = await moveMyDataToDrive(gymId, memberId, uid);
        const n = moved.progress + moved.food + (moved.chat ? 1 : 0);
        addToast(n ? 'Done. Your existing entries were moved to your Google Drive and removed from the gym database.' : 'Done. New personal data will be saved in your Google Drive.', 'success');
      } else {
        if (!window.confirm('Switch back to saving in the gym app? Entries already in your Google Drive stay there (you can switch back any time to see them).')) return;
        await update({ personalStorage: 'firestore' });
        disconnectDrive();
        addToast('New personal data will be saved in the gym app.', 'success');
      }
    } catch (e: any) {
      addToast(e?.message || 'Could not change storage.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const setShare = async (on: boolean) => {
    setBusy('share');
    try {
      await update({ shareProgress: on });
      if (on) {
        const name = driveFileName(gymId, memberId, 'progress');
        const logs = mode === 'drive' ? (await readJson<ProgressLog[]>(name).catch(() => null)) || (await cacheGet<ProgressLog[]>(name)) || [] : [];
        if (mode === 'drive') await writeProgressSummary(buildSummary(gymId, memberId, uid, logs, targetWeightKg ?? null));
        addToast('Your trainer can now see your latest weight and goal progress.', 'success');
      } else {
        await deleteProgressSummary(gymId, memberId).catch(() => undefined);
        addToast('Progress summary is no longer shared.', 'success');
      }
    } catch (e: any) {
      addToast(e?.message || 'Could not update sharing.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader title="My data & privacy" icon={<Lock className="w-4 h-4" />} />
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Cloud className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold flex items-center gap-2">
              Store my personal data in my Google Drive {mode === 'drive' && <Badge tone="info">On</Badge>}
            </p>
            <p className="text-xs text-muted mt-0.5">
              AI coach chats, progress logs, progress photos and your food diary are saved in a hidden app folder in <b>your own</b> Google Drive
              (uses your free 15 GB). The gym can’t see them. The app can only open its own folder — never your other Drive files.
              Your membership, plan, payments and attendance stay with the gym.
            </p>
            {!canUseDrive && <p className="text-xs text-amber-500 mt-1">Available when you sign in with Google. Your data is safely kept in the gym app meanwhile.</p>}
          </div>
          <Toggle label="Store personal data in Google Drive" checked={mode === 'drive'} disabled={!canUseDrive} busy={busy === 'drive'} onChange={(v) => void setDrive(v)} />
        </div>

        <div className="flex items-start gap-3">
          <Share2 className="w-5 h-5 text-brand mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Share progress with my trainer</p>
            <p className="text-xs text-muted mt-0.5">
              {mode === 'drive'
                ? 'Shares only a small summary: latest weight and date, starting weight and goal progress %. Your full log, photos, food diary and chats stay private.'
                : 'Your progress entries in the gym app are already visible to your trainer. Turn on Google Drive storage to keep them private and share only a summary.'}
            </p>
          </div>
          <Toggle label="Share progress summary with trainer" checked={shareProgress} disabled={mode !== 'drive'} busy={busy === 'share'} onChange={(v) => void setShare(v)} />
        </div>
        {mode === 'drive' && (
          <Button size="sm" variant="ghost" onClick={() => void connectDrive().then(() => addToast('Google Drive connected.', 'success')).catch((e) => addToast(e.message, 'error'))}>
            Reconnect Google Drive
          </Button>
        )}
      </div>
    </Card>
  );
};

export default PersonalDataSettings;
