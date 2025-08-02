import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne(
      { email },
      {
        projection: {
          id: 1,
          password_hash: 1,
          failed_attempts: 1,
          challenge: 1,
          locked_until: 1,
        },
      }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Fetch user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}
