/* ════════════════════════════════════════
   NASME GYM — app.js
   Real backend connection via fetch()
   Change API_BASE to switch between
   local XAMPP and live Railway server.
════════════════════════════════════════ */

"use strict";

/* ══════════════════════════════════════
   CONFIG — change this one line when
   you go live on Railway
══════════════════════════════════════ */
const API_BASE = 'http://localhost/nasme-gym/api';
// Live example:
// const API_BASE = 'https://nasme-gym-backend.up.railway.app/api';


/* ══════════════════════════════════════
   FETCH HELPER
   Wraps every API call so you never
   repeat headers or error handling.
══════════════════════════════════════ */
async function api(file, method = 'GET', body = null, params = {}) {
  const url = new URL(`${API_BASE}/${file}`);
  Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });

  const opts = {
    method,
    credentials: 'include', // sends the session cookie automatically
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res  = await fetch(url, opts);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json;
}


/* ══════════════════════════════════════
   STATE
══════════════════════════════════════ */
let currentUser = null;
let currentPage = 'dashboard';


/* ══════════════════════════════════════
   AUTH
══════════════════════════════════════ */
function openLoginScreen() {
  document.getElementById('login-overlay').classList.add('open');
  setTimeout(() => document.getElementById('login-user').focus(), 200);
}

function closeLoginScreen() {
  document.getElementById('login-overlay').classList.remove('open');
  document.getElementById('login-error').classList.remove('show');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

async function attemptLogin() {
  const btn      = document.getElementById('login-submit');
  const username = document.getElementById('login-user').value.trim().toLowerCase();
  const password = document.getElementById('login-pass').value;

  if (!username || !password) {
    document.getElementById('login-error').classList.add('show');
    return;
  }

  /* Show spinner */
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const json = await api('auth.php?action=login', 'POST', { username, password });
    loginSuccess(json.user);
  } catch (err) {
    /* Wrong credentials or server error */
    document.getElementById('login-error').classList.add('show');
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

/* Called after successful login — receives user object from backend */
function loginSuccess(user) {
  currentUser = user;
  closeLoginScreen();

  /* Update UI with real user info from database */
  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  document.getElementById('user-name').textContent   = user.full_name;
  document.getElementById('user-role').textContent   = user.role;
  document.getElementById('user-avatar').textContent = initials;

  document.getElementById('landing-page').style.display   = 'none';
  document.getElementById('dashboard-app').style.display  = 'block';

  updateGreeting();
  loadDashboard(); /* load real data immediately */
}

/* Quick login buttons — fill credentials and submit */
function quickLogin(role) {
  const creds = { admin: ['admin', 'admin123'], staff: ['staff', 'staff123'] };
  const [u, p] = creds[role] || [];
  if (!u) return;
  document.getElementById('login-user').value = u;
  document.getElementById('login-pass').value = p;
  attemptLogin();
}

async function logoutDashboard() {
  if (!confirm('Log out and return to the website?')) return;
  try { await api('auth.php?action=logout', 'POST'); } catch (_) {}
  currentUser = null;
  document.getElementById('dashboard-app').style.display = 'none';
  document.getElementById('landing-page').style.display  = 'block';
}

function closeDashboard() {
  document.getElementById('dashboard-app').style.display = 'none';
  document.getElementById('landing-page').style.display  = 'block';
}

function togglePassword() {
  const inp = document.getElementById('login-pass');
  const eye = document.getElementById('pw-eye');
  if (inp.type === 'password') { inp.type = 'text';     eye.textContent = '🙈'; }
  else                          { inp.type = 'password'; eye.textContent = '👁'; }
}


/* ══════════════════════════════════════
   GREETING + CLOCK
══════════════════════════════════════ */
function updateGreeting() {
  const h     = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const name  = currentUser ? currentUser.full_name.split(' ')[0] : 'Admin';
  const el    = document.getElementById('wb-greeting');
  if (el) el.textContent = `${greet}, ${name} 👋`;

  const now    = new Date();
  const timeEl = document.getElementById('wb-time');
  if (timeEl) {
    timeEl.innerHTML =
      `<div style="font-size:13px">${now.toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
       <div style="font-size:20px;font-family:var(--fm);margin-top:4px;color:var(--maroon-lt)">${now.toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'})}</div>`;
  }
}
setInterval(updateGreeting, 30000);


/* ══════════════════════════════════════
   LOADING STATE HELPER
   Shows a spinner inside any table/grid
   while data is being fetched.
══════════════════════════════════════ */
function setLoading(elementId, show) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (show) {
    el.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2.5rem;color:var(--text-muted)">
      ⏳ Loading...</td></tr>`;
  }
}
function setGridLoading(elementId, show) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (show) {
    el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">⏳ Loading...</div>`;
  }
}


/* ══════════════════════════════════════
   NAVIGATION
══════════════════════════════════════ */
function navigate(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (el) el.classList.add('active');

  const titles = {
    dashboard: 'DASHBOARD',
    members:   'MEMBER MANAGEMENT',
    payments:  'PAYMENTS & SUBSCRIPTIONS',
    security:  'DATA & SECURITY',
    equipment: 'EQUIPMENT MANAGEMENT',
    store:     'ONLINE GYM STORE',
  };
  document.getElementById('pageTitle').textContent = titles[page] || page.toUpperCase();

  currentPage = page;
  closeSidebar();

  /* Load fresh data for whichever page the user navigated to */
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'members':   loadMembers();   break;
    case 'payments':  loadPayments();  break;
    case 'equipment': loadEquipment(); break;
    case 'store':     loadStore();     break;
    case 'security':  loadAudit();     break;
  }
}

