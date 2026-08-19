'use client';

import { useState } from 'react';

export default function InteractiveDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'customers', label: 'Customers' },
    { id: 'campaigns', label: 'Campaigns' },
  ];

  const chartData = [35, 60, 45, 80, 55, 90, 75, 40, 85, 65, 95, 70];

  return (
    <section className="dashboard-preview-section">
      <div className="container">
        <div className="dashboard-widget">
          {/* Top Navbar inside Dashboard */}
          <div className="dashboard-widget__nav">
            <div className="dashboard-widget__logo">
              <span className="dashboard-widget__logo-icon">⬡</span>
              <span className="dashboard-widget__logo-text">TECHNEST UI</span>
            </div>
            
            <div className="dashboard-widget__tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`dashboard-widget__tab ${activeTab === tab.id ? 'dashboard-widget__tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="dashboard-widget__actions">
              <button className="btn btn--primary btn--small">Book a Demo</button>
            </div>
          </div>

          <div className="dashboard-widget__body">
            {/* Left Column: Stats & Toggles */}
            <div className="dashboard-widget__col-left">
              <h3 className="dashboard-widget__title">Dashboard</h3>
              
              <div className="dashboard-widget__stats-grid">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-card__label">Total Users</div>
                  <div className="dashboard-stat-card__value">72,250 <span className="dashboard-stat-card__trend dashboard-stat-card__trend--up">↗ 12.5%</span></div>
                </div>
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-card__label">Revenue</div>
                  <div className="dashboard-stat-card__value">$142.4k <span className="dashboard-stat-card__trend dashboard-stat-card__trend--up">↗ 8.4%</span></div>
                </div>
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-card__label">Conversion Rate</div>
                  <div className="dashboard-stat-card__value">3.2% <span className="dashboard-stat-card__trend dashboard-stat-card__trend--down">↘ 1.2%</span></div>
                </div>
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-card__label">Active Sessions</div>
                  <div className="dashboard-stat-card__value">12,912 <span className="dashboard-stat-card__trend dashboard-stat-card__trend--up">↗ 5.1%</span></div>
                </div>
              </div>

              <div className="dashboard-widget__import">
                <div className="dashboard-widget__import-header">
                  <h4>Import Data into Front Dashboard</h4>
                  <p>Sync and talk to your users and watch inventory.</p>
                </div>
                <div className="dashboard-widget__import-list">
                  <div className="dashboard-import-row">
                    <div className="dashboard-import-row__info">
                      <span className="dashboard-import-row__icon" style={{background: 'rgba(255,176,32,0.1)', color: '#FFB020'}}>✦</span>
                      <div>
                        <strong>Hive</strong>
                        <span>Users</span>
                      </div>
                    </div>
                    <button className="dashboard-import-row__btn">Launch importer</button>
                  </div>
                  <div className="dashboard-import-row">
                    <div className="dashboard-import-row__info">
                      <span className="dashboard-import-row__icon" style={{background: 'rgba(0,217,255,0.1)', color: '#00D9FF'}}>⚡</span>
                      <div>
                        <strong>Pulse</strong>
                        <span>Events</span>
                      </div>
                    </div>
                    <button className="dashboard-import-row__btn">Launch importer</button>
                  </div>
                  <div className="dashboard-import-row">
                    <div className="dashboard-import-row__info">
                      <span className="dashboard-import-row__icon" style={{background: 'rgba(0,208,132,0.1)', color: '#00D084'}}>⬢</span>
                      <div>
                        <strong>Nexus</strong>
                        <span>Products</span>
                      </div>
                    </div>
                    <button className="dashboard-import-row__btn">Launch importer</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Chart */}
            <div className="dashboard-widget__col-right">
              <div className="dashboard-chart-card">
                <div className="dashboard-chart-card__header">
                  <h4>Monthly Revenue</h4>
                  <select className="dashboard-chart-card__select">
                    <option>This year</option>
                    <option>Last year</option>
                  </select>
                </div>
                <div className="dashboard-chart-card__bars">
                  {chartData.map((val, idx) => (
                    <div key={idx} className="dashboard-chart-card__bar-wrap">
                      <div 
                        className="dashboard-chart-card__bar" 
                        style={{ height: `${val}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="dashboard-chart-card__x-axis">
                  <span>J</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span><span>J</span><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
