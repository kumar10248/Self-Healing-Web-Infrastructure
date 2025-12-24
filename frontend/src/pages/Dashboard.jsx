/**
 * Feature 6 (Part-B): Dashboard Page
 * 
 * Main dashboard showing metrics, services, and healing history
 */

import React, { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import ServiceStatus from '../components/ServiceStatus';
import { getLatestMetrics, getServiceStatus, getHealingHistory } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [services, setServices] = useState([]);
  const [healingHistory, setHealingHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      const [metricsData, servicesData, healingData] = await Promise.all([
        getLatestMetrics(),
        getServiceStatus(),
        getHealingHistory(10)
      ]);

      setMetrics(metricsData);
      setServices(servicesData);
      setHealingHistory(healingData);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getActionIcon = (action) => {
    if (action.includes('restart')) return '🔄';
    if (action.includes('kill')) return '⚡';
    if (action.includes('cleanup') || action.includes('clear')) return '🧹';
    return '🔧';
  };

  const getResultBadge = (result) => {
    if (result === 'success') {
      return <span className="badge badge-success">✓ Success</span>;
    }
    return <span className="badge badge-failure">✗ Failed</span>;
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>🖥️ Self-Healing Infrastructure Dashboard</h1>
          <p className="dashboard-subtitle">
            {metrics?.host || 'Unknown Host'} • Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="section">
        <h2 className="section-title">System Metrics</h2>
        <div className="metrics-grid">
          <MetricCard
            label="CPU Usage"
            value={metrics?.cpu}
            unit="%"
            icon="⚙️"
          />
          <MetricCard
            label="Memory Usage"
            value={metrics?.memory}
            unit="%"
            icon="💾"
          />
          <MetricCard
            label="Disk Usage"
            value={metrics?.disk}
            unit="%"
            icon="💿"
          />
        </div>
      </div>

      {/* Services Section */}
      <div className="section">
        <h2 className="section-title">Service Status</h2>
        <ServiceStatus services={services} />
      </div>

      {/* Healing History Section */}
      <div className="section">
        <h2 className="section-title">Recent Healing Actions</h2>
        <div className="healing-history">
          {healingHistory.length === 0 ? (
            <div className="empty-state">
              <p>No healing actions yet</p>
            </div>
          ) : (
            <table className="healing-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Result</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {healingHistory.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <span className="action-icon">{getActionIcon(item.action)}</span>
                      {item.action}
                    </td>
                    <td className="target-cell">{item.target}</td>
                    <td>{getResultBadge(item.result)}</td>
                    <td className="timestamp-cell">{formatTimestamp(item.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
