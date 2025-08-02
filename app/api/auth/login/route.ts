import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { generateToken } from "@/app/lib/jwt";

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

    // For now, we'll accept any password for the user
    // In a real implementation, you'd want to hash the password and compare with user.password_hash
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
