import React from "react";
import ClientSwitcher from "./ClientSwitcher";
import { platformTypeGlyph } from "../platformTypes";
import type { Client, Platform } from "../api";

interface SidebarProps {
  clients: Client[];
  activeClient?: Client | null;
  onSelectClient: (id: number) => void;
  onAddClient: () => void;
  platforms?: Platform[];
  activePlatformId?: number | null;
  onSelectPlatform?: (id: number) => void;
  onAddPlatform?: () => void;
}

export default function Sidebar({
  clients,
  activeClient,
  onSelectClient,
  onAddClient,
  platforms,
  activePlatformId,
  onSelectPlatform,
  onAddPlatform,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <ClientSwitcher
        clients={clients}
        activeClient={activeClient}
        onSelect={onSelectClient}
        onAddClient={onAddClient}
      />

      <div className="sidebar-divider" />

      {activeClient ? (
        <>
          <div className="sidebar-section-label">Platforms</div>
          <nav className="platform-nav">
            {(platforms || []).map((p) => (
              <button
                key={p.id}
                type="button"
                className={`platform-nav-item ${activePlatformId === p.id ? "active" : ""}`}
                onClick={() => onSelectPlatform?.(p.id)}
              >
                <span className="platform-nav-glyph">{platformTypeGlyph(p.platformType)}</span>
                <span className="platform-nav-text">{p.label}</span>
              </button>
            ))}
            {(!platforms || platforms.length === 0) && (
              <div className="sidebar-empty-hint">No platforms yet</div>
            )}
          </nav>
          <button type="button" className="sidebar-add-btn" onClick={onAddPlatform}>
            + Add platform
          </button>
        </>
      ) : (
        <div className="sidebar-empty-hint">Select a client to see its platforms</div>
      )}
    </aside>
  );
}
