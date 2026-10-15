import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Eye, EyeOff, BarChart2 } from 'lucide-react';

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y'];

export default function StockChart({
  symbol,
  data = [],
  timeframe = '1M',
  onTimeframeChange,
  isLoading = false,
  currency = '₹',
}) {
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // Compute domain bounds for smooth dynamic scaling
  const minPrice = data.length > 0 ? Math.min(...data.map((d) => d.close || d.low || 0)) : 0;
  const maxPrice = data.length > 0 ? Math.max(...data.map((d) => d.close || d.high || 0)) : 100;
  const yPadding = (maxPrice - minPrice) * 0.08 || 5;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
          fontSize: '12px',
          minWidth: '180px'
        }}>
          <p style={{ fontWeight: 700, marginBottom: '6px', color: '#94a3b8' }}>{pData.timestamp || label}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Price:</span>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>{currency}{pData.close?.toFixed(2)}</span>
          </div>
          {pData.sma20 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#f59e0b' }}>SMA20:</span>
              <span style={{ fontWeight: 600 }}>{currency}{pData.sma20?.toFixed(2)}</span>
            </div>
          )}
          {pData.sma50 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#a855f7' }}>SMA50:</span>
              <span style={{ fontWeight: 600 }}>{currency}{pData.sma50?.toFixed(2)}</span>
            </div>
          )}
          {pData.volume && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Volume:</span>
              <span style={{ fontWeight: 600 }}>{pData.volume?.toLocaleString()}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card" style={{ padding: '20px', width: '100%' }}>
      {/* Chart Top Bar with Timeframes and Indicator Toggles */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Timeframe Buttons */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '10px' }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange && onTimeframeChange(tf)}
              style={{
                background: timeframe === tf ? '#3b82f6' : 'transparent',
                color: timeframe === tf ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicator Toggles */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowSMA20(!showSMA20)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showSMA20 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: showSMA20 ? '#fbbf24' : '#64748b',
              border: `1px solid ${showSMA20 ? 'rgba(245, 158, 11, 0.3)' : 'transparent'}`,
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {showSMA20 ? <Eye size={14} /> : <EyeOff size={14} />} SMA20
          </button>

          <button
            onClick={() => setShowSMA50(!showSMA50)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showSMA50 ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: showSMA50 ? '#c084fc' : '#64748b',
              border: `1px solid ${showSMA50 ? 'rgba(168, 85, 247, 0.3)' : 'transparent'}`,
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {showSMA50 ? <Eye size={14} /> : <EyeOff size={14} />} SMA50
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showVolume ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: showVolume ? '#60a5fa' : '#64748b',
              border: `1px solid ${showVolume ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <BarChart2 size={14} /> Vol
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div style={{ height: '380px', width: '100%', position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(7, 9, 14, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(59, 130, 246, 0.2)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spinSlow 1s linear infinite',
                margin: '0 auto 10px'
              }} />
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading {symbol} candles...</p>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceLineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" vertical={false} />
            
            <XAxis
              dataKey="timestamp"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => {
                if (!val) return '';
                if (val.includes(' ')) {
                  const [d, t] = val.split(' ');
                  return timeframe === '1D' ? t : `${d.slice(5)} ${t}`;
                }
                return val.length > 5 ? val.slice(5) : val;
              }}
            />
            
            <YAxis
              yAxisId="price"
              stroke="#64748b"
              fontSize={11}
              domain={[Math.max(0, minPrice - yPadding), maxPrice + yPadding]}
              tickFormatter={(v) => `${currency}${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v.toFixed(0)}`}
              orientation="right"
              tickLine={false}
              axisLine={false}
            />

            {showVolume && (
              <YAxis
                yAxisId="volume"
                stroke="#475569"
                fontSize={10}
                orientation="left"
                domain={[0, 'dataMax * 3.5']}
                hide={true}
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            {/* Volume Bars */}
            {showVolume && (
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="rgba(56, 189, 248, 0.15)"
                radius={[4, 4, 0, 0]}
              />
            )}

            {/* SMA 50 Line */}
            {showSMA50 && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma50"
                stroke="#c084fc"
                strokeWidth={1.8}
                dot={false}
                name="SMA 50"
              />
            )}

            {/* SMA 20 Line */}
            {showSMA20 && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma20"
                stroke="#fbbf24"
                strokeWidth={1.8}
                dot={false}
                name="SMA 20"
              />
            )}

            {/* Close Price Main Line */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: '#38bdf8', stroke: '#07090e', strokeWidth: 2 }}
              name="Price"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
