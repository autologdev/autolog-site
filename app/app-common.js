// AutoLog Web App — Shared utilities (non-module, loaded via <script src>)
// Requires @supabase/supabase-js loaded first via CDN script tag

const SUPABASE_URL = 'https://dkpvxlxarsmiljnvnbck.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcHZ4bHhhcnNtaWxqbnZuYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzM4MzIsImV4cCI6MjA5MDAwOTgzMn0.WJTRE_xmudj--jWSoA3e4ggYVORrFpoarBUkeaQN1Bw'

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Auth ──────────────────────────────────────────────────────
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession()
  if (!session) { window.location.href = '/app/login.html'; return null }
  return session
}
async function getProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single()
  return data
}
function doSignOut() {
  sb.auth.signOut().then(() => { window.location.href = '/app/login.html' })
}

// ── Vehicle helpers ───────────────────────────────────────────
function vName(v) {
  if (v.nickname) return v.nickname
  return [v.year, v.make, v.model].filter(Boolean).join(' ') || v.registration || 'Vehicle'
}
function motStatus(v) {
  if (!v.mot_expiry) return { label: 'Unknown', colour: 'grey' }
  const days = Math.ceil((new Date(v.mot_expiry) - new Date()) / 86400000)
  if (days < 0) return { label: 'Expired', colour: 'red' }
  if (days <= 30) return { label: days + 'd left', colour: 'amber' }
  return { label: fmtDate(v.mot_expiry), colour: 'green' }
}
function taxStatus(v) {
  if (!v.tax_expiry) return { label: 'Unknown', colour: 'grey' }
  const days = Math.ceil((new Date(v.tax_expiry) - new Date()) / 86400000)
  if (days < 0) return { label: 'Expired', colour: 'red' }
  if (days <= 30) return { label: days + 'd left', colour: 'amber' }
  return { label: fmtDate(v.tax_expiry), colour: 'green' }
}

// ── Formatters ────────────────────────────────────────────────
function fmtMiles(n) { return n != null ? Number(n).toLocaleString('en-GB') + ' mi' : '—' }
function fmtGBP(n) { return n != null ? '£' + Number(n).toFixed(2) : '—' }
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Selected vehicle ──────────────────────────────────────────
function getVid() { return localStorage.getItem('al_vid') }
function setVid(id) { localStorage.setItem('al_vid', id) }

// ── Status pill ───────────────────────────────────────────────
function pill(label, colour) {
  const map = { green:'#34C759', amber:'#FF9500', red:'#FF3B30', grey:'#94a3b8', teal:'#1E7A8C' }
  const c = map[colour] || map.grey
  return `<span style="display:inline-block;padding:3px 10px;border-radius:100px;font-size:0.75rem;font-weight:600;color:${c};background:${c}18">${label}</span>`
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type) {
  const old = document.getElementById('al-toast'); if (old) old.remove()
  const c = type === 'error' ? '#FF3B30' : '#34C759'
  const el = document.createElement('div')
  el.id = 'al-toast'
  el.className = 'toast'
  el.style.borderLeft = '3px solid ' + c
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

// ── Sidebar HTML ──────────────────────────────────────────────
const PAGES = [
  { id:'dashboard', label:'Dashboard',   href:'/app/index.html',       icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' },
  { id:'fuel',      label:'Fuel Log',     href:'/app/fuel.html',        icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22V8a2 2 0 012-2h8a2 2 0 012 2v14M3 22h14M7 22V12h4v10"/><path d="M19 8l2 2-2 2M19 10h-2V6a2 2 0 00-2-2"/></svg>' },
  { id:'service',   label:'Service',      href:'/app/service.html',     icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>' },
  { id:'maintenance',label:'Maintenance', href:'/app/maintenance.html', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  { id:'documents', label:'Documents',    href:'/app/documents.html',   icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
  { id:'trips',     label:'Trips',        href:'/app/trips.html',       icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>' },
  { id:'settings',  label:'Settings',     href:'/app/settings.html',    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' },
]

function renderSidebar(active) {
  const items = PAGES.map(p => `
    <a href="${p.href}" class="sidebar-item${p.id===active?' active':''}" title="${p.label}">
      <span class="sidebar-icon">${p.icon}</span>
      <span class="sidebar-label">${p.label}</span>
    </a>`).join('')
  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <img src="/assets/logo.png" alt="AutoLog">
        <span class="sidebar-logo-text">AutoLog</span>
      </div>
      <nav class="sidebar-nav">${items}</nav>
      <div class="sidebar-footer">
        <button class="sidebar-item sidebar-signout" onclick="doSignOut()" title="Sign Out">
          <span class="sidebar-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg></span>
          <span class="sidebar-label">Sign Out</span>
        </button>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>`
}

function renderTopbar(title, vehicleName, extraHtml) {
  return `
    <div class="app-topbar">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="mobile-btn" id="mobile-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <span class="app-topbar-title">${title}</span>
      </div>
      <div class="app-topbar-right">
        ${vehicleName ? `<div class="vehicle-pill"><div class="vehicle-dot"></div><span>${vehicleName}</span></div>` : ''}
        ${extraHtml || ''}
      </div>
    </div>`
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebar-overlay')
  const mobileBtn = document.getElementById('mobile-btn')
  if (mobileBtn && sidebar && overlay) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open')
      overlay.classList.toggle('active')
    })
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open')
      overlay.classList.remove('active')
    })
  }
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(html, onClose) {
  const bg = document.createElement('div')
  bg.className = 'modal-bg'
  bg.innerHTML = `<div class="modal">${html}</div>`
  document.body.appendChild(bg)
  bg.addEventListener('click', e => { if (e.target === bg) { bg.remove(); onClose?.() } })
  bg.querySelector('.modal-close')?.addEventListener('click', () => { bg.remove(); onClose?.() })
  return bg
}

// ── Vehicle picker ────────────────────────────────────────────
function showVehiclePicker(vehicles, currentId, onSelect) {
  const html = `
    <div class="modal-head"><h2>Switch Vehicle</h2><button class="modal-close">✕</button></div>
    <div class="modal-body" style="padding-top:12px;">
      ${vehicles.map(v => `
        <button onclick="this.closest('.modal-bg')._select('${v.id}')" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:10px;border:2px solid ${v.id===currentId?'#1E7A8C':'transparent'};background:${v.id===currentId?'#E8F4F6':'#f8fafc'};cursor:pointer;font-family:inherit;margin-bottom:8px;">
          <div style="text-align:left;"><div style="font-size:0.9rem;font-weight:700;color:#0f172a;">${vName(v)}</div>${v.registration?`<div style="font-size:0.75rem;color:#94a3b8;font-family:monospace;margin-top:2px;">${v.registration.toUpperCase()}</div>`:''}</div>
          ${v.id===currentId?'<span style="color:#1E7A8C;font-weight:700;font-size:0.875rem;">✓</span>':''}
        </button>`).join('')}
    </div>`
  const bg = openModal(html)
  bg._select = id => { bg.remove(); onSelect(id) }
}
