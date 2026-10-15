import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Sliders,
  Database,
  RotateCcw,
  CheckCircle,
  Shield,
  Cpu,
} from 'lucide-react';
import { portfolioService } from '../services/api';

export default function Settings({ user, portfolio, onPortfolioUpdate }) {
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState(null);

  const email = user?.email || 'demo@trademind.ai';

  const handleResetPortfolio = async () => {
    if (!window.confirm('Reset virtual trading account to ₹1,00,000? All paper trade history will be wiped.')) {
      return;
    }
    setResetting(true);
    setMessage(null);
    try {
      const res = await portfolioService.resetPortfolio(email);
      setMessage({ type: 'success', text: res.data.message });
      if (onPortfolioUpdate) onPortfolioUpdate();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset portfolio.' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
          color: '#ffffff',
          padding: '8px',
          borderRadius: '10px'
        }}>
          <SettingsIcon size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            System Settings & Parameters
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Configure your virtual trading profile, view model hyper-parameters, and audit MongoDB connection health.
          </p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444'
        }}>
          {message.text}
        </div>
      )}

      {/* 1. User Profile Information */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} color="#38bdf8" />
          Trader Account Profile
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Account Name</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {user?.name || 'Academic Demo Trader'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Email Address</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
              {user?.email || 'demo@trademind.ai'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Current Virtual Capital</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              ₹{Number(portfolio?.cash ?? 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
          <button
            onClick={handleResetPortfolio}
            disabled={resetting}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#f87171' }}
          >
            <RotateCcw size={14} style={{ animation: resetting ? 'spinSlow 1s linear infinite' : 'none' }} />
            Reset Account Capital to ₹1,00,000
          </button>
        </div>
      </div>

      {/* 2. Machine Learning Configuration Audit */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="#a855f7" />
          Machine Learning Model Specifications
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Classifier</span>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              Random Forest Classifier
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Ensemble Estimators</span>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
              100 Trees (max_depth=5)
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Signal Conviction Threshold</span>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
              ≥ 58% Probability
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Lookahead Bias Mitigation</span>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#fbbf24' }}>
              Chronological Split (80/20)
            </span>
          </div>
        </div>

        <div style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
          <strong>Feature Pipeline:</strong> Open, High, Low, Close, Volume, SMA20, SMA50, RSI (14), MACD, MACD Signal, MACD Hist, Recent Return (1d/5d), Volatility (20d), SMA20-SMA50 Gap.
        </div>
      </div>

      {/* 3. Database & Security Information */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} color="#10b981" />
          Database & Security Compliance
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Primary Database</span>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
              MongoDB (NoSQL)
            </span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Database Name</span>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
              trademind_ai
            </span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Password Encryption</span>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
              Argon2 Password Hashing
            </span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Session Tokens</span>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#a855f7' }}>
              HMAC-SHA256 JWT
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
