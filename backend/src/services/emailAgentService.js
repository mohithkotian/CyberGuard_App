const nodemailer = require('nodemailer');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const MailLog = require('../models/MailLog');

const PLACEHOLDER_VALUES = [
  'your-email@gmail.com',
  'your-app-password',
  '<copy_from_my_env>',
];

const cleanEnv = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed || PLACEHOLDER_VALUES.includes(trimmed)) return '';
  return trimmed;
};

let cachedTransporter = null;
let cachedSmtpKey = '';

const getEmailConfig = () => {
  const smtpHost = cleanEnv(process.env.SMTP_HOST) || 'smtp.gmail.com';
  const smtpPort = Number(cleanEnv(process.env.SMTP_PORT)) || 587;
  const smtpUser = cleanEnv(process.env.SMTP_USER) || cleanEnv(process.env.EMAIL_USER);
  const smtpPass = cleanEnv(process.env.SMTP_PASS) || cleanEnv(process.env.EMAIL_PASS);
  const emailFrom = cleanEnv(process.env.EMAIL_FROM) || smtpUser;
  const resendApiKey = cleanEnv(process.env.RESEND_API_KEY);
  const brevoApiKey = cleanEnv(process.env.BREVO_API_KEY);
  const sendgridApiKey = cleanEnv(process.env.SENDGRID_API_KEY);
  const emailWebhookUrl = cleanEnv(process.env.EMAIL_WEBHOOK_URL);
  const emailWebhookSecret = cleanEnv(process.env.EMAIL_WEBHOOK_SECRET);

  return {
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    emailFrom,
    resendApiKey,
    brevoApiKey,
    sendgridApiKey,
    emailWebhookUrl,
    emailWebhookSecret,
  };
};

const getTransporter = () => {
  const { smtpHost, smtpPort, smtpUser, smtpPass } = getEmailConfig();
  if (!smtpUser || !smtpPass) return null;

  const key = `${smtpHost}:${smtpPort}:${smtpUser}:${smtpPass}`;
  if (cachedTransporter && cachedSmtpKey === key) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  cachedSmtpKey = key;
  return cachedTransporter;
};

/**
 * Generate email content using Gemini API if configured, otherwise return null to use templates.
 */
