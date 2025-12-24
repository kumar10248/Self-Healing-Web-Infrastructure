/**
 * Feature 6 (Part-B): Main App Component
 * 
 * Navigation and routing for the dashboard
 */

import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import HistoryPage from './pages/HistoryPage'; // Phase 4: Historical metrics
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'alerts':
        return <Alerts />;
      case 'history':
        return <HistoryPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">🔧</span>
          <span className="brand-text">
            <span className="brand-white">Self-Healing</span>
            {' '}
            <span className="brand-black">Infra</span>
          </span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-link ${currentPage === 'history' ? 'active' : ''}`}
            onClick={() => setCurrentPage('history')}
          >
            📈 History
          </button>
          <button
            className={`nav-link ${currentPage === 'alerts' ? 'active' : ''}`}
            onClick={() => setCurrentPage('alerts')}
          >
            🚨 Alerts
          </button>
        </div>
      </nav>
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
