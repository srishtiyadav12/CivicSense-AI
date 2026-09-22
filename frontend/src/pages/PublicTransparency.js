import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../api/client';
import Loading from '../components/shared/Loading';
import Alert from '../components/shared/Alert';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import PublicNavbar from '../components/layout/PublicNavbar';
import StatusBadge from '../components/complaints/StatusBadge';
import { typeLabel, formatDate } from '../utils/helpers';

// Refined civic palette — anchored to the shared design tokens.
const TYPE_COLORS = ['#4f46e5', '#0eaa63', '#df8a12', '#e5494d', '#0e8fc2', '#7c3aed', '#db2777', '#28a745', '#9a6a2f', '#c2410c', '#475569'];

const PublicTransparency = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  // "Track a complaint" widget (no auth needed)
  const [trackId, setTrackId] = useState('');
  const [tracking, setTracking] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [trackBusy, setTrackBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await publicApi.getDashboard(days);
        setStats(res.data.stats);
      } catch (err) {
        setError('Could not load city status. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  if (loading) return <Loading message="Loading city status..." />;

  const handleTrack = async (e) => {
    e.preventDefault();
    const rawId = trackId.trim();
    if (!rawId) return;
    setTrackBusy(true);
    setTrackError('');
    setTracking(null);
    try {
      const res = await publicApi.track(rawId);
      setTracking(res.data.tracking);
    } catch (err) {
      setTrackError('No complaint found with that ID.');
      setTracking(null);
    } finally {
      setTrackBusy(false);
    }
  };

  const typeData = (stats?.byType || []).map(t => ({ name: typeLabel(t.type), value: t.count, raw: t.type }));
  const statusData = (stats?.byStatus || []).map(s => ({ name: s.status.replace('_', ' '), value: s.count }));

  return (
    <div className="public-page">
      <PublicNavbar />

      <main className="public-content">
        {/* Page hero */}
        <section className="page-hero">
          <p className="page-eyebrow">Open by design</p>
          <h1>City transparency dashboard</h1>
          <p className="page-lede">
            A live, public view of civic issues being reported and resolved across the city —
            aggregated and anonymized. No personal data shown.
          </p>
          <Link to="/register" className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Report an issue
          </Link>
        </section>

        {error && <Alert type="error">{error}</Alert>}

        {/* Track a complaint widget */}
        <section className="track-card">
          <div className="track-head">
            <div>
              <h3>Track a complaint</h3>
              <p className="track-sub">No sign-in needed. Enter your complaint ID to see its current status and timeline.</p>
            </div>
          </div>
          <form onSubmit={handleTrack} className="track-form">
            <input
              className="form-input"
              placeholder="Complaint ID — e.g. 42"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" disabled={trackBusy}>
              {trackBusy ? 'Looking up…' : 'Track'}
            </button>
          </form>

          {trackError && <p className="track-error">{trackError}</p>}

          {tracking && (
            <div className="track-result">
              <div className="track-meta">
                <strong>#{tracking.id} · {tracking.title}</strong>
                <StatusBadge status={tracking.status} />
              </div>
              <p className="track-deets">
                {tracking.department}{tracking.ward ? ` · ${tracking.ward}` : ''}
                {tracking.assignedOfficial ? ` · handled by ${tracking.assignedOfficial}` : ''}
              </p>
              <div className="track-chips">
                <span className="chip">Submitted {formatDate(tracking.createdAt)}</span>
                {tracking.satisfactionRating && (
                  <span className="chip chip-score">Rated {tracking.satisfactionRating}/5</span>
                )}
              </div>
              <Link to={`/complaints/${tracking.id}`} className="track-link">
                View full details →
              </Link>
            </div>
          )}
        </section>

        {/* Headline stat cards */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Complaints Reported</div>
            <div className="stat-value">{stats?.total || 0}</div>
          </div>
          <div className="stat-card success">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{stats?.resolved || 0}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">Currently Open</div>
            <div className="stat-value">{stats?.open || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Resolution Rate</div>
            <div className="stat-value">{stats?.resolutionRate || 0}%</div>
          </div>
        </section>

        <div className="toolbar">
          <p className="toolbar-note">Aggregated, anonymized — collected over the selected window.</p>
          <select className="form-select" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={36500}>All time</option>
          </select>
        </div>

        <div className="chart-grid">
          {/* Issues by type */}
          <div className="card">
            <h3 className="card-title mb-3">What's being reported</h3>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => (e.value > 0 ? String(e.value) : '')}>
                    {typeData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="card">
            <h3 className="card-title mb-3">Complaint status</h3>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} stroke="#97a0b3" />
                  <YAxis type="category" dataKey="name" width={110} stroke="#97a0b3" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Issues by department */}
        {stats?.byDepartment?.length > 0 && (
          <div className="card mt-3">
            <h3 className="card-title mb-3">Where issues are routed</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Department</th><th>Active Complaints</th></tr>
                </thead>
                <tbody>
                  {stats.byDepartment.sort((a, b) => b.count - a.count).map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{d.department}</td>
                      <td>{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="public-footer">
        <span className="public-logo">CS</span>
        <p>CivicSense AI — an open civic platform.</p>
      </footer>
    </div>
  );
};

export default PublicTransparency;