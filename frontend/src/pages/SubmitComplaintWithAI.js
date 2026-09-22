import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintApi } from '../api/client';
import Alert from '../components/shared/Alert';
import LocationPicker from '../components/maps/LocationPicker';
import { analyzeImage, validateImageQuality } from '../services/imageAnalyzer';

// Predefined locations for demo (would use geolocation in production)
const COMMON_AREAS = [
  'Main Road', 'Market Street', 'Residential Colony', 'City Center',
  'Near School', 'Industrial Area', 'Public Park', 'Bridge Road'
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
    ward: ''
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [coords, setCoords] = useState([28.7041, 77.1025]);

  // AI Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showAiChoice, setShowAiChoice] = useState(false);
  const [authenticityCheck, setAuthenticityCheck] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // AI Image Analysis Function
  const analyzeUploadedImage = async (file) => {
    setAnalyzing(true);
    setError('');
    setAiSuggestion(null);
    setAuthenticityCheck(null);

    try {
      // First validate image quality
      const qualityCheck = await validateImageQuality(file);
      if (!qualityCheck.valid) {
        setError(qualityCheck.reason);
        setAnalyzing(false);
        return;
      }

      if (qualityCheck.warning) {
        setError(qualityCheck.warning);
      }

      // Run AI analysis
      const analysis = await analyzeImage(file);

      if (!analysis.success) {
        setError('AI analysis failed. You can still submit manually.');
        setAnalyzing(false);
        return;
      }

      setAuthenticityCheck({
        isAuthentic: analysis.isAuthentic,
        score: analysis.authenticityScore,
        detected: analysis.civicIssueDetected,
        summary: analysis.summary
      });

      if (analysis.civicIssueDetected && analysis.suggestedComplaint) {
        setAiSuggestion(analysis.suggestedComplaint);
        setShowAiChoice(true);
      } else {
        setError('⚠️ AI couldn\'t detect a clear civic issue in this image. Please verify this is a real problem or choose a clearer photo.');
      }

    } catch (err) {
      console.error('AI Analysis error:', err);
      setError('AI analysis unavailable. You can still submit the complaint manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const addFiles = async (newFiles) => {
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

    // Analyze the first uploaded image with AI
    if (accepted.length > 0 && files.length === 0) {
      await analyzeUploadedImage(accepted[0]);
    }
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
    setAiSuggestion(null);
    setShowAiChoice(false);
    setAuthenticityCheck(null);
  };

  // User chooses AI-generated complaint
  const useAiSuggestion = () => {
    if (aiSuggestion) {
      setForm({
        ...form,
        title: aiSuggestion.title,
        description: aiSuggestion.description
      });
      setShowAiChoice(false);
      setError('');
    }
  };

  // User chooses to write their own complaint
  const writeOwnComplaint = () => {
    setShowAiChoice(false);
    setError('');
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

    // Check authenticity if image was analyzed
    if (authenticityCheck && !authenticityCheck.isAuthentic && authenticityCheck.score < 30) {
      const confirm = window.confirm(
        'AI detected this might not be a genuine civic issue photo. Are you sure you want to submit this complaint?'
      );
      if (!confirm) return;
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
        Upload a photo and our AI will analyze it to verify the issue and help you write the complaint.
      </p>

      {error && <Alert type="error">{error}</Alert>}

      {/* AI Analysis Result */}
      {authenticityCheck && (
        <div className="card" style={{
          background: authenticityCheck.isAuthentic ? '#d1fae5' : '#fee2e2',
          border: `2px solid ${authenticityCheck.isAuthentic ? '#10b981' : '#ef4444'}`,
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '2rem' }}>
              {authenticityCheck.isAuthentic ? '✅' : '⚠️'}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, marginBottom: 4, color: authenticityCheck.isAuthentic ? '#065f46' : '#991b1b' }}>
                AI Authenticity Check: {authenticityCheck.score}%
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151' }}>
                {authenticityCheck.isAuthentic
                  ? `✓ Real civic issue detected! ${authenticityCheck.summary}`
                  : `✗ ${authenticityCheck.summary}. Please upload a clearer photo of the actual issue.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestion Choice */}
      {showAiChoice && aiSuggestion && (
        <div className="card" style={{ background: '#eff6ff', border: '2px solid #3b82f6', marginBottom: 16 }}>
          <h4 style={{ margin: 0, marginBottom: 8, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8 }}>
            🤖 AI Generated Complaint (Confidence: {aiSuggestion.confidence}%)
          </h4>
          <div style={{ background: 'white', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Title:</strong> {aiSuggestion.title}
            </div>
            <div>
              <strong>Description:</strong> {aiSuggestion.description}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={useAiSuggestion}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              ✨ Use AI Suggestion
            </button>
            <button
              type="button"
              onClick={writeOwnComplaint}
              className="btn"
              style={{ flex: 1, background: 'white', border: '2px solid #3b82f6', color: '#3b82f6' }}
            >
              ✍️ Write My Own
            </button>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="card" style={{ background: '#fef3c7', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></div>
            <span style={{ color: '#92400e' }}>🔍 AI is analyzing your image...</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          {/* Photo Upload Section - Moved to top for AI analysis first */}
          <div className="form-group">
            <label className="form-label">📸 Upload Photo (AI will analyze it)</label>
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
              placeholder="Describe the problem in detail. Include how long it's been happening and why it's a concern."
              maxLength={2000}
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
              <div className="form-hint">In production, location is captured via GPS</div>
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
              Click anywhere on the map to drop the pin at the exact spot. Selected: {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
            </div>
          </div>

          <div className="flex-gap mt-3">
            <button type="submit" className="btn btn-primary" disabled={loading || analyzing} style={{ flex: 1 }}>
              {loading ? 'Submitting...' : analyzing ? 'Analyzing...' : 'Submit Complaint'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmitComplaint;