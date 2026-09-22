import React from 'react';

// Ink brand panel shown on the auth screens (hidden on small screens).
const AuthBrand = () => (
  <div className="auth-brand">
    <div className="auth-brand-inner">
      <div className="auth-brand-logo">
        <span className="public-logo">CS</span>
        <span>CivicSense AI</span>
      </div>
      <h2>
        A city that listens<br />
        <em>and responds.</em>
      </h2>
      <p>The civic platform connecting residents with the departments that keep the city running.</p>
      <div className="auth-brand-verify">
        <div className="auth-verify-item"><span className="n">Real-time</span>status tracking</div>
        <div className="auth-verify-item"><span className="n">AI</span>classification & routing</div>
        <div className="auth-verify-item"><span className="n">Open</span>public analytics</div>
      </div>
    </div>
  </div>
);

export default AuthBrand;