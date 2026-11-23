import { supabase, isMock, isExternalSupabaseConfigured, syncData, processOfflineQueue, createStrictSupabaseClient } from './supabase';

export { supabase, isMock, isExternalSupabaseConfigured, syncData, processOfflineQueue, createStrictSupabaseClient };

export const saveMemberToDB = async (memberData: any) => {
  try {
    const payload = {
      ...memberData,
      id: memberData?.id ?? `mem_${Date.now()}`,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('gym_members')
      .upsert([payload]);

    if (error) {
      console.warn('Supabase Sync Warning, using local storage fallback', error);
      throw new Error('Database Sync Failed');
    }
    return data;
  } catch (e) {
    console.error('Supabase Error:', e);
    return null;
  }
};

export const fetchMembersFromDB = async () => {
  try {
    const { data, error } = await supabase.from('gym_members').select('*');
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Supabase fetch members error:', e);
    return null;
  }
};
