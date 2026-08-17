import React, { useEffect, useRef, useState } from "react";
import type { Client } from "../api";

interface ClientSwitcherProps {
  clients: Client[];
  activeClient?: Client | null;
  onSelect: (id: number) => void;
  onAddClient: () => void;
}

export default function ClientSwitcher({ clients, activeClient, onSelect, onAddClient }: ClientSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="client-switcher" ref={rootRef}>
      <button type="button" className="client-switcher-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="client-switcher-avatar">
          {(activeClient?.name || "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="client-switcher-label">{activeClient ? activeClient.name : "Select a client"}</span>
        <span className="client-switcher-chevron">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="client-switcher-panel">
          <input
            className="input client-switcher-search"
            placeholder="Search clients…"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="client-switcher-list">
            {filtered.length === 0 && <div className="client-switcher-empty">No clients found</div>}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`client-switcher-item ${activeClient?.id === c.id ? "active" : ""}`}
                onClick={() => {
                  onSelect(c.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span className="client-switcher-item-avatar">{c.name.slice(0, 1).toUpperCase()}</span>
                <span className="client-switcher-item-text">
                  <span className="client-switcher-item-name">{c.name}</span>
                  <span className="client-switcher-item-meta">
                    {c.platformCount ?? 0} platform{(c.platformCount ?? 0) === 1 ? "" : "s"}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="client-switcher-add"
            onClick={() => {
              setOpen(false);
              onAddClient();
            }}
          >
            + New client
          </button>
        </div>
      )}
    </div>
  );
}
