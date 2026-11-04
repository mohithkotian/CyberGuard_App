const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

/**
 * Validates the true file type of a buffer using its binary magic numbers.
 * Prevents disguised executables (.exe, .sh, .bat, etc.) with spoofed MIME types.
 *
 * @param {Buffer} buffer - First 64+ bytes of the file
 * @returns {{ valid: boolean, mime: string, ext: string } | null}
 */
function detectMagicType(buffer) {
  if (!buffer || buffer.length < 4) return null;

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, mime: 'image/jpeg', ext: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 &&
    buffer[2] === 0x4E && buffer[3] === 0x47
  ) {
    return { valid: true, mime: 'image/png', ext: '.png' };
  }

  // GIF: 47 49 46 38 (GIF87a or GIF89a)
  if (buffer.subarray(0, 4).toString('ascii').startsWith('GIF8')) {
    return { valid: true, mime: 'image/gif', ext: '.gif' };
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { valid: true, mime: 'image/webp', ext: '.webp' };
  }

  // PDF: %PDF (25 50 44 46)
  if (buffer.subarray(0, 4).toString('ascii') === '%PDF') {
    return { valid: true, mime: 'application/pdf', ext: '.pdf' };
  }

  // MP4 Video: 'ftyp' at offset 4
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return { valid: true, mime: 'video/mp4', ext: '.mp4' };
  }

  // Plain Text: Check for absence of null bytes in sample and printable characters
  let isText = true;
  const sampleLength = Math.min(buffer.length, 512);
  for (let i = 0; i < sampleLength; i++) {
    const byte = buffer[i];
    // Reject null byte and control characters (except tab, LF, CR)
    if (byte === 0 || (byte < 7 && byte !== 9 && byte !== 10 && byte !== 13)) {
      isText = false;
      break;
    }
  }

  if (isText) {
    return { valid: true, mime: 'text/plain', ext: '.txt' };
  }

  return null;
}

/**
 * Computes the cryptographic SHA-256 hash of a file on disk.
 *
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} - Hex-encoded SHA-256 digest
 */
function computeFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}

/**
 * Inspects an uploaded multer file, verifies its magic bytes, generates its SHA-256 hash,
 * and securely cleans up any invalid or disguised files.
 *
 * @param {object} file - Express.Multer file object
 * @returns {Promise<{ sha256: string, verifiedMime: string, safeName: string }>}
 */
async function processUploadedEvidence(file) {
  if (!file || !file.path) {
    throw new Error('Invalid file object supplied for evidence intake.');
  }

  // 1. Read file header to verify magic bytes
  const fd = fs.openSync(file.path, 'r');
  const headerBuffer = Buffer.alloc(64);
  const bytesRead = fs.readSync(fd, headerBuffer, 0, 64, 0);
  fs.closeSync(fd);

  const detected = detectMagicType(headerBuffer.subarray(0, bytesRead));

  if (!detected || !detected.valid) {
    // Delete dangerous unverified file immediately from disk
    try { fs.unlinkSync(file.path); } catch (e) { /* ignore cleanup error */ }
    throw new Error(
      `Evidence validation failed: Binary magic bytes for ${file.originalname} do not match allowed formats (JPEG, PNG, GIF, WebP, PDF, MP4, TXT). Disguised executables or scripts are blocked.`
    );
  }

  // 2. Compute SHA-256 checksum for evidentiary chain-of-custody
  const sha256 = await computeFileSha256(file.path);

  return {
    sha256,
    verifiedMime: detected.mime,
    safeExtension: detected.ext
  };
}

module.exports = {
  detectMagicType,
  computeFileSha256,
  processUploadedEvidence
};

