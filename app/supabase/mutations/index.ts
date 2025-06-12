import { supabase } from '@/app/lib/supabaseClient';

// Insert or update vault entries
export async function saveVault(userId: string, encryptedVault: object) {
  const { data, error } = await supabase
    .from('vaults')
    .upsert([{ user_id: userId, entries: encryptedVault }]);

  if (error) {
    console.error('Error saving vault:', error);
    return false;
  }
  return true;
}

// Insert activity log
export async function logActivity(userId: string, activity: string) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert([{ user_id: userId, activity }]);

  if (error) {
    console.error('Error logging activity:', error);
    return false;
  }
  return true;
}

// Insert recovery shares
export async function saveRecoveryShare(userId: string, share: string) {
  const { data, error } = await supabase
    .from('recovery_shares')
    .insert([{ user_id: userId, share }]);

  if (error) {
    console.error('Error saving recovery share:', error);
    return false;
  }
  return true;
}

export async function updateUserPasswordHash(email: string, passwordHash: string) {

      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('email', email);

  if (updateError) throw new Error(updateError.message);

  return true;
}