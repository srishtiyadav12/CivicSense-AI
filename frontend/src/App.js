import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import ComplaintDetail from './pages/ComplaintDetail';
import SubmitComplaint from './pages/SubmitComplaint';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Clusters from './pages/Clusters';
import ClusterDetail from './pages/ClusterDetail';
import PublicTransparency from './pages/PublicTransparency';
import Loading from './components/shared/Loading';
import RealtimeToasts from './components/shared/RealtimeToasts';

// Protected route wrapper
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <Loading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout wrapper for authenticated pages: fixed sidebar on the left, content
// fills the remaining width. On small screens the sidebar is an off-canvas
// drawer toggled by the hamburger button.
const AppLayout = ({ children }) => {
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = () => setNavOpen(false);
  return (
    <div className="app-shell">
      <Sidebar open={navOpen} />
      <div className={`backdrop ${navOpen ? 'show' : ''}`} onClick={closeNav} aria-hidden="true" />
      <main className="app-main">
        <button
          className="nav-toggle"
          onClick={() => setNavOpen(open => !open)}
          aria-label="Toggle navigation"
        >
          <span></span><span></span><span></span>
        </button>
        {children}
      </main>
      {/* Live real-time toasts for status updates + new complaints */}
      <RealtimeToasts />
    </div>
  );
};

function App() {
  const { loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/public" element={<PublicTransparency />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/complaints" element={
        <ProtectedRoute>
          <AppLayout><Complaints /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/complaints/submit" element={
        <ProtectedRoute>
          <AppLayout><SubmitComplaint /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/complaints/:id" element={
        <ProtectedRoute>
          <AppLayout><ComplaintDetail /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute roles={['official', 'admin', 'super_admin']}>
          <AppLayout><Analytics /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/clusters" element={
        <ProtectedRoute roles={['official', 'admin', 'super_admin']}>
          <AppLayout><Clusters /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/clusters/:id" element={
        <ProtectedRoute roles={['official', 'admin', 'super_admin']}>
          <AppLayout><ClusterDetail /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute roles={['admin', 'super_admin']}>
          <AppLayout><Users /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
