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
