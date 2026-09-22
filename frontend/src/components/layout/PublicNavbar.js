import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Top navigation bar used on public pages. The authenticated app uses the left
// Sidebar instead — this one serves visitors who are not signed in.
const PublicNavbar = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`public-nav ${scrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="public-brand">
        <span className="public-logo">CS</span>
        <span className="public-brand-name">CivicSense AI</span>
      </Link>

      <nav className="public-links">
        <Link to="/public" className="public-link">City status</Link>
        {isAuthenticated ? (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
        ) : (
          <>
            <Link to="/login" className="public-link">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default PublicNavbar;