/**
 * Email notifications via Nodemailer.
 *
 * To send real email, set these in backend/.env:
 *   MAIL_HOST=smtp.gmail.com
 *   MAIL_PORT=587
 *   MAIL_USER=your@gmail.com
 *   MAIL_PASS=your_app_password
 *   MAIL_FROM=CivicSense AI <your@gmail.com>
 *
 * If SMTP is not configured, emails are "sent" to the server console so the
 * feature is still demonstrable without credentials (and never breaks the app).
 */

let transporter = null;
let configured = false;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.MAIL_HOST;
  if (!host) {
    configured = false;
    return null;
  }

  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: (parseInt(process.env.MAIL_PORT) || 587) === 465,
    auth: process.env.MAIL_USER
      ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
      : undefined
  });
  configured = true;
  return transporter;
}

/**
 * Send an email. Resolves with { delivered: boolean }.
 * Never throws — failures are logged and swallowed so email never breaks the flow.
 */
async function sendEmail({ to, subject, text, html }) {
  const tr = getTransporter();
  const from = process.env.MAIL_FROM || process.env.MAIL_USER || 'CivicSense AI <noreply@civicsense.local>';

  if (!tr || !configured) {
    console.log(`\n📧 [mailer] Would send email to ${to} (SMTP not configured — logging only)\n  Subject: ${subject}\n  ${text}\n`);
    return { delivered: false, mode: 'console' };
  }

  try {
    await tr.sendMail({ from, to, subject, text, html });
    return { delivered: true, mode: 'smtp' };
  } catch (error) {
    console.warn(`[mailer] Email to ${to} failed: ${error.message}`);
    return { delivered: false, mode: 'failed' };
  }
}

module.exports = { sendEmail };