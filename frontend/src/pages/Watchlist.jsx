import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { watchlistService } from '../services/api';

const ALL_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'RELIANCE', 'TCS', 'INFY'];

export default function Watchlist({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedToAdd, setSelectedToAdd] = useState('NVDA');
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();

  const email = user?.email || 'demo@trademind.ai';

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const res = await watchlistService.getWatchlist(email);
      setItems(res.data.watchlist || []);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, [email]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await watchlistService.addToWatchlist(selectedToAdd, email);
      loadWatchlist();
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (sym) => {
    try {
      await watchlistService.removeFromWatchlist(sym, email);
      setItems((prev) => prev.filter((i) => i.symbol !== sym));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title & Add Ticker Bar */}
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
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              color: '#ffffff',
              padding: '8px',
              borderRadius: '10px'
            }}>
              <Bookmark size={22} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Stock Watchlist
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Monitor priority equities with synchronized real-time pricing and AI directional signals.
          </p>
        </div>

        {/* Add Stock Form */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedToAdd}
            onChange={(e) => setSelectedToAdd(e.target.value)}
            className="input-field"
            style={{ width: '130px', fontWeight: 700 }}
          >
            {ALL_SYMBOLS.map((s) => (
              <option key={s} value={s} style={{ background: '#0d121f' }}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="btn-primary"
            style={{ padding: '10px 16px', fontSize: '13px' }}
          >
            <Plus size={16} />
            {adding ? 'Adding...' : 'Add to Watchlist'}
          </button>
        </div>
      </div>

      {/* Watchlist Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <RefreshCw size={28} style={{ animation: 'spinSlow 1s linear infinite', margin: '0 auto 12px' }} />
          <p>Syncing watchlist from MongoDB...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <Bookmark size={40} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#cbd5e1' }}>Watchlist is Empty</p>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Select a stock ticker above to start tracking it.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {items.map((item) => {
            const sig = item.signal || 'HOLD';
            const isPos = (item.change_percent || 0) >= 0;
            const badgeClass = sig === 'BUY' ? 'badge-buy' : (sig === 'SELL' ? 'badge-sell' : 'badge-hold');

            return (
              <div
                key={item.symbol}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Card Top: Symbol, Name, Trash */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                      {item.symbol}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {item.name || item.symbol}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(item.symbol)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      transition: 'color 0.2s'
                    }}
                    title="Remove from watchlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Price and Signal Box */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '12px 14px',
                  borderRadius: '12px'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Current Price</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                      ₹{item.price?.toFixed(2)}
                    </span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isPos ? '#10b981' : '#ef4444'
                    }}>
                      {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {isPos ? '+' : ''}{item.change_percent?.toFixed(2)}%
                    </div>
                  </div>

                  {/* AI Signal Pill */}
                  <div className={badgeClass} style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 800 }}>
                      {sig === 'BUY' ? '🟢 BUY' : (sig === 'SELL' ? '🔴 SELL' : '🟡 HOLD')}
                    </span>
                    <span style={{ fontSize: '10px', opacity: 0.85 }}>
                      {item.confidence}% Conf
                    </span>
                  </div>
                </div>

                {/* Quick Action Links */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => navigate(`/ai-analyst?symbol=${item.symbol}`)}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px' }}
                  >
                    AI Explain
                  </button>
                  <button
                    onClick={() => navigate(`/?symbol=${item.symbol}`)}
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '6px' }}
                  >
                    Trade
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
