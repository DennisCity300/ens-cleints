import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ClientFormModal from "../components/ClientFormModal";
import { api, Client } from "../api";

interface DashboardPageProps {
  clients: Client[];
  loading: boolean;
  refreshClients: () => Promise<void> | void;
}

export default function DashboardPage({ clients, loading, refreshClients }: DashboardPageProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <Sidebar
        clients={clients}
        activeClient={null}
        onSelectClient={(id) => navigate(`/clients/${id}`)}
        onAddClient={() => setShowClientModal(true)}
      />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Clients</h1>
            <p className="page-subtitle">
              {loading ? "Loading…" : `${clients.length} client${clients.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowClientModal(true)}>
            + New client
          </button>
        </div>

        <input
          className="input search-input"
          placeholder="Search clients…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <p>No clients yet.</p>
            <button className="btn btn-primary" onClick={() => setShowClientModal(true)}>
              + Add your first client
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="platform-table-wrap">
            <table className="platform-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Website</th>
                  <th>Platforms</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/clients/${c.id}`)}>
                    <td>
                      <span className="client-row-name">
                        <span className="client-switcher-item-avatar">{c.name.slice(0, 1).toUpperCase()}</span>
                        <span className="platform-table-label">{c.name}</span>
                      </span>
                    </td>
                    <td className="platform-table-username">{c.website || "—"}</td>
                    <td className="platform-table-username">
                      {c.platformCount ?? 0} platform{(c.platformCount ?? 0) === 1 ? "" : "s"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showClientModal && (
        <ClientFormModal
          onClose={() => setShowClientModal(false)}
          onSubmit={async (data) => {
            const created = await api.createClient(data);
            await refreshClients();
            navigate(`/clients/${created.id}`);
          }}
        />
      )}
    </>
  );
}
