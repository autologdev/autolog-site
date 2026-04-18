var SURL = 'https://dkpvxlxarsmiljnvnbck.supabase.co';
var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcHZ4bHhhcnNtaWxqbnZuYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzM4MzIsImV4cCI6MjA5MDAwOTgzMn0.WJTRE_xmudj--jWSoA3e4ggYVORrFpoarBUkeaQN1Bw';
var sb = null;

function initSb() {
  if (typeof supabase !== 'undefined' && !sb) {
    sb = supabase.createClient(SURL, SKEY);
  }
}

function track(name, props) {
  try {
    if (window.AutoLogTrack) window.AutoLogTrack.track(name, props || {});
  } catch (e) { /* silent */ }
}

async function hashEmail(email) {
  try {
    if (window.AutoLogTrack && window.AutoLogTrack.hash) {
      return await window.AutoLogTrack.hash(email);
    }
  } catch (e) {}
  return null;
}

// ── Waitlist signup ────────────────────────────────────────
window.joinWaitlist = async function joinWaitlist() {
  var input = document.getElementById('wl-email');
  var btn = document.getElementById('wl-btn');
  var msg = document.getElementById('wl-msg');
  var form = document.getElementById('wl-form');

  var email = input ? input.value.trim() : '';
  msg.textContent = '';
  msg.className = 'wl-msg';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = 'Please enter a valid email address.';
    msg.className = 'wl-msg wl-msg-err';
    track('waitlist_signup_failed', { reason: 'invalid_email' });
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Joining\u2026';

  var emailHash = await hashEmail(email);
  track('waitlist_signup_attempted', {
    email_hash: emailHash,
    time_on_page_sec: window.AutoLogTrack ? window.AutoLogTrack.getTimeOnPage() : null
  });

  try {
    var utms = (window.AutoLogTrack && window.AutoLogTrack.getUTMs()) || {};
    var anonId = window.AutoLogTrack ? window.AutoLogTrack.getAnonymousId() : null;

    var res = await fetch('https://dkpvxlxarsmiljnvnbck.supabase.co/functions/v1/join-waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        utm_source:   utms.utm_source   || null,
        utm_medium:   utms.utm_medium   || null,
        utm_campaign: utms.utm_campaign || null,
        utm_content:  utms.utm_content  || null,
        utm_term:     utms.utm_term     || null,
        referrer:     utms.referrer     || null,
        landing_path: utms.landing_path || null,
        anonymous_id: anonId
      })
    });
    var data = await res.json();

    if (data.duplicate) {
      form.style.display = 'none';
      document.getElementById('wl-success').style.display = 'block';
      document.getElementById('wl-success-msg').textContent = "You're already signed up \u2014 check your email for the TestFlight link.";
      track('waitlist_signup_succeeded', { email_hash: emailHash, duplicate: true });
    } else if (res.ok) {
      form.style.display = 'none';
      document.getElementById('wl-success').style.display = 'block';
      document.getElementById('wl-success-msg').textContent = "Check your email \u2014 we've sent you the TestFlight link.";
      track('waitlist_signup_succeeded', { email_hash: emailHash, duplicate: false });
    } else {
      throw new Error('bad response');
    }
  } catch (e) {
    msg.textContent = 'Something went wrong \u2014 please try again.';
    msg.className = 'wl-msg wl-msg-err';
    btn.disabled = false;
    btn.textContent = 'Join Early Access \u2192';
    track('waitlist_signup_failed', { reason: 'network_error' });
  }
}

window.wlKeydown = function wlKeydown(e) {
  if (e.key === 'Enter') window.joinWaitlist();
};

async function initNav() {
  initSb();
  if (!sb) return;
  try {
    var res = await sb.auth.getSession();
    var session = res.data ? res.data.session : null;
    var dashLink = document.getElementById('nav-dashboard-link');
    var mobileDashLink = document.getElementById('mobile-dashboard-link');
    if (session) {
      if (dashLink) { dashLink.textContent = 'Dashboard'; dashLink.href = '/app/dashboard'; }
      if (mobileDashLink) { mobileDashLink.textContent = 'Dashboard'; mobileDashLink.href = '/app/dashboard'; }
    }
  } catch(e) {}
}

(function() {
  document.addEventListener('DOMContentLoaded', function() {
    initNav();

    var hamburger = document.getElementById('hamburger');
    var mobileNav = document.getElementById('mobile-nav');
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      var open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', function(e) {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });

    var links = mobileNav.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function() {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    }

    var fadeEls = document.querySelectorAll('.fade-in');
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    fadeEls.forEach(function(el) { observer.observe(el); });

    // Section visibility tracking
    var sectionTargets = document.querySelectorAll('[data-section]');
    if (sectionTargets.length && window.AutoLogTrack) {
      var seen = {};
      var sectionObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var name = entry.target.getAttribute('data-section');
            if (name && !seen[name]) {
              seen[name] = true;
              window.AutoLogTrack.track('section_viewed', { section: name });
            }
          }
        });
      }, { threshold: 0.4 });
      sectionTargets.forEach(function(el) { sectionObs.observe(el); });
    }
  });
})();
