// lib/crypto.ts

// Type assertion to ensure we're working with the correct buffer types
type CryptoBuffer = ArrayBuffer | ArrayBufferView;

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Create a new ArrayBuffer and copy the salt data
  const saltBuffer = new ArrayBuffer(salt.length);
  new Uint8Array(saltBuffer).set(salt);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100_000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext: string, key: CryptoKey): Promise<{ iv: Uint8Array, ciphertext: Uint8Array }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM standard IV size
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  return {
    iv,
    ciphertext: new Uint8Array(encrypted)
  };
}

export async function decrypt(ciphertext: Uint8Array, iv: Uint8Array, key: CryptoKey): Promise<string> {
  // Create a new ArrayBuffer and copy the ciphertext data
  const ciphertextBuffer = new ArrayBuffer(ciphertext.length);
  new Uint8Array(ciphertextBuffer).set(ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    // @ts-ignore
    { name: 'AES-GCM', iv },
    key,
    ciphertextBuffer
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
