const nodemailer = require('nodemailer');

// AFTER
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  // Force IPv4 — Render free tier can't reach Gmail over IPv6
  family: 4,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// ── Verify connection on startup
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error) => {
    if (error) {
      console.error('Email service error:', error.message);
    } else {
      console.log('Email service ready');
    }
  });
}

// ── Base HTML wrapper
const getClientUrl = () => {
  const configuredUrl = process.env.CLIENT_URL;

  if (configuredUrl && !configuredUrl.includes('your-frontend-url.com')) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, '')}`;
  }

return `http://localhost:${process.env.PORT || 5000}`;
};

const getVerificationUrl = (token) => `${getClientUrl()}/verify-email?token=${token}`;

const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; background:#0B1020; font-family:'Segoe UI',sans-serif; }
    .container { max-width:560px; margin:40px auto; background:#0D1428; border:1px solid rgba(108,99,255,0.2); border-radius:16px; overflow:hidden; }
    .header { background:linear-gradient(135deg,#6C63FF,#7C3AED); padding:32px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:26px; font-weight:800; letter-spacing:-0.5px; }
    .header p { color:rgba(255,255,255,0.75); margin:6px 0 0; font-size:14px; }
    .body { padding:36px 32px; color:#F0F2FF; }
    .body p { color:rgba(240,242,255,0.75); font-size:15px; line-height:1.7; margin:0 0 16px; }
    .btn { display:block; width:fit-content; margin:28px auto; padding:14px 36px; background:linear-gradient(135deg,#6C63FF,#7C3AED); color:#fff; text-decoration:none; border-radius:10px; font-weight:700; font-size:15px; }
    .code-box { background:rgba(108,99,255,0.1); border:1px solid rgba(108,99,255,0.3); border-radius:10px; padding:20px; text-align:center; margin:20px 0; }
    .code-box span { font-size:32px; font-weight:800; color:#6C63FF; letter-spacing:6px; }
    .footer { padding:20px 32px; border-top:1px solid rgba(255,255,255,0.06); text-align:center; }
    .footer p { color:rgba(240,242,255,0.3); font-size:12px; margin:0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 MockAI</h1>
      <p>Intelligent Interview Prep Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer"><p>© 2025 MockAI Technologies · You received this because you signed up at MockAI.</p></div>
  </div>
</body>
</html>
`;

// ── Send verification email
const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = getVerificationUrl(token);
  const html = emailWrapper(`
    <p>Hi <strong>${name}</strong> 👋</p>
    <p>Welcome to <strong>MockAI</strong>! You're one step away from acing your interviews. Please verify your email address to activate your account.</p>
    <a class="btn" href="${verifyUrl}">✅ Verify My Email</a>
    <p style="font-size:13px;color:rgba(240,242,255,0.4);">This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
  `);

  await transporter.sendMail({
    from: `"MockAI 🤖" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Verify Your MockAI Account',
    html,
  });
};

// ── Send password reset email
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${getClientUrl()}/reset-password?token=${token}`;
  const html = emailWrapper(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received a request to reset your MockAI password. Click the button below to set a new one. This link is valid for <strong>1 hour</strong>.</p>
    <a class="btn" href="${resetUrl}">🔐 Reset My Password</a>
    <p style="font-size:13px;color:rgba(240,242,255,0.4);">If you didn't request a password reset, please ignore this email. Your account is safe.</p>
  `);

  await transporter.sendMail({
    from: `"MockAI 🤖" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Reset Your MockAI Password',
    html,
  });
};

// ── Send welcome email after verification
const sendWelcomeEmail = async (email, name) => {
  const html = emailWrapper(`
    <p>Hi <strong>${name}</strong> 🎉</p>
    <p>Your email is verified and your MockAI account is fully activated! You're all set to start practicing and landing your dream job.</p>
    <p><strong>Here's what to do next:</strong></p>
    <p>📄 Upload your resume for an ATS score<br>🎯 Select your target job role<br>🤖 Start your first AI mock interview</p>
    <a class="btn" href="${getClientUrl()}">🚀 Go to Dashboard</a>
    <p style="font-size:13px;color:rgba(240,242,255,0.4);">Good luck! The MockAI team is rooting for you.</p>
  `);

  await transporter.sendMail({
    from: `"MockAI 🤖" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to MockAI – Let\'s Get You Hired!',
    html,
  });
};

// ── Send interview completion email
const sendInterviewCompleteEmail = async (email, name, jobRole, scores) => {
  const html = emailWrapper(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>You just completed a <strong>${jobRole}</strong> mock interview on MockAI. Here's your quick score summary:</p>
    <div class="code-box">
      <p style="margin:0 0 8px;font-size:13px;color:rgba(240,242,255,0.5)">OVERALL SCORE</p>
      <span>${scores.overall}%</span>
    </div>
    <p>📊 Confidence: <strong>${scores.confidence}%</strong> &nbsp;|&nbsp; 💬 Communication: <strong>${scores.communication}%</strong> &nbsp;|&nbsp; 💻 Technical: <strong>${scores.technical}%</strong></p>
    <a class="btn" href="${getClientUrl()}/dashboard">View Full Report →</a>
    <p style="font-size:13px;color:rgba(240,242,255,0.4);">Keep practicing — consistency is the key to success!</p>
  `);

  await transporter.sendMail({
    from: `"MockAI 🤖" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `📊 Interview Report – ${jobRole} | Score: ${scores.overall}%`,
    html,
  });
};

module.exports = {
  getVerificationUrl,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendInterviewCompleteEmail,
};
