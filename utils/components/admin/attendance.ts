/**
 * Royal Gym Backend Service (Node.js/Express Implementation)
 * Logic for "One Attendance Per Day" rule.
 */

// Simulated DB client
const db = {
    query: async (text: string, params: any[]): Promise<{ rows: any[] }> => {
        console.log(`[DB] Executing: ${text} | Params: ${params}`);
        // In reality, this would query Postgres/MySQL
        return { rows: [] };
    }
};

/**
 * Validates and records attendance.
 * Prevents multiple check-ins on the same calendar day.
 */
export async function handleCheckIn(memberId: string, locationData: { lat: number; lng: number; wifiVerified: boolean }) {
    const today = new Date().toISOString().split('T')[0]; // Format: 2024-08-05

    try {
        // 1. STEP ONE: CHECK FOR DUPLICATE
        const existingRecord = await db.query(
            'SELECT id FROM attendance_logs WHERE memberId = $1 AND date = $2',
            [memberId, today]
        );

        if (existingRecord.rows.length > 0) {
            return {
                status: 409,
                success: false,
                message: "Security Alert: You have already checked in for today."
            };
        }

        // 2. STEP TWO: HYBRID VALIDATION (GPS + WIFI)
        const isNearGym = verifyLocation(locationData.lat, locationData.lng);
        const isAuthorized = isNearGym || locationData.wifiVerified;

        if (!isAuthorized) {
            return {
                status: 403,
                success: false,
                message: "Access Denied: Verification failed. Please be near the gym entrance or use Gym WiFi."
            };
        }

        // 3. STEP THREE: RECORD SUCCESS
        await db.query(
            'INSERT INTO attendance_logs (memberId, date, check_in_time) VALUES ($1, $2, NOW())',
            [memberId, today]
        );

        return {
            status: 201,
            success: true,
            message: "Authentication Success. Welcome to Royal The Gym."
        };

    } catch (error) {
        console.error("Critical Backend Error:", error);
        return {
            status: 500,
            success: false,
            message: "Internal System Error. Please try manual check-in at the desk."
        };
    }
}

// Precision Geofencing Utility
function verifyLocation(userLat: number, userLng: number) {
    const GYM_LAT = 28.1289;
    const GYM_LNG = 75.3995;
    
    // Haversine implementation on server for security
    const R = 6371e3; // meters
    const phi1 = userLat * Math.PI/180;
    const phi2 = GYM_LAT * Math.PI/180;
    const deltaPhi = (GYM_LAT-userLat) * Math.PI/180;
    const deltaLambda = (GYM_LNG-userLng) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance <= 15; // 15 meters radius on server-side
}
