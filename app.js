/* Clinic Management System — app.js
   Pure front-end demo using localStorage/sessionStorage.
   Login: username=admin password=admin123
*/

const S = {
  patients: 'cms_patients',
  doctors: 'cms_doctors',
  appointments: 'cms_appointments',
  bills: 'cms_bills',
  users: 'cms_users',
  reports: 'cms_reports'
};

const fmtPKR = n => `PKR ${Number(n || 0).toLocaleString()}`;
const todayStr = () => new Date().toISOString().slice(0,10);

function load(key){
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
}
function save(key, arr){ localStorage.setItem(key, JSON.stringify(arr)); }

function uid(){ return 'id-' + Math.random().toString(36).slice(2,10); }

function seedIfEmpty(){
  if(load(S.patients).length === 0) save(S.patients, []);
  if(load(S.doctors).length === 0) save(S.doctors, []);
  if(load(S.users).length === 0) save(S.users, [{ id: uid(), username:'admin', role:'Admin' }]);
  if(load(S.appointments).length === 0) save(S.appointments, []);
  if(load(S.bills).length === 0) save(S.bills, []);
  if(load(S.reports).length === 0) save(S.reports, []);
}

  

/* AUTH */
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

function doLogin(){
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value.trim();
  if(u === 'admin' && p === 'admin123'){
    sessionStorage.setItem('cms_logged_in','1');
    showApp();
  } else {
    loginError.textContent = 'Invalid credentials. Hint: admin / admin123';
  }
}
loginBtn.addEventListener('click', doLogin);
document.addEventListener('keydown', e => {
  if(e.key === 'Enter' && document.getElementById('login-screen').style.display !== 'none'){
    doLogin();
  }
});

/* Show app if logged in */
function showApp(){
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  setActiveTab('dashboard');
  refreshAll();
}

/* Boot */
function boot(){
  seedIfEmpty();
  if(sessionStorage.getItem('cms_logged_in') === '1') showApp();
}
boot();

/* NAV */
const tabButtons = [...document.querySelectorAll('.tab-btn[data-tab]')];
tabButtons.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));
document.querySelectorAll('[data-nav]')?.forEach(el => el.addEventListener('click', () => setActiveTab(el.getAttribute('data-nav'))));
document.getElementById('logout-btn').addEventListener('click', ()=> { sessionStorage.removeItem('cms_logged_in'); location.reload(); });

function setActiveTab(name){
  tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab').forEach(s => s.classList.add('hidden'));
  document.getElementById('tab-' + name).classList.remove('hidden');

  if(name === 'dashboard') renderDashboard();
  if(name === 'patients') renderPatients();
  if(name === 'doctors') renderDoctors();
  if(name === 'appointments') renderAppointments();
  if(name === 'bills') renderBills();
  if(name === 'reports') renderReports();
  if(name === 'users') renderUsers();
}

/* Refresh all screens */
function refreshAll(){
  renderDashboard(); renderPatients(); renderDoctors(); renderAppointments(); renderBills(); renderReports(); renderUsers();
}

