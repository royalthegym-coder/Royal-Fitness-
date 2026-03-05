import { createClient } from '@supabase/supabase-js';
import { encryptData, optimizePayloadForCloud, generateMockJWT } from './security';

// Fallback to empty strings if not provided in environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Supabase के साथ स्थानीय संग्रहण (LocalStorage) का उपयोग
 * Offline-first sync pattern as requested.
 */
export const syncData = async (tableName: string, dataPayload: any) => {
  // Optimization: Refactor code to send only necessary data to the server
  const optimizedPayload = optimizePayloadForCloud(dataPayload);
  
  // Security: End-to-End Encryption for sensitive tables
  let finalPayload = optimizedPayload;
  if (tableName === 'members' || tableName === 'health_data' || tableName === 'transactions') {
      // We encrypt the sensitive parts or the whole payload depending on architecture.
      // For this demo, we'll assume the backend expects an 'encrypted_data' field.
      // In a real scenario, you'd encrypt specific fields (like medical_history).
      if (optimizedPayload.medical_history) {
          optimizedPayload.medical_history = encryptData(optimizedPayload.medical_history);
      }
      if (optimizedPayload.physical_metrics) {
          optimizedPayload.physical_metrics = encryptData(optimizedPayload.physical_metrics);
      }
      finalPayload = optimizedPayload;
  }

  if (navigator.onLine) {
    try {
      // Security: Generate a JWT token for the request (mocked for client-side demo)
      const token = generateMockJWT({ user: 'admin', role: 'system' });
      
      // We would normally pass this token in headers, but Supabase client handles auth differently.
      // We'll log it to show the architecture is in place.
      console.log(`[Security] Syncing with JWT Token: ${token.substring(0, 20)}...`);

      const { data, error } = await supabase
        .from(tableName)
        .upsert(finalPayload);
        
      if (error) {
        console.error(`Error syncing to ${tableName}:`, error);
        cacheLocally(tableName, finalPayload);
      } else {
        console.log(`Online: Data synced to ${tableName} successfully.`);
      }
    } catch (err) {
      console.error("Network error during sync:", err);
      cacheLocally(tableName, finalPayload);
    }
  } else {
    // ऑफलाइन होने पर स्थानीय SQL/LocalStorage में डेटा सेव करें
    cacheLocally(tableName, finalPayload);
  }
};

const cacheLocally = (tableName: string, dataPayload: any) => {
  const cacheKey = `pending_sync_${tableName}`;
  const existingCache = localStorage.getItem(cacheKey);
  let pendingData = [];
  
  if (existingCache) {
    try {
      pendingData = JSON.parse(existingCache);
      if (!Array.isArray(pendingData)) {
        pendingData = [pendingData];
      }
    } catch (e) {
      pendingData = [];
    }
  }
  
  // Add new data to pending queue
  pendingData.push({
    payload: dataPayload,
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem(cacheKey, JSON.stringify(pendingData));
  console.log(`Offline: Data cached locally for ${tableName}.`);
};

/**
 * Process pending offline data when connection is restored
 */
export const processOfflineQueue = async () => {
  if (!navigator.onLine) return;
  
  // Find all pending sync keys
  const keys = Object.keys(localStorage).filter(k => k.startsWith('pending_sync_'));
  
  for (const key of keys) {
    const tableName = key.replace('pending_sync_', '');
    const cachedData = localStorage.getItem(key);
    
    if (cachedData) {
      try {
        const pendingItems = JSON.parse(cachedData);
        if (Array.isArray(pendingItems) && pendingItems.length > 0) {
          console.log(`Processing ${pendingItems.length} offline items for ${tableName}...`);
          
          // Extract just the payloads for bulk upsert
          const payloads = pendingItems.map(item => item.payload);
          
          const { error } = await supabase
            .from(tableName)
            .upsert(payloads);
            
          if (!error) {
            console.log(`Successfully synced offline data for ${tableName}.`);
            localStorage.removeItem(key); // Clear cache on success
          } else {
            console.error(`Failed to sync offline data for ${tableName}:`, error);
          }
        }
      } catch (e) {
        console.error(`Error processing offline queue for ${key}:`, e);
      }
    }
  }
};

// Listen for online event to trigger sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log("Connection restored. Processing offline queue...");
    processOfflineQueue();
  });
}
