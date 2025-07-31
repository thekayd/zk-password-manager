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
  if (shares.length < 2) {
    throw new Error("At least 2 shares are required");
  }

  // Uses the first share to reconstruct
  const firstShare = shares[0];

  try {
    const shareData = JSON.parse(atob(firstShare.value));
    const { value: shareValue, key: randomKey } = shareData;

    // XORs back to get the original secret
    let secret = "";
    for (let i = 0; i < shareValue.length; i++) {
      const shareChar = shareValue.charCodeAt(i);
      const keyChar = randomKey.charCodeAt(i);
      const originalChar = shareChar ^ keyChar;
      secret += String.fromCharCode(originalChar);
    }

    return secret;
  } catch (error) {
    throw new Error("Invalid share format");
  }
}

// Validates a share
function validateShare(share: Share): boolean {
  const expectedChecksum = simpleHash(share.value);
  return share.checksum === expectedChecksum;
}

// Generates shares
export function generateShares(secret: string, config: ShamirConfig): Share[] {
  if (config.requiredShares > config.totalShares) {
    throw new Error("Required shares cannot be greater than total shares");
  }

  if (config.requiredShares < 2) {
    throw new Error("At least 2 shares are required");
  }

  return createShares(secret, config);
}

// Reconstructs the secret
export function reconstructSecret(shares: Share[]): string {
  // Validates all shares first
  for (const share of shares) {
    if (!validateShare(share)) {
      throw new Error(`Invalid share ${share.id}`);
    }
  }

  return reconstructFromShares(shares);
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
