import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { verifyToken } from "@/app/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    // gets the authorization header for the user to get the token and verify it
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      if (decoded && decoded.userId) {
        // this then decodes and decodes the token and logs the logout activity
        const { db } = await connectToDatabase();
        await db.collection("activity_logs").insertOne({
          user_id: decoded.userId,
          activity: "User logged out",
          timestamp: new Date(),
        });
      }
    }

    //  returns success since the client handles token removal
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: error.message || "Logout failed" },
      { status: 500 }
    );
  }
}
