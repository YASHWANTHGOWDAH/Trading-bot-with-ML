import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Eye, EyeOff, BarChart2, CandlestickChart, TrendingUp, Layers } from 'lucide-react';

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y'];

// Custom Candlestick shape for Recharts
const CandlestickBar = (props) => {
  const { x, y, width, height, payload } = props;
  if (!payload || x === undefined || y === undefined || width <= 0) return null;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#ef4444';
  const candleBodyRange = Math.abs(close - open);
  
  // Calculate vertical scaling ratio (pixels per price unit)
  const scale = candleBodyRange > 0.0001 ? height / candleBodyRange : 1;
  const upperWickHeight = (high - Math.max(open, close)) * scale;
  const lowerWickHeight = (Math.min(open, close) - low) * scale;
  
  const wickX = x + width / 2;
  const wickTop = y - Math.max(0, upperWickHeight);
  const wickBottom = y + height + Math.max(0, lowerWickHeight);
  const candleWidth = Math.max(3, Math.min(width - 2, 14));
  const candleX = x + (width - candleWidth) / 2;
  const safeHeight = Math.max(2, height);

  return (
    <g>
      {/* Upper & Lower Wick Line */}
      <line
        x1={wickX}
        y1={wickTop}
        x2={wickX}
        y2={wickBottom}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Candle Body Rect */}
      <rect
        x={candleX}
        y={y}
        width={candleWidth}
        height={safeHeight}
        fill={color}
        stroke={color}
        rx={1}
      />
    </g>
  );
};

// Custom OHLC Bar shape
const OHLCBarShape = (props) => {
  const { x, y, width, height, payload } = props;
  if (!payload || x === undefined || y === undefined) return null;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#ef4444';
  const candleBodyRange = Math.abs(close - open);
  const scale = candleBodyRange > 0.0001 ? height / candleBodyRange : 1;
  
  const wickX = x + width / 2;
  const wickTop = y - Math.max(0, (high - Math.max(open, close)) * scale);
  const wickBottom = y + height + Math.max(0, (Math.min(open, close) - low) * scale);
  const yOpen = isUp ? y + height : y;
  const yClose = isUp ? y : y + height;
  const tickWidth = Math.max(3, Math.min(width / 2, 6));

  return (
    <g>
      {/* High to Low vertical line */}
      <line x1={wickX} y1={wickTop} x2={wickX} y2={wickBottom} stroke={color} strokeWidth={1.5} />
      {/* Open Tick (Left) */}
      <line x1={wickX - tickWidth} y1={yOpen} x2={wickX} y2={yOpen} stroke={color} strokeWidth={1.5} />
      {/* Close Tick (Right) */}
      <line x1={wickX} y1={yClose} x2={wickX + tickWidth} y2={yClose} stroke={color} strokeWidth={1.5} />
    </g>
  );
};

