// AutoLog — Consent Management Module
// Loaded synchronously (no defer) before app-common.js on all pages.
// Must execute before any other script so consent state is available at page load.
//
// Legal basis: UK GDPR + PECR
// Storing the consent record in localStorage under al_consent_v1 is itself
// a use of localStorage before consent — this is legally acceptable under PECR
// because storing the consent record is strictly necessary to implement the
// consent mechanism itself (it cannot function without persisting this state).

;(function () {
  var CONSENT_KEY = 'al_consent_v1'
  var CONSENT_VERSION = '1.0'

  function getRecord() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  }

  function setRecord(state) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        state: state,
        timestamp: Date.now(),
        version: CONSENT_VERSION
      }))
    } catch (e) { /* storage unavailable */ }
  }

  function clearNonEssentialKeys() {
    try {
      var toRemove = []
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i)
        if (!k) continue
        // Clear banner dismissal flags — these are non-essential under conservative classification
        if (k.startsWith('al_first_action_prompted_') || k.startsWith('al_history_prompt_')) {
          toRemove.push(k)
        }
        // NEVER clear: al_vid, sb-* (Supabase auth tokens), al_consent_v1
      }
      toRemove.forEach(function (k) { localStorage.removeItem(k) })
    } catch (e) { /* silent */ }
  }

  window.AutoLogConsent = {
    // Returns true if user has given affirmative analytics consent
    hasAnalyticsConsent: function () {
      var r = getRecord()
      return !!(r && r.state === 'granted')
    },

    // Returns true if user has explicitly rejected analytics
    hasRejected: function () {
      var r = getRecord()
      return !!(r && r.state === 'denied')
    },

    // Returns true if user has not yet responded (neither accepted nor rejected)
    isPending: function () {
      var r = getRecord()
      return !r
    },

    // Record affirmative consent
    grantAnalytics: function () {
      setRecord('granted')
    },

    // Record rejection and clear non-essential localStorage keys
    denyAnalytics: function () {
      setRecord('denied')
      clearNonEssentialKeys()
    },

    // Wipe consent record (used when user changes preferences)
    resetConsent: function () {
      try { localStorage.removeItem(CONSENT_KEY) } catch (e) { /* silent */ }
    },

    // Return raw consent record or null
    getRecord: getRecord
  }
})()
