import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      className={`cg-button cg-button--${variant} cg-button--${size} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Working…' : children}
    </button>
  );
}

export function IconButton({ label, children, size = 'md', ...props }) {
  return (
    <button
      type="button"
      className={`cg-icon-button cg-icon-button--${size}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
