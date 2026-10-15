import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { marketService, aiService } from '../services/api';

export default function Markets() {
  const [stocks, setStocks] = useState([]);
  const [signals, setSignals] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSignal, setFilterSignal] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, signalsRes] = await Promise.all([
        marketService.getOverview(),
        aiService.getAllSignals(),
      ]);
      setStocks(overviewRes.data.stocks || []);
      
      const sigMap = {};
      (signalsRes.data.signals || []).forEach((s) => {
        sigMap[s.symbol] = s;
      });
      setSignals(sigMap);
    } catch (err) {
      console.error('Error loading market data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase());
    const stockSignal = signals[stock.symbol]?.signal || 'HOLD';
    const matchesFilter = filterSignal === 'ALL' || stockSignal === filterSignal;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Page Title & Search/Filter Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Market Screener & AI Signals
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Live market valuation paired with real-time explainable machine learning predictions.
          </p>
        </div>

        {/* Search & Refresh */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '8px 12px',
            gap: '8px',
            width: '240px'
          }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search ticker or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                outline: 'none',
                fontSize: '13px',
                width: '100%'
              }}
            />
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spinSlow 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Signal Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['ALL', 'BUY', 'SELL', 'HOLD'].map((sig) => (
          <button
            key={sig}
            onClick={() => setFilterSignal(sig)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: filterSignal === sig ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
              background: filterSignal === sig ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: filterSignal === sig ? '#38bdf8' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            {sig === 'ALL' ? 'All Stocks' : `${sig === 'BUY' ? '🟢' : (sig === 'SELL' ? '🔴' : '🟡')} ${sig}`}
          </button>
        ))}
      </div>

      {/* Grid of Stock Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spinSlow 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Scanning stock market & running ML models...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '20px'
        }}>
          {filteredStocks.map((stk) => {
            const sigInfo = signals[stk.symbol] || { signal: 'HOLD', confidence: 50 };
            const sig = sigInfo.signal || 'HOLD';
            const conf = sigInfo.confidence || 50;
            const isPos = (stk.change_percent || 0) >= 0;

            const badgeClass = sig === 'BUY' ? 'badge-buy' : (sig === 'SELL' ? 'badge-sell' : 'badge-hold');

            return (
              <div
                key={stk.symbol}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                {/* Card Top: Symbol, Name, AI Signal Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                        {stk.symbol}
                      </h3>
                      <span style={{ fontSize: '11px', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        {stk.exchange}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                      {stk.name}
                    </span>
                  </div>

                  {/* AI Signal Badge with Confidence */}
                  <div className={badgeClass} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '6px 12px',
                    borderRadius: '10px',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>
                      {sig === 'BUY' ? '🟢 BUY' : (sig === 'SELL' ? '🔴 SELL' : '🟡 HOLD')}
                    </span>
                    <span style={{ fontSize: '10px', opacity: 0.85, fontWeight: 600 }}>
                      {conf}% Conf
                    </span>
                  </div>
                </div>

                {/* Card Middle: Price, 24h Change, Volume */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Current Price</span>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
                      ₹{stk.current_price?.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>24h Change</span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '2px',
                      color: isPos ? '#10b981' : '#ef4444'
                    }}>
                      {isPos ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {isPos ? '+' : ''}{stk.change_percent?.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Indicator metrics pill */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#94a3b8'
                }}>
                  <span>RSI: <strong style={{ color: '#cbd5e1' }}>{stk.indicators?.rsi || '50'}</strong></span>
                  <span>SMA20: <strong style={{ color: '#cbd5e1' }}>₹{stk.indicators?.sma20 || stk.current_price?.toFixed(0)}</strong></span>
                  <span>Vol: <strong style={{ color: '#cbd5e1' }}>{(stk.volume / 1000000).toFixed(1)}M</strong></span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigate(`/ai-analyst?symbol=${stk.symbol}`)}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Cpu size={14} color="#38bdf8" />
                    Explain AI
                  </button>
                  <button
                    onClick={() => navigate(`/paper-trading?symbol=${stk.symbol}`)}
                    className="btn-primary"
                    style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                  >
                    Trade Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
