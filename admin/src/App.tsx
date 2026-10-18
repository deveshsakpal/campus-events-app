import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PortalHome } from './features/shared/PortalHome';
import { AdminLoginPage } from './features/admin/AdminLoginPage';
import { AdminDashboardPage } from './features/admin/AdminDashboardPage';
import { TeacherLoginPage } from './features/teacher/TeacherLoginPage';
import { TeacherDashboardPage } from './features/teacher/TeacherDashboardPage';
import { ProtectedRoute } from './features/shared/ProtectedRoute';
import './styles.css';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalHome />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route path="/teacher/login" element={<TeacherLoginPage />} />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute role="TEACHER">
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
