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

// ── Plan helpers ─────────────────────────────────────────────
async function getUserPlan(userId) {
  const { data } = await sb.from('profiles').select('plan').eq('id', userId).single()
  return data?.plan || 'free'
}
function isPro(plan) { return plan === 'paid' || plan === 'business' }

// ── Analytics ─────────────────────────────────────────────────
// CONSENT GATED: logEvent silently does nothing if analytics consent has not been granted.
// This is required under UK GDPR + PECR: analytics inserts are pseudonymous user-level
// processing and require affirmative consent before firing.
async function logEvent(userId, eventName, properties = {}) {
  // Gate: do nothing if consent module is absent or consent not granted
  if (!window.AutoLogConsent || !window.AutoLogConsent.hasAnalyticsConsent()) return
  try {
    await sb.from('analytics_events').insert({
      user_id: userId,
      event_name: eventName,
      properties
    })
  } catch (e) { /* silent */ }
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

// ═══════════════════════════════════════════════════════════
// ═══ LAUNCH v2 ADDITIONS — premium gating, usage, UI utils ═══
// ═══════════════════════════════════════════════════════════

// ── Upload / usage counter (shared with iOS via api_usage table) ──
// Mirrors APIUsageTracker semantics on iOS. Service is always 'ocr' —
// that single counter is the shared ceiling across iOS scans and web manual entries.
// On web, EVERY manual add (fuel/service/doc) that counts toward the limit calls this.
async function checkWebUsage(userId, plan) {
  const year = new Date().getFullYear()
  const limit = isPro(plan) ? 120 : 80
  try {
    const { data } = await sb
      .from('api_usage')
      .select('call_count')
      .eq('user_id', userId)
      .eq('service', 'ocr')
      .eq('year', year)
      .is('month', null)
    const total = (data || []).reduce((s, r) => s + (r.call_count || 0), 0)
    return {
      allowed: total < limit,
      used: total,
      limit,
      remaining: Math.max(0, limit - total),
      plan: isPro(plan) ? 'pro' : 'free',
    }
  } catch (e) {
    // On error, fail open (don't block legit users)
    return { allowed: true, used: 0, limit, remaining: limit, plan: isPro(plan) ? 'pro' : 'free' }
  }
}

async function recordWebUsage(userId) {
  const year = new Date().getFullYear()
  try {
    const { data: existing } = await sb
      .from('api_usage')
      .select('id,call_count')
      .eq('user_id', userId)
      .eq('service', 'ocr')
      .eq('year', year)
      .is('month', null)
      .maybeSingle()
    if (existing) {
      await sb.from('api_usage').update({
        call_count: (existing.call_count || 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await sb.from('api_usage').insert({
        user_id: userId,
        service: 'ocr',
        year,
        month: null,
        call_count: 1,
      })
    }
  } catch (e) { /* silent */ }
}

// ── Vehicle lock logic (mirrors iOS DowngradeManager) ────────
// Rule: if user is free AND owns >= 2 vehicles, keep the most recently UPDATED
// owned vehicle unlocked; lock all other OWNED vehicles.
// Shared vehicles are never "locked" in the lockedVehicleIDs set — their write-
// access is controlled separately via isSharedReadOnly() below.
function computeLockedVehicles(allVehicles, userId, plan) {
  if (isPro(plan)) return new Set()
  const owned = allVehicles.filter(v => v.owner_id === userId)
  if (owned.length <= 1) return new Set()
  // Most-recently-updated owned vehicle stays unlocked
  const sorted = [...owned].sort((a, b) => {
    const au = new Date(a.updated_at || a.created_at || 0).getTime()
    const bu = new Date(b.updated_at || b.created_at || 0).getTime()
    return bu - au
  })
  return new Set(sorted.slice(1).map(v => v.id))
}

// A shared vehicle is view-only for a free user IF they already have >= 1 own vehicle.
// Returns the *write-blocked* state, not the whole-lock state — shared vehicles
// should remain viewable; only writes are blocked.
function isSharedVehicleReadOnly(vehicle, ownVehicleCount, plan, userId) {
  if (isPro(plan)) return false
  if (vehicle.owner_id === userId) return false // not a shared vehicle
  return ownVehicleCount >= 1
}

// Convenience: returns the overall access state for a vehicle+user pair.
// { canView, canWrite, reason }
function vehicleAccess(vehicle, allVehicles, userId, plan) {
  if (isPro(plan)) {
    return { canView: true, canWrite: vehicle.owner_id === userId || true, reason: null }
  }
  const locked = computeLockedVehicles(allVehicles, userId, plan)
  const ownedCount = allVehicles.filter(v => v.owner_id === userId).length
  if (locked.has(vehicle.id)) {
    return { canView: true, canWrite: false, reason: 'locked_owned' }
  }
  if (vehicle.owner_id !== userId && isSharedVehicleReadOnly(vehicle, ownedCount, plan, userId)) {
    return { canView: true, canWrite: false, reason: 'locked_shared' }
  }
  return { canView: true, canWrite: true, reason: null }
}

// ── Sparkline SVG generator ───────────────────────────────
function sparkline(values, opts = {}) {
  if (!values || values.length < 2) return ''
  const width = opts.width || 80
  const height = opts.height || 14
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 1.5
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return `<svg class="stat-mini-sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><polyline points="${pts}"/></svg>`
}

// ── Paywall / upgrade modals ──────────────────────────────
function showUpgradeInAppModal(source) {
  const html = `
    <div class="mh">
      <h2>AutoLog+ is managed in the iOS app</h2>
      <button class="mc" onclick="this.closest('.mbg').remove()">✕</button>
    </div>
    <div class="mb">
      <div style="text-align:center;padding:6px 0 18px;">
        <div style="width:56px;height:56px;background:var(--teal-light);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;color:var(--teal);">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <p style="font-size:.9375rem;color:var(--text-secondary);line-height:1.65;max-width:360px;margin:0 auto 6px;">AutoLog+ is sold through the App Store and managed by Apple. To subscribe, open AutoLog on your iPhone and tap <strong>Settings → Upgrade to AutoLog+</strong>.</p>
        <p style="font-size:.8125rem;color:var(--text-muted);max-width:360px;margin:0 auto 20px;">Once subscribed, everything unlocks here too — instantly.</p>
      </div>
      <div class="mfooter" style="justify-content:center;gap:10px;">
        <a href="https://apps.apple.com/gb/app/autolog/id6746798513" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Open App Store</a>
        <button class="btn btn-ghost btn-sm" onclick="this.closest('.mbg').remove()">Close</button>
      </div>
    </div>`
  const bg = openModal(html)
  // consent-gated analytics (track where the paywall was triggered)
  try {
    const userId = window.__al_userId
    if (userId && source) logEvent(userId, 'paywall_viewed', { source: 'web', trigger: source })
  } catch (e) {}
  return bg
}

function showUsageLimitModal(usage, source) {
  const over = usage.used >= usage.limit
  const html = `
    <div class="mh">
      <h2>${over ? 'Upload limit reached' : 'Approaching upload limit'}</h2>
      <button class="mc" onclick="this.closest('.mbg').remove()">✕</button>
    </div>
    <div class="mb">
      <p style="font-size:.875rem;color:var(--text-secondary);line-height:1.65;margin-bottom:14px;">
        ${over
          ? `You've used all ${usage.limit} of your uploads for this year.`
          : `You have ${usage.remaining} upload${usage.remaining === 1 ? '' : 's'} left this year.`}
        ${usage.plan === 'free'
          ? 'Upgrading to AutoLog+ gives you 120 uploads per vehicle per year.'
          : 'Your quota resets on 1 January.'}
      </p>
      <div style="background:var(--surface-2);border-radius:10px;padding:14px 16px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
          <span style="font-size:.8125rem;color:var(--text-secondary);font-weight:600;">This year</span>
          <span style="font-size:.875rem;color:var(--text-primary);font-weight:700;font-family:var(--font-mono);">${usage.used} / ${usage.limit}</span>
        </div>
        <div class="usage-bar"><div class="usage-bar-fill ${over ? 'danger' : usage.used / usage.limit > 0.8 ? 'warn' : ''}" style="width:${Math.min(100, (usage.used / usage.limit) * 100)}%"></div></div>
      </div>
      <div class="mfooter" style="justify-content:center;gap:10px;">
        ${usage.plan === 'free'
          ? `<button class="btn btn-primary btn-sm" onclick="this.closest('.mbg').remove();showUpgradeInAppModal('${source || 'upload_limit'}')">Upgrade in iOS app →</button>`
          : ''}
        <button class="btn btn-ghost btn-sm" onclick="this.closest('.mbg').remove()">Close</button>
      </div>
    </div>`
  const bg = openModal(html)
  try {
    const userId = window.__al_userId
    if (userId) logEvent(userId, 'upload_limit_shown', { source: 'web', trigger: source, plan: usage.plan, used: usage.used, limit: usage.limit })
  } catch (e) {}
  return bg
}

// ── Locked-vehicle banner (inline, shown when viewing a locked vehicle) ──
function lockedBannerHTML(reason) {
  const msg = reason === 'locked_shared'
    ? 'This vehicle is shared with you. While on the free plan with your own vehicle, shared vehicles are view-only.'
    : "You've been using AutoLog+ with more than one vehicle. Upgrade to unlock write access to all your vehicles again."
  return `
    <div class="locked-banner">
      <div class="locked-banner-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h3>AutoLog+ required</h3>
      <p>${msg}</p>
      <button class="btn btn-primary btn-sm" onclick="showUpgradeInAppModal('locked_vehicle')">Upgrade in iOS app →</button>
    </div>`
}

// ── Vehicle pill renderer (respects lock + shared annotations) ──
function renderVehicleTag(vehicle, userId, locked) {
  if (locked) return `<span class="vsw-tag locked">Locked</span>`
  if (vehicle.owner_id !== userId) return `<span class="vsw-tag shared">Shared</span>`
  return ''
}

// Expose utilities on window so page scripts can call them after loading
window.checkWebUsage = checkWebUsage
window.recordWebUsage = recordWebUsage
window.computeLockedVehicles = computeLockedVehicles
window.isSharedVehicleReadOnly = isSharedVehicleReadOnly
window.vehicleAccess = vehicleAccess
window.sparkline = sparkline
window.showUpgradeInAppModal = showUpgradeInAppModal
window.showUsageLimitModal = showUsageLimitModal
window.lockedBannerHTML = lockedBannerHTML
window.renderVehicleTag = renderVehicleTag
window.isPro = isPro
