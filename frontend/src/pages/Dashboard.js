import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, complaintApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/shared/Loading';
import Alert from '../components/shared/Alert';
import StatusBadge from '../components/complaints/StatusBadge';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { typeLabel, capitalize, STATUS_LABELS, formatDateShort } from '../utils/helpers';

const COLORS = ['#9aa8f0', '#9cc3b4', '#f0cf96', '#f0aaa8', '#a5cba9', '#c3b3ec', '#efb3c6'];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [myComplaints, setMyComplaints] = useState([]);
  const [myComplaintsLoading, setMyComplaintsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, trendsRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getTrends(30)
        ]);
        setStats(statsRes.data.stats);
        setTrends(trendsRes.data.trends);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // For citizens, load the complaints they personally posted (the backend
  // already scopes /complaints to the caller's own reports for the citizen role).
  const isCitizen = user?.role === 'citizen';

  useEffect(() => {
    if (!isCitizen) return;
    let cancelled = false;
    const loadMy = async () => {
      setMyComplaintsLoading(true);
      try {
        const res = await complaintApi.getAll({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' });
        if (!cancelled) setMyComplaints(res.data.complaints || []);
      } catch (e) {
        if (!cancelled) setMyComplaints([]);
      } finally {
        if (!cancelled) setMyComplaintsLoading(false);
      }
    };
    loadMy();
    return () => { cancelled = true; };
  }, [isCitizen]);

  if (loading) return <Loading message="Loading dashboard..." />;
  if (error && !stats) return <Alert type="error">{error}</Alert>;

  const total = stats?.total || 0;
  const statusMap = (stats?.byStatus || []).reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});
  const typeData = (stats?.byType || []).map(s => ({
    name: typeLabel(s._id),
    value: s.count
  }));
  const priorityData = (stats?.byPriority || []).map(s => ({
    name: `P${s._id}${s._id === 4 ? ' (Critical)' : ''}`,
    value: s.count
  }));

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ fontSize: '1.5rem' }}>Welcome, {capitalize(user?.name || 'User')} 👋</h2>
        <p style={{ color: '#64748b' }}>
          {user?.role === 'citizen' && 'Here\'s an overview of your reported issues.'}
          {user?.role === 'official' && `Overview of complaints in ${user?.department || 'your department'}.`}
          {user?.role === 'admin' && 'System-wide overview of all civic complaints.'}
        </p>
      </div>

      {/* Quick action for citizens */}
      {user?.role === 'citizen' && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #6f82d6, #8f9fe0)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Spot a civic issue?</h3>
              <p style={{ opacity: 0.9 }}>Report it now and track it until resolution.</p>
            </div>
            <Link to="/complaints/submit" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Report an Issue
            </Link>
          </div>
        </div>
      )}

      {error && <Alert type="error">{error}</Alert>}

      {/* Stats Grid */}
      <div className="stats-grid mt-3">
        <div className="stat-card">
          <div className="stat-label">Total Complaints</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{(statusMap.submitted || 0) + (statusMap.under_review || 0)}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{(statusMap.assigned || 0) + (statusMap.in_progress || 0)}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{statusMap.resolved || 0}</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Complaints by Type</h3>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Complaints by Status</h3>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(stats?.byStatus || []).map(s => ({ name: STATUS_LABELS[s._id] || s._id, count: s.count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#9aa8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* My Complaints — citizens see the complaints they posted */}
      {isCitizen ? (
        <div className="card mt-3">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <h3 className="card-title">My Complaints</h3>
            <div className="flex-gap">
              <Link to="/complaints/submit" className="btn btn-outline btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New
              </Link>
              <Link to="/complaints" className="btn btn-primary btn-sm">View All</Link>
            </div>
          </div>

          {myComplaintsLoading && <p style={{ color: '#64748b' }}>Loading your complaints...</p>}

          {!myComplaintsLoading && myComplaints.length === 0 && (
            <p style={{ color: '#64748b' }}>
              You haven't reported any complaints yet.{' '}
              <Link to="/complaints/submit">Report your first issue now</Link>.
            </p>
          )}

          {myComplaints.length > 0 && (
            <div className="my-complaints-list">
              {myComplaints.map(c => (
                <Link key={c._id} to={`/complaints/${c._id}`} className="my-complaint-row">
                  <div className="my-complaint-main">
                    <div className="my-complaint-title">{c.title}</div>
                    <div className="my-complaint-meta">
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:4}}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                        {typeLabel(c.type)}
                      </span>
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:4}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {formatDateShort(c.createdAt)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card mt-3">
          <div className="card-header">
            <h3 className="card-title">Recent Complaints</h3>
            <Link to="/complaints" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <p style={{ color: '#64748b' }}>
            Manage and track all complaints from the <Link to="/complaints">Complaints</Link> page.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
