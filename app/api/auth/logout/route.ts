import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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
