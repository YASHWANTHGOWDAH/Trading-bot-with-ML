import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Cpu,
  Repeat,
  PieChart,
  FlaskConical,
  Bookmark,
  Bell,
  Settings,
  LogOut,
  LogIn,
  Menu,
  X,
  Wallet,
} from 'lucide-react';
import { authService } from '../services/api';

export default function Navbar({ user, portfolio, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Markets', path: '/markets', icon: <TrendingUp size={18} /> },
    { name: 'AI Analyst', path: '/ai-analyst', icon: <Cpu size={18} /> },
    { name: 'Paper Trading', path: '/paper-trading', icon: <Repeat size={18} /> },
    { name: 'Portfolio', path: '/portfolio', icon: <PieChart size={18} /> },
    { name: 'Backtest Lab', path: '/backtest', icon: <FlaskConical size={18} /> },
    { name: 'Watchlist', path: '/watchlist', icon: <Bookmark size={18} /> },
    { name: 'Alerts', path: '/alerts', icon: <Bell size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  const handleLogout = () => {
    authService.logout();
    if (onLogout) onLogout();
    navigate('/login');
  };

  const virtualCash = portfolio?.cash ?? 100000;

  return (
    <>
      {/* Top Header Navbar */}
      <header className="glass-panel" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
              }}>
                <Cpu size={22} color="#ffffff" />
              </div>
              <div>
                <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  TradeMind <span style={{ color: '#38bdf8' }}>AI</span>
                </span>
                <span style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>
                  EXPLAINABLE ML PLATFORM
                </span>
              </div>
            </NavLink>
          </div>

          {/* Desktop Nav Links */}
          <nav style={{ display: 'none', gap: '6px', alignItems: 'center' }} className="desktop-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                })}
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Items: Cash Balance & User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Virtual Cash Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '6px 14px',
              borderRadius: '999px',
            }}>
              <Wallet size={16} color="#10b981" />
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', lineHeight: 1 }}>Virtual Cash</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                  ₹{Number(virtualCash).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* User Session / Auth */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#ffffff'
                }} title={user.email}>
                  {user.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Logout"
                >
                  <LogOut size={14} />
                  <span style={{ display: 'none' }} className="desktop-only">Logout</span>
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
                <LogIn size={15} />
                Sign In
              </NavLink>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                cursor: 'pointer',
                display: 'block'
              }}
              className="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
                })}
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Responsive Inline CSS overrides for Desktop / Mobile viewports */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-toggle {
            display: none !important;
          }
          .desktop-only {
            display: inline !important;
          }
        }
      `}</style>
    </>
  );
}
