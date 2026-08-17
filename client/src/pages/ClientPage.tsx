import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ClientFormModal from "../components/ClientFormModal";
import PlatformFormModal from "../components/PlatformFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import PasswordField from "../components/PasswordField";
import { platformTypeLabel } from "../platformTypes";
import { api, Client, Platform } from "../api";

interface ClientPageProps {
  clients: Client[];
  refreshClients: () => Promise<void> | void;
}

export default function ClientPage({ clients, refreshClients }: ClientPageProps) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const id = Number(clientId);

  const [client, setClient] = useState<Client | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [revealing, setRevealing] = useState<number | null>(null);

  const [showEditClient, setShowEditClient] = useState(false);
  const [showDeleteClient, setShowDeleteClient] = useState(false);
  const [platformModal, setPlatformModal] = useState<"add" | "edit" | null>(null);
  const [deletePlatformTarget, setDeletePlatformTarget] = useState<Platform | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([api.getClient(id), api.listPlatforms(id)])
      .then(([c, p]) => {
        setClient(c);
        setPlatforms(p);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setSelectedPlatformId(null);
    setRevealed({});
    load();
  }, [load]);

  const selectedPlatform = platforms.find((p) => p.id === selectedPlatformId) || null;

  async function handleReveal(platformId: number) {
    if (revealed[platformId] !== undefined) return;
    setRevealing(platformId);
    try {
      const full = await api.revealPlatform(id, platformId);
      setRevealed((r) => ({ ...r, [platformId]: full.password }));
    } finally {
      setRevealing(null);
    }
  }

  if (!client && loading) {
    return (
      <>
        <Sidebar clients={clients} activeClient={null} onSelectClient={(cid) => navigate(`/clients/${cid}`)} onAddClient={() => {}} />
        <main className="main-content">
          <p className="page-subtitle">Loading client…</p>
        </main>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <Sidebar clients={clients} activeClient={null} onSelectClient={(cid) => navigate(`/clients/${cid}`)} onAddClient={() => {}} />
        <main className="main-content">
          <div className="empty-state">
            <p>Client not found.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar
        clients={clients}
        activeClient={client}
        onSelectClient={(cid) => navigate(`/clients/${cid}`)}
        onAddClient={() => {}}
        platforms={platforms}
        activePlatformId={selectedPlatformId}
        onSelectPlatform={setSelectedPlatformId}
        onAddPlatform={() => setPlatformModal("add")}
      />

      <main className="main-content">
        {!selectedPlatform ? (
          <>
            <div className="page-header">
              <div>
                <h1>{client.name}</h1>
                {client.website && (
                  <a className="page-subtitle-link" href={normalizeUrl(client.website)} target="_blank" rel="noreferrer">
                    {client.website}
                  </a>
                )}
              </div>
              <div className="header-actions">
                <a className="btn btn-secondary" href={api.pdfUrl(id)} target="_blank" rel="noreferrer">
                  Download PDF
                </a>
                <button className="btn btn-secondary" onClick={() => setShowEditClient(true)}>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => setShowDeleteClient(true)}>
                  Delete
                </button>
              </div>
            </div>

            {client.notes && <p className="client-notes">{client.notes}</p>}

            <div className="section-label">Platforms</div>
            {platforms.length === 0 ? (
              <div className="empty-state">
                <p>No platforms added yet.</p>
                <button className="btn btn-primary" onClick={() => setPlatformModal("add")}>
                  + Add platform
                </button>
              </div>
            ) : (
              <div className="platform-table-wrap">
                <table className="platform-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Platform</th>
                      <th>Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platforms.map((p) => (
                      <tr key={p.id} onClick={() => setSelectedPlatformId(p.id)}>
                        <td>
                          <span className="platform-table-type">{platformTypeLabel(p.platformType)}</span>
                        </td>
                        <td className="platform-table-label">{p.label}</td>
                        <td className="platform-table-username">{p.username || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="page-header">
              <div>
                <button type="button" className="breadcrumb-link" onClick={() => setSelectedPlatformId(null)}>
                  ← {client.name}
                </button>
                <span className="platform-detail-type">{platformTypeLabel(selectedPlatform.platformType)}</span>
                <h1>{selectedPlatform.label}</h1>
              </div>
              <div className="header-actions">
                <button className="btn btn-secondary" onClick={() => setPlatformModal("edit")}>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => setDeletePlatformTarget(selectedPlatform)}>
                  Delete
                </button>
              </div>
            </div>

            <div className="credential-card">
              {selectedPlatform.url && (
                <div className="credential-row">
                  <span className="credential-label">URL</span>
                  <a className="credential-value credential-link" href={normalizeUrl(selectedPlatform.url)} target="_blank" rel="noreferrer">
                    {selectedPlatform.url}
                  </a>
                </div>
              )}
              {selectedPlatform.username && (
                <div className="credential-row">
                  <span className="credential-label">Username</span>
                  <span className="credential-value-row">
                    <span className="credential-value">{selectedPlatform.username}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Copy username"
                      onClick={() => navigator.clipboard.writeText(selectedPlatform.username || "")}
                    >
                      ⧉
                    </button>
                  </span>
                </div>
              )}
              {selectedPlatform.hasPassword && (
                <div className="credential-row">
                  <span className="credential-label">Password</span>
                  <PasswordField
                    value={revealed[selectedPlatform.id] ?? ""}
                    loading={revealing === selectedPlatform.id}
                    onReveal={() => handleReveal(selectedPlatform.id)}
                  />
                </div>
              )}
              {selectedPlatform.notes && (
                <div className="credential-row">
                  <span className="credential-label">Notes</span>
                  <span className="credential-value">{selectedPlatform.notes}</span>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showEditClient && (
        <ClientFormModal
          initial={client}
          onClose={() => setShowEditClient(false)}
          onSubmit={async (data) => {
            const updated = await api.updateClient(id, data);
            setClient(updated);
            await refreshClients();
          }}
        />
      )}

      {showDeleteClient && (
        <ConfirmDialog
          title="Delete client"
          message={`Delete "${client.name}" and all of its saved platform credentials? This cannot be undone.`}
          onCancel={() => setShowDeleteClient(false)}
          onConfirm={async () => {
            await api.deleteClient(id);
            await refreshClients();
            navigate("/");
          }}
        />
      )}

      {platformModal && (
        <PlatformFormModal
          initial={platformModal === "edit" ? selectedPlatform : null}
          onClose={() => setPlatformModal(null)}
          onSubmit={async (data) => {
            if (platformModal === "edit" && selectedPlatform) {
              const updated = await api.updatePlatform(id, selectedPlatform.id, data);
              setPlatforms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              setRevealed((r) => ({ ...r, [updated.id]: updated.password }));
            } else {
              const created = await api.createPlatform(id, data);
              setPlatforms((prev) => [...prev, created]);
              setRevealed((r) => ({ ...r, [created.id]: created.password }));
              setSelectedPlatformId(created.id);
            }
            await refreshClients();
          }}
        />
      )}

      {deletePlatformTarget && (
        <ConfirmDialog
          title="Delete platform"
          message={`Delete "${deletePlatformTarget.label}" from ${client.name}?`}
          onCancel={() => setDeletePlatformTarget(null)}
          onConfirm={async () => {
            await api.deletePlatform(id, deletePlatformTarget.id);
            setPlatforms((prev) => prev.filter((p) => p.id !== deletePlatformTarget.id));
            if (selectedPlatformId === deletePlatformTarget.id) setSelectedPlatformId(null);
            setDeletePlatformTarget(null);
            await refreshClients();
          }}
        />
      )}
    </>
  );
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
