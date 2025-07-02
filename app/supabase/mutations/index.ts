import { supabase } from '@/app/lib/supabaseClient';

// This inserta or updatea vault entries
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

// This inserts into activity log
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

// This inserts for recovery shares
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

export async function setNewChallenge(email: string, challenge: string) {
  const { error } = await supabase.from('users').update({ challenge }).eq('email', email);

  if (error) {
    console.error('Error setting new challenge:', error);
    return false;
  }
  return true;
}

export async function recordFailedAttempt(email: string) {
  // frst we get the current failed attempts
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('failed_attempts')
    .eq('email', email)
    .single();

  if (fetchError) {
    console.error('Error fetching current failed attempts:', fetchError);
    return false;
  }

  const newFailedAttempts = (userData.failed_attempts || 0) + 1;
  const updates: any = { failed_attempts: newFailedAttempts };

  // If this is the 5th attempt, set the locked_until timestamp
  if (newFailedAttempts >= 5) {
    updates.locked_until = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now
  }

  // This then updates with the incremented value and possibly the locked_until timestamp
  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('email', email);

  if (updateError) {
    console.error('Error recording failed attempt:', updateError);
    return false;
  }
  return true;
}


export async function resetFailedAttempts(email: string) {
  const { error } = await supabase.from('users').update({ failed_attempts: 0 }).eq('email', email);

  if (error) {
    console.error('Error resetting failed attempts:', error);
    return false;
  }
  return true;
}

export async function lockUserAccount(email: string) {

}

// This creates the user record in users table. inserting it into table
export async function createUserRecord(email: string, passwordHash: string, userId: string) {
  console.log('Creating user record with:', { email, userId });
  const { error } = await supabase
    .from('users')
    .insert([
      {
        id: userId,
        email: email,
        password_hash: passwordHash,
        failed_attempts: 0,
        challenge: null,
        locked_until: null,
        webauthn_id: null,
        webauthn_public_key: null
      }
    ]);

  if (error) {
    console.error('Error creating user record:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return false;
  }
  console.log('User record created successfully');
  return true;
}

// This locks user out for 10 minutes, this allows for extra security
export async function lockUser(email: string) {
  const unlockTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  const { error } = await supabase
    .from('users')
    .update({ locked_until: unlockTime })
    .eq('email', email);

  if (error) console.error('Error locking user:', error);
}

// This resets lock and failed attempts back to 0
export async function resetLockAndAttempts(email: string) {
  const { error } = await supabase
    .from('users')
    .update({ 
      locked_until: null,
      failed_attempts: 0 
    })
    .eq('email', email);

  if (error) console.error('Error resetting user lock:', error);
} 

 // This function saves credential ID to Supabase
 export async function saveCredentialId(credentialId: string, email: string){
 const { error } = await supabase
        .from('users')
        .update({ webauthn_id: credentialId })
        .eq('email', email);

      if (error) {
        console.error('Failed to save biometric ID.')
        return false
      }
      return true;
 }

interface WebAuthnKey {
  id: string;
  publicKey: string;
}

// This function saves the public key to a string in the database
export async function saveWebAuthnPublicKey(credential: PublicKeyCredential, email: string) {
  // this extracts and converts the public key to a base64 string
  const publicKeyString = btoa(String.fromCharCode(...new Uint8Array((credential.response as AuthenticatorAttestationResponse).getPublicKey() as ArrayBuffer)));

  const {error} = await supabase
  .from('users')
  .update({webauthn_public_key: publicKeyString})
  .eq('email', email);
  if (error) {
    console.error("Failed to save web autn public key:", error)
    return false
  }
  return true
}
     