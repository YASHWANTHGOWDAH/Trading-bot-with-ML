import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FlaskConical,
  Play,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Award,
  Calendar,
  Layers,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { backtestService } from '../services/api';

const STOCKS = [
  // US Tech & Global Leaders
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'US' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'US' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', market: 'US' },
  { symbol: 'TSLA', name: 'Tesla Inc.', market: 'US' },
  { symbol: 'AMZN', name: 'Amazon.com', market: 'US' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'US' },
  { symbol: 'META', name: 'Meta Platforms', market: 'US' },
  { symbol: 'NFLX', name: 'Netflix Inc.', market: 'US' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', market: 'US' },
  { symbol: 'INTC', name: 'Intel Corp.', market: 'US' },
  // Indian Market Leaders (NSE)
  { symbol: 'RELIANCE', name: 'Reliance Industries', market: 'NSE' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', market: 'NSE' },
  { symbol: 'INFY', name: 'Infosys Ltd', market: 'NSE' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', market: 'NSE' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', market: 'NSE' },
  { symbol: 'SBIN', name: 'State Bank of India', market: 'NSE' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', market: 'NSE' },
  { symbol: 'ITC', name: 'ITC Ltd', market: 'NSE' },
  { symbol: 'LARSEN', name: 'Larsen & Toubro', market: 'NSE' },
  { symbol: 'TATAPOWER', name: 'Tata Power', market: 'NSE' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', market: 'NSE' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', market: 'NSE' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', market: 'NSE' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', market: 'NSE' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', market: 'NSE' }
];
const STRATEGIES = [
  'TradeMind AI ML-Ensemble Signal',
  'SMA Crossover (SMA20/SMA50)',
  'RSI Momentum (30/70)',
];
const TIMEFRAMES = ['1M', '3M', '6M', '1Y'];

export default function BacktestLab({ user }) {
  const [searchParams] = useSearchParams();
  const initialSym = searchParams.get('symbol')?.toUpperCase() || 'AAPL';
  const [symbol, setSymbol] = useState(initialSym);
  const [strategy, setStrategy] = useState(STRATEGIES[0]);
  const [timeframe, setTimeframe] = useState('6M');
  const [capital, setCapital] = useState(100000);
  
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const email = user?.email || 'demo@trademind.ai';

  const handleRunBacktest = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await backtestService.runBacktest({
        symbol,
        strategy,
        timeframe,
        initial_capital: Number(capital),
        email,
      });
      setReport(res.data);
    } catch (err) {
      console.error('Backtest error:', err);
      setErrorMsg(err.response?.data?.detail || 'Backtest failed to execute.');
    } finally {
      setIsRunning(false);
    }
  };

  const isPositive = (report?.total_return_percent ?? 0) >= 0;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            color: '#ffffff',
            padding: '8px',
            borderRadius: '10px'
          }}>
            <FlaskConical size={22} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Quantitative Backtesting Lab
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
          Simulate algorithmic trading models on chronological market history. Analyze return, win rate, and drawdowns.
        </p>
      </div>

      {/* Control Configuration Panel */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
          Simulation Parameters
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'flex-end'
        }}>
          {/* Stock */}
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
              <optgroup label="🇺🇸 US Tech & Global Leaders" style={{ background: '#0d121f', color: '#38bdf8' }}>
                {STOCKS.filter(s => s.market === 'US').map((s) => (
                  <option key={s.symbol} value={s.symbol} style={{ background: '#0d121f', color: '#f8fafc' }}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🇮🇳 NSE India Leaders" style={{ background: '#0d121f', color: '#a78bfa' }}>
                {STOCKS.filter(s => s.market === 'NSE').map((s) => (
                  <option key={s.symbol} value={s.symbol} style={{ background: '#0d121f', color: '#f8fafc' }}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Strategy */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Trading Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="input-field"
              style={{ fontWeight: 600 }}
            >
              {STRATEGIES.map((st) => (
                <option key={st} value={st} style={{ background: '#0d121f' }}>{st}</option>
              ))}
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Historical Window
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="input-field"
              style={{ fontWeight: 600 }}
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf} style={{ background: '#0d121f' }}>{tf} Duration</option>
              ))}
            </select>
          </div>

          {/* Initial Capital */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Initial Capital (₹)
            </label>
            <input
              type="number"
              min="10000"
              max="10000000"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="input-field"
              style={{ fontWeight: 700 }}
            />
          </div>

          {/* Execute Button */}
          <div>
            <button
              onClick={handleRunBacktest}
              disabled={isRunning}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              <Play size={16} />
              {isRunning ? 'Running Simulation...' : 'Execute Backtest'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '13px' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Results View */}
      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Key Metrics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            <div className="glass-card" style={{ padding: '18px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Final Capital</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                ₹{Number(report.final_capital).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: '11px', color: isPositive ? '#10b981' : '#ef4444' }}>
                {isPositive ? '+' : ''}₹{Number(report.net_profit).toLocaleString('en-IN', { maximumFractionDigits: 2 })} net
              </span>
            </div>

            <div className="glass-card" style={{ padding: '18px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Return</span>
              <div style={{
                fontSize: '24px',
                fontWeight: 800,
                color: isPositive ? '#10b981' : '#ef4444',
                marginTop: '4px'
              }}>
                {isPositive ? '+' : ''}{report.total_return_percent}%
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Over {timeframe} history</span>
            </div>

            <div className="glass-card" style={{ padding: '18px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Win Rate</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                {report.win_rate_percent}%
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {report.winning_trades} wins / {report.losing_trades} losses
              </span>
            </div>

            <div className="glass-card" style={{ padding: '18px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Max Drawdown</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                {report.max_drawdown_percent}%
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Peak-to-trough decline</span>
            </div>

            <div className="glass-card" style={{ padding: '18px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Trades</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>
                {report.total_trades}
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Profit Factor: {report.profit_factor}</span>
            </div>
          </div>

          {/* Portfolio Growth Equity Curve Chart */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
              Portfolio Equity Curve Growth
            </h3>
            <div style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.equity_curve || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0d121f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Portfolio Value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="portfolio_value"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#equityGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade Signals & Execution Log */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
              Backtest Trade Execution Signals
            </h3>
            {report.trade_history?.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748b' }}>No trades triggered with current threshold criteria.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#64748b' }}>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Signal</th>
                      <th style={{ padding: '10px' }}>Executed Price</th>
                      <th style={{ padding: '10px' }}>Shares</th>
                      <th style={{ padding: '10px' }}>Total Amount</th>
                      <th style={{ padding: '10px' }}>Realized P/L</th>
                      <th style={{ padding: '10px' }}>Cash Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.trade_history?.map((t, idx) => {
                      const isSell = t.action === 'SELL';
                      const isWin = (t.realized_pl || 0) > 0;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '10px', color: '#94a3b8' }}>{t.timestamp}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 800,
                              background: t.action === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: t.action === 'BUY' ? '#10b981' : '#ef4444'
                            }}>
                              {t.action}
                            </span>
                          </td>
                          <td style={{ padding: '10px', color: '#f8fafc' }}>₹{t.price?.toFixed(2)}</td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>{t.quantity}</td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>₹{t.amount?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px', fontWeight: 700, color: isWin ? '#10b981' : (isSell ? '#ef4444' : '#64748b') }}>
                            {isSell ? `${isWin ? '+' : ''}₹${t.realized_pl?.toFixed(2)}` : '—'}
                          </td>
                          <td style={{ padding: '10px', color: '#94a3b8' }}>₹{t.cash_remaining?.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
