var SURL = 'https://dkpvxlxarsmiljnvnbck.supabase.co';
var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcHZ4bHhhcnNtaWxqbnZuYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzM4MzIsImV4cCI6MjA5MDAwOTgzMn0.WJTRE_xmudj--jWSoA3e4ggYVORrFpoarBUkeaQN1Bw';
var sb = null;

function initSb() {
  if (typeof supabase !== 'undefined' && !sb) {
    sb = supabase.createClient(SURL, SKEY);
  }
}

// ── Waitlist signup ────────────────────────────────────────
window.joinWaitlist = async function joinWaitlist() {
  initSb();
  if (!sb) { initSb(); }
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
    return;
  }

  if (!sb) {
    msg.textContent = 'Could not connect — please try again.';
    msg.className = 'wl-msg wl-msg-err';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Joining…';

  var result = await sb.from('waitlist').insert({ email: email, source: 'website' });

  if (result.error) {
    if (result.error.code === '23505') {
      // Duplicate — already on list
      form.style.display = 'none';
      document.getElementById('wl-success').style.display = 'block';
      document.getElementById('wl-success-msg').textContent = "You're already signed up — check your email for the TestFlight link.";
    } else {
      msg.textContent = 'Something went wrong — please try again.';
      msg.className = 'wl-msg wl-msg-err';
      btn.disabled = false;
      btn.textContent = 'Join Early Access \u2192';
    }
    return;
  }

  // Success
  form.style.display = 'none';
  document.getElementById('wl-success').style.display = 'block';
  document.getElementById('wl-success-msg').textContent = "Check your email \u2014 we\u2019ve sent you the TestFlight link.";
}

// Allow Enter key to submit
window.wlKeydown = function wlKeydown(e) {
  if (e.key === 'Enter') window.joinWaitlist();
};

// ── Auth-aware nav ─────────────────────────────────────────
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

// ── Hamburger ──────────────────────────────────────────────
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

    // Fade-in animations
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
  });
})();
