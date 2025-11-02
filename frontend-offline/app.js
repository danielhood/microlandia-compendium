const state = {
  all: [],
  filtered: [],
  filters: { researcherName: '', commonName: '', scientificName: '', habitat: '', q: '' },
  researchers: [],
  currentIndex: -1
};
const config = { shareUrl: '', shareQrDataUrl: '' };

const els = {
  tbody: document.getElementById('tbody'),
  emptyTpl: document.getElementById('empty-template'),
  researcherSelect: document.getElementById('researcher-select'),
  researcherToggle: document.getElementById('researcher-toggle'),
  researcherLabel: document.getElementById('researcher-label'),
  researcherMenu: document.getElementById('researcher-menu'),
  filterCommon: document.getElementById('filter-common'),
  filterScientific: document.getElementById('filter-scientific'),
  filterHabitat: document.getElementById('filter-habitat'),
  filterQ: document.getElementById('filter-q'),
  resetBtn: document.getElementById('reset-btn'),
  detailOverlay: document.getElementById('detail-overlay'),
  detailClose: document.getElementById('detail-close'),
  dImg: document.getElementById('detail-image'),
  dCommon: document.getElementById('detail-common'),
  dScientific: document.getElementById('detail-scientific'),
  dResearcher: document.getElementById('detail-researcher'),
  dHabitat: document.getElementById('detail-habitat'),
  dNotes: document.getElementById('detail-notes'),
  dPrev: document.getElementById('detail-prev'),
  dNext: document.getElementById('detail-next'),
  shareLink: document.getElementById('share-link'),
  qrOverlay: document.getElementById('qr-overlay'),
  qrClose: document.getElementById('qr-close'),
  qrImage: document.getElementById('qr-image'),
};

async function loadConfig() {
  try {
    const res = await fetch('./config.json', { cache: 'no-store' });
    if (res.ok) {
      const c = await res.json();
      config.shareUrl = c.shareUrl || '';
      config.shareQrDataUrl = c.shareQrDataUrl || '';
    }
  } catch {}
}

async function loadData() {
  try {
    const res = await fetch('./compendium.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch compendium.json');
    const data = await res.json();
    state.all = Array.isArray(data) ? data : [];
    buildResearchers();
    applyFilters();
  } catch (e) {
    console.error(e);
    els.tbody.innerHTML = '<tr><td colspan="4">Could not load compendium.json. Place this site alongside compendium.json and images/ and serve over HTTP.</td></tr>';
  }
}