async function generateEmailContent(prompt) {
  try {
    const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
    if (!apiKey) {
      return null;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    logger.error(`Error generating email content: ${error.message}`);
    return null;
  }
}

/**
 * Deliver email over HTTPS APIs first (works on Render free tier where ports 25/465/587 are blocked),
 * then fall back to Nodemailer SMTP (works locally and on paid Render plans).
 */
async function deliverEmail({ to, subject, text, html, fromName = 'CyberGuard System' }) {
  const cfg = getEmailConfig();
  const errors = [];

  // 1. Resend HTTPS API (Port 443)
  if (cfg.resendApiKey) {
    try {
      const fromAddress = cfg.emailFrom
        ? `"${fromName}" <${cfg.emailFrom}>`
        : `"${fromName}" <onboarding@resend.dev>`;
      const res = await axios.post(
        'https://api.resend.com/emails',
        {
          from: fromAddress,
          to: [to],
          subject,
          text,
          ...(html ? { html } : {}),
        },
        {
          headers: {
            Authorization: `Bearer ${cfg.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      return { success: true, provider: 'resend', messageId: res.data?.id || '' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      errors.push(`resend: ${msg}`);
      logger.warn(`Resend delivery failed for ${to}: ${msg}`);
    }
  }

  // 2. Brevo HTTPS API (Port 443 — supports verified Gmail sender on free tier)
  if (cfg.brevoApiKey && cfg.emailFrom) {
    try {
      const res = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: fromName, email: cfg.emailFrom },
          to: [{ email: to }],
          subject,
          textContent: text,
          ...(html ? { htmlContent: html } : {}),
        },
        {
          headers: {
            'api-key': cfg.brevoApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      return { success: true, provider: 'brevo', messageId: res.data?.messageId || '' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      errors.push(`brevo: ${msg}`);
      logger.warn(`Brevo delivery failed for ${to}: ${msg}`);
    }
  }

  // 3. SendGrid HTTPS API (Port 443)
  if (cfg.sendgridApiKey && cfg.emailFrom) {
    try {
      const content = [{ type: 'text/plain', value: text }];
      if (html) content.push({ type: 'text/html', value: html });
      const res = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email: to }] }],
          from: { email: cfg.emailFrom, name: fromName },
          subject,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${cfg.sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      return { success: true, provider: 'sendgrid', messageId: res.headers?.['x-message-id'] || '' };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || err.message;
      errors.push(`sendgrid: ${msg}`);
      logger.warn(`SendGrid delivery failed for ${to}: ${msg}`);
    }
  }

  // 4. Generic HTTPS Email Webhook (e.g. Google Apps Script Gmail relay over Port 443)
  if (cfg.emailWebhookUrl) {
    try {
      const res = await axios.post(
        cfg.emailWebhookUrl,
        {
          to,
          subject,
          text,
          html,
          fromName,
          ...(cfg.emailWebhookSecret ? { secret: cfg.emailWebhookSecret } : {}),
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );
      if (res.data && res.data.status === 'error') {
        throw new Error(res.data.message || 'Webhook returned error');
      }
      return { success: true, provider: 'webhook', messageId: res.data?.messageId || '' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      errors.push(`webhook: ${msg}`);
      logger.warn(`Email webhook delivery failed for ${to}: ${msg}`);
    }
  }

  // 5. Nodemailer SMTP (Works locally and on paid Render plans; blocked on Render free tier)
  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${cfg.emailFrom || cfg.smtpUser}>`,
        to,
        subject,
        text,
        ...(html ? { html } : {}),
      });
      return { success: true, provider: 'smtp', messageId: info?.messageId || '' };
    } catch (err) {
      const isRenderSmtpBlock = /ETIMEDOUT|ECONNREFUSED|ESOCKET|timeout/i.test(err.message) && Boolean(process.env.RENDER || process.env.NODE_ENV === 'production');
      const hint = isRenderSmtpBlock
        ? ' (Render free tier blocks outbound SMTP ports 25/465/587; set BREVO_API_KEY, RESEND_API_KEY, SENDGRID_API_KEY, or EMAIL_WEBHOOK_URL for HTTPS port 443 delivery.)'
        : '';
      errors.push(`smtp: ${err.message}${hint}`);
    }
  }

  if (errors.length === 0) {
    return {
      success: false,
      provider: 'none',
      notConfigured: true,
      error: 'No email transport configured (set SMTP_USER/SMTP_PASS locally, or BREVO_API_KEY/RESEND_API_KEY/EMAIL_WEBHOOK_URL for Render).',
    };
  }

  return {
    success: false,
    provider: 'failed',
    error: errors.join(' | '),
  };
}

/**
 * Helper to deliver an email and persist an accurate MailLog entry.
 */
async function dispatchAndLog({
  to,
  recipientPhone = '',
  subject,
  body,
  textMessage = '',
  complaintId,
  fromName = 'Cybercrime Department',
  contextLabel = 'email',
}) {
  const delivery = await deliverEmail({ to, subject, text: body, fromName });

  const status = delivery.success
    ? 'delivered'
    : delivery.notConfigured
      ? 'logged'
      : 'failed';

  let mailLog = null;
  try {
    mailLog = await MailLog.create({
      recipient: to,
      recipientPhone,
      subject,
      body,
      textMessage,
      ...(complaintId ? { complaintId } : {}),
      status,
      provider: delivery.provider || 'none',
      errorMessage: delivery.error || '',
    });
  } catch (logErr) {
    logger.error(`Failed to save MailLog for ${to}: ${logErr.message}`);
  }

  if (delivery.success) {
    logger.info(`${contextLabel} sent via ${delivery.provider} to ${to}${complaintId ? ` (${complaintId})` : ''}`);
  } else if (delivery.notConfigured) {
    logger.warn(`${delivery.error} ${contextLabel} logged only for ${to}`);
  } else {
    logger.error(`Failed to send ${contextLabel} to ${to}: ${delivery.error}`);
  }

  return { delivery, mailLog };
}

/**
 * Send a confirmation email to a citizen when their complaint is registered.
 */
exports.sendComplaintConfirmationEmail = async (user, complaint) => {
  if (!user || !user.email) return null;

  try {
    const emailSubject = `CyberGuard Acknowledgment: Complaint ${complaint.complaintId} Registered`;
    const textMessage = `CyberGuard Alert: Your complaint (ID: ${complaint.complaintId}, Category: ${complaint.category}) has been registered and assigned for review.`;

    const prompt = `
      You are an official Cybercrime Department AI Assistant.
      Write a concise, reassuring confirmation email to a citizen named "${user.name}".
      Confirm that their cybercrime complaint (ID: ${complaint.complaintId}, Category: ${complaint.category}, Severity: ${complaint.severity}) has been officially registered on CyberGuard.
      Start with "Dear ${user.name}," and end with a formal sign-off from "Cybercrime Department".
      Provide raw email body text only.
    `;

    const generatedBody = await generateEmailContent(prompt);
    const emailBody = generatedBody || `Dear ${user.name},\n\nYour cybercrime complaint has been officially registered on the CyberGuard portal.\n\nComplaint ID: ${complaint.complaintId}\nCategory: ${complaint.category}\nSeverity: ${(complaint.severity || 'medium').toUpperCase()}\nCurrent Status: ${(complaint.status || 'pending').toUpperCase()}\n\nYou can track real-time investigation updates anytime using your Complaint ID on the Track page.\n\nSincerely,\nCybercrime Department`;

    return await dispatchAndLog({
      to: user.email,
      recipientPhone: user.phone || '',
      subject: emailSubject,
      body: emailBody,
      textMessage,
      complaintId: complaint.complaintId,
      fromName: 'Cybercrime Department',
      contextLabel: 'Complaint confirmation email',
    });
  } catch (error) {
    logger.error(`Failed to process confirmation email for ${user.email}: ${error.message}`);
    return null;
  }
};

/**
 * Send an email to a user when their complaint status is updated
 */
exports.sendStateChangeEmail = async (user, complaint, oldStatus, newStatus, message) => {
  if (!user || !user.email) return null;

  try {
    const emailSubject = `Update on your Cybercrime Complaint: ${complaint.complaintId} - Status: ${newStatus.toUpperCase()}`;
    const textMessage = `Cybercrime Dept: Your complaint (ID: ${complaint.complaintId}) status has been updated to "${newStatus.toUpperCase()}".${message ? ` Notes: ${message}` : ''}`;

    const prompt = `
      You are an official Cybercrime Department AI Assistant.
      Write a professional, empathetic email to a citizen named "${user.name}".
      Their complaint (ID: ${complaint.complaintId}, Category: ${complaint.category}) status has just changed from "${oldStatus}" to "${newStatus}".
      Please ensure you explicitly and prominently state the new status ("${newStatus}") early in the email.
      Additional official notes: "${message || 'No additional notes'}".
      
      Keep the email concise, reassuring, and professional. The email should start with "Dear ${user.name}," and end with a formal sign-off from "Cybercrime Department".
      Do not include placeholders like [Your Name]. Just provide the raw text of the email body.
    `;

    const generatedBody = await generateEmailContent(prompt);
    const emailBody = generatedBody || `Dear ${user.name},\n\nWe wanted to inform you that the status of your complaint (ID: ${complaint.complaintId}) has been updated from "${oldStatus}" to "${newStatus}".\n\nNotes from our team: ${message || 'No additional notes'}\n\nThank you for your cooperation.\n\nSincerely,\nCybercrime Department`;

    return await dispatchAndLog({
      to: user.email,
      recipientPhone: user.phone || '',
      subject: emailSubject,
      body: emailBody,
      textMessage,
      complaintId: complaint.complaintId,
      fromName: 'Cybercrime Department',
      contextLabel: 'Status update email',
    });
  } catch (error) {
    logger.error(`Failed to process status update email for ${user.email}: ${error.message}`);
    return null;
  }
};

/**
 * Send an email to a user when their complaint is viewed by an admin/officer
 */
exports.sendViewedEmail = async (user, complaint, viewerRole) => {
  if (!user || !user.email) return null;

  try {
    const emailSubject = `Your Cybercrime Complaint (${complaint.complaintId}) is being reviewed`;
    const textMessage = `Cybercrime Dept: Your complaint #${complaint.complaintId} (${complaint.category}) is now under active review by an assigned ${viewerRole}.`;

    const prompt = `
      You are an official Cybercrime Department AI Assistant.
      Write a short, professional, and reassuring email to a citizen named "${user.name}".
      Inform them that their cybercrime complaint (ID: ${complaint.complaintId}, Category: ${complaint.category}) has just been viewed by an assigned ${viewerRole} and is currently under active attention.
      
      Keep the email concise, reassuring, and professional. The email should start with "Dear ${user.name}," and end with a formal sign-off from "Cybercrime Department".
      Do not include placeholders like [Your Name]. Just provide the raw text of the email body.
    `;

    const generatedBody = await generateEmailContent(prompt);
    const emailBody = generatedBody || `Dear ${user.name},\n\nWe wanted to let you know that your complaint (ID: ${complaint.complaintId}) has been viewed by our ${viewerRole} and is currently under attention.\n\nWe will notify you if there are any further updates.\n\nSincerely,\nCybercrime Department`;

    return await dispatchAndLog({
      to: user.email,
      recipientPhone: user.phone || '',
      subject: emailSubject,
      body: emailBody,
      textMessage,
      complaintId: complaint.complaintId,
      fromName: 'Cybercrime Department',
      contextLabel: 'Viewed notification email',
    });
  } catch (error) {
    logger.error(`Failed to process viewed notification email for ${user.email}: ${error.message}`);
    return null;
  }
};

/**
 * Send an email to admins and officers when a new complaint is filed
 */
exports.sendNewComplaintAlert = async (adminsAndOfficers, complaint, user) => {
  if (!adminsAndOfficers || adminsAndOfficers.length === 0) return;

  try {
    const emailSubject = `[URGENT] New ${complaint.severity.toUpperCase()} Severity Cybercrime Complaint Filed`;
    const textMessage = `[URGENT] New ${complaint.severity.toUpperCase()} complaint #${complaint.complaintId} (${complaint.category}) filed by ${user.name}. Review immediately on CyberGuard.`;

    const prompt = `
      You are the Cybercrime System Dispatcher.
      A new cybercrime complaint has just been filed by "${user.name}" (${user.email}).
      Complaint ID: ${complaint.complaintId}
      Category: ${complaint.category}
      Severity: ${complaint.severity}
      
      Write a short, urgent briefing email to the department's Admins and Officers alerting them to review this new case immediately.
      Keep it professional and concise. Just provide the raw text of the email body.
    `;

    const generatedBody = await generateEmailContent(prompt);
    const emailBody = generatedBody || `Attention Admins and Officers,\n\nA new cybercrime complaint has been filed by ${user.name} (${user.email}).\n\nComplaint ID: ${complaint.complaintId}\nCategory: ${complaint.category}\nSeverity: ${complaint.severity}\n\nPlease log in to the CyberGuard dashboard to review and assign this case immediately.\n\nCyberGuard Automated Dispatch System`;

    const emailPromises = adminsAndOfficers
      .filter((admin) => Boolean(admin && admin.email))
      .map((admin) =>
        dispatchAndLog({
          to: admin.email,
          recipientPhone: admin.phone || '',
          subject: emailSubject,
          body: emailBody,
          textMessage,
          complaintId: complaint.complaintId,
          fromName: 'Cybercrime Dispatch',
          contextLabel: 'New complaint alert',
        })
      );

    await Promise.allSettled(emailPromises);
  } catch (error) {
    logger.error(`Failed to process new complaint alert: ${error.message}`);
  }
};

/**
 * Send an OTP to a user for login verification
 */
exports.sendLoginOtpEmail = async (user, otp) => {
  if (!user || !user.email) return null;

  try {
    const emailSubject = `Your CyberGuard Login OTP: ${otp}`;
    const textMessage = `CyberGuard Security: Your login OTP is ${otp}. Valid for 10 mins. Do not share this code with anyone.`;

    const prompt = `
      You are the Cybercrime System Authenticator.
      A user named "${user.name}" is trying to log in.
      Their One-Time Password (OTP) is: ${otp}
      
      Write a short, professional email providing this OTP. Warn them not to share it with anyone.
      Keep it concise and professional. Just provide the raw text of the email body.
    `;

    const generatedBody = await generateEmailContent(prompt);
    const emailBody = generatedBody || `Dear ${user.name},\n\nYour One-Time Password (OTP) for login is: ${otp}\n\nThis code will expire in 10 minutes. Please do not share this code with anyone.\n\nCyberGuard Automated System`;

    return await dispatchAndLog({
      to: user.email,
      recipientPhone: user.phone || '',
      subject: emailSubject,
      body: emailBody,
      textMessage,
      fromName: 'CyberGuard Auth',
      contextLabel: 'Login OTP email',
    });
  } catch (error) {
    logger.error(`Failed to send login OTP email to ${user.email}: ${error.message}`);
    return null;
  }
};

/**
 * Send a welcome email to a newly registered user
 */
exports.sendWelcomeEmail = async (user) => {
  if (!user || !user.email) return null;

  try {
    const emailSubject = `Welcome to CyberGuard, ${user.name}!`;

    const prompt = `
      You are the CyberGuard System Greeter.
      A new user named "${user.name}" has just registered.
      Write a short, welcoming email thanking them for registering with CyberGuard.
      Keep it professional, assuring them that their cybercrime complaints will be handled securely.
      Just provide the raw text of the email body.
    `;

    const generatedBody = await generateEmailContent(prompt);
    const emailBody = generatedBody || `Dear ${user.name},\n\nWelcome to CyberGuard! We are glad to have you on board. Our platform ensures that your cybercrime complaints are handled securely and efficiently.\n\nCyberGuard Automated System`;

    return await dispatchAndLog({
      to: user.email,
      recipientPhone: user.phone || '',
      subject: emailSubject,
      body: emailBody,
      fromName: 'CyberGuard Welcome',
      contextLabel: 'Welcome email',
    });
  } catch (error) {
    logger.error(`Failed to send welcome email to ${user.email}: ${error.message}`);
    return null;
  }
};

/**
 * Inspect email transport readiness without exposing secret values.
 */
exports.getEmailStatus = async ({ verify = false } = {}) => {
  const cfg = getEmailConfig();
  const httpProviders = [
    cfg.resendApiKey ? 'resend' : null,
    cfg.brevoApiKey && cfg.emailFrom ? 'brevo' : null,
    cfg.sendgridApiKey && cfg.emailFrom ? 'sendgrid' : null,
    cfg.emailWebhookUrl ? 'webhook' : null,
  ].filter(Boolean);

  const smtpConfigured = Boolean(cfg.smtpUser && cfg.smtpPass);
  const configured = httpProviders.length > 0 || smtpConfigured;
  const activeProvider = httpProviders[0] || (smtpConfigured ? 'smtp' : 'none');

  const status = {
    configured,
    activeProvider,
    httpProviders,
    smtpConfigured,
    smtpHost: cfg.smtpHost,
    smtpPort: cfg.smtpPort,
    isRender: Boolean(process.env.RENDER),
  };

  if (verify && smtpConfigured) {
    const transporter = getTransporter();
    try {
      await transporter.verify();
      status.smtpVerified = true;
    } catch (err) {
      status.smtpVerified = false;
      status.smtpError = err.message;
    }
  }

  return status;
};

exports.sendRawEmail = deliverEmail;
