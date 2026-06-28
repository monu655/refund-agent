import nodemailer from "nodemailer";

export async function sendRefundEmail({
  to, name, orderId, decision, amount, reason,
}: {
  to: string; name: string; orderId: string;
  decision: "approved" | "rejected"; amount?: number; reason?: string;
}) {
  // If no email config, just log
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email] Would send ${decision} email to ${to} for ${orderId}`);
    return { success: true, skipped: true };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const isApproved = decision === "approved";
  const subject = isApproved ? `✅ Refund Approved — ${orderId}` : `❌ Refund Update — ${orderId}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#6366f1,#a78bfa);padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">⚡ RefundAI</h1>
      </div>
      <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <h2 style="color:${isApproved ? "#10b981" : "#ef4444"};margin:0 0 12px">
          ${isApproved ? "✅ Refund Approved!" : "❌ Refund Rejected"}
        </h2>
        <p>Dear <strong>${name}</strong>,</p>
        ${isApproved
          ? `<p>Your refund for order <strong>${orderId}</strong> has been approved!</p>
             <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
               <p style="font-size:24px;font-weight:bold;color:#166534;margin:0">₹${amount?.toLocaleString("en-IN")}</p>
               <p style="color:#166534;margin:4px 0 0">Will be credited in 3–5 business days</p>
             </div>`
          : `<p>Your refund for order <strong>${orderId}</strong> could not be processed.</p>
             <div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:8px;padding:16px;margin:16px 0">
               <p style="color:#991b1b;margin:0"><strong>Reason:</strong> ${reason ?? "Policy violation"}</p>
             </div>`
        }
        <p style="color:#6b7280;font-size:12px;margin-top:20px">Automated by RefundAI · Order: ${orderId}</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({ from: `RefundAI <${process.env.EMAIL_USER}>`, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error: (error as Error).message };
  }
}