/* Restore original NASME landing page, keep current dashboard */
(function () {
  function landingEl() {
    return document.getElementById('landing-page') || document.getElementById('site-main');
  }

  window.showLanding = function () {
    document.getElementById('login-overlay')?.classList.add('hidden');
    document.getElementById('dashboard-app')?.classList.add('hidden');
    const land = landingEl();
    if (land) land.classList.remove('hidden');
    document.querySelectorAll('.modal-overlay').forEach(function (el) {
      if (el.id !== 'login-overlay') el.classList.remove('open');
    });
  };

  const oldDash = window.showDashboard;
  window.showDashboard = function () {
    const land = landingEl();
    if (land) land.classList.add('hidden');
    if (typeof oldDash === 'function') oldDash();
    else {
      document.getElementById('login-overlay')?.classList.add('hidden');
      document.getElementById('dashboard-app')?.classList.remove('hidden');
    }
  };

  function wireLandingButtons() {
    ['open-login','nav-login-btn','open-dashboard-btn','mob-login-link'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el || el.dataset.wiredHome) return;
      el.dataset.wiredHome = '1';
      el.addEventListener('click', function (e) { e.preventDefault(); if (typeof openLogin === 'function') openLogin(); });
    });
    document.querySelectorAll('.price-card a, .hero-actions .btn-maroon').forEach(function (a) {
      if (a.dataset.wiredHome) return;
      a.dataset.wiredHome = '1';
      a.addEventListener('click', function (e) { e.preventDefault(); if (typeof openLogin === 'function') openLogin(); });
    });
    document.getElementById('open-member-login-btn')?.addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof openLogin === 'function') openLogin();
    });
    document.getElementById('back-to-site')?.addEventListener('click', function () {
      if (typeof showLanding === 'function') showLanding();
    });
    document.getElementById('nav-hamburger')?.addEventListener('click', function () {
      document.getElementById('mobile-nav-drawer')?.classList.add('open');
    });
    document.getElementById('mobile-nav-close')?.addEventListener('click', function () {
      document.getElementById('mobile-nav-drawer')?.classList.remove('open');
    });
  }

  function equipmentVisual(item) {
    const name = (item.name || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const photos = {
      treadmill: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=60',
      bike: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=60',
      bench: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=800&q=60',
      dumbbell: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=60',
      row: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=60'
    };
    if (name.includes('tread')) return photos.treadmill;
    if (name.includes('bike') || name.includes('cycl')) return photos.bike;
    if (name.includes('bench')) return photos.bench;
    if (name.includes('dumb')) return photos.dumbbell;
    if (name.includes('row')) return photos.row;
    if (cat.includes('cardio')) return photos.treadmill;
    if (cat.includes('strength')) return photos.bench;
    return photos.dumbbell;
  }

  function equipmentIcon(cat) {
    cat = (cat || '').toLowerCase();
    if (cat.includes('cardio')) return '<svg viewBox="0 0 64 64" class="eq-svg"><rect x="6" y="36" width="52" height="8" rx="3" fill="#7a1010"/><rect x="10" y="18" width="30" height="18" rx="4" fill="#2e2e5a"/><circle cx="18" cy="48" r="6" fill="#f4f2f2"/><circle cx="46" cy="48" r="6" fill="#f4f2f2"/></svg>';
    if (cat.includes('strength')) return '<svg viewBox="0 0 64 64" class="eq-svg"><rect x="6" y="26" width="10" height="12" rx="2" fill="#9090e0"/><rect x="48" y="26" width="10" height="12" rx="2" fill="#9090e0"/><rect x="16" y="30" width="32" height="4" fill="#f4f2f2"/></svg>';
    return '<svg viewBox="0 0 64 64" class="eq-svg"><circle cx="20" cy="32" r="10" fill="#7a1010"/><circle cx="44" cy="32" r="10" fill="#7a1010"/><rect x="18" y="28" width="28" height="8" fill="#f4f2f2"/></svg>';
  }

  window.renderEquipment = function (data) {
    data = data || [];
    let grid = document.getElementById('equip-grid');
    if (!grid) {
      const page = document.getElementById('page-equipment');
      if (page) {
        grid = document.createElement('div');
        grid.id = 'equip-grid';
        grid.className = 'equip-grid';
        page.appendChild(grid);
      }
    }
    if (!grid) return;
    if (!data.length) {
      grid.innerHTML = '<div class="empty-state">No equipment recorded.</div>';
      return;
    }
    grid.innerHTML = data.map(function (e) {
      return '<article class="equip-card"><div class="equip-photo" style="background-image:url(\'' + equipmentVisual(e) + '\')">' +
        equipmentIcon(e.category) + '</div><div class="equip-body"><div class="equip-name">' + (e.name || '') +
        '</div><div class="equip-meta">' + (e.category || '') + ' · Qty ' + (e.quantity ?? '—') +
        '</div><div class="equip-status">' + (e.status || '') + '</div></div></article>';
    }).join('');
  };

  async function injectOriginalLanding() {
    if (document.getElementById('landing-page')) {
      wireLandingButtons();
      showLanding();
      return;
    }
    try {
      const res = await fetch('https://cdn.jsdelivr.net/gh/Deviant08/NASME-fitness-gym-frontend@32d28bdc21c77fd0113b0a0f4626326e81f57fc1/index.html');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const landing = doc.getElementById('landing-page');
      const current = document.getElementById('site-main');
      if (landing && current) {
        landing.querySelectorAll('.service-card').forEach(function (card) {
          if (/swim|pool/i.test(card.textContent)) {
            const icon = card.querySelector('.service-icon');
            const name = card.querySelector('.service-name');
            const desc = card.querySelector('.service-desc');
            if (icon) icon.textContent = '🥊';
            if (name) name.textContent = 'BOXING STUDIO';
            if (desc) desc.textContent = 'Heavy bags, pads, and coach-led sessions for cardio, coordination, and confidence.';
          }
        });
        current.replaceWith(landing);
      }
    } catch (e) {}
    wireLandingButtons();
    showLanding();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectOriginalLanding);
  else injectOriginalLanding();
})();
