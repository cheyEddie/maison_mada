const state = {
  token: localStorage.getItem('maisonMadaToken') || '',
  user: null,
  visits: [],
  activeVisitId: ''
};

const els = {
  loginCard: document.querySelector('#loginCard'),
  loginForm: document.querySelector('#loginForm'),
  dashboard: document.querySelector('#dashboard'),
  agentName: document.querySelector('#agentName'),
  visitList: document.querySelector('#visitList'),
  detailPanel: document.querySelector('#detailPanel'),
  detailTitle: document.querySelector('#detailTitle'),
  detailContent: document.querySelector('#detailContent'),
  detailClose: document.querySelector('#detailClose'),
  themeToggle: document.querySelector('#themeToggle'),
  logoutButton: document.querySelector('#logoutButton')
};

function icons() {
  if (window.lucide) window.lucide.createIcons();
}

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.classList.toggle('dark-mode', dark);
  document.body.classList.toggle('dark-mode', dark);
  localStorage.setItem('maisonMadaTheme', dark ? 'dark' : 'light');
  if (els.themeToggle) els.themeToggle.innerHTML = `<i data-lucide="${dark ? 'sun' : 'moon'}"></i>`;
  icons();
}

function headers(json = false) {
  return {
    Authorization: `Bearer ${state.token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {})
  };
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Erreur serveur');
  }
  return response.status === 204 ? null : response.json();
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function money(value, dealType) {
  const amount = new Intl.NumberFormat('fr-MG').format(Number(value || 0));
  return dealType === 'location' ? `${amount} Ar / mois` : `${amount} Ar`;
}

function propertyLabel(value) {
  return {
    maison: 'Maison',
    appartement: 'Appartement',
    terrain: 'Terrain',
    local_commercial: 'Local commercial'
  }[value] || value || '-';
}

function renderVisits() {
  els.visitList.innerHTML = state.visits.length
    ? state.visits.map((visit) => `
      <article class="visit-card ${String(visit._id) === String(state.activeVisitId) ? 'active' : ''}" data-open-visit="${visit._id}">
        <div>
          <h2>${visit.listingTitle}</h2>
          <p class="visit-meta">${visit.listingReference || ''} - ${visit.listingLocation}</p>
          <p>${visit.userName} demande une visite le ${visit.visitDate} à ${visit.visitTime}</p>
          <p class="visit-meta">À valider avant ${formatDate(visit.agentDecisionDueAt)}</p>
          <p>Statut : <strong>${visit.status}</strong> / Paiement : <strong>${visit.paymentStatus}</strong></p>
          ${visit.paymentStatus === 'paid' ? `<p>Téléphone client : ${visit.userPhone || '-'}</p>` : ''}
        </div>
        ${visit.status === 'pending_agent' ? `
          <div class="visit-actions">
            <button type="button" data-visit-status="confirmed" data-visit-id="${visit._id}">Confirmer</button>
            <button class="reject" type="button" data-visit-status="rejected" data-visit-id="${visit._id}">Refuser</button>
          </div>
        ` : ''}
      </article>
    `).join('')
    : '<div class="empty">Aucune demande de visite.</div>';
  icons();
}

async function loadVisits() {
  state.visits = await api('/api/visits/mine', { headers: headers() });
  renderVisits();
}

function openVisitDetail(visit) {
  if (!visit) return;
  state.activeVisitId = String(visit._id);
  const listing = visit.listing || {};
  const image = listing.images?.[0] || '';
  els.detailTitle.textContent = listing.title || visit.listingTitle;
  els.detailContent.innerHTML = `
    ${image ? `<img class="detail-image" src="${image}" alt="">` : ''}
    <div class="detail-grid">
      <div><span>Référence</span><strong>${listing.reference || visit.listingReference || '-'}</strong></div>
      <div><span>Quartier</span><strong>${listing.location || visit.listingLocation || '-'}</strong></div>
      <div><span>Arrondissement</span><strong>${listing.arrondissement?.label || '-'}</strong></div>
      <div><span>Type</span><strong>${propertyLabel(listing.propertyType)}</strong></div>
      <div><span>Annonce</span><strong>${listing.dealType === 'vente' ? 'Vente' : 'Location'}</strong></div>
      <div><span>Prix</span><strong>${money(listing.price, listing.dealType)}</strong></div>
      <div><span>Chambres</span><strong>${listing.bedrooms || 0}</strong></div>
      <div><span>Surface</span><strong>${listing.area || 0} m²</strong></div>
    </div>
    <section>
      <h3>Description</h3>
      <p>${listing.description || 'Aucune description.'}</p>
    </section>
    <section>
      <h3>Demande de visite</h3>
      <p>Client : <strong>${visit.userName}</strong></p>
      <p>Date : <strong>${visit.visitDate} à ${visit.visitTime}</strong></p>
      <p>À valider avant : <strong>${formatDate(visit.agentDecisionDueAt)}</strong></p>
      <p>Statut : <strong>${visit.status}</strong></p>
      ${visit.paymentStatus === 'paid' ? `<p>Téléphone client : <strong>${visit.userPhone || '-'}</strong></p>` : ''}
    </section>
    ${listing.mapUrl ? `<a class="map-link" href="${listing.mapUrl}" target="_blank" rel="noreferrer">Ouvrir la carte</a>` : ''}
    ${visit.status === 'pending_agent' ? `
      <div class="visit-actions">
        <button type="button" data-visit-status="confirmed" data-visit-id="${visit._id}">Confirmer</button>
        <button class="reject" type="button" data-visit-status="rejected" data-visit-id="${visit._id}">Refuser</button>
      </div>
    ` : ''}
  `;
  els.detailPanel.hidden = false;
  renderVisits();
  icons();
}

async function hydrate() {
  if (!state.token) {
    window.location.replace('/login.html');
    return;
  }
  try {
    state.user = await api('/api/auth/me', { headers: headers() });
    if (state.user.role !== 'agent') throw new Error('Compte agent requis');
    els.loginCard.hidden = true;
    els.dashboard.hidden = false;
    els.agentName.textContent = `${state.user.name} - ${state.user.agentArrondissement || '-'}e arrondissement`;
    await loadVisits();
  } catch (_error) {
    localStorage.removeItem('maisonMadaToken');
    state.token = '';
    window.location.replace('/login.html');
  }
}

els.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  window.location.replace('/login.html');
});

els.visitList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-visit-status]');
  if (!button) {
    const card = event.target.closest('[data-open-visit]');
    if (card) {
      const visit = state.visits.find((item) => String(item._id) === String(card.dataset.openVisit));
      openVisitDetail(visit);
    }
    return;
  }
  event.stopPropagation();
  try {
    await api(`/api/visits/agent/${button.dataset.visitId}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify({ status: button.dataset.visitStatus })
    });
    await loadVisits();
    const visit = state.visits.find((item) => String(item._id) === String(state.activeVisitId));
    if (visit) openVisitDetail(visit);
  } catch (error) {
    alert(error.message);
  }
});

els.detailClose.addEventListener('click', () => {
  state.activeVisitId = '';
  els.detailPanel.hidden = true;
  renderVisits();
});

els.logoutButton.addEventListener('click', () => {
  localStorage.removeItem('maisonMadaToken');
  window.location.reload();
});

els.themeToggle.addEventListener('click', () => {
  const dark = document.documentElement.classList.contains('dark-mode');
  applyTheme(dark ? 'light' : 'dark');
});

applyTheme(localStorage.getItem('maisonMadaTheme') || 'light');
hydrate();
