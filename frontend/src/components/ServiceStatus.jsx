/**
 * Feature 6 (Part-B): Service Status Component
 * 
 * Displays service status with visual indicators
 */

import React from 'react';
import './ServiceStatus.css';

const ServiceStatus = ({ services }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'inactive':
        return '🔴';
      case 'failed':
        return '💥';
      default:
        return '⚪';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Running';
      case 'inactive':
        return 'Stopped';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-unknown';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!services || services.length === 0) {
    return (
      <div className="service-status-empty">
        <p>No services being monitored</p>
      </div>
    );
  }

  return (
    <div className="service-status-container">
      <table className="service-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Status</th>
            <th>Last Checked</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service, index) => (
            <tr key={index}>
              <td className="service-name">
                <span className="service-icon">{getStatusIcon(service.status)}</span>
                {service.service}
              </td>
              <td>
                <span className={`status-badge ${getStatusClass(service.status)}`}>
                  {getStatusText(service.status)}
                </span>
              </td>
              <td className="service-timestamp">
                {formatTimestamp(service.lastChecked)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServiceStatus;