function showCurrentModal() {
  const map = {
    members:   'member-modal',
    payments:  'payment-modal',
    equipment: 'equipment-modal',
    store:     'product-modal',
  };
  if (map[currentPage]) openModal(map[currentPage]);
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebar()   { document.getElementById('sidebar').classList.remove('open'); }
function openModal(id)    { document.getElementById(id).classList.add('open'); }
function closeModal(id)   { document.getElementById(id).classList.remove('open'); }


/* ══════════════════════════════════════
   ALERT
══════════════════════════════════════ */
function showAlert(msg, type = 'success') {
  const a = document.getElementById('alert');
  a.className = `alert alert-${type} show`;
  a.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  setTimeout(() => a.classList.remove('show'), 4000);
}


/* ══════════════════════════════════════
   LOAD FUNCTIONS — fetch real data
   from the PHP API and call render.
══════════════════════════════════════ */

/* ── Dashboard stats ── */
async function loadDashboard() {
  try {
    const json = await api('stats.php');
    const d    = json.data;

    /* Update stat cards with real numbers */
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('dash-members',  d.total_members);
    set('dash-revenue',  `₦${Number(d.monthly_revenue).toLocaleString()}`);
    set('dash-equipment', d.equipment_total);
    set('dash-orders',   d.pending_orders);
  } catch (err) {
    console.error('Stats load failed:', err.message);
  }

  /* Also reload activity (audit log preview) */
  try {
    const json = await api('audit.php', 'GET', null, { limit: '5' });
    renderActivityFeed(json.data);
  } catch (_) {}
}

/* ── Members ── */
async function loadMembers(q = '', plan = '') {
  setLoading('members-tbody', true);
  try {
    const json = await api('members.php', 'GET', null, { q, plan });
    renderMembers(json.data);
    /* Update counter */
    const el = document.getElementById('dash-members');
    if (el) el.textContent = json.total;
  } catch (err) {
    showAlert('Could not load members: ' + err.message, 'error');
  }
}

/* ── Payments ── */
async function loadPayments() {
  setLoading('payments-tbody', true);
  try {
    const json = await api('payments.php');
    renderPayments(json.data);
  } catch (err) {
    showAlert('Could not load payments: ' + err.message, 'error');
  }
}

/* ── Equipment ── */
async function loadEquipment() {
  setGridLoading('equip-grid', true);
  try {
    const json = await api('equipment.php');
    renderEquipment(json.data);
  } catch (err) {
    showAlert('Could not load equipment: ' + err.message, 'error');
  }
}

/* ── Store (products + orders) ── */
async function loadStore() {
  setGridLoading('store-grid', true);
  setLoading('orders-tbody', true);
  try {
    const [prods, ords] = await Promise.all([
      api('products.php'),
      api('orders.php'),
    ]);
    renderStore(prods.data);
    renderOrders(ords.data);
  } catch (err) {
    showAlert('Could not load store: ' + err.message, 'error');
  }
}

/* ── Audit log ── */
async function loadAudit() {
  try {
    const json = await api('audit.php', 'GET', null, { limit: '50' });
    renderAuditLog(json.data);
  } catch (err) {
    showAlert('Could not load audit log: ' + err.message, 'error');
  }
}


/* ══════════════════════════════════════
   RENDER FUNCTIONS — unchanged from before,
   just now receive real data from the API.
══════════════════════════════════════ */

function renderMembers(data = []) {
  document.getElementById('members-tbody').innerHTML = data.length === 0
    ? `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No members found.</td></tr>`
    : data.map(m => `
      <tr>
        <td><span style="font-family:var(--fm);color:#9090e0">${m.member_code}</span></td>
        <td><strong>${m.full_name}</strong></td>
        <td><span class="badge badge-${m.plan.toLowerCase()}">${m.plan}</span></td>
        <td><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></td>
        <td>${m.checkins}</td>
        <td>${m.joined_at}</td>
        <td>
          <button class="btn btn-ghost btn-sm"   data-action="suspend" data-id="${m.id}">Suspend</button>
          <button class="btn btn-danger btn-sm"  data-action="delete"  data-id="${m.id}">Delete</button>
        </td>
      </tr>`).join('');

  /* Wire action buttons after render */
  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteMember(btn.dataset.id));
  });
  document.querySelectorAll('[data-action="suspend"]').forEach(btn => {
    btn.addEventListener('click', () => suspendMember(btn.dataset.id));
  });
}

