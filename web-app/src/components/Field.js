import React from 'react';

export function Field({ label, htmlFor, required = false, hint, error, children }) {
  return (
    <div className={`cg-field${error ? ' cg-field--error' : ''}`}>
      {label && (
        <label className="cg-field__label" htmlFor={htmlFor}>
          {label}{required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {error ? <div className="cg-field__message">{error}</div> : hint ? <div className="cg-field__hint">{hint}</div> : null}
    </div>
  );
}

export function TextInput(props) {
  return <input className={`cg-control ${props.className || ''}`.trim()} {...props} />;
}

export function Select(props) {
  return <select className={`cg-control ${props.className || ''}`.trim()} {...props} />;
}

export function Textarea(props) {
  return <textarea className={`cg-control cg-control--textarea ${props.className || ''}`.trim()} {...props} />;
}
