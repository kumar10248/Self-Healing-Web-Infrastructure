/**
 * Phase 4: Historical Metrics Controller
 * Provides 24-hour trend data for operational insight (not prediction)
 */

const dbService = require('../database/db.service');

/**
 * Get historical metrics for line charts
 * Returns last 24 hours of data points
 */
exports.getHistoricalMetrics = async (req, res, next) => {
  try {
    const { host = 'localhost' } = req.query;
    
    // Fetch last 24 hours of metrics (limit to reasonable number for charting)
    // At 10-second intervals, 24 hours = 8,640 data points
    // We'll limit to last 2,880 points (8 hours at 10s intervals) for performance
    const metrics = await dbService.getMetrics(host, 2880);
    
    if (!metrics || metrics.length === 0) {
      return res.json({
        success: true,
        data: {
          cpu: [],
          memory: [],
          disk: [],
        },
        message: 'No historical data available yet',
      });
    }
    
    // Reverse to get chronological order (oldest to newest)
    const chronological = metrics.reverse();
    
    // Transform data for line charts
    const cpu = chronological.map(m => ({
      timestamp: m.timestamp,
      value: parseFloat(m.cpu),
    }));
    
    const memory = chronological.map(m => ({
      timestamp: m.timestamp,
      value: parseFloat(m.memory),
    }));
    
    const disk = chronological.map(m => ({
      timestamp: m.timestamp,
      value: parseFloat(m.disk),
    }));
    
    res.json({
      success: true,
      data: {
        cpu,
        memory,
        disk,
      },
      meta: {
        host,
        dataPoints: metrics.length,
        timeRange: '8 hours',
        interval: '10 seconds',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get historical metrics for a specific resource (CPU/Memory/Disk)
 * Useful for focused charts
 */
exports.getResourceHistory = async (req, res, next) => {
  try {
    const { resource } = req.params; // cpu, memory, or disk
    const { host = 'localhost', limit = 2880 } = req.query;
    
    // Validate resource type
    const validResources = ['cpu', 'memory', 'disk'];
    if (!validResources.includes(resource.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid resource type. Must be one of: ${validResources.join(', ')}`,
      });
    }
    
    // Fetch metrics
    const metrics = await dbService.getMetrics(host, parseInt(limit));
    
    if (!metrics || metrics.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No historical data available yet',
      });
    }
    
    // Reverse to chronological order
    const chronological = metrics.reverse();
    
    // Extract specific resource data
    const resourceData = chronological.map(m => ({
      timestamp: m.timestamp,
      value: parseFloat(m[resource.toLowerCase()]),
    }));
    
    res.json({
      success: true,
      resource: resource.toLowerCase(),
      data: resourceData,
      meta: {
        host,
        dataPoints: resourceData.length,
        timeRange: '24 hours',
        interval: '10 seconds',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get metrics summary statistics
 * Useful for showing min/max/avg alongside charts
 */
exports.getMetricsSummary = async (req, res, next) => {
  try {
    const { host = 'localhost', limit = 2880 } = req.query;
    
    const metrics = await dbService.getMetrics(host, parseInt(limit));
    
    if (!metrics || metrics.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No data available for summary',
      });
    }
    
    // Calculate statistics
    const cpuValues = metrics.map(m => parseFloat(m.cpu));
    const memoryValues = metrics.map(m => parseFloat(m.memory));
    const diskValues = metrics.map(m => parseFloat(m.disk));
    
    const summary = {
      cpu: {
        min: Math.min(...cpuValues).toFixed(2),
        max: Math.max(...cpuValues).toFixed(2),
        avg: (cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length).toFixed(2),
        current: cpuValues[cpuValues.length - 1].toFixed(2),
      },
      memory: {
        min: Math.min(...memoryValues).toFixed(2),
        max: Math.max(...memoryValues).toFixed(2),
        avg: (memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length).toFixed(2),
        current: memoryValues[memoryValues.length - 1].toFixed(2),
      },
      disk: {
        min: Math.min(...diskValues).toFixed(2),
        max: Math.max(...diskValues).toFixed(2),
        avg: (diskValues.reduce((a, b) => a + b, 0) / diskValues.length).toFixed(2),
        current: diskValues[diskValues.length - 1].toFixed(2),
      },
      timeRange: {
        start: metrics[metrics.length - 1].timestamp,
        end: metrics[0].timestamp,
        dataPoints: metrics.length,
      },
    };
    
    res.json({
      success: true,
      data: summary,
      meta: {
        host,
        dataPoints: metrics.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
