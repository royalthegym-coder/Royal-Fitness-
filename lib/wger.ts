
// Wger Workout Manager API Integration
// https://wger.de/en/software/api

const WGER_BASE_URL = 'https://wger.de/api/v2';

export const validateWgerKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const response = await fetch(`${WGER_BASE_URL}/user/profile/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Accept': 'application/json'
            }
        });
        return response.ok;
    } catch (error) {
        console.error("Wger validation failed:", error);
        return false;
    }
};

export const syncWgerExercises = async (apiKey: string) => {
    if (!apiKey) throw new Error("API Key is missing");
    
    // Fetch a list of exercises (limit 20 for demo)
    const response = await fetch(`${WGER_BASE_URL}/exercise/?language=2&limit=20`, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${apiKey}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch exercises from Wger");
    }

    const data = await response.json();
    return data.results; // Returns array of exercises
};

export const getWgerWorkouts = async (apiKey: string) => {
     if (!apiKey) throw new Error("API Key is missing");
    
    const response = await fetch(`${WGER_BASE_URL}/workout/`, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${apiKey}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch workouts from Wger");
    }

    const data = await response.json();
    return data.results;
};