/* DASHBOARD */
function renderDashboard(){
  const ps = load(S.patients), ds = load(S.doctors), bs = load(S.bills), as = load(S.appointments);
  document.getElementById('stat-patients').textContent = ps.length;
  document.getElementById('stat-doctors').textContent = ds.length;
  const revenue = bs.reduce((sum,b) => sum + Number(b.total||0), 0);
  document.getElementById('stat-revenue').textContent = fmtPKR(revenue);

  const today = todayStr();
  const todays = as.filter(a => a.date === today).sort((a,b) => (a.time||'').localeCompare(b.time||''));
  document.getElementById('stat-today').textContent = todays.length;

  const tbody = document.querySelector('#table-today tbody');
  tbody.innerHTML = '';
  todays.forEach(ap => {
    const p = ps.find(x => x.id === ap.patientId);
    const d = ds.find(x => x.id === ap.doctorId);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${ap.time||''}</td><td>${p?.name||''}</td><td>${d?.name||''}</td><td>${d?.spec||''}</td>`;
    tbody.appendChild(tr);
  });
}

/* PATIENTS */
document.getElementById('btn-add-patient').addEventListener('click', ()=> { 
  clearPatientForm(); 
  document.getElementById('patient-form-title').textContent = 'Add Patient';
  toggle('#form-patient', true); 
});
document.getElementById('cancel-patient').addEventListener('click', ()=> toggle('#form-patient', false));
document.getElementById('save-patient').addEventListener('click', ()=>{
  const id = v('#p-id');
  const token = v('#p-token'), name = v('#p-name'), age = Number(v('#p-age')), gender = v('#p-gender'), contact = v('#p-contact'), address = v('#p-address');
  if(!token || !name) return alert('Token and Name are required.');
  const ps = load(S.patients);
  
  if (id) {
    // Update existing patient
    const index = ps.findIndex(p => p.id === id);
    if (index !== -1) {
      ps[index] = { id, token, name, age, gender, contact, address };
    }
  } else {
    // Add new patient
    ps.push({ id: uid(), token, name, age, gender, contact, address });
  }
  
  save(S.patients, ps);
  clearPatientForm(); toggle('#form-patient', false); renderPatients(); syncSelectors();
});

function renderPatients(){
  const ps = load(S.patients);
  const tbody = document.querySelector('#table-patients tbody'); tbody.innerHTML = '';
  ps.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.token||''}</td><td>${p.name||''}</td><td>${p.age||''}</td><td>${p.gender||''}</td><td>${p.contact||''}</td><td>${p.address||''}</td>`;
    
    // Add action buttons
    const actionTd = document.createElement('td');
    actionTd.className = 'actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn secondary small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editPatient(p.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger small';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deletePatient(p.id));
    
    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  });
}

function editPatient(id) {
  const ps = load(S.patients);
  const patient = ps.find(p => p.id === id);
  if (!patient) return;
  
  document.getElementById('p-id').value = patient.id;
  document.getElementById('p-token').value = patient.token || '';
  document.getElementById('p-name').value = patient.name || '';
  document.getElementById('p-age').value = patient.age || '';
  document.getElementById('p-gender').value = patient.gender || '';
  document.getElementById('p-contact').value = patient.contact || '';
  document.getElementById('p-address').value = patient.address || '';
  
  document.getElementById('patient-form-title').textContent = 'Edit Patient';
  toggle('#form-patient', true);
}

function deletePatient(id) {
  if (!confirm('Are you sure you want to delete this patient?')) return;
  
  const ps = load(S.patients);
  const filtered = ps.filter(p => p.id !== id);
  save(S.patients, filtered);
  
  // Also delete related appointments and bills
  const appointments = load(S.appointments).filter(a => a.patientId !== id);
  save(S.appointments, appointments);
  
  const bills = load(S.bills).filter(b => b.patientId !== id);
  save(S.bills, bills);
  
  renderPatients();
  syncSelectors();
  renderDashboard();
}

function clearPatientForm(){ 
  document.getElementById('p-id').value = '';
  ['#p-token','#p-name','#p-age','#p-gender','#p-contact','#p-address'].forEach(id => { 
    const el = document.querySelector(id); 
    if(el) el.value = ''; 
  }); 
}

/* DOCTORS */
document.getElementById('btn-add-doctor').addEventListener('click', ()=> { 
  clearDoctorForm(); 
  document.getElementById('doctor-form-title').textContent = 'Add Doctor';
  toggle('#form-doctor', true); 
});
document.getElementById('cancel-doctor').addEventListener('click', ()=> toggle('#form-doctor', false));
document.getElementById('save-doctor').addEventListener('click', ()=>{
  const id = v('#d-id');
  const name = v('#d-name'), contact = v('#d-contact'), spec = v('#d-spec'), avail = v('#d-avail');
  if(!name || !spec) return alert('Name and Specialization are required.');
  const ds = load(S.doctors);
  
  if (id) {
    // Update existing doctor
    const index = ds.findIndex(d => d.id === id);
    if (index !== -1) {
      ds[index] = { id, name, contact, spec, avail };
    }
  } else {
    // Add new doctor
    ds.push({ id: uid(), name, contact, spec, avail });
  }
  
  save(S.doctors, ds);
  clearDoctorForm(); toggle('#form-doctor', false); renderDoctors(); syncSelectors();
});

