'use strict';

const { maskPII, logPrivacySummary } = require('./privacyShield');

/**
 * Enforce the privacy boundary before text is sent to an AI/ML service.
 * Original values are never returned from this helper.
 */
function maskTextForModel(text) {
  if (!text || typeof text !== 'string') return text;

  const result = maskPII(text);
  logPrivacySummary(result.detected);
  return result.masked;
}

module.exports = { maskTextForModel };
