import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuth, type AuthResponse } from '../../api/client';

export const TeacherLoginPage: React.FC = () => {
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

      if (result.role !== 'TEACHER') {
        throw new Error('This login is strictly for Teacher / Faculty accounts. Admins and Students must sign in through their respective portals.');
      }

      setAuth('TEACHER', result);
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card teacher-auth-card">
        <div className="auth-card-header">
          <span className="auth-badge teacher-badge">Faculty &amp; Staff</span>
          <h1>Teacher Sign In</h1>
          <p>Sign in to publish and manage your departmental campus events.</p>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="teacher-email">Faculty Email</label>
            <input
              id="teacher-email"
              type="email"
              required
              placeholder="faculty@example.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="teacher-password">Password</label>
            <input
              id="teacher-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary teacher-btn btn-block">
            {busy ? 'Authenticating...' : 'Sign In as Teacher'}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/admin/login">Are you a system administrator? Sign in here &rarr;</Link>
          <div className="home-link-row">
            <Link to="/">Back to Portal Selection</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