function renderDoctors(){
  const ds = load(S.doctors);
  const tbody = document.querySelector('#table-doctors tbody'); tbody.innerHTML = '';
  ds.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d.name||''}</td><td>${d.contact||''}</td><td>${d.spec||''}</td><td>${d.avail||''}</td>`;
    
    // Add action buttons
    const actionTd = document.createElement('td');
    actionTd.className = 'actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn secondary small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editDoctor(d.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger small';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteDoctor(d.id));
    
    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  });
}

function editDoctor(id) {
  const ds = load(S.doctors);
  const doctor = ds.find(d => d.id === id);
  if (!doctor) return;
  
  document.getElementById('d-id').value = doctor.id;
  document.getElementById('d-name').value = doctor.name || '';
  document.getElementById('d-contact').value = doctor.contact || '';
  document.getElementById('d-spec').value = doctor.spec || '';
  document.getElementById('d-avail').value = doctor.avail || '';
  
  document.getElementById('doctor-form-title').textContent = 'Edit Doctor';
  toggle('#form-doctor', true);
}

function deleteDoctor(id) {
  if (!confirm('Are you sure you want to delete this doctor?')) return;
  
  const ds = load(S.doctors);
  const filtered = ds.filter(d => d.id !== id);
  save(S.doctors, filtered);
  
  // Also delete related appointments
  const appointments = load(S.appointments).filter(a => a.doctorId !== id);
  save(S.appointments, appointments);
  
  renderDoctors();
  syncSelectors();
  renderDashboard();
}

function clearDoctorForm(){ 
  document.getElementById('d-id').value = '';
  ['#d-name','#d-contact','#d-spec','#d-avail'].forEach(id => { 
    const el = document.querySelector(id); 
    if(el) el.value = ''; 
  }); 
}

/* APPOINTMENTS */
document.getElementById('btn-add-appointment').addEventListener('click', ()=> { 
  clearAppointmentForm(); 
  document.getElementById('appointment-form-title').textContent = 'Add Appointment';
  syncSelectors(); 
  toggle('#form-appointment', true); 
});
document.getElementById('cancel-appointment').addEventListener('click', ()=> toggle('#form-appointment', false));
document.getElementById('save-appointment').addEventListener('click', ()=>{
  const id = v('#a-id');
  const patientId = v('#a-patient'), doctorId = v('#a-doctor'), date = v('#a-date'), time = v('#a-time');
  if(!patientId || !doctorId || !date || !time) return alert('All fields are required.');
  const as = load(S.appointments);
  
  if (id) {
    // Update existing appointment
    const index = as.findIndex(a => a.id === id);
    if (index !== -1) {
      as[index] = { id, patientId, doctorId, date, time };
    }
  } else {
    // Add new appointment
    as.push({ id: uid(), patientId, doctorId, date, time });
  }
  
  save(S.appointments, as);
  toggle('#form-appointment', false); renderAppointments(); renderDashboard();
});

function renderAppointments(){
  const ps = load(S.patients), ds = load(S.doctors), as = load(S.appointments);
  const latestByPatient = {};
  as.sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach(a => latestByPatient[a.patientId] = a);
  const rows = Object.values(latestByPatient);
  const tbody = document.querySelector('#table-appointments tbody'); tbody.innerHTML = '';
  rows.forEach(ap => {
    const p = ps.find(x => x.id === ap.patientId);
    const d = ds.find(x => x.id === ap.doctorId);
    const tr = document.createElement('tr'); 
    tr.style.cursor = 'pointer';
    tr.innerHTML = `<td>${p?.name||''}</td><td>${d?.name||''}</td><td>${ap.date}</td><td>${ap.time}</td>`;
    tr.addEventListener('click', ()=> openApDetail(ap.patientId));
    
    // Add action buttons
    const actionTd = document.createElement('td');
    actionTd.className = 'actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn secondary small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      editAppointment(ap.id);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger small';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAppointment(ap.id);
    });
    
    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  });
}

function editAppointment(id) {
  const as = load(S.appointments);
  const appointment = as.find(a => a.id === id);
  if (!appointment) return;
  
  document.getElementById('a-id').value = appointment.id;
  document.getElementById('a-patient').value = appointment.patientId || '';
  document.getElementById('a-doctor').value = appointment.doctorId || '';
  document.getElementById('a-date').value = appointment.date || '';
  document.getElementById('a-time').value = appointment.time || '';
  
  document.getElementById('appointment-form-title').textContent = 'Edit Appointment';
  toggle('#form-appointment', true);
}

function deleteAppointment(id) {
  if (!confirm('Are you sure you want to delete this appointment?')) return;
  
  const as = load(S.appointments);
  const filtered = as.filter(a => a.id !== id);
  save(S.appointments, filtered);
  
  renderAppointments();
  renderDashboard();
}

function clearAppointmentForm(){ 
  document.getElementById('a-id').value = '';
  ['#a-patient','#a-doctor','#a-date','#a-time'].forEach(id => { 
    const el = document.querySelector(id); 
    if(el) el.value = ''; 
  }); 
}

function openApDetail(patientId){
  const ps = load(S.patients), ds = load(S.doctors), as = load(S.appointments);
  const p = ps.find(x=>x.id===patientId);
  document.querySelector('#ap-detail .section-head h3').textContent = `Appointments — ${p?.name||''}`;
  const tbody = document.querySelector('#table-ap-detail tbody'); tbody.innerHTML = '';
  as.filter(a => a.patientId === patientId).sort((a,b) => (b.date + b.time).localeCompare(a.date + a.time)).forEach(ap => {
    const d = ds.find(x => x.id === ap.doctorId);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${ap.date}</td><td>${ap.time}</td><td>${d?.name||''}</td><td>${d?.spec||''}</td>`;
    
    // Add action buttons
    const actionTd = document.createElement('td');
    actionTd.className = 'actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn secondary small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editAppointment(ap.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger small';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteAppointment(ap.id));
    
    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  });
  toggle('#ap-detail', true);
}
document.getElementById('close-ap-detail').addEventListener('click', ()=> toggle('#ap-detail', false));

