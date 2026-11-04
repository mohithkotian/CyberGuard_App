import React from 'react';
import {
  Search, AlertTriangle, Check, X, ChevronLeft, ChevronRight, Copy, Pencil,
  Trash2, KeyRound, RefreshCw, Upload, Download, Shield, Network, FileText,
  Paperclip, Mail, Phone, Settings, Info, Play, MapPin, ExternalLink, Circle,
  ScanSearch, Database, Users, Link2, BrainCircuit, Image, CreditCard, UserRound,
  Siren
} from 'lucide-react';

const ADMIN_ICON_NAMES = new Set([
  'critical-action', 'extracted-phones', 'investigator-protocol', 'link-search', 'live-cases',
  'neural-accuracy', 'ocr-identifiers', 'operational-nodes', 'other-threats',
  'payment-identifiers', 'personnel-directory', 'phishing-links', 'scam-phone-tab'
]);

const ICONS = {
  search: Search, warning: AlertTriangle, success: Check, close: X, back: ChevronLeft,
  next: ChevronRight, copy: Copy, edit: Pencil, delete: Trash2, password: KeyRound,
  refresh: RefreshCw, upload: Upload, download: Download, shield: Shield,
  network: Network, document: FileText, attachment: Paperclip, mail: Mail,
  phone: Phone, settings: Settings, info: Info, play: Play, location: MapPin,
  link: ExternalLink, scan: ScanSearch, database: Database, users: Users,
  'link-search': Link2, 'neural-accuracy': BrainCircuit, 'ocr-identifiers': Image,
  'payment-identifiers': CreditCard, 'personnel-directory': UserRound,
  'critical-action': Siren, 'live-cases': FileText, 'investigator-protocol': Shield,
  'operational-nodes': Network, 'other-threats': AlertTriangle,
  'phishing-links': Link2, 'scam-phone-tab': Phone,
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

  const Icon = ICONS[name] || Circle;
  return (
    <Icon
      size={size}
      strokeWidth={1.9}
      aria-hidden={decorative ? 'true' : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      data-missing-icon={!ICONS[name] ? name : undefined}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...rest}
    />
  );
}
