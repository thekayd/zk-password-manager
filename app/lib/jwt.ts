const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key";

// functiom for browser-compatible JWT implementation
export async function generateToken(userId: string): Promise<string> {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours timestamp for jwt
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signatureInput)
  );

  const signatureBase64 = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  )
    .replace(/\+/g, "+")
    .replace(/\//g, "/")
    .replace(/=/g, "=");

  return `${encodedHeader}.${encodedPayload}.${signatureBase64}`;
}

export async function verifyToken(token: string): Promise<{ userId: string }> {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    // Validate token structure
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error("Invalid token format");
    }

    // This verifies the signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    try {
      const signatureBytes = Uint8Array.from(atob(signature), (c) =>
        c.charCodeAt(0)
      );

      const isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        signatureBytes,
        encoder.encode(signatureInput)
      );

      if (!isValid) {
        throw new Error("Invalid token signature");
      }
    } catch (decodeError) {
      throw new Error("Invalid token signature");
    }

    const payload = JSON.parse(atob(encodedPayload));

    // Debug token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - currentTime;
    console.log("Token expiration check:", {
      currentTime,
      tokenExpiry: payload.exp,
      timeUntilExpiry: timeUntilExpiry,
      expiresIn: `${Math.floor(timeUntilExpiry / 3600)} hours ${Math.floor(
        (timeUntilExpiry % 3600) / 60
      )} minutes`,
    });

    // This if statement then checks the expiration
    if (payload.exp < currentTime) {
      throw new Error("Token has expired");
    }

    return { userId: payload.userId };
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Invalid token");
  }
}
