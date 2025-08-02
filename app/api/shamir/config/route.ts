import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    const { db } = await connectToDatabase();

    const config = await db
      .collection("shamir_shares")
      .findOne({ user_id: userId });

    if (!config) {
      return NextResponse.json({ config: null });
    }

    return NextResponse.json({
      config: {
        total_shares: config.total_shares,
        required_shares: config.required_shares,
      },
    });
  } catch (error: any) {
    console.error("Error fetching Shamir config:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Shamir config" },
      { status: 500 }
    );
  }
}
