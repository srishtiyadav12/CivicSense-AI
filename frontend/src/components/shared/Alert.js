import React from 'react';

const Alert = ({ type = 'info', children }) => {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`}>
      {type === 'error' && <span>⚠️</span>}
      {type === 'success' && <span>✅</span>}
      {type === 'warning' && <span>⚠️</span>}
      {type === 'info' && <span>ℹ️</span>}
      <div>{children}</div>
    </div>
  );
};

export default Alert;
