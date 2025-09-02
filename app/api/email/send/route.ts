import { NextRequest, NextResponse } from "next/server";
import { SMTPClient } from "@/app/lib/smtpClient";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, shareValue } = await request.json();

    if (!to || !subject || !body || !shareValue) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Regex for email validation, checking for valid email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // env configuration
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUsername = process.env.SMTP_USERNAME || "";
    const smtpPassword = process.env.SMTP_PASSWORD || "";

    if (!smtpUsername || !smtpPassword) {
      return NextResponse.json(
        { error: "SMTP configuration not set up" },
        { status: 500 }
      );
    }

    // this allows for the creation of the STMP client
    const smtpClient = new SMTPClient(
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword
    );

    // Prepares the email content with the subject, body, and share value
    const emailSubject = `Your Recovery Share - ${subject}`;
    const emailBody = `
${body}

IMPORTANT: This is your recovery share for the ZK Password Manager.
Keep this secure and do not share it with anyone.

Share Value: ${shareValue}

This share is part of a Shamir Secret Sharing scheme. You need 3 out of 5 shares to recover your account.

Generated on: ${new Date().toISOString()}
    `.trim();

    // sends the email with the subject, body, and share value to the email address
    const success = await smtpClient.sendEmail(to, emailSubject, emailBody);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
