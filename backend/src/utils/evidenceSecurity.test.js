const fs = require('fs');
const path = require('path');
const os = require('os');
const { detectMagicType, computeFileSha256, processUploadedEvidence, evaluateIntegrityStatus } = require('./evidenceSecurity');

describe('Evidence Security & Magic Byte Verification', () => {
  test('detects valid JPEG magic bytes', () => {
    const jpegBuf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
    const res = detectMagicType(jpegBuf);
    expect(res).not.toBeNull();
    expect(res.mime).toBe('image/jpeg');
    expect(res.ext).toBe('.jpg');
  });

  test('detects valid PNG magic bytes', () => {
    const pngBuf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const res = detectMagicType(pngBuf);
    expect(res).not.toBeNull();
    expect(res.mime).toBe('image/png');
    expect(res.ext).toBe('.png');
  });

  test('detects valid PDF magic bytes', () => {
    const pdfBuf = Buffer.from('%PDF-1.7\n%some content');
    const res = detectMagicType(pdfBuf);
    expect(res).not.toBeNull();
    expect(res.mime).toBe('application/pdf');
    expect(res.ext).toBe('.pdf');
  });

  test('detects valid GIF magic bytes', () => {
    const gifBuf = Buffer.from('GIF89a\x01\x00\x01\x00');
    const res = detectMagicType(gifBuf);
    expect(res).not.toBeNull();
    expect(res.mime).toBe('image/gif');
  });

  test('detects valid WEBP magic bytes', () => {
    const webpBuf = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8 ');
    const res = detectMagicType(webpBuf);
    expect(res).not.toBeNull();
    expect(res.mime).toBe('image/webp');
  });

  test('detects valid MP4 magic bytes', () => {
    const mp4Buf = Buffer.from('\x00\x00\x00\x20ftypisom\x00\x00\x02\x00');
    const res = detectMagicType(mp4Buf);
    expect(res).not.toBeNull();
    expect(res.mime).toBe('video/mp4');
  });

  test('detects valid plain text', () => {
    const textBuf = Buffer.from('Official complaint narrative without binary nulls.');
    const res = detectMagicType(textBuf);
    expect(res).not.toBeNull();
    expect(res.mime).toBe('text/plain');
  });

  test('REJECTS Windows executable (PE/MZ) disguised with PNG name', () => {
    // MZ header: 4D 5A
    const exeBuf = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const res = detectMagicType(exeBuf);
    expect(res).toBeNull();
  });

  test('REJECTS shell script containing null bytes or binary payload', () => {
    const binaryScript = Buffer.from('#!/bin/bash\x00malicious_payload\x01\x02');
    const res = detectMagicType(binaryScript);
    expect(res).toBeNull();
  });

  test('computes correct SHA-256 for a temporary file', async () => {
    const tmpFile = path.join(os.tmpdir(), `test-sha-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, 'CyberGuard Evidence Chain of Custody Sample');
    try {
      const hash = await computeFileSha256(tmpFile);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 is 64 hex chars
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  test('processUploadedEvidence verifies valid file and returns sha256', async () => {
    const tmpFile = path.join(os.tmpdir(), `test-evidence-${Date.now()}.pdf`);
    fs.writeFileSync(tmpFile, '%PDF-1.4\nTest Evidence Document Payload');
    try {
      const fileObj = {
        path: tmpFile,
        originalname: 'statement.pdf',
        mimetype: 'application/pdf',
        size: 35
      };
      const result = await processUploadedEvidence(fileObj);
      expect(result.sha256).toBeDefined();
      expect(result.sha256.length).toBe(64);
      expect(result.verifiedMime).toBe('application/pdf');
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  test('processUploadedEvidence REJECTS disguised executable and removes it from disk', async () => {
    const tmpFile = path.join(os.tmpdir(), `test-disguised-${Date.now()}.png`);
    // Write PE MZ executable bytes
    fs.writeFileSync(tmpFile, Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00]));
    const fileObj = {
      path: tmpFile,
      originalname: 'innocent_screenshot.png',
      mimetype: 'image/png',
      size: 6
    };

    await expect(processUploadedEvidence(fileObj)).rejects.toThrow(/Evidence validation failed/);
    // Verify file was unlinked/cleaned up
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  describe('evaluateIntegrityStatus (Issue #27)', () => {
    test('returns "verified" when stored hash matches disk hash', () => {
      const hash = 'a'.repeat(64);
      expect(evaluateIntegrityStatus(hash, hash)).toBe('verified');
    });

    test('returns "unverified_legacy" when stored hash is null, undefined, or empty', () => {
      const currentHash = 'b'.repeat(64);
      expect(evaluateIntegrityStatus(null, currentHash)).toBe('unverified_legacy');
      expect(evaluateIntegrityStatus(undefined, currentHash)).toBe('unverified_legacy');
      expect(evaluateIntegrityStatus('', currentHash)).toBe('unverified_legacy');
    });

    test('returns "integrity_mismatch" when stored hash differs from disk hash', () => {
      const storedHash = 'a'.repeat(64);
      const tamperedHash = 'b'.repeat(64);
      expect(evaluateIntegrityStatus(storedHash, tamperedHash)).toBe('integrity_mismatch');
    });
  });
});