function renderPayments(data = []) {
  document.getElementById('payments-tbody').innerHTML = data.length === 0
    ? `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No transactions found.</td></tr>`
    : data.map(p => `
      <tr>
        <td><span style="font-family:var(--fm);color:#9090e0">${p.txn_code}</span></td>
        <td>${p.member_name}</td>
        <td>${p.plan}</td>
        <td style="font-family:var(--fm);color:var(--success)">₦${Number(p.amount).toLocaleString()}</td>
        <td>${p.method}</td>
        <td><span class="badge badge-${p.status === 'Completed' ? 'active' : 'pending'}">${p.status}</span></td>
        <td>${p.paid_at}</td>
      </tr>`).join('');
}

function renderEquipment(data = []) {
  const sc = {
    Available:          'var(--success)',
    'In Use':           '#9090e0',
    'Under Maintenance':'var(--warning)',
    Retired:            'var(--text-muted)',
  };
  document.getElementById('equip-grid').innerHTML = data.length === 0
    ? `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">No equipment found.</div>`
    : data.map(e => `
      <div class="equip-card">
        <div class="equip-icon">${categoryIcon(e.category)}</div>
        <div class="equip-name">${e.name}</div>
        <div class="equip-detail">${e.category} · ${e.location} · Qty: ${e.quantity}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="badge badge-${e.condition_ === 'Excellent' ? 'active' : e.condition_ === 'Needs Repair' ? 'expired' : 'pending'}"
                style="font-size:9px">${e.condition_}</span>
          <span style="font-size:11px;color:${sc[e.status] || 'var(--text-muted)'}">${e.status}</span>
        </div>
      </div>`).join('');
}

function renderStore(data = []) {
  document.getElementById('store-grid').innerHTML = data.length === 0
    ? `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">No products found.</div>`
    : data.map(p => `
      <div class="product-card">
        <div class="product-img">${categoryIcon(p.category)}</div>
        <div class="product-body">
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.description || ''}</div>
          <div class="product-footer">
            <div class="product-price">₦${Number(p.price).toLocaleString()}</div>
            <div>
              <span style="font-size:11px;color:var(--text-muted)">Stock: ${p.stock}</span>
              <button class="btn btn-primary btn-sm" style="margin-left:8px"
                      data-action="buy" data-id="${p.id}" data-name="${p.name}" data-stock="${p.stock}">Buy</button>
            </div>
          </div>
          ${p.stock < 10 ? `<div style="font-size:10px;color:var(--warning);margin-top:6px">⚠️ Low stock</div>` : ''}
        </div>
      </div>`).join('');

  /* Wire buy buttons */
  document.querySelectorAll('[data-action="buy"]').forEach(btn => {
    btn.addEventListener('click', () => buyProduct(btn.dataset.id, btn.dataset.name, Number(btn.dataset.stock)));
  });
}

