import { createTransport } from "nodemailer";

// getting general SMTP client fields using nodemailer
export class SMTPClient {
  private host: string;
  private port: number;
  private username: string;
  private password: string;
  private secure: boolean;

  constructor(host: string, port: number, username: string, password: string) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.secure = port === 465; // Port 465 is SSL, 587 is STARTTLS
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      // this allows for the creation of the transport configuration
      const transportConfig = {
        host: this.host,
        port: this.port,
        secure: this.secure, // true for 465, false for other ports
        auth: {
          user: this.username,
          pass: this.password,
        },
        // for port 587 (STARTTLS)
        ...(this.port === 587 && {
          requireTLS: true,
          tls: {
            rejectUnauthorized: false, // for development, set to true in production
          },
        }),
      };

      console.log(`[SMTP] Configuring transport for ${this.host}:${this.port}`);
      console.log(`[SMTP] Secure: ${this.secure}, Username: ${this.username}`);

      const transporter = createTransport(transportConfig);

      // this .verify, verifies the connection configuration
      await transporter.verify();
      console.log("[SMTP] Connection verified successfully");

      // sends the email with the subject, body, and share value to the email address
      const mailOptions = {
        from: this.username,
        to: to,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, "<br>"),
      };

      console.log(`[SMTP] Sending email to: ${to}`);
      const info = await transporter.sendMail(mailOptions);

      // logs the email sent successfully
      console.log("[SMTP] Email sent successfully");
      console.log(`[SMTP] Message ID: ${info.messageId}`);

      return true;
    } catch (error) {
      console.error("[SMTP] Error sending email:", error);
      return false;
    }
  }
}
