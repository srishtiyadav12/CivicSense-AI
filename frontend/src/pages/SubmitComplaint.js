import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintApi } from '../api/client';
import Alert from '../components/shared/Alert';
import LocationPicker from '../components/maps/LocationPicker';
import { generateComplaintDescription } from '../services/aiDescriptionWriter';

// Predefined locations for demo (would use geolocation in production)
const COMMON_AREAS = [
  'Main Road', 'Market Street', 'Residential Colony', 'City Center',
  'Near School', 'Industrial Area', 'Public Park', 'Bridge Road'
];

const COMPLAINT_TYPES = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'garbage', label: 'Garbage', icon: '🗑️' },
  { value: 'broken_streetlight', label: 'Streetlight', icon: '💡' },
  { value: 'water_leakage', label: 'Water Leak', icon: '💧' },
  { value: 'drainage', label: 'Drainage', icon: '🚰' },
  { value: 'damaged_infrastructure', label: 'Infrastructure', icon: '🏗️' },
  { value: 'road_damage', label: 'Road Damage', icon: '🛣️' },
  { value: 'stray_animals', label: 'Stray Animals', icon: '🐕' },
  { value: 'electricity', label: 'Electricity', icon: '⚡' },
  { value: 'other', label: 'Other', icon: '📋' }
];

const MAX_FILES = 5;
const MAX_SIZE_MB = 5;

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    area: '',
    ward: '',
    type: 'other'
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [coords, setCoords] = useState([28.7041, 77.1025]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // AI Generate Description
  const handleAIGenerate = () => {
    if (!form.type || form.type === 'other') {
      setError('Please select a complaint type first to use AI generation');
      return;
    }

    const generated = generateComplaintDescription(form.type);
    setForm({
      ...form,
      title: generated.title,
      description: generated.description
    });
    setError('');

    // Show success message
    setTimeout(() => {
      setError('');
    }, 3000);
  };

  const addFiles = (newFiles) => {
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      setError(`You can upload up to ${MAX_FILES} images`);
      return;
    }

    const accepted = [];
    for (let i = 0; i < Math.min(newFiles.length, remaining); i++) {
      const f = newFiles[i];
      if (!f.type.startsWith('image/')) {
        setError('Only image files are allowed (jpg, png, gif, webp)');
        continue;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`"${f.name}" exceeds the ${MAX_SIZE_MB} MB limit`);
        continue;
      }
      accepted.push(f);
    }

    if (accepted.length === 0) return;

    setError('');
    const updatedFiles = [...files, ...accepted].slice(0, MAX_FILES);
    setFiles(updatedFiles);

    // Generate previews for new files
    accepted.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, { name: f.name, url: e.target.result }]);
      };
      reader.readAsDataURL(f);
    });
  };

  const handleFileInput = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.description) {
      setError('Title and description are required');
      return;
    }
    if (!form.area) {
      setError('Please select an area');
      return;
    }

    setLoading(true);
    try {
      const location = {
        address: form.area,
        ward: form.ward || 'General',
        coordinates: [coords[1], coords[0]]
      };

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('location', JSON.stringify(location));
      files.forEach(f => formData.append('images', f));

      const res = await complaintApi.create(formData);
      navigate(`/complaints/${res.data.complaint._id || res.data.complaint.id}`, { state: { justCreated: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Report a Civic Issue</h2>
      <p style={{ color: '#64748b', marginBottom: 20 }}>
        Select the issue type and let AI write the description for you, or write your own.
      </p>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          {/* Complaint Type Selection */}
          <div className="form-group">
            <label className="form-label">Select Issue Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {COMPLAINT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: type.value })}
                  style={{
                    padding: '12px',
                    border: form.type === type.value ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    background: form.type === type.value ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{type.icon}</div>
                  <div style={{ fontSize: '0.85rem', color: form.type === type.value ? '#3b82f6' : '#64748b', fontWeight: form.type === type.value ? '600' : '400' }}>
                    {type.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Generate Button */}
          <div className="form-group">
            <button
              type="button"
              onClick={handleAIGenerate}
              className="btn"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>✨</span> Ask AI to Write Description
            </button>
            <div className="form-hint" style={{ marginTop: 8, textAlign: 'center' }}>
              Select an issue type above, then click to auto-generate title and description
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Large pothole on Main Road"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the problem in detail. Or use AI to generate this for you!"
              maxLength={2000}
              rows={6}
            />
            <div className="form-hint text-right">{form.description.length}/2000</div>
          </div>

          <div className="flex-gap">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Area / Location *</label>
              <select name="area" className="form-select" value={form.area} onChange={handleChange}>
                <option value="">Select area</option>
                {COMMON_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Ward</label>
              <input
                type="text"
                name="ward"
                className="form-input"
                value={form.ward}
                onChange={handleChange}
                placeholder="e.g. Ward 3"
              />
            </div>
          </div>

          {/* Map Location Section */}
          <div className="form-group">
            <label className="form-label">Choose Location on Map</label>
            <LocationPicker position={coords} onChange={setCoords} />
            <div className="form-hint" style={{ marginTop: 8 }}>
              Click anywhere on the map to drop the pin. Selected: {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="form-group">
            <label className="form-label">📸 Upload Photos (Optional)</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#3b82f6' : '#cbd5e1'}`,
                borderRadius: 'var(--radius)',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? '#eff6ff' : '#f8fafc',
                transition: 'all 0.2s',
                marginBottom: files.length > 0 ? 12 : 0
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                <strong style={{ color: '#3b82f6' }}>Click to upload</strong> or drag and drop
              </p>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                JPG, PNG, GIF or WebP — max {MAX_SIZE_MB} MB each, up to {MAX_FILES} images
              </p>
            </div>

            {/* Preview thumbnails */}
            {previews.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {previews.map((p, i) => (
                  <div key={i} style={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)'
                  }}>
                    <img
                      src={p.url}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        lineHeight: '20px',
                        textAlign: 'center',
                        padding: 0
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length > 0 && (
              <div className="form-hint" style={{ marginTop: 4 }}>
                {files.length} of {MAX_FILES} images selected
              </div>
            )}
          </div>

          <div className="flex-gap mt-3">
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmitComplaint;