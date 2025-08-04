export interface Share {
  id: number;
  value: string;
  checksum: string;
}

export interface ShamirConfig {
  totalShares: number;
  requiredShares: number;
}

// hash function for validation
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Converts hash to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// Generates a random string for share generation
function generateRandomString(length: number = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// XOR-based share generation
function createShares(secret: string, config: ShamirConfig): Share[] {
  const shares: Share[] = [];

  // Creates the required number of shares
  for (let i = 1; i <= config.totalShares; i++) {
    // Generates a random key for this share
    const randomKey = generateRandomString(secret.length);

    // XORs the secret with the random key to create the share
    let shareValue = "";
    for (let j = 0; j < secret.length; j++) {
      const secretChar = secret.charCodeAt(j);
      const keyChar = randomKey.charCodeAt(j);
      const xorChar = secretChar ^ keyChar;
      shareValue += String.fromCharCode(xorChar);
    }

    // Encodes the share value and key together
    const shareData = {
      value: shareValue,
      key: randomKey,
      id: i,
    };

    const encodedShare = btoa(JSON.stringify(shareData));

    shares.push({
      id: i,
      value: encodedShare,
      checksum: simpleHash(encodedShare),
    });
  }

  return shares;
}

// Reconstructs the secret from shares
function reconstructFromShares(shares: Share[]): string {
  console.log(`Reconstructing from ${shares.length} shares`);

  if (shares.length < 2) {
    throw new Error("At least 2 shares are required");
  }

  try {
    // uses the the first share to reconstruct the secret
    // all the shares should then reconstruct to the same secret
    const firstShare = shares[0];
    console.log("Using first share for reconstruction:", firstShare.id);

    const shareData = JSON.parse(atob(firstShare.value));
    console.log("Decoded share data:", {
      hasValue: !!shareData.value,
      hasKey: !!shareData.key,
      valueLength: shareData.value?.length,
      keyLength: shareData.key?.length,
    });

    const { value: shareValue, key: randomKey } = shareData;

    // XOR the share value with the key to get back the original secret
    let secret = "";
    for (let i = 0; i < shareValue.length; i++) {
      const shareChar = shareValue.charCodeAt(i);
      const keyChar = randomKey.charCodeAt(i);
      const originalChar = shareChar ^ keyChar;
      secret += String.fromCharCode(originalChar);
    }

    console.log(
      "Reconstructed secret from first share, length:",
      secret.length
    );

    // this then allows for the verification that all other shares reconstruct to the same secret
    for (let i = 1; i < shares.length; i++) {
      const share = shares[i];
      console.log(`Verifying share ${share.id}...`);

      const shareData = JSON.parse(atob(share.value));
      const { value: shareValue, key: randomKey } = shareData;

      let reconstructedSecret = "";
      for (let j = 0; j < shareValue.length; j++) {
        const shareChar = shareValue.charCodeAt(j);
        const keyChar = randomKey.charCodeAt(j);
        const originalChar = shareChar ^ keyChar;
        reconstructedSecret += String.fromCharCode(originalChar);
      }

      console.log(
        `Share ${share.id} reconstructed secret length:`,
        reconstructedSecret.length
      );

      if (reconstructedSecret !== secret) {
        console.error("Share verification failed - secrets don't match");
        throw new Error("Shares do not reconstruct to the same secret");
      }

      console.log(`Share ${share.id} verification passed`);
    }

    console.log("All shares verified successfully");
    return secret;
  } catch (error) {
    console.error("Error in reconstructFromShares:", error);
    throw new Error("Invalid share format");
  }
}

// Validates a share
function validateShare(share: Share): boolean {
  console.log(`Validating share ${share.id}:`, {
    value: share.value.substring(0, 50) + "...",
    checksum: share.checksum,
  });

  const expectedChecksum = simpleHash(share.value);
  const isValid = share.checksum === expectedChecksum;

  console.log(`Share ${share.id} validation:`, {
    expectedChecksum,
    actualChecksum: share.checksum,
    isValid,
  });

  return isValid;
}

// Generates shares
export function generateShares(secret: string, config: ShamirConfig): Share[] {
  console.log("Generating shares with config:", config);
  console.log("Secret length:", secret.length);

  if (config.requiredShares > config.totalShares) {
    throw new Error("Required shares cannot be greater than total shares");
  }

  if (config.requiredShares < 2) {
    throw new Error("At least 2 shares are required");
  }

  const shares = createShares(secret, config);
  console.log(`Generated ${shares.length} shares`);

  return shares;
}

// Reconstructs the secret
export function reconstructSecret(shares: Share[]): string {
  console.log(`Attempting to reconstruct secret from ${shares.length} shares`);

  // Validates all shares first
  for (const share of shares) {
    console.log(`Validating share ${share.id}...`);
    if (!validateShare(share)) {
      console.error(`Share ${share.id} validation failed`);
      throw new Error(`Invalid share ${share.id}`);
    }
    console.log(`Share ${share.id} validation passed`);
  }

  console.log("All shares validated, reconstructing secret...");
  const secret = reconstructFromShares(shares);
  console.log("Secret reconstruction completed, length:", secret.length);

  return secret;
}

// Encodes share for storage/transmission
export function encodeShare(share: Share): string {
  return btoa(JSON.stringify(share));
}

// Decodes share from storage/transmission
export function decodeShare(encodedShare: string): Share {
  try {
    return JSON.parse(atob(encodedShare));
  } catch (error) {
    throw new Error("Invalid share format");
  }
}

// Validates a set of shares
export function validateShares(shares: Share[]): boolean {
  if (shares.length < 2) return false;

  for (const share of shares) {
    if (!validateShare(share)) return false;
  }

  return true;
}

// Generates a random secret for testing
export function generateRandomSecret(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generates hash for share validation (for database storage)
export function generateShareHash(share: Share): string {
  return simpleHash(share.value);
}

// Validates             share using hash from database
export function validateShareWithHash(
  share: Share,
  expectedHash: string
): boolean {
  const actualHash = generateShareHash(share);
  return actualHash === expectedHash;
}
