import React from 'react';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/helpers';

const PriorityBadge = ({ priority }) => {
  const p = Number(priority) || 0;
  const label = PRIORITY_LABELS[p] || 'Medium';
  const color = PRIORITY_COLORS[p] || '#ca8a04';

  return (
    <span className={`badge badge-priority-${p}`}>
      <span className="priority-dot" style={{ background: color }}></span>
      {label}
    </span>
  );
};

export default PriorityBadge;