export default function StockChart({
  symbol,
  data = [],
  timeframe = '1M',
  onTimeframeChange,
  isLoading = false,
  currency = '₹',
}) {
  const [chartType, setChartType] = useState('candles'); // 'candles' | 'line' | 'area' | 'bars'
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // Format data with safe numbers and candle body ranges
  const chartData = useMemo(() => {
    return (data || []).map((d) => {
      const o = Number(d.open ?? d.close ?? 0);
      const c = Number(d.close ?? d.open ?? 0);
      const h = Number(d.high ?? Math.max(o, c));
      const l = Number(d.low ?? Math.min(o, c));
      const isUp = c >= o;
      const chg = c - o;
      const chgPct = o > 0 ? (chg / o) * 100 : 0;
      
      return {
        ...d,
        open: o,
        close: c,
        high: h,
        low: l,
        candleBody: [Math.min(o, c), Math.max(o, c)],
        isUp,
        changeAmt: chg,
        changePct: chgPct,
      };
    });
  }, [data]);

  // Compute domain bounds for smooth dynamic scaling
  const minPrice = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.min(...chartData.map((d) => d.low || d.close || 0));
  }, [chartData]);

  const maxPrice = useMemo(() => {
    if (chartData.length === 0) return 100;
    return Math.max(...chartData.map((d) => d.high || d.close || 100));
  }, [chartData]);

  const yPadding = (maxPrice - minPrice) * 0.08 || 5;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      const isUp = pData.close >= pData.open;
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
          fontSize: '12px',
          minWidth: '200px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            <span style={{ fontWeight: 700, color: '#94a3b8' }}>{pData.timestamp || label}</span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              background: isUp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isUp ? '#10b981' : '#ef4444'
            }}>
              {isUp ? '+' : ''}{pData.changePct ? pData.changePct.toFixed(2) : '0.00'}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginBottom: '8px' }}>
            <div><span style={{ color: '#64748b' }}>Open: </span><strong>{currency}{pData.open?.toFixed(2)}</strong></div>
            <div><span style={{ color: '#64748b' }}>High: </span><strong style={{ color: '#10b981' }}>{currency}{pData.high?.toFixed(2)}</strong></div>
            <div><span style={{ color: '#64748b' }}>Low: </span><strong style={{ color: '#ef4444' }}>{currency}{pData.low?.toFixed(2)}</strong></div>
            <div><span style={{ color: '#64748b' }}>Close: </span><strong style={{ color: '#38bdf8' }}>{currency}{pData.close?.toFixed(2)}</strong></div>
          </div>

          {(pData.sma20 || pData.sma50) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginBottom: '4px' }}>
              {pData.sma20 && <div><span style={{ color: '#fbbf24' }}>SMA20: </span>{currency}{pData.sma20?.toFixed(2)}</div>}
              {pData.sma50 && <div><span style={{ color: '#c084fc' }}>SMA50: </span>{currency}{pData.sma50?.toFixed(2)}</div>}
            </div>
          )}

          {pData.volume && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px' }}>
              <span style={{ color: '#64748b' }}>Volume:</span>
              <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{Number(pData.volume).toLocaleString()}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card" style={{ padding: '20px', width: '100%' }}>
      {/* Chart Top Bar with Timeframes, Chart Type, and Indicator Toggles */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Timeframe Buttons */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '10px' }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange && onTimeframeChange(tf)}
              style={{
                background: timeframe === tf ? '#3b82f6' : 'transparent',
                color: timeframe === tf ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '7px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart View Modes: Candles, Line, Area, Bars */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '10px' }}>
          <button
            onClick={() => setChartType('candles')}
            title="Candlestick Chart"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: chartType === 'candles' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: chartType === 'candles' ? '#10b981' : '#94a3b8',
              border: chartType === 'candles' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
              borderRadius: '7px',
              padding: '5px 9px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <CandlestickChart size={13} />
            <span>Candles</span>
          </button>

          <button
            onClick={() => setChartType('bars')}
            title="OHLC Bar Chart"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: chartType === 'bars' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: chartType === 'bars' ? '#38bdf8' : '#94a3b8',
              border: chartType === 'bars' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              borderRadius: '7px',
              padding: '5px 9px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <BarChart2 size={13} />
            <span>Bars</span>
          </button>

          <button
            onClick={() => setChartType('line')}
            title="Line Chart"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: chartType === 'line' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: chartType === 'line' ? '#60a5fa' : '#94a3b8',
              border: chartType === 'line' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
              borderRadius: '7px',
              padding: '5px 9px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <TrendingUp size={13} />
            <span>Line</span>
          </button>

          <button
            onClick={() => setChartType('area')}
            title="Mountain Area Chart"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: chartType === 'area' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: chartType === 'area' ? '#c084fc' : '#94a3b8',
              border: chartType === 'area' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
              borderRadius: '7px',
              padding: '5px 9px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Layers size={13} />
            <span>Area</span>
          </button>
        </div>

        {/* Indicator Toggles */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => setShowSMA20(!showSMA20)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: showSMA20 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: showSMA20 ? '#fbbf24' : '#64748b',
              border: `1px solid ${showSMA20 ? 'rgba(245, 158, 11, 0.3)' : 'transparent'}`,
              borderRadius: '8px',
              padding: '5px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {showSMA20 ? <Eye size={12} /> : <EyeOff size={12} />} SMA20
          </button>

          <button
            onClick={() => setShowSMA50(!showSMA50)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: showSMA50 ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: showSMA50 ? '#c084fc' : '#64748b',
              border: `1px solid ${showSMA50 ? 'rgba(168, 85, 247, 0.3)' : 'transparent'}`,
              borderRadius: '8px',
              padding: '5px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {showSMA50 ? <Eye size={12} /> : <EyeOff size={12} />} SMA50
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: showVolume ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: showVolume ? '#38bdf8' : '#64748b',
              border: `1px solid ${showVolume ? 'rgba(56, 189, 248, 0.3)' : 'transparent'}`,
              borderRadius: '8px',
              padding: '5px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <BarChart2 size={12} /> Vol
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div style={{ height: '390px', width: '100%', position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(7, 9, 14, 0.75)',
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
                animation: 'spin 1s linear infinite',
                margin: '0 auto 10px'
              }} />
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading {symbol} candles...</p>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceLineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
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
                domain={[0, 'dataMax * 4']}
                hide={true}
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            {/* Volume Histogram Bars */}
            {showVolume && (
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="rgba(56, 189, 248, 0.14)"
                radius={[3, 3, 0, 0]}
              />
            )}

            {/* Candlestick Bars */}
            {chartType === 'candles' && (
              <Bar
                yAxisId="price"
                dataKey="candleBody"
                shape={<CandlestickBar />}
                isAnimationActive={false}
              />
            )}

            {/* OHLC Price Bars */}
            {chartType === 'bars' && (
              <Bar
                yAxisId="price"
                dataKey="candleBody"
                shape={<OHLCBarShape />}
                isAnimationActive={false}
              />
            )}

            {/* Area Fill View */}
            {chartType === 'area' && (
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#priceLineGrad)"
                name="Price Area"
              />
            )}

            {/* Line View */}
            {chartType === 'line' && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#38bdf8', stroke: '#07090e', strokeWidth: 2 }}
                name="Price"
              />
            )}

            {/* SMA 50 Line */}
            {showSMA50 && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma50"
                stroke="#c084fc"
                strokeWidth={1.6}
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
                strokeWidth={1.6}
                dot={false}
                name="SMA 20"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
