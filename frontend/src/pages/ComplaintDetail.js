import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { complaintApi, userApi, getApiBase } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/shared/Loading';
import Alert from '../components/shared/Alert';
import StatusBadge from '../components/complaints/StatusBadge';
import PriorityBadge from '../components/complaints/PriorityBadge';
import { typeLabel, formatDate, capitalize } from '../utils/helpers';

const API_BASE = getApiBase();

const ComplaintDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Citizen review state
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoverValue, setHoverValue] = useState(0);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reopenBusy, setReopenBusy] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [notice, setNotice] = useState('');

  const justCreated = location.state?.justCreated;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await complaintApi.getById(id);
        setComplaint(res.data.complaint);
        if (user?.role === 'official' || user?.role === 'admin') {
          try {
            const off = await userApi.getOfficials();
            setOfficials(off.data.officials);
          } catch (e) { /* officials load optional */ }
        }
      } catch (err) {
        setError('Complaint not found');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setUpdating(true);
    setError('');
    try {
      const res = await complaintApi.updateStatus(id, { status: newStatus, note: statusNote });
      setComplaint(res.data.complaint);
      setStatusNote('');
      setNewStatus('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // Citizen rating handler
  const handleRate = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setReviewBusy(true);
    setNotice('');
    try {
      await complaintApi.rate(id, { rating, feedback: feedback.trim() });
      setNotice({ type: 'success', message: 'Thank you for your review!' });
      const res = await complaintApi.getById(id);
      setComplaint(res.data.complaint);
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.message || 'Failed to submit rating' });
    } finally {
      setReviewBusy(false);
    }
  };

  // Citizen reopen handler
  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      setNotice({ type: 'error', message: 'Please provide a reason for reopening' });
      return;
    }
    setReopenBusy(true);
    setNotice('');
    try {
      await complaintApi.reopen(id, { reason: reopenReason.trim() });
      setNotice({ type: 'success', message: 'Complaint reopened and sent back for review.' });
      const res = await complaintApi.getById(id);
      setComplaint(res.data.complaint);
      setReopenReason('');
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.message || 'Failed to reopen complaint' });
    } finally {
      setReopenBusy(false);
    }
  };

  const canManage = user?.role === 'official' || user?.role === 'admin' || user?.role === 'super_admin';

  if (loading) return <Loading message="Loading complaint..." />;
  if (error || !complaint) return <Alert type="error">{error || 'Complaint not found'}</Alert>;

  // The reporting citizen can rate/reopen a resolved complaint. Compare ids
  // whether the backend returns the reporter as { id } or { _id }.
  const ownerId = complaint.reportedBy?._id ?? complaint.reportedBy?.id;
  const signedInId = user?._id ?? user?.id;
  const isOwner = ownerId != null && signedInId != null && Number(ownerId) === Number(signedInId);

  return (
    <div>
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link to="/complaints" className="btn btn-outline btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back
        </Link>
        </div>
        {(canManage || isOwner) && (
          <div className="flex-gap">
          </div>
        )}
      </div>

      {justCreated && (
        <Alert type="success">
          Complaint submitted successfully! It has been analyzed and routed to <strong>{complaint.department}</strong>.
        </Alert>
      )}

      <div className="detail-grid">
        <div>
          <div className="card">
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>{complaint.title}</h2>
                <div className="flex-gap flex-wrap">
                  <StatusBadge status={complaint.status} />
                  <PriorityBadge priority={complaint.priority} />
                  <span className="badge badge-status">{typeLabel(complaint.type)}</span>
                </div>
              </div>
            </div>

            <p className="mt-3" style={{ color: '#334155', fontSize: '1.02rem', lineHeight: 1.7 }}>
              {complaint.description}
            </p>

            {complaint.images?.length > 0 && (
              <div className="flex-gap mt-3 flex-wrap">
                {complaint.images.map((img, i) => {
                  let src = typeof img === 'string' ? img : img.url || '';
                  // Prefix relative upload paths with the backend origin (frontend & backend run on different ports)
                  if (src.startsWith('/uploads/')) src = API_BASE + src;
                  return (
                    <img key={i} src={src} alt={`Complaint ${i + 1}`} style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8 }} />
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Analysis card */}
          {complaint.aiAnalysis && (
            <div className="card">
              <h3 className="card-title mb-3">AI Analysis</h3>
              <div className="info-row">
                <span className="info-label">Classification</span>
                <span className="info-value" style={{ textTransform: 'capitalize' }}>{complaint.aiAnalysis.classification || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Confidence</span>
                <span className="info-value">{Math.round((complaint.aiAnalysis.confidence || 0) * 100)}%</span>
              </div>
              <div className="info-row">
                <span className="info-label">Sentiment</span>
                <span className="info-value" style={{ textTransform: 'capitalize' }}>
                  {complaint.aiAnalysis.sentimentLabel || '—'} ({complaint.aiAnalysis.sentimentScore || 0})
                </span>
              </div>
              {complaint.aiAnalysis.keywords?.length > 0 && (
                <div className="mt-2">
                  <span className="info-label">Keywords: </span>
                  {complaint.aiAnalysis.keywords.map((kw, i) => (
                    <span key={i} className="badge badge-status" style={{ margin: '0 4px 4px 0' }}>{kw}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status Timeline */}
          <div className="card">
            <h3 className="card-title mb-3">Status History</h3>
            <div className="timeline">
              {complaint.statusHistory?.slice().reverse().map((entry, i) => (
                <div className="timeline-item" key={i}>
                  <div className="tl-title">{entry.status?.replace('_', ' ')}</div>
                  {entry.note && <div className="tl-note">{entry.note}</div>}
                  <div className="tl-date">
                    {formatDate(entry.timestamp)}
                    {entry.updatedBy?.name ? ` · by ${entry.updatedBy.name}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card">
            <h3 className="card-title mb-3">Details</h3>
            <div className="info-row">
              <span className="info-label">Complaint ID</span>
              <span className="info-value" style={{ fontSize: '0.8rem' }}>#{String(complaint._id ?? '').slice(-8) || complaint.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Reported By</span>
              <span className="info-value">{complaint.reportedBy?.name || 'Citizen'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Department</span>
              <span className="info-value">{complaint.department}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Location</span>
              <span className="info-value">{complaint.location?.address || complaint.location?.ward || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Reported On</span>
              <span className="info-value">{formatDate(complaint.createdAt)}</span>
            </div>
          </div>

          {complaint.duplicateOf && (
            <div className="alert alert-warning">
              This complaint was marked as a duplicate of{' '}
              <Link to={`/complaints/${complaint.duplicateOf}`}>another complaint</Link>.
            </div>
          )}

          {complaint.clusterId && (
            <div className="alert alert-info" style={{ borderLeftColor: '#7c3aed' }}>
              {Number(complaint.clusterId) === Number(complaint._id)
                ? 'ℹ️ This is the <strong>main report</strong> for a cluster of similar complaints about this issue.'
                : `ℹ️ This complaint was <strong>auto-grouped</strong> with other similar complaints nearby.`}
              {' '}<Link to={`/clusters/${complaint.clusterId}`}>View cluster →</Link>
            </div>
          )}

          {complaint.similarComplaints?.length > 0 && (
            <div className="card">
              <h3 className="card-title mb-3">Similar Complaints</h3>
              {complaint.similarComplaints.map((sim, i) => (
                <div key={i} className="info-row">
                  <Link to={`/complaints/${sim.complaint?._id || sim.complaint}`} className="info-label">
                    Similar complaint
                  </Link>
                  <span className="info-value">{Math.round((sim.similarityScore || 0) * 100)}% match</span>
                </div>
              ))}
            </div>
          )}

          {/* Status Update Form for Officials */}
          {canManage && complaint.status !== 'resolved' && (
            <div className="card">
              <h3 className="card-title mb-3">Update Status</h3>
              <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                  <label className="form-label">New Status</label>
                  <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="">Select status</option>
                    <option value="under_review">Under Review</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 80 }}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Add resolution notes or comments"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={updating || !newStatus}>
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </form>
            </div>
          )}

          {canManage && complaint.status === 'resolved' && complaint.resolutionProof && (
            <div className="alert alert-success">
              Resolved on {formatDate(complaint.resolutionProof.resolvedAt)}. {complaint.resolutionProof.notes}
            </div>
          )}

          {/* Citizen review panel — only the resolver's reporting citizen can rate/reopen */}
          {isOwner && complaint.status === 'resolved' && (
            <div className="card">
              <h3 className="card-title mb-3">How was your experience?</h3>

              {notice && (
                <Alert type={notice.type}>{notice.message}</Alert>
              )}

              {complaint.satisfactionRating ? (
                <div className="already-reviewed">
                  <div className="star-row read-only">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <span key={v} className="star" data-active={v <= complaint.satisfactionRating}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="mt-2" style={{ color: '#475569', fontSize: '0.92rem' }}>
                    You rated this <strong>{complaint.satisfactionRating}/5</strong>.
                    {complaint.feedback && <span style={{ color: '#0f172a' }}> "{complaint.feedback}"</span>}
                  </p>
                  <p className="mt-2" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Still not satisfied? Reopen it below.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRate}>
                  <div className="form-group">
                    <label className="form-label">Your rating</label>
                    <div className="star-row" onMouseLeave={() => setHoverValue(0)}>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          type="button"
                          key={v}
                          className="star btn-star"
                          data-active={v <= (hoverValue || rating)}
                          onMouseEnter={() => setHoverValue(v)}
                          onClick={() => setRating(v)}
                          aria-label={`${v} star${v > 1 ? 's' : ''}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Feedback (optional)</label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: 70 }}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Tell the department how they did"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={reviewBusy || !rating}>
                    {reviewBusy ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Reopen */}
              <div className="divider mt-3" />
              <form onSubmit={handleReopen}>
                <div className="form-group mt-3">
                  <label className="form-label">Issue not fixed? Reopen it</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 60 }}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="What is still not resolved?"
                  />
                </div>
                <button type="submit" className="btn btn-outline btn-sm" style={{ width: '100%', color: '#f43f5e', borderColor: '#fecdd3' }} disabled={reopenBusy}>
                  {reopenBusy ? 'Reopening...' : 'Reopen Complaint'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;