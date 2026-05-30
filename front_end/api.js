/* ============================================================
   MockAI shared API layer
   ============================================================ */

(function () {
  const LOCAL_API_BASE = 'http://localhost:5000/api';

  function isLocalPage() {
    return ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  }

  function normalizeApiBase(base) {
    return String(base || '').trim().replace(/\/+$/, '');
  }

  function getConfiguredApiBase() {
    const savedBase = localStorage.getItem('mockai_api_base');
    const configuredBase = window.MOCKAI_API_BASE || savedBase;

    if (configuredBase) return normalizeApiBase(configuredBase);
    if (isLocalPage()) return LOCAL_API_BASE;

    return `${window.location.origin}/api`;
  }

  const API_BASE = getConfiguredApiBase();

  /* ---------- token helpers ---------- */
  const getToken = () => localStorage.getItem('mockai_token');
  const setToken = (token) => localStorage.setItem('mockai_token', token);
  const setUser = (user) => localStorage.setItem('mockai_user', JSON.stringify(user));
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('mockai_user'));
    } catch {
      return null;
    }
  };
  const clearAuth = () => {
    localStorage.removeItem('mockai_token');
    localStorage.removeItem('mockai_user');
  };
  const isLoggedIn = () => Boolean(getToken());

  function setApiBase(base) {
    localStorage.setItem('mockai_api_base', normalizeApiBase(base));
    window.location.reload();
  }

  /* ---------- core fetch wrapper ---------- */
  async function api(endpoint, options = {}) {
    const headers = new Headers(options.headers || {});
    const hasFormData = options.body instanceof FormData;

    if (!headers.has('Content-Type') && !hasFormData) {
      headers.set('Content-Type', 'application/json');
    }

    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      throw new Error(`Cannot reach the backend at ${API_BASE}. Check your backend deployment URL and CORS settings.`);
    }

    const text = await res.text();
    let data = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  }

  async function apiHealth() {
    return api('/health');
  }

  /* ---------- auth calls ---------- */
  async function authRegister(name, email, password, college, targetRole) {
    return api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, college, targetRole }),
    });
  }

  async function authLogin(email, password) {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function authVerifyEmail(token) {
    const data = await api(`/auth/verify-email/${encodeURIComponent(token)}`);
    if (data.token) setToken(data.token);
    if (data.user) setUser(data.user);
    return data;
  }

  async function authMe() {
    return api('/auth/me');
  }

  async function authForgotPassword(email) {
    return api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async function authResetPassword(token, password) {
    return api(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async function authUpdateProfile(updates) {
    return api('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async function authChangePassword(currentPassword, newPassword) {
    return api('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  /* ---------- interview calls ---------- */
  async function interviewStart(jobRole, company, interviewType, difficulty) {
    return api('/interviews/start', {
      method: 'POST',
      body: JSON.stringify({ jobRole, company, interviewType, difficulty }),
    });
  }

  async function interviewMessage(id, message) {
    return api(`/interviews/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async function interviewComplete(id, durationMinutes) {
    return api(`/interviews/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ durationMinutes }),
    });
  }

  async function interviewList(page = 1, limit = 10) {
    return api(`/interviews?page=${page}&limit=${limit}`);
  }

  async function interviewGet(id) {
    return api(`/interviews/${id}`);
  }

  async function interviewDelete(id) {
    return api(`/interviews/${id}`, { method: 'DELETE' });
  }

  /* ---------- dashboard calls ---------- */
  async function dashboardGet() {
    return api('/dashboard');
  }

  async function dashboardAnalytics(days = 30) {
    return api(`/dashboard/analytics?days=${days}`);
  }

  /* ---------- guards ---------- */
  function requireAuth() {
    if (!isLoggedIn()) window.location.href = 'index.html';
  }

  function redirectIfLoggedIn() {
    if (isLoggedIn()) window.location.href = '#dashboard';
  }

  /* ---------- toast notification ---------- */
  function showToast(message, type = 'info') {
    const existing = document.getElementById('toast-container');
    if (existing) existing.remove();

    const colors = {
      success: '#00ff88',
      error: '#ff5f5f',
      info: '#6C63FF',
      warning: '#FFB547',
    };
    const icons = {
      success: 'OK',
      error: '!',
      info: 'i',
      warning: '!',
    };

    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position:fixed;bottom:28px;right:28px;z-index:9999;
      background:rgba(13,20,40,0.95);border:1px solid ${colors[type]}44;
      border-left:3px solid ${colors[type]};border-radius:12px;
      padding:14px 20px;display:flex;align-items:center;gap:12px;
      font-family:'DM Sans',sans-serif;font-size:14px;color:#F0F2FF;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);max-width:360px;
      animation:slideInToast 0.3s ease;
    `;
    container.innerHTML = `
      <style>@keyframes slideInToast{from{transform:translateX(120%);opacity:0}to{transform:none;opacity:1}}</style>
      <span style="font-weight:800;color:${colors[type]}">${icons[type]}</span>
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:rgba(240,242,255,0.4);font-size:16px;cursor:pointer;padding:0 0 0 8px">x</button>
    `;
    document.body.appendChild(container);
    setTimeout(() => container?.remove(), 5000);
  }

  /* ---------- loading button helper ---------- */
  function setLoading(btn, loading, originalText) {
    if (!btn) return;

    if (loading) {
      btn.disabled = true;
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px"><span class="mini-spinner"></span>Loading...</span>`;
      return;
    }

    btn.disabled = false;
    btn.innerHTML = btn.dataset.original || originalText || btn.innerHTML;
  }

  const MockAI = {
    API_BASE,
    api,
    apiHealth,
    setApiBase,
    getToken,
    setToken,
    setUser,
    getUser,
    clearAuth,
    isLoggedIn,
    authRegister,
    authLogin,
    authVerifyEmail,
    authMe,
    authForgotPassword,
    authResetPassword,
    authUpdateProfile,
    authChangePassword,
    interviewStart,
    interviewMessage,
    interviewComplete,
    interviewList,
    interviewGet,
    interviewDelete,
    dashboardGet,
    dashboardAnalytics,
    requireAuth,
    redirectIfLoggedIn,
    showToast,
    setLoading,
  };

  Object.assign(window, MockAI);
  window.MockAI = MockAI;
})();
