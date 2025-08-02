import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";

export async function POST(request: NextRequest) {
  try {
    const { userId, shareIndex, shareHash } = await request.json();
    const { db } = await connectToDatabase();

    const share = await db.collection("shamir_shares").findOne({
      user_id: userId,
      share_index: shareIndex,
      share_hash: shareHash,
    });

    return NextResponse.json({ isValid: share !== null });
  } catch (error: any) {
    console.error("Error validating share hash:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate share" },
      { status: 500 }
    );
  }
}
