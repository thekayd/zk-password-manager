import { connectToDatabase } from "@/app/lib/mongodbClient";

// This fetches the encrypted vault entries
export async function fetchVault(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const vault = await db.collection("vaults").findOne({ user_id: userId });
    return vault?.entries || null;
  } catch (error) {
    console.error("Error fetching vault:", error);
    return null;
  }
}

// Fetches the activity logs for each user
export async function fetchActivityLogs(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const logs = await db
      .collection("activity_logs")
      .find({ user_id: userId })
      .sort({ timestamp: -1 })
      .toArray();
    return logs;
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
}

// Fetches the recovery shares
export async function fetchRecoveryShares(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const shares = await db
      .collection("recovery_shares")
      .find({ user_id: userId })
      .toArray();
    return shares.map((record: any) => record.share);
  } catch (error) {
    console.error("Error fetching recovery shares:", error);
    return [];
  }
}

// Fetches the user password hash
export async function fetchUserPasswordHash(email: string) {
  try {
    const { db } = await connectToDatabase();
    const userData = await db.collection("users").findOne({ email });
    if (!userData) throw new Error("User data not found.");
    return userData;
  } catch (error) {
    console.error("Error fetching user password hash:", error);
    throw error;
  }
}

// This fetches the user authentication data
export async function fetchUserAuthData(email: string) {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne(
      { email },
      {
        projection: {
          id: 1,
          password_hash: 1,
          failed_attempts: 1,
          challenge: 1,
          locked_until: 1,
        },
      }
    );
    return user;
  } catch (error) {
    console.error("Error fetching user auth data:", error);
    return null;
  }
}

// Fetches the WebAuthn ID for biometric login
export async function fetchWebAuthnID(email: string) {
  try {
    const { db } = await connectToDatabase();
    const user = await db
      .collection("users")
      .findOne({ email }, { projection: { id: 1, webauthn_id: 1 } });
    return user;
  } catch (error) {
    console.error("Error fetching WebAuthn ID:", error);
    return null;
  }
}

// Gets the vault entries for the specific user
export async function getVaultEntries(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const entries = await db
      .collection("password_entries")
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();
    return entries;
  } catch (error) {
    console.error("Error fetching vault entries:", error);
    throw new Error("Failed to fetch vault entries");
  }
}

// Checks for duplicate vault entries
export async function checkDuplicateEntry(
  userId: string,
  website: string,
  username: string
) {
  try {
    const { db } = await connectToDatabase();
    const existing = await db.collection("password_entries").findOne({
      user_id: userId,
      website,
      username,
    });
    return existing !== null;
  } catch (error) {
    console.error("Error checking duplicate entry:", error);
    throw new Error("Failed to check duplicate entry");
  }
}

// Shamir's Secret Sharing Queries

// Gets the user's Shamir configuration when recovering
export async function getUserShamirConfig(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const config = await db
      .collection("shamir_shares")
      .findOne({ user_id: userId });

    if (!config) return null;

    return {
      total_shares: config.total_shares,
      required_shares: config.required_shares,
    };
  } catch (error) {
    console.error("Error fetching Shamir config:", error);
    return null;
  }
}

// Gets all the Shamir shares for a user that was saved when registering
export async function getUserShamirShares(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const shares = await db
      .collection("shamir_shares")
      .find({ user_id: userId })
      .sort({ share_index: 1 })
      .toArray();
    return shares;
  } catch (error) {
    console.error("Error fetching Shamir shares:", error);
    return [];
  }
}

// Validates the share hash
export async function validateShareHash(
  userId: string,
  shareIndex: number,
  shareHash: string
) {
  try {
    const { db } = await connectToDatabase();
    const share = await db.collection("shamir_shares").findOne({
      user_id: userId,
      share_index: shareIndex,
      share_hash: shareHash,
    });
    return share !== null;
  } catch (error) {
    console.error("Error validating share hash:", error);
    return false;
  }
}

// This gets the recovery attempts for a user
export async function getRecoveryAttempts(userId: string, limit: number = 10) {
  try {
    const { db } = await connectToDatabase();
    const attempts = await db
      .collection("recovery_attempts")
      .find({ user_id: userId })
      .sort({ attempt_timestamp: -1 })
      .limit(limit)
      .toArray();
    return attempts;
  } catch (error) {
    console.error("Error fetching recovery attempts:", error);
    return [];
  }
}

// Function gets the recovery agents for a user
export async function getRecoveryAgents(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const agents = await db
      .collection("recovery_agents")
      .find({ user_id: userId })
      .sort({ created_at: 1 })
      .toArray();
    return agents;
  } catch (error) {
    console.error("Error fetching recovery agents:", error);
    return [];
  }
}

// Checks if user has Shamir recovery setup when requesting to recover password
export async function hasShamirRecovery(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const count = await db
      .collection("shamir_shares")
      .countDocuments({ user_id: userId });
    return count > 0;
  } catch (error) {
    console.error("Error checking Shamir recovery setup:", error);
    return false;
  }
}
