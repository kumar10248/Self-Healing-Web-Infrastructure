/**
 * Feature 6 (Part-B): Alerts Page
 * 
 * Displays all system alerts with filtering
 */

import React, { useState, useEffect } from 'react';
import { getAlerts } from '../services/api';
import './Alerts.css';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch alerts
  const fetchAlerts = async () => {
    const data = await getAlerts(50);
    setAlerts(data);
    setFilteredAlerts(data);
    setLastUpdate(new Date());
  };

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, []);

  // Polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter alerts
  useEffect(() => {
    if (filterType === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(alert => alert.type === filterType));
    }
  }, [filterType, alerts]);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '🔴';
      case 'HIGH':
        return '🟠';
      case 'MEDIUM':
        return '🟡';
      case 'LOW':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getSeverityClass = (severity) => {
    return `severity-${severity.toLowerCase()}`;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SERVICE_DOWN':
        return '❌';
      case 'SERVICE_RECOVERED':
        return '✅';
      case 'RESOURCE_HIGH':
        return '⚠️';
      case 'HEALING_TRIGGERED':
        return '🔧';
      case 'HEALING_SUCCESS':
        return '🎯';
      case 'HEALING_FAILED':
        return '💥';
      default:
        return '📋';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // All possible alert types (static list + dynamic from alerts)
  const allAlertTypes = [
    'SERVICE_DOWN',
    'SERVICE_RECOVERED',
    'RESOURCE_HIGH',
    'HEALING_TRIGGERED',
    'HEALING_SUCCESS',
    'HEALING_FAILED',
    'MAX_RETRIES_EXCEEDED',
  ];
  
  const uniqueTypes = ['all', ...new Set([...allAlertTypes, ...alerts.map(alert => alert.type)])];

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <div>
          <h1>🚨 System Alerts</h1>
          <p className="alerts-subtitle">
            {filteredAlerts.length} alerts • Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <label>Filter by type:</label>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          {uniqueTypes.map(type => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Alerts' : type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Alerts List */}
      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="empty-alerts">
            <p>No alerts found</p>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => (
            <div key={index} className={`alert-card ${getSeverityClass(alert.severity)}`}>
              <div className="alert-icons">
                <span className="type-icon">{getTypeIcon(alert.type)}</span>
                <span className="severity-icon">{getSeverityIcon(alert.severity)}</span>
              </div>
              <div className="alert-content">
                <div className="alert-header-row">
                  <span className="alert-type">{alert.type.replace(/_/g, ' ')}</span>
                  <span className={`alert-severity ${getSeverityClass(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="alert-message">{alert.message}</p>
                <div className="alert-meta">
                  <span>🖥️ {alert.host || 'Unknown Host'}</span>
                  {alert.service && <span>🔧 {alert.service}</span>}
                  {alert.resource && <span>📊 {alert.resource}</span>}
                  <span>🕒 {formatTimestamp(alert.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
