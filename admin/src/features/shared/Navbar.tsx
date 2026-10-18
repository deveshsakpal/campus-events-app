import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuth, type AuthResponse } from '../../api/client';

interface NavbarProps {
  user: AuthResponse;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onSignOut }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    clearAuth(user.role as 'ADMIN' | 'TEACHER');
    if (onSignOut) {
      onSignOut();
    } else {
      navigate('/');
    }
  };

  const isAdmin = user.role === 'ADMIN';

  return (
    <header className="portal-navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          <span className="brand-icon">🎓</span>
          <span className="brand-text">Campus Events</span>
        </Link>
        <span className={`role-badge role-${user.role.toLowerCase()}`}>
          {isAdmin ? 'Admin Portal' : 'Faculty / Teacher Portal'}
        </span>
      </div>

      <div className="navbar-user">
        <span className="user-greeting">
          Signed in as <strong>{user.name}</strong> ({user.email})
        </span>
        <button type="button" onClick={handleSignOut} className="btn-secondary btn-sm">
          Sign Out
        </button>
      </div>
    </header>
  );
};
