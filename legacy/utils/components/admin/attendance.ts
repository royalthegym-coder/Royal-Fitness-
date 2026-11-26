import { supabase } from '../../../lib/supabase';

/**
 * Fitness Future Backend & Hybrid Check-In Service
 * Enforces "One Attendance Per Calendar Day", Active Subscription Gate, and Geofence/WiFi validation.
 */
export async function handleCheckIn(
  memberId: string,
  locationData: { lat: number; lng: number; wifiVerified: boolean },
  entryMethod: 'biometric' | 'dynamic_qr' | 'face_id' | 'manual' = 'dynamic_qr'
) {
  const today = new Date().toISOString().split('T')[0];
  const dayStartIso = `${today}T00:00:00.000Z`;

  try {
    // 1. Check for existing check-in today on attendance_logs
    const { data: existingRecords, error: existingErr } = await supabase
      .from('attendance_logs')
      .select('id, check_in_time, access_granted')
      .eq('member_id', memberId)
      .gte('check_in_time', dayStartIso)
      .eq('access_granted', true)
      .limit(1);

    if (existingErr) {
      throw existingErr;
    }

    if (Array.isArray(existingRecords) && existingRecords.length > 0) {
      return {
        status: 409,
        success: false,
        message: 'Security Alert: You have already checked in for today.',
      };
    }

    // 2. Verify location (15m Haversine perimeter) or verified Gym WiFi
    const isNearGym = verifyLocation(locationData.lat, locationData.lng);
    const isAuthorizedLocation = isNearGym || locationData.wifiVerified;

    if (!isAuthorizedLocation) {
      await supabase.from('attendance_logs').insert([
        {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          member_id: memberId,
          check_in_time: new Date().toISOString(),
          check_out_time: null,
          entry_method: entryMethod,
          hardware_device_id: 'mobile_geofence_gate',
          access_granted: false,
          denial_reason: 'outside_geofence',
        },
      ]);
      return {
        status: 403,
        success: false,
        message: 'Access Denied: Verification failed. Please be near the gym entrance or use Gym WiFi.',
      };
    }

    // 3. Check subscription/biometric access flag if profile or subscription record exists
    const { data: activeSub } = await supabase
      .from('subscriptions')
      .select('id, end_date, status')
      .eq('member_id', memberId)
      .eq('status', 'active')
      .gte('end_date', today)
      .limit(1)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, biometric_access_enabled')
      .eq('id', memberId)
      .maybeSingle();

    if (profile && profile.biometric_access_enabled === false && !activeSub) {
      await supabase.from('attendance_logs').insert([
        {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          member_id: memberId,
          check_in_time: new Date().toISOString(),
          check_out_time: null,
          entry_method: entryMethod,
          hardware_device_id: 'turnstile_primary',
          access_granted: false,
          denial_reason: 'plan_expired',
        },
      ]);
      return {
        status: 403,
        success: false,
        message: 'Access Denied: Active membership plan required for turnstile entry.',
      };
    }

    // 4. Record granted attendance in attendance_logs
    const newId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const { error: insertErr } = await supabase.from('attendance_logs').insert([
      {
        id: newId,
        member_id: memberId,
        check_in_time: new Date().toISOString(),
        check_out_time: null,
        entry_method: entryMethod,
        hardware_device_id: locationData.wifiVerified ? 'gym_wifi_turnstile' : 'gps_geofence_turnstile',
        access_granted: true,
        denial_reason: null,
      },
    ]);

    if (insertErr) {
      throw insertErr;
    }

    return {
      status: 201,
      success: true,
      attendanceId: newId,
      message: 'Authentication Success. Welcome to Fitness Future.',
    };
  } catch (error) {
    console.error('Attendance Check-In Error:', error);
    return {
      status: 500,
      success: false,
      message: 'Internal System Error. Please try manual check-in at the desk.',
    };
  }
}

// Precision Geofencing Utility
function verifyLocation(userLat: number, userLng: number) {
  const GYM_LAT = 28.1289;
  const GYM_LNG = 75.3995;

  const R = 6371e3; // meters
  const phi1 = (userLat * Math.PI) / 180;
  const phi2 = (GYM_LAT * Math.PI) / 180;
  const deltaPhi = ((GYM_LAT - userLat) * Math.PI) / 180;
  const deltaLambda = ((GYM_LNG - userLng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= 15; // 15 meters radius
}
