const { auditCredentialExposure } = require('./breachService');

describe('Credential Breach Surveillance Service', () => {
  test('rejects invalid email formats', async () => {
    await expect(auditCredentialExposure('invalid-email')).rejects.toThrow(/Invalid email/);
    await expect(auditCredentialExposure('')).rejects.toThrow(/Invalid email/);
  });

  test('audits valid public email and returns real risk telemetry', async () => {
    const result = await auditCredentialExposure('testuser@gmail.com');
    expect(result).toBeDefined();
    expect(result.searchedEmail).toBe('testuser@gmail.com');
    expect(result.domain).toBe('gmail.com');
    expect(result.sha1Prefix).toBeDefined();
    expect(result.sha1Prefix.length).toBe(8); // 5 hex chars + '...'
    expect(['LOW RISK', 'MODERATE RISK', 'ELEVATED EXPOSURE', 'CRITICAL EXPOSURE', 'SUSPICIOUS DOMAIN']).toContain(result.riskLevel);
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    // Issue #28 verification: Ensure simulation status is explicitly declared
    expect(result.isSimulated).toBe(true);
    expect(result.mode).toBe('historical_catalog_simulation');
    expect(result.liveApiVerified).toBe(false);
    expect(typeof result.disclaimer).toBe('string');
  });

  test('flags suspicious or non-existent domains lacking MX records', async () => {
    const result = await auditCredentialExposure('target@nonexistent-fake-domain-123456789.org');
    expect(result.mxVerified).toBe(false);
    expect(result.riskLevel).toBe('SUSPICIOUS DOMAIN');
    expect(result.riskScore).toBeGreaterThanOrEqual(70);
  });
});

