/* NASME GYM — login fixes, landing buttons, remove swimming pool copy */
(function () {
  var API_ROOT = 'https://nasme-fitness-gym-backend-production.up.railway.app/api/';

  function stripPoolCopy() {
    document.querySelectorAll('.extras-row a').forEach(function (a) {
      if (/swim|pool/i.test(a.textContent)) a.innerHTML = '🥊 Boxing Studio';
    });
    document.querySelectorAll('.service-card').forEach(function (card) {
      if (/swim|pool/i.test(card.textContent)) {
        var icon = card.querySelector('.service-icon');
        var name = card.querySelector('.service-name');
        var desc = card.querySelector('.service-desc');
        if (icon) icon.textContent = '🥊';
        if (name) name.textContent = 'BOXING STUDIO';
        if (desc) desc.textContent = 'Heavy bags, pads, and coach-led sessions for cardio, coordination, and confidence — open to every skill level.';
      }
    });
    document.querySelectorAll('.price-features li').forEach(function (li) {
      if (/pool/i.test(li.textContent)) li.textContent = 'Full gym access';
    });
    document.querySelectorAll('.testi-text').forEach(function (p) {
      if (/swim|pool/i.test(p.textContent)) {
        p.textContent = 'The group classes are energetic and diverse, the floor is always well kept, and the online access means I never miss a session even when travelling for work.';
      }
    });
  }

  async function apiFix(file, method, body, params) {
    method = method || 'GET';
    body = body || null;
    params = params || {};
    var url = new URL(API_ROOT + file);
    Object.entries(params).forEach(function (entry) {
      if (entry[1]) url.searchParams.set(entry[0], entry[1]);
    });
    var opts = { method: method, credentials: 'include', headers: { 'Content-Type': 'application/json' } };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    var res;
    try { res = await fetch(url, opts); }
    catch (e) { throw new Error('Cannot reach the backend. Check that Railway is live.'); }
    var raw = await res.text();
    var json = {};
    try { json = raw ? JSON.parse(raw) : {}; }
    catch (e) { throw new Error(res.ok ? 'Backend returned a non-JSON response.' : 'Backend error (' + res.status + '). Is Railway running?'); }
    if (!res.ok) throw new Error(json.error || json.message || ('Request failed (' + res.status + ')'));
    return json;
  }
  window.api = apiFix;

  async function attemptLoginFix() {
    var btn = document.getElementById('login-submit');
    var username = document.getElementById('login-user').value.trim().toLowerCase();
    var password = document.getElementById('login-pass').value;
    var errBox = document.getElementById('login-error');
    if (!username || !password) {
      errBox.textContent = 'Please enter both username and password.';
      errBox.classList.add('show');
      return;
    }
    btn.classList.add('loading');
    btn.disabled = true;
    errBox.classList.remove('show');
    try {
      var json = await apiFix('auth.php?action=login', 'POST', { username: username, password: password });
      loginSuccess(json.user);
    } catch (err) {
      errBox.textContent = '❌ ' + (err.message || 'Login failed. Please try again.');
      errBox.classList.add('show');
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }
  window.attemptLogin = attemptLoginFix;

  function openLogin() {
    if (typeof openLoginScreen === 'function') openLoginScreen();
    else if (typeof window.openLoginScreen === 'function') window.openLoginScreen();
    else {
      var overlay = document.getElementById('login-overlay');
      if (overlay) overlay.classList.add('open');
      var user = document.getElementById('login-user');
      if (user) setTimeout(function () { user.focus(); }, 200);
    }
  }

  function wireLanding() {
    stripPoolCopy();

    function bindOpen(el) {
      if (!el || el.dataset.loginWired) return;
      el.dataset.loginWired = '1';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var drawer = document.getElementById('mobile-nav-drawer');
        if (drawer) drawer.classList.remove('open');
        openLogin();
      });
    }
    bindOpen(document.getElementById('nav-login-btn'));
    bindOpen(document.getElementById('open-dashboard-btn'));
    bindOpen(document.getElementById('mob-login-link'));

    var closeBtn = document.querySelector('.login-close');
    if (closeBtn && !closeBtn.dataset.loginWired) {
      closeBtn.dataset.loginWired = '1';
      closeBtn.addEventListener('click', function () {
        if (typeof closeLoginScreen === 'function') closeLoginScreen();
        else document.getElementById('login-overlay').classList.remove('open');
      });
    }

    var submit = document.getElementById('login-submit');
    if (submit) {
      var clone = submit.cloneNode(true);
      submit.parentNode.replaceChild(clone, submit);
      clone.addEventListener('click', attemptLoginFix);
    }
    var pass = document.getElementById('login-pass');
    if (pass) pass.addEventListener('keydown', function (e) { if (e.key === 'Enter') attemptLoginFix(); });
    document.querySelectorAll('.role-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var role = btn.textContent.indexOf('Admin') !== -1 ? 'admin' : 'staff';
        var creds = { admin: ['admin', 'admin123'], staff: ['staff', 'staff123'] };
        var pair = creds[role];
        document.getElementById('login-user').value = pair[0];
        document.getElementById('login-pass').value = pair[1];
        attemptLoginFix();
      });
    });
    document.querySelectorAll('.price-card a').forEach(function (btn) {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function (e) { e.preventDefault(); openLoginScreen(); });
    });
    document.querySelectorAll('.extras-row a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var el = document.getElementById('services');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    });
    document.querySelectorAll('.nav_links a').forEach(function (a) {
      if ((a.getAttribute('href') || '') === '#') {
        a.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      }
    });
    document.querySelectorAll('.footer-links a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var el = document.getElementById('about');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    });
    var forgot = document.querySelector('.login-forgot');
    if (forgot) {
      forgot.addEventListener('click', function () {
        var errBox = document.getElementById('login-error');
        errBox.textContent = 'Ask an admin to reset your password, then sign in again.';
        errBox.classList.add('show');
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireLanding);
  else wireLanding();
})();
