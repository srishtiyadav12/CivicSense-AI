import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/client';
import Loading from '../components/shared/Loading';
import Alert from '../components/shared/Alert';
import { MapContainer, TileLayer } from 'react-leaflet';
import HeatmapLayer from '../components/maps/HeatmapLayer';
import 'leaflet/dist/leaflet.css';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#9aa8f0', '#9cc3b4', '#f0cf96', '#f0aaa8', '#a5cba9', '#c3b3ec', '#efb3c6'];

// Real Leaflet heatmap showing where complaints cluster geographically
const AnalyticMap = ({ data }) => {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div>
      <MapContainer
        center={[28.7041, 77.1025]}
        zoom={11}
        style={{ height: 440, width: '100%', borderRadius: 12, zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasData && <HeatmapLayer data={data} />}
      </MapContainer>

      {!hasData && (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '8px 0' }}>
          No geolocated complaints in this period yet. Submit a complaint on the map to see hotspots here.
        </p>
      )}

      <div className="mt-2" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.85rem', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }}></span> low
        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#f0cf96' }}></span> medium
        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }}></span> high
        <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>Heat = volume × priority of complaints by location</span>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const trendsRes = await dashboardApi.getTrends(days);
        setTrends(trendsRes.data.trends);

        const heatRes = await dashboardApi.getHeatmap({ days });
        setHeatmap(heatRes.data.heatmap || []);

        try {
          const statsRes = await dashboardApi.getStats();
          setStats(statsRes.data.stats);
        } catch (e) { /* stats optional */ }
      } catch (err) {
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  if (loading) return <Loading message="Loading analytics..." />;

  const deptPerformance = stats?.departmentPerformance || [];
  const typeData = (stats?.byType || []).map(s => ({ name: s._id, value: s.count }));
  const statusData = (stats?.byStatus || []).map(s => ({ name: s._id, value: s.count }));
  const priorityData = (stats?.byPriority || []).map(s => ({ name: `Priority ${s._id}`, value: s.count }));

  return (
    <div>
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>Analytics & Insights</h2>
          <p style={{ color: '#64748b' }}>Community issues and problem-prone areas</p>
        </div>

        <div className="flex-gap">
          <select className="form-select" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Overview stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Complaints</div>
          <div className="stat-value">{stats?.total || 0}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Avg Priority Score</div>
          <div className="stat-value">
            {(priorityData.reduce((acc, p) => acc + (parseInt(p.name.split(' ')[1] || 0) * p.value), 0) / (stats?.total || 1)).toFixed(1)}
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Resolution Rate</div>
          <div className="stat-value">
            {Math.round(((statusData.find(s => s.name === 'resolved')?.value || 0) / (stats?.total || 1)) * 100)}%
          </div>
        </div>
      </div>

      {/* Frequency trend chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Complaint Trend (Last {days} days)</h3>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#6f82d6" strokeWidth={2} name="Complaints" dot={false} />
              <Line type="monotone" dataKey="resolved" stroke="#7fa98f" strokeWidth={2} name="Resolved" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div className="card">
          <h3 className="card-title mb-3">By Complaint Type</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title mb-3">By Status</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData.map(s => ({ ...s, name: s.name.replace('_', ' ') }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#9cc3b4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department performance */}
      {deptPerformance.length > 0 && (
        <div className="card">
          <h3 className="card-title mb-3">Department Performance</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total</th>
                  <th>Resolved</th>
                  <th>In Progress</th>
                  <th>Resolution Rate</th>
                  <th>Avg Priority</th>
                </tr>
              </thead>
              <tbody>
                {deptPerformance.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{d.department}</td>
                    <td>{d.total}</td>
                    <td style={{ color: '#4c8a66' }}>{d.resolved}</td>
                    <td>{d.inProgress}</td>
                    <td>
                      <div className="flex-gap align-center">
                        <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, d.resolutionRate || 0)}%`, height: '100%', background: '#a5cba9' }} />
                        </div>
                        <span>{Math.round(d.resolutionRate || 0)}%</span>
                      </div>
                    </td>
                    <td>{d.avgPriority?.toFixed(1) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="card">
        <h3 className="card-title mb-3">Problem-Prone Areas</h3>
        <AnalyticMap data={heatmap} />
      </div>
    </div>
  );
};

export default Analytics;