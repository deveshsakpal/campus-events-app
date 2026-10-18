import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuth, type AuthResponse } from '../../api/client';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const result = await request<AuthResponse>('/api/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (result.role !== 'ADMIN') {
        throw new Error('This login is strictly for Admin accounts. Please use the appropriate portal.');
      }

      setAuth('ADMIN', result);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-badge admin-badge">Campus Administration</span>
          <h1>Admin Sign In</h1>
          <p>Sign in to manage all campus events and faculty teacher accounts.</p>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              required
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary btn-block">
            {busy ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/teacher/login">Are you a teacher? Sign in here &rarr;</Link>
          <div className="home-link-row">
            <Link to="/">Back to Portal Selection</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
