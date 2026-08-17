import React, { useState } from "react";

interface PasswordFieldProps {
  value: string;
  loading?: boolean;
  onReveal?: () => void;
}

export default function PasswordField({ value, loading, onReveal }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  function toggleVisible() {
    if (!visible && onReveal) onReveal();
    setVisible((v) => !v);
  }

  async function copy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    if (onReveal && !visible) onReveal();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="credential-value-row">
      <span className={`credential-value ${visible ? "" : "credential-masked"}`}>
        {loading ? "Loading…" : visible ? value || "—" : "••••••••••••"}
      </span>
      <button type="button" className="icon-btn" onClick={toggleVisible} aria-label="Toggle visibility">
        {visible ? "🙈" : "👁"}
      </button>
      <button type="button" className="icon-btn" onClick={copy} aria-label="Copy to clipboard">
        {copied ? "✓" : "⧉"}
      </button>
    </div>
  );
}
