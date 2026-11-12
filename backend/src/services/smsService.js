const twilio = require('twilio');
const logger = require('../utils/logger');

const PLACEHOLDER_TOKENS = ['<copy_from_my_env>', 'your-twilio-account-sid', 'your-twilio-auth-token', 'your-twilio-phone-number', 'your-messaging-service-sid'];

const cleanEnv = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed || PLACEHOLDER_TOKENS.includes(trimmed)) return '';
  return trimmed;
};

let cachedClient = null;
let cachedCredKey = '';

const getTwilioConfig = () => {
  const sid = cleanEnv(process.env.TWILIO_ACCOUNT_SID);
  const token = cleanEnv(process.env.TWILIO_AUTH_TOKEN);
  const phoneNumber = cleanEnv(process.env.TWILIO_PHONE_NUMBER);
  const messagingServiceSid = cleanEnv(process.env.TWILIO_MESSAGING_SERVICE_SID);
  return { sid, token, phoneNumber, messagingServiceSid };
};

const getTwilioClient = () => {
  const { sid, token } = getTwilioConfig();
  if (!sid.startsWith('AC') || !token) {
    return null;
  }

  const credKey = `${sid}:${token}`;
  if (cachedClient && cachedCredKey === credKey) {
    return cachedClient;
  }

  try {
    cachedClient = twilio(sid, token);
    cachedCredKey = credKey;
    logger.info('Twilio SMS client initialized.');
    return cachedClient;
  } catch (err) {
    logger.warn(`Twilio initialization failed (SMS disabled): ${err.message}`);
    return null;
  }
};

// Initialize eagerly at startup so logs report readiness
if (!getTwilioClient()) {
  logger.info('Twilio credentials not configured — SMS features disabled.');
}

/**
 * Normalize phone numbers into E.164 format (+91XXXXXXXXXX default for 10-digit Indian numbers).
 */
const formatPhoneE164 = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  let cleaned = phone.trim().replace(/[\s\-().]/g, '');
  if (!cleaned) return null;

  if (cleaned.startsWith('00')) {
    cleaned = `+${cleaned.slice(2)}`;
  }

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }

  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
};

/**
 * Core Twilio SMS sender returning a structured delivery result.
 */
const sendSMS = async ({ to, body, contextLabel = 'SMS' }) => {
  const toPhoneNumber = formatPhoneE164(to);
  if (!toPhoneNumber) {
    const error = `Invalid or missing recipient phone number (${to || 'empty'})`;
    logger.info(`Cannot send ${contextLabel}: ${error}`);
    return { success: false, to: to || '', error };
  }

  const client = getTwilioClient();
  const { phoneNumber, messagingServiceSid } = getTwilioConfig();
  const hasMessagingService = messagingServiceSid.startsWith('MG');
  const hasFromPhone = phoneNumber.startsWith('+');

  if (!client || (!hasMessagingService && !hasFromPhone)) {
    const error = 'Twilio credentials or sender (TWILIO_MESSAGING_SERVICE_SID / TWILIO_PHONE_NUMBER) not configured.';
    logger.warn(`${error} ${contextLabel} not sent.`);
    return { success: false, to: toPhoneNumber, error };
  }

  try {
    const messagePayload = {
      body,
      to: toPhoneNumber,
    };

    if (hasMessagingService) {
      messagePayload.messagingServiceSid = messagingServiceSid;
    } else {
      messagePayload.from = phoneNumber;
    }

    const result = await client.messages.create(messagePayload);
    logger.info(`${contextLabel} sent to ${toPhoneNumber} (SID: ${result.sid}, status: ${result.status})`);
    return {
      success: true,
      sid: result.sid,
      status: result.status,
      to: toPhoneNumber,
    };
  } catch (error) {
    const trialHint = error.code === 21608
      ? ' (Twilio Trial accounts can only send SMS to verified numbers in the Twilio Console.)'
      : '';
    logger.error(`Failed to send ${contextLabel} to ${toPhoneNumber}: ${error.message}${trialHint}`);
    return {
      success: false,
      to: toPhoneNumber,
      error: `${error.message}${trialHint}`,
      errorCode: error.code,
    };
  }
};

/**
 * Send an SMS to a user when their complaint is submitted.
 */
const sendComplaintConfirmationSMS = async (user, complaint) => {
  if (!user || !user.phone) {
    logger.info(`Cannot send confirmation SMS: No phone number registered for user ${user?._id || 'unknown'}`);
    return { success: false, error: 'No phone number registered for user' };
  }

  const body = `CyberGuard Alert: Your complaint (ID: ${complaint.complaintId}, Category: ${complaint.category}) has been registered and assigned for review. Track status anytime on the CyberGuard portal.`;
  return sendSMS({
    to: user.phone,
    body,
    contextLabel: `Confirmation SMS for ${complaint.complaintId}`,
  });
};

/**
 * Send an SMS to a user when their complaint status is updated.
 */
const sendStatusUpdateSMS = async (user, complaint, newStatus, message) => {
  if (!user || !user.phone) {
    logger.info(`Cannot send SMS: No phone number registered for user ${user?._id || 'unknown'}`);
    return { success: false, error: 'No phone number registered for user' };
  }

  let body = `Cybercrime Dept: Your complaint (ID: ${complaint.complaintId}) status has been updated to "${String(newStatus || 'updated').toUpperCase()}".`;
  if (message) {
    body += ` Notes: ${message}`;
  }

  return sendSMS({
    to: user.phone,
    body,
    contextLabel: `Status update SMS for ${complaint.complaintId}`,
  });
};

/**
 * Inspect Twilio SMS readiness without exposing secret tokens.
 */
const getSmsStatus = async ({ verify = false } = {}) => {
  const { sid, token, phoneNumber, messagingServiceSid } = getTwilioConfig();
  const hasSid = sid.startsWith('AC');
  const hasToken = Boolean(token);
  const hasMessagingServiceSid = messagingServiceSid.startsWith('MG');
  const hasPhoneNumber = phoneNumber.startsWith('+');
  const configured = hasSid && hasToken && (hasMessagingServiceSid || hasPhoneNumber);

  const status = {
    configured,
    hasSid,
    hasToken,
    hasMessagingServiceSid,
    hasPhoneNumber,
  };

  if (verify && configured) {
    const client = getTwilioClient();
    try {
      const account = await client.api.accounts(sid).fetch();
      status.verified = true;
      status.accountStatus = account.status;
      status.accountType = account.type;
    } catch (err) {
      status.verified = false;
      status.error = err.message;
      status.errorCode = err.code;
    }
  }

  return status;
};

module.exports = {
  formatPhoneE164,
  sendSMS,
  sendComplaintConfirmationSMS,
  sendStatusUpdateSMS,
  getSmsStatus,
};
