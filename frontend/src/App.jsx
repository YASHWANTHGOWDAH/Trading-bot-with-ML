import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import AIAnalyst from './pages/AIAnalyst';
import PaperTrading from './pages/PaperTrading';
import Portfolio from './pages/Portfolio';
import BacktestLab from './pages/BacktestLab';
import Watchlist from './pages/Watchlist';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatbotWidget from './components/ChatbotWidget';
import { authService, portfolioService } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [portfolio, setPortfolio] = useState(null);

  // Sync user portfolio
  const refreshPortfolio = async () => {
    const email = user?.email || 'demo@trademind.ai';
    try {
      const res = await portfolioService.getSummary(email);
      setPortfolio(res.data);
    } catch (err) {
      console.warn('Could not fetch initial portfolio, using default values.');
    }
  };

  useEffect(() => {
    refreshPortfolio();
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    refreshPortfolio();
  };

  const handleLogout = () => {
    setUser(null);
    setPortfolio(null);
  };

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
        <Navbar user={user} portfolio={portfolio} onLogout={handleLogout} />

        <main style={{ flex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  user={user}
                  portfolio={portfolio}
                  onTradeComplete={refreshPortfolio}
                />
              }
            />
            <Route path="/markets" element={<Markets user={user} />} />
            <Route path="/ai-analyst" element={<AIAnalyst user={user} />} />
            <Route
              path="/paper-trading"
              element={
                <PaperTrading
                  user={user}
                  portfolio={portfolio}
                  onTradeComplete={refreshPortfolio}
                />
              }
            />
            <Route
              path="/portfolio"
              element={
                <Portfolio
                  user={user}
                  portfolio={portfolio}
                  onPortfolioUpdate={refreshPortfolio}
                />
              }
            />
            <Route path="/backtest" element={<BacktestLab user={user} />} />
            <Route path="/watchlist" element={<Watchlist user={user} />} />
            <Route path="/alerts" element={<Alerts user={user} />} />
            <Route
              path="/settings"
              element={
                <Settings
                  user={user}
                  portfolio={portfolio}
                  onPortfolioUpdate={refreshPortfolio}
                />
              }
            />
            <Route
              path="/login"
              element={<Login onLoginSuccess={handleLoginSuccess} />}
            />
            <Route
              path="/register"
              element={<Register onLoginSuccess={handleLoginSuccess} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <p>
            TradeMind AI — Explainable Machine Learning-Based Real-Time Market Analytics & Paper Trading Platform.
          </p>
          <p style={{ marginTop: '4px', fontSize: '11px' }}>
            Final Year Engineering Major Project • Powered by FastAPI, MongoDB, Scikit-learn, and React.js
          </p>
        </footer>

        {/* Global Trained AI Copilot Chatbot */}
        <ChatbotWidget user={user} />
      </div>
    </BrowserRouter>
  );
}