function renderOrders(data = []) {
  document.getElementById('orders-tbody').innerHTML = data.length === 0
    ? `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No orders yet.</td></tr>`
    : data.map(o => `
      <tr>
        <td><span style="font-family:var(--fm);color:#9090e0">${o.order_code}</span></td>
        <td>${o.member_name}</td>
        <td>${o.product_name}</td>
        <td>${o.quantity}</td>
        <td style="font-family:var(--fm)">₦${Number(o.total).toLocaleString()}</td>
        <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
        <td>${o.ordered_at}</td>
      </tr>`).join('');
}

function renderActivityFeed(data = []) {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  const colorMap = {
    success: 'var(--success)',
    danger:  'var(--danger)',
    warning: 'var(--warning)',
    maroon:  'var(--maroon-lt)',
    navy:    '#9090e0',
    info:    'var(--text-muted)',
  };
  feed.innerHTML = data.map(entry => {
    const t = new Date(entry.logged_at);
    const timeAgo = formatTimeAgo(t);
    return `
      <div class="activity-item">
        <div class="activity-dot" style="background:${colorMap[entry.color_tag] || 'var(--text-muted)'}"></div>
        <div class="activity-text">${entry.action}</div>
        <div class="activity-time">${timeAgo}</div>
      </div>`;
  }).join('') || `<div style="color:var(--text-muted);font-size:13px;padding:1rem 0">No activity yet.</div>`;
}

function renderAuditLog(data = []) {
  const log = document.getElementById('audit-log');
  if (!log) return;
  const colorMap = {
    success: 'var(--success)', danger: 'var(--danger)',
    warning: 'var(--warning)', maroon: 'var(--maroon-lt)',
    navy: '#9090e0', info: 'var(--text-muted)',
  };
  log.innerHTML = data.map(entry => {
    const t = new Date(entry.logged_at).toTimeString().slice(0, 8);
    return `
      <div class="log-entry">
        <div class="log-dot" style="background:${colorMap[entry.color_tag] || 'var(--text-muted)'}"></div>
        <div class="log-time">${t}</div>
        <div class="log-event">${entry.action}${entry.by_user ? ` <span style="color:var(--text-muted)">— ${entry.by_user}</span>` : ''}</div>
      </div>`;
  }).join('') || `<div style="color:var(--text-muted);padding:1rem;font-size:13px">No audit entries yet.</div>`;
}


/* ══════════════════════════════════════
   ACTION FUNCTIONS — write to real DB
══════════════════════════════════════ */

/* ── Add Member ── */
async function addMember() {
  const name  = document.getElementById('m-name').value.trim();
  const phone = document.getElementById('m-phone').value.trim();
  const plan  = document.getElementById('m-plan').value;

  if (!name || !phone) { showAlert('Name and phone are required.', 'error'); return; }

  const btn = document.getElementById('btn-submit-member');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    const json = await api('members.php', 'POST', {
      full_name:         name,
      phone,
      plan,
      email:             document.getElementById('m-email').value.trim()        || null,
      date_of_birth:     document.getElementById('m-dob').value                 || null,
      gender:            document.getElementById('m-gender').value              || null,
      emergency_contact: document.getElementById('m-emergency').value.trim()    || null,
      fitness_goal:      document.getElementById('m-goal').value.trim()         || null,
      medical_notes:     document.getElementById('m-medical').value.trim()      || null,
    });

    closeModal('member-modal');
    showAlert(`${name} registered — ID: ${json.member_code}`);
    loadMembers(); /* refresh the table from DB */

    /* Clear form */
    ['m-name','m-phone','m-email','m-dob','m-emergency','m-goal','m-medical']
      .forEach(id => { document.getElementById(id).value = ''; });

  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Register Member';
  }
}