/* BILLS */
document.getElementById('btn-add-bill').addEventListener('click', ()=> { 
  clearBillForm(); 
  document.getElementById('bill-form-title').textContent = 'Add Bill';
  syncSelectors(); 
  toggle('#form-bill', true); 
});
document.getElementById('cancel-bill').addEventListener('click', ()=> toggle('#form-bill', false));
document.getElementById('save-bill').addEventListener('click', ()=>{
  const id = v('#b-id');
  const patientId = v('#b-patient'), total = Number(v('#b-total')), received = Number(v('#b-received')), method = v('#b-method'), date = v('#b-date') || todayStr();
  if(!patientId || isNaN(total) || isNaN(received)) return alert('Please fill all bill fields.');
  const bs = load(S.bills);
  
  if (id) {
    // Update existing bill
    const index = bs.findIndex(b => b.id === id);
    if (index !== -1) {
      bs[index] = { id, patientId, total, received, method, date };
    }
  } else {
    // Add new bill
    bs.push({ id: uid(), patientId, total, received, method, date });
  }
  
  save(S.bills, bs);
  toggle('#form-bill', false); renderBills(); renderDashboard();
});

function renderBills(){
  const ps = load(S.patients), bs = load(S.bills);
  const latestByPatient = {};
  bs.sort((a,b) => (a.date).localeCompare(b.date)).forEach(b => latestByPatient[b.patientId] = b);
  const rows = Object.values(latestByPatient);
  const tbody = document.querySelector('#table-bills tbody'); tbody.innerHTML = '';
  rows.forEach(b => {
    const p = ps.find(x => x.id === b.patientId); const rem = Number(b.total || 0) - Number(b.received || 0);
    const tr = document.createElement('tr'); 
    tr.style.cursor='pointer';
    tr.innerHTML = `<td>${p?.name||''}</td><td>${fmtPKR(b.total)}</td><td>${fmtPKR(b.received)}</td><td>${fmtPKR(rem)}</td><td>${b.method||''}</td>`;
    tr.addEventListener('click', ()=> openBillDetail(b.patientId));
    
    // Add action buttons
    const actionTd = document.createElement('td');
    actionTd.className = 'actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn secondary small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      editBill(b.id);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger small';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBill(b.id);
    });
    
    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  });
}

function editBill(id) {
  const bs = load(S.bills);
  const bill = bs.find(b => b.id === id);
  if (!bill) return;
  
  document.getElementById('b-id').value = bill.id;
  document.getElementById('b-patient').value = bill.patientId || '';
  document.getElementById('b-total').value = bill.total || '';
  document.getElementById('b-received').value = bill.received || '';
  document.getElementById('b-method').value = bill.method || '';
  document.getElementById('b-date').value = bill.date || '';
  
  document.getElementById('bill-form-title').textContent = 'Edit Bill';
  toggle('#form-bill', true);
}

