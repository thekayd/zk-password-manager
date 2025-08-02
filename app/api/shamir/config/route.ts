import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    if (!db) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const config = await db
      .collection("shamir_shares")
      .findOne({ user_id: userId });

    if (!config) {
      // returns default configuration if no shares exist yet
      return NextResponse.json({
        config: {
          total_shares: 5,
          required_shares: 3,
        },
        needsSetup: true,
      });
    }

    return NextResponse.json({
      config: {
        total_shares: config.total_shares,
        required_shares: config.required_shares,
      },
      needsSetup: false,
    });
  } catch (error: any) {
    console.error("Error fetching Shamir config:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Shamir config" },
      { status: 500 }
    );
  }
}
