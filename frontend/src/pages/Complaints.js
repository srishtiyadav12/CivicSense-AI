import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintApi, getApiBase } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/shared/Loading';
import Alert from '../components/shared/Alert';
import ComplaintCard from '../components/complaints/ComplaintCard';
import { COMPLAINT_TYPE_LABELS, STATUS_LABELS } from '../utils/helpers';

const Complaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ status: '', type: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadComplaints = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;

      const res = await complaintApi.getAll(params);
      setComplaints(res.data.complaints);
      setPagination(res.data.pagination);
    } catch (err) {
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    loadComplaints(1);
  };

  const isAuthority = ['official', 'admin', 'super_admin'].includes(user?.role);

  // CSV export (authorities) — reuses the current filters by building a query string
  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    if (filters.search) params.set('search', filters.search);

    const token = localStorage.getItem('cs_token');
    // Fetch with auth header, then trigger a client-side download of the CSV
    fetch(`${getApiBase()}/api/complaints/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `complaints-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => setError(err.message));
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (filters.search !== '') loadComplaints(1);
    }, 500);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  return (
    <div>
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>Complaints</h2>
          <p style={{ color: '#64748b' }}>
            {user?.role === 'citizen' ? 'Your reported issues' : 'All civic complaints'}
          </p>
        </div>
        <div className="flex-gap">
          {isAuthority && (
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export
            </button>
          )}
          <Link to="/complaints/submit" className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Complaint
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          name="search"
          className="form-input"
          placeholder="Search complaints..."
          value={filters.search}
          onChange={handleFilterChange}
        />
        <select name="status" className="form-select" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select name="type" className="form-select" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          {Object.entries(COMPLAINT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={applyFilters}>Apply</button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <Loading message="Loading complaints..." />
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No complaints found</h3>
          <p>Try adjusting your filters or report a new issue.</p>
          <Link to="/complaints/submit" className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Report Issue
          </Link>
        </div>
      ) : (
        <>
          {complaints.map(c => <ComplaintCard key={c._id} complaint={c} />)}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={pagination.page <= 1}
                onClick={() => loadComplaints(pagination.page - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-btn ${p === pagination.page ? 'active' : ''}`}
                  onClick={() => loadComplaints(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadComplaints(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Complaints;
