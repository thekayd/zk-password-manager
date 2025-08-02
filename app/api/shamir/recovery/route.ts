import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      success,
      sharesUsed,
      requiredShares,
      ipAddress,
      userAgent,
    } = await request.json();
    const { db } = await connectToDatabase();

    await db.collection("recovery_attempts").insertOne({
      user_id: userId,
      success,
      shares_used: sharesUsed,
      required_shares: requiredShares,
      attempt_timestamp: new Date(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error logging recovery attempt:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log recovery attempt" },
      { status: 500 }
    );
  }
}
