import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import { useAuth } from '../context/AuthContext';

// SVG Icons for features
const FeatureIcon = ({ type }) => {
  const icons = {
    report: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>,
    ai: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><path d="M12 1v6"></path><path d="M4.22 4.22l4.24 4.24"></path><path d="M1 12h6"></path><path d="M4.22 19.78l4.24-4.24"></path><path d="M12 19v6"></path><path d="M19.78 19.78l-4.24-4.24"></path><path d="M23 12h-6"></path><path d="M19.78 4.22l-4.24 4.24"></path></svg>,
    cluster: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
    analytics: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
    track: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    verify: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
  };
  return icons[type] || icons.report;
};

const features = [
  {
    iconType: 'report',
    title: 'Report simply',
    desc: 'Submit complaints about potholes, garbage, streetlights, water leaks and more in a few taps.'
  },
  {
    iconType: 'ai',
    title: 'Classified by AI',
    desc: 'Complaints are automatically classified, deduplicated and routed to the right department.'
  },
  {
    iconType: 'cluster',
    title: 'Duplicate linking',
    desc: 'Similar reports are clustered together, so one incident isn\'t filed a dozen times.'
  },
  {
    iconType: 'analytics',
    title: 'Public analytics',
    desc: 'See where problems cluster and how quickly they get resolved — for everyone to see.'
  },
  {
    iconType: 'track',
    title: 'Tracked end to end',
    desc: 'Follow your complaint from submission through investigation to resolution.'
  },
  {
    iconType: 'verify',
    title: 'Proof of resolution',
    desc: 'Officials attach evidence and notes, so closure is verifiable, not just claimed.'
  }
];

const steps = [
  {
    num: '01',
    title: 'Report the issue',
    desc: 'Describe the problem and pin it on the map. Photos help the department act faster.'
  },
  {
    num: '02',
    title: 'AI routes it',
    desc: 'The system classifies, scores priority and assigns it to the responsible civic department.'
  },
  {
    num: '03',
    title: 'Track & resolve',
    desc: 'Follow each status change and review the proof once your issue is resolved.'
  }
];

const stats = [
  { num: '2.4k+', lbl: 'Issues resolved in the last 90 days' },
  { num: '94%', lbl: 'Long-term resolution rate' },
  { num: '7', lbl: 'Active civic departments' }
];

const Landing = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Reveal-on-scroll for static sections (redo on route change).
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('is-in');
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="app">
      <PublicNavbar />

      <section className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            Smart civic grievance platform
          </span>
          <h1>
            Every issue reported.<br />
            <em className="accent">Every issue seen.</em>
          </h1>
          <p>
            CivicSense lets citizens report local problems, places them intelligently with the
            right department, and tracks every request until it's genuinely resolved.
          </p>
          <div className="hero-buttons">
            <Link to={isAuthenticated ? '/complaints/submit' : '/register'} className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Report an issue
            </Link>
            <Link to={isAuthenticated ? '/dashboard' : '/public'} className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.22)', color: '#e8ebf3', background: 'transparent' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              View city status
            </Link>
          </div>

          <div className="hero-stats">
            {stats.map((s, i) => (
              <div className="hero-stat" key={i}>
                <div className="num">{s.num}</div>
                <div className="lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how">
        <div className="how-head reveal">
          <h2>From the street to a resolution</h2>
          <p>Three steps keep every report clear, accountable and easy to follow.</p>
        </div>
        <div className="how-grid">
          {steps.map((s, i) => (
            <div className={`step reveal`} key={i} style={{ transitionDelay: `${i * 60}ms` }}>
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="features">
        {features.map((f, i) => (
          <div className="feature-card reveal" key={i} style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
            <div className="feature-icon" style={{ color: '#4f46e5' }}>
              <FeatureIcon type={f.iconType} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="cta-band">
        <div className="cta-band-inner reveal">
          <h2>Help your city work better for everyone.</h2>
          <p>Join the residents already using CivicSense to hold civic services to account.</p>
          <Link to={isAuthenticated ? '/complaints/submit' : '/register'} className="btn btn-primary">
            Get started
          </Link>
        </div>
      </section>

      <footer className="public-footer">
        <div className="brand-note">
          <span className="public-logo">CS</span>
          <span>CivicSense AI</span>
        </div>
        <div>Built for responsive, transparent civic governance.</div>
      </footer>
    </div>
  );
};

export default Landing;
