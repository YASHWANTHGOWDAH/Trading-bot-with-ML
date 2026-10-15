import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Repeat,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Cpu,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { paperService, marketService, aiService } from '../services/api';

const AVAILABLE_STOCKS = [
  'AAPL','NVDA','MSFT','TSLA','AMZN','GOOGL','META','NFLX','AMD','INTC',
  'RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','SBIN','BHARTIARTL','ITC',
  'LARSEN','TATAPOWER','TATASTEEL','WIPRO','HINDUNILVR','BAJFINANCE','MARUTI'
];

export default function PaperTrading({ user, portfolio, onTradeComplete }) {
  const [searchParams] = useSearchParams();
  const initialSym = searchParams.get('symbol')?.toUpperCase() || 'AAPL';
  const [selectedSymbol, setSelectedSymbol] = useState(initialSym);
  const [action, setAction] = useState('BUY');
  const [quantity, setQuantity] = useState(10);
  const [quote, setQuote] = useState(null);
  const [signalInfo, setSignalInfo] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const email = user?.email || 'demo@trademind.ai';

  const loadStockData = async (sym = selectedSymbol) => {
    setLoading(true);
    try {
      const [quoteRes, sigRes] = await Promise.all([
        marketService.getQuote(sym),
        aiService.getSignal(sym),
      ]);
      setQuote(quoteRes.data);
      setSignalInfo(sigRes.data);
    } catch (err) {
      console.error('Error loading paper trade data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTradeHistory = async () => {
    try {
      const res = await paperService.getHistory(email);
      setTradeHistory(res.data.trades || []);
    } catch (err) {
      console.error('Error loading trade history:', err);
    }
  };

  useEffect(() => {
    loadStockData(selectedSymbol);
    loadTradeHistory();
  }, [selectedSymbol, email]);

  const handleExecuteTrade = async (chosenAction = action) => {
    setOrderLoading(true);
    setStatusMessage(null);
    try {
      const res = await paperService.placeTrade(selectedSymbol, chosenAction, Number(quantity), email);
      setStatusMessage({ type: 'success', text: res.data.message });
      loadTradeHistory();
      if (onTradeComplete) onTradeComplete();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Paper trade execution failed.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setOrderLoading(false);
    }
  };

  const currentPrice = quote?.current_price || 200.0;
  const totalValue = currentPrice * quantity;
  const availableCash = portfolio?.cash ?? 100000;
  const userHoldings = portfolio?.holdings || [];
  const currentHolding = userHoldings.find((h) => h.symbol === selectedSymbol);

  const sig = signalInfo?.signal || 'HOLD';
  const conf = signalInfo?.confidence || 50;
  const sigBadge = sig === 'BUY' ? 'badge-buy' : (sig === 'SELL' ? 'badge-sell' : 'badge-hold');

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Paper Trading Terminal
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Simulate realistic market orders with ₹1,00,000 virtual balance. Grounded in live AI signals.
          </p>
        </div>
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '8px 16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Wallet size={18} color="#10b981" />
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Available Virtual Cash</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
              ₹{Number(availableCash).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Trading Area: Execution Form (Left) & Current AI Signal Prompt (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left: Trade Placement Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} color="#38bdf8" />
            Place Virtual Order
          </h2>

          {/* Stock Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Select Stock
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {AVAILABLE_STOCKS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSymbol(s)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: selectedSymbol === s ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    background: selectedSymbol === s ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: selectedSymbol === s ? '#38bdf8' : '#cbd5e1'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Current Price Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Market Price</span>
              <span style={{ display: 'block', fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                ₹{currentPrice.toFixed(2)}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>You Currently Own</span>
              <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>
                {currentHolding ? `${currentHolding.quantity} Shares` : '0 Shares'}
              </span>
            </div>
          </div>

          {/* Quantity Input */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>Order Quantity</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[5, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setQuantity(preset)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#94a3b8',
                      fontSize: '10px',
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="1"
              max="10000"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
              style={{ fontSize: '16px', fontWeight: 700 }}
            />
          </div>

          {/* Calculated Order Summary */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: '#94a3b8' }}>Estimated Cost:</span>
              <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
              <span>Brokerage & Tax:</span>
              <span>₹0.00 (Zero Commission Paper Simulator)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => handleExecuteTrade('BUY')}
              disabled={orderLoading}
              className="btn-buy"
              style={{ padding: '14px', fontSize: '15px' }}
            >
              {orderLoading ? 'Processing...' : `Confirm BUY (${quantity})`}
            </button>
            <button
              onClick={() => handleExecuteTrade('SELL')}
              disabled={orderLoading || !currentHolding || currentHolding.quantity < quantity}
              className="btn-sell"
              style={{ padding: '14px', fontSize: '15px', opacity: (!currentHolding || currentHolding.quantity < quantity) ? 0.5 : 1 }}
            >
              {orderLoading ? 'Processing...' : `Confirm SELL (${quantity})`}
            </button>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: statusMessage.type === 'success' ? '#10b981' : '#ef4444'
            }}>
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* Right: AI Guidance Prompt as requested in Section 13 */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Cpu size={20} color="#38bdf8" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                AI-Assisted Guidance ({selectedSymbol})
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              Before confirming your paper trade, review the machine learning consensus and supporting technical rationale.
            </p>

            {/* AI Signal Banner */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Algorithmic Prediction
              </span>
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
                <span className={sigBadge} style={{
                  padding: '8px 24px',
                  borderRadius: '999px',
                  fontSize: '22px',
                  fontWeight: 800
                }}>
                  {sig === 'BUY' ? '🟢 BUY' : (sig === 'SELL' ? '🔴 SELL' : '🟡 HOLD')}
                </span>
              </div>
              <div style={{ marginTop: '12px', fontSize: '14px', color: '#cbd5e1' }}>
                Signal Confidence: <strong style={{ color: sig === 'BUY' ? '#10b981' : (sig === 'SELL' ? '#ef4444' : '#f59e0b') }}>{conf}%</strong>
              </div>
            </div>

            {/* Rationale Bullet Points */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Signal Rationale
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(signalInfo?.reasons || ['Indicators in neutral consolidation range']).slice(0, 4).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={14} style={{ color: '#38bdf8', marginTop: '2px', flexShrink: 0 }} />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '11px',
            color: '#64748b'
          }}>
            ℹ️ Manual confirmation is always required. The AI signal is an automated decision-support metric.
          </div>
        </div>
      </div>

      {/* Trade History Ledger Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Clock size={18} color="#38bdf8" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
            Paper Order Execution History
          </h2>
        </div>

        {tradeHistory.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#64748b' }}>No paper trades executed yet. Place your first virtual trade above.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#64748b' }}>
                  <th style={{ padding: '10px 12px' }}>Timestamp</th>
                  <th style={{ padding: '10px 12px' }}>Action</th>
                  <th style={{ padding: '10px 12px' }}>Stock</th>
                  <th style={{ padding: '10px 12px' }}>Quantity</th>
                  <th style={{ padding: '10px 12px' }}>Price</th>
                  <th style={{ padding: '10px 12px' }}>Total Amount</th>
                  <th style={{ padding: '10px 12px' }}>Realized P/L</th>
                  <th style={{ padding: '10px 12px' }}>Signal At Trade</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>
                      {t.timestamp ? new Date(t.timestamp).toLocaleString() : 'Recent'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: t.type === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: t.type === 'BUY' ? '#10b981' : '#ef4444'
                      }}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#f8fafc' }}>
                      {t.symbol}
                    </td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>
                      {t.quantity}
                    </td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>
                      ₹{t.price?.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#f8fafc' }}>
                      ₹{t.total_amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: (t.realized_pl || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                      {t.type === 'SELL' ? `${(t.realized_pl || 0) >= 0 ? '+' : ''}₹${(t.realized_pl || 0).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {t.ai_signal_at_trade || 'HOLD'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
