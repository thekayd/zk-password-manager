import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { FingerprintReader } from "@/app/lib/fingerprint";

// This function is used to register a fingerprint during registration
export async function POST(request: NextRequest) {
  try {
    const { email, fingerprintData } = await request.json();

    if (!email || !fingerprintData) {
      return NextResponse.json(
        { error: "Missing required fields: email, fingerprintData" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // this is a checker to see if user exists
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // this then stores the fingerprint template for the user
    const result = await db.collection("users").updateOne(
      { email },
      {
        $set: {
          fingerprint_template: fingerprintData,
          fingerprint_registered: true,
          fingerprint_registered_at: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to save fingerprint template" },
        { status: 500 }
      );
    }

    // this then logs the fingerprint registration to the activity feed
    await db.collection("activity_logs").insertOne({
      user_id: user.id,
      activity: "User registered fingerprint",
      timestamp: new Date(),
      details: {
        method: "fingerprint",
        quality: fingerprintData.quality,
        deviceInfo: fingerprintData.deviceInfo,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Fingerprint template saved successfully",
    });
  } catch (error: any) {
    console.error("Fingerprint registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save fingerprint template" },
      { status: 500 }
    );
  }
}

// we then use a put request to verify the fingerprint during login
export async function PUT(request: NextRequest) {
  try {
    const { email, fingerprintData } = await request.json();

    if (!email || !fingerprintData) {
      return NextResponse.json(
        { error: "Missing required fields: email, fingerprintData" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // this then gets the user's stored fingerprint template
    const user = await db.collection("users").findOne(
      { email },
      {
        projection: {
          id: 1,
          fingerprint_template: 1,
          fingerprint_registered: 1,
        },
      }
    );

    if (!user || !user.fingerprint_registered) {
      // additional logging to see if the user is attempting to use fingerprint when not registered
      if (user) {
        await db.collection("activity_logs").insertOne({
          user_id: user.id,
          activity: "Attempted fingerprint login without registration",
          timestamp: new Date(),
          details: {
            method: "fingerprint",
            status: "not_registered",
            email: email,
          },
        });
      }

      return NextResponse.json(
        { error: "No fingerprint template found for this user" },
        { status: 404 }
      );
    }

    // Verifies the fingerprint using the reader for the fingerprint
    const reader = new FingerprintReader();
    const matchResult = await reader.matchFingerprints(
      fingerprintData,
      user.fingerprint_template
    );

    if (!matchResult.isMatch) {
      // this then logs the failed fingerprint verification attempt
      await db.collection("activity_logs").insertOne({
        user_id: user.id,
        activity: "Failed fingerprint verification attempt",
        timestamp: new Date(),
        details: {
          method: "fingerprint",
          matchScore: matchResult.matchScore,
          email: email,
        },
      });

      return NextResponse.json(
        { error: "Fingerprint verification failed" },
        { status: 401 }
      );
    }

    // adds the successful authentication to both collections in auth and activity logs
    await db.collection("auth_logs").insertOne({
      userId: user.id,
      email,
      method: "fingerprint",
      success: true,
      timestamp: new Date(),
      matchScore: matchResult.matchScore,
    });

    await db.collection("activity_logs").insertOne({
      user_id: user.id,
      activity: "User logged in with fingerprint",
      timestamp: new Date(),
      details: {
        method: "fingerprint",
        matchScore: matchResult.matchScore,
        email: email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Fingerprint verification successful",
      userId: user.id,
      matchScore: matchResult.matchScore,
    });
  } catch (error: any) {
    console.error("Fingerprint verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify fingerprint" },
      { status: 500 }
    );
  }
}

// this then gets the fingerprint registration status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const user = await db.collection("users").findOne(
      { email },
      {
        projection: {
          fingerprint_registered: 1,
          fingerprint_registered_at: 1,
        },
      }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.collection("activity_logs").insertOne({
      user_id: user.id,
      activity: "Checked fingerprint registration status",
      timestamp: new Date(),
      details: {
        method: "fingerprint",
        hasFingerprint: user.fingerprint_registered || false,
        email: email,
      },
    });

    return NextResponse.json({
      success: true,
      hasFingerprint: user.fingerprint_registered || false,
      registeredAt: user.fingerprint_registered_at || null,
    });
  } catch (error: any) {
    console.error("Fingerprint status check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check fingerprint status" },
      { status: 500 }
    );
  }
}