/* ── Delete Member ── */
async function deleteMember(id) {
  if (!confirm(`Permanently delete member ID ${id}? This cannot be undone.`)) return;
  try {
    await api(`members.php?id=${id}`, 'DELETE');
    showAlert(`Member removed.`);
    loadMembers();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

/* ── Suspend Member ── */
async function suspendMember(id) {
  if (!confirm(`Suspend member ID ${id}?`)) return;
  try {
    await api(`members.php?id=${id}`, 'PUT', { status: 'Suspended' });
    showAlert('Member suspended.');
    loadMembers();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

/* ── Record Payment ── */
async function addPayment() {
  const memberName = document.getElementById('p-name').value.trim();
  const amount     = document.getElementById('p-amount').value;

  if (!memberName || !amount) { showAlert('Member name and amount are required.', 'error'); return; }

  /* Look up the member_id by name */
  let memberId = null;
  try {
    const search = await api('members.php', 'GET', null, { q: memberName });
    if (search.data.length === 0) {
      showAlert(`No member found with name "${memberName}". Register them first.`, 'error');
      return;
    }
    memberId = search.data[0].id;
  } catch (err) {
    showAlert('Could not find member: ' + err.message, 'error');
    return;
  }

  const btn = document.getElementById('btn-submit-payment');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    const json = await api('payments.php', 'POST', {
      member_id: memberId,
      plan:      document.getElementById('p-plan').value.split(' — ')[0],
      amount:    Number(amount),
      method:    document.getElementById('p-method').value,
      notes:     document.getElementById('p-notes').value.trim() || null,
    });

    closeModal('payment-modal');
    showAlert(`Payment recorded — ${json.txn_code}`);
    loadPayments();

    document.getElementById('p-name').value   = '';
    document.getElementById('p-amount').value = '';
    document.getElementById('p-notes').value  = '';

  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Record Payment';
  }
}

/* ── Add Equipment ── */
async function addEquipment() {
  const name = document.getElementById('eq-name').value.trim();
  const qty  = document.getElementById('eq-qty').value;

  if (!name || !qty) { showAlert('Name and quantity are required.', 'error'); return; }

  const btn = document.getElementById('btn-submit-equipment');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    const json = await api('equipment.php', 'POST', {
      name,
      category:   document.getElementById('eq-cat').value,
      quantity:   Number(qty),
      condition_: document.getElementById('eq-cond').value,
      status:     document.getElementById('eq-status').value,
      location:   document.getElementById('eq-loc').value.trim() || 'Unassigned',
    });

    closeModal('equipment-modal');
    showAlert(`${name} added — ${json.eq_code}`);
    loadEquipment();

    document.getElementById('eq-name').value = '';
    document.getElementById('eq-qty').value  = '';
    document.getElementById('eq-loc').value  = '';

  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Add Equipment';
  }
}

/* ── Add Product ── */
async function addProduct() {
  const name  = document.getElementById('pr-name').value.trim();
  const price = document.getElementById('pr-price').value;
  const stock = document.getElementById('pr-stock').value;

  if (!name || !price || !stock) { showAlert('Name, price, and stock are required.', 'error'); return; }

  const btn = document.getElementById('btn-submit-product');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    const json = await api('products.php', 'POST', {
      name,
      category:    document.getElementById('pr-cat').value,
      price:       Number(price),
      stock:       Number(stock),
      description: document.getElementById('pr-desc').value.trim() || '',
    });

    closeModal('product-modal');
    showAlert(`${name} added to store — ${json.prd_code}`);
    loadStore();

    document.getElementById('pr-name').value  = '';
    document.getElementById('pr-price').value = '';
    document.getElementById('pr-stock').value = '';
    document.getElementById('pr-desc').value  = '';

  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Add Product';
  }
}

/* ── Buy Product ── */
async function buyProduct(productId, productName, stock) {
  if (stock <= 0) { showAlert('This product is out of stock.', 'error'); return; }

  const memberName = prompt(`Enter member name placing the order for "${productName}":`);
  if (!memberName) return;

  /* Find member by name */
  let memberId = null;
  try {
    const search = await api('members.php', 'GET', null, { q: memberName });
    if (search.data.length === 0) {
      showAlert(`No member found with name "${memberName}".`, 'error'); return;
    }
    memberId = search.data[0].id;
  } catch (err) {
    showAlert('Could not find member: ' + err.message, 'error'); return;
  }

  try {
    const json = await api('orders.php', 'POST', {
      member_id:  memberId,
      product_id: productId,
      quantity:   1,
    });
    showAlert(`Order placed — ${json.order_code} · ₦${Number(json.total).toLocaleString()}`);
    loadStore(); /* refreshes stock counts */
  } catch (err) {
    showAlert(err.message, 'error');
  }
}


/* ══════════════════════════════════════
   SEARCH
══════════════════════════════════════ */
function handleSearch() {
  const q = document.getElementById('globalSearch').value.trim();
  if (currentPage === 'members') loadMembers(q);
}


/* ══════════════════════════════════════
   UTILITIES
══════════════════════════════════════ */
function categoryIcon(cat) {
  const map = {
    Cardio:       '🏃', Strength:     '🏋️',
    Flexibility:  '🧘', 'Free Weights':'💪',
    Accessories:  '🎒', 'Gym Wear':   '👕',
    Supplements:  '🥤', Equipment:    '⚙️',
  };
  return map[cat] || '📦';
}

function formatTimeAgo(date) {
  const secs = Math.floor((Date.now() - date) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
  return date.toLocaleDateString();
}


/* ══════════════════════════════════════
   TIP OF THE DAY
══════════════════════════════════════ */
const TIPS = [
  '💧 <strong>Stay hydrated</strong> — Drink at least 2 litres of water before, during, and after training.',
  '😴 <strong>Rest days matter</strong> — Muscles grow during recovery, not just during workouts.',
  '📊 <strong>Track your progress</strong> — Members who log their workouts improve 40% faster.',
  '🥗 <strong>Fuel properly</strong> — Eat a balanced meal 1–2 hours before your session for peak performance.',
  '🧘 <strong>Warm up every time</strong> — 5 minutes of dynamic stretching dramatically reduces injury risk.',
  '🎯 <strong>Set weekly goals</strong> — Small targets compound into life-changing results over time.',
  '🤝 <strong>Train with a partner</strong> — Accountability partners increase workout consistency by 65%.',
];
function renderTip() {
  const tip = document.getElementById('tip-card');
  if (!tip) return;
  tip.innerHTML = `<div class="tip-icon">💡</div>
    <div class="tip-text"><strong>Tip of the Day:</strong> ${TIPS[new Date().getDay() % TIPS.length]}</div>`;
}


/* ══════════════════════════════════════
   COUNTER ANIMATION (landing page)
══════════════════════════════════════ */
function animateCounters() {
  document.querySelectorAll('.strip-num').forEach(el => {
    const target   = el.textContent;
    const numMatch = target.match(/[\d,]+/);
    if (!numMatch) return;
    const end      = parseInt(numMatch[0].replace(/,/g, ''));
    const suffix   = target.replace(numMatch[0], '');
    const start    = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / 1800, 1);
      const v = Math.floor((1 - Math.pow(1 - p, 3)) * end);
      el.textContent = v.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    })(start);
  });
}
const strip = document.querySelector('.stats-strip');
if (strip) {
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { animateCounters(); obs.disconnect(); }
  }, { threshold: 0.4 }).observe(strip);
}


