/* NASME GYM — login, staff, archive, member form/preview/edit */
(function () {
  var API_ROOT = 'https://nasme-fitness-gym-backend-production.up.railway.app/api/';
  var editingId = null;

  function $(id) { return document.getElementById(id); }

  function yn(v) {
    if (v === 'Yes' || v === 'yes' || v === true || v === 1 || v === '1') return 'Yes';
    if (v === 'No' || v === 'no' || v === false || v === 0 || v === '0') return 'No';
    return v || '—';
  }

  function dash(v) { return (v === null || v === undefined || v === '') ? '—' : String(v); }

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
    catch (e) { throw new Error('Backend error (' + (res && res.status) + ').'); }
    if (!res.ok) throw new Error(json.error || json.message || ('Request failed (' + res.status + ')'));
    return json;
  }
  window.api = apiFix;

  function formHtml(mode) {
    return (
      '<div class="reg-form">' +
      '<h3 style="margin:0 0 .8rem">🏋️ Gym Membership Registration</h3>' +
      '<h4>Personal Information</h4>' +
      '<div class="form-grid">' +
      '<div class="form-group"><label>Full Name *</label><input id="m-name" type="text"></div>' +
      '<div class="form-group"><label>Phone Number *</label><input id="m-phone" type="text"></div>' +
      '<div class="form-group"><label>Age</label><input id="m-age" type="number" min="1"></div>' +
      '<div class="form-group"><label>Gender</label><select id="m-gender"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>' +
      '<div class="form-group full"><label>Address</label><input id="m-address" type="text"></div>' +
      '</div>' +
      '<h4>Emergency Contact</h4>' +
      '<div class="form-grid">' +
      '<div class="form-group"><label>Name</label><input id="m-em-name" type="text"></div>' +
      '<div class="form-group"><label>Phone Number</label><input id="m-em-phone" type="text"></div>' +
      '<div class="form-group"><label>Relationship</label><input id="m-em-rel" type="text" placeholder="Parent, sibling, friend"></div>' +
      '</div>' +
      '<h4>Medical Information</h4>' +
      '<div class="form-grid">' +
      '<div class="form-group"><label>Any medical condition?</label><select id="m-med-yn"><option value="No">No</option><option value="Yes">Yes</option></select></div>' +
      '<div class="form-group full"><label>If yes, please specify</label><textarea id="m-medical"></textarea></div>' +
      '<div class="form-group"><label>Any previous injury?</label><select id="m-inj-yn"><option value="No">No</option><option value="Yes">Yes</option></select></div>' +
      '<div class="form-group full"><label>If yes, please specify</label><textarea id="m-injury"></textarea></div>' +
      '<div class="form-group"><label>Currently taking medication?</label><select id="m-meds-yn"><option value="No">No</option><option value="Yes">Yes</option></select></div>' +
      '</div>' +
      '<h4>Fitness Information</h4>' +
      '<div class="form-grid">' +
      '<div class="form-group"><label>Fitness Goal</label><input id="m-goal" type="text"></div>' +
      '<div class="form-group"><label>Previous Gym Experience</label><select id="m-exp"><option value="No">No</option><option value="Yes">Yes</option></select></div>' +
      '</div>' +
      '<h4>Membership</h4>' +
      '<div class="form-grid">' +
      '<div class="form-group"><label>Membership Plan *</label><select id="m-plan"><option>Daily</option><option>Weekly</option><option selected>Monthly</option><option>Yearly</option></select></div>' +
      '<div class="form-group"><label>Start Date</label><input id="m-start" type="date"></div>' +
      '<div class="form-group"><label>Payment</label><input id="m-pay" type="text" placeholder="Cash, Card, Transfer, amount"></div>' +
      '</div></div>'
    );
  }

  function readForm() {
    return {
      full_name: ($('m-name') || {}).value && $('m-name').value.trim(),
      phone: ($('m-phone') || {}).value && $('m-phone').value.trim(),
      age: ($('m-age') && $('m-age').value) ? Number($('m-age').value) : null,
      gender: ($('m-gender') || {}).value || null,
      address: ($('m-address') || {}).value || null,
      emergency_name: ($('m-em-name') || {}).value || null,
      emergency_phone: ($('m-em-phone') || {}).value || null,
      emergency_relationship: ($('m-em-rel') || {}).value || null,
      emergency_contact: [($('m-em-name') || {}).value, ($('m-em-phone') || {}).value].filter(Boolean).join(' — ') || null,
      has_medical_condition: ($('m-med-yn') || {}).value || 'No',
      medical_notes: ($('m-medical') || {}).value || null,
      has_previous_injury: ($('m-inj-yn') || {}).value || 'No',
      previous_injury_details: ($('m-injury') || {}).value || null,
      taking_medication: ($('m-meds-yn') || {}).value || 'No',
      fitness_goal: ($('m-goal') || {}).value || null,
      previous_gym_experience: ($('m-exp') || {}).value || 'No',
      plan: ($('m-plan') || {}).value,
      start_date: ($('m-start') || {}).value || null,
      payment_info: ($('m-pay') || {}).value || null
    };
  }

  function fillForm(m) {
    if ($('m-name')) $('m-name').value = m.full_name || '';
    if ($('m-phone')) $('m-phone').value = m.phone || '';
    if ($('m-age')) $('m-age').value = m.age || '';
    if ($('m-gender')) $('m-gender').value = m.gender || '';
    if ($('m-address')) $('m-address').value = m.address || '';
    if ($('m-em-name')) $('m-em-name').value = m.emergency_name || '';
    if ($('m-em-phone')) $('m-em-phone').value = m.emergency_phone || '';
    if ($('m-em-rel')) $('m-em-rel').value = m.emergency_relationship || '';
    if ($('m-med-yn')) $('m-med-yn').value = m.has_medical_condition === 'Yes' ? 'Yes' : 'No';
    if ($('m-medical')) $('m-medical').value = m.medical_notes || '';
    if ($('m-inj-yn')) $('m-inj-yn').value = m.has_previous_injury === 'Yes' ? 'Yes' : 'No';
    if ($('m-injury')) $('m-injury').value = m.previous_injury_details || '';
    if ($('m-meds-yn')) $('m-meds-yn').value = m.taking_medication === 'Yes' ? 'Yes' : 'No';
    if ($('m-goal')) $('m-goal').value = m.fitness_goal || '';
    if ($('m-exp')) $('m-exp').value = m.previous_gym_experience === 'Yes' ? 'Yes' : 'No';
    if ($('m-plan')) $('m-plan').value = m.plan || 'Monthly';
    if ($('m-start')) $('m-start').value = (m.start_date || m.joined_at || '').slice(0, 10);
    if ($('m-pay')) $('m-pay').value = m.payment_info || '';
  }

  function previewHtml(m) {
    return (
      '<div class="member-preview">' +
      '<h3 style="margin-top:0">' + dash(m.full_name) + ' <small>(' + dash(m.member_code) + ')</small></h3>' +
      '<p><strong>Status:</strong> ' + dash(m.status) + ' &nbsp; <strong>Plan:</strong> ' + dash(m.plan) + '</p>' +
      '<h4>Personal Information</h4>' +
      '<p>Phone: ' + dash(m.phone) + '<br>Age: ' + dash(m.age) + ' &nbsp; Gender: ' + dash(m.gender) + '<br>Address: ' + dash(m.address) + '</p>' +
      '<h4>Emergency Contact</h4>' +
      '<p>Name: ' + dash(m.emergency_name) + '<br>Phone: ' + dash(m.emergency_phone) + '<br>Relationship: ' + dash(m.emergency_relationship) + '</p>' +
      '<h4>Medical Information</h4>' +
      '<p>Medical condition: ' + yn(m.has_medical_condition) + (m.medical_notes ? ' — ' + m.medical_notes : '') +
      '<br>Previous injury: ' + yn(m.has_previous_injury) + (m.previous_injury_details ? ' — ' + m.previous_injury_details : '') +
      '<br>Taking medication: ' + yn(m.taking_medication) + '</p>' +
      '<h4>Fitness Information</h4>' +
      '<p>Goal: ' + dash(m.fitness_goal) + '<br>Previous gym experience: ' + yn(m.previous_gym_experience) + '</p>' +
      '<h4>Membership</h4>' +
      '<p>Plan: ' + dash(m.plan) + '<br>Start date: ' + dash(m.start_date || m.joined_at) + '<br>Payment: ' + dash(m.payment_info) + '<br>Check-ins: ' + dash(m.checkins) + '</p>' +
      '</div>'
    );
  }

  function ensureUi() {
    document.querySelectorAll('.login-roles, .login-divider').forEach(function (el) { el.remove(); });
    var modal = $('member-modal');
    if (modal) {
      var body = modal.querySelector('.modal-body');
      if (body && !body.dataset.regForm) {
        body.dataset.regForm = '1';
        body.innerHTML = formHtml();
      }
      var title = modal.querySelector('.modal-title');
      if (title) title.textContent = 'GYM MEMBERSHIP REGISTRATION FORM';
    }
    if (!$('member-preview-modal')) {
      var wrap = document.createElement('div');
      wrap.innerHTML = '<div class="modal-overlay" id="member-preview-modal"><div class="modal"><div class="modal-header"><div class="modal-title">MEMBER PREVIEW</div><button class="modal-close" id="preview-x" type="button">✕</button></div><div class="modal-body" id="member-preview-body"></div><div class="modal-footer"><button class="btn btn-ghost" id="preview-close" type="button">Close</button><button class="btn btn-primary" id="preview-edit" type="button">Edit information</button></div></div></div>';
      document.body.appendChild(wrap.firstChild);
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
  }

  function openModalEl(id) { var el = $(id); if (el) el.classList.add('open'); }
  function closeModalEl(id) { var el = $(id); if (el) el.classList.remove('open'); }

  window.openMemberForm = function (member) {
    ensureUi();
    editingId = member && member.id ? member.id : null;
    var title = document.querySelector('#member-modal .modal-title');
    if (title) title.textContent = editingId ? 'EDIT MEMBER INFORMATION' : 'GYM MEMBERSHIP REGISTRATION FORM';
    var submit = $('btn-submit-member');
    if (submit) submit.textContent = editingId ? 'Save changes' : 'Register Member';
    if (member) fillForm(member);
    else {
      fillForm({
        plan: 'Monthly',
        start_date: new Date().toISOString().slice(0, 10),
        has_medical_condition: 'No',
        has_previous_injury: 'No',
        taking_medication: 'No',
        previous_gym_experience: 'No'
      });
      if ($('m-name')) $('m-name').value = '';
      if ($('m-phone')) $('m-phone').value = '';
    }
    openModalEl('member-modal');
  };

  window.showMemberPreview = function (member) {
    window._previewMember = member;
    var body = $('member-preview-body');
    if (body) body.innerHTML = previewHtml(member);
    openModalEl('member-preview-modal');
  };

  async function saveMember() {
    var body = readForm();
    if (!body.full_name || !body.phone || !body.plan) {
      alert('Full name, phone number and membership plan are required.');
      return;
    }
    try {
      if (editingId) {
        await apiFix('members.php?id=' + editingId, 'PUT', body);
        if (typeof showAlert === 'function') showAlert('Member details updated.');
      } else {
        var json = await apiFix('members.php', 'POST', body);
        if (typeof showAlert === 'function') showAlert(body.full_name + ' registered — ID: ' + json.member_code);
      }
      closeModalEl('member-modal');
      if (typeof loadMembers === 'function') loadMembers();
    } catch (err) {
      alert(err.message);
    }
  }

  window.renderMembers = function (data) {
    data = data || [];
    var tbody = $('members-tbody');
    if (!tbody) return;
    tbody.innerHTML = data.length === 0
      ? '<tr><td colspan="8" style="text-align:center;padding:2rem">No members found.</td></tr>'
      : data.map(function (m) {
          return '<tr>' +
            '<td>' + dash(m.member_code) + '</td>' +
            '<td><strong>' + dash(m.full_name) + '</strong><div style="font-size:12px;opacity:.75">' + dash(m.phone) + (m.age ? ' · Age ' + m.age : '') + '</div></td>' +
            '<td>' + dash(m.plan) + '</td>' +
            '<td>' + dash(m.status) + '</td>' +
            '<td>' + dash(m.gender) + '</td>' +
            '<td>' + dash(m.start_date || m.joined_at) + '</td>' +
            '<td>' +
              '<button class="btn btn-ghost btn-sm" data-act="view" data-id="' + m.id + '">View</button> ' +
              '<button class="btn btn-ghost btn-sm" data-act="edit" data-id="' + m.id + '">Edit</button> ' +
              '<button class="btn btn-danger btn-sm" data-act="archive" data-id="' + m.id + '">Archive</button>' +
            '</td></tr>';
        }).join('');
    tbody.querySelectorAll('button[data-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = data.find(function (x) { return String(x.id) === String(btn.getAttribute('data-id')); });
        if (!row) return;
        var act = btn.getAttribute('data-act');
        if (act === 'view') window.showMemberPreview(row);
        if (act === 'edit') window.openMemberForm(row);
        if (act === 'archive') {
          var reason = prompt('Reason for archiving ' + row.full_name + '?');
          if (!reason) return;
          apiFix('members.php?id=' + row.id, 'PUT', { archive: true, archive_reason: reason })
            .then(function () { if (typeof loadMembers === 'function') loadMembers(); })
            .catch(function (err) { alert(err.message); });
        }
      });
    });
  };

  async function attemptLoginFix() {
    var btn = $('login-submit');
    var username = $('login-user').value.trim().toLowerCase();
    var password = $('login-pass').value;
    var errBox = $('login-error');
    if (!username || !password) {
      errBox.textContent = 'Please enter both username and password.';
      errBox.classList.add('show');
      return;
    }
    btn.classList.add('loading'); btn.disabled = true; errBox.classList.remove('show');
    try {
      var json = await apiFix('auth.php?action=login', 'POST', { username: username, password: password });
      if (typeof loginSuccess === 'function') loginSuccess(json.user);
      applyRoleAccess(json.user);
    } catch (err) {
      errBox.textContent = '❌ ' + (err.message || 'Login failed.');
      errBox.classList.add('show');
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
      navigate('members', document.querySelector('.nav-item[data-page="members"]'));
    }
  }

  async function loadStaff() {
    var tbody = $('staff-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    try {
      var json = await apiFix('staff.php');
      var data = json.data || [];
      tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5">No staff accounts yet.</td></tr>' : data.map(function (s) {
        var btn = s.role === 'superadmin' ? '' : '<button class="btn btn-danger btn-sm" data-remove-staff="' + s.id + '">Remove</button>';
        return '<tr><td>' + s.username + '</td><td>' + s.full_name + '</td><td>' + s.role + '</td><td>' + String(s.created_at || '').slice(0,10) + '</td><td>' + btn + '</td></tr>';
      }).join('');
      tbody.querySelectorAll('[data-remove-staff]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (!confirm('Remove this staff account?')) return;
          try { await apiFix('staff.php?id=' + btn.getAttribute('data-remove-staff'), 'DELETE'); loadStaff(); }
          catch (err) { alert(err.message); }
        });
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="5">' + err.message + '</td></tr>';
    }
  }

  function wire() {
    ensureUi();
    ['nav-login-btn', 'open-dashboard-btn', 'mob-login-link'].forEach(function (id) {
      var el = $(id);
      if (!el || el.dataset.wired) return;
      el.dataset.wired = '1';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof openLoginScreen === 'function') openLoginScreen();
        else { var o = $('login-overlay'); if (o) o.classList.add('open'); }
      });
    });
    var submit = $('login-submit');
    if (submit && !submit.dataset.wired) {
      submit.dataset.wired = '1';
      submit.addEventListener('click', attemptLoginFix);
    }
    var pass = $('login-pass');
    if (pass) pass.addEventListener('keydown', function (e) { if (e.key === 'Enter') attemptLoginFix(); });
    var add = $('btn-add-member');
    if (add) {
      add.onclick = function (e) { e.preventDefault(); window.openMemberForm(null); };
    }
    var save = $('btn-submit-member');
    if (save) {
      save.onclick = function (e) { e.preventDefault(); saveMember(); };
    }
    var cancel = $('btn-cancel-member');
    if (cancel) cancel.onclick = function () { closeModalEl('member-modal'); };
    ['preview-close', 'preview-x'].forEach(function (id) {
      var el = $(id); if (el) el.onclick = function () { closeModalEl('member-preview-modal'); };
    });
    var pedit = $('preview-edit');
    if (pedit) pedit.onclick = function () {
      closeModalEl('member-preview-modal');
      if (window._previewMember) window.openMemberForm(window._previewMember);
    };
    var addStaff = $('btn-add-staff');
    if (addStaff) addStaff.onclick = function () { openModalEl('staff-modal'); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
