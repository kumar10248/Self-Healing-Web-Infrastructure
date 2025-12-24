/**
 * Phase 4: LineChart Component
 * Simple canvas-based line chart for historical metrics
 * No external dependencies - pure React + Canvas API
 */

import { useEffect, useRef } from 'react';
import './LineChart.css';

export default function LineChart({ data, title, color = '#3b82f6', threshold }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart dimensions
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min/max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1; // Avoid division by zero

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid lines (horizontal)
    ctx.strokeStyle = '#f3f4f6';
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (range / 5) * i;
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(1) + '%', padding - 10, y);
    }

    // Draw threshold line if provided
    if (threshold !== undefined) {
      const thresholdY = height - padding - ((threshold - minValue) / range) * chartHeight;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding, thresholdY);
      ctx.lineTo(width - padding, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw line chart
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = height - padding - ((point.value - minValue) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = height - padding - ((point.value - minValue) / range) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw time labels (show first, middle, last)
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (data.length > 0) {
      // First timestamp
      const firstTime = new Date(data[0].timestamp).toLocaleTimeString();
      ctx.fillText(firstTime, padding, height - padding + 10);

      // Last timestamp
      const lastTime = new Date(data[data.length - 1].timestamp).toLocaleTimeString();
      ctx.fillText(lastTime, width - padding, height - padding + 10);

      // Middle timestamp
      const middleIdx = Math.floor(data.length / 2);
      const middleTime = new Date(data[middleIdx].timestamp).toLocaleTimeString();
      const middleX = padding + (chartWidth / (data.length - 1)) * middleIdx;
      ctx.fillText(middleTime, middleX, height - padding + 10);
    }

  }, [data, color, threshold]);

  // Show message if no data
  if (!data || data.length === 0) {
    return (
      <div className="line-chart">
        <h3>{title}</h3>
        <div className="no-data">
          <p>No historical data available</p>
          <p className="hint">Data will appear after agent sends metrics</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const values = data.map(d => d.value);
  const min = Math.min(...values).toFixed(2);
  const max = Math.max(...values).toFixed(2);
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  const current = values[values.length - 1].toFixed(2);

  return (
    <div className="line-chart">
      <div className="chart-header">
        <h3>{title}</h3>
        <div className="chart-stats">
          <span className="stat">Current: <strong>{current}%</strong></span>
          <span className="stat">Avg: <strong>{avg}%</strong></span>
          <span className="stat">Min: <strong>{min}%</strong></span>
          <span className="stat">Max: <strong>{max}%</strong></span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="chart-canvas"
      />
      <div className="chart-footer">
        <p className="data-info">{data.length} data points • Last 8 hours</p>
      </div>
    </div>
  );
}