/* ══════════════════════════════════════
   EVENT LISTENERS
   All wired via DOMContentLoaded —
   no inline onclick anywhere in HTML.
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  renderTip();

  /* ── Landing page ── */
  document.getElementById('nav-login-btn')
    ?.addEventListener('click', e => { e.preventDefault(); openLoginScreen(); });
  document.getElementById('open-dashboard-btn')
    ?.addEventListener('click', openLoginScreen);

  const floatCta   = document.getElementById('float-cta');
  const floatClose = floatCta?.querySelector('.float-cta-close');
  floatClose?.addEventListener('click', () => floatCta.style.display = 'none');

  /* ── Hamburger menu ── */
  const hamburger    = document.getElementById('nav-hamburger');
  const mobileNav    = document.getElementById('mobile-nav-drawer');
  const mobileClose  = document.getElementById('mobile-nav-close');
  const mobLoginLink = document.getElementById('mob-login-link');

  hamburger?.addEventListener('click',   () => mobileNav.classList.add('open'));
  mobileClose?.addEventListener('click', () => mobileNav.classList.remove('open'));
  mobLoginLink?.addEventListener('click', e => {
    e.preventDefault();
    mobileNav.classList.remove('open');
    openLoginScreen();
  });
  mobileNav?.querySelectorAll('a:not(#mob-login-link)').forEach(a => {
    a.addEventListener('click', () => mobileNav.classList.remove('open'));
  });

  /* ── Login modal ── */
  document.querySelector('.login-close')
    ?.addEventListener('click', closeLoginScreen);
  document.getElementById('pw-eye')
    ?.addEventListener('click', togglePassword);
  document.getElementById('login-submit')
    ?.addEventListener('click', attemptLogin);
  document.getElementById('login-user')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-pass')?.focus(); });
  document.getElementById('login-pass')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
  document.getElementById('login-overlay')
    ?.addEventListener('click', e => { if (e.target === document.getElementById('login-overlay')) closeLoginScreen(); });

  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      quickLogin(btn.textContent.includes('Admin') ? 'admin' : 'staff');
    });
  });

  /* ── Dashboard sidebar nav ── */
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.page, item));
  });
  document.querySelector('.back-to-site')?.addEventListener('click', closeDashboard);
  document.querySelector('.logout-btn')?.addEventListener('click', logoutDashboard);
  document.querySelector('.menu-toggle')?.addEventListener('click', toggleSidebar);
  document.getElementById('topbar-new-btn')?.addEventListener('click', showCurrentModal);

  /* ── Modal open triggers ── */
  const modalTriggers = {
    'btn-add-member':    'member-modal',
    'btn-add-payment':   'payment-modal',
    'btn-add-equipment': 'equipment-modal',
    'btn-add-product':   'product-modal',
  };
  Object.entries(modalTriggers).forEach(([btnId, modalId]) => {
    document.getElementById(btnId)?.addEventListener('click', () => openModal(modalId));
  });

  /* ── Modal close + cancel ── */
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal-overlay')?.classList.remove('open'));
  });
  ['btn-cancel-member','btn-cancel-payment','btn-cancel-equipment','btn-cancel-product'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      document.getElementById(id).closest('.modal-overlay').classList.remove('open');
    });
  });

  /* ── Modal submit ── */
  document.getElementById('btn-submit-member')?.addEventListener('click',    addMember);
  document.getElementById('btn-submit-payment')?.addEventListener('click',   addPayment);
  document.getElementById('btn-submit-equipment')?.addEventListener('click', addEquipment);
  document.getElementById('btn-submit-product')?.addEventListener('click',   addProduct);

  /* ── Search ── */
  document.getElementById('globalSearch')?.addEventListener('input', handleSearch);

  /* ── Close sidebar on outside click (mobile) ── */
  document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    const toggle  = document.querySelector('.menu-toggle');
    if (sidebar?.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !toggle?.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  /* ── Modal backdrop click to close ── */
  document.querySelectorAll('.modal-overlay:not(#login-overlay)').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

});


