import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { verifyToken } from "@/app/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    // this tries to get user info from token for logging, but don't fail if token is invalid
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
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
      } catch (tokenError) {
        // catches if the token verification failed, but that's okay for logout
        console.log("Token verification failed during logout (this is normal)");
        // it just then continues the logout even if token is invalid
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
