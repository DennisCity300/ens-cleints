import React, { useCallback, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import DashboardPage from "./DashboardPage";
import ClientPage from "./ClientPage";
import { api, Client } from "../api";

export default function Workspace() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshClients = useCallback(() => {
    return api
      .listClients()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  return (
    <div className="shell">
      <TopBar />
      <div className="shell-body">
        <Routes>
          <Route
            path="/"
            element={<DashboardPage clients={clients} loading={loading} refreshClients={refreshClients} />}
          />
          <Route
            path="/clients/:clientId"
            element={<ClientPage clients={clients} refreshClients={refreshClients} />}
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
