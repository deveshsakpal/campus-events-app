import React from 'react';
import { Link } from 'react-router-dom';
import { getAuth } from '../../api/client';

export const PortalHome: React.FC = () => {
  const adminAuth = getAuth('ADMIN');
  const teacherAuth = getAuth('TEACHER');

  return (
    <div className="portal-home-container">
      <div className="portal-hero">
        <div className="portal-logo">🎓</div>
        <h1>Campus Events Management Portal</h1>
        <p className="portal-subtitle">
          Select your authorized role to access campus events management and faculty tools.
        </p>
      </div>

      <div className="role-cards-grid">
        {/* Admin Card */}
        <div className="role-card admin-card">
          <div className="role-card-badge">Administration</div>
          <h2>Admin Portal</h2>
          <p>
            Full campus administration: Create, edit, and delete any campus event, and manage faculty &amp; teacher accounts.
          </p>
          <ul className="role-features-list">
            <li>Manage all campus events</li>
            <li>Create &amp; manage Teacher accounts</li>
            <li>System-wide administration controls</li>
          </ul>
          <div className="role-card-action">
            {adminAuth ? (
              <Link to="/admin/dashboard" className="btn-primary">
                Open Admin Dashboard ({adminAuth.name})
              </Link>
            ) : (
              <Link to="/admin/login" className="btn-primary">
                Admin Sign In &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Teacher Card */}
        <div className="role-card teacher-card">
          <div className="role-card-badge">Faculty</div>
          <h2>Teacher Portal</h2>
          <p>
            Department &amp; course activities: Create campus events and manage the events you created for students.
          </p>
          <ul className="role-features-list">
            <li>Create departmental events</li>
            <li>Edit &amp; delete your own events</li>
            <li>Isolated faculty permissions</li>
          </ul>
          <div className="role-card-action">
            {teacherAuth ? (
              <Link to="/teacher/dashboard" className="btn-primary">
                Open Teacher Dashboard ({teacherAuth.name})
              </Link>
            ) : (
              <Link to="/teacher/login" className="btn-primary">
                Teacher Sign In &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>

      <footer className="portal-footer-note">
        Students access event browsing and registrations via the Flutter Student application.
      </footer>
    </div>
  );
};