/* ════════════════════════════════════════
   MEMBER LOGIN
════════════════════════════════════════ */

/* Show login chooser instead of going straight to staff login */
function openLoginChooser() {
  document.getElementById('login-chooser').classList.add('open');
}

function closeLoginChooser() {
  document.getElementById('login-chooser').classList.remove('open');
}

function openMemberLogin() {
  closeLoginChooser();
  document.getElementById('member-login-overlay').classList.add('open');
  setTimeout(() => document.getElementById('ml-code').focus(), 200);
}

function closeMemberLogin() {
  document.getElementById('member-login-overlay').classList.remove('open');
  document.getElementById('member-login-error').classList.remove('show');
  document.getElementById('ml-code').value  = '';
  document.getElementById('ml-phone').value = '';
}

async function attemptMemberLogin() {
  const btn   = document.getElementById('ml-submit');
  const code  = document.getElementById('ml-code').value.trim().toUpperCase();
  const phone = document.getElementById('ml-phone').value.trim();

  if (!code || !phone) {
    document.getElementById('member-login-error').classList.add('show');
    return;
  }

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    await api('member-auth.php?action=login', 'POST', {
      member_code: code,
      phone:       phone,
    });
    /* Success — redirect to member portal */
    closeMemberLogin();
    window.location.href = 'member-portal.html';
  } catch (err) {
    const errEl = document.getElementById('member-login-error');
    errEl.innerHTML = `❌ ${err.message}`;
    errEl.classList.add('show');
    document.getElementById('ml-phone').value = '';
    document.getElementById('ml-phone').focus();
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

/* ── Wire member login events inside DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {

  /* Override nav login button to show chooser first */
  const navLoginBtn = document.getElementById('nav-login-btn');
  if (navLoginBtn) {
    navLoginBtn.removeEventListener('click', openLoginScreen);
    navLoginBtn.addEventListener('click', e => {
      e.preventDefault();
      openLoginChooser();
    });
  }

  /* Override open-dashboard-btn too */
  const dashBtn = document.getElementById('open-dashboard-btn');
  if (dashBtn) {
    dashBtn.removeEventListener('click', openLoginScreen);
    dashBtn.addEventListener('click', openLoginChooser);
  }

  /* Override mobile nav login */
  const mobLogin = document.getElementById('mob-login-link');
  if (mobLogin) {
    mobLogin.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('mobile-nav-drawer')?.classList.remove('open');
      openLoginChooser();
    });
  }

  /* Chooser buttons */
  document.getElementById('choose-member')
    ?.addEventListener('click', openMemberLogin);

  document.getElementById('choose-staff')
    ?.addEventListener('click', () => {
      closeLoginChooser();
      openLoginScreen();
    });

  document.getElementById('chooser-close')
    ?.addEventListener('click', closeLoginChooser);

  /* Close chooser on backdrop click */
  document.getElementById('login-chooser')
    ?.addEventListener('click', e => {
      if (e.target === document.getElementById('login-chooser')) closeLoginChooser();
    });

  /* Member login modal */
  document.getElementById('member-login-close')
    ?.addEventListener('click', closeMemberLogin);

  document.getElementById('ml-submit')
    ?.addEventListener('click', attemptMemberLogin);

  document.getElementById('ml-code')
    ?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('ml-phone')?.focus();
    });

  document.getElementById('ml-phone')
    ?.addEventListener('keydown', e => {
      if (e.key === 'Enter') attemptMemberLogin();
    });

  /* Close member login on backdrop click */
  document.getElementById('member-login-overlay')
    ?.addEventListener('click', e => {
      if (e.target === document.getElementById('member-login-overlay')) closeMemberLogin();
    });

});


