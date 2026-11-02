const threatIntelligence = require('./threatIntelligence');
const { lookupThreat, isAuthorityDomain, extractDomain, AUTHORITY_DOMAINS, PHISHING_SET } = threatIntelligence;

describe('Threat Intelligence Utility - False Positive & Phishing Detection', () => {

  describe('1. Authority / Whitelist Domains (Must NEVER be classified as Phishing)', () => {
    const authorityTestCases = [
      { input: 'google.com', label: 'google.com' },
      { input: 'www.google.com', label: 'www.google.com' },
      { input: 'https://google.com', label: 'https://google.com' },
      { input: 'https://www.google.com/search?q=test', label: 'https://www.google.com/search?q=test' },
      { input: 'GOOGLE.COM', label: 'uppercase GOOGLE.COM' },
      { input: 'mail.google.com', label: 'authentic subdomain mail.google.com' },
      { input: 'accounts.google.com', label: 'authentic subdomain accounts.google.com' },
      { input: 'apple.com', label: 'apple.com' },
      { input: 'https://apple.com/in', label: 'https://apple.com/in' },
      { input: 'id.apple.com', label: 'authentic subdomain id.apple.com' },
      { input: 'github.com', label: 'github.com' },
      { input: 'https://github.com/trending', label: 'https://github.com/trending' },
      { input: 'microsoft.com', label: 'microsoft.com' },
      { input: 'https://login.microsoft.com', label: 'authentic subdomain login.microsoft.com' },
      { input: 'reddit.com', label: 'reddit.com' },
      { input: 'icicibank.com', label: 'icicibank.com' },
      { input: 'https://infinity.icicibank.com', label: 'authentic subdomain infinity.icicibank.com' },
      { input: 'paytm.com', label: 'paytm.com' },
      { input: 'https://paytm.com/recharge', label: 'https://paytm.com/recharge' },
    ];

    authorityTestCases.forEach(({ input, label }) => {
      test(`isAuthorityDomain correctly identifies ${label}`, () => {
        expect(isAuthorityDomain(input)).toBe(true);
      });

      test(`lookupThreat('${label}') does NOT return any phishing classification`, () => {
        const matches = lookupThreat(input);
        const phishingMatches = matches.filter(m => m.category === 'Phishing & Fake Domain');
        expect(phishingMatches).toHaveLength(0);
      });
    });
  });

  describe('2. Malicious / Non-Authority Phishing Domains (Must be detected and classified as BLOCKED)', () => {
    const maliciousTestCases = [
      {
        input: 'fake-google-login.example',
        expectedIdentifier: 'fake-google-login.example',
        label: 'fake-google-login.example'
      },
      {
        input: 'evilgoogle.com',
        expectedIdentifier: 'evilgoogle.com',
        label: 'evilgoogle.com'
      },
      {
        input: 'google.com.evil.example',
        expectedIdentifier: 'google.com.evil.example',
        label: 'google.com.evil.example'
      },
      {
        input: 'kickass.to',
        expectedIdentifier: 'kickass.to',
        label: 'kickass.to (legacy dataset domain)'
      },
      {
        input: 'extratorrent.cc',
        expectedIdentifier: 'extratorrent.cc',
        label: 'extratorrent.cc (legacy dataset domain)'
      },
      {
        input: 'icici-kyc-verification.net',
        expectedIdentifier: 'icici-kyc-verification.net',
        label: 'icici-kyc-verification.net'
      },
      {
        input: 'paytm-kyc-update.com',
        expectedIdentifier: 'paytm-kyc-update.com',
        label: 'paytm-kyc-update.com'
      },
    ];

    maliciousTestCases.forEach(({ input, expectedIdentifier, label }) => {
      test(`isAuthorityDomain correctly REJECTS spoof/phishing domain ${label}`, () => {
        expect(isAuthorityDomain(input)).toBe(false);
      });

      test(`lookupThreat('${label}') returns BLOCKED status with Phishing & Fake Domain category`, () => {
        const matches = lookupThreat(input);
        const phishingMatch = matches.find(m => m.category === 'Phishing & Fake Domain');
        expect(phishingMatch).toBeDefined();
        expect(phishingMatch.status).toBe('BLOCKED');
        expect(phishingMatch.severity).toBe('high');
        expect(phishingMatch.riskLevel).toBe('critical');
        expect(phishingMatch.type).toBe('WEBSITE');
        expect(phishingMatch.identifier).toBe(expectedIdentifier);
        expect(phishingMatch.details).toContain('Blacklisted phishing destination');
      });
    });
  });

  describe('3. Subdomain Boundary & Anti-Spoofing Safety', () => {
    test('Hostnames that suffix-match without dot boundary are NOT treated as authority', () => {
      // Must not match google.com
      expect(isAuthorityDomain('evilgoogle.com')).toBe(false);
      expect(isAuthorityDomain('notgoogle.com')).toBe(false);
      expect(isAuthorityDomain('mygoogle.com')).toBe(false);

      // Must not match icicibank.com
      expect(isAuthorityDomain('fakeicicibank.com')).toBe(false);

      // Must not match apple.com
      expect(isAuthorityDomain('badapple.com')).toBe(false);

      // Must not match paytm.com
      expect(isAuthorityDomain('scampaytm.com')).toBe(false);
    });

    test('Hostnames having authority domain as leading subdomain of external attacker domain are NOT authority', () => {
      expect(isAuthorityDomain('google.com.evil.example')).toBe(false);
      expect(isAuthorityDomain('apple.com.attacker.net')).toBe(false);
      expect(isAuthorityDomain('icicibank.com.phishingsite.org')).toBe(false);
      expect(isAuthorityDomain('paytm.com.fraudgateway.xyz')).toBe(false);
    });
  });

  describe('4. ExtractDomain Utility & Protocol/Path Normalization', () => {
    test('extractDomain handles schemes, ports, queries, fragments, and trailing slashes', () => {
      expect(extractDomain('https://google.com')).toBe('google.com');
      expect(extractDomain('http://google.com:8080/path')).toBe('google.com');
      expect(extractDomain('www.google.com')).toBe('www.google.com');
      expect(extractDomain('https://www.google.com/')).toBe('www.google.com');
      expect(extractDomain('GOOGLE.COM/SEARCH?q=1')).toBe('google.com');
      expect(extractDomain('')).toBe('');
      expect(extractDomain(null)).toBe('');
      expect(extractDomain(undefined)).toBe('');
    });
  });

  describe('5. Preservation of Phone & Other Threats', () => {
    test('Existing scam phone lookups still work correctly', () => {
      const matches = lookupThreat('+91 98000 00001');
      expect(matches.length).toBeGreaterThan(0);
      const phoneMatch = matches.find(m => m.type === 'PHONE');
      expect(phoneMatch).toBeDefined();
      expect(phoneMatch.status).toBe('FLAGGED');
    });

    test('Existing other threats lookups still work correctly', () => {
      const matches = lookupThreat('fast.loan.approval@paytm');
      expect(matches.length).toBeGreaterThan(0);
      const otherMatch = matches.find(m => m.type === 'OTHER');
      expect(otherMatch).toBeDefined();
      expect(otherMatch.status).toBe('FLAGGED');
    });
  });

});

