/**
 * Feature 6 (Part-B): API Service
 * 
 * Handles all backend API calls for the dashboard
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch latest system metrics
 * GET /api/metrics/latest
 */
export const getLatestMetrics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/latest`);
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return null;
  }
};

/**
 * Fetch service status
 * GET /api/metrics/services
 */
export const getServiceStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/services`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

/**
 * Fetch alerts
 * GET /api/alerts
 */
export const getAlerts = async (limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts?limit=${limit}`);
    const data = await response.json();
    return data.success ? data.alerts : [];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};

/**
 * Fetch healing history
 * GET /api/heal/history
 */
export const getHealingHistory = async (limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/heal/history?limit=${limit}`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching healing history:', error);
    return [];
  }
};

/**
 * Fetch dashboard statistics
 * GET /api/dashboard/stats
 */
export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
};

/**
 * Fetch system health
 * GET /api/dashboard/health
 */
export const getSystemHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/health`);
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching system health:', error);
    return null;
  }
};
