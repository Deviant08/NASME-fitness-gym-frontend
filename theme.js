/* NASME GYM — light / dark theme */
(function () {
  var KEY = 'nasme-theme';

  function preferred() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  }

  function apply(theme) {
    theme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      var next = theme === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.title = (theme === 'dark' ? 'Dark' : 'Light') + ' mode — click to switch';
    });
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    apply(cur === 'dark' ? 'light' : 'dark');
  }

  var ICON_SUN = '<span class="theme-toggle-icon sun"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg></span>';
  var ICON_MOON = '<span class="theme-toggle-icon moon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/></svg></span>';

  function toggleInner() {
    return '<span class="theme-toggle-track" aria-hidden="true">' +
      ICON_SUN + '<span class="theme-toggle-thumb"></span>' + ICON_MOON +
      '</span>';
  }

  function toggleHtml() {
    return '<button type="button" class="theme-toggle" data-theme-toggle aria-label="Toggle color theme">' +
      toggleInner() + '</button>';
  }

  function insertToggle(parent, where) {
    if (!parent || parent.querySelector('[data-theme-toggle]')) return;
    parent.insertAdjacentHTML(where || 'afterbegin', toggleHtml());
  }

  function mountThemeToggles() {
    var siteHeader = document.querySelector('.site-header');
    if (siteHeader && !siteHeader.querySelector('[data-theme-toggle]')) {
      var actions = siteHeader.querySelector('.header-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'header-actions';
        var login = siteHeader.querySelector('#open-login');
        if (login) {
          login.replaceWith(actions);
          actions.appendChild(login);
        } else {
          siteHeader.appendChild(actions);
        }
      }
      actions.insertAdjacentHTML('afterbegin', toggleHtml());
    }

    insertToggle(document.querySelector('#landing-page .nav-cta-group, header.hero .nav-cta-group'), 'afterbegin');
    insertToggle(document.querySelector('#landing-page .nav_bar, header.hero .nav_bar'), 'beforeend');

    var dashTop = document.querySelector('#dashboard-app .topbar');
    if (dashTop && !dashTop.querySelector('[data-theme-toggle]')) {
      dashTop.insertAdjacentHTML('beforeend', toggleHtml());
    }

    insertToggle(document.querySelector('#portal-app .topbar-right'), 'afterbegin');

    var loginCard = document.querySelector('#login-screen .login-card');
    if (loginCard && !loginCard.querySelector('[data-theme-toggle]')) {
      var wrap = document.createElement('div');
      wrap.className = 'theme-toggle-wrap';
      wrap.innerHTML = toggleHtml();
      loginCard.insertBefore(wrap, loginCard.firstChild);
    }

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      if (!btn.querySelector('svg')) btn.innerHTML = toggleInner();
      if (btn.dataset.wiredTheme) return;
      btn.dataset.wiredTheme = '1';
      btn.addEventListener('click', toggleTheme);
    });

    apply(document.documentElement.getAttribute('data-theme') || preferred());
  }

  window.mountThemeToggles = mountThemeToggles;
  window.setNasmeTheme = apply;
  apply(preferred());

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountThemeToggles);
  else mountThemeToggles();
})();
