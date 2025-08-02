import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { verifyToken } from "@/app/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    // gets the authorization header for the user to get the token and verify it
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // fetches activity logs for the user, sorted by timestamp (newest first)
    const logs = await db
      .collection("activity_logs")
      .find({ user_id: decoded.userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
