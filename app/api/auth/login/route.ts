import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { generateToken } from "@/app/lib/jwt";
import { validateProof } from "@/app/lib/zkp";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verifies the password using ZKP proof validation
    const isValid = await validateProof(
      user.password_hash,
      password, // client-generated proof
      user.challenge || ""
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await generateToken(user.id);

    console.log(
      "Login successful for user:",
      user.id,
      "Token generated:",
      token.substring(0, 20) + "..."
    );

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
