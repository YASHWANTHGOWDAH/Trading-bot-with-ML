import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Minimize2,
  TrendingUp,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { chatService } from '../services/api';

const QUICK_CHIPS = [
  'Analyze AAPL 📊',
  'What is NVDA signal? 🟢',
  'Check my Portfolio 💼',
  'Explain RSI & MACD 📈',
  'How does ML predict? 🧠',
];

export default function ChatbotWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const email = user?.email || 'demo@trademind.ai';

  // Load chat history from MongoDB on open
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, email]);

  const loadHistory = async () => {
    try {
      const res = await chatService.getHistory(email);
      if (res.data.history && res.data.history.length > 0) {
        setMessages(res.data.history);
      } else {
        // Initial welcome message
        setMessages([
          {
            sender: 'bot',
            message:
              "👋 Welcome to **TradeMind AI Copilot**! I am your real-time quantitative assistant.\n\nAsk me about any stock's AI signal, technical indicators, or your paper trading portfolio.",
            metadata: {},
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const handleSend = async (textToSend = inputValue) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMsg = {
      sender: 'user',
      message: text,
      metadata: {},
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await chatService.sendMessage(text, email);
      const botMsg = {
        sender: 'bot',
        message: res.data.response,
        metadata: res.data.metadata || {},
        timestamp: res.data.timestamp || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          message:
            '⚠️ Sorry, I encountered an issue connecting to the AI analytics server. Please make sure the backend is active and try again.',
          metadata: {},
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await chatService.clearHistory(email);
      setMessages([
        {
          sender: 'bot',
          message: 'Conversation cleared! How can I assist your trading research now?',
          metadata: {},
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  // Render markdown-like simple formatting (bold, bullet points)
  const renderFormattedText = (txt) => {
    if (!txt) return null;
    const lines = txt.split('\n');
    return lines.map((line, idx) => {
      // Check for bullet lines
      const isBullet = line.startsWith('• ') || line.startsWith('- ') || line.startsWith('✓ ');
      const cleanLine = isBullet ? line.substring(2) : line;

      // Simple bold replacer
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: '#f8fafc' }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px', color: '#38bdf8' }}>
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      return (
        <div key={idx} style={{ marginBottom: line === '' ? '6px' : '3px', lineHeight: 1.45 }}>
          {isBullet && <span style={{ color: '#38bdf8', marginRight: '6px' }}>•</span>}
          {formattedParts}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '999px',
          padding: '12px 20px',
          boxShadow: '0 8px 30px rgba(6, 182, 212, 0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '14px',
          transition: 'all 0.25s ease',
          transform: isOpen ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Bot size={22} />
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%',
            boxShadow: '0 0 8px #10b981'
          }} />
        </div>
        <span>{isOpen ? 'Close AI Copilot' : 'TradeMind AI Copilot'}</span>
      </button>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          className="glass-card"
          style={{
            position: 'fixed',
            bottom: '86px',
            right: '24px',
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: '590px',
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            background: 'rgba(10, 15, 29, 0.95)',
          }}
        >
          {/* Modal Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Cpu size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  TradeMind AI Copilot
                  <span style={{
                    fontSize: '9px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    TRAINED
                  </span>
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Real-time Explainable Market Intelligence
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleClearHistory}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear conversation"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '10px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            background: 'rgba(0, 0, 0, 0.2)',
            scrollbarWidth: 'none'
          }}>
            {QUICK_CHIPS.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSend(chip.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim())}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              const meta = msg.metadata || {};

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    maxWidth: '90%',
                    flexDirection: isUser ? 'row-reverse' : 'row'
                  }}>
                    {/* Avatar Icon */}
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isUser ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {isUser ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    {/* Message Bubble */}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isUser ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'rgba(15, 23, 42, 0.75)',
                      border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#f8fafc',
                      fontSize: '12.5px',
                    }}>
                      {renderFormattedText(msg.message)}

                      {/* Stock Metadata Badge if present */}
                      {meta.signal && (
                        <div style={{
                          marginTop: '8px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: meta.signal === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : (meta.signal === 'SELL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                          border: `1px solid ${meta.signal === 'BUY' ? 'rgba(16, 185, 129, 0.3)' : (meta.signal === 'SELL' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)')}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}>
                          <span style={{ fontWeight: 800, color: meta.signal === 'BUY' ? '#10b981' : (meta.signal === 'SELL' ? '#ef4444' : '#f59e0b') }}>
                            {meta.signal === 'BUY' ? '🟢 BUY' : (meta.signal === 'SELL' ? '🔴 SELL' : '🟡 HOLD')} ({meta.confidence}%)
                          </span>
                          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                            ₹{meta.price?.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    color: '#64748b',
                    marginTop: '3px',
                    marginRight: isUser ? '34px' : '0px',
                    marginLeft: !isUser ? '34px' : '0px'
                  }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              );
            })}

            {/* Typing Loader */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Bot size={14} />
                </div>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '14px 14px 14px 2px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '6px', height: '6px', background: '#38bdf8', borderRadius: '50%', animation: 'pulseGlow 1s infinite' }} />
                  <span style={{ width: '6px', height: '6px', background: '#818cf8', borderRadius: '50%', animation: 'pulseGlow 1.2s infinite' }} />
                  <span style={{ width: '6px', height: '6px', background: '#c084fc', borderRadius: '50%', animation: 'pulseGlow 1.4s infinite' }} />
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>Analyzing indicators...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.9)',
          }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about AAPL, indicators, portfolio..."
                className="input-field"
                style={{ fontSize: '13px', padding: '10px 14px' }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="btn-primary"
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  opacity: !inputValue.trim() || loading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
