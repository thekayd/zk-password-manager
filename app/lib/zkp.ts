import { deriveKey, arrayBufferToString } from "./crypto";

// This function generates a random challenge string
export function generateChallenge(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => ("0" + byte.toString(16)).slice(-2)).join(
    ""
  );
}

// for client-side encyption in the client: Generate proof (hash of password + challenge)
export async function generateProof(
  password: string,
  challenge: string
): Promise<string> {
  try {
    // This then derives the key from the password
    const key = await deriveKey(password);
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const keyString = arrayBufferToString(rawKey);

    // This then hashes the key with the challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString + challenge);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return arrayBufferToString(hashBuffer);
  } catch (error) {
    console.error("Error generating proof:", error);
    throw new Error("Failed to generate proof");
  }
}

// in the server side - the server only validates not stores or encrypta
// Server: Validate proof (stored password hash + challenge)
export async function validateProof(
  storedHash: string,
  submittedProof: string,
  challenge: string
): Promise<boolean> {
  try {
    // This then hases the stored hash with the challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(storedHash + challenge);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const expectedProof = arrayBufferToString(hashBuffer);

    return expectedProof === submittedProof;
  } catch (error) {
    console.error("Error validating proof:", error);
    return false;
  }
}

// This async function generates a ZKP-Biometric authentication function
export async function generateZkpBiometricProof(
  biometricData: string,
  challenge: string,
  userId: string
): Promise<string> {
  try {
    // then combines the biometric data with ZKP challenge and user ID for uniqueness
    const encoder = new TextEncoder();
    const combinedData = encoder.encode(biometricData + challenge + userId);

    // this generates a hash as proof for the biometric data
    const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData);
    return arrayBufferToString(hashBuffer);
  } catch (error) {
    console.error("Error generating ZKP biometric proof:", error);
    throw new Error("Failed to generate ZKP biometric proof");
  }
}

// This async function validates ZKP-Biometric proof
export async function validateZkpBiometricProof(
  storedBiometricData: string,
  submittedProof: string,
  challenge: string,
  userId: string
): Promise<boolean> {
  try {
    const expectedProof = await generateZkpBiometricProof(
      storedBiometricData,
      challenge,
      userId
    );
    return expectedProof === submittedProof;
  } catch (error) {
    console.error("Error validating ZKP biometric proof:", error);
    return false;
  }
}
