import React, { useState } from "react";
import Modal from "./Modal";
import { PLATFORM_TYPES } from "../platformTypes";
import type { Platform } from "../api";

interface PlatformFormModalProps {
  initial?: Platform | null;
  onClose: () => void;
  onSubmit: (data: {
    platformType: string;
    label: string;
    url?: string;
    username?: string;
    password?: string;
    notes?: string;
  }) => Promise<void>;
}

export default function PlatformFormModal({ initial, onClose, onSubmit }: PlatformFormModalProps) {
  const [platformType, setPlatformType] = useState(initial?.platformType || "cpanel");
  const [label, setLabel] = useState(initial?.label || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(!initial);
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleTypeChange(value: string) {
    setPlatformType(value);
    if (!initial) {
      const def = PLATFORM_TYPES.find((t) => t.value === value);
      if (def && (!label || PLATFORM_TYPES.some((t) => t.label === label))) {
        setLabel(def.label);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: any = {
        platformType,
        label: label.trim(),
        url: url.trim(),
        username: username.trim(),
        notes: notes.trim(),
      };
      if (!initial || changePassword) {
        payload.password = password;
      }
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={initial ? "Edit platform" : "Add platform"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form="platform-form" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="platform-form" onSubmit={handleSubmit} className="stacked-form">
        <label className="field-label" htmlFor="platform-type">
          Platform type
        </label>
        <select
          id="platform-type"
          className="input"
          value={platformType}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          {PLATFORM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <label className="field-label" htmlFor="platform-label">
          Menu label
        </label>
        <input
          id="platform-label"
          className="input"
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. WordPress, Webmail — support"
        />

        <label className="field-label" htmlFor="platform-url">
          URL
        </label>
        <input
          id="platform-url"
          className="input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g. https://client.com/wp-admin"
        />

        <label className="field-label" htmlFor="platform-username">
          Username
        </label>
        <input
          id="platform-username"
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
        />

        <label className="field-label" htmlFor="platform-password">
          Password
        </label>
        {initial && !changePassword ? (
          <div className="password-locked-row">
            <span className="password-locked-text">
              {initial.hasPassword ? "•••••••• (saved)" : "No password saved"}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setChangePassword(true)}
            >
              Change
            </button>
          </div>
        ) : (
          <div className="password-input-row">
            <input
              id="platform-password"
              className="input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder={initial ? "Enter new password" : ""}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        )}

        <label className="field-label" htmlFor="platform-notes">
          Notes
        </label>
        <textarea
          id="platform-notes"
          className="input textarea"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional — access instructions, security questions, etc."
        />

        {error && <div className="form-error">{error}</div>}
      </form>
    </Modal>
  );
}
