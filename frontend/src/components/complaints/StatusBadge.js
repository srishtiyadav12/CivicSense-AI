import React from 'react';
import { STATUS_LABELS } from '../../utils/helpers';

const StatusBadge = ({ status }) => {
  const label = STATUS_LABELS[status] || status || 'Unknown';
  return (
    <span className={`badge badge-${status || 'submitted'}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