/* ════════════════════════════════════════
   MEMBER LOGIN
════════════════════════════════════════ */

function openMemberLogin() {
  document.getElementById('member-login-overlay').classList.add('open');
  setTimeout(() => document.getElementById('member-code-input').focus(), 200);
}

function closeMemberLogin() {
  document.getElementById('member-login-overlay').classList.remove('open');
  document.getElementById('member-login-error').classList.remove('show');
  document.getElementById('member-code-input').value = '';
  document.getElementById('member-phone-input').value = '';
}

async function attemptMemberLogin() {
  const btn        = document.getElementById('member-login-submit');
  const memberCode = document.getElementById('member-code-input').value.trim().toUpperCase();
  const phone      = document.getElementById('member-phone-input').value.trim();

  if (!memberCode || !phone) {
    document.getElementById('member-login-error').classList.add('show');
    return;
  }

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const json = await api('member-auth.php?action=login', 'POST', {
      member_code: memberCode,
      phone,
    });

    /* Success — go to member portal */
    closeMemberLogin();
    window.location.href = 'member-portal.html';

  } catch (err) {
    document.getElementById('member-login-error').textContent = `❌ ${err.message}`;
    document.getElementById('member-login-error').classList.add('show');
    document.getElementById('member-phone-input').value = '';
    document.getElementById('member-phone-input').focus();
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

/* Wire member login events inside DOMContentLoaded */
document.addEventListener('DOMContentLoaded', () => {

  /* Open member login */
  document.getElementById('open-member-login-btn')
    ?.addEventListener('click', openMemberLogin);

  /* Close member login */
  document.getElementById('member-login-close')
    ?.addEventListener('click', closeMemberLogin);

  /* Submit */
  document.getElementById('member-login-submit')
    ?.addEventListener('click', attemptMemberLogin);

  /* Enter key on member code → move to phone */
  document.getElementById('member-code-input')
    ?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('member-phone-input').focus();
    });

  /* Enter key on phone → submit */
  document.getElementById('member-phone-input')
    ?.addEventListener('keydown', e => {
      if (e.key === 'Enter') attemptMemberLogin();
    });

  /* Click outside member login overlay to close */
  document.getElementById('member-login-overlay')
    ?.addEventListener('click', e => {
      if (e.target === document.getElementById('member-login-overlay')) closeMemberLogin();
    });

});
