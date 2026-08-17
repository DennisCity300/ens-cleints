import React, { useState } from "react";
import Modal from "./Modal";
import type { Client } from "../api";

interface ClientFormModalProps {
  initial?: Client | null;
  onClose: () => void;
  onSubmit: (data: { name: string; website?: string; notes?: string }) => Promise<void>;
}

export default function ClientFormModal({ initial, onClose, onSubmit }: ClientFormModalProps) {
  const [name, setName] = useState(initial?.name || "");
  const [website, setWebsite] = useState(initial?.website || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Client name is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), website: website.trim(), notes: notes.trim() });
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={initial ? "Edit client" : "New client"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form="client-form" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="stacked-form">
        <label className="field-label" htmlFor="client-name">
          Client name
        </label>
        <input
          id="client-name"
          className="input"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Klodes"
        />

        <label className="field-label" htmlFor="client-website">
          Website
        </label>
        <input
          id="client-website"
          className="input"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="e.g. klodes.com"
        />

        <label className="field-label" htmlFor="client-notes">
          Notes
        </label>
        <textarea
          id="client-notes"
          className="input textarea"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this client"
        />

        {error && <div className="form-error">{error}</div>}
      </form>
    </Modal>
  );
}
