import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { FingerprintReader } from "@/app/lib/fingerprint";
import { generateChallenge } from "@/app/lib/zkp";

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

    // this then stores the ZKP challenge if provided during registration
    // this is then used to validate the fingerprint during login
    const updateData: any = {
      fingerprint_template: fingerprintData,
      fingerprint_registered: true,
      fingerprint_registered_at: new Date(),
    };

    if (fingerprintData.zkpChallenge) {
      updateData.zkp_registration_challenge = fingerprintData.zkpChallenge;
    }

    // this then stores the fingerprint template for the user
    const result = await db
      .collection("users")
      .updateOne({ email }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to save fingerprint template" },
        { status: 500 }
      );
    }

    // this then logs the fingerprint registration to the activity feed
    await db.collection("activity_logs").insertOne({
      user_id: user.id,
      activity: "User registered ZKP-secured fingerprint",
      timestamp: new Date(),
      details: {
        method: "fingerprint_zkp",
        quality: fingerprintData.quality,
        deviceInfo: fingerprintData.deviceInfo,
        zkpChallenge: fingerprintData.zkpChallenge,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ZKP-secured fingerprint saved successfully",
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
          challenge: 1,
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

    // this generates a ZKP challenge for this authentication session
    const zkpChallenge = generateChallenge();

    // this then updates the user's challenge for this session
    await db
      .collection("users")
      .updateOne({ email }, { $set: { challenge: zkpChallenge } });

    // this then verifies the fingerprint using the reader for the fingerprint
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

    // this then validates the ZKP biometric proof if provided before the login
    if (fingerprintData.zkpProof && fingerprintData.zkpChallenge) {
      const zkpValid = await reader.validateZkpBiometricProof(
        user.fingerprint_template,
        fingerprintData.zkpProof,
        fingerprintData.zkpChallenge
      );

      if (!zkpValid) {
        await db.collection("activity_logs").insertOne({
          user_id: user.id,
          activity: "Failed ZKP biometric proof validation",
          timestamp: new Date(),
          details: {
            method: "fingerprint_zkp",
            email: email,
          },
        });

        return NextResponse.json(
          { error: "ZKP biometric proof validation failed" },
          { status: 401 }
        );
      }
    }

    // adds the successful authentication to both collections in auth and activity logs
    await db.collection("auth_logs").insertOne({
      userId: user.id,
      email,
      method: "fingerprint_zkp",
      success: true,
      timestamp: new Date(),
      matchScore: matchResult.matchScore,
      zkpChallenge: zkpChallenge,
    });

    await db.collection("activity_logs").insertOne({
      user_id: user.id,
      activity: "User logged in with ZKP-secured fingerprint",
      timestamp: new Date(),
      details: {
        method: "fingerprint_zkp",
        matchScore: matchResult.matchScore,
        email: email,
        zkpChallenge: zkpChallenge,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ZKP-secured fingerprint verification successful",
      userId: user.id,
      matchScore: matchResult.matchScore,
      zkpChallenge: zkpChallenge,
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
