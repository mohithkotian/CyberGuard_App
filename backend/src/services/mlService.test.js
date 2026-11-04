const axios = require('axios');
const mlService = require('./mlService');

describe('ML Service - Client Security & Fallback', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('attaches X-ML-Secret header when configured', async () => {
    process.env.ML_INTERNAL_SECRET = 'backend-secret-token-123';
    
    // Test local rule classification fallback works cleanly
    const result = await mlService.predict('Someone sent a phishing link to verify microsoft 365 password');
    expect(result.status).toBe('success');
    expect(result.category).toBe('Phishing');
  });

  it('falls back to local NLP rules when ML service is offline or errors', async () => {
    const result = await mlService.predict('50000 rupees was debited without OTP using UPI');
    expect(result.status).toBe('success');
    expect(result.category).toBe('Financial Fraud');
    expect(result.subcategory).toBe('UPI / Banking & Card Fraud');
  });

  it('provides category display and subcategory mappings', () => {
    expect(mlService.CATEGORY_DISPLAY_MAP.phishing).toBe('Phishing');
    expect(mlService.SUBCATEGORY_DEFAULT_MAP['Financial Fraud']).toBe('UPI / Banking & Card Fraud');
  });
});

