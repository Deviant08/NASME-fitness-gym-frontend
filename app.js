/* ════════════════════════════════════════
   NASME GYM — app.js
   Real backend connection via fetch()
   Change API_BASE to switch between
   local XAMPP and live Railway server.
════════════════════════════════════════ */

const API_BASE = "https://nasme-fitness-gym-backend-production.up.railway.app/api";

/* ── State ── */
let currentUser = null;
let currentPage = 'dashboard';

/* ── Helpers ── */
async function api(file, method = 'GET', body = null, params = {}) {
  const url = new URL(`${API_BASE}/${file}`);
  Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== '') url.searchParams.set(k, v); });
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast toast-${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

function formatNaira(n) {
  return '₦' + Number(n || 0).toLocaleString();
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

/* ── Auth / Session ── */
async function checkSession() {
  try {
    const json = await api('auth.php?action=me');
    if (json.user) {
      currentUser = json.user;
      showDashboard();
      return true;
    }
  } catch (_) {}
  showLogin();
  return false;
}

function showLogin() {
  document.getElementById('login-overlay')?.classList.remove('hidden');
  document.getElementById('dashboard-app')?.classList.add('hidden');
  document.getElementById('site-main')?.classList.remove('hidden');
}

function showDashboard() {
  document.getElementById('login-overlay')?.classList.add('hidden');
  document.getElementById('site-main')?.classList.add('hidden');
  document.getElementById('dashboard-app')?.classList.remove('hidden');
  applyRoleUI();
  navigate(currentPage || 'dashboard');
}

function applyRoleUI() {
  const role = (currentUser?.role || '').toLowerCase();
  const isStaff = role === 'admin' || role === 'staff';
  $$('[data-staff-only]').forEach(el => el.style.display = isStaff ? '' : 'none');
  $$('[data-member-only]').forEach(el => el.style.display = role === 'member' ? '' : 'none');
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
  showLogin();
}

/* ── Navigation ── */
function navigate(page) {
  currentPage = page;
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
  const titles = {
    dashboard: 'DASHBOARD',
    members: 'MEMBER MANAGEMENT',
    payments: 'PAYMENTS & SUBSCRIPTIONS',
    equipment: 'EQUIPMENT MANAGEMENT',
    security: 'DATA & SECURITY',
    profile: 'MY PROFILE',
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[page] || page.toUpperCase();
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'members':   loadMembers();   break;
    case 'payments':  loadPayments();  break;
    case 'equipment': loadEquipment(); break;
    case 'security':  loadAudit();     break;
    case 'profile':   loadProfile();   break;
  }
}

/* ── Data loaders ── */
async function loadDashboard() {
  try {
    const json = await api('stats.php');
    const d = json.data || json;
    setText('stat-members', d.members ?? d.total_members ?? '—');
    setText('stat-active', d.active ?? d.active_members ?? '—');
    setText('stat-revenue', formatNaira(d.revenue ?? d.month_revenue ?? 0));
    setText('stat-equipment', d.equipment ?? d.equipment_count ?? '—');
    if (json.activity || d.activity) renderActivityFeed(json.activity || d.activity);
  } catch (e) {
    showToast(e.message || 'Failed to load dashboard', 'error');
  }
}

async function loadMembers(q = '', plan = '') {
  try {
    const json = await api('members.php', 'GET', null, { q, plan });
    renderMembers(json.data || []);
  } catch (e) {
    showToast(e.message || 'Failed to load members', 'error');
  }
}

async function loadPayments() {
  try {
    const json = await api('payments.php');
    renderPayments(json.data || []);
  } catch (e) {
    showToast(e.message || 'Failed to load payments', 'error');
  }
}

async function loadEquipment() {
  try {
    const json = await api('equipment.php');
    renderEquipment(json.data || []);
  } catch (e) {
    showToast(e.message || 'Failed to load equipment', 'error');
  }
}

async function loadAudit() {
  try {
    const json = await api('audit.php');
    renderAuditLog(json.data || []);
  } catch (e) {
    showToast(e.message || 'Failed to load audit log', 'error');
  }
}

async function loadProfile() {
  // placeholder for member self-view if needed
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── Renderers ── */
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
      <td>${m.full_name || ''}</td>
      <td>${m.phone || ''}</td>
      <td>${m.plan || ''}</td>
      <td><span class="badge badge-${(m.status || '').toLowerCase()}">${m.status || ''}</span></td>
      <td>${formatDate(m.joined_at || m.created_at)}</td>
      <td class="actions">
        <button class="btn-sm btn-ghost" data-action="edit-member" data-id="${m.id}">Edit</button>
        <button class="btn-sm btn-ghost" data-action="reset-login" data-id="${m.id}">Reset login</button>
      </td>
    </tr>`).join('');
  tbody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleMemberAction(btn.dataset.action, btn.dataset.id));
  });
}

function renderPayments(data = []) {
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">No payments yet.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><code>${p.txn_code || p.id || ''}</code></td>
      <td>${p.member_name || p.member_code || ''}</td>
      <td>${p.plan || ''}</td>
      <td>${formatNaira(p.amount)}</td>
      <td>${p.method || ''}</td>
      <td><span class="badge badge-${(p.status || 'pending').toLowerCase()}">${p.status || ''}</span></td>
      <td>${formatDate(p.paid_at || p.created_at)}</td>
    </tr>`).join('');
}

function renderEquipment(data = []) {
  const tbody = document.getElementById('equipment-tbody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No equipment recorded.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(e => `
    <tr>
      <td>${e.name || ''}</td>
      <td>${e.category || ''}</td>
      <td>${e.quantity ?? '—'}</td>
      <td><span class="badge badge-${(e.status || 'ok').toLowerCase()}">${e.status || ''}</span></td>
      <td>${formatDate(e.last_maintained || e.updated_at)}</td>
    </tr>`).join('');
}

function renderActivityFeed(data = []) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  if (!data.length) {
    feed.innerHTML = '<div class="empty-state">No recent activity.</div>';
    return;
  }
  feed.innerHTML = data.slice(0, 12).map(a => `
    <div class="activity-item">
      <div class="activity-icon">${a.icon || '•'}</div>
      <div class="activity-body">
        <div class="activity-text">${a.message || a.action || ''}</div>
        <div class="activity-time">${formatDate(a.created_at)}</div>
      </div>
    </div>`).join('');
}

function renderAuditLog(data = []) {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No audit entries.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(a => `
    <tr>
      <td>${formatDate(a.created_at)}</td>
      <td>${a.actor || a.user || '—'}</td>
      <td>${a.action || ''}</td>
      <td>${a.entity || a.target || ''}</td>
      <td>${a.details || a.ip || ''}</td>
    </tr>`).join('');
}

/* ── Member actions ── */
async function handleMemberAction(action, id) {
  if (action === 'reset-login') {
    if (!confirm('Reset login credentials for this member? A temporary password will be shown once.')) return;
    try {
      const json = await api('members.php?action=reset_login', 'POST', { id: Number(id) });
      const creds = json.credentials || json;
      alert(`New credentials:\nUsername: ${creds.username || creds.member_code}\nTemp password: ${creds.temp_password || creds.password}\n\nShow this once to the member.`);
      showToast('Login reset');
    } catch (e) {
      showToast(e.message || 'Reset failed', 'error');
    }
  } else if (action === 'edit-member') {
    showToast('Edit member UI coming soon');
  }
}

async function addMember(formData) {
  try {
    const json = await api('members.php?action=add', 'POST', formData);
    showToast('Member added');
    if (json.credentials) {
      const c = json.credentials;
      alert(`Member created.\nCode: ${c.member_code || json.member_code}\nUsername: ${c.username || ''}\nTemp password: ${c.temp_password || c.password || ''}\n\nShare these once with the member.`);
    }
    loadMembers();
    closeModal('member-modal');
  } catch (e) {
    showToast(e.message || 'Could not add member', 'error');
  }
}

/* ── Modal helpers ── */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

/* ── Init ── */
function initApp() {
  // Nav
  $$('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.page));
  });
  document.getElementById('logout-btn')?.addEventListener('click', doLogout);
  document.getElementById('login-btn')?.addEventListener('click', doLogin);
  document.getElementById('login-pass')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });

  // Open login from marketing CTA
  document.getElementById('open-login')?.addEventListener('click', () => {
    document.getElementById('login-overlay')?.classList.remove('hidden');
  });
  document.getElementById('close-login')?.addEventListener('click', () => {
    document.getElementById('login-overlay')?.classList.add('hidden');
  });

  // Add member form
  document.getElementById('add-member-btn')?.addEventListener('click', () => openModal('member-modal'));
  document.getElementById('member-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    addMember(fd);
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  // Member search
  document.getElementById('member-search')?.addEventListener('input', e => {
    loadMembers(e.target.value.trim());
  });

  checkSession();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
