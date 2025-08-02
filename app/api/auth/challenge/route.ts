import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";

export async function POST(request: NextRequest) {
  try {
    const { email, challenge } = await request.json();
    const { db } = await connectToDatabase();

    await db.collection("users").updateOne({ email }, { $set: { challenge } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Challenge error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set challenge" },
      { status: 500 }
    );
  }
}