function buildResearchers() {
  const set = new Set();
  state.all.forEach(o => { const r = (o.researcherName || '').trim(); if (r) set.add(r); });
  state.researchers = Array.from(set).sort((a,b)=>a.localeCompare(b));
  const options = [''].concat(state.researchers);
  els.researcherMenu.innerHTML = options.map(val => {
    const label = val || 'All Researchers';
    return `<div class="option" data-value="${escapeHtml(val)}">${escapeHtml(label)}</div>`;
  }).join('');
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

function applyFilters() {
  const f = state.filters;
  const q = (f.q||'').toLowerCase();
  state.filtered = state.all.filter(o => {
    if (f.researcherName && o.researcherName !== f.researcherName) return false;
    if (f.commonName && !String(o.commonName||'').toLowerCase().includes(f.commonName.toLowerCase())) return false;
    if (f.scientificName && !String(o.scientificName||'').toLowerCase().includes(f.scientificName.toLowerCase())) return false;
    if (f.habitat && !String(o.habitat||'').toLowerCase().includes(f.habitat.toLowerCase())) return false;
    if (q) {
      const hay = `${o.fieldNotes||''} ${o.commonName||''} ${o.scientificName||''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  renderTable();
}

function renderTable() {
  const rows = state.filtered.map(o => {
    const img = o.imagePath ? `<img src="./${encodeURI(o.imagePath)}" alt="thumb" class="thumb" />` : '';
    return `<tr class="clickable" data-id="${escapeHtml(o._id)}">
      <td>${img}</td>
      <td>${escapeHtml(o.commonName||'')}</td>
      <td><i>${escapeHtml(o.scientificName||'')}</i></td>
      <td>${escapeHtml(o.researcherName||'')}</td>
    </tr>`;
  });
  els.tbody.innerHTML = rows.join('') || `<tr><td colspan="4">No observations found.</td></tr>`;
}

function attachEvents() {
  let debounce;
  function onChange(){ clearTimeout(debounce); debounce = setTimeout(()=>{ applyFilters(); }, 200); }
  // Custom select open/close
  els.researcherToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const hidden = els.researcherMenu.hasAttribute('hidden');
    if (hidden) els.researcherMenu.removeAttribute('hidden'); else els.researcherMenu.setAttribute('hidden','');
  });
  document.addEventListener('click', () => { els.researcherMenu.setAttribute('hidden',''); });
  els.researcherMenu.addEventListener('click', (e) => {
    const opt = e.target.closest('.option');
    if (!opt) return;
    const value = opt.getAttribute('data-value') || '';
    state.filters.researcherName = value;
    els.researcherLabel.textContent = value || 'All Researchers';
    els.researcherMenu.setAttribute('hidden','');
    onChange();
  });
  els.filterCommon.addEventListener('input', e => { state.filters.commonName = e.target.value; onChange(); });
  els.filterScientific.addEventListener('input', e => { state.filters.scientificName = e.target.value; onChange(); });
  els.filterHabitat.addEventListener('input', e => { state.filters.habitat = e.target.value; onChange(); });
  els.filterQ.addEventListener('input', e => { state.filters.q = e.target.value; onChange(); });
  els.resetBtn.addEventListener('click', () => {
    state.filters = { researcherName:'', commonName:'', scientificName:'', habitat:'', q:'' };
    els.researcherLabel.textContent = 'All Researchers';
    els.filterCommon.value = '';
    els.filterScientific.value = '';
    els.filterHabitat.value = '';
    els.filterQ.value = '';
    applyFilters();
  });
  els.tbody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const id = tr.getAttribute('data-id');
    const idx = state.filtered.findIndex(o => String(o._id) === String(id));
    if (idx !== -1) openDetailByIndex(idx);
  });
  els.detailOverlay.addEventListener('click', () => closeDetail());
  els.detailClose.addEventListener('click', () => closeDetail());
  els.dPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
  els.dNext.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });

  // Share (QR)
  if (els.shareLink) {
    els.shareLink.addEventListener('click', (e) => {
      e.preventDefault();
      openQr();
    });
  }
  if (els.qrOverlay) els.qrOverlay.addEventListener('click', () => closeQr());
  if (els.qrClose) els.qrClose.addEventListener('click', (e) => { e.stopPropagation(); closeQr(); });
}

function openDetailByIndex(index){
  state.currentIndex = index;
  const o = state.filtered[index];
  if (!o) return;
  els.dCommon.textContent = o.commonName || '';
  els.dScientific.textContent = o.scientificName || '';
  els.dResearcher.textContent = o.researcherName || '';
  els.dHabitat.textContent = o.habitat || '';
  els.dNotes.textContent = o.fieldNotes || '';
  if (o.imagePath) {
    els.dImg.src = `./${o.imagePath}`;
    els.dImg.hidden = false;
  } else {
    els.dImg.hidden = true;
  }
  els.detailOverlay.hidden = false;
  updateNavButtons();
}
function closeDetail(){ els.detailOverlay.hidden = true; }

function updateNavButtons(){
  els.dPrev.disabled = state.currentIndex <= 0;
  els.dNext.disabled = state.currentIndex >= state.filtered.length - 1;
}
function showPrev(){
  if (state.currentIndex > 0) openDetailByIndex(state.currentIndex - 1);
}
function showNext(){
  if (state.currentIndex < state.filtered.length - 1) openDetailByIndex(state.currentIndex + 1);
}

async function openQr(){
  // Prefer explicit QR data URL from config
  if (config.shareQrDataUrl) {
    els.qrImage.src = config.shareQrDataUrl;
    els.qrOverlay.hidden = false;
    return;
  }
  // Otherwise, generate locally via bundled QR library (vendor/qrcode.min.js)
  const QR = (window && window.QRCode) ? window.QRCode : null;
  if (config.shareUrl && QR) {
    try {
      if (typeof QR.toDataURL === 'function') {
        // Some libraries expose a toDataURL utility
        const dataUrl = await QR.toDataURL(config.shareUrl, { width: 320, margin: 1 });
        els.qrImage.src = dataUrl;
      } else if (typeof QR === 'function') {
        // davidshimjs QRCode API: render to a temp container and read <img>.src
        const tmp = document.createElement('div');
        tmp.style.position = 'fixed';
        tmp.style.left = '-9999px';
        document.body.appendChild(tmp);
        const q = new QR(tmp, { text: config.shareUrl, width: 320, height: 320, correctLevel: QR.CorrectLevel && QR.CorrectLevel.M ? QR.CorrectLevel.M : 1 });
        // It renders an <img> tag by default with data URL
        const img = tmp.querySelector('img');
        if (img && img.src) {
          els.qrImage.src = img.src;
        } else {
          // Fallback: try canvas
          const canvas = tmp.querySelector('canvas');
          els.qrImage.src = canvas ? canvas.toDataURL('image/png') : '';
        }
        document.body.removeChild(tmp);
      }
    } catch (e) {
      console.error('QR generation failed', e);
      els.qrImage.removeAttribute('src');
    }
  } else {
    els.qrImage.removeAttribute('src');
  }
  els.qrOverlay.hidden = false;
}
function closeQr(){ els.qrOverlay.hidden = true; }

attachEvents();
// Load config first (best-effort), then data
loadConfig().finally(() => loadData());
