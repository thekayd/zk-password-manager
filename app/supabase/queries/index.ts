import { supabase } from "@/app/lib/supabaseClient";

// This fetches the encrypted vault
export async function fetchVault(userId: string) {
  const { data, error } = await supabase
    .from("vaults")
    .select("entries")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching vault:", error);
    return null;
  }
  return data.entries;
}

// This function exports activity logs
export async function fetchActivityLogs(userId: string) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
  return data;
}

// This function fetches recovery shares
export async function fetchRecoveryShares(userId: string) {
  const { data, error } = await supabase
    .from("recovery_shares")
    .select("share")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching recovery shares:", error);
    return [];
  }
  return data.map((record: any) => record.share);
}

export async function fetchUserPasswordHash(email: string) {
  // This fetches password hash for ZKP verification
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("password_hash")
    .eq("email", email)
    .single();

  if (userError || !userData) throw new Error("User data not found.");

  return userData;
}

// This function fetches user authentication data
export async function fetchUserAuthData(email: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, password_hash, failed_attempts, challenge, locked_until")
    .eq("email", email)
    .single();

  if (error) {
    console.error("Error fetching user data:", error);
    return null;
  }

  return data;
}

// fetches webauthn id for biometric login
export async function fetchWebAuthnID(email: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, webauthn_id")
    .eq("email", email)
    .single();

  if (error) {
    console.error("Error fetching Webauthn Id", error);
    return null;
  }
  return data;
}

// fetches the vault entries details for the specific user
export async function getVaultEntries(userId: string) {
  const { data, error } = await supabase
    .from("password_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Check if a vault entry already exists for the given website and username
export async function checkDuplicateEntry(
  userId: string,
  website: string,
  username: string
) {
  const { data, error } = await supabase
    .from("password_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("website", website)
    .eq("username", username)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data !== null;
}

// Shamir's Secret Sharing Queries

// Get user's Shamir configuration
export async function getUserShamirConfig(userId: string) {
  const { data, error } = await supabase.rpc("get_user_shamir_config", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error fetching Shamir config:", error);
    return null;
  }
  return data?.[0] || null;
}

// Get all Shamir shares for a user
export async function getUserShamirShares(userId: string) {
  const { data, error } = await supabase
    .from("shamir_shares")
    .select("*")
    .eq("user_id", userId)
    .order("share_index");

  if (error) {
    console.error("Error fetching Shamir shares:", error);
    return [];
  }
  return data;
}

// Validate a share hash
export async function validateShareHash(
  userId: string,
  shareIndex: number,
  shareHash: string
) {
  const { data, error } = await supabase.rpc("validate_share_hash", {
    p_user_id: userId,
    p_share_index: shareIndex,
    p_share_hash: shareHash,
  });

  if (error) {
    console.error("Error validating share hash:", error);
    return false;
  }
  return data;
}

// Get recovery attempts for a user
export async function getRecoveryAttempts(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from("recovery_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("attempt_timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recovery attempts:", error);
    return [];
  }
  return data;
}

// Get recovery agents for a user
export async function getRecoveryAgents(userId: string) {
  const { data, error } = await supabase
    .from("recovery_agents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    console.error("Error fetching recovery agents:", error);
    return [];
  }
  return data;
}

// Check if user has Shamir recovery setup
export async function hasShamirRecovery(userId: string) {
  const { data, error } = await supabase
    .from("shamir_shares")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("Error checking Shamir recovery setup:", error);
    return false;
  }
  return data.length > 0;
}
