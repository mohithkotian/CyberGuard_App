import React from 'react';

const ADMIN_ICON_NAMES = new Set([
  'critical-action', 'extracted-phones', 'investigator-protocol', 'link-search', 'live-cases',
  'neural-accuracy', 'ocr-identifiers', 'operational-nodes', 'other-threats',
  'payment-identifiers', 'personnel-directory', 'phishing-links', 'scam-phone-tab'
]);

const SYMBOLS = {
  search: '⌕', warning: '!', success: 'v', close: '×', back: '‹', next: '›', copy: '⧉',
  edit: 'edit', delete: '⌫', password: '◇', refresh: '↻', upload: '⇧', download: '⇩',
  shield: '◈', network: '⌁', document: '▤', attachment: '⌕', mail: '@', phone: '⌕',
  settings: '≡', info: 'i', check: 'v', play: '▶', location: '⌖', link: '↗',
};

export default function UiIcon({ name, size = 20, label, decorative = !label, style, ...rest }) {
  if (ADMIN_ICON_NAMES.has(name)) {
    return (
      <img
        src={`/icons/cyberguard/admin/admin-${name}.svg`}
        alt={decorative ? '' : label}
        aria-hidden={decorative ? 'true' : undefined}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', verticalAlign: 'middle', ...style }}
        {...rest}
      />
    );
  }

  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? 'true' : undefined}
      style={{ display: 'inline-flex', width: size, height: size, alignItems: 'center', justifyContent: 'center', lineHeight: 1, fontSize: size * 0.9, fontWeight: 800, ...style }}
      {...rest}
    >
      {SYMBOLS[name] || '•'}
    </span>
  );
}
