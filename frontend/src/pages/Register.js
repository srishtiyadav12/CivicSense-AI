import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/shared/Alert';
import AuthBrand from '../components/layout/AuthBrand';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    ward: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...userData } = form;
      await register(userData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <AuthBrand />
      <div className="auth-panel">
        <div className="auth-card" style={{ maxWidth: 500 }}>
          <div className="auth-logo">
            <span className="logo-mark">CS</span>
          </div>
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Join CivicSense as a citizen reporter</p>

          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name <span className="req">*</span></label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email address <span className="req">*</span></label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="flex-gap">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Password <span className="req">*</span></label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Confirm <span className="req">*</span></label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex-gap">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Optional"
                />
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

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;