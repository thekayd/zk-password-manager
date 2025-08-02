import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const { db } = await connectToDatabase();

    const user = await db
      .collection("users")
      .findOne({ email }, { projection: { id: 1, webauthn_id: 1 } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("WebAuthn error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch WebAuthn data" },
      { status: 500 }
    );
  }
}
