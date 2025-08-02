import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";

export async function POST(request: NextRequest) {
  try {
    const { email, credentialId, publicKey } = await request.json();
    const { db } = await connectToDatabase();

    // this saves the credential ID
    await db
      .collection("users")
      .updateOne({ email }, { $set: { webauthn_id: credentialId } });

    // then saves the public key if provided by the user
    if (publicKey) {
      await db
        .collection("users")
        .updateOne({ email }, { $set: { webauthn_public_key: publicKey } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Biometric save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save biometric data" },
      { status: 500 }
    );
  }
}
