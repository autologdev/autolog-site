// AutoLog — Website Analytics Tracker
// =====================================
// Direct-insert, consent-gated, pseudonymous analytics for autologapp.co.uk.
// No third-party SDKs. All events go to our own Supabase analytics_events table.
//
// Privacy model:
//   - Gated on window.AutoLogConsent.hasAnalyticsConsent() — silent no-op if not granted
//   - Emails and reg plates are SHA-256 hashed client-side before transmission
//   - Anonymous ID is a first-party UUID in localStorage (our domain only)
//   - Session ID is a first-party UUID in sessionStorage (rotates per tab/session)
//   - No third-party cookies, no fingerprinting, no IP capture
//
// Loading: include AFTER consent.js. Works on any public page. Exposes
// window.AutoLogTrack with track(), pageView(), hash().

;(function () {
  'use strict'

  var SB_URL = 'https://dkpvxlxarsmiljnvnbck.supabase.co'
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcHZ4bHhhcnNtaWxqbnZuYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzM4MzIsImV4cCI6MjA5MDAwOTgzMn0.WJTRE_xmudj--jWSoA3e4ggYVORrFpoarBUkeaQN1Bw'

  var ENDPOINT = SB_URL + '/rest/v1/analytics_events'

  // ── Storage keys (all first-party, our domain) ───────────────────────────
  var K_ANON_ID     = 'al_anon_id'      // localStorage — persists across sessions
  var K_SESSION_ID  = 'al_session_id'   // sessionStorage
  var K_SESSION_TS  = 'al_session_ts'   // localStorage — last-seen timestamp
  var K_UTM         = 'al_utm'          // sessionStorage — first-touch UTMs this session
  var K_FIRST_TOUCH = 'al_first_touch'  // localStorage — first-ever UTMs
  var K_PAGE_START  = 'al_page_start'   // sessionStorage — current page load time
  var SESSION_IDLE_MS = 30 * 60 * 1000  // 30 minutes

  // ── UUID generation (RFC4122 v4, no deps) ────────────────────────────────
  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      try { return window.crypto.randomUUID() } catch (e) { /* fall through */ }
    }
    var d = new Date().getTime()
    if (window.performance && typeof window.performance.now === 'function') {
      d += window.performance.now()
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0
      d = Math.floor(d / 16)
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }

  // ── Safe storage wrappers ────────────────────────────────────────────────
  function lsGet(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
  function lsSet(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k) } catch (e) { return null } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v) } catch (e) {} }

  // ── SHA-256 hashing (emails, regs) ───────────────────────────────────────
  async function sha256(str) {
    if (!str) return null
    if (!window.crypto || !window.crypto.subtle) return null
    try {
      var buf = new TextEncoder().encode(String(str).trim().toLowerCase())
      var hash = await window.crypto.subtle.digest('SHA-256', buf)
      var bytes = Array.from(new Uint8Array(hash))
      return bytes.map(function (b) { return b.toString(16).padStart(2, '0') }).join('')
    } catch (e) { return null }
  }

  // ── Anonymous ID (persistent) ────────────────────────────────────────────
  function getAnonymousId() {
    var id = lsGet(K_ANON_ID)
    if (!id) {
      id = uuid()
      lsSet(K_ANON_ID, id)
    }
    return id
  }

  // ── Session ID (30min idle expiry) ───────────────────────────────────────
  function getSessionId() {
    var id = ssGet(K_SESSION_ID)
    var lastSeen = parseInt(lsGet(K_SESSION_TS) || '0', 10)
    var now = Date.now()
    if (!id || (now - lastSeen) > SESSION_IDLE_MS) {
      id = uuid()
      ssSet(K_SESSION_ID, id)
      ssSet(K_PAGE_START, String(now))
    }
    lsSet(K_SESSION_TS, String(now))
    return id
  }

  // ── UTM + referrer capture ───────────────────────────────────────────────
  function captureUTMs() {
    var cached = ssGet(K_UTM)
    if (cached) {
      try { return JSON.parse(cached) } catch (e) { /* fall through */ }
    }
    var params = new URLSearchParams(window.location.search)
    var utms = {
      utm_source:   params.get('utm_source')   || null,
      utm_medium:   params.get('utm_medium')   || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_content:  params.get('utm_content')  || null,
      utm_term:     params.get('utm_term')     || null,
      ref:          params.get('ref')          || null,
      referrer:     document.referrer || null,
      landing_path: window.location.pathname + window.location.search
    }
    ssSet(K_UTM, JSON.stringify(utms))
    if (!lsGet(K_FIRST_TOUCH)) {
      lsSet(K_FIRST_TOUCH, JSON.stringify(utms))
    }
    return utms
  }

  function getUTMs() {
    var cached = ssGet(K_UTM)
    if (!cached) return captureUTMs()
    try { return JSON.parse(cached) } catch (e) { return captureUTMs() }
  }

  function getFirstTouchUTMs() {
    var raw = lsGet(K_FIRST_TOUCH)
    if (!raw) return null
    try { return JSON.parse(raw) } catch (e) { return null }
  }

  // ── Device classification (no fingerprinting) ────────────────────────────
  function getDeviceType() {
    var ua = navigator.userAgent || ''
    if (/iPad|Tablet/i.test(ua)) return 'tablet'
    if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile'
    return 'desktop'
  }

  // ── Consent gate ─────────────────────────────────────────────────────────
  function hasConsent() {
    return !!(window.AutoLogConsent && window.AutoLogConsent.hasAnalyticsConsent())
  }

  // ── Emit (direct RLS insert, keepalive for unload flushing) ──────────────
  function emit(eventName, properties) {
    if (!hasConsent()) return
    if (!eventName) return

    var utms = getUTMs()
    var props = Object.assign({}, properties || {})
    Object.keys(utms).forEach(function (k) {
      if (utms[k] != null && props[k] == null) props[k] = utms[k]
    })
    if (!props.device_type) props.device_type = getDeviceType()
    if (!props.viewport_w && window.innerWidth) props.viewport_w = window.innerWidth
    if (!props.viewport_h && window.innerHeight) props.viewport_h = window.innerHeight

    var body = {
      event_name:   eventName,
      properties:   props,
      anonymous_id: getAnonymousId(),
      session_id:   getSessionId(),
      platform:     'web',
      url_path:     window.location.pathname,
      user_id:      null
    }

    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(body),
        keepalive: true,
        credentials: 'omit',
        mode: 'cors'
      }).catch(function () { /* silent */ })
    } catch (e) { /* silent */ }
  }

  // ── Public API ───────────────────────────────────────────────────────────
  var api = {
    track: function (eventName, properties) { emit(eventName, properties) },

    pageView: function (extra) {
      ssSet(K_PAGE_START, String(Date.now()))
      var props = Object.assign({
        title: document.title,
        search: window.location.search || null
      }, extra || {})
      emit('page_viewed', props)
    },

    hash: sha256,

    getAnonymousId: getAnonymousId,
    getSessionId:   getSessionId,
    getUTMs:        getUTMs,
    getFirstTouch:  getFirstTouchUTMs,

    getTimeOnPage: function () {
      var start = parseInt(ssGet(K_PAGE_START) || '0', 10)
      if (!start) return 0
      return Math.round((Date.now() - start) / 1000)
    }
  }
  window.AutoLogTrack = api

  // ── Auto-init: capture UTMs, fire page_viewed, scroll/exit tracking ──────
  function init() {
    captureUTMs()
    getSessionId()
    api.pageView()

    // Scroll depth 25/50/75/100
    var depths = [25, 50, 75, 100]
    var fired = {}
    function onScroll() {
      var h = document.documentElement
      var scrolled = h.scrollTop + window.innerHeight
      var total = h.scrollHeight
      if (total <= window.innerHeight) return
      var pct = Math.round((scrolled / total) * 100)
      for (var i = 0; i < depths.length; i++) {
        var d = depths[i]
        if (!fired[d] && pct >= d) {
          fired[d] = true
          emit('scroll_depth', { depth_pct: d, time_on_page_sec: api.getTimeOnPage() })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Page hide = exit event
    var exitFired = false
    function fireExit() {
      if (exitFired) return
      exitFired = true
      var depthKeys = Object.keys(fired).filter(function (k) { return !isNaN(Number(k)) })
      emit('page_exit', {
        time_on_page_sec: api.getTimeOnPage(),
        max_scroll_pct: depthKeys.length ? Math.max.apply(null, depthKeys.map(Number)) : 0
      })
    }
    window.addEventListener('pagehide', fireExit)

    // Mouse leaves top of viewport = exit intent (desktop only)
    document.addEventListener('mouseout', function (e) {
      if (e.clientY <= 0 && !e.relatedTarget) {
        if (!fired._exit_intent) {
          fired._exit_intent = true
          emit('exit_intent', { time_on_page_sec: api.getTimeOnPage() })
        }
      }
    })

    // External / key outbound link clicks
    document.addEventListener('click', function (e) {
      var a = e.target && (e.target.closest ? e.target.closest('a') : null)
      if (!a || !a.href) return
      var href = a.getAttribute('href') || ''
      if (/^https?:\/\//i.test(href) && a.host !== window.location.host) {
        var locSection = a.closest('[data-section]')
        var location = locSection ? locSection.getAttribute('data-section') : 'unknown'
        if (/apps\.apple\.com/i.test(href)) {
          emit('app_store_clicked', { destination: href, location: location })
        } else if (/testflight\.apple\.com/i.test(href)) {
          emit('testflight_clicked', { destination: href, location: location })
        } else {
          emit('outbound_link_clicked', { destination: href, location: location })
        }
      }
    }, { capture: true })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
