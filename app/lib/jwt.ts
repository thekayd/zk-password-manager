import { jwtDecode } from 'jwt-decode';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'your-secret-key';

// functiom for browser-compatible JWT implementation
export async function generateToken(userId: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour timestamp for jwt
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signatureInput)
  );
  
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${encodedHeader}.${encodedPayload}.${signatureBase64}`;
}

export async function verifyToken(token: string): Promise<{ userId: string }> {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    // This verifies the signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(signatureInput)
    );
    
    if (!isValid) {
      throw new Error('Invalid token signature');
    }
    
    const payload = JSON.parse(atob(encodedPayload));
    
    // This if statement then checks the expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token has expired');
    }
    
    return { userId: payload.userId };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}
