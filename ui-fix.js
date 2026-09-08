/* NASME GYM — login, staff admin, archive members */
(function () {
  var API_ROOT = 'https://nasme-fitness-gym-backend-production.up.railway.app/api/';

  function stripPoolCopy() {
    document.querySelectorAll('.login-roles, .login-divider').forEach(function (el) { el.remove(); });
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
        if (desc) desc.textContent = 'Heavy bags, pads, and coach-led sessions for cardio, coordination, and confidence.';
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

  function ensureExtraUi() {
    if (!document.getElementById('page-staff')) {
      var membersPage = document.getElementById('page-members');
      if (membersPage && membersPage.parentNode) {
        var page = document.createElement('div');
        page.className = 'page';
        page.id = 'page-staff';
        page.innerHTML = '<div class="card"><div class="card-header"><div class="card-title">Staff Accounts</div><button class="btn btn-primary btn-sm" id="btn-add-staff" type="button">+ Add Staff</button></div><div class="table-wrap"><table><thead><tr><th>Username</th><th>Full name</th><th>Role</th><th>Created</th><th></th></tr></thead><tbody id="staff-tbody"></tbody></table></div></div>';
        membersPage.parentNode.insertBefore(page, membersPage.nextSibling);
      }
    }
    var membersNav = document.querySelector('.nav-item[data-page="members"]');
    if (membersNav && !document.querySelector('.nav-item[data-page="staff"]')) {
      var staffNav = document.createElement('div');
      staffNav.className = 'nav-item admin-only';
      staffNav.setAttribute('data-page', 'staff');
      staffNav.innerHTML = '<span class="nav-icon">👨‍💼</span> Staff Management';
      staffNav.addEventListener('click', function () {
        if (typeof navigate === 'function') navigate('staff', staffNav);
        loadStaff();
      });
      membersNav.parentNode.insertBefore(staffNav, membersNav.nextSibling);
    }
    ['dashboard','payments','security','equipment','store'].forEach(function (page) {
      var el = document.querySelector('.nav-item[data-page="' + page + '"]');
      if (el) el.classList.add('admin-only');
    });
    if (!document.getElementById('archive-modal')) {
      var wrap = document.createElement('div');
      wrap.innerHTML = '<div class="modal-overlay" id="archive-modal"><div class="modal"><div class="modal-head"><h3>Archive member</h3><button class="modal-close" type="button" id="archive-x">×</button></div><p style="padding:0 1.4rem">This member leaves the list and cannot log in. They are not deleted.</p><div class="modal-body"><label>Reason for archiving</label><textarea id="archive-reason" rows="3" placeholder="Why is this account being archived?"></textarea><input type="hidden" id="archive-member-id" /></div><div class="modal-actions"><button class="btn btn-ghost" type="button" id="btn-cancel-archive">Cancel</button><button class="btn btn-danger" type="button" id="btn-confirm-archive">Archive member</button></div></div></div>';
      document.body.appendChild(wrap.firstChild);
    }
    if (!document.getElementById('staff-modal')) {
      var wrap2 = document.createElement('div');
      wrap2.innerHTML = '<div class="modal-overlay" id="staff-modal"><div class="modal"><div class="modal-head"><h3>Add staff</h3><button class="modal-close" type="button" id="staff-x">×</button></div><div class="modal-body"><label>Full name</label><input id="staff-full-name" type="text" /><label>Username</label><input id="staff-username" type="text" /><label>Password</label><input id="staff-password" type="text" /><label>Role</label><select id="staff-role"><option value="staff">Staff</option><option value="admin">Admin</option></select></div><div class="modal-actions"><button class="btn btn-ghost" type="button" id="btn-cancel-staff">Cancel</button><button class="btn btn-primary" type="button" id="btn-save-staff">Save staff</button></div></div></div>';
      document.body.appendChild(wrap2.firstChild);
    }
  }

  async function apiFix(file, method, body, params) {
    method = method || 'GET'; body = body || null; params = params || {};
    var url = new URL(API_ROOT + file);
    Object.entries(params).forEach(function (entry) { if (entry[1]) url.searchParams.set(entry[0], entry[1]); });
    var opts = { method: method, credentials: 'include', headers: { 'Content-Type': 'application/json' } };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    var res;
    try { res = await fetch(url, opts); }
    catch (e) { throw new Error('Cannot reach the backend. Check that Railway is live.'); }
    var raw = await res.text();
    var json = {};
    try { json = raw ? JSON.parse(raw) : {}; }
    catch (e) { throw new Error('Backend error (' + res.status + ').');
    }
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
    btn.classList.add('loading'); btn.disabled = true; errBox.classList.remove('show');
    try {
      var json = await apiFix('auth.php?action=login', 'POST', { username: username, password: password });
      loginSuccess(json.user);
      applyRoleAccess(json.user);
    } catch (err) {
      errBox.textContent = '❌ ' + (err.message || 'Login failed. Please try again.');
      errBox.classList.add('show');
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
    } finally {
      btn.classList.remove('loading'); btn.disabled = false;
    }
  }
  window.attemptLogin = attemptLoginFix;

  function applyRoleAccess(user) {
    var isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
    document.querySelectorAll('.admin-only').forEach(function (el) {
      el.style.display = isAdmin ? '' : 'none';
    });
    if (!isAdmin && typeof navigate === 'function') {
      var membersNav = document.querySelector('.nav-item[data-page="members"]');
      navigate('members', membersNav);
    }
  }

  function openArchiveModal(id) {
    document.getElementById('archive-member-id').value = id;
    document.getElementById('archive-reason').value = '';
    document.getElementById('archive-modal').classList.add('open');
  }

  async function archiveMember() {
    var id = document.getElementById('archive-member-id').value;
    var reason = (document.getElementById('archive-reason').value || '').trim();
    if (!reason) { alert('Please enter a reason for archiving.'); return; }
    try {
      await apiFix('members.php?id=' + id, 'PUT', { archive: true, archive_reason: reason });
      document.getElementById('archive-modal').classList.remove('open');
      if (typeof showAlert === 'function') showAlert('Member archived.');
      if (typeof loadMembers === 'function') loadMembers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function loadStaff() {
    var tbody = document.getElementById('staff-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    try {
      var json = await apiFix('staff.php');
      var data = json.data || [];
      tbody.innerHTML = data.length === 0
        ? '<tr><td colspan="5">No staff accounts yet.</td></tr>'
        : data.map(function (s) {
            var btn = s.role === 'superadmin' ? '' : '<button class="btn btn-danger btn-sm" data-action="remove-staff" data-id="' + s.id + '">Remove</button>';
            return '<tr><td>' + s.username + '</td><td><strong>' + s.full_name + '</strong></td><td>' + s.role + '</td><td>' + String(s.created_at || '').slice(0, 10) + '</td><td>' + btn + '</td></tr>';
          }).join('');
      tbody.querySelectorAll('[data-action="remove-staff"]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (!confirm('Remove this staff account?')) return;
          try {
            await apiFix('staff.php?id=' + btn.getAttribute('data-id'), 'DELETE');
            loadStaff();
          } catch (err) { alert(err.message); }
        });
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="5">' + err.message + '</td></tr>';
    }
  }

  async function saveStaff() {
    var body = {
      full_name: document.getElementById('staff-full-name').value.trim(),
      username: document.getElementById('staff-username').value.trim(),
      password: document.getElementById('staff-password').value,
      role: document.getElementById('staff-role').value
    };
    if (!body.full_name || !body.username || !body.password) {
      alert('Name, username and password are required.');
      return;
    }
    try {
      await apiFix('staff.php', 'POST', body);
      document.getElementById('staff-modal').classList.remove('open');
      loadStaff();
    } catch (err) { alert(err.message); }
  }

  function patchMemberButtons() {
    document.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
      btn.setAttribute('data-action', 'archive');
      btn.textContent = 'Archive';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openArchiveModal(btn.getAttribute('data-id'));
      }, true);
    });
  }

  var origRender = window.renderMembers;
  window.renderMembers = function (data) {
    if (typeof origRender === 'function') origRender(data);
    else if (window.renderMembers && window.renderMembers !== arguments.callee) {}
    patchMemberButtons();
  };

  function openLogin() {
    if (typeof openLoginScreen === 'function') openLoginScreen();
    else {
      var overlay = document.getElementById('login-overlay');
      if (overlay) overlay.classList.add('open');
    }
  }

  function wireLanding() {
    stripPoolCopy();
    ensureExtraUi();
    ['nav-login-btn', 'open-dashboard-btn', 'mob-login-link'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.dataset.loginWired) return;
      el.dataset.loginWired = '1';
      el.addEventListener('click', function (e) { e.preventDefault(); openLogin(); });
    });
    var submit = document.getElementById('login-submit');
    if (submit && !submit.dataset.loginWired) {
      submit.dataset.loginWired = '1';
      submit.addEventListener('click', attemptLoginFix);
    }
    var pass = document.getElementById('login-pass');
    if (pass) pass.addEventListener('keydown', function (e) { if (e.key === 'Enter') attemptLoginFix(); });
    document.querySelectorAll('.price-card a').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); openLogin(); });
    });
    var addStaff = document.getElementById('btn-add-staff');
    if (addStaff) addStaff.addEventListener('click', function () { document.getElementById('staff-modal').classList.add('open'); });
    var save = document.getElementById('btn-save-staff');
    if (save) save.addEventListener('click', saveStaff);
    ['btn-cancel-staff', 'staff-x'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', function () { document.getElementById('staff-modal').classList.remove('open'); });
    });
    var confirmA = document.getElementById('btn-confirm-archive');
    if (confirmA) confirmA.addEventListener('click', archiveMember);
    ['btn-cancel-archive', 'archive-x'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', function () { document.getElementById('archive-modal').classList.remove('open'); });
    });
    if (typeof renderMembers === 'function') {
      var prev = renderMembers;
      window.renderMembers = function (data) {
        prev(data);
        patchMemberButtons();
      };
    }
    document.body.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action="delete"]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      btn.textContent = 'Archive';
      openArchiveModal(btn.getAttribute('data-id'));
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireLanding);
  else wireLanding();
})();
