import axios from 'axios';

// Base API URL: In production, dynamically uses VITE_API_URL; falls back to '/api' for local Vite dev proxy
const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer Token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trademind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      const isAuthEndpoint = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('trademind_token');
        localStorage.removeItem('trademind_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('trademind_token');
    localStorage.removeItem('trademind_user');
  },
  getCurrentUser: () => {
    const raw = localStorage.getItem('trademind_user');
    return raw ? JSON.parse(raw) : null;
  }
};

// Market Service
export const marketService = {
  getSymbols: () => api.get('/market/symbols'),
  getOverview: () => api.get('/market/overview'),
  getQuote: (symbol) => api.get(`/market/${symbol}`),
  getHistory: (symbol, timeframe = '1M', refresh = false) =>
    api.get(`/market/${symbol}/history`, { params: { timeframe, refresh } }),
};

// AI & Explainable Signals Service
export const aiService = {
  getAnalysis: (symbol) => api.get(`/ai/analysis/${symbol}`),
  getSignal: (symbol) => api.get(`/ai/signal/${symbol}`),
  getAllSignals: () => api.get('/ai/signals/all'),
  getPredictionHistory: (symbol, limit = 20) =>
    api.get(`/ai/predictions/history/${symbol}`, { params: { limit } }),
};

// Paper Trading Service
export const paperService = {
  placeTrade: (symbol, action, quantity, email) =>
    api.post('/paper/trade', { symbol, action, quantity, email }),
  getHistory: (email) => api.get(`/paper/history/${email}`),
  getPortfolio: (email) => api.get(`/paper/portfolio/${email}`),
  getHoldings: (email) => api.get(`/paper/holdings/${email}`),
};

// Portfolio Management Service
export const portfolioService = {
  getSummary: (email) => api.get(`/portfolio/summary/${email}`),
  resetPortfolio: (email) => api.post(`/portfolio/reset/${email}`),
};

// Backtesting Lab Service
export const backtestService = {
  runBacktest: (data) => api.post('/backtest', data),
  getBacktestById: (id) => api.get(`/backtest/${id}`),
  getBacktestHistory: (email) => api.get(`/backtest/history/${email}`),
};

// Watchlist Service
export const watchlistService = {
  getWatchlist: (email) => api.get('/watchlist', { params: { email } }),
  addToWatchlist: (symbol, email) => api.post('/watchlist', { symbol, email }),
  removeFromWatchlist: (symbol, email) =>
    api.delete(`/watchlist/${symbol}`, { params: { email } }),
};

// Smart Alerts Service
export const alertService = {
  getAlerts: (email) => api.get('/alerts', { params: { email } }),
  createAlert: (data) => api.post('/alerts', data),
  deleteAlert: (id, email) => api.delete(`/alerts/${id}`, { params: { email } }),
  checkAlerts: (email) => api.post('/alerts/check', null, { params: { email } }),
};

// AI Copilot Chatbot Service
export const chatService = {
  sendMessage: (message, email) => api.post('/chat/message', { message, email }),
  getHistory: (email) => api.get(`/chat/history/${email}`),
  clearHistory: (email) => api.delete(`/chat/history/${email}`),
};

export default api;
