// AutoLog — Consent Banner & Preferences Modal
// Loaded deferred after consent.js on all pages (app + marketing).
// Requires window.AutoLogConsent to be available (set by consent.js).

;(function () {
  // ── Banner HTML ───────────────────────────────────────────────
  function buildBanner() {
    var div = document.createElement('div')
    div.id = 'al-consent-banner'
    div.setAttribute('role', 'dialog')
    div.setAttribute('aria-label', 'Cookie and analytics preferences')
    div.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'z-index:99999',
      'background:#ffffff',
      'border-top:1.5px solid #e2e8f0',
      'box-shadow:0 -4px 24px rgba(13,27,42,0.10)',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    ].join(';')
    div.innerHTML = [
      '<div style="max-width:900px;margin:0 auto;padding:16px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">',
        '<div style="flex:1;min-width:240px">',
          '<p style="font-size:.875rem;font-weight:600;color:#0f172a;margin:0 0 4px 0">This site uses cookies and analytics</p>',
          '<p style="font-size:.8125rem;color:#475569;line-height:1.5;margin:0">',
            'We use essential cookies to keep you signed in. With your permission, we also collect pseudonymous usage data to improve AutoLog. ',
            '<a href="/privacy.html" style="color:#1E7A8C;text-decoration:none;font-weight:600">Privacy Policy</a>',
          '</p>',
        '</div>',
        '<div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap">',
          '<button id="al-consent-reject" style="padding:9px 18px;border-radius:9px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#475569;font-size:.875rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .14s" onmouseover="this.style.background=\'#e2e8f0\'" onmouseout="this.style.background=\'#f8fafc\'">Reject analytics</button>',
          '<button id="al-consent-accept" style="padding:9px 18px;border-radius:9px;border:1.5px solid #1E7A8C;background:#1E7A8C;color:#fff;font-size:.875rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .14s" onmouseover="this.style.background=\'#155F6E\'" onmouseout="this.style.background=\'#1E7A8C\'">Accept analytics</button>',
        '</div>',
      '</div>'
    ].join('')
    return div
  }

  // ── Inject banner ─────────────────────────────────────────────
  function showBanner() {
    if (document.getElementById('al-consent-banner')) return
    var banner = buildBanner()
    document.body.appendChild(banner)

    document.getElementById('al-consent-accept').addEventListener('click', function () {
      window.AutoLogConsent.grantAnalytics()
      removeBanner()
    })
    document.getElementById('al-consent-reject').addEventListener('click', function () {
      window.AutoLogConsent.denyAnalytics()
      removeBanner()
    })
  }

  function removeBanner() {
    var b = document.getElementById('al-consent-banner')
    if (b) b.remove()
  }

  // ── Preferences Modal ──────────────────────────────────────────
  function showPreferencesModal() {
    var existing = document.getElementById('al-consent-modal-bg')
    if (existing) { existing.remove(); return }

    var current = window.AutoLogConsent.hasAnalyticsConsent() ? 'Accepted' : (window.AutoLogConsent.hasRejected() ? 'Rejected' : 'Not set')
    var isGranted = window.AutoLogConsent.hasAnalyticsConsent()

    var bg = document.createElement('div')
    bg.id = 'al-consent-modal-bg'
    bg.style.cssText = 'position:fixed;inset:0;background:rgba(11,17,32,0.55);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;backdrop-filter:blur(4px)'
    bg.innerHTML = [
      '<div style="background:#fff;border-radius:16px;padding:28px;max-width:400px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.18)">',
        '<h2 style="font-size:1rem;font-weight:700;color:#0f172a;margin:0 0 6px 0">Cookie preferences</h2>',
        '<p style="font-size:.8125rem;color:#64748b;margin:0 0 18px 0">Your current analytics preference: <strong style="color:#0f172a">' + current + '</strong></p>',
        '<div style="display:flex;flex-direction:column;gap:8px">',
          isGranted
            ? '<button id="al-pref-deny" style="padding:10px 18px;border-radius:9px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#475569;font-size:.875rem;font-weight:600;cursor:pointer;font-family:inherit;text-align:left">Switch to: Reject analytics</button>'
            : '<button id="al-pref-grant" style="padding:10px 18px;border-radius:9px;border:1.5px solid #1E7A8C;background:#1E7A8C;color:#fff;font-size:.875rem;font-weight:600;cursor:pointer;font-family:inherit;text-align:left">Switch to: Accept analytics</button>',
          '<button id="al-pref-close" style="padding:10px 18px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:.875rem;font-weight:600;cursor:pointer;font-family:inherit;text-align:center">Close</button>',
        '</div>',
      '</div>'
    ].join('')

    document.body.appendChild(bg)

    bg.addEventListener('click', function (e) { if (e.target === bg) bg.remove() })

    var closeBtn = document.getElementById('al-pref-close')
    if (closeBtn) closeBtn.addEventListener('click', function () { bg.remove() })

    var grantBtn = document.getElementById('al-pref-grant')
    if (grantBtn) grantBtn.addEventListener('click', function () {
      window.AutoLogConsent.grantAnalytics()
      bg.remove()
      showPrefToast('Analytics preference updated.')
      removeBanner()
    })

    var denyBtn = document.getElementById('al-pref-deny')
    if (denyBtn) denyBtn.addEventListener('click', function () {
      window.AutoLogConsent.denyAnalytics()
      bg.remove()
      showPrefToast('Analytics preference updated.')
    })
  }

  // ── Small preference-update toast ─────────────────────────────
  function showPrefToast(msg) {
    var old = document.getElementById('al-pref-toast')
    if (old) old.remove()
    var el = document.createElement('div')
    el.id = 'al-pref-toast'
    el.textContent = msg
    el.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:100001',
      'background:#0f172a',
      'color:#fff',
      'padding:11px 20px',
      'border-radius:10px',
      'font-size:.875rem',
      'font-weight:500',
      'box-shadow:0 8px 32px rgba(0,0,0,0.25)',
      'white-space:nowrap',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    ].join(';')
    document.body.appendChild(el)
    setTimeout(function () { if (el.parentNode) el.remove() }, 3000)
  }

  // ── Inject "Cookie preferences" footer link ───────────────────
  // Adds a subtle link to the footer of any page that has a footer element.
  // Falls back to appending at the bottom of the body if no footer found.
  function injectFooterLink() {
    // Don't double-inject
    if (document.getElementById('al-cookie-pref-link')) return

    var link = document.createElement('a')
    link.id = 'al-cookie-pref-link'
    link.href = '#'
    link.textContent = 'Cookie preferences'
    link.style.cssText = 'font-size:.8rem;color:#94a3b8;text-decoration:none;cursor:pointer'
    link.addEventListener('click', function (e) { e.preventDefault(); showPreferencesModal() })

    // Try to find footer-bottom or footer element
    var footerBottom = document.querySelector('.footer-bottom')
    if (footerBottom) {
      var span = document.createElement('span')
      span.appendChild(link)
      footerBottom.appendChild(span)
      return
    }
    var footer = document.querySelector('footer, .footer')
    if (footer) {
      var wrap = document.createElement('div')
      wrap.style.cssText = 'text-align:center;padding:8px 0 4px;border-top:1px solid rgba(0,0,0,0.05);margin-top:8px'
      wrap.appendChild(link)
      footer.appendChild(wrap)
      return
    }
    // App pages: add near the bottom of the content area
    var content = document.querySelector('.sb-bottom, .main')
    if (content) {
      var wrap2 = document.createElement('div')
      wrap2.style.cssText = 'padding:8px 16px;text-align:center'
      wrap2.appendChild(link)
      content.appendChild(wrap2)
    }
  }

  // ── Expose showPreferencesModal globally ──────────────────────
  window.alShowConsentPreferences = showPreferencesModal

  // ── Init on DOM ready ─────────────────────────────────────────
  function init() {
    if (!window.AutoLogConsent) return // consent.js not loaded — bail
    if (window.AutoLogConsent.isPending()) {
      showBanner()
    }
    injectFooterLink()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
