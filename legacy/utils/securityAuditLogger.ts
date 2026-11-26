import { doc, setDoc } from 'firebase/firestore';
import { db, syncToFirebase } from '../lib/firebase';

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  source: 'gps' | 'network_ip' | 'fallback_denied' | 'simulated';
  city?: string;
  region?: string;
  country?: string;
  mapsUrl: string;
  error?: string;
}

export interface SecurityAuditRecord {
  id: string;
  eventType: 'FAILED_BIOMETRIC_UNLOCK' | 'BIOMETRIC_GATE_DENIED' | 'UNAUTHORIZED_CLEARANCE_ATTEMPT';
  action: 'BIOMETRIC_UNLOCK_FAILED';
  status: 'DENIED' | 'FAILED';
  timestamp: string; // ISO 8601 UTC
  timestampMs: number;
  localTime: string;
  device: string;
  method: string;
  errorMessage: string;
  targetView?: string;
  targetUserEmail?: string;
  targetUserName?: string;
  clearanceLevel?: string;
  severity: 'HIGH' | 'CRITICAL';
  geolocation: GeolocationData;
  userAgent: string;
  ipAddress?: string;
  network?: {
    online: boolean;
    downlink?: number;
    effectiveType?: string;
  };
}

/**
 * Attempts to capture high-accuracy browser geolocation with a strict timeout.
 * Gracefully falls back to network or regional coordinates if denied or in an iframe.
 */
export async function captureGeolocation(): Promise<GeolocationData> {
  // Default regional fallback coordinates (Gym Central Facility Corridor, Rajasthan)
  const fallbackLat = 27.6094;
  const fallbackLon = 75.1398;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      latitude: fallbackLat,
      longitude: fallbackLon,
      source: 'fallback_denied',
      city: 'Sikar / Jaipur Corridor',
      region: 'Rajasthan',
      country: 'India',
      mapsUrl: `https://maps.google.com/?q=${fallbackLat},${fallbackLon}`,
      error: 'Geolocation API not supported by browser environment'
    };
  }

  return new Promise<GeolocationData>((resolve) => {
    let resolved = false;

    // Safety timeout after 3500ms so failed attempts log without blocking UI
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          latitude: fallbackLat,
          longitude: fallbackLon,
          accuracy: 500,
          source: 'network_ip',
          city: 'Sikar / Jaipur Corridor',
          region: 'Rajasthan',
          country: 'India',
          mapsUrl: `https://maps.google.com/?q=${fallbackLat},${fallbackLon}`,
          error: 'Geolocation query timed out (exceeded 3500ms)'
        });
      }
    }, 3500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));

        resolve({
          latitude: lat,
          longitude: lon,
          accuracy: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : undefined,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          source: 'gps',
          city: 'Client Device GPS Coordinates',
          region: timezone,
          country: 'Verified Location',
          mapsUrl: `https://maps.google.com/?q=${lat},${lon}`
        });
      },
      (err) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        let errDesc = 'Geolocation denied or unavailable';
        if (err.code === err.PERMISSION_DENIED) {
          errDesc = 'User or browser denied Geolocation permission';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errDesc = 'Position unavailable from network/GPS sensors';
        } else if (err.code === err.TIMEOUT) {
          errDesc = 'GPS fix timed out';
        }

        resolve({
          latitude: fallbackLat,
          longitude: fallbackLon,
          accuracy: 1000,
          source: 'fallback_denied',
          city: 'Sikar / Jaipur Facility Corridor',
          region: 'Rajasthan',
          country: 'India',
          mapsUrl: `https://maps.google.com/?q=${fallbackLat},${fallbackLon}`,
          error: errDesc
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 30000
      }
    );
  });
}

export interface LogFailedUnlockOptions {
  method?: string;
  errorMessage?: string;
  targetView?: string;
  targetUserEmail?: string;
  targetUserName?: string;
  clearanceLevel?: string;
  deviceLabel?: string;
  severity?: 'HIGH' | 'CRITICAL';
  simulatedGeo?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
}

/**
 * Automatically logs a failed biometric unlock attempt to Firestore collection 'security_audit'
 * with detailed geolocation coordinates, ISO UTC timestamp, and hardware fingerprinting.
 */
export async function logFailedBiometricUnlock(
  options: LogFailedUnlockOptions = {}
): Promise<SecurityAuditRecord> {
  const now = new Date();
  const timestamp = now.toISOString();
  const timestampMs = now.getTime();
  const localTime = now.toLocaleString();
  const recordId = `sec_audit_${timestampMs}_${Math.random().toString(36).substring(2, 8)}`;

  // Capture real device geolocation
  let geo: GeolocationData;
  if (options.simulatedGeo) {
    geo = {
      latitude: options.simulatedGeo.latitude,
      longitude: options.simulatedGeo.longitude,
      accuracy: 25,
      source: 'simulated',
      city: options.simulatedGeo.city || 'Simulated Security Perimeter',
      region: 'Rajasthan',
      country: 'India',
      mapsUrl: `https://maps.google.com/?q=${options.simulatedGeo.latitude},${options.simulatedGeo.longitude}`
    };
  } else {
    geo = await captureGeolocation();
  }

  // Detect network status
  const navAny = typeof navigator !== 'undefined' ? (navigator as any) : {};
  const connection = navAny.connection || navAny.mozConnection || navAny.webkitConnection;

  const record: SecurityAuditRecord = {
    id: recordId,
    eventType: 'FAILED_BIOMETRIC_UNLOCK',
    action: 'BIOMETRIC_UNLOCK_FAILED',
    status: 'DENIED',
    timestamp,
    timestampMs,
    localTime,
    device: options.deviceLabel || (navAny.userAgentData?.platform || navigator.platform || 'Unknown Device'),
    method: options.method || 'WebAuthn Platform Authenticator (TouchID / FaceID / Passkey)',
    errorMessage: options.errorMessage || 'Biometric hardware verification rejected or cancelled by user',
    targetView: options.targetView || 'Restricted Security Vault',
    targetUserEmail: options.targetUserEmail || 'admin@fitnessfuture.os',
    targetUserName: options.targetUserName || 'Gym Administrator',
    clearanceLevel: options.clearanceLevel || 'LEVEL-5 ADMIN CLEARANCE',
    severity: options.severity || 'HIGH',
    geolocation: geo,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Unknown',
    network: {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      downlink: connection?.downlink,
      effectiveType: connection?.effectiveType
    }
  };

  // 1. Write to Firestore 'security_audit' collection
  try {
    const docRef = doc(db, 'security_audit', recordId);
    await setDoc(docRef, record, { merge: true });
    console.log(`[Security Audit] Successfully logged failed unlock to Firestore 'security_audit' [ID: ${recordId}] with Geolocation: ${geo.latitude}, ${geo.longitude}`);
  } catch (error) {
    console.error(`[Security Audit] Error writing to Firestore 'security_audit':`, error);
    // Fallback sync attempt
    try {
      await syncToFirebase('security_audit', recordId, record);
    } catch (fallbackErr) {
      console.warn(`[Security Audit] Fallback sync to 'security_audit' failed:`, fallbackErr);
    }
  }

  // 2. LocalStorage mirror for immediate offline reactive UI update
  try {
    const existing = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
    localStorage.setItem('security_audit_logs', JSON.stringify([record, ...existing].slice(0, 150)));
    window.dispatchEvent(new Event('security_audit_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (lsErr) {
    console.warn(`[Security Audit] LocalStorage sync warning:`, lsErr);
  }

  return record;
}
