// // lib/crypto.ts

// // Type assertion to ensure we're working with the correct buffer types
// type CryptoBuffer = ArrayBuffer | ArrayBufferView;

// export function generateSalt(): Uint8Array {
//   return crypto.getRandomValues(new Uint8Array(16));
// }

// export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
//   const encoder = new TextEncoder();
//   const baseKey = await crypto.subtle.importKey(
//     'raw',
//     encoder.encode(password),
//     { name: 'PBKDF2' },
//     false,
//     ['deriveKey']
//   );

//   // Create a new ArrayBuffer and copy the salt data
//   const saltBuffer = new ArrayBuffer(salt.length);
//   new Uint8Array(saltBuffer).set(salt);

//   return crypto.subtle.deriveKey(
//     {
//       name: 'PBKDF2',
//       salt: saltBuffer,
//       iterations: 100_000,
//       hash: 'SHA-256'
//     },
//     baseKey,
//     { name: 'AES-GCM', length: 256 },
//     false,
//     ['encrypt', 'decrypt']
//   );
// }

// export async function encrypt(plaintext: string, key: CryptoKey): Promise<{ iv: Uint8Array, ciphertext: Uint8Array }> {
//   const encoder = new TextEncoder();
//   const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM standard IV size
//   const encrypted = await crypto.subtle.encrypt(
//     { name: 'AES-GCM', iv },
//     key,
//     encoder.encode(plaintext)
//   );
//   return {
//     iv,
//     ciphertext: new Uint8Array(encrypted)
//   };
// }

// export async function decrypt(ciphertext: Uint8Array, iv: Uint8Array, key: CryptoKey): Promise<string> {
//   // Create a new ArrayBuffer and copy the ciphertext data
//   const ciphertextBuffer = new ArrayBuffer(ciphertext.length);
//   new Uint8Array(ciphertextBuffer).set(ciphertext);

//   const decrypted = await crypto.subtle.decrypt(
//     // @ts-ignore
//     { name: 'AES-GCM', iv },
//     key,
//     ciphertextBuffer
//   );
//   const decoder = new TextDecoder();
//   return decoder.decode(decrypted);
// }




// AES-GCM Encryption/Decryption using Web Crypto API
export async function encryptAESGCM(plaintext: string, key: CryptoKey): Promise<{ cipherText: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Recommended IV length for AES-GCM
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    cipherText: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decryptAESGCM(cipherText: string, iv: string, key: CryptoKey): Promise<string> {
  const decoder = new TextDecoder();
  const encryptedBytes = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    encryptedBytes
  );

  return decoder.decode(decrypted);
}

// This helper function is to safely convert ArrayBuffer to string
export function arrayBufferToString(buffer: ArrayBuffer | ArrayBufferView): string {
  console.log('Buffer type:', {
    isArrayBuffer: buffer instanceof ArrayBuffer,
    hasBuffer: 'buffer' in buffer,
    constructor: buffer.constructor.name,
    type: typeof buffer,
    buffer: buffer
  });

  try {
    // This gets the underlying ArrayBuffer
    const arrayBuffer = 'buffer' in buffer ? buffer.buffer : buffer;
    console.log('ArrayBuffer type:', {
      isArrayBuffer: arrayBuffer instanceof ArrayBuffer,
      constructor: arrayBuffer.constructor.name,
      type: typeof arrayBuffer
    });

    const uint8Array = new Uint8Array(arrayBuffer);
    const chars = [];
    for (let i = 0; i < uint8Array.length; i++) {
      chars.push(String.fromCharCode(uint8Array[i]));
    }
    return btoa(chars.join(''));
  } catch (error) {
    console.error('Error in arrayBufferToString:', error);
    throw error;
  }
}

// exports the Key Derivation using PBKDF2
export async function deriveKey(password: string, salt: string = 'zkp-salt'): Promise<CryptoKey> {
  try {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(salt);

    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Error deriving key:', error);
    throw new Error('Failed to derive key');
  }
}

// fallback in using Manual XOR Encryption (Fallback)
export function xorEncryptDecrypt(input: string, key: string): string {
  let output = '';
  for (let i = 0; i < input.length; i++) {
    output += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return output;
}
