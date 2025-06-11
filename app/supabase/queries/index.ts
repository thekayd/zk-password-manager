import { supabase } from '@/app/lib/supabaseClient';

// Fetch encrypted vault
export async function fetchVault(userId: string) {
  const { data, error } = await supabase
    .from('vaults')
    .select('entries')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching vault:', error);
    return null;
  }
  return data.entries;
}

// Fetch activity logs
export async function fetchActivityLogs(userId: string) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
  return data;
}

// Fetch recovery shares
export async function fetchRecoveryShares(userId: string) {
  const { data, error } = await supabase
    .from('recovery_shares')
    .select('share')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching recovery shares:', error);
    return [];
  }
  return data.map((record: any) => record.share);
}
