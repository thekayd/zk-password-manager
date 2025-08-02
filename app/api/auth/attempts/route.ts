import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";

export async function POST(request: NextRequest) {
  try {
    const { email, action } = await request.json();
    const { db } = await connectToDatabase();

    if (action === "record") {
      const user = await db.collection("users").findOne({ email });
      const newFailedAttempts = (user?.failed_attempts || 0) + 1;

      const updates: any = { failed_attempts: newFailedAttempts };
      if (newFailedAttempts >= 5) {
        updates.locked_until = new Date(Date.now() + 10 * 60 * 1000);
      }

      await db.collection("users").updateOne({ email }, { $set: updates });
    } else if (action === "reset") {
      await db
        .collection("users")
        .updateOne(
          { email },
          { $set: { failed_attempts: 0, locked_until: null } }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Attempts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update attempts" },
      { status: 500 }
    );
  }
}
