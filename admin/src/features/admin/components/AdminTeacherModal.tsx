import React, { useState } from 'react';

interface AdminTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacherData: { name: string; email: string; password: string }) => Promise<void>;
}

export const AdminTeacherModal: React.FC<AdminTeacherModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (!name.trim() || !email.trim() || !password) {
        throw new Error('Please fill in all teacher fields.');
      }
      if (password.length < 8) {
        throw new Error('Teacher temporary password must be at least 8 characters.');
      }
      await onSave({ name: name.trim(), email: email.trim(), password });
      setName('');
      setEmail('');
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create teacher account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Teacher Account</h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="teacher-name">Faculty / Teacher Name</label>
            <input
              id="teacher-name"
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Dr. Alan Turing"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="teacher-email">Teacher Email</label>
            <input
              id="teacher-email"
              type="email"
              required
              maxLength={254}
              placeholder="teacher@example.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="teacher-password">Initial Password (min 8 characters)</label>
            <input
              id="teacher-password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small className="form-hint">
              The teacher will use this email and password to log in at the Teacher Portal.
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Creating...' : 'Create Teacher Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
