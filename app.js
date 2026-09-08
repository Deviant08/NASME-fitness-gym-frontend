const API_BASE = "https://nasme-fitness-gym-backend-production.up.railway.app/api";

let currentUser = null;
let currentPage = 'dashboard';
let membersCache = [];
let previewMember = null;
let editingMemberId = null; // explicit id while editing (not only hidden form field)

async function api(file, method = 'GET', body = null, params = {}) {
  const [path, qs] = String(file).split('?');
  const url = new URL(`${API_BASE}/${path}`);
  if (qs) {
    new URLSearchParams(qs).forEach((v, k) => url.searchParams.set(k, v));
  }
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== '') url.searchParams.set(k, v);
  });
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  let res;
  try {
    res = await fetch(url, opts);
  } catch (err) {
    throw new Error('Failed to fetch — check network or backend status');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function dash(v) { return (v === null || v === undefined || v === '') ? '—' : String(v); }

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast toast-${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

function formatNaira(n) { return '₦' + Number(n || 0).toLocaleString(); }
function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function isAdmin() {
  const role = (currentUser?.role || '').toLowerCase();
  return role === 'admin' || role === 'superadmin';
}

function showLanding() {
  document.getElementById('login-overlay')?.classList.add('hidden');
  document.getElementById('dashboard-app')?.classList.add('hidden');
  document.getElementById('site-main')?.classList.remove('hidden');
  document.querySelectorAll('.modal-overlay').forEach(el => {
    if (el.id !== 'login-overlay') el.classList.remove('open');
  });
}

function openLogin() {
  document.getElementById('login-overlay')?.classList.remove('hidden');
  const user = document.getElementById('login-user');
  if (user) setTimeout(() => user.focus(), 50);
}

async function checkSession() {
  try {
    const json = await api('auth.php?action=me');
    if (json.user) {
      currentUser = json.user;
      showDashboard();
      return true;
    }
  } catch (_) {}
  showLanding();
  return false;
}

function showDashboard() {
  document.getElementById('login-overlay')?.classList.add('hidden');
  document.getElementById('site-main')?.classList.add('hidden');
  document.getElementById('dashboard-app')?.classList.remove('hidden');
  applyRoleUI();
  navigate(isAdmin() ? 'dashboard' : 'members');
}

function applyRoleUI() {
  $$('.admin-only').forEach(el => { el.style.display = isAdmin() ? '' : 'none'; });
  const nameEl = document.getElementById('sidebar-user');
  if (nameEl && currentUser) nameEl.textContent = currentUser.full_name || currentUser.username || 'User';
  const roleEl = document.getElementById('sidebar-role');
  if (roleEl) roleEl.textContent = (currentUser?.role || 'user').toUpperCase();
}

async function doLogin() {
  const username = document.getElementById('login-user')?.value.trim();
  const password = document.getElementById('login-pass')?.value;
  const err = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  if (!username || !password) {
    if (err) { err.textContent = 'Enter username and password.'; err.classList.add('show'); }
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }
  if (err) err.classList.remove('show');
  try {
    const json = await api('auth.php?action=login', 'POST', { username, password });
    currentUser = json.user;
    showDashboard();
    showToast('Welcome back, ' + (currentUser.full_name || currentUser.username));
  } catch (e) {
    if (err) { err.textContent = e.message || 'Login failed'; err.classList.add('show'); }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
  }
}

async function doLogout() {
  try { await api('auth.php?action=logout', 'POST'); } catch (_) {}
  currentUser = null;
  showLanding();
}

function navigate(page) {
  currentPage = page;
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
  const titles = {
    dashboard: 'DASHBOARD',
    members: 'MEMBER MANAGEMENT',
    staff: 'STAFF MANAGEMENT',
    payments: 'PAYMENTS & SUBSCRIPTIONS',
    equipment: 'EQUIPMENT MANAGEMENT',
    security: 'DATA & SECURITY',
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[page] || page.toUpperCase();
  if (page === 'dashboard') loadDashboard();
  if (page === 'members') loadMembers();
  if (page === 'staff') loadStaff();
  if (page === 'payments') loadPayments();
  if (page === 'equipment') loadEquipment();
  if (page === 'security') loadAudit();
}

async function loadDashboard() {
  try {
    const json = await api('stats.php');
    const d = json.data || json;
    setText('stat-members', d.members ?? d.total_members ?? '—');
    setText('stat-active', d.active ?? d.active_members ?? '—');
    setText('stat-revenue', formatNaira(d.revenue ?? d.month_revenue ?? 0));
    setText('stat-equipment', d.equipment ?? d.equipment_count ?? '—');
    if (json.activity || d.activity) renderActivityFeed(json.activity || d.activity);
  } catch (e) { showToast(e.message || 'Failed to load dashboard', 'error'); }
}

async function loadMembers(q = '') {
  try {
    const json = await api('members.php', 'GET', null, { q });
    membersCache = json.data || [];
    renderMembers(membersCache);
  } catch (e) { showToast(e.message || 'Failed to load members', 'error'); }
}

async function loadPayments() {
  try { renderPayments((await api('payments.php')).data || []); }
  catch (e) { showToast(e.message || 'Failed to load payments', 'error'); }
}
async function loadEquipment() {
  try { renderEquipment((await api('equipment.php')).data || []); }
  catch (e) { showToast(e.message || 'Failed to load equipment', 'error'); }
}
async function loadAudit() {
  try { renderAuditLog((await api('audit.php')).data || []); }
  catch (e) { showToast(e.message || 'Failed to load audit log', 'error'); }
}

async function loadStaff() {
  const tbody = document.getElementById('staff-tbody');
  if (!tbody) return;
  try {
    const json = await api('staff.php');
    const data = json.data || [];
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" class="empty">No staff accounts yet.</td></tr>' : data.map(s => `
      <tr>
        <td>${s.username}</td><td>${s.full_name}</td><td>${s.role}</td>
        <td>${formatDate(s.created_at)}</td>
        <td>${s.role === 'superadmin' ? '' : `<button class="btn-sm btn-ghost" data-remove-staff="${s.id}">Remove</button>`}</td>
      </tr>`).join('');
    tbody.querySelectorAll('[data-remove-staff]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this staff account?')) return;
        try { await api('staff.php?id=' + btn.dataset.removeStaff, 'DELETE'); loadStaff(); showToast('Staff removed'); }
        catch (e) { showToast(e.message, 'error'); }
      });
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5">${e.message}</td></tr>`;
  }
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function renderMembers(data = []) {
  const tbody = document.getElementById('members-tbody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">No members found.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(m => `
    <tr data-id="${m.id}">
      <td><code>${m.member_code || ''}</code></td>
      <td><strong>${m.full_name || ''}</strong>${m.age ? `<div class="muted">Age ${m.age}${m.gender ? ' · ' + m.gender : ''}</div>` : ''}</td>
      <td>${m.phone || ''}</td>
      <td>${m.plan || ''}</td>
      <td><span class="badge badge-${(m.status || '').toLowerCase()}">${m.status || ''}</span></td>
      <td>${formatDate(m.start_date || m.joined_at || m.created_at)}</td>
      <td class="actions">
        <button class="btn-sm btn-ghost" data-action="view" data-id="${m.id}">View</button>
        <button class="btn-sm btn-ghost" data-action="edit" data-id="${m.id}">Edit</button>
        <button class="btn-sm btn-ghost" data-action="archive" data-id="${m.id}">Archive</button>
      </td>
    </tr>`).join('');
  tbody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleMemberAction(btn.dataset.action, btn.dataset.id));
  });
}

function renderPayments(data = []) {
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;
  tbody.innerHTML = data.length === 0 ? '<tr><td colspan="7" class="empty">No payments yet.</td></tr>' : data.map(p => `
    <tr><td><code>${p.txn_code || ''}</code></td><td>${p.member_name || p.member_code || ''}</td><td>${p.plan || ''}</td>
    <td>${formatNaira(p.amount)}</td><td>${p.method || ''}</td>
    <td>${p.status || ''}</td><td>${formatDate(p.paid_at || p.created_at)}</td></tr>`).join('');
}
function renderEquipment(data = []) {
  const tbody = document.getElementById('equipment-tbody');
  if (!tbody) return;
  tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" class="empty">No equipment recorded.</td></tr>' : data.map(e => `
    <tr><td>${e.name || ''}</td><td>${e.category || ''}</td><td>${e.quantity ?? '—'}</td>
    <td>${e.status || ''}</td><td>${formatDate(e.last_maintained || e.updated_at)}</td></tr>`).join('');
}
function renderActivityFeed(data = []) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  feed.innerHTML = data.length === 0 ? '<div class="empty-state">No recent activity.</div>' : data.slice(0, 12).map(a => `
    <div class="activity-item"><div class="activity-text">${a.message || a.action || ''}</div>
    <div class="activity-time">${formatDate(a.created_at || a.logged_at)}</div></div>`).join('');
}
function renderAuditLog(data = []) {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" class="empty">No audit entries.</td></tr>' : data.map(a => `
    <tr><td>${formatDate(a.created_at || a.logged_at)}</td><td>${a.actor || a.by_user || '—'}</td>
    <td>${a.action || ''}</td><td>${a.entity || ''}</td><td>${a.details || ''}</td></tr>`).join('');
}

function previewHtml(m) {
  return `
    <h3>${dash(m.full_name)} <small>(${dash(m.member_code)})</small></h3>
    <p><strong>Status:</strong> ${dash(m.status)} &nbsp; <strong>Plan:</strong> ${dash(m.plan)}</p>
    <h4>Personal Information</h4>
    <p>Phone: ${dash(m.phone)}<br>Age: ${dash(m.age)} &nbsp; Gender: ${dash(m.gender)}<br>Address: ${dash(m.address)}</p>
    <h4>Emergency Contact</h4>
    <p>Name: ${dash(m.emergency_name)}<br>Phone: ${dash(m.emergency_phone)}<br>Relationship: ${dash(m.emergency_relationship)}</p>
    <h4>Medical Information</h4>
    <p>Medical condition: ${dash(m.has_medical_condition)}${m.medical_notes ? ' — ' + m.medical_notes : ''}<br>
    Previous injury: ${dash(m.has_previous_injury)}${m.previous_injury_details ? ' — ' + m.previous_injury_details : ''}<br>
    Taking medication: ${dash(m.taking_medication)}</p>
    <h4>Fitness Information</h4>
    <p>Goal: ${dash(m.fitness_goal)}<br>Previous gym experience: ${dash(m.previous_gym_experience)}</p>
    <h4>Membership</h4>
    <p>Plan: ${dash(m.plan)}<br>Start date: ${dash(m.start_date || m.joined_at)}<br>Payment: ${dash(m.payment_info)}</p>`;
}

function fillMemberForm(m) {
  const form = document.getElementById('member-form');
  if (!form) return;
  form.reset();
  if (!m) {
    editingMemberId = null;
    if (form.elements.id) form.elements.id.value = '';
    form.elements.plan.value = 'Monthly';
    if (form.elements.start_date) form.elements.start_date.value = new Date().toISOString().slice(0, 10);
    return;
  }
  editingMemberId = m.id != null ? String(m.id) : null;
  if (form.elements.id) form.elements.id.value = editingMemberId || '';
  Object.keys(m).forEach(k => {
    if (k === 'id') return;
    if (form.elements[k] != null && m[k] != null) form.elements[k].value = m[k];
  });
  if (form.elements.start_date && (m.start_date || m.joined_at)) {
    form.elements.start_date.value = String(m.start_date || m.joined_at).slice(0, 10);
  }
}

function openMemberForm(member) {
  previewMember = member || null;
  const title = document.getElementById('member-modal-title');
  const submit = document.getElementById('member-submit');
  if (title) title.textContent = member ? 'Edit Member Information' : 'Gym Membership Registration Form';
  if (submit) submit.textContent = member ? 'Save changes' : 'Register Member';
  fillMemberForm(member);
  openModal('member-modal');
}

function showPreview(member) {
  previewMember = member;
  const body = document.getElementById('member-preview-body');
  if (body) body.innerHTML = previewHtml(member);
  openModal('member-preview-modal');
}

async function handleMemberAction(action, id) {
  const row = membersCache.find(m => String(m.id) === String(id));
  if (action === 'view' && row) showPreview(row);
  if (action === 'edit' && row) openMemberForm(row);
  if (action === 'archive') {
    const reason = prompt('Reason for archiving this member?');
    if (!reason) return;
    try {
      await api('members.php?id=' + encodeURIComponent(id), 'PUT', { archive: true, archive_reason: reason });
      showToast('Member archived');
      loadMembers();
    } catch (e) { showToast(e.message || 'Archive failed', 'error'); }
  }
}

async function saveMember(formData) {
  try {
    const id = editingMemberId || formData.id || '';
    delete formData.id;

    // Drop empty strings so we don't wipe optional fields with blanks unintentionally
    Object.keys(formData).forEach(k => {
      if (formData[k] === '') delete formData[k];
    });

    if (id) {
      await api('members.php?id=' + encodeURIComponent(id), 'PUT', formData);
      showToast('Member details updated');
    } else {
      if (!formData.full_name || !formData.phone || !formData.plan) {
        showToast('Full name, phone and plan are required', 'error');
        return;
      }
      const json = await api('members.php', 'POST', formData);
      showToast('Member registered' + (json.member_code ? ' — ' + json.member_code : ''));
    }
    editingMemberId = null;
    closeModal('member-modal');
    loadMembers();
  } catch (e) {
    showToast(e.message || 'Could not save member', 'error');
  }
}

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function initApp() {
  $$('.nav-item[data-page]').forEach(item => item.addEventListener('click', () => navigate(item.dataset.page)));
  document.getElementById('logout-btn')?.addEventListener('click', doLogout);
  document.getElementById('back-to-site')?.addEventListener('click', showLanding);
  document.getElementById('login-btn')?.addEventListener('click', doLogin);
  document.getElementById('login-pass')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('open-login')?.addEventListener('click', openLogin);
  document.getElementById('close-login')?.addEventListener('click', () => document.getElementById('login-overlay')?.classList.add('hidden'));
  document.getElementById('add-member-btn')?.addEventListener('click', () => openMemberForm(null));
  document.getElementById('member-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    saveMember(fd);
  });
  document.getElementById('preview-edit-btn')?.addEventListener('click', () => {
    closeModal('member-preview-modal');
    if (previewMember) openMemberForm(previewMember);
  });
  document.getElementById('add-staff-btn')?.addEventListener('click', () => openModal('staff-modal'));
  document.getElementById('staff-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    try {
      await api('staff.php', 'POST', fd);
      closeModal('staff-modal');
      showToast('Staff account created');
      loadStaff();
      e.target.reset();
    } catch (err) { showToast(err.message, 'error'); }
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  document.getElementById('member-search')?.addEventListener('input', e => loadMembers(e.target.value.trim()));
  checkSession();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
else initApp();
