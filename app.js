/* ════════════════════════════════════════
   NASME GYM — Client-side Application JS
   Covers: auth, navigation, CRUD, render, UI helpers
════════════════════════════════════════ */

"use strict";

/* ── AUTH ── */
  const USERS = {
    'admin':   { pass:'admin123', name:'Admin User',    role:'Super Admin', initials:'AU' },
    'staff':   { pass:'staff123', name:'Staff Member',  role:'Staff',       initials:'SM' },
    'manager': { pass:'mgr2025',  name:'Gym Manager',   role:'Admin',       initials:'GM' },
  };
  let currentUser = null;

  function openLoginScreen() {
    document.getElementById('login-overlay').classList.add('open');
    setTimeout(()=>document.getElementById('login-user').focus(),200);
  }
  function closeLoginScreen() {
    document.getElementById('login-overlay').classList.remove('open');
    document.getElementById('login-error').classList.remove('show');
    document.getElementById('login-user').value='';
    document.getElementById('login-pass').value='';
  }
  /* attemptLogin defined below with loading-state spinner */
  function quickLogin(role) {
    const map = { admin:'admin', staff:'staff' };
    loginSuccess(map[role]);
  }
  function loginSuccess(username) {
    currentUser = USERS[username];
    closeLoginScreen();
    document.getElementById('user-name').textContent    = currentUser.name;
    document.getElementById('user-role').textContent    = currentUser.role;
    document.getElementById('user-avatar').textContent  = currentUser.initials;
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('dashboard-app').style.display = 'block';
    updateGreeting();
    renderAll();
  }
  function logoutDashboard() {
    if(!confirm('Log out and return to the website?')) return;
    currentUser = null;
    document.getElementById('dashboard-app').style.display = 'none';
    document.getElementById('landing-page').style.display = 'block';
  }
  function closeDashboard() {
    document.getElementById('dashboard-app').style.display = 'none';
    document.getElementById('landing-page').style.display = 'block';
  }

  /* Enter-key + outside-click handlers wired inside DOMContentLoaded below */

  /* ── GREETING + CLOCK ── */
  function updateGreeting() {
    const h = new Date().getHours();
    const greet = h<12 ? 'Good morning' : h<17 ? 'Good afternoon' : 'Good evening';
    const name  = currentUser ? currentUser.name.split(' ')[0] : 'Admin';
    document.getElementById('wb-greeting').textContent = `${greet}, ${name} 👋`;
    const now = new Date();
    document.getElementById('wb-time').innerHTML =
      `<div style="font-size:13px">${now.toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
       <div style="font-size:20px;font-family:var(--fm);margin-top:4px;color:var(--maroon-lt)">${now.toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'})}</div>`;
  }
  setInterval(updateGreeting, 30000);

  /* ── DATA ── */
  let members = [
    {id:'MBR-001',name:'Nwokolo Precious', plan:'Monthly',status:'Active',   checkins:28,joined:'2025-01-10'},
    {id:'MBR-002',name:'Olalekan Adeyemi', plan:'Yearly', status:'Active',   checkins:45,joined:'2024-11-20'},
    {id:'MBR-003',name:'Tunde Fashola',    plan:'Weekly', status:'Expired',  checkins:8, joined:'2025-04-01'},
    {id:'MBR-004',name:'Okpe Confidence',  plan:'Monthly',status:'Active',   checkins:19,joined:'2025-02-14'},
    {id:'MBR-005',name:'Usiju Meduju',     plan:'Daily',  status:'Pending',  checkins:2, joined:'2025-05-15'},
  ];
  let payments = [
    {id:'TXN-001',member:'Nwokolo Precious',plan:'Monthly',amount:12000, method:'Card',         status:'Completed',date:'2025-05-01'},
    {id:'TXN-002',member:'Olalekan Adeyemi',plan:'Yearly', amount:100000,method:'Bank Transfer',status:'Completed',date:'2025-04-20'},
    {id:'TXN-003',member:'Tunde Fashola',   plan:'Weekly', amount:5000,  method:'Cash',         status:'Completed',date:'2025-04-28'},
    {id:'TXN-004',member:'Nelson Charles',  plan:'Monthly',amount:12000, method:'Mobile Money', status:'Pending',  date:'2025-05-10'},
  ];
  let equipment = [
    {id:'EQ-01',name:'Treadmill',     icon:'🏃',category:'Cardio',      qty:4, condition:'Good',     status:'Available',        location:'Floor A'},
    {id:'EQ-02',name:'Bench Press',   icon:'🏋️',category:'Strength',    qty:6, condition:'Excellent',status:'In Use',           location:'Floor B'},
    {id:'EQ-03',name:'Rowing Machine',icon:'🚣',category:'Cardio',      qty:2, condition:'Good',     status:'Available',        location:'Floor A'},
    {id:'EQ-04',name:'Dumbbells Set', icon:'💪',category:'Free Weights',qty:20,condition:'Good',     status:'Available',        location:'Floor C'},
    {id:'EQ-05',name:'Cycling Bike',  icon:'🚴',category:'Cardio',      qty:5, condition:'Fair',     status:'Under Maintenance',location:'Floor A'},
    {id:'EQ-06',name:'Pull-up Bar',   icon:'⬆️',category:'Strength',    qty:4, condition:'Excellent',status:'Available',        location:'Floor B'},
  ];
  let products = [
    {id:'PRD-001',name:'Protein Whey 1kg',icon:'🥛',category:'Supplements',price:8500,stock:30,desc:'Premium whey protein blend'},
    {id:'PRD-002',name:'Gym Gloves',      icon:'🧤',category:'Accessories',price:2500,stock:50,desc:'Anti-slip lifting gloves'},
    {id:'PRD-003',name:'Resistance Bands',icon:'🔴',category:'Accessories',price:1800,stock:40,desc:'Set of 5 resistance levels'},
    {id:'PRD-004',name:'IronCore Hoodie', icon:'👕',category:'Gym Wear',   price:7000,stock:25,desc:'Premium cotton blend hoodie'},
    {id:'PRD-005',name:'Jump Rope',       icon:'➰',category:'Equipment',  price:1200,stock:60,desc:'Speed skipping rope'},
    {id:'PRD-006',name:'Water Bottle 1L', icon:'💧',category:'Accessories',price:2000,stock:8, desc:'BPA-free insulated bottle'},
  ];
  let orders = [
    {id:'ORD-001',member:'Ngozi Adeyemi',product:'Gym Gloves',      qty:2,total:5000,status:'Delivered',date:'2025-05-02'},
    {id:'ORD-002',member:'Emeka Eze',    product:'Protein Whey 1kg',qty:1,total:8500,status:'Shipped',  date:'2025-05-10'},
    {id:'ORD-003',member:'Chioma Nwosu', product:'IronCore Hoodie', qty:1,total:7000,status:'Pending',  date:'2025-05-14'},
  ];
  let mc=248,tc=5,ec=7,pc=7;
  let currentPage='dashboard';

  /* ── NAV ── */
  function navigate(page,el){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    document.getElementById('page-'+page).classList.add('active');
    if(el) el.classList.add('active');
    const t={dashboard:'DASHBOARD',members:'MEMBER MANAGEMENT',payments:'PAYMENTS & SUBSCRIPTIONS',security:'DATA & SECURITY',equipment:'EQUIPMENT MANAGEMENT',store:'ONLINE GYM STORE'};
    document.getElementById('pageTitle').textContent=t[page]||page.toUpperCase();
    currentPage=page; renderAll(); closeSidebar();
  }
  function showCurrentModal(){const m={members:'member-modal',payments:'payment-modal',equipment:'equipment-modal',store:'product-modal'};if(m[currentPage])openModal(m[currentPage]);}
  function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');}
  function closeSidebar(){document.getElementById('sidebar').classList.remove('open');}
  function openModal(id){document.getElementById(id).classList.add('open');}
  function closeModal(id){document.getElementById(id).classList.remove('open');}
  document.querySelectorAll('.modal-overlay').forEach(mo=>{
    mo.addEventListener('click',e=>{if(e.target===mo)mo.classList.remove('open');});
  });

  /* ── ALERT ── */
  function showAlert(msg,type='success'){
    const a=document.getElementById('alert');
    a.className=`alert alert-${type} show`;
    a.innerHTML=`<span>${type==='success'?'✅':'❌'}</span> ${msg}`;
    setTimeout(()=>a.classList.remove('show'),3500);
  }

  /* ── RENDER ── */
  function renderAll(){renderMembers();renderPayments();renderEquipment();renderStore();renderOrders();document.getElementById('dash-members').textContent=members.length;}

  function renderMembers(data){
    const rows=data||members;
    document.getElementById('members-tbody').innerHTML=rows.map(m=>`
      <tr>
        <td><span style="font-family:var(--fm);color:#9090e0">${m.id}</span></td>
        <td><strong>${m.name}</strong></td>
        <td><span class="badge badge-${m.plan.toLowerCase()}">${m.plan}</span></td>
        <td><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></td>
        <td>${m.checkins}</td><td>${m.joined}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="suspendMember('${m.id}')">Suspend</button>
          <button class="btn btn-danger btn-sm" onclick="deleteMember('${m.id}')">Delete</button>
        </td>
      </tr>`).join('');
  }
  function renderPayments(){
    document.getElementById('payments-tbody').innerHTML=payments.map(p=>`
      <tr>
        <td><span style="font-family:var(--fm);color:#9090e0">${p.id}</span></td>
        <td>${p.member}</td><td>${p.plan}</td>
        <td style="font-family:var(--fm);color:var(--success)">₦${Number(p.amount).toLocaleString()}</td>
        <td>${p.method}</td>
        <td><span class="badge badge-${p.status==='Completed'?'active':'pending'}">${p.status}</span></td>
        <td>${p.date}</td>
      </tr>`).join('');
  }
  function renderEquipment(){
    const sc={Available:'var(--success)','In Use':'#9090e0','Under Maintenance':'var(--warning)',Retired:'var(--text-muted)'};
    document.getElementById('equip-grid').innerHTML=equipment.map(e=>`
      <div class="equip-card">
        <div class="equip-icon">${e.icon}</div>
        <div class="equip-name">${e.name}</div>
        <div class="equip-detail">${e.category} · ${e.location} · Qty: ${e.qty}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="badge badge-${e.condition==='Excellent'?'active':e.condition==='Needs Repair'?'expired':'pending'}" style="font-size:9px">${e.condition}</span>
          <span style="font-size:11px;color:${sc[e.status]||'var(--text-muted)'}">${e.status}</span>
        </div>
      </div>`).join('');
  }
  function renderStore(){
    document.getElementById('store-grid').innerHTML=products.map(p=>`
      <div class="product-card">
        <div class="product-img">${p.icon}</div>
        <div class="product-body">
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.desc}</div>
          <div class="product-footer">
            <div class="product-price">₦${Number(p.price).toLocaleString()}</div>
            <div>
              <span style="font-size:11px;color:var(--text-muted)">Stock: ${p.stock}</span>
              <button class="btn btn-primary btn-sm" style="margin-left:8px" onclick="buyProduct('${p.id}')">Buy</button>
            </div>
          </div>
          ${p.stock<10?`<div style="font-size:10px;color:var(--warning);margin-top:6px">⚠️ Low stock</div>`:''}
        </div>
      </div>`).join('');
  }
  function renderOrders(){
    document.getElementById('orders-tbody').innerHTML=orders.map(o=>`
      <tr>
        <td><span style="font-family:var(--fm);color:#9090e0">${o.id}</span></td>
        <td>${o.member}</td><td>${o.product}</td><td>${o.qty}</td>
        <td style="font-family:var(--fm)">₦${Number(o.total).toLocaleString()}</td>
        <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
        <td>${o.date}</td>
      </tr>`).join('');
  }

  /* ── ACTIONS ── */
  function addMember(){
    const name=document.getElementById('m-name').value.trim();
    const phone=document.getElementById('m-phone').value.trim();
    if(!name||!phone){showAlert('Please fill required fields.','error');return;}
    if(members.find(m=>m.name.toLowerCase()===name.toLowerCase())){showAlert('Duplicate — member may already exist.','error');return;}
    const plan=document.getElementById('m-plan').value;
    const nm={id:`MBR-${String(mc).padStart(3,'0')}`,name,plan,status:'Active',checkins:0,joined:new Date().toISOString().split('T')[0]};
    mc++;members.push(nm);closeModal('member-modal');renderMembers();
    addAuditLog(`Member ${nm.id} created — ${name}`,'success');
    showAlert(`${name} registered with ID ${nm.id}`);
    document.getElementById('m-name').value='';document.getElementById('m-phone').value='';
  }
  function deleteMember(id){
    if(!confirm(`Permanently delete member ${id}? This cannot be undone.`))return;
    members=members.filter(m=>m.id!==id);renderMembers();
    addAuditLog(`Member ${id} deleted`,'danger');showAlert(`Member ${id} removed.`);
  }
  function suspendMember(id){
    const m=members.find(x=>x.id===id);if(!m)return;
    if(!confirm(`Suspend ${m.name}?`))return;
    m.status='Suspended';renderMembers();
    addAuditLog(`Member ${id} suspended`,'warning');showAlert(`${m.name} suspended.`);
  }
  function addPayment(){
    const name=document.getElementById('p-name').value.trim();
    const amount=document.getElementById('p-amount').value;
    if(!name||!amount){showAlert('Fill required fields.','error');return;}
    const plan=document.getElementById('p-plan').value.split(' — ')[0];
    const method=document.getElementById('p-method').value;
    const nt={id:`TXN-${String(tc).padStart(3,'0')}`,member:name,plan,amount:Number(amount),method,status:'Completed',date:new Date().toISOString().split('T')[0]};
    tc++;payments.unshift(nt);closeModal('payment-modal');renderPayments();
    addAuditLog(`Payment ${nt.id} recorded — ₦${Number(amount).toLocaleString()} from ${name}`,'maroon');
    showAlert(`₦${Number(amount).toLocaleString()} recorded for ${name}.`);
    document.getElementById('p-name').value='';document.getElementById('p-amount').value='';
  }
  function addEquipment(){
    const name=document.getElementById('eq-name').value.trim();
    const qty=document.getElementById('eq-qty').value;
    if(!name||!qty){showAlert('Fill required fields.','error');return;}
    const icons={Cardio:'🏃',Strength:'🏋️',Flexibility:'🧘','Free Weights':'💪',Accessories:'🔧'};
    const cat=document.getElementById('eq-cat').value;
    const ne={id:`EQ-${String(ec).padStart(2,'0')}`,name,icon:icons[cat]||'⚙️',category:cat,qty:Number(qty),condition:document.getElementById('eq-cond').value,status:document.getElementById('eq-status').value,location:document.getElementById('eq-loc').value||'Unassigned'};
    ec++;equipment.push(ne);closeModal('equipment-modal');renderEquipment();
    addAuditLog(`Equipment ${ne.id} added — ${name}`,'navy');showAlert(`${name} added to inventory.`);
    document.getElementById('eq-name').value='';document.getElementById('eq-qty').value='';
  }
  function addProduct(){
    const name=document.getElementById('pr-name').value.trim();
    const price=document.getElementById('pr-price').value;
    const stock=document.getElementById('pr-stock').value;
    if(!name||!price||!stock){showAlert('Fill required fields.','error');return;}
    const cat=document.getElementById('pr-cat').value;
    const ci={'Gym Wear':'👕',Supplements:'🥤',Accessories:'🎒',Equipment:'🏋️'};
    const np={id:`PRD-${String(pc).padStart(3,'0')}`,name,icon:ci[cat]||'📦',category:cat,price:Number(price),stock:Number(stock),desc:document.getElementById('pr-desc').value||'No description.'};
    pc++;products.push(np);closeModal('product-modal');renderStore();
    addAuditLog(`Product ${np.id} added — ${name}`,'maroon');showAlert(`${name} added to store.`);
    document.getElementById('pr-name').value='';document.getElementById('pr-price').value='';document.getElementById('pr-stock').value='';
  }
  function buyProduct(id){
    const p=products.find(x=>x.id===id);if(!p)return;
    if(p.stock<=0){showAlert('Out of stock!','error');return;}
    const member=prompt(`Member name for "${p.name}":`);if(!member)return;
    p.stock--;
    const no={id:`ORD-${String(orders.length+1).padStart(3,'0')}`,member,product:p.name,qty:1,total:p.price,status:'Pending',date:new Date().toISOString().split('T')[0]};
    orders.unshift(no);renderStore();renderOrders();
    addAuditLog(`Order ${no.id} placed by ${member}`,'maroon');showAlert(`Order placed! ID: ${no.id}`);
  }
  function addAuditLog(text,color){
    const log=document.getElementById('audit-log');
    const cols={success:'var(--success)',maroon:'var(--maroon-lt)',navy:'#9090e0',warning:'var(--warning)',danger:'var(--danger)'};
    const time=new Date().toTimeString().split(' ')[0];
    const e=document.createElement('div');e.className='log-entry';
    e.innerHTML=`<div class="log-dot" style="background:${cols[color]||'var(--text-muted)'}"></div><div class="log-time">${time}</div><div class="log-event">${text}</div>`;
    log.insertBefore(e,log.firstChild);
  }
  function handleSearch(){
    const q=document.getElementById('globalSearch').value.toLowerCase();
    if(currentPage==='members'){renderMembers(members.filter(m=>m.name.toLowerCase().includes(q)||m.id.toLowerCase().includes(q)||m.plan.toLowerCase().includes(q)));}
  }

  /* ── PASSWORD TOGGLE ── */
  function togglePassword() {
    const inp = document.getElementById('login-pass');
    const eye = document.getElementById('pw-eye');
    if (inp.type === 'password') { inp.type = 'text';     eye.textContent = '🙈'; }
    else                          { inp.type = 'password'; eye.textContent = '👁';  }
  }

  /* ── LOGIN LOADING STATE ── */
  /* ── ATTEMPT LOGIN (with spinner) ── */
  function attemptLogin() {
    const btn = document.getElementById('login-submit');
    btn.classList.add('loading'); btn.disabled = true;
    setTimeout(() => {
      const u = document.getElementById('login-user').value.trim().toLowerCase();
      const p = document.getElementById('login-pass').value;
      if (USERS[u] && USERS[u].pass === p) {
        loginSuccess(u);
      } else {
        document.getElementById('login-error').classList.add('show');
        document.getElementById('login-pass').value = '';
        document.getElementById('login-pass').focus();
      }
      btn.classList.remove('loading'); btn.disabled = false;
    }, 700);
  }

  /* ── TIP OF THE DAY ── */
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
    const t = TIPS[new Date().getDay() % TIPS.length];
    tip.innerHTML = `<div class="tip-icon">💡</div><div class="tip-text"><strong>Tip of the Day:</strong> ${t}</div>`;
  }
  renderTip();

  /* ── COUNTER ANIMATION (landing stats strip) ── */
  function animateCounters() {
    document.querySelectorAll('.strip-num').forEach(el => {
      const target = el.textContent;
      const numMatch = target.match(/[\d,]+/);
      if (!numMatch) return;
      const end = parseInt(numMatch[0].replace(/,/g, ''));
      const suffix = target.replace(numMatch[0], '');
      const prefix = target.startsWith(numMatch[0]) ? '' : target.slice(0, target.indexOf(numMatch[0]));
      let start = 0; const duration = 1800;
      const startTime = performance.now();
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * end);
        el.textContent = prefix + value.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
    });
  }
  const statsObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animateCounters(); statsObs.disconnect(); }
  }, { threshold: 0.4 });
  const strip = document.querySelector('.stats-strip');
  if (strip) statsObs.observe(strip);

  renderAll();

