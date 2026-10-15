import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Play,
  Clock,
  Zap,
} from 'lucide-react';
import { alertService } from '../services/api';

const STOCKS = [
  'AAPL','NVDA','MSFT','TSLA','AMZN','GOOGL','META','NFLX','AMD','INTC',
  'RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','SBIN','BHARTIARTL','ITC',
  'LARSEN','TATAPOWER','TATASTEEL','WIPRO','HINDUNILVR','BAJFINANCE','MARUTI'
];
const CONDITIONS = [
  { value: 'PRICE_ABOVE', label: 'Price crosses ABOVE (₹)' },
  { value: 'PRICE_BELOW', label: 'Price crosses BELOW (₹)' },
  { value: 'SIGNAL_BUY', label: 'TradeMind AI generates BUY signal' },
  { value: 'SIGNAL_SELL', label: 'TradeMind AI generates SELL signal' },
  { value: 'CONFIDENCE_ABOVE', label: 'Signal confidence exceeds (%)' },
];

export default function Alerts({ user }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  // Form State
  const [symbol, setSymbol] = useState('AAPL');
  const [condition, setCondition] = useState('PRICE_ABOVE');
  const [threshold, setThreshold] = useState(250);
  const [creating, setCreating] = useState(false);

  const email = user?.email || 'demo@trademind.ai';

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await alertService.getAlerts(email);
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [email]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await alertService.createAlert({
        symbol,
        condition_type: condition,
        threshold_value: Number(threshold),
        email,
      });
      loadAlerts();
    } catch (err) {
      console.error('Error creating alert:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await alertService.deleteAlert(id, email);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const handleEvaluate = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await alertService.checkAlerts(email);
      setCheckResult(res.data);
      loadAlerts();
    } catch (err) {
      console.error('Error checking alerts:', err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title & Check Now Button */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: '#ffffff',
              padding: '8px',
              borderRadius: '10px'
            }}>
              <Bell size={22} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Smart Market Alerts
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Set intelligent notification rules based on real-time price boundaries and ML signal triggers.
          </p>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={checking}
          className="btn-primary"
          style={{ padding: '10px 18px', fontSize: '13px' }}
        >
          <Play size={15} />
          {checking ? 'Scanning Market...' : 'Evaluate All Alerts Now'}
        </button>
      </div>

      {/* Check Alerts Result Banner */}
      {checkResult && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '14px' }}>
              Alert Scanner Complete
            </span>
            <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
              Scanned {checkResult.checked_count} active rules. Found {checkResult.new_triggers?.length || 0} triggered conditions.
            </p>
          </div>
        </div>
      )}

      {/* 2-Column: Create Form (Left) & Alert Cards (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) minmax(0, 1fr)', gap: '24px' }} className="alerts-grid">
        
        {/* Create Alert Card */}
        <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="#38bdf8" />
            Create New Smart Alert
          </h2>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                Stock Symbol
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="input-field"
                style={{ fontWeight: 700 }}
              >
                {STOCKS.map((s) => (
                  <option key={s} value={s} style={{ background: '#0d121f' }}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                Condition Trigger
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input-field"
                style={{ fontWeight: 600 }}
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value} style={{ background: '#0d121f' }}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Threshold Input if applicable */}
            {condition !== 'SIGNAL_BUY' && condition !== 'SIGNAL_SELL' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  {condition === 'CONFIDENCE_ABOVE' ? 'Confidence Threshold (%)' : 'Price Target (₹)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="input-field"
                  style={{ fontWeight: 700 }}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="btn-primary"
              style={{ marginTop: '8px', padding: '12px', width: '100%' }}
            >
              {creating ? 'Saving...' : 'Set Smart Alert'}
            </button>
          </form>
        </div>

        {/* Existing Alerts List */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
            Configured Alerts ({alerts.length})
          </h2>

          {loading ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading alerts from MongoDB...</p>
          ) : alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Bell size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#cbd5e1' }}>No Alerts Configured</p>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Use the form on the left to set price or AI signal trigger notifications.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((al) => {
                const isTriggered = al.is_triggered;
                return (
                  <div
                    key={al.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: isTriggered ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isTriggered ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: isTriggered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isTriggered ? '#10b981' : '#94a3b8'
                      }}>
                        {isTriggered ? <CheckCircle size={18} /> : <Clock size={18} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '15px' }}>{al.symbol}</span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isTriggered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.1)',
                            color: isTriggered ? '#10b981' : '#38bdf8'
                          }}>
                            {isTriggered ? 'TRIGGERED' : 'MONITORING'}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
                          {isTriggered && al.trigger_message ? (
                            al.trigger_message
                          ) : (
                            `${al.condition_type.replace('_', ' ')} ${al.threshold_value ? `₹${al.threshold_value}` : ''}`
                          )}
                        </p>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          Created: {al.created_at ? new Date(al.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(al.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        transition: 'color 0.2s'
                      }}
                      title="Delete alert"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .alerts-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
