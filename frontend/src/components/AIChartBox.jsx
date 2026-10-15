import React from 'react';
import { Cpu, RefreshCw, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function AIChartBox({
  symbol = 'AAPL',
  analysis = null,
  isLoading = false,
  onRefresh,
}) {
  const signal = analysis?.signal || 'HOLD';
  const confidence = analysis?.confidence || 50;
  const upProb = analysis?.up_probability || 50;
  const downProb = analysis?.down_probability || 50;
  const reasons = analysis?.reasons || [
    'Analyzing real-time indicators and machine learning features...',
  ];

  const getSignalBadge = () => {
    if (signal === 'BUY') {
      return {
        bg: 'badge-buy',
        icon: <ArrowUpRight size={20} />,
        label: 'BUY',
        sub: 'Bullish Momentum Detected',
        textColor: '#10b981',
      };
    } else if (signal === 'SELL') {
      return {
        bg: 'badge-sell',
        icon: <ArrowDownRight size={20} />,
        label: 'SELL',
        sub: 'Bearish Downside Detected',
        textColor: '#ef4444',
      };
    } else {
      return {
        bg: 'badge-hold',
        icon: <Minus size={20} />,
        label: 'HOLD',
        sub: 'Consolidation / Mixed Signals',
        textColor: '#f59e0b',
      };
    }
  };

  const badge = getSignalBadge();

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em', color: '#f8fafc' }}>
              AI MARKET SIGNAL
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Model: {analysis?.model_name || 'Random Forest'}
            </span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#94a3b8',
            padding: '6px 10px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            transition: 'all 0.2s'
          }}
          title="Re-run ML prediction"
        >
          <RefreshCw size={13} style={{ animation: isLoading ? 'spinSlow 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Main Signal Display */}
      <div style={{
        textAlign: 'center',
        padding: '20px 16px',
        borderRadius: '16px',
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.25)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 24px',
          borderRadius: '999px',
          fontSize: '22px',
          fontWeight: 800,
          marginBottom: '8px'
        }} className={badge.bg}>
          {badge.icon}
          {badge.label}
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
          {badge.sub}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Signal Confidence:</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: badge.textColor }}>
            {confidence}%
          </span>
        </div>
      </div>

      {/* Probability Distribution Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: '#10b981', fontWeight: 600 }}>Up: {upProb}%</span>
          <span style={{ color: '#ef4444', fontWeight: 600 }}>Down: {downProb}%</span>
        </div>
        <div style={{
          height: '8px',
          width: '100%',
          background: 'rgba(239, 68, 68, 0.4)',
          borderRadius: '999px',
          overflow: 'hidden',
          display: 'flex'
        }}>
          <div style={{
            width: `${upProb}%`,
            height: '100%',
            background: '#10b981',
            borderRadius: '999px 0 0 999px',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Explainable AI Reasons Checklist */}
      <div style={{ flex: 1 }}>
        <h4 style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '10px'
        }}>
          Why {signal}?
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reasons.slice(0, 5).map((r, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '12px',
              color: '#cbd5e1',
              lineHeight: 1.4
            }}>
              <CheckCircle2
                size={14}
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
      </div>

      {/* Non-guaranteed Disclaimer Note as required */}
      <div style={{
        marginTop: '16px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <span style={{ fontSize: '10px', color: '#64748b' }}>
          ML signals are probabilistic estimates for educational paper trading, not financial advice.
        </span>
      </div>
    </div>
  );
}
