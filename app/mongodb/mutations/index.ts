import { connectToDatabase } from "@/app/lib/mongodbClient";
import { generateToken } from "@/app/lib/jwt";

// This saves the vault entries
export async function saveVault(userId: string, encryptedVault: object) {
  try {
    const { db } = await connectToDatabase();
    await db
      .collection("vaults")
      .updateOne(
        { user_id: userId },
        { $set: { user_id: userId, entries: encryptedVault } },
        { upsert: true }
      );
    return true;
  } catch (error) {
    console.error("Error saving vault:", error);
    return false;
  }
}

// This function logs the activities of the user
export async function logActivity(userId: string, activity: string) {
  try {
    const { db } = await connectToDatabase();
    await db.collection("activity_logs").insertOne({
      user_id: userId,
      activity,
      timestamp: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error logging activity:", error);
    return false;
  }
}

// This function saves the recovery shares
export async function saveRecoveryShare(userId: string, share: string) {
  try {
    const { db } = await connectToDatabase();
    await db.collection("recovery_shares").insertOne({
      user_id: userId,
      share,
      created_at: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error saving recovery share:", error);
    return false;
  }
}

// updates the user password hash
export async function updateUserPasswordHash(
  email: string,
  passwordHash: string
) {
  try {
    const { db } = await connectToDatabase();
    await db
      .collection("users")
      .updateOne({ email }, { $set: { password_hash: passwordHash } });
    return true;
  } catch (error) {
    console.error("Error updating password hash:", error);
    return false;
  }
}

// This sets a new challenge when user logs in
export async function setNewChallenge(email: string, challenge: string) {
  try {
    const { db } = await connectToDatabase();
    await db.collection("users").updateOne({ email }, { $set: { challenge } });
    return true;
  } catch (error) {
    console.error("Error setting new challenge:", error);
    return false;
  }
}

// This recirds the failed attempt on the users table
export async function recordFailedAttempt(email: string) {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });
    const newFailedAttempts = (user?.failed_attempts || 0) + 1;

    const updates: any = { failed_attempts: newFailedAttempts };
    if (newFailedAttempts >= 5) {
      updates.locked_until = new Date(Date.now() + 10 * 60 * 1000);
    }

    await db.collection("users").updateOne({ email }, { $set: updates });
    return true;
  } catch (error) {
    console.error("Error recording failed attempt:", error);
    return false;
  }
}

// This resets said failed attempts back to 0
export async function resetFailedAttempts(email: string) {
  try {
    const { db } = await connectToDatabase();
    await db
      .collection("users")
      .updateOne({ email }, { $set: { failed_attempts: 0 } });
    return true;
  } catch (error) {
    console.error("Error resetting failed attempts:", error);
    return false;
  }
}

// Creates user record
export async function createUserRecord(
  email: string,
  passwordHash: string,
  userId: string
) {
  try {
    const { db } = await connectToDatabase();
    await db.collection("users").insertOne({
      id: userId,
      email,
      password_hash: passwordHash,
      failed_attempts: 0,
      challenge: null,
      locked_until: null,
      webauthn_id: null,
      webauthn_public_key: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error creating user record:", error);
    return false;
  }
}

// This function locks users after set failed attempts
export async function lockUser(email: string) {
  try {
    const { db } = await connectToDatabase();
    const unlockTime = new Date(Date.now() + 10 * 60 * 1000);
    await db
      .collection("users")
      .updateOne({ email }, { $set: { locked_until: unlockTime } });
    return true;
  } catch (error) {
    console.error("Error locking user:", error);
    return false;
  }
}

// Resets lock and attempts back to 0
export async function resetLockAndAttempts(email: string) {
  try {
    const { db } = await connectToDatabase();
    await db
      .collection("users")
      .updateOne(
        { email },
        { $set: { locked_until: null, failed_attempts: 0 } }
      );
    return true;
  } catch (error) {
    console.error("Error resetting user lock:", error);
    return false;
  }
}

// This saves the users credential ID
export async function saveCredentialId(credentialId: string, email: string) {
  try {
    const { db } = await connectToDatabase();
    await db
      .collection("users")
      .updateOne({ email }, { $set: { webauthn_id: credentialId } });
    return true;
  } catch (error) {
    console.error("Failed to save biometric ID:", error);
    return false;
  }
}

// Saves the WebAuthn public key for biometrics
export async function saveWebAuthnPublicKey(
  credential: PublicKeyCredential,
  email: string
) {
  try {
    const { db } = await connectToDatabase();
    const publicKeyString = btoa(
      String.fromCharCode(
        ...new Uint8Array(
          (
            credential.response as AuthenticatorAttestationResponse
          ).getPublicKey() as ArrayBuffer
        )
      )
    );

    await db
      .collection("users")
      .updateOne({ email }, { $set: { webauthn_public_key: publicKeyString } });
    return true;
  } catch (error) {
    console.error("Failed to save web authn public key:", error);
    return false;
  }
}

// This function adds vault entrys
export async function addVaultEntry(
  userId: string,
  website: string,
  username: string,
  encryptedPassword: string
) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection("password_entries").insertOne({
      user_id: userId,
      website,
      username,
      encrypted_password: encryptedPassword,
      created_at: new Date(),
    });
    return result;
  } catch (error) {
    console.error("Error adding vault entry:", error);
    throw new Error("Failed to add vault entry");
  }
}

// Updates the vault entry
export async function updateVaultEntry(id: string, encryptedPassword: string) {
  try {
    const { db } = await connectToDatabase();
    const result = await db
      .collection("password_entries")
      .updateOne(
        { _id: id },
        { $set: { encrypted_password: encryptedPassword } }
      );
    return result;
  } catch (error) {
    console.error("Error updating vault entry:", error);
    throw new Error("Failed to update vault entry");
  }
}

// Deletes the vault entry
export async function deleteVaultEntry(id: string) {
  try {
    const { db } = await connectToDatabase();
    await db.collection("password_entries").deleteOne({ _id: id });
    return true;
  } catch (error) {
    console.error("Error deleting vault entry:", error);
    throw new Error("Failed to delete vault entry");
  }
}

// This then saves the Shamir shares
export async function saveShamirShares(
  userId: string,
  shares: Array<{ index: number; hash: string }>,
  totalShares: number,
  requiredShares: number
) {
  try {
    const { db } = await connectToDatabase();
    const shareData = shares.map((share) => ({
      user_id: userId,
      share_index: share.index,
      share_hash: share.hash,
      total_shares: totalShares,
      required_shares: requiredShares,
      created_at: new Date(),
    }));

    await db.collection("shamir_shares").insertMany(shareData);
    return true;
  } catch (error) {
    console.error("Error saving Shamir shares:", error);
    return false;
  }
}

// Logs recovery attempts
export async function logRecoveryAttempt(
  userId: string,
  success: boolean,
  sharesUsed: number,
  requiredShares: number,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const { db } = await connectToDatabase();
    await db.collection("recovery_attempts").insertOne({
      user_id: userId,
      success,
      shares_used: sharesUsed,
      required_shares: requiredShares,
      attempt_timestamp: new Date(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    return true;
  } catch (error) {
    console.error("Error logging recovery attempt:", error);
    return false;
  }
}

// This saves the recovery agent
export async function saveRecoveryAgent(
  userId: string,
  name: string,
  email?: string,
  phone?: string,
  shareIndex?: number
) {
  try {
    const { db } = await connectToDatabase();
    await db.collection("recovery_agents").insertOne({
      user_id: userId,
      name,
      email,
      phone,
      share_index: shareIndex,
      created_at: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error saving recovery agent:", error);
    return false;
  }
}

// Updates recovery agent share
export async function updateRecoveryAgentShare(
  agentId: string,
  shareIndex: number
) {
  try {
    const { db } = await connectToDatabase();
    await db
      .collection("recovery_agents")
      .updateOne({ _id: agentId }, { $set: { share_index: shareIndex } });
    return true;
  } catch (error) {
    console.error("Error updating recovery agent share:", error);
    return false;
  }
}

// Deletes the recovery agent
export async function deleteRecoveryAgent(agentId: string) {
  try {
    const { db } = await connectToDatabase();
    await db.collection("recovery_agents").deleteOne({ _id: agentId });
    return true;
  } catch (error) {
    console.error("Error deleting recovery agent:", error);
    return false;
  }
}

// Authentication functions for user in verifying the proofs and hashes and challanges
export async function authenticateUser(email: string, password: string) {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return null;
    }

    // Verifies the password using ZKP proof validation
    const { validateProof } = await import("@/app/lib/zkp");
    const isValid = await validateProof(
      user.password_hash,
      password, // client-generated proof
      user.challenge || ""
    );

    if (!isValid) {
      return null;
    }

    const token = await generateToken(user.id);

    return { user, token };
  } catch (error) {
    console.error("Error authenticating user:", error);
    return null;
  }
}

export async function createUser(email: string, password: string) {
  try {
    const { db } = await connectToDatabase();
    const userId = Math.random().toString(36).substr(2, 9);

    await db.collection("users").insertOne({
      id: userId,
      email,
      password_hash: password,
      failed_attempts: 0,
      challenge: null,
      locked_until: null,
      webauthn_id: null,
      webauthn_public_key: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return userId;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}
