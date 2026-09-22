import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { clusterApi } from '../api/client';
import Loading from '../components/shared/Loading';
import Alert from '../components/shared/Alert';
import StatusBadge from '../components/complaints/StatusBadge';
import PriorityBadge from '../components/complaints/PriorityBadge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { typeLabel, formatDate } from '../utils/helpers';

// Map icon used for each member complaint (pointing drop-pin)
const memberIcon = L.divIcon({
  className: '',
  html: '<div style="width:24px;height:24px;background:#2563eb;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});

const bracketIcon = L.divIcon({
  className: '',
  html: '<div style="width:30px;height:30px;background:#dc2626;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 0 3px rgba(220,38,38,0.35);"></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32]
});

// Centroid marker (small dashed ring)
const centroidIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border:3px dashed #7c3aed;border-radius:50%;background:rgba(124,58,237,0.15);"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14]
});

const ClusterDetail = () => {
  const { id } = useParams();
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await clusterApi.getById(id);
        setCluster(res.data.cluster);
      } catch (err) {
        setError('Cluster not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Loading message="Loading cluster..." />;
  if (error || !cluster) return <Alert type="error">{error || 'Cluster not found'}</Alert>;

  const root = cluster.root;
  const points = [
    { id: root.id, title: root.title, lat: root.location?.coordinates?.[1], lng: root.location?.coordinates?.[0], isRoot: true, status: root.status, priority: root.priority },
    ...cluster.members.map(m => ({
      id: m.id, title: m.title,
      lat: m.location?.coordinates?.[1], lng: m.location?.coordinates?.[0],
      isRoot: false, status: m.status, priority: m.priority
    }))
  ].filter(p => p.lat != null && p.lng != null);

  const mapCenter = (cluster.centroid && cluster.centroid.lat != null)
    ? [cluster.centroid.lat, cluster.centroid.lng]
    : [28.7041, 77.1025];
  const centroidPoint = (cluster.centroid && cluster.centroid.lat != null)
    ? [cluster.centroid.lat, cluster.centroid.lng]
    : null;

  return (
    <div>
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link to="/clusters" className="btn btn-outline btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            All Clusters
          </Link>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
          <strong>{cluster.memberCount}</strong> complaints grouped into 1 cluster
        </div>
      </div>

      {/* Cluster header metadata */}
      <div className="card">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>{root.title}</h2>
            <div className="flex-gap flex-wrap">
              <span className="badge badge-status">{typeLabel(root.type)}</span>
              <StatusBadge status={root.status} />
              <span className="badge" style={{ background: '#eef2ff', color: '#4338ca' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                {Math.round(cluster.centroid ? (cluster.memberCount > 1 ? 70 + Math.min(30, cluster.memberCount * 5) : 100) : 100)}% clustered
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3" style={{ color: '#334155', fontSize: '1.02rem', lineHeight: 1.7 }}>
          {root.description}
        </p>
        <div className="info-row mt-2">
          <span className="info-label">Department</span>
          <span className="info-value">{root.department}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Location</span>
          <span className="info-value">{root.location?.address || root.locAddress || '—'}</span>
        </div>
      </div>

      {/* Map of all member complaints */}
      <div className="card">
        <h3 className="card-title mb-3">Cluster Map ({points.length} locations)</h3>
        {points.length > 0 ? (
          <MapContainer center={mapCenter} zoom={14} style={{ height: 380, width: '100%', borderRadius: 12, zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {centroidPoint && <Marker position={centroidPoint} icon={centroidIcon}><Popup>Cluster center</Popup></Marker>}
            {points.map(p => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={p.isRoot ? bracketIcon : memberIcon}
              >
                <Popup>
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>{p.title}</strong><br />
                    {p.isRoot ? `#${root._id} · Main report` : <Link to={`/complaints/${p.id}`}>#{p._id} · View complaint</Link>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <Alert type="warning">No geolocated complaints in this cluster.</Alert>
        )}
      </div>

      {/* Member complaints list */}
      <div className="card">
        <div className="flex-between mb-3">
          <h3 className="card-title" style={{ margin: 0 }}>Member Complaints ({cluster.members.length})</h3>
          <Link to={`/complaints/${root.id}`} className="btn btn-outline btn-sm">View Main</Link>
        </div>

        {cluster.members.length === 0 ? (
          <p style={{ color: '#64748b' }}>This cluster currently has only the main report. Similar complaints added in the future will join it automatically.</p>
        ) : (
          <div className="timeline">
            {cluster.members.map(m => (
              <div className="timeline-item" key={m._id || m.id}>
                <Link to={`/complaints/${m._id || m.id}`} className="tl-title">
                  {m.title}
                </Link>
                <div className="flex-gap flex-wrap" style={{ margin: '4px 0' }}>
                  <StatusBadge status={m.status} />
                  <PriorityBadge priority={m.priority} />
                </div>
                <div className="tl-note">{m.description?.slice(0, 120)}{m.description?.length > 120 ? '…' : ''}</div>
                {m.location?.address && (
                  <div className="tl-note">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:4}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {m.location.address}
                  </div>
                )}
                <div className="tl-date">Reported {formatDate(m.createdAt)} · by {m.reportedBy?.name || 'Citizen'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClusterDetail;