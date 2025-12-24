/**
 * Feature 6 (Part-B): Metric Card Component
 * 
 * Displays a single metric (CPU, Memory, Disk) with color coding
 */

import React from 'react';
import './MetricCard.css';

const MetricCard = ({ label, value, unit = '%', icon }) => {
  // Determine color based on value
  const getColorClass = () => {
    if (value < 70) return 'metric-good';
    if (value < 85) return 'metric-warning';
    return 'metric-critical';
  };

  // Get status text
  const getStatus = () => {
    if (value < 70) return 'Good';
    if (value < 85) return 'Warning';
    return 'Critical';
  };

  return (
    <div className={`metric-card ${getColorClass()}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <div className="metric-label">{label}</div>
        <div className="metric-value">
          {value !== null && value !== undefined ? `${value}${unit}` : 'N/A'}
        </div>
        <div className="metric-status">{getStatus()}</div>
      </div>
    </div>
  );
};

export default MetricCard;