function deleteBill(id) {
  if (!confirm('Are you sure you want to delete this bill?')) return;
  
  const bs = load(S.bills);
  const filtered = bs.filter(b => b.id !== id);
  save(S.bills, filtered);
  
  renderBills();
  renderDashboard();
}

function clearBillForm(){ 
  document.getElementById('b-id').value = '';
  ['#b-patient','#b-total','#b-received','#b-method','#b-date'].forEach(id => { 
    const el = document.querySelector(id); 
    if(el) el.value = ''; 
  }); 
}

function openBillDetail(patientId){
  const ps = load(S.patients), bs = load(S.bills);
  const p = ps.find(x => x.id === patientId);
  document.querySelector('#bill-detail .section-head h3').textContent = `Bills — ${p?.name||''}`;
  const tbody = document.querySelector('#table-bill-detail tbody'); tbody.innerHTML = '';
  bs.filter(b => b.patientId === patientId).sort((a,b) => b.date.localeCompare(a.date)).forEach(b => {
    const rem = Number(b.total || 0) - Number(b.received || 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${b.date}</td><td>${fmtPKR(b.total)}</td><td>${fmtPKR(b.received)}</td><td>${fmtPKR(rem)}</td><td>${b.method||''}</td>`;
    
    // Add action buttons
    const actionTd = document.createElement('td');
    actionTd.className = 'actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn secondary small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editBill(b.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger small';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteBill(b.id));
    
    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  });
  toggle('#bill-detail', true);
}
document.getElementById('close-bill-detail').addEventListener('click', ()=> toggle('#bill-detail', false));

/* REPORTS */
document.getElementById('btn-gen-report').addEventListener('click', ()=> { syncSelectors(); toggle('#form-report', true); });
document.getElementById('cancel-report').addEventListener('click', ()=> toggle('#form-report', false));
document.getElementById('make-report').addEventListener('click', makeReport);

function renderReports(){
  const rs = load(S.reports), ps = load(S.patients);
  const tbody = document.querySelector('#table-reports tbody'); tbody.innerHTML = '';
  rs.slice().reverse().forEach(r => {
    const p = ps.find(x => x.id === r.patientId);
    const tr = document.createElement('tr');
    const a = document.createElement('a'); a.href = r.href; a.download = r.filename; a.textContent = 'Download';
    const tdLink = document.createElement('td'); tdLink.appendChild(a);
    tr.innerHTML = `<td>${r.id}</td><td>${p?.name||''}</td><td>${r.date}</td>`;
    tr.appendChild(tdLink);
    
    // Add action buttons
    const actionTd = document.createElement('td');
    actionTd.className = 'actions';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger small';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteReport(r.id));
    
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  });
}

function deleteReport(id) {
  if (!confirm('Are you sure you want to delete this report?')) return;
  
  const rs = load(S.reports);
  const filtered = rs.filter(r => r.id !== id);
  save(S.reports, filtered);
  
  renderReports();
}

async function makeReport(){
  const patientId = v('#r-patient'); if(!patientId) return alert('Select a patient');
  const ps = load(S.patients), ds = load(S.doctors), as = load(S.appointments), bs = load(S.bills);
  const p = ps.find(x => x.id === patientId);
  const ap = as.filter(x => x.patientId === patientId).sort((a,b)=> (b.date + b.time).localeCompare(a.date + a.time));
  const bl = bs.filter(x => x.patientId === patientId).sort((a,b)=> b.date.localeCompare(a.date));

  // Build PDF using jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 14;
  doc.setFontSize(16); doc.text('Clinic Report', 14, y); y+=8;
  doc.setFontSize(11);
  doc.text(`Patient: ${p.name}  |  Token: ${p.token || '-'}`, 14, y); y+=6;
  doc.text(`Age: ${p.age || '-'}  |  Gender: ${p.gender || '-'}  |  Contact: ${p.contact || '-'}`, 14, y); y+=10;

  doc.setFontSize(13); doc.text('Recent Appointments', 14, y); y+=6; doc.setFontSize(11);
  if(ap.length === 0){ doc.text('No appointments.', 14, y); y+=6; }
  else{
    ap.slice(0,8).forEach(a => {
      const d = ds.find(x => x.id === a.doctorId);
      const line = `${a.date} ${a.time}  —  ${d?.name || ''} (${d?.spec || ''})`;
      doc.text(line, 14, y); y+=6;
    });
  }
  y+=4;
  doc.setFontSize(13); doc.text('Recent Bills', 14, y); y+=6; doc.setFontSize(11);
  if(bl.length === 0){ doc.text('No bills.', 14, y); y+=6; }
  else{
    bl.slice(0,10).forEach(b => {
      const rem = Number(b.total || 0) - Number(b.received || 0);
      const line = `${b.date}  —  Total: ${b.total}  Received: ${b.received}  Remaining: ${rem}`;
      doc.text(line, 14, y); y+=6;
    });
  }

  const filename = `report_${(p.name||'patient').replace(/\s+/g,'_')}_${Date.now()}.pdf`;
  const href = doc.output('bloburl');

  const rs = load(S.reports); const id = uid();
  rs.push({ id, patientId, date: todayStr(), filename, href }); save(S.reports, rs);

  // Trigger download
  const a = document.createElement('a'); a.href = href; a.download = filename; a.click();

  toggle('#form-report', false); renderReports();
}

/* USERS */
document.getElementById('btn-add-user').addEventListener('click', ()=> { 
  clearUserForm(); 
  document.getElementById('user-form-title').textContent = 'Add User';
  toggle('#form-user', true); 
});
document.getElementById('cancel-user').addEventListener('click', ()=> toggle('#form-user', false));
document.getElementById('save-user').addEventListener('click', ()=>{
  const id = v('#u-id');
  const username = v('#u-username'), password = v('#u-password'), role = v('#u-role');
  if(!username || !password) return alert('Username and password required');
  const us = load(S.users);
  
  if (id) {
    // Update existing user
    const index = us.findIndex(u => u.id === id);
    if (index !== -1) {
      us[index] = { id, username, role };
    }
  } else {
    // Add new user
    us.push({ id: uid(), username, role });
  }
  
  save(S.users, us);
  clearUserForm(); toggle('#form-user', false); renderUsers();
});

function renderUsers(){
  const us = load(S.users); const tbody = document.querySelector('#table-users tbody'); tbody.innerHTML = '';
  us.forEach(u => { 
    const tr = document.createElement('tr'); 
    tr.innerHTML = `<td>${u.username}</td><td>${u.role||''}</td>`;
    
    // Add action buttons
    const actionTd = document.createElement('td');
    actionTd.className = 'actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn secondary small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editUser(u.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger small';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteUser(u.id));
    
    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  });
}

function editUser(id) {
  const us = load(S.users);
  const user = us.find(u => u.id === id);
  if (!user) return;
  
  document.getElementById('u-id').value = user.id;
  document.getElementById('u-username').value = user.username || '';
  document.getElementById('u-password').value = '';
  document.getElementById('u-role').value = user.role || 'Receptionist';
  
  document.getElementById('user-form-title').textContent = 'Edit User';
  toggle('#form-user', true);
}

function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  const us = load(S.users);
  const filtered = us.filter(u => u.id !== id);
  save(S.users, filtered);
  
  renderUsers();
}

function clearUserForm(){ 
  document.getElementById('u-id').value = '';
  ['#u-username','#u-password'].forEach(id => { 
    const el = document.querySelector(id); 
    if(el) el.value = ''; 
  }); 
  document.getElementById('u-role').value='Admin'; 
}

/* Helpers */
function toggle(sel, show){ const el = document.querySelector(sel); if(!el) return; el.classList.toggle('hidden', !show); }
function v(sel){ const el = document.querySelector(sel); return el ? el.value : ''; }

function syncSelectors(){
  const ps = load(S.patients), ds = load(S.doctors);
  const pOpts = ['<option value="">Select Patient</option>'].concat(ps.map(p => `<option value="${p.id}">${p.name} (${p.token})</option>`)).join('');
  const dOpts = ['<option value="">Select Doctor</option>'].concat(ds.map(d => `<option value="${d.id}">${d.name} — ${d.spec}</option>`)).join('');
  ['#a-patient','#b-patient','#r-patient'].forEach(id => { const el = document.querySelector(id); if(el) el.innerHTML = pOpts; });
  const aDoc = document.querySelector('#a-doctor'); if(aDoc) aDoc.innerHTML = dOpts;
}

/* Initial render */
renderDashboard(); renderPatients(); renderDoctors(); renderAppointments(); renderBills(); renderReports(); renderUsers();