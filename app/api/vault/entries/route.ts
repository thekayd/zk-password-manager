import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodbClient";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const entries = await db
      .collection("password_entries")
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();

    // converts ObjectIds to strings for React keys
    const entriesWithStringIds = entries.map((entry: any) => ({
      ...entry,
      id: entry._id.toString(),
      _id: entry._id.toString(),
    }));

    return NextResponse.json({ entries: entriesWithStringIds });
  } catch (error: any) {
    console.error("Error fetching vault entries:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vault entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, website, username, encryptedPassword } =
      await request.json();

    const { db } = await connectToDatabase();

    // This then checks for duplicate entries
    const existing = await db.collection("password_entries").findOne({
      user_id: userId,
      website,
      username,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Entry already exists for this website and username" },
        { status: 400 }
      );
    }

    const result = await db.collection("password_entries").insertOne({
      user_id: userId,
      website,
      username,
      encrypted_password: encryptedPassword,
      created_at: new Date(),
    });

    // This then logs the activity for the added entry
    await db.collection("activity_logs").insertOne({
      user_id: userId,
      activity: `Added password entry for ${website}`,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error: any) {
    console.error("Error adding vault entry:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add vault entry" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, encryptedPassword } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Converts string ID to ObjectId for document id in mongodb
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid entry ID format" },
        { status: 400 }
      );
    }

    const result = await db
      .collection("password_entries")
      .updateOne(
        { _id: objectId },
        { $set: { encrypted_password: encryptedPassword } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // This then logs the activity for the updated entry
    const entry = await db
      .collection("password_entries")
      .findOne({ _id: objectId });
    if (entry) {
      await db.collection("activity_logs").insertOne({
        user_id: entry.user_id,
        activity: `Updated password for ${entry.website}`,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating vault entry:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update vault entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Converts string ID to ObjectId for mongodb
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid entry ID format" },
        { status: 400 }
      );
    }

    // This then gets the entry before deleting for logging
    const entry = await db
      .collection("password_entries")
      .findOne({ _id: objectId });

    const result = await db
      .collection("password_entries")
      .deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // This then logs the activity for the deleted entry
    if (entry) {
      await db.collection("activity_logs").insertOne({
        user_id: entry.user_id,
        activity: `Deleted password entry for ${entry.website}`,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting vault entry:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete vault entry" },
      { status: 500 }
    );
  }
}
