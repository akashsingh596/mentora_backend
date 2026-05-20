const transporter = require('../config/mailer');
require('dotenv').config();

const FROM = process.env.MAIL_FROM || 'Mentora <noreply@mentora.in>';
const APP  = process.env.APP_NAME  || 'Mentora';
const URL  = process.env.FRONTEND_URL || 'http://localhost:5173';

const baseLayout = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
    <div style="background:#031631;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px;">${APP}</h1>
      <p style="color:#eac16c;margin:4px 0;font-size:13px;">Where Experience Meets Opportunity</p>
    </div>
    <div style="padding:32px;background:#f9fafb;">
      ${content}
    </div>
    <div style="background:#031631;padding:14px;text-align:center;">
      <p style="color:#aaa;font-size:11px;margin:0;">© ${new Date().getFullYear()} ${APP}. All rights reserved.</p>
    </div>
  </div>
`;

// ── Welcome Email ─────────────────────────────────────────────
exports.sendWelcomeEmail = async ({ name, email, role }) => {
  const msg = role === 'professional'
    ? 'Your profile is under review. We will notify you once it\'s approved and you go live!'
    : 'You can now browse India\'s top retired experts and request sessions.';

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Welcome to ${APP}!`,
    html: baseLayout(`
      <h2 style="color:#031631;">Hello ${name}! 👋</h2>
      <p>Welcome to ${APP}. Your account has been created successfully.</p>
      <p>${msg}</p>
      <a href="${URL}" style="display:inline-block;background:#eac16c;color:#031631;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px;">
        Visit ${APP}
      </a>
    `)
  });
};

// ── Professional Approved Email ───────────────────────────────
exports.sendApprovalEmail = async ({ name, email }) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `${APP} — Your profile is now live! 🎉`,
    html: baseLayout(`
      <h2 style="color:#031631;">Congratulations, ${name}! 🎉</h2>
      <p>Your professional profile has been <strong style="color:green;">approved</strong>.</p>
      <p>You are now live on the platform. Users can discover your profile and request sessions with you.</p>
      <a href="${URL}/experts" style="display:inline-block;background:#eac16c;color:#031631;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px;">
        View Your Profile
      </a>
    `)
  });
};

// ── Session Request — Notify Admin ────────────────────────────
exports.notifyAdminNewRequest = async ({ adminEmail, user, professional, session }) => {
  await transporter.sendMail({
    from: FROM,
    to: adminEmail,
    subject: `[${APP}] New Session Request — Action Required`,
    html: baseLayout(`
      <h2 style="color:#031631;">New Session Request 📬</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;color:#666;"><strong>From (User):</strong></td><td>${user.name} &lt;${user.email}&gt;</td></tr>
        <tr><td style="padding:8px;color:#666;"><strong>Expert:</strong></td><td>${professional.name} &lt;${professional.email}&gt;</td></tr>
        <tr><td style="padding:8px;color:#666;"><strong>Topic:</strong></td><td>${session.topic}</td></tr>
        <tr><td style="padding:8px;color:#666;"><strong>Preferred Time:</strong></td><td>${session.preferred_time || 'Not specified'}</td></tr>
        <tr><td style="padding:8px;color:#666;"><strong>Message:</strong></td><td>${session.message || '-'}</td></tr>
      </table>
      <p style="margin-top:20px;">Go to your admin dashboard to schedule this session and add a Google Meet link.</p>
      <a href="${URL}/admin/sessions" style="display:inline-block;background:#031631;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:8px;">
        Open Admin Dashboard
      </a>
    `)
  });
};

// ── Session Request — Notify User ─────────────────────────────
exports.sendRequestConfirmation = async ({ name, email, professional, session }) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `${APP} — Session Request Received!`,
    html: baseLayout(`
      <h2 style="color:#031631;">Your request is received! ✅</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your session request with <strong>${professional.name}</strong> has been received.</p>
      <table style="width:100%;background:#eef2f7;border-radius:8px;padding:16px;border-collapse:collapse;">
        <tr><td style="padding:6px;"><strong>Topic:</strong></td><td>${session.topic}</td></tr>
        <tr><td style="padding:6px;"><strong>Preferred Time:</strong></td><td>${session.preferred_time || 'Not specified'}</td></tr>
      </table>
      <p style="margin-top:16px;">We will review and confirm your session within <strong>24 hours</strong>. You'll receive the Google Meet link via email.</p>
    `)
  });
};

// ── Session Confirmed — Send Meet Link ────────────────────────
exports.sendSessionConfirmed = async ({ name, email, professional, session }) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `${APP} — Session Confirmed! Here's your meeting link 🎯`,
    html: baseLayout(`
      <h2 style="color:#031631;">Session Confirmed! 🎯</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your session with <strong>${professional}</strong> is confirmed.</p>
      <table style="width:100%;background:#eef2f7;border-radius:8px;padding:16px;border-collapse:collapse;">
        <tr><td style="padding:6px;"><strong>Date & Time:</strong></td><td>${session.scheduled_at}</td></tr>
        <tr><td style="padding:6px;"><strong>Topic:</strong></td><td>${session.topic}</td></tr>
      </table>
      <div style="text-align:center;margin-top:24px;">
        <a href="${session.meeting_link}" style="display:inline-block;background:#eac16c;color:#031631;padding:14px 36px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
          Join Google Meet
        </a>
      </div>
      <p style="color:#888;font-size:12px;margin-top:16px;">Or copy this link: ${session.meeting_link}</p>
    `)
  });
};
