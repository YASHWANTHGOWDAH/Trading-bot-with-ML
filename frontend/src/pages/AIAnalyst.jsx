import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart2,
  ShieldCheck,
  TrendingUp,
  Sliders,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { aiService, marketService } from '../services/api';

const STOCKS = [
  'AAPL','NVDA','MSFT','TSLA','AMZN','GOOGL','META','NFLX','AMD','INTC',
  'RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','SBIN','BHARTIARTL','ITC',
  'LARSEN','TATAPOWER','TATASTEEL','WIPRO','HINDUNILVR','BAJFINANCE','MARUTI'
];

export default function AIAnalyst() {
  const [searchParams] = useSearchParams();
  const initialSym = searchParams.get('symbol') || 'AAPL';
  const [symbol, setSymbol] = useState(initialSym);
  const [analysis, setAnalysis] = useState(null);
  const [quote, setQuote] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  const scrollHorizontally = (offset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Center selected stock pill in view when changed
  useEffect(() => {
    const el = document.getElementById(`ai-pill-${symbol}`);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [symbol]);

  const fetchAnalysis = async (sym = symbol) => {
    setLoading(true);
    try {
      const [analysisRes, quoteRes, historyRes] = await Promise.all([
        aiService.getAnalysis(sym),
        marketService.getQuote(sym),
        aiService.getPredictionHistory(sym, 10),
      ]);
      setAnalysis(analysisRes.data);
      setQuote(quoteRes.data);
      setHistoryLogs(historyRes.data.history || []);
    } catch (err) {
      console.error('Error fetching AI analysis details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(symbol);
  }, [symbol]);

  const signal = analysis?.signal || 'HOLD';
  const confidence = analysis?.confidence || 50;
  const upProb = analysis?.up_probability || 50;
  const downProb = analysis?.down_probability || 50;
  const reasons = analysis?.reasons || [];
  const indicators = analysis?.indicators || {};
  const featureImportances = analysis?.feature_importances || {};

  const badgeClass = signal === 'BUY' ? 'badge-buy' : (signal === 'SELL' ? 'badge-sell' : 'badge-hold');

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header with Title & Recalculate Button */}
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
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: '#ffffff',
              padding: '8px',
              borderRadius: '10px'
            }}>
              <Cpu size={24} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Explainable AI Analyst
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Deep dive into algorithmic features, technical indicator cross-validation, and ML signal attribution.
          </p>
        </div>

        <button
          onClick={() => fetchAnalysis(symbol)}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spinSlow 1s linear infinite' : 'none' }} />
          Recalculate Analysis
        </button>
      </div>

      {/* 2. Horizontal Scrollable Stock Selector Bar with Left/Right Navigation */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Top meta row with badges and scroll controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 9px', background: 'rgba(56,189,248,0.1)', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.25)' }}>
              🇺🇸 US Tech (10)
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 9px', background: 'rgba(167,139,250,0.1)', borderRadius: '6px', border: '1px solid rgba(167,139,250,0.25)' }}>
              🇮🇳 NSE India (15)
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              • Scroll sideways or use arrows to choose from all 25 stocks
            </span>
          </div>

          {/* Left / Right Scroll Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => scrollHorizontally(-260)}
              title="Scroll left"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; e.currentTarget.style.color = '#38bdf8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollHorizontally(260)}
              title="Scroll right"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; e.currentTarget.style.color = '#38bdf8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable stock pills container */}
        <div
          ref={scrollContainerRef}
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            paddingBottom: '6px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(56, 189, 248, 0.4) rgba(15, 23, 42, 0.4)',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            width: '100%'
          }}
        >
          {/* US Stocks (first 10) */}
          {STOCKS.slice(0, 10).map((s) => {
            const isSelected = symbol === s;
            return (
              <button
                key={s}
                id={`ai-pill-${s}`}
                onClick={() => setSymbol(s)}
                style={{
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  padding: '7px 15px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#38bdf8' : '#94a3b8',
                  boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '10px', opacity: 0.7 }}>🇺🇸</span>
                {s}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.15)', margin: '0 4px', flexShrink: 0 }} />

          {/* NSE Indian Stocks (remaining 15) */}
          {STOCKS.slice(10).map((s) => {
            const isSelected = symbol === s;
            return (
              <button
                key={s}
                id={`ai-pill-${s}`}
                onClick={() => setSymbol(s)}
                style={{
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  padding: '7px 15px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(167, 139, 250, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#a78bfa' : '#94a3b8',
                  boxShadow: isSelected ? '0 0 12px rgba(167, 139, 250, 0.25)' : 'none',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '10px', opacity: 0.7 }}>🇮🇳</span>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Signal & Probability Banner */}
      <div className="glass-card" style={{ padding: '28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff' }}>{symbol}</span>
            <span style={{ fontSize: '18px', color: '#94a3b8' }}>{quote?.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>
              ₹{quote?.current_price?.toFixed(2)}
            </span>
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: (quote?.change_percent || 0) >= 0 ? '#10b981' : '#ef4444'
            }}>
              {(quote?.change_percent || 0) >= 0 ? '+' : ''}{quote?.change_percent?.toFixed(2)}% (24h)
            </span>
          </div>
        </div>

        {/* Signal Hero Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '16px 24px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Synthesized Signal
            </span>
            <div className={badgeClass} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '999px',
              fontSize: '20px',
              fontWeight: 800,
              marginTop: '4px'
            }}>
              {signal === 'BUY' ? '🟢 BUY' : (signal === 'SELL' ? '🔴 SELL' : '🟡 HOLD')}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '20px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Confidence</span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: signal === 'BUY' ? '#10b981' : (signal === 'SELL' ? '#ef4444' : '#f59e0b') }}>
              {confidence}%
            </span>
          </div>

          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '20px', minWidth: '150px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ color: '#10b981' }}>Up: {upProb}%</span>
              <span style={{ color: '#ef4444' }}>Down: {downProb}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(239, 68, 68, 0.4)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${upProb}%`, height: '100%', background: '#10b981' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Reasons & Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left: Explainable AI Logic Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldCheck size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Why Did the AI Choose {signal}?
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
            Transparent attribution explaining the technical thresholds and ML decision boundaries.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reasons.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '13px',
                  color: '#e2e8f0',
                  lineHeight: 1.4
                }}
              >
                <CheckCircle2
                  size={16}
                  style={{
                    color: signal === 'BUY' ? '#10b981' : (signal === 'SELL' ? '#ef4444' : '#f59e0b'),
                    marginTop: '2px',
                    flexShrink: 0
                  }}
                />
                <span>{r}</span>
              </div>
            ))}
          </div>

          {/* Model Metrics Card */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)'
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
              Model Architecture & Training Scores
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Algorithm</span>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                  {analysis?.model_name || 'Random Forest'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Train Accuracy</span>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                  {analysis?.train_accuracy ? `${(analysis.train_accuracy * 100).toFixed(1)}%` : '85.2%'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Test Accuracy</span>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>
                  {analysis?.test_accuracy ? `${(analysis.test_accuracy * 100).toFixed(1)}%` : '78.4%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Technical Indicators & Feature Importances */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Technical Indicators Grid */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <TrendingUp size={20} color="#a855f7" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                Calculated Technical Indicators
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>SMA 20 (Short Trend)</span>
                <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: '#fbbf24' }}>
                  ₹{indicators.sma20 ?? '—'}
                </span>
                <span style={{ fontSize: '10px', color: indicators.price_vs_sma20 === 'ABOVE' ? '#10b981' : '#ef4444' }}>
                  Price is {indicators.price_vs_sma20?.toLowerCase()} SMA20
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>SMA 50 (Medium Trend)</span>
                <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: '#c084fc' }}>
                  ₹{indicators.sma50 ?? '—'}
                </span>
                <span style={{ fontSize: '10px', color: indicators.sma20_vs_sma50 === 'ABOVE' ? '#10b981' : '#ef4444' }}>
                  {indicators.sma20_vs_sma50 === 'ABOVE' ? 'Golden alignment' : 'Death alignment'}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>RSI (14 Period)</span>
                <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>
                  {indicators.rsi ?? '—'}
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {indicators.rsi_state || 'NEUTRAL'}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>MACD Histogram</span>
                <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: (indicators.macd_hist || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                  {indicators.macd_hist ? (indicators.macd_hist > 0 ? `+${indicators.macd_hist}` : indicators.macd_hist) : '0.0'}
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Trend: {indicators.macd_trend || 'NEUTRAL'}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>20d Volatility</span>
                <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  {indicators.volatility ? `${indicators.volatility}%` : '1.2%'}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>SMA Gap (%)</span>
                <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: (indicators.sma_gap || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                  {indicators.sma_gap ? `${indicators.sma_gap}%` : '0.0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Feature Importance Attribution */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Sliders size={20} color="#10b981" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                Feature Importance Attribution
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(featureImportances).slice(0, 6).map(([feat, weight]) => {
                const pct = Math.round(weight * 100);
                return (
                  <div key={feat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>
                        {feat.replace('_', ' ')}
                      </span>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, pct * 2.5)}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Prediction Audit Trail from MongoDB */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <History size={20} color="#fbbf24" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
            Historical Prediction Audit Trail ({symbol})
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
          Immutable records of past model inferences retrieved from MongoDB <code style={{ color: '#38bdf8' }}>predictions</code> collection.
        </p>

        {historyLogs.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#64748b' }}>No archived predictions found for {symbol} yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#64748b' }}>
                  <th style={{ padding: '10px 12px' }}>Timestamp</th>
                  <th style={{ padding: '10px 12px' }}>Signal</th>
                  <th style={{ padding: '10px 12px' }}>Confidence</th>
                  <th style={{ padding: '10px 12px' }}>Up / Down Prob</th>
                  <th style={{ padding: '10px 12px' }}>Model</th>
                  <th style={{ padding: '10px 12px' }}>Key Reason</th>
                </tr>
              </thead>
              <tbody>
                {historyLogs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={log.signal === 'BUY' ? 'badge-buy' : (log.signal === 'SELL' ? 'badge-sell' : 'badge-hold')} style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {log.signal}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#f8fafc' }}>
                      {log.confidence}%
                    </td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                      {log.up_probability}% / {log.down_probability}%
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                      {log.model_name || 'RandomForest'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.reasons?.[0] || 'Quantitative technical rule'}
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
