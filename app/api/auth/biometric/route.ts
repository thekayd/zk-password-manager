import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { UnifiedBiometricSystem } from "@/app/lib/biometric";
import { generateChallenge } from "@/app/lib/zkp";

// post fingerprint or face
export async function POST(request: NextRequest) {
  try {
    const { email, biometricData } = await request.json();

    if (!email || !biometricData) {
      return NextResponse.json(
        { error: "Missing required fields: email, biometricData" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // checker to check if user exists
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // prepares the data based on biometric type and sets the registered flag to true
    const updateData: any = {
      [`${biometricData.type}_template`]: biometricData,
      [`${biometricData.type}_registered`]: true,
      [`${biometricData.type}_registered_at`]: new Date(),
    };

    // stores the ZKP challenge 
    if (biometricData.zkpChallenge) {
      updateData[`zkp_${biometricData.type}_registration_challenge`] =
        biometricData.zkpChallenge;
      console.log(`Storing ZKP challenge for ${biometricData.type}:`, {
        challenge: biometricData.zkpChallenge.substring(0, 16) + "...",
        field: `zkp_${biometricData.type}_registration_challenge`,
      });
    } else {
      console.warn(`No ZKP challenge provided for ${biometricData.type}`);
    }

    // saves the biometric 
    const result = await db
      .collection("users")
      .updateOne({ email }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: `Failed to save ${biometricData.type} template` },
        { status: 500 }
      );
    }

    // logs the biometric registration in the activity logs
    await db.collection("activity_logs").insertOne({
      user_id: user.id,
      activity: `User registered ZKP-secured ${biometricData.type}`,
      timestamp: new Date(),
      details: {
        method: `${biometricData.type}_zkp`,
        quality: biometricData.quality,
        deviceInfo: biometricData.deviceInfo,
        zkpChallenge: biometricData.zkpChallenge,
      },
    });

    const methodName =
      biometricData.type === "fingerprint" ? "Fingerprint" : "Face";
    return NextResponse.json({
      success: true,
      message: `ZKP-secured ${methodName.toLowerCase()} saved successfully`,
    });
  } catch (error: any) {
    console.error("Biometric registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save biometric template" },
      { status: 500 }
    );
  }
}

