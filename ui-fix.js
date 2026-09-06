/* NASME GYM — overrides login + wires leftover landing buttons */
(function () {
  window.api = async function api(file, method, body, params) {
    method = method || 'GET';
    body = body || null;
    params = params || {};
    var url = new URL('https://nasme-fitness-gym-backend.up.railway.app/api/' + file);
    Object.entries(params).forEach(function (entry) {
      if (entry[1]) url.searchParams.set(entry[0], entry[1]);
    });
    var opts = {
      method: method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    var res;
    try {
      res = await fetch(url, opts);
    } catch (e) {
      throw new Error('Cannot reach the backend. Check that Railway is live.');
    }
    var raw = await res.text();
    var json = {};
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch (e) {
      throw new Error(res.ok ? 'Backend returned a non-JSON response.' : 'Backend error (' + res.status + '). Is Railway running?');
    }
    if (!res.ok) throw new Error(json.error || json.message || ('Request failed (' + res.status + ')'));
    return json;
  };

  window.attemptLogin = async function attemptLogin() {
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
      var json = await window.api('auth.php?action=login', 'POST', { username: username, password: password });
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
  };

  function wireLanding() {
    document.querySelectorAll('.price-card a').forEach(function (btn) {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openLoginScreen();
      });
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
        a.addEventListener('click', function (e) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireLanding);
  } else {
    wireLanding();
  }
})();
