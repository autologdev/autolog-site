// ── Reg Lookup Hero Widget ─────────────────────────────────
// Handles the UK reg plate input in the marketing hero section

(function() {
  var WORKER = 'https://mechanic.autologapp.co.uk/dvla-lookup';

  function pad(n) { return n < 10 ? '0' + n : n; }

  function fmtDate(str) {
    if (!str) return null;
    var d = new Date(str);
    if (isNaN(d)) return str;
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function motBadge(expiry) {
    if (!expiry) return '<span class="rl-badge rl-badge-grey">Unknown</span>';
    var exp = new Date(expiry);
    var now = new Date();
    var days = Math.round((exp - now) / 86400000);
    if (days < 0) return '<span class="rl-badge rl-badge-red">Expired</span>';
    if (days < 30) return '<span class="rl-badge rl-badge-amber">Due soon</span>';
    return '<span class="rl-badge rl-badge-green">Valid</span>';
  }

  function cap(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  window.lookupHeroReg = async function() {
    var input = document.getElementById('rl-input');
    var btn = document.getElementById('rl-btn');
    var err = document.getElementById('rl-err');
    var result = document.getElementById('rl-result');
    var loading = document.getElementById('rl-loading');

    var reg = input.value.replace(/\s/g, '').toUpperCase();
    err.textContent = '';
    result.style.display = 'none';
    loading.style.display = 'none';

    if (!reg || reg.length < 2) {
      err.textContent = 'Enter a UK registration plate.';
      return;
    }

    // Show loading
    btn.disabled = true;
    btn.textContent = 'Looking up\u2026';
    loading.style.display = 'flex';

    try {
      var res = await fetch(WORKER + '?reg=' + encodeURIComponent(reg));
      var data = await res.json();

      loading.style.display = 'none';

      if (data.error || !data.make) {
        err.textContent = 'We couldn\u2019t find that registration in the DVLA database. Check the plate and try again, or sign up to add your vehicle manually.';
        btn.disabled = false;
        btn.textContent = 'Look Up \u2192';
        return;
      }

      // Build result card
      var motExp = fmtDate(data.motExpiry);
      var taxExp = fmtDate(data.taxExpiry);
      var displayName = [data.year, cap(data.make), cap(data.colour)].filter(Boolean).join(' ');

      result.innerHTML =
        '<div class="rl-result-header">' +
          '<div class="rl-result-reg">' + reg + '</div>' +
          '<div class="rl-result-name">' + displayName + '</div>' +
        '</div>' +
        '<div class="rl-result-grid">' +
          (data.fuelType ? '<div class="rl-result-item"><div class="rl-result-label">Fuel</div><div class="rl-result-val">' + cap(data.fuelType) + '</div></div>' : '') +
          (data.engineSizeCc ? '<div class="rl-result-item"><div class="rl-result-label">Engine</div><div class="rl-result-val">' + data.engineSizeCc + 'cc</div></div>' : '') +
          (motExp ? '<div class="rl-result-item"><div class="rl-result-label">MOT</div><div class="rl-result-val">' + motExp + ' ' + motBadge(data.motExpiry) + '</div></div>' : '') +
          (taxExp ? '<div class="rl-result-item"><div class="rl-result-label">Tax</div><div class="rl-result-val">' + taxExp + '</div></div>' : '') +
        '</div>' +
        '<p class="rl-result-cta-text">AutoLog will track MOT, tax, fuel costs and service history for this vehicle.</p>' +
        '<a href="#" id="rl-main-cta" class="rl-cta-btn" onclick="rlHandleCTA(\'' + encodeURIComponent(reg) + '\',event)">Create free account to track this vehicle &rarr;</a>' +
        '<p class="rl-result-signin">Already have AutoLog? <a href="/app/dashboard?reg=' + encodeURIComponent(reg) + '">Sign in &rarr;</a></p>';

      result.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Look Up \u2192';

    } catch(e) {
      loading.style.display = 'none';
      err.textContent = 'Could not connect \u2014 please try again.';
      btn.disabled = false;
      btn.textContent = 'Look Up \u2192';
    }
  };

  window.rlKeydown = function(e) {
    if (e.key === 'Enter') window.lookupHeroReg();
  };

  window.rlInput = function(e) {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  };
  // Route the main CTA based on whether user is already signed in
  window.rlHandleCTA = async function(encodedReg, e) {
    e.preventDefault()
    const reg = decodeURIComponent(encodedReg)
    // Check for existing Supabase session
    try {
      const SURL = 'https://dkpvxlxarsmiljnvnbck.supabase.co'
      const SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcHZ4bHhhcnNtaWxqbnZuYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzM4MzIsImV4cCI6MjA5MDAwOTgzMn0.WJTRE_xmudj--jWSoA3e4ggYVORrFpoarBUkeaQN1Bw'
      const sb = supabase.createClient(SURL, SKEY)
      const { data: { session } } = await sb.auth.getSession()
      if (session) {
        // Already signed in — go straight to dashboard with reg
        location.href = '/app/dashboard?reg=' + encodeURIComponent(reg)
      } else {
        // Not signed in — go to signup
        location.href = '/app/login?reg=' + encodeURIComponent(reg) + '&view=signup'
      }
    } catch(err) {
      // Fallback to signup if session check fails
      location.href = '/app/login?reg=' + encodeURIComponent(reg) + '&view=signup'
    }
  }
})();
