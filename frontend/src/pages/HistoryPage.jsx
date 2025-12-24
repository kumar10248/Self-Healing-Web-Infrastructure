/**
 * Phase 4: Historical Metrics Page
 * Visualizes 24-hour trends for operational insight (not prediction)
 */

import { useState, useEffect } from 'react';
import LineChart from '../components/LineChart';
import './HistoryPage.css';

export default function HistoryPage() {
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [policies, setPolicies] = useState(null);

  // Fetch historical metrics
  useEffect(() => {
    fetchHistoricalMetrics();
    fetchPolicies();

    // Refresh every 30 seconds
    const interval = setInterval(fetchHistoricalMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistoricalMetrics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/history/metrics?host=localhost&limit=2880');
      const data = await response.json();

      if (data.success) {
        setHistoricalData(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch historical metrics');
      }
    } catch (err) {
      setError('Failed to connect to backend: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/policies');
      const data = await response.json();
      if (data.success) {
        setPolicies(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    }
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading historical metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="error-box">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={fetchHistoricalMetrics} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <header className="page-header">
        <div>
          <h1>📊 Historical Metrics</h1>
          <p className="subtitle">24-hour operational insight (not prediction)</p>
        </div>
        <button onClick={fetchHistoricalMetrics} className="refresh-btn">
          🔄 Refresh
        </button>
      </header>

      <div className="info-banner">
        <p>
          <strong>Purpose:</strong> Historical metrics provide operational insight into system behavior over time.
          These charts help identify patterns, validate healing actions, and understand resource trends.
          <em> No ML. No forecasting. Just data.</em>
        </p>
      </div>

      <div className="charts-container">
        <LineChart
          data={historicalData?.cpu || []}
          title="🔥 CPU Usage Trend"
          color="#ef4444"
          threshold={policies?.resources?.cpu?.threshold}
        />

        <LineChart
          data={historicalData?.memory || []}
          title="💾 Memory Usage Trend"
          color="#8b5cf6"
          threshold={policies?.resources?.memory?.threshold}
        />

        <LineChart
          data={historicalData?.disk || []}
          title="💿 Disk Usage Trend"
          color="#10b981"
          threshold={policies?.resources?.disk?.threshold}
        />
      </div>

      <footer className="page-footer">
        <div className="footer-info">
          <div className="info-item">
            <strong>Data Points:</strong> {historicalData?.cpu?.length || 0}
          </div>
          <div className="info-item">
            <strong>Time Range:</strong> Last 8 hours
          </div>
          <div className="info-item">
            <strong>Interval:</strong> 10 seconds
          </div>
          <div className="info-item">
            <strong>Retention:</strong> 24 hours
          </div>
        </div>
        <p className="footer-note">
          Charts show threshold lines (red dashed) based on current policies.
          Data older than 24 hours is automatically cleaned up.
        </p>
      </footer>
    </div>
  );
}
