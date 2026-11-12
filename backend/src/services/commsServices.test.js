const mockTwilioCreate = jest.fn();
const mockTwilioFetch = jest.fn();
const mockSendMail = jest.fn();
const mockVerify = jest.fn();
const mockMailLogCreate = jest.fn();
const mockAxiosPost = jest.fn();

jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: { create: mockTwilioCreate },
    api: { accounts: jest.fn(() => ({ fetch: mockTwilioFetch })) },
  }));
});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
    verify: mockVerify,
  })),
}));

jest.mock('axios', () => ({
  post: mockAxiosPost,
}));

jest.mock('../models/MailLog', () => ({
  create: mockMailLogCreate,
}));

const smsService = require('./smsService');
const emailAgentService = require('./emailAgentService');

describe('SMS Service (Twilio)', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    process.env.TWILIO_ACCOUNT_SID = 'AC_TEST_ACCOUNT_SID_MOCK';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.TWILIO_MESSAGING_SERVICE_SID = 'MG_TEST_SERVICE_SID_MOCK';
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('normalizes Indian and international phone numbers to E.164', () => {
    expect(smsService.formatPhoneE164('9110255190')).toBe('+919110255190');
    expect(smsService.formatPhoneE164('09110255190')).toBe('+919110255190');
    expect(smsService.formatPhoneE164('919110255190')).toBe('+919110255190');
    expect(smsService.formatPhoneE164('91102-55190')).toBe('+919110255190');
    expect(smsService.formatPhoneE164('00919110255190')).toBe('+919110255190');
    expect(smsService.formatPhoneE164('+1 (415) 555-2671')).toBe('+14155552671');
    expect(smsService.formatPhoneE164('')).toBeNull();
  });

  it('handles null user safely without throwing', async () => {
    const res = await smsService.sendStatusUpdateSMS(null, { complaintId: 'CMP-1' }, 'investigating', 'note');
    expect(res.success).toBe(false);
    expect(mockTwilioCreate).not.toHaveBeenCalled();
  });

  it('sends complaint confirmation and status update SMS via Twilio Messaging Service', async () => {
    mockTwilioCreate.mockResolvedValue({ sid: 'SM111', status: 'queued' });

    const confirmRes = await smsService.sendComplaintConfirmationSMS(
      { _id: 'u1', phone: '09110255190' },
      { complaintId: 'CMP-100', category: 'UPI Fraud' }
    );
    expect(confirmRes).toEqual({
      success: true,
      sid: 'SM111',
      status: 'queued',
      to: '+919110255190',
    });
    expect(mockTwilioCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+919110255190',
        messagingServiceSid: 'MG_TEST_SERVICE_SID_MOCK',
      })
    );

    const statusRes = await smsService.sendStatusUpdateSMS(
      { _id: 'u1', phone: '9110255190' },
      { complaintId: 'CMP-100' },
      'resolved',
      'Case closed'
    );
    expect(statusRes.success).toBe(true);
    expect(mockTwilioCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: '+919110255190',
        body: expect.stringContaining('RESOLVED'),
      })
    );
  });

  it('returns helpful error details for Twilio Trial unverified number error 21608', async () => {
    const err = new Error('The number +919999999999 is unverified');
    err.code = 21608;
    mockTwilioCreate.mockRejectedValue(err);

    const res = await smsService.sendSMS({ to: '9999999999', body: 'Test' });
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe(21608);
    expect(res.error).toContain('Twilio Trial');
  });
});

describe('Email Agent Service (HTTPS + SMTP)', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.RESEND_API_KEY;
    delete process.env.BREVO_API_KEY;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.EMAIL_WEBHOOK_URL;
    delete process.env.GEMINI_API_KEY;
    process.env.SMTP_USER = 'cyberguard.system1@gmail.com';
    process.env.SMTP_PASS = 'app-password';
    process.env.EMAIL_FROM = 'cyberguard.system1@gmail.com';
    mockMailLogCreate.mockImplementation(async (doc) => ({ _id: 'log-1', ...doc, save: jest.fn() }));
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('delivers email via SMTP when no HTTPS provider is configured', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'smtp-msg-1' });

    const result = await emailAgentService.sendComplaintConfirmationEmail(
      { name: 'Pruthvi', email: 'citizen@example.com', phone: '9110255190' },
      { complaintId: 'CMP-202', category: 'Phishing', severity: 'high', status: 'pending' }
    );

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'citizen@example.com',
        subject: expect.stringContaining('CMP-202'),
      })
    );
    expect(result.delivery.success).toBe(true);
    expect(result.delivery.provider).toBe('smtp');
    expect(mockMailLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'delivered',
        provider: 'smtp',
        complaintId: 'CMP-202',
      })
    );
  });

  it('prefers HTTPS Brevo API over SMTP for Render compatibility', async () => {
    process.env.BREVO_API_KEY = 'xkeysib-test';
    mockAxiosPost.mockResolvedValue({ data: { messageId: 'brevo-123' } });

    const res = await emailAgentService.sendRawEmail({
      to: 'citizen@example.com',
      subject: 'Test',
      text: 'Hello',
    });

    expect(res).toEqual({ success: true, provider: 'brevo', messageId: 'brevo-123' });
    expect(mockAxiosPost).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({ subject: 'Test' }),
      expect.objectContaining({ headers: expect.objectContaining({ 'api-key': 'xkeysib-test' }) })
    );
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('falls back to SMTP if HTTPS webhook fails and records failed status if all fail', async () => {
    process.env.EMAIL_WEBHOOK_URL = 'https://script.google.com/macros/s/test/exec';
    mockAxiosPost.mockRejectedValue(new Error('Webhook timeout'));
    mockSendMail.mockRejectedValue(new Error('ETIMEDOUT'));

    const res = await emailAgentService.sendStateChangeEmail(
      { name: 'Test User', email: 'user@example.com' },
      { complaintId: 'CMP-303', category: 'Scam' },
      'pending',
      'investigating',
      'Officer assigned'
    );

    expect(res.delivery.success).toBe(false);
    expect(mockMailLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        errorMessage: expect.stringContaining('Webhook timeout'),
      })
    );
  });
});
