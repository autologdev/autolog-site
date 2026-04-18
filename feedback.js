var SURL = 'https://dkpvxlxarsmiljnvnbck.supabase.co';
var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcHZ4bHhhcnNtaWxqbnZuYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzM4MzIsImV4cCI6MjA5MDAwOTgzMn0.WJTRE_xmudj--jWSoA3e4ggYVORrFpoarBUkeaQN1Bw';
var sb = null;
var selectedType = 'bug';

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

function selectType(btn) {
  var buttons = document.querySelectorAll('.type-btn');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('selected');
  }
  btn.classList.add('selected');
  selectedType = btn.getAttribute('data-type');
  track('feedback_type_selected', { type: selectedType });
}

async function submitFeedback() {
  initSb();
  var desc = document.getElementById('f-desc').value.trim();
  var ctx  = document.getElementById('f-ctx').value.trim();
  var email = document.getElementById('f-email').value.trim();
  var errEl = document.getElementById('form-err');

  errEl.classList.remove('on');

  if (!desc || desc.length < 10) {
    errEl.textContent = 'Please enter at least 10 characters in the description.';
    errEl.classList.add('on');
    track('feedback_submit_failed', { reason: 'too_short', type: selectedType });
    return;
  }

  if (!sb) {
    errEl.textContent = 'Could not connect — please refresh and try again.';
    errEl.classList.add('on');
    track('feedback_submit_failed', { reason: 'sdk_unavailable', type: selectedType });
    return;
  }

  var btn = document.getElementById('submit-btn');
  var spin = document.getElementById('btn-spin');
  var label = document.getElementById('btn-label');
  btn.disabled = true;
  spin.style.display = 'block';
  label.textContent = 'Sending…';

  var userId = null;
  try {
    var res = await sb.auth.getSession();
    userId = res.data.session ? res.data.session.user.id : null;
  } catch(e) {}

  var record = {
    type: selectedType,
    description: desc,
    context: ctx || null,
    email: email || null,
    user_id: userId
  };

  var result = await sb.from('feedback').insert(record);

  if (result.error) {
    errEl.textContent = 'Something went wrong — please try again or email hello@autologapp.co.uk';
    errEl.classList.add('on');
    btn.disabled = false;
    spin.style.display = 'none';
    label.textContent = 'Send Feedback';
    track('feedback_submit_failed', { reason: 'db_error', type: selectedType });
    return;
  }

  document.getElementById('form-wrap').style.display = 'none';
  document.getElementById('success-wrap').classList.add('on');

  track('feedback_submitted', {
    type: selectedType,
    has_context: !!ctx,
    has_email: !!email,
    description_length: desc.length,
    signed_in: !!userId
  });
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && e.ctrlKey) submitFeedback();
});

(function() {
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
})();

document.addEventListener('DOMContentLoaded', initSb);
