import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clusterApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/shared/Loading';
import Alert from '../components/shared/Alert';
import StatusBadge from '../components/complaints/StatusBadge';
import { typeLabel, formatDateShort, PRIORITY_COLORS } from '../utils/helpers';

const Clusters = () => {
  const { user } = useAuth();
  const [clusters, setClusters] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadClusters = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await clusterApi.getAll({ limit: 100 });
      setClusters(res.data.clusters);
      setStats(res.data.stats);
    } catch (err) {
      setError('Failed to load clusters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const handleRebuild = async () => {
    if (!window.confirm('Recompute all clusters from current similarity data? This updates existing groupings.')) return;
    setRebuilding(true);
    setMessage('');
    setError('');
    try {
      const res = await clusterApi.rebuild();
      setMessage(`Rebuilt ${res.data.summary.clusters} clusters from ${res.data.summary.totalComplaints} complaints.`);
      await loadClusters();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rebuild clusters');
    } finally {
      setRebuilding(false);
    }
  };

  if (loading) return <Loading message="Loading clusters..." />;
  if (error && !clusters.length) return <Alert type="error">{error}</Alert>;

  return (
    <div>
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>Complaint Clusters</h2>
          <p style={{ color: '#64748b' }}>
            <strong>AI grouped</strong> similar complaints reported near the same location into clusters — so authorities can see recurring hotspots instead of hundreds of separate tickets.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-secondary btn-sm" onClick={handleRebuild} disabled={rebuilding}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
              {rebuilding ? 'Rebuilding...' : 'Recompute'}
            </button>
        )}
      </div>

      {message && <Alert type="success">{message}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {/* Stats */}
      <div className="stats-grid mt-2">
        <div className="stat-card">
          <div className="stat-label">Total Clusters</div>
          <div className="stat-value">{stats?.total || 0}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">Hotspots (2+ reports)</div>
          <div className="stat-value">{stats?.hotspots || 0}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Complaints Grouped</div>
          <div className="stat-value">{stats?.clusteredComplaints || 0}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Avg Cluster Size</div>
          <div className="stat-value">{stats?.avgSize || 0}</div>
        </div>
      </div>

      {clusters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No clusters yet</h3>
          <p>
            Clusters form automatically when multiple citizens report the same issue.
            Submit a couple of similar complaints to see grouping in action.
          </p>
          <Link to="/complaints/submit" className="btn btn-primary btn-sm mt-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Report Issue
          </Link>
        </div>
      ) : (
        <div className="cluster-grid mt-4">
          {clusters.map(c => {
            const priorityColor = PRIORITY_COLORS[c.maxPriority] || '#ca8a04';
            return (
              <Link key={c.id} to={`/clusters/${c.id}`} className="cluster-card">
                <div className="cluster-card-top">
                  <h3 className="cluster-title">{c.title}</h3>
                  <span className="cluster-count" title={`${c.memberCount} complaints`}>{c.memberCount}</span>
                </div>
                <div className="flex-gap flex-wrap" style={{ margin: '8px 0' }}>
                  <span className="badge badge-status">{typeLabel(c.type)}</span>
                  <StatusBadge status={c.status} />
                  <span className="badge" style={{ background: '#eef2ff', color: '#4338ca' }}>
                    Peak priority: <span style={{ color: priorityColor, fontWeight: 700 }}>P{c.maxPriority}</span>
                  </span>
                </div>
                <p className="complaint-desc" style={{ minHeight: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:4}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {c.locAddress || 'Location not specified'}
                </p>
                <div className="complaint-meta">
                  <span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path></svg>
                    {c.department}
                  </span>
                  <span>🤝 {Math.round(c.avgSimilarity * 100)}% avg similarity</span>
                  <span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {formatDateShort(c.createdAt)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Clusters;