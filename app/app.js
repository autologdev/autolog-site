// ============================================================
//  AutoLog Web App — Shared JS
//  Supabase client, auth helpers, utilities
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://dkpvxlxarsmiljnvnbck.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcHZ4bHhhcnNtaWxqbnZuYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzM4MzIsImV4cCI6MjA5MDAwOTgzMn0.WJTRE_xmudj--jWSoA3e4ggYVORrFpoarBUkeaQN1Bw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Auth helpers ─────────────────────────────────────────────

export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = '/app/login.html'
    return null
  }
  return session
}

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/app/login.html'
}

// ── Vehicle helpers ──────────────────────────────────────────

export function getVehicleDisplayName(v) {
  if (v.nickname) return v.nickname
  const parts = [v.year, v.make, v.model].filter(Boolean)
  return parts.length ? parts.join(' ') : v.registration || 'Vehicle'
}

export function getMotStatus(v) {
  if (!v.mot_expiry) return { label: 'Unknown', colour: 'grey' }
  const today = new Date()
  const expiry = new Date(v.mot_expiry)
  const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: 'Expired', colour: 'red' }
  if (days <= 30) return { label: `${days}d`, colour: 'amber' }
  return { label: expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), colour: 'green' }
}

export function getTaxStatus(v) {
  if (!v.tax_expiry) return { label: 'Unknown', colour: 'grey' }
  const today = new Date()
  const expiry = new Date(v.tax_expiry)
  const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: 'Expired', colour: 'red' }
  if (days <= 30) return { label: `${days}d`, colour: 'amber' }
  return { label: expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), colour: 'green' }
}

export function formatMileage(n) {
  if (!n && n !== 0) return '—'
  return Number(n).toLocaleString('en-GB') + ' mi'
}

export function formatCurrency(n) {
  if (!n && n !== 0) return '—'
  return '£' + Number(n).toFixed(2)
}

export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Selected vehicle (persisted across pages) ────────────────

export function getSelectedVehicleId() {
  return localStorage.getItem('autolog_selected_vehicle')
}

export function setSelectedVehicleId(id) {
  localStorage.setItem('autolog_selected_vehicle', id)
}

// ── Status pill HTML ─────────────────────────────────────────

export function statusPill(label, colour) {
  const map = { green: '#34C759', amber: '#FF9500', red: '#FF3B30', grey: '#94a3b8' }
  const c = map[colour] || map.grey
  const bg = c + '18'
  return `<span style="display:inline-block;padding:3px 10px;border-radius:100px;font-size:0.75rem;font-weight:600;color:${c};background:${bg};">${label}</span>`
}

// ── Toast notifications ──────────────────────────────────────

