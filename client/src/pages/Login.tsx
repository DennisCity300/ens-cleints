import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Footer from "../components/Footer";

export default function Login() {
  const { authenticated, loading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && authenticated) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-center">
        <div className="login-card">
          <div className="login-logo">
            <img src="/logo.png" alt="EnspireFX" width={48} height={48} />
          </div>
          <h1 className="login-title">EnspireFX</h1>
          <p className="login-subtitle">Client Access Credentials</p>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="field-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="input"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <div className="form-error">{error}</div>}

            <button className="btn btn-primary login-submit" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
