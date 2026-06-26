import { Hono } from "hono";
import nodemailer from "nodemailer";

export const contactRouter = new Hono()
  .post("/", async (c) => {
    try {
      const body = await c.req.json();
      const { name, email, phone, subject, message } = body;

      if (!name || !email || !message) {
        return c.json({ message: "name, email, and message are required" }, 400);
      }

      // Build transporter — uses SMTP env vars (Zoho Mail / Gmail / any SMTP)
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? "smtp.zoho.com",
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: (process.env.SMTP_PORT ?? "465") === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#fff;border-radius:12px;padding:32px;border:1px solid #222;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
            <img src="https://librepair.wasmer.app/logo.png" alt="LIBrepair" style="height:36px;" />
            <span style="font-size:20px;font-weight:700;color:#e02020;">LIBrepair</span>
          </div>
          <h2 style="color:#e02020;margin:0 0 8px;">New Contact Form Submission</h2>
          <p style="color:#aaa;margin:0 0 24px;font-size:14px;">Someone filled out the contact form on librepair.com</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #222;color:#aaa;width:120px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #222;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #222;color:#aaa;">Email</td><td style="padding:10px 0;border-bottom:1px solid #222;"><a href="mailto:${email}" style="color:#e02020;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:10px 0;border-bottom:1px solid #222;color:#aaa;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #222;">${phone}</td></tr>` : ""}
            ${subject ? `<tr><td style="padding:10px 0;border-bottom:1px solid #222;color:#aaa;">Subject</td><td style="padding:10px 0;border-bottom:1px solid #222;">${subject}</td></tr>` : ""}
          </table>
          <div style="margin-top:24px;">
            <p style="color:#aaa;font-size:13px;margin:0 0 8px;">Message:</p>
            <div style="background:#1a1a1a;border-radius:8px;padding:16px;color:#fff;font-size:15px;line-height:1.6;border:1px solid #2a2a2a;">${message.replace(/\n/g, "<br/>")}</div>
          </div>
          <p style="color:#555;font-size:12px;margin-top:24px;">Reply directly to <a href="mailto:${email}" style="color:#e02020;">${email}</a></p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_USER ?? "noreply@librepair.com",
        to: ["libsupport@librepair.com", "info@librepair.com"],
        replyTo: email,
        subject: `[LIBrepair Contact] ${subject ?? `Message from ${name}`}`,
        html,
      });

      return c.json({ success: true, message: "Message sent successfully" }, 200);
    } catch (err: any) {
      console.error("[contact] ERROR:", err?.message ?? err);
      return c.json({ message: "Failed to send message. Please try again." }, 500);
    }
  });
