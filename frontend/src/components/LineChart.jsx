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

    // Clear canvas with dark background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, 0, width, height);

    // Chart dimensions
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min/max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1; // Avoid division by zero

    // Draw grid lines (horizontal) with glow
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes with glow
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 2;

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

    // Draw Y-axis labels with enhanced visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (range / 5) * i;
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(1) + '%', padding - 15, y);
    }
    
    // Reset shadow for next drawings
    ctx.shadowBlur = 0;

    // Draw threshold line if provided with glow
    if (threshold !== undefined) {
      const thresholdY = height - padding - ((threshold - minValue) / range) * chartHeight;
      
      // Glow effect
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(padding, thresholdY);
      ctx.lineTo(width - padding, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    }

    // Draw gradient fill area under the line
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = height - padding - ((point.value - minValue) / range) * chartHeight;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line chart with glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
    ctx.shadowBlur = 0;

    // Draw points with glow and white center
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = height - padding - ((point.value - minValue) / range) * chartHeight;

      // Outer glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Inner white dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw time labels with enhanced visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Format timestamp to local time with better formatting
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      // Use local timezone format
      return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      });
    };

    if (data.length > 0) {
      // First timestamp
      const firstTime = formatTime(data[0].timestamp);
      ctx.fillText(firstTime, padding, height - padding + 15);

      // Last timestamp
      const lastTime = formatTime(data[data.length - 1].timestamp);
      ctx.fillText(lastTime, width - padding, height - padding + 15);

      // Middle timestamp
      if (data.length > 2) {
        const middleIdx = Math.floor(data.length / 2);
        const middleTime = formatTime(data[middleIdx].timestamp);
        const middleX = padding + (chartWidth / (data.length - 1)) * middleIdx;
        ctx.fillText(middleTime, middleX, height - padding + 15);
      }
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
        width={1000}
        height={350}
        className="chart-canvas"
      />
      <div className="chart-footer">
        <p className="data-info">{data.length} data points • Last 8 hours</p>
      </div>
    </div>
  );
}
