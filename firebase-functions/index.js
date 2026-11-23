const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const EXPIRY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes TTL for sensitive medical & digital twin scans

// 1. Tag uploaded medical reports and digital twin scans with strict expiration metadata
// (Avoids serverless setTimeout anti-pattern where CPU is throttled after function return)
exports.tagMedicalReportForAutoExpiry = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name || '';

  if (filePath.startsWith('temp_medical_scans/') || filePath.startsWith('digital_twin_scans/')) {
    const bucket = admin.storage().bucket(object.bucket);
    const fileRef = bucket.file(filePath);
    const expiresAtIso = new Date(Date.now() + EXPIRY_WINDOW_MS).toISOString();

    await fileRef.setMetadata({
      metadata: {
        privacyPolicy: 'EPHEMERAL_5_MIN_TTL',
        expiresAt: expiresAtIso,
      },
    });
    console.log(`[Privacy Guard] Tagged ${filePath} for automatic purge at ${expiresAtIso}`);
  }
});

// 2. Scheduled Cloud Function (runs every 5 minutes) to purge expired medical & twin scans reliably
exports.purgeExpiredMedicalReports = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const bucket = admin.storage().bucket();
    const prefixes = ['temp_medical_scans/', 'digital_twin_scans/'];
    const now = Date.now();

    for (const prefix of prefixes) {
      const [files] = await bucket.getFiles({ prefix });
      for (const file of files) {
        const createdTime = new Date(file.metadata.timeCreated || now).getTime();
        const customExpiry = file.metadata?.metadata?.expiresAt
          ? new Date(file.metadata.metadata.expiresAt).getTime()
          : createdTime + EXPIRY_WINDOW_MS;

        if (now >= customExpiry) {
          try {
            await file.delete();
            console.log(`[Privacy Enforced] Purged expired scan: ${file.name}`);
          } catch (err) {
            console.error(`[Privacy Error] Failed to purge ${file.name}:`, err);
          }
        }
      }
    }
    return null;
  });

