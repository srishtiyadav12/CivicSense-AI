import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { connectSocket } from '../../api/socket';

const toastStyle = (variant) => ({
  position: 'relative',
  minWidth: 260,
  maxWidth: 380,
  padding: '12px 16px',
  borderRadius: 10,
  boxShadow: '0 10px 30px rgba(15,23,42,0.18)',
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
  display: 'flex',
  flexDirection: 'column',
  gap: 3
});

const STATUS_COLORS = {
  submitted: '#5b67f5',
  under_review: '#14b8a6',
  assigned: '#8b5cf6',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  rejected: '#f43f5e'
};

const STATUS_COPY = {
  submitted: 'was just submitted',
  under_review: 'is now under review',
  assigned: 'has been assigned',
  in_progress: 'is now in progress',
  resolved: 'is now RESOLVED 🎉',
  rejected: 'was rejected'
};

/**
 * Mount once inside the authenticated layout. Connects the real-time socket and:
 *  - populates a live toast for a complaint status update (citizens + officials)
 *  - notifies officials/admins when a new complaint arrives in their department
 *  - calls onStatusUpdate (if provided) so a currently-open page can refresh in place
 */
const RealtimeToasts = ({ onStatusUpdate }) => {
  const [toasts, setToasts] = useState([]);
  const onRef = useRef(onStatusUpdate);
  onRef.current = onStatusUpdate;

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;

    const push = (toast) => {
      const id = Date.now() + Math.random();
      setToasts(t => [...t.slice(-4), { ...toast, id }]);
      setTimeout(() => dismiss(id), 6500);
    };

    const onStatus = (ev) => {
      push({
        variant: ev.status || 'assigned',
        title: `Complaint #${ev.complaintId} · ${ev.title || 'status update'}`,
        body: `Status ${STATUS_COPY[ev.status] || 'updated'}.${ev.note ? ` "${ev.note}"` : ''}`,
        link: ev.complaintId ? `/complaints/${ev.complaintId}` : null
      });
      if (onRef.current) onRef.current(ev);
    };

    const onNew = (ev) => {
      push({
        variant: ev.priority >= 4 ? 'rejected' : 'assigned',
        title: 'New complaint in your queue',
        body: `${ev.title} (${ev.department || 'no department'}) — priority P${ev.priority || 2}`,
        link: ev.complaintId ? `/complaints/${ev.complaintId}` : null
      });
    };

    socket.on('complaint:status', onStatus);
    socket.on('complaint:new', onNew);
    socket.on('connected', () => {});

    return () => {
      socket.off('complaint:status', onStatus);
      socket.off('complaint:new', onNew);
    };
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 18,
      right: 18,
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      {toasts.map(t => {
        const bg = STATUS_COLORS[t.variant] || STATUS_COLORS.assigned;
        return (
          <div key={t.id} role="status" style={{ ...toastStyle(t.variant), background: bg }}>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              style={{
                position: 'absolute', top: 6, right: 10, border: 'none', background: 'transparent',
                color: 'rgba(255,255,255,0.85)', fontSize: '1rem', cursor: 'pointer', lineHeight: 1
              }}
            >×</button>
            <b style={{ paddingRight: 18 }}>{t.title}</b>
            <span style={{ opacity: 0.92 }}>{t.body}</span>
            {t.link && <Link to={t.link} style={{ color: '#fff', textDecoration: 'underline', opacity: 0.95 }}>View details →</Link>}
          </div>
        );
      })}
    </div>
  );
};

export default RealtimeToasts;