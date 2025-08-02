import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { deriveKey } from "@/app/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // This derives the password hash
    const key = await deriveKey(password);
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const passwordHash = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

    // And then creates the user in MongoDB
    const { db } = await connectToDatabase();
    const userId = Math.random().toString(36).substr(2, 9);

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

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