export function showToast(message, type = 'success') {
  const existing = document.getElementById('al-toast')
  if (existing) existing.remove()
  const toast = document.createElement('div')
  toast.id = 'al-toast'
  const colour = type === 'success' ? '#34C759' : type === 'error' ? '#FF3B30' : '#FF9500'
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:#0f172a;color:#fff;padding:12px 20px;border-radius:10px;
    font-size:0.875rem;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,0.2);
    border-left:3px solid ${colour};max-width:320px;line-height:1.4;
    animation:slideUp 0.25s ease;
  `
  toast.textContent = message
  if (!document.getElementById('al-toast-style')) {
    const s = document.createElement('style')
    s.id = 'al-toast-style'
    s.textContent = '@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}'
    document.head.appendChild(s)
  }
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3500)
}

// ── Render sidebar ────────────────────────────────────────────

export function renderSidebar(activePage) {
  const pages = [
    { id: 'dashboard', label: 'Dashboard',     href: '/app/index.html',       icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
    { id: 'fuel',      label: 'Fuel Log',       href: '/app/fuel.html',        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22V8a2 2 0 012-2h8a2 2 0 012 2v14M3 22h14M7 22V12h4v10M19 8l2 2-2 2M19 10h-2V6a2 2 0 00-2-2"/></svg>` },
    { id: 'service',   label: 'Service',        href: '/app/service.html',     icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>` },
    { id: 'maintenance', label: 'Maintenance',  href: '/app/maintenance.html', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
    { id: 'documents', label: 'Documents',      href: '/app/documents.html',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>` },
    { id: 'trips',     label: 'Trips',          href: '/app/trips.html',       icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>` },
    { id: 'settings',  label: 'Settings',       href: '/app/settings.html',    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>` },
  ]

  const items = pages.map(p => `
    <a href="${p.href}" class="sidebar-item ${p.id === activePage ? 'active' : ''}" title="${p.label}">
      <span class="sidebar-icon">${p.icon}</span>
      <span class="sidebar-label">${p.label}</span>
    </a>
  `).join('')

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <img src="/assets/logo.png" alt="AutoLog" class="sidebar-logo-img">
        <span class="sidebar-logo-text">AutoLog</span>
      </div>
      <nav class="sidebar-nav">${items}</nav>
      <div class="sidebar-footer">
        <button class="sidebar-item sidebar-signout" id="signout-btn" title="Sign Out">
          <span class="sidebar-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </span>
          <span class="sidebar-label">Sign Out</span>
        </button>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
  `
}

// ── App shell CSS injected once ──────────────────────────────

export function injectAppStyles() {
  if (document.getElementById('al-app-styles')) return
  const s = document.createElement('style')
  s.id = 'al-app-styles'
  s.textContent = `
    /* ── App Layout ── */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc;
      color: #475569;
      -webkit-font-smoothing: antialiased;
      display: flex;
    }
    h1,h2,h3,h4,h5,h6 { color: #0f172a; font-weight: 700; line-height: 1.2; }
    a { text-decoration: none; color: inherit; }

    /* ── Sidebar ── */
    .sidebar {
      width: 64px;
      min-height: 100vh;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0; top: 0; bottom: 0;
      z-index: 200;
      transition: width 0.22s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
    }
    .sidebar:hover, .sidebar.expanded {
      width: 220px;
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      min-height: 68px;
      overflow: hidden;
    }
    .sidebar-logo-img {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      flex-shrink: 0;
      display: block;
    }
    .sidebar-logo-text {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      opacity: 0;
      transform: translateX(-8px);
      transition: opacity 0.18s 0.04s, transform 0.18s 0.04s;
    }
    .sidebar:hover .sidebar-logo-text,
    .sidebar.expanded .sidebar-logo-text {
      opacity: 1;
      transform: translateX(0);
    }
    .sidebar-nav {
      flex: 1;
      padding: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }
    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 18px;
      border-radius: 0;
      color: rgba(255,255,255,0.55);
      cursor: pointer;
      background: none;
      border: none;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      text-align: left;
      transition: color 0.15s, background 0.15s;
      white-space: nowrap;
      width: 100%;
      position: relative;
    }
    .sidebar-item:hover {
      color: #fff;
      background: rgba(255,255,255,0.06);
    }
    .sidebar-item.active {
      color: #fff;
      background: rgba(30,122,140,0.25);
    }
    .sidebar-item.active::before {
      content: '';
      position: absolute;
      left: 0; top: 8px; bottom: 8px;
      width: 3px;
      background: #1E7A8C;
      border-radius: 0 3px 3px 0;
    }
    .sidebar-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sidebar-icon svg {
      width: 18px;
      height: 18px;
    }
    .sidebar-label {
      opacity: 0;
      transform: translateX(-8px);
      transition: opacity 0.18s 0.04s, transform 0.18s 0.04s;
      pointer-events: none;
    }
    .sidebar:hover .sidebar-label,
    .sidebar.expanded .sidebar-label {
      opacity: 1;
      transform: translateX(0);
    }
    .sidebar-footer {
      padding: 12px 0;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .sidebar-signout { color: rgba(255,255,255,0.4); }
    .sidebar-signout:hover { color: #FF3B30; background: rgba(255,59,48,0.08); }
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 199;
    }

    /* ── Main content area ── */
    .app-main {
      flex: 1;
      margin-left: 64px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.22s cubic-bezier(0.4,0,0.2,1);
    }

    /* ── Top bar ── */
    .app-topbar {
      height: 64px;
      background: #fff;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 100;
      gap: 16px;
    }
    .app-topbar-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .app-topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* ── Vehicle switcher in topbar ── */
    .vehicle-switcher {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 8px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
      transition: background 0.15s;
    }
    .vehicle-switcher:hover { background: #E8F4F6; }
    .vehicle-switcher-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #1E7A8C;
      flex-shrink: 0;
    }

    /* ── Page content ── */
    .app-content {
      flex: 1;
      padding: 28px 28px 40px;
      max-width: 1200px;
      width: 100%;
    }
    .page-header {
      margin-bottom: 24px;
    }
    .page-header h1 {
      font-size: 1.5rem;
      letter-spacing: -0.02em;
    }
    .page-header p {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-top: 4px;
    }

    /* ── Cards ── */
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
      padding: 20px 22px;
    }
    .card-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
    }

    /* ── Stats grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #fff;
      border-radius: 14px;
      padding: 18px 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .stat-card-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-card-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .stat-card-sub {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 3px;
    }

    /* ── Table ── */
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th {
      text-align: left;
      padding: 10px 14px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .data-table td {
      padding: 13px 14px;
      font-size: 0.875rem;
      color: #334155;
      border-bottom: 1px solid rgba(0,0,0,0.04);
      vertical-align: middle;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f8fafc; }

    /* ── Forms ── */
    .form-group { margin-bottom: 18px; }
    .form-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid rgba(0,0,0,0.1);
      border-radius: 10px;
      font-size: 0.9375rem;
      font-family: inherit;
      color: #0f172a;
      background: #fff;
      transition: border-color 0.15s, box-shadow 0.15s;
      outline: none;
    }
    .form-input:focus {
      border-color: #1E7A8C;
      box-shadow: 0 0 0 3px rgba(30,122,140,0.1);
    }
    select.form-input { cursor: pointer; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

    /* ── Buttons ── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.18s;
      white-space: nowrap;
    }
    .btn:active { transform: translateY(1px); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #1E7A8C; color: #fff; border-color: #1E7A8C; }
    .btn-primary:hover:not(:disabled) { background: #155F6E; border-color: #155F6E; }
    .btn-outline { background: transparent; color: #1E7A8C; border-color: #1E7A8C; }
    .btn-outline:hover:not(:disabled) { background: #E8F4F6; }
    .btn-danger { background: transparent; color: #FF3B30; border-color: #FF3B30; }
    .btn-danger:hover:not(:disabled) { background: rgba(255,59,48,0.06); }
    .btn-sm { padding: 7px 14px; font-size: 0.8125rem; border-radius: 8px; }
    .btn-icon {
      width: 36px; height: 36px;
      padding: 0;
      border-radius: 9px;
      background: #f1f5f9;
      color: #64748b;
      border: none;
    }
    .btn-icon:hover { background: #E8F4F6; color: #1E7A8C; }

    /* ── Empty state ── */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #94a3b8;
    }
    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.4;
    }
    .empty-state h3 {
      font-size: 1.0625rem;
      color: #475569;
      margin-bottom: 8px;
    }
    .empty-state p { font-size: 0.875rem; }

    /* ── Modal ── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.15s ease;
    }
    .modal {
      background: #fff;
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.2);
      animation: slideUp 0.2s ease;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 22px 24px 0;
    }
    .modal-header h2 { font-size: 1.125rem; }
    .modal-close {
      width: 32px; height: 32px;
      border: none;
      background: #f1f5f9;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      color: #64748b;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .modal-close:hover { background: #E8F4F6; color: #1E7A8C; }
    .modal-body { padding: 20px 24px 24px; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

    /* ── Loading spinner ── */
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(30,122,140,0.15);
      border-top-color: #1E7A8C;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      gap: 16px;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    /* ── Badges ── */
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-green { background: rgba(52,199,89,0.12); color: #1a9c3e; }
    .badge-amber { background: rgba(255,149,0,0.12); color: #b36a00; }
    .badge-red   { background: rgba(255,59,48,0.12);  color: #cc1a12; }
    .badge-grey  { background: #f1f5f9; color: #64748b; }
    .badge-teal  { background: #E8F4F6; color: #1E7A8C; }

    /* ── Mobile sidebar ── */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        width: 240px !important;
        transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
      }
      .sidebar.mobile-open {
        transform: translateX(0);
      }
      .sidebar .sidebar-label { opacity: 1 !important; transform: none !important; }
      .sidebar .sidebar-logo-text { opacity: 1 !important; transform: none !important; }
      .sidebar-overlay.active { display: block; }
      .app-main { margin-left: 0; }
      .mobile-menu-btn { display: flex !important; }
      .app-content { padding: 20px 16px 32px; }
    }

    /* Mobile topbar menu button */
    .mobile-menu-btn {
      display: none;
      width: 36px; height: 36px;
      background: #f1f5f9;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      color: #0f172a;
      flex-shrink: 0;
    }

    /* ── Misc ── */
    .divider { border: none; border-top: 1px solid rgba(0,0,0,0.06); margin: 20px 0; }
    .text-muted { color: #94a3b8; }
    .text-sm { font-size: 0.875rem; }
    .font-mono { font-family: 'SF Mono', 'Fira Code', monospace; }
    .gap-4 { gap: 16px; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .w-full { width: 100%; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 600px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `
  document.head.appendChild(s)
}

// ── Init sidebar interactivity ────────────────────────────────

export function initSidebar() {
  const signoutBtn = document.getElementById('signout-btn')
  if (signoutBtn) signoutBtn.addEventListener('click', signOut)

  const overlay = document.getElementById('sidebar-overlay')
  const sidebar = document.getElementById('sidebar')
  const mobileBtn = document.getElementById('mobile-menu-btn')

  if (mobileBtn && sidebar && overlay) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open')
      overlay.classList.toggle('active')
    })
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open')
      overlay.classList.remove('active')
    })
  }
}
