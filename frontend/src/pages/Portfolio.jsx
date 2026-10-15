import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart as PieIcon,
  Layers,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { portfolioService, paperService } from '../services/api';

export default function Portfolio({ user, portfolio, onPortfolioUpdate }) {
  const [resetting, setResetting] = useState(false);
  const [sellingSymbol, setSellingSymbol] = useState(null);
  const navigate = useNavigate();

  const email = user?.email || 'demo@trademind.ai';

  const totalValue = portfolio?.total_value ?? 100000;
  const cash = portfolio?.cash ?? 100000;
  const invested = portfolio?.invested_capital ?? 0;
  const totalPL = portfolio?.total_pl ?? 0;
  const totalPLPct = portfolio?.total_pl_percent ?? 0;
  const todayPL = portfolio?.today_pl ?? 0;
  const holdings = portfolio?.holdings || [];

  // Prepare allocation data for Recharts PieChart
  const allocationData = [
    { name: 'Virtual Cash', value: Math.max(0, cash), color: '#10b981' },
    ...holdings.map((h, i) => {
      const colors = ['#38bdf8', '#818cf8', '#c084fc', '#f59e0b', '#ec4899', '#06b6d4'];
      return {
        name: h.symbol,
        value: h.current_value,
        color: colors[i % colors.length],
      };
    }),
  ];

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset your portfolio back to ₹1,00,000? All paper trade records will be cleared.')) {
      return;
    }
    setResetting(true);
    try {
      await portfolioService.resetPortfolio(email);
      if (onPortfolioUpdate) onPortfolioUpdate();
    } catch (err) {
      console.error('Error resetting portfolio:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleQuickSell = async (symbol, qty) => {
    setSellingSymbol(symbol);
    try {
      await paperService.placeTrade(symbol, 'SELL', qty, email);
      if (onPortfolioUpdate) onPortfolioUpdate();
    } catch (err) {
      console.error('Quick sell failed:', err);
    } finally {
      setSellingSymbol(null);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title & Reset Button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Portfolio Analytics
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Track real-time valuations, holding weights, profit/loss, and trade allocations.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#f87171' }}
        >
          <RotateCcw size={15} style={{ animation: resetting ? 'spinSlow 1s linear infinite' : 'none' }} />
          Reset Portfolio (₹1,00,000)
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Total Portfolio Value</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', marginTop: '6px' }}>
            ₹{Number(totalValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Cash + Open Stock Valuations
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Available Cash</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
            ₹{Number(cash).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Uninvested purchasing power
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Invested Capital</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
            ₹{Number(invested).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Cost basis of {holdings.length} active positions
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Total Net P/L</span>
          <div style={{
            fontSize: '26px',
            fontWeight: 800,
            color: totalPL >= 0 ? '#10b981' : '#ef4444',
            marginTop: '6px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px'
          }}>
            <span>{totalPL >= 0 ? '+' : ''}₹{Number(totalPL).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>({totalPLPct >= 0 ? '+' : ''}{totalPLPct}%)</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Since inception vs ₹1,00,000 capital
          </div>
        </div>
      </div>

      {/* 2-Column: Holdings Table (Left 65%) & Asset Allocation Donut Chart (Right 35%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)', gap: '24px' }} className="portfolio-grid">
        
        {/* Holdings Ledger */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              Current Stock Holdings ({holdings.length})
            </h2>
            <button
              onClick={() => navigate('/paper-trading')}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              + Trade New Stock
            </button>
          </div>

          {holdings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <Layers size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#cbd5e1' }}>No Active Stock Holdings</p>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                You have 100% of your capital in virtual cash. Place a paper trade to build your portfolio.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#64748b' }}>
                    <th style={{ padding: '10px 12px' }}>Symbol</th>
                    <th style={{ padding: '10px 12px' }}>Quantity</th>
                    <th style={{ padding: '10px 12px' }}>Avg Price</th>
                    <th style={{ padding: '10px 12px' }}>Market Price</th>
                    <th style={{ padding: '10px 12px' }}>Current Value</th>
                    <th style={{ padding: '10px 12px' }}>Unrealized P/L</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const isPos = h.unrealized_pl >= 0;
                    return (
                      <tr key={h.symbol} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#f8fafc' }}>
                          {h.symbol}
                        </td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>
                          {h.quantity}
                        </td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>
                          ₹{h.avg_buy_price?.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#f8fafc' }}>
                          ₹{h.current_price?.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#38bdf8' }}>
                          ₹{h.current_value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: isPos ? '#10b981' : '#ef4444' }}>
                          {isPos ? '+' : ''}₹{h.unrealized_pl?.toFixed(2)} ({isPos ? '+' : ''}{h.unrealized_pl_percent}%)
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleQuickSell(h.symbol, h.quantity)}
                            disabled={sellingSymbol === h.symbol}
                            className="btn-sell"
                            style={{ padding: '5px 12px', fontSize: '11px' }}
                          >
                            {sellingSymbol === h.symbol ? 'Selling...' : 'Sell All'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Allocation Donut Chart */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <PieIcon size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              Asset Allocation
            </h2>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  contentStyle={{
                    background: '#0d121f',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation Legend List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {allocationData.map((item) => {
              const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0';
              return (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                    <span style={{ color: '#cbd5e1' }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#94a3b8' }}>₹{Number(item.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    <strong style={{ color: '#f8fafc', width: '42px', textAlign: 'right' }}>{pct}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .portfolio-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
