import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImageOff, Trash2 } from 'lucide-react';
import { DrivePhoto, cacheGet, compressImage, connectDrive, deleteDriveFile, getPhotoBlob, hasDriveToken, listPhotos, uploadPhoto } from '../../../lib/personalDrive';
import { photoScope, useDriveConnected, usePersonalSettings } from '../../../lib/personalData';
import { useToast } from '../../hooks/useToast';
import { Button, Card, CardHeader, EmptyState, Spinner, fmtDate, localIsoDate } from '../ui';
import { DriveConnectBanner } from './ProgressPanel';

const Thumb: React.FC<{ photo: DrivePhoto; onDelete: () => void }> = ({ photo, onDelete }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let u: string | null = null;
    getPhotoBlob(photo.id)
      .then((b) => {
        u = URL.createObjectURL(b);
        setUrl(u);
      })
      .catch(() => setFailed(true));
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [photo.id]);
  return (
    <figure className="relative rounded-xl overflow-hidden bg-surface2 aspect-[3/4]">
      {url ? <img src={url} alt={`Progress photo ${photo.date}`} className="w-full h-full object-cover" loading="lazy" /> : failed ? <div className="w-full h-full flex items-center justify-center text-subtle"><ImageOff className="w-5 h-5" /></div> : <div className="w-full h-full animate-pulse" />}
      <figcaption className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-2 py-1 flex items-center justify-between">
        {fmtDate(photo.date)}
        <button type="button" aria-label="Delete photo" onClick={onDelete} className="p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
      </figcaption>
    </figure>
  );
};

/** Progress photos — only in the member's own Google Drive (never on our servers). */
export const PhotosPanel: React.FC<{ gymId: string; memberId: number; preview?: boolean }> = ({ gymId, memberId, preview }) => {
  const settings = usePersonalSettings();
  const connected = useDriveConnected();
  const { addToast } = useToast();
  const scope = photoScope(gymId, memberId);
  const [photos, setPhotos] = useState<DrivePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drive = !preview && settings.mode === 'drive';

  const refresh = useCallback(async () => {
    const cached = await cacheGet<DrivePhoto[]>(`photos:${scope}`);
    if (cached) setPhotos(cached);
    if (hasDriveToken()) {
      try {
        setPhotos(await listPhotos(scope));
      } catch (e: any) {
        setErr(e?.message || 'Could not load photos.');
      }
    }
    setLoading(false);
  }, [scope]);

  useEffect(() => {
    if (drive) void refresh();
  }, [drive, connected, refresh]);

  if (!drive) {
    return (
      <Card>
        <EmptyState icon={<Camera className="w-5 h-5" />} title={preview ? 'Private to the member' : 'Progress photos need Google Drive'}>
          {preview
            ? 'Progress photos are stored only in the member’s own Google Drive.'
            : settings.canUseDrive
              ? 'Turn on “Store my personal data in my Google Drive” on the Home tab. Photos are kept only in your Drive — the gym never sees them.'
              : 'Photos are stored only in your own Google Drive. Sign in with Google to use this feature.'}
        </EmptyState>
      </Card>
    );
  }

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      if (!hasDriveToken()) await connectDrive();
      const jpeg = await compressImage(file);
      const p = await uploadPhoto(scope, localIsoDate(), jpeg);
      setPhotos((x) => [p, ...x]);
      addToast('Photo saved to your Google Drive.', 'success');
    } catch (e: any) {
      addToast(e?.message || 'Upload failed.', 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (p: DrivePhoto) => {
    if (!window.confirm('Delete this photo from your Google Drive?')) return;
    try {
      if (!hasDriveToken()) await connectDrive();
      await deleteDriveFile(p.id);
      setPhotos((x) => x.filter((y) => y.id !== p.id));
    } catch (e: any) {
      addToast(e?.message || 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {!connected && <DriveConnectBanner onConnect={() => void connectDrive().then(refresh).catch((e) => setErr(e.message))} error={err} />}
      <Card>
        <CardHeader
          title="Progress photos"
          subtitle="Saved only in your Google Drive (hidden app folder)"
          icon={<Camera className="w-4 h-4" />}
          action={<Button size="sm" icon={<Camera className="w-4 h-4" />} loading={busy} onClick={() => fileRef.current?.click()}>Add photo</Button>}
        />
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
        {loading ? (
          <Spinner />
        ) : photos.length === 0 ? (
          <EmptyState icon={<Camera className="w-5 h-5" />} title="No photos yet">Take a front and side photo every 2–4 weeks in the same light to see real change.</EmptyState>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((p) => <Thumb key={p.id} photo={p} onDelete={() => void remove(p)} />)}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PhotosPanel;
