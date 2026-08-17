import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function TopBar() {
  const { username, logout } = useAuth();

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">
        <img src="/logo.png" alt="" width={28} height={28} />
        <div className="topbar-titles">
          <span className="topbar-title">EnspireFX</span>
          <span className="topbar-subtitle">Client Access Credentials</span>
        </div>
      </Link>
      <div className="topbar-actions">
        <span className="topbar-user">{username}</span>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => logout()}>
          Sign out
        </button>
      </div>
    </header>
  );
}