/* ════════════════════════════════════════
   EVENT LISTENERS
   All inline onclick/oninput handlers
   are wired here instead.
════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Landing page ── */
  const navLoginBtn      = document.getElementById('nav-login-btn');
  const openDashboardBtn = document.getElementById('open-dashboard-btn');
  const floatCta         = document.getElementById('float-cta');
  const floatClose       = floatCta?.querySelector('.float-cta-close');

  if (navLoginBtn)      navLoginBtn.addEventListener('click',  e => { e.preventDefault(); openLoginScreen(); });

  /* ── Landing page hamburger ── */
  const hamburger   = document.getElementById('nav-hamburger');
  const mobileNav   = document.getElementById('mobile-nav-drawer');
  const mobileClose = document.getElementById('mobile-nav-close');
  const mobLoginLink = document.getElementById('mob-login-link');
  hamburger?.addEventListener('click',   () => mobileNav.classList.add('open'));
  mobileClose?.addEventListener('click', () => mobileNav.classList.remove('open'));
  mobLoginLink?.addEventListener('click', e => { e.preventDefault(); mobileNav.classList.remove('open'); openLoginScreen(); });
  mobileNav?.querySelectorAll('a:not(#mob-login-link)').forEach(a => {
    a.addEventListener('click', () => mobileNav.classList.remove('open'));
  });
  if (openDashboardBtn) openDashboardBtn.addEventListener('click', openLoginScreen);
  if (floatClose)       floatClose.addEventListener('click', () => floatCta.style.display = 'none');

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
      const role = btn.textContent.includes('Admin') ? 'admin' : 'staff';
      quickLogin(role);
    });
  });

  /* ── Dashboard sidebar nav ── */
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.page, item));
  });

  document.querySelector('.back-to-site')
    ?.addEventListener('click', closeDashboard);

  document.querySelector('.logout-btn')
    ?.addEventListener('click', logoutDashboard);

  document.querySelector('.menu-toggle')
    ?.addEventListener('click', toggleSidebar);

  document.querySelector('#topbar-new-btn')
    ?.addEventListener('click', showCurrentModal);

  /* ── Modal open triggers ── */
  const modalTriggers = {
    'btn-add-member':    'member-modal',
    'btn-add-payment':   'payment-modal',
    'btn-add-equipment': 'equipment-modal',
    'btn-add-product':   'product-modal',
  };
  Object.entries(modalTriggers).forEach(([btnId, modalId]) => {
    document.getElementById(btnId)
      ?.addEventListener('click', () => openModal(modalId));
  });

  /* ── Modal close buttons ── */
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.remove('open');
    });
  });

  /* ── Modal cancel buttons ── */
  ['btn-cancel-member','btn-cancel-payment','btn-cancel-equipment','btn-cancel-product'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      document.getElementById(id).closest('.modal-overlay').classList.remove('open');
    });
  });

  /* ── Modal submit buttons ── */
  document.getElementById('btn-submit-member')
    ?.addEventListener('click', addMember);
  document.getElementById('btn-submit-payment')
    ?.addEventListener('click', addPayment);
  document.getElementById('btn-submit-equipment')
    ?.addEventListener('click', addEquipment);
  document.getElementById('btn-submit-product')
    ?.addEventListener('click', addProduct);

  /* ── Search ── */
  document.getElementById('globalSearch')
    ?.addEventListener('input', handleSearch);

  /* ── Close sidebar when clicking outside on mobile ── */
  document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    const toggle  = document.querySelector('.menu-toggle');
    if (sidebar?.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !toggle?.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  /* ── All modal overlays: click backdrop to close ── */
  document.querySelectorAll('.modal-overlay:not(#login-overlay)').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

});
