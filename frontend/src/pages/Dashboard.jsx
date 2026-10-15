import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Cpu,
  Layers,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShoppingBag,
  Clock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import StockChart from '../charts/StockChart';
import AIChartBox from '../components/AIChartBox';
import { marketService, aiService, paperService, portfolioService } from '../services/api';

const DEFAULT_STOCKS = [
  // US Tech & Global Leaders
  { symbol: 'AAPL',       name: 'Apple Inc.' },
  { symbol: 'NVDA',       name: 'NVIDIA' },
  { symbol: 'MSFT',       name: 'Microsoft' },
  { symbol: 'TSLA',       name: 'Tesla Inc.' },
  { symbol: 'AMZN',       name: 'Amazon' },
  { symbol: 'GOOGL',      name: 'Alphabet' },
  { symbol: 'META',       name: 'Meta' },
  { symbol: 'NFLX',       name: 'Netflix' },
  { symbol: 'AMD',        name: 'AMD' },
  { symbol: 'INTC',       name: 'Intel' },
  // Indian NSE Blue-Chips
  { symbol: 'RELIANCE',   name: 'Reliance' },
  { symbol: 'TCS',        name: 'TCS' },
  { symbol: 'INFY',       name: 'Infosys' },
  { symbol: 'HDFCBANK',   name: 'HDFC Bank' },
  { symbol: 'ICICIBANK',  name: 'ICICI Bank' },
  { symbol: 'SBIN',       name: 'SBI' },
  { symbol: 'BHARTIARTL', name: 'Airtel' },
  { symbol: 'ITC',        name: 'ITC' },
  { symbol: 'LARSEN',     name: 'L&T' },
  { symbol: 'TATAPOWER',  name: 'Tata Power' },
  { symbol: 'TATASTEEL',  name: 'Tata Steel' },
  { symbol: 'WIPRO',      name: 'Wipro' },
  { symbol: 'HINDUNILVR', name: 'HUL' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Fin' },
  { symbol: 'MARUTI',     name: 'Maruti' },
];

export default function Dashboard({ user, portfolio, onTradeComplete }) {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('1M');
  const [quote, setQuote] = useState(null);
  const [candles, setCandles] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  
  // Quick trade modal/card state
  const [tradeAction, setTradeAction] = useState('BUY');
  const [tradeQuantity, setTradeQuantity] = useState(5);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState(null);

  // Fetch Quote, Historical Candles, and AI Analysis for selected symbol
  const fetchStockData = async (sym = selectedSymbol, tf = timeframe, refresh = false) => {
    setIsLoadingChart(true);
    try {
      const [quoteRes, historyRes] = await Promise.all([
        marketService.getQuote(sym),
        marketService.getHistory(sym, tf, refresh),
      ]);
      setQuote(quoteRes.data);
      setCandles(historyRes.data.candles || []);
    } catch (err) {
      console.error('Error fetching stock data:', err);
    } finally {
      setIsLoadingChart(false);
    }
  };

  const fetchAIAnalysis = async (sym = selectedSymbol) => {
    setIsLoadingAnalysis(true);
    try {
      const res = await aiService.getAnalysis(sym);
      setAnalysis(res.data);
    } catch (err) {
      console.error('Error fetching AI analysis:', err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchStockData(selectedSymbol, timeframe);
    fetchAIAnalysis(selectedSymbol);
  }, [selectedSymbol, timeframe]);

  // Handle Quick Trade
  const handleQuickTrade = async (action) => {
    setTradeLoading(true);
    setTradeMessage(null);
    try {
      const email = user?.email || 'demo@trademind.ai';
      const res = await paperService.placeTrade(selectedSymbol, action, Number(tradeQuantity), email);
      setTradeMessage({ type: 'success', text: res.data.message });
      if (onTradeComplete) onTradeComplete();
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Paper trade execution failed.';
      setTradeMessage({ type: 'error', text: errMsg });
    } finally {
      setTradeLoading(false);
    }
  };

  // Read ?symbol= from URL (set by Markets "Trade Now" button)
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const sym = searchParams.get('symbol');
    if (sym && sym !== selectedSymbol) {
      setSelectedSymbol(sym.toUpperCase());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const currentPrice = quote?.current_price || 220.0;
  const changePercent = quote?.change_percent || 0.0;
  const changeAmt = quote?.change_amount || 0.0;
  const isPositive = changePercent >= 0;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Top Metrics Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        {/* Portfolio Value */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Portfolio Value</span>
            <div style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '6px', borderRadius: '8px' }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            ₹{Number(portfolio?.total_value ?? 100000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '6px', color: (portfolio?.total_pl ?? 0) >= 0 ? '#10b981' : '#ef4444' }}>
            {(portfolio?.total_pl ?? 0) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{portfolio?.total_pl_percent >= 0 ? '+' : ''}{portfolio?.total_pl_percent ?? 0}% overall</span>
          </div>
        </div>

        {/* Available Virtual Cash */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Available Virtual Cash</span>
            <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '8px' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
            ₹{Number(portfolio?.cash ?? 100000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            Virtual trading capital
          </div>
        </div>

        {/* Today's P/L */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Today's P/L</span>
            <div style={{ color: (portfolio?.today_pl ?? 0) >= 0 ? '#10b981' : '#ef4444', background: (portfolio?.today_pl ?? 0) >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '8px' }}>
              {(portfolio?.today_pl ?? 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: (portfolio?.today_pl ?? 0) >= 0 ? '#10b981' : '#ef4444' }}>
            {(portfolio?.today_pl ?? 0) >= 0 ? '+' : ''}₹{Number(portfolio?.today_pl ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            Holdings 24h change
          </div>
        </div>

        {/* Market Status */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Market Status</span>
            <div style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)', padding: '6px', borderRadius: '8px' }}>
              <Activity size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            OPEN (Active)
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            Real-time demo stream
          </div>
        </div>

        {/* AI Bot Status */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>AI Signal Engine</span>
            <div style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '6px', borderRadius: '8px' }}>
              <Zap size={16} />
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>
            Random Forest
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            100 Trees • Multi-Feature
          </div>
        </div>
      </div>

      {/* 2. Stock Selection Pill Bar */}
      <div style={{ position: 'relative' }}>
        {/* Section labels */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', background: 'rgba(56,189,248,0.08)', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.2)' }}>🇺🇸 US Markets</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', background: 'rgba(167,139,250,0.08)', borderRadius: '6px', border: '1px solid rgba(167,139,250,0.2)' }}>🇮🇳 NSE India</span>
        </div>

        {/* Scrollable pill row */}
        <div
          className="stock-pill-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(56,189,248,0.3) transparent',
          }}
        >
          {/* US stocks */}
          {DEFAULT_STOCKS.filter(s => ['AAPL','NVDA','MSFT','TSLA','AMZN','GOOGL','META','NFLX','AMD','INTC'].includes(s.symbol)).map((stk) => {
            const isSelected = selectedSymbol === stk.symbol;
            return (
              <button
                key={stk.symbol}
                onClick={() => setSelectedSymbol(stk.symbol)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  color: isSelected ? '#38bdf8' : '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 0 12px rgba(56,189,248,0.2)' : 'none',
                }}
              >
                <span>{stk.symbol}</span>
                <span style={{ fontSize: '10px', fontWeight: 400, color: isSelected ? '#7dd3fc' : '#475569' }}>
                  {stk.name}
                </span>
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)', flexShrink: 0, margin: '0 4px' }} />

          {/* India NSE stocks */}
          {DEFAULT_STOCKS.filter(s => !['AAPL','NVDA','MSFT','TSLA','AMZN','GOOGL','META','NFLX','AMD','INTC'].includes(s.symbol)).map((stk) => {
            const isSelected = selectedSymbol === stk.symbol;
            return (
              <button
                key={stk.symbol}
                onClick={() => setSelectedSymbol(stk.symbol)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(167,139,250,0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.08)',
                  color: isSelected ? '#a78bfa' : '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 0 12px rgba(167,139,250,0.2)' : 'none',
                }}
              >
                <span>{stk.symbol}</span>
                <span style={{ fontSize: '10px', fontWeight: 400, color: isSelected ? '#c4b5fd' : '#475569' }}>
                  {stk.name}
                </span>
              </button>
            );
          })}
        </div>

        <style>{`
          .stock-pill-bar::-webkit-scrollbar { height: 4px; }
          .stock-pill-bar::-webkit-scrollbar-track { background: transparent; }
          .stock-pill-bar::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 4px; }
          .stock-pill-bar::-webkit-scrollbar-thumb:hover { background: rgba(56,189,248,0.5); }
        `}</style>
      </div>

      {/* 3. Selected Stock Overview Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {selectedSymbol}
              </h2>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                {quote?.name || selectedSymbol}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                {quote?.exchange || 'NASDAQ'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
                ₹{Number(currentPrice).toFixed(2)}
              </span>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                fontWeight: 700,
                color: isPositive ? '#10b981' : '#ef4444'
              }}>
                {isPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                <span>{isPositive ? '+' : ''}{changeAmt.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Pill Group */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>24h High</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>₹{quote?.high?.toFixed(2) || '—'}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>24h Low</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>₹{quote?.low?.toFixed(2) || '—'}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Volume</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>{quote?.volume ? Number(quote.volume).toLocaleString() : '—'}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>RSI (14)</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#38bdf8' }}>{quote?.indicators?.rsi || '50'}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Market Timestamp</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#a855f7' }}>
              {quote?.timestamp || (quote?.last_updated ? quote.last_updated.slice(0, 16).replace('T', ' ') : 'Live')}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Main Chart + AI Chart Box Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 380px)',
        gap: '24px'
      }} className="chart-ai-grid">
        
        {/* Left: Recharts Stock Visualization */}
        <StockChart
          symbol={selectedSymbol}
          data={candles}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          isLoading={isLoadingChart}
          currency="₹"
        />

        {/* Right: AI Market Signal Box */}
        <AIChartBox
          symbol={selectedSymbol}
          analysis={analysis}
          isLoading={isLoadingAnalysis}
          onRefresh={() => fetchAIAnalysis(selectedSymbol)}
        />
      </div>

      {/* 5. Paper Trading Execution Card & Order Preview */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px' }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                AI-Assisted Paper Trading
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Execute virtual trades powered by real-time ML signals. No real money required.
              </p>
            </div>
          </div>

          {/* AI Signal Indicator Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>AI Signal:</span>
            <span className={analysis?.signal === 'BUY' ? 'badge-buy' : (analysis?.signal === 'SELL' ? 'badge-sell' : 'badge-hold')} style={{
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800
            }}>
              {analysis?.signal || 'HOLD'} ({analysis?.confidence || 50}%)
            </span>
          </div>
        </div>

        {/* Order inputs form */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'flex-end',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Stock Symbol
            </label>
            <input
              type="text"
              readOnly
              value={selectedSymbol}
              className="input-field"
              style={{ fontWeight: 700, color: '#38bdf8' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Current Price
            </label>
            <input
              type="text"
              readOnly
              value={`₹${currentPrice.toFixed(2)}`}
              className="input-field"
              style={{ fontWeight: 600 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Quantity (Shares)
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={tradeQuantity}
              onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
              style={{ fontWeight: 600 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Estimated Order Value
            </label>
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '15px',
              fontWeight: 800,
              color: '#38bdf8'
            }}>
              ₹{(currentPrice * tradeQuantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleQuickTrade('BUY')}
              disabled={tradeLoading}
              className="btn-buy"
              style={{ flex: 1, padding: '10px', fontSize: '14px' }}
            >
              {tradeLoading ? 'Placing...' : 'Paper BUY'}
            </button>
            <button
              onClick={() => handleQuickTrade('SELL')}
              disabled={tradeLoading}
              className="btn-sell"
              style={{ flex: 1, padding: '10px', fontSize: '14px' }}
            >
              {tradeLoading ? 'Placing...' : 'Paper SELL'}
            </button>
          </div>
        </div>

        {/* Trade status message */}
        {tradeMessage && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            background: tradeMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${tradeMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: tradeMessage.type === 'success' ? '#10b981' : '#ef4444'
          }}>
            {tradeMessage.text}
          </div>
        )}
      </div>

      {/* Responsive layout CSS */}
      <style>{`
        @media (max-width: 1024px) {
          .chart-ai-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
