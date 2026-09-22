import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { roleLabel, capitalize } from '../../utils/helpers';
import { isPushSupported, isPushSubscribed, subscribePush, unsubscribePush } from '../../api/notifications';

// VAPID public key — set via env or use the demo key placeholder.
// When generating your own VAPID keys: `npx web-push generate-vapid-keys`
const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';

// Clean, modern SVG icons for the sidebar
const Icon = ({ name, size = 18 }) => {
  const paths = {
    dashboard: ['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
    complaints: ['M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
    analytics: ['M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
    clusters: ['M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'],
    users: ['M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0H21m-3.75-3.75h.008v.008h-.008v-.008zm-7.5 0h.008v.008h-.008v-.008z'],
    report: ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z']
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {(paths[name] || []).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
};

// Left side panel navigation. Replaces the old top navbar — navigation now
// lives in a fixed sidebar while the page content fills the rest of the width.
const Sidebar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    (async () => {
      if (!isPushSupported()) return;
      setPushSupported(true);
      setPushEnabled(await isPushSubscribed());
    })();
  }, []);

  const togglePush = async () => {
    if (!pushSupported) return;
    if (pushEnabled) {
      await unsubscribePush();
      setPushEnabled(false);
    } else {
      const { error } = await subscribePush(VAPID_PUBLIC_KEY);
      if (!error) setPushEnabled(true);
    }
  };

  // Navigation grouped by purpose. roles = [] means all logged-in roles.
  const sections = [
    {
      label: 'Overview',
      links: [
        { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: [] }
      ]
    },
    {
      label: 'Complaints',
      links: [
        { to: '/complaints', label: user?.role === 'citizen' ? 'My Complaints' : 'All Complaints', icon: 'complaints', roles: [] }
      ]
    },
    {
      label: 'Insights',
      links: [
        { to: '/analytics', label: 'Analytics', icon: 'analytics', roles: ['official', 'admin', 'super_admin'] },
        { to: '/clusters', label: 'Complaint Clusters', icon: 'clusters', roles: ['official', 'admin', 'super_admin'] }
      ]
    },
    {
      label: 'Administration',
      links: [
        { to: '/users', label: 'User Management', icon: 'users', roles: ['admin', 'super_admin'] }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (user?.name || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (!isAuthenticated) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">CS</span>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">CivicSense AI</span>
          <span className="sidebar-brand-sub">City Grievance Platform</span>
        </div>
      </div>

      <Link to="/complaints/submit" className="sidebar-cta">
        <Icon name="report" size={18} />
        <span>Report a New Issue</span>
      </Link>

      <nav className="sidebar-nav">
        {sections.map((section) => {
          const visible = section.links.filter(l =>
            l.roles.length === 0 || (user && l.roles.includes(user.role))
          );
          if (visible.length === 0) return null;
          return (
            <div className="side-group" key={section.label}>
              <span className="side-group-label">{section.label}</span>
              {visible.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
                >
                  <Icon name={link.icon} />
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {pushSupported && (
          <button
            onClick={togglePush}
            className="side-push-toggle"
            title={pushEnabled ? 'Notifications enabled — click to disable' : 'Enable push notifications'}
            aria-label={pushEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              {pushEnabled && <circle cx="18" cy="4" r="3" fill="#10b981" stroke="none" />}
            </svg>
            <span className="push-label">{pushEnabled ? 'Alerts on' : 'Alerts off'}</span>
          </button>
        )}
        <div className="side-user">
          <span className="side-user-avatar">{initials}</span>
          <div className="side-user-meta">
            <span className="side-user-name">{capitalize(user?.name || 'User')}</span>
            <span className={`role-badge role-badge-${user?.role}`}>{roleLabel(user?.role)}</span>
          </div>
          <button onClick={handleLogout} className="side-logout" title="Logout" aria-label="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;