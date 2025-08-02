import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { generateToken } from "@/app/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Email and user ID required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // logs successful biometric login activity
    await db.collection("activity_logs").insertOne({
      user_id: userId,
      activity: "User logged in with biometrics",
      timestamp: new Date(),
    });

    // this generates a token for the user
    const token = await generateToken(userId);

    return NextResponse.json({
      success: true,
      user: { id: userId, email },
      token,
    });
  } catch (error: any) {
    console.error("Biometric login error:", error);
    return NextResponse.json(
      { error: error.message || "Biometric login failed" },
      { status: 500 }
    );
  }
}