// put for fingerprint or face login/ this is the main function that is used to verify the biometric data during login
export async function PUT(request: NextRequest) {
  try {
    const { email, biometricData } = await request.json();

    if (!email || !biometricData) {
      return NextResponse.json(
        { error: "Missing required fields: email, biometricData" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // gets the users stored biometric data
    const user = await db.collection("users").findOne(
      { email },
      {
        projection: {
          id: 1,
          [`${biometricData.type}_template`]: 1,
          [`${biometricData.type}_registered`]: 1,
          [`zkp_${biometricData.type}_registration_challenge`]: 1,
        },
      }
    );

    if (!user || !user[`${biometricData.type}_registered`]) {
      // logs the failed attempt in the activity logs
      if (user) {
        await db.collection("activity_logs").insertOne({
          user_id: user.id,
          activity: `Attempted ${biometricData.type} login without registration`,
          timestamp: new Date(),
          details: {
            method: biometricData.type,
            status: "not_registered",
            email: email,
          },
        });
      }

      return NextResponse.json(
        { error: `No ${biometricData.type} template found for this user` },
        { status: 404 }
      );
    }

    // gets the stored ZKP challenge from registration
    const storedChallenge =
      user[`zkp_${biometricData.type}_registration_challenge`];

    console.log(`Retrieved ZKP challenge for ${biometricData.type}:`, {
      hasChallenge: !!storedChallenge,
      challenge: storedChallenge?.substring(0, 16) + "...",
      field: `zkp_${biometricData.type}_registration_challenge`,
      userFields: Object.keys(user).filter((key) => key.includes("zkp")),
    });

    if (!storedChallenge) {
      await db.collection("activity_logs").insertOne({
        user_id: user.id,
        activity: `No ZKP challenge found for ${biometricData.type}`,
        timestamp: new Date(),
        details: {
          method: `${biometricData.type}_zkp`,
          email: email,
          userFields: Object.keys(user).filter((key) => key.includes("zkp")),
          biometricType: biometricData.type,
        },
      });

      return NextResponse.json(
        { error: `No ZKP challenge found for ${biometricData.type}` },
        { status: 400 }
      );
    }

    // verifies the biometric data using the unified system
    const biometricSystem = new UnifiedBiometricSystem();
    const matchResult = await biometricSystem.matchBiometric(
      biometricData,
      user[`${biometricData.type}_template`]
    );

    if (!matchResult.isMatch) {
      // logs the failed verification in the activity logs
      await db.collection("activity_logs").insertOne({
        user_id: user.id,
        activity: `Failed ${biometricData.type} verification attempt`,
        timestamp: new Date(),
        details: {
          method: biometricData.type,
          matchScore: matchResult.matchScore,
          email: email,
        },
      });

      return NextResponse.json(
        { error: `${biometricData.type} verification failed` },
        { status: 401 }
      );
    }

    // validates the ZKP proof using the stored challenge
    if (biometricData.zkpProof) {
      console.log(`Validating ZKP for ${biometricData.type}:`, {
        hasProof: !!biometricData.zkpProof,
        hasChallenge: !!storedChallenge,
        storedChallenge: storedChallenge?.substring(0, 16) + "...",
        submittedProof: biometricData.zkpProof?.substring(0, 16) + "...",
      });

      const zkpValid = await biometricSystem.validateZkpProof(
        user[`${biometricData.type}_template`],
        biometricData.zkpProof,
        storedChallenge
      );

      console.log(`ZKP validation result: ${zkpValid}`);

      if (!zkpValid) {
        await db.collection("activity_logs").insertOne({
          user_id: user.id,
          activity: `Failed ZKP ${biometricData.type} proof validation`,
          timestamp: new Date(),
          details: {
            method: `${biometricData.type}_zkp`,
            email: email,
            hasProof: !!biometricData.zkpProof,
            hasChallenge: !!storedChallenge,
          },
        });

        return NextResponse.json(
          { error: `ZKP ${biometricData.type} proof validation failed` },
          { status: 401 }
        );
      }
    }

    // logs the successful authentication in the auth logs
    await db.collection("auth_logs").insertOne({
      userId: user.id,
      email,
      method: `${biometricData.type}_zkp`,
      success: true,
      timestamp: new Date(),
      matchScore: matchResult.matchScore,
      zkpChallenge: storedChallenge,
    });

    await db.collection("activity_logs").insertOne({
      user_id: user.id,
      activity: `User logged in with ZKP-secured ${biometricData.type}`,
      timestamp: new Date(),
      details: {
        method: `${biometricData.type}_zkp`,
        matchScore: matchResult.matchScore,
        email: email,
        zkpChallenge: storedChallenge,
      },
    });

    const methodName =
      biometricData.type === "fingerprint" ? "Fingerprint" : "Face";
    return NextResponse.json({
      success: true,
      message: `ZKP-secured ${methodName.toLowerCase()} verification successful`,
      userId: user.id,
      matchScore: matchResult.matchScore,
      zkpChallenge: storedChallenge,
    });
  } catch (error: any) {
    console.error("Biometric verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify biometric data" },
      { status: 500 }
    );
  }
}

// gets the biometric registration status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const type = searchParams.get("type") || "all"; 

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
          face_registered: 1,
          face_registered_at: 1,
        },
      }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // logs the status check in the activity logs
    await db.collection("activity_logs").insertOne({
      user_id: user.id,
      activity: "Checked biometric registration status",
      timestamp: new Date(),
      details: {
        method: "biometric_status",
        type: type,
        email: email,
      },
    });

    const response: any = {
      success: true,
    };

    if (type === "all" || type === "fingerprint") {
      response.hasFingerprint = user.fingerprint_registered || false;
      response.fingerprintRegisteredAt = user.fingerprint_registered_at || null;
    }

    if (type === "all" || type === "face") {
      response.hasFace = user.face_registered || false;
      response.faceRegisteredAt = user.face_registered_at || null;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Biometric status check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check biometric status" },
      { status: 500 }
    );
  }
}
