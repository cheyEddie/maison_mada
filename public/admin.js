const state = {
  token: localStorage.getItem('maisonMadaToken') || '',
  theme: localStorage.getItem('maisonMadaAdminTheme') || 'light',
  user: null,
  listings: [],
  users: [],
  tab: 'overview',
  listingFilter: 'all',
  userFilter: 'all',
  search: '',
  editingListingId: '',
  messageTarget: 'all',
  supportConversations: [],
  supportMessages: [],
  activeSupportConversationId: '',
  socket: null,
  charts: {}
};

const els = {
  authBlock: document.querySelector('#authBlock'),
  adminContent: document.querySelector('#adminContent'),
  loginForm: document.querySelector('#loginForm'),
  logoutButton: document.querySelector('#logoutButton'),
  themeToggle: document.querySelector('#themeToggle'),
  adminSearch: document.querySelector('#adminSearch'),
  pageTitle: document.querySelector('#pageTitle'),
  kpiGrid: document.querySelector('#kpiGrid'),
  adminNotifications: document.querySelector('#adminNotifications'),
  adminNotificationsCount: document.querySelector('#adminNotificationsCount'),
  adminNotificationsOpen: document.querySelector('#adminNotificationsOpen'),
  adminNotificationsClose: document.querySelector('#adminNotificationsClose'),
  adminNotificationsPanel: document.querySelector('#adminNotificationsPanel'),
  adminNotificationsQuick: document.querySelector('#adminNotificationsQuick'),
  adminMessageOpen: document.querySelector('#adminMessageOpen'),
  adminMessageClose: document.querySelector('#adminMessageClose'),
  adminMessagePanel: document.querySelector('#adminMessagePanel'),
  supportConversationList: document.querySelector('#supportConversationList'),
  supportThreadTitle: document.querySelector('#supportThreadTitle'),
  supportMessageList: document.querySelector('#supportMessageList'),
  supportReplyForm: document.querySelector('#supportReplyForm'),
  recentListingsTable: document.querySelector('#recentListingsTable'),
  listingsTable: document.querySelector('#listingsTable'),
  usersTable: document.querySelector('#usersTable'),
  statusLegend: document.querySelector('#statusLegend'),
  portfolioChart: document.querySelector('#portfolioChart'),
  statusChart: document.querySelector('#statusChart'),
  listingModal: document.querySelector('#listingModal'),
  listingForm: document.querySelector('#listingForm'),
  listingFormStatus: document.querySelector('#listingFormStatus'),
  listingDetailModal: document.querySelector('#listingDetailModal'),
  listingDetailMeta: document.querySelector('#listingDetailMeta'),
  listingDetailTitle: document.querySelector('#listingDetailTitle'),
  listingDetailContent: document.querySelector('#listingDetailContent'),
  userProfileModal: document.querySelector('#userProfileModal'),
  userProfileMeta: document.querySelector('#userProfileMeta'),
  userProfileTitle: document.querySelector('#userProfileTitle'),
  userProfileContent: document.querySelector('#userProfileContent'),
  messageModal: document.querySelector('#messageModal'),
  messageForm: document.querySelector('#messageForm'),
  messageTarget: document.querySelector('#messageTarget'),
  messageFormStatus: document.querySelector('#messageFormStatus'),
  activityModal: document.querySelector('#activityModal'),
  activityUser: document.querySelector('#activityUser'),
  activityList: document.querySelector('#activityList'),
  broadcastOpen: document.querySelector('#broadcastOpen'),
  agentOpen: document.querySelector('#agentOpen'),
  agentModal: document.querySelector('#agentModal'),
  agentForm: document.querySelector('#agentForm'),
  agentFormStatus: document.querySelector('#agentFormStatus'),
  adminSupportCount: document.querySelector('#adminSupportCount'),
  toast: document.querySelector('#toast')
};

function icons() {
  if (window.lucide) window.lucide.createIcons();
}

function isDarkMode() {
  return state.theme === 'dark';
}

function applyTheme(theme) {
  state.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark-mode', isDarkMode());
  document.body.classList.toggle('dark-mode', isDarkMode());
  localStorage.setItem('maisonMadaAdminTheme', state.theme);
  els.themeToggle.innerHTML = `<i data-lucide="${isDarkMode() ? 'sun' : 'moon'}"></i>`;
  els.themeToggle.title = isDarkMode() ? 'Mode clair' : 'Mode sombre';
  icons();
  renderCharts();
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
  if (response.status === 204) return null;
  return response.json();
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function money(value, dealType) {
  const amount = new Intl.NumberFormat('fr-MG').format(Number(value || 0));
  return `${amount} Ar${dealType === 'location' ? ' / mois' : ''}`;
}

function statusClass(status) {
  return status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';
}

function statusLabel(status) {
  return status === 'approved' ? 'Acceptée' : status === 'rejected' ? 'Refusée' : 'À modérer';
}

function propertyTypeLabel(value) {
  return {
    maison: 'Maison',
    appartement: 'Appartement',
    terrain: 'Terrain',
    local_commercial: 'Local commercial'
  }[value] || value || '-';
}

function tooltipAttrs(label) {
  const text = escapeHtml(label);
  return `aria-label="${text}" title="${text}" data-tooltip="${text}"`;
}

function activityLabel(activity) {
  const labels = {
    'auth.register': 'Création du compte',
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.identity_verification': 'Demande de vérification',
    'listing.create': 'Création publication',
    'listing.update': 'Modification publication',
    'listing.delete': 'Suppression publication',
    'admin.user_update': 'Modification du compte par admin',
    'admin.notification': 'Message envoyé par admin',
    'admin.notification_broadcast': 'Message global envoyé',
    'admin.listing_moderation': 'Modération publication',
    'admin.listing_featured': 'Mise à la une',
    'admin.listing_delete': 'Suppression publication par admin',
    'admin.listing_update': 'Modification publication par admin'
  };
  return activity.label || labels[activity.type] || activity.type || 'Activité';
}

function primaryImage(listing) {
  return Array.isArray(listing.images) && listing.images.length ? listing.images[0] : listing.image;
}

function listingImages(listing) {
  return Array.isArray(listing.images) && listing.images.length ? listing.images : [listing.image].filter(Boolean);
}

function listingMapUrl(listing) {
  return listing.mapResolvedUrl || listing.mapUrl || '';
}

function listingMapEmbedUrl(listing) {
  if (listing.mapEmbedUrl) return listing.mapEmbedUrl;
  const lat = Number(listing.mapCoordinates?.lat);
  const lng = Number(listing.mapCoordinates?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? `https://www.google.com/maps?q=${lat},${lng}&z=18&output=embed`
    : '';
}

function verificationStatusLabel(user) {
  if (user.role === 'admin' || user.identityVerified === true) return 'Vérifié';
  const status = user.identityVerification?.status || 'none';
  return status === 'pending' ? 'Vérification demandée' : status === 'rejected' ? 'Vérification refusée' : 'Non vérifié';
}

function verificationStatusClass(user) {
  if (user.role === 'admin' || user.identityVerified === true) return 'approved';
  return user.identityVerification?.status === 'pending' ? 'pending' : 'rejected';
}

function isCommercialPremises() {
  return els.listingForm.elements.propertyType.value === 'local_commercial';
}

function applyListingFormRules() {
  const form = els.listingForm;
  const house = form.elements.propertyType.value === 'maison';
  const hideArea = form.elements.dealType.value === 'location' && house;
  const commercialPremises = isCommercialPremises();

  form.querySelector('[data-area-field]').hidden = hideArea;
  form.elements.area.disabled = hideArea;
  if (hideArea) form.elements.area.value = 0;

  form.querySelectorAll('[data-house-field]').forEach((field) => {
    field.hidden = !house;
    field.querySelectorAll('select').forEach((select) => {
      select.disabled = !house;
    });
  });
  if (!house) form.elements.isAvailable.value = 'true';

  form.querySelectorAll('[data-residential-utility]').forEach((field) => {
    field.hidden = commercialPremises;
    field.querySelectorAll('select').forEach((select) => {
      select.disabled = commercialPremises;
    });
  });
  if (commercialPremises) {
    form.elements.waterSource.value = 'exterieur';
    form.elements.showerLocation.value = 'exterieur';
    form.elements.wcLocation.value = 'exterieur';
  }
}

function listingFormData() {
  const form = els.listingForm;
  const fileInput = form.elements.image;
  if (fileInput.files.length > 5) throw new Error('Vous pouvez ajouter 5 photos maximum');
  if (fileInput.files.length > 0 && fileInput.files.length < 3) throw new Error('Si vous remplacez les photos, ajoutez au moins 3 photos');

  const data = new FormData(form);
  if (form.elements.area.disabled) data.set('area', '0');
  data.set('hasElectricity', form.elements.hasElectricity.value);
  data.set('isAvailable', form.elements.isAvailable.disabled ? 'true' : form.elements.isAvailable.value);
  data.set('hasMotorbikeAccess', form.elements.hasMotorbikeAccess.checked ? 'true' : 'false');
  data.set('hasCarAccess', form.elements.hasCarAccess.checked ? 'true' : 'false');
  data.set('isStudentHousing', 'false');
  return data;
}

function filteredListings(source = state.listings) {
  const search = state.search.toLowerCase();
  return source.filter((listing) => {
    const matchFilter = state.listingFilter === 'all' || listing.status === state.listingFilter;
    const haystack = [listing.title, listing.location, listing.ownerName, listing.reference, listing.propertyType].join(' ').toLowerCase();
    return matchFilter && (!search || haystack.includes(search));
  });
}

function filteredUsers() {
  const search = state.search.toLowerCase();
  return state.users.filter((user) => {
    const admin = user.role === 'admin';
    const verified = admin || user.identityVerified === true;
    const matchFilter = state.userFilter === 'all'
      || (state.userFilter === 'unverified' && !verified)
      || (state.userFilter === 'agency' && user.accountType === 'agence')
      || (state.userFilter === 'admin' && admin);
    const haystack = [user.name, user.email, user.phone, user.reference, user.accountType, user.role].join(' ').toLowerCase();
    return matchFilter && (!search || haystack.includes(search));
  });
}

function renderKpis() {
  const pending = state.listings.filter((listing) => listing.status === 'pending').length;
  const approved = state.listings.filter((listing) => listing.status === 'approved').length;
  const unverified = state.users.filter((user) => user.role !== 'admin' && !user.identityVerified).length;
  const revenue = state.listings.reduce((sum, listing) => sum + Number(listing.price || 0), 0);
  const compactRevenue = new Intl.NumberFormat('fr-MG', { notation: 'compact' }).format(revenue);

  els.kpiGrid.innerHTML = [
    ['building-2', state.listings.length, 'Publications'],
    ['clock-3', pending, 'À modérer'],
    ['badge-check', approved, 'Acceptées'],
    ['users', state.users.length, 'Comptes'],
    ['user-x', unverified, 'Identités à vérifier'],
    ['banknote', compactRevenue, 'Valeur portefeuille']
  ].map(([icon, value, label]) => `
    <article class="kpi-card">
      <span class="kpi-icon"><i data-lucide="${icon}"></i></span>
      <strong>${value}</strong>
      <span>${label}</span>
    </article>
  `).join('');
}

function renderCharts() {
  if (!window.Chart) return;

  const types = ['maison', 'appartement', 'terrain', 'local_commercial'];
  const typeCounts = types.map((type) => state.listings.filter((listing) => listing.propertyType === type).length);
  const statusCounts = ['approved', 'pending', 'rejected'].map((status) => state.listings.filter((listing) => listing.status === status).length);
  const chartGridColor = isDarkMode() ? '#263750' : '#e8eef6';
  const chartTextColor = isDarkMode() ? '#98a9bf' : '#758195';

  Object.values(state.charts).forEach((chart) => chart.destroy());
  state.charts.portfolio = new Chart(els.portfolioChart, {
    type: 'bar',
    data: {
      labels: types.map(propertyTypeLabel),
      datasets: [{
        label: 'Publications',
        data: typeCounts,
        borderRadius: 14,
        backgroundColor: ['#12735f', '#3b82f6', '#f97316', '#10b981']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: chartGridColor }, ticks: { color: chartTextColor } },
        x: { grid: { display: false }, ticks: { color: chartTextColor } }
      }
    }
  });

  state.charts.status = new Chart(els.statusChart, {
    type: 'doughnut',
    data: {
      labels: ['Acceptées', 'À modérer', 'Refusées'],
      datasets: [{ data: statusCounts, backgroundColor: ['#10b981', '#f97316', '#ef4444'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false } } }
  });

  els.statusLegend.innerHTML = [
    ['Acceptées', statusCounts[0]],
    ['À modérer', statusCounts[1]],
    ['Refusées', statusCounts[2]]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
}

function listingRows(listings) {
  if (!listings.length) return '<div class="empty">Aucune publication trouvée.</div>';
  return `
    <table>
      <thead><tr><th>Publication</th><th>Statut</th><th>Propriétaire</th><th>Localisation</th><th>Prix</th><th>Créée le</th><th>Actions</th></tr></thead>
      <tbody>
        ${listings.map((listing) => `
          <tr data-view-listing="${listing._id}">
            <td>
              <div class="listing-cell">
                <img src="${escapeHtml(primaryImage(listing))}" alt="">
                <div><strong>${escapeHtml(listing.title)}</strong><span>${propertyTypeLabel(listing.propertyType)} · ${escapeHtml(listing.reference || '-')}</span></div>
              </div>
            </td>
            <td><span class="status-pill ${statusClass(listing.status)}">${statusLabel(listing.status)}</span></td>
            <td>${escapeHtml(listing.ownerName || 'MaisonMada')}</td>
            <td>${escapeHtml(listing.location || '-')}</td>
            <td>${money(listing.price, listing.dealType)}</td>
            <td>${formatDate(listing.createdAt)}</td>
            <td>
              <div class="actions">
                <button class="action-btn primary" type="button" data-edit-listing="${listing._id}" ${tooltipAttrs('Modifier la publication')}><i data-lucide="pencil"></i></button>
                <button class="action-btn" type="button" data-featured="${listing._id}" data-next-featured="${listing.featured ? 'false' : 'true'}" ${tooltipAttrs(listing.featured ? 'Retirer de la une' : 'Mettre à la une')}><i data-lucide="star"></i></button>
                <button class="action-btn" type="button" data-approve="${listing._id}" ${listing.status === 'approved' ? 'disabled' : ''} ${tooltipAttrs('Approuver la publication')}><i data-lucide="check"></i></button>
                <button class="action-btn" type="button" data-reject="${listing._id}" ${listing.status === 'rejected' ? 'disabled' : ''} ${tooltipAttrs('Refuser la publication')}><i data-lucide="x"></i></button>
                <button class="action-btn danger" type="button" data-delete-listing="${listing._id}" ${tooltipAttrs('Supprimer la publication')}><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function userRows(users) {
  if (!users.length) return '<div class="empty">Aucun utilisateur trouvé.</div>';
  return `
    <table>
      <thead><tr><th>Compte</th><th>Rôle</th><th>Téléphone</th><th>Statut</th><th>Créé le</th><th>Actions</th></tr></thead>
      <tbody>
        ${users.map((user) => {
          const admin = user.role === 'admin';
          const verified = admin || user.identityVerified === true;
          return `
            <tr data-view-user="${user._id}">
              <td><div class="user-cell"><strong>${escapeHtml(user.name || user.email)}</strong><span>${escapeHtml(user.email)} · ${escapeHtml(user.reference || '-')}</span></div></td>
              <td><span class="status-pill ${admin ? 'approved' : 'pending'}">${admin ? 'admin' : 'user'}</span></td>
              <td>${escapeHtml(user.phone || '-')}</td>
              <td><span class="status-pill ${verified ? 'approved' : 'rejected'}">${verified ? 'Vérifié' : 'Non vérifié'}</span></td>
              <td>${formatDate(user.createdAt)}</td>
              <td>
                <div class="actions">
                  <button class="action-btn primary" type="button" data-message-user="${user._id}" data-user-name="${escapeHtml(user.name || user.email)}" ${tooltipAttrs('Envoyer un message')}><i data-lucide="send"></i></button>
                  <button class="action-btn" type="button" data-user-activity="${user._id}" data-user-name="${escapeHtml(user.name || user.email)}" ${tooltipAttrs('Voir l’historique')}><i data-lucide="history"></i></button>
                  ${admin ? '<span class="status-pill approved">Protégé</span>' : `
                    <button class="action-btn" type="button" data-account="${user._id}" data-account-type="${user.accountType === 'agence' ? 'particulier' : 'agence'}" ${tooltipAttrs(user.accountType === 'agence' ? 'Passer en compte particulier' : 'Passer en compte agence')}><i data-lucide="${user.accountType === 'agence' ? 'user-round' : 'building-2'}"></i></button>
                    <button class="action-btn" type="button" data-verify="${user._id}" data-verified="${verified ? 'false' : 'true'}" ${tooltipAttrs(verified ? 'Retirer la vérification' : 'Vérifier l’identité')}><i data-lucide="${verified ? 'badge-x' : 'badge-check'}"></i></button>
                    <button class="action-btn danger" type="button" data-delete-user="${user._id}" ${tooltipAttrs('Supprimer le compte')}><i data-lucide="trash-2"></i></button>
                  `}
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderTables() {
  const recent = [...state.listings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  els.recentListingsTable.innerHTML = listingRows(recent);
  els.listingsTable.innerHTML = listingRows(filteredListings());
  els.usersTable.innerHTML = userRows(filteredUsers());
}

function renderNotifications() {
  const pendingListings = state.listings.filter((listing) => listing.status === 'pending');
  const pendingUsers = state.users.filter((user) => user.role !== 'admin' && user.identityVerification?.status === 'pending');
  const items = [
    ...pendingListings.map((listing) => ({
      type: 'listing',
      id: listing._id,
      icon: 'building-2',
      title: listing.title,
      text: `${listing.location || '-'} · ${listing.ownerName || 'MaisonMada'}`,
      date: listing.createdAt
    })),
    ...pendingUsers.map((user) => ({
      type: 'user',
      id: user._id,
      icon: 'badge-check',
      title: user.name || user.email,
      text: `Demande de vérification · ${user.email}`,
      date: user.identityVerification?.submittedAt || user.createdAt
    }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  els.adminNotificationsCount.textContent = `${items.length} ${items.length > 1 ? 'alertes' : 'alerte'}`;
  const markup = items.length
    ? items.map((item) => `
      <button class="notification-item" type="button" data-notification-${item.type}="${item.id}">
        <span class="notification-icon"><i data-lucide="${item.icon}"></i></span>
        <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.text)}</small></span>
        <em>${formatDateTime(item.date)}</em>
      </button>
    `).join('')
    : '<div class="empty">Aucune publication ou vérification en attente.</div>';
  els.adminNotifications.innerHTML = markup;
  els.adminNotificationsQuick.innerHTML = markup;
  els.adminNotificationsOpen.classList.toggle('has-alerts', items.length > 0);
  els.adminNotificationsOpen.dataset.count = items.length ? String(items.length) : '';
}

function closeAdminPopovers() {
  els.adminMessagePanel.hidden = true;
  els.adminNotificationsPanel.hidden = true;
  els.adminMessageOpen.setAttribute('aria-expanded', 'false');
  els.adminNotificationsOpen.setAttribute('aria-expanded', 'false');
}

function supportClientName(conversation) {
  const client = conversation.participants?.find((participant) => participant.role !== 'admin');
  return client?.name || 'Client';
}

function isSupportUnread(conversation) {
  if (conversation.lastSenderRole === 'admin') return false;
  return Boolean(conversation.unread);
}

function renderSupportUnreadState() {
  const unread = state.supportConversations.filter(isSupportUnread).length;
  els.adminMessageOpen.classList.toggle('has-alerts', unread > 0);
  els.adminMessageOpen.dataset.count = unread ? String(unread) : '';
  els.adminSupportCount.textContent = `${state.supportConversations.length} conversation${state.supportConversations.length > 1 ? 's' : ''}`;
}

function renderSupportConversations() {
  renderSupportUnreadState();
  els.supportConversationList.innerHTML = state.supportConversations.length
    ? state.supportConversations.map((conversation) => `
      <button class="support-conversation ${String(conversation._id) === String(state.activeSupportConversationId) ? 'active' : ''} ${isSupportUnread(conversation) ? 'unread' : ''}" type="button" data-support-conversation="${conversation._id}">
        <strong>${escapeHtml(supportClientName(conversation))}</strong>
        <span>${escapeHtml(conversation.lastMessage || 'Nouvelle conversation support')}</span>
      </button>
    `).join('')
    : '<div class="empty">Aucun message support.</div>';
}

function renderSupportMessages() {
  els.supportMessageList.innerHTML = state.supportMessages.length
    ? state.supportMessages.map((message) => `
      <div class="support-message ${message.senderRole === 'admin' ? 'mine' : ''}">
        <span>${escapeHtml(message.senderName || '')}</span>
        <p>${escapeHtml(message.body || '')}</p>
      </div>
    `).join('')
    : '<div class="empty">Choisissez une conversation.</div>';
  els.supportMessageList.scrollTop = els.supportMessageList.scrollHeight;
  icons();
}

function connectSupportSocket() {
  if (state.socket || typeof io === 'undefined' || !state.token) return;
  state.socket = io({ auth: { token: state.token } });
  state.socket.on('chat:message', (message) => {
    loadSupportConversations().catch(() => {});
    if (String(message.conversationId) === String(state.activeSupportConversationId)) {
      if (!state.supportMessages.some((item) => String(item._id) === String(message._id))) {
        state.supportMessages.push(message);
      }
      renderSupportMessages();
    }
  });
}

async function loadSupportConversations() {
  if (!state.token) return;
  const conversations = await api('/api/chat/conversations', { headers: headers() });
  state.supportConversations = conversations.filter((conversation) => conversation.type === 'support');
  renderSupportConversations();
}

async function openSupportConversation(conversation) {
  state.activeSupportConversationId = String(conversation._id);
  els.supportThreadTitle.textContent = supportClientName(conversation);
  state.supportMessages = await api(`/api/chat/conversations/${conversation._id}/messages`, { headers: headers() });
  conversation.unread = false;
  renderSupportConversations();
  renderSupportMessages();
  connectSupportSocket();
  state.socket?.emit('chat:join', { conversationId: conversation._id });
}

function renderPanels() {
  document.querySelectorAll('[data-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== state.tab;
  });
  document.querySelectorAll('[data-admin-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.adminTab === state.tab);
  });
  els.pageTitle.textContent = state.tab === 'listings' ? 'Publications' : state.tab === 'users' ? 'Utilisateurs' : 'Vue d’ensemble';
}

function render() {
  renderPanels();
  renderKpis();
  renderNotifications();
  renderCharts();
  renderTables();
  els.adminSupportCount.textContent = `${state.users.filter((user) => user.role !== 'admin').length} clients`;
  icons();
}

async function loadAdminData() {
  const [listings, users] = await Promise.all([
    api('/api/admin/listings?limit=200', { headers: headers() }),
    api('/api/admin/users', { headers: headers() })
  ]);
  state.listings = listings;
  state.users = users;
  render();
  await loadSupportConversations().catch(() => {});
}

async function hydrate() {
  if (!state.token) {
    window.location.replace('/login.html');
    return;
  }

  try {
    state.user = await api('/api/auth/me', { headers: headers() });
    if (state.user.role === 'agent') {
      window.location.replace('/agent.html');
      return;
    }
    if (state.user.role !== 'admin') throw new Error('Accès administrateur requis');
    els.authBlock.hidden = true;
    els.adminContent.hidden = false;
    connectSupportSocket();
    await loadAdminData();
  } catch (error) {
    localStorage.removeItem('maisonMadaToken');
    state.token = '';
    window.location.replace('/login.html');
  }
}

function openListingEditor(listing) {
  state.editingListingId = String(listing._id);
  const form = els.listingForm;
  form.elements.title.value = listing.title || '';
  form.elements.location.value = listing.location || '';
  form.elements.mapUrl.value = listing.mapUrl || listing.mapResolvedUrl || '';
  form.elements.dealType.value = listing.dealType || 'location';
  form.elements.propertyType.value = listing.propertyType || 'maison';
  form.elements.price.value = listing.price || 0;
  form.elements.area.value = listing.area || 0;
  form.elements.bedrooms.value = listing.bedrooms || 0;
  form.elements.description.value = listing.description || '';
  form.elements.hasElectricity.value = listing.hasElectricity ? 'true' : 'false';
  form.elements.waterSource.value = listing.waterSource || (listing.hasTapWater === false ? 'exterieur' : 'jirama');
  form.elements.showerLocation.value = listing.showerLocation || listing.showerWcLocation || 'interieur';
  form.elements.wcLocation.value = listing.wcLocation || listing.showerWcLocation || 'interieur';
  form.elements.isAvailable.value = listing.isAvailable === false ? 'false' : 'true';
  form.elements.hasMotorbikeAccess.checked = Boolean(listing.hasMotorbikeAccess);
  form.elements.hasCarAccess.checked = Boolean(listing.hasCarAccess);
  form.elements.image.value = '';
  form.elements.video.value = '';
  els.listingFormStatus.textContent = '';
  applyListingFormRules();
  els.listingModal.showModal();
}

function openListingDetail(listing) {
  if (!listing) return;
  const images = listingImages(listing);
  els.listingDetailMeta.textContent = `${listing.reference || 'Publication'} · ${statusLabel(listing.status)}`;
  els.listingDetailTitle.textContent = listing.title || 'Publication';
  els.listingDetailContent.innerHTML = `
    <div class="detail-grid">
      <div class="detail-gallery">
        ${images.length ? `<img class="detail-main-image" data-admin-main-image src="${escapeHtml(images[0])}" alt="">` : '<div class="empty">Aucune image.</div>'}
        ${images.length > 1 ? `<div class="detail-thumbs">${images.map((image, index) => `<button class="${index === 0 ? 'active' : ''}" type="button" data-admin-thumb="${escapeHtml(image)}"><img src="${escapeHtml(image)}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div class="detail-info">
        <div class="profile-grid">
          <div><span>Statut</span><strong>${statusLabel(listing.status)}</strong></div>
          <div><span>Type</span><strong>${propertyTypeLabel(listing.propertyType)}</strong></div>
          <div><span>Annonce</span><strong>${listing.dealType === 'vente' ? 'Vente' : 'Location'}</strong></div>
          <div><span>Prix</span><strong>${money(listing.price, listing.dealType)}</strong></div>
          <div><span>Quartier</span><strong>${escapeHtml(listing.location || '-')}</strong></div>
          <div><span>Arrondissement</span><strong>${escapeHtml(listing.arrondissement?.label || '-')}</strong></div>
          <div><span>Auteur</span><strong>${escapeHtml(listing.ownerName || 'MaisonMada')}</strong></div>
          <div><span>Créée le</span><strong>${formatDateTime(listing.createdAt)}</strong></div>
        </div>
        <section class="profile-section">
          <h3>Description</h3>
          <p>${escapeHtml(listing.description || 'Aucune description.')}</p>
        </section>
        <section class="profile-section">
          <h3>Informations pratiques</h3>
          <p>Chambres : ${Number(listing.bedrooms || 0)}</p>
          <p>Surface : ${Number(listing.area || 0)} m²</p>
          <p>Électricité : ${listing.hasElectricity ? 'Oui' : 'Non'}</p>
          ${listing.propertyType === 'local_commercial' ? '' : `
            <p>Eau : ${escapeHtml(listing.waterSource || '-')}</p>
            <p>Douche : ${escapeHtml(listing.showerLocation || '-')}</p>
            <p>WC : ${escapeHtml(listing.wcLocation || '-')}</p>
          `}
        </section>
        <section class="profile-section">
          <h3>Carte</h3>
          ${listingMapEmbedUrl(listing)
            ? `<iframe class="admin-map-frame" title="Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${escapeHtml(listingMapEmbedUrl(listing))}"></iframe>`
            : '<div class="empty">Aucune localisation Google Maps précise n’est enregistrée.</div>'
          }
        </section>
        <div class="detail-actions">
          <button class="action-btn primary" type="button" data-edit-listing="${listing._id}"><i data-lucide="pencil"></i> Modifier</button>
          ${listingMapUrl(listing) ? `<a class="action-link" href="${escapeHtml(listingMapUrl(listing))}" target="_blank" rel="noreferrer"><i data-lucide="map-pin"></i> Ouvrir Maps</a>` : ''}
        </div>
      </div>
    </div>
  `;
  els.listingDetailModal.showModal();
  icons();
}

function openUserProfile(user) {
  if (!user) return;
  const admin = user.role === 'admin';
  const verification = user.identityVerification || {};
  const documents = verification.documents || [];
  const listings = state.listings.filter((listing) => String(listing.ownerId) === String(user._id));
  els.userProfileMeta.textContent = `${user.reference || 'Compte'} · ${admin ? 'Admin' : 'Utilisateur'}`;
  els.userProfileTitle.textContent = user.name || user.email || 'Utilisateur';
  els.userProfileContent.innerHTML = `
    <div class="profile-grid">
      <div><span>Email</span><strong>${escapeHtml(user.email || '-')}</strong></div>
      <div><span>Téléphone</span><strong>${escapeHtml(user.phone || '-')}</strong></div>
      <div><span>Rôle</span><strong>${admin ? 'Admin' : 'User'}</strong></div>
      <div><span>Type de compte</span><strong>${user.accountType === 'agence' ? 'Agence' : 'Particulier'}</strong></div>
      <div><span>Statut identité</span><strong>${verificationStatusLabel(user)}</strong></div>
      <div><span>Créé le</span><strong>${formatDateTime(user.createdAt)}</strong></div>
      <div><span>Publications</span><strong>${listings.length}</strong></div>
    </div>
    <section class="profile-section">
      <h3>Vérification de compte</h3>
      <p>Nom envoyé : ${escapeHtml(verification.fullName || '-')}</p>
      <p>Type de document : ${escapeHtml(verification.documentType || '-')}</p>
      <p>Message : ${escapeHtml(verification.note || '-')}</p>
      <p>Envoyé le : ${formatDateTime(verification.submittedAt)}</p>
      <div class="document-list">
        ${documents.length ? documents.map((document) => `
          <a href="${escapeHtml(document.url)}" target="_blank" rel="noreferrer">
            <i data-lucide="paperclip"></i>
            <span>${escapeHtml(document.name || document.url)}</span>
          </a>
        `).join('') : '<span class="muted-line">Aucun document envoyé.</span>'}
      </div>
    </section>
    <section class="profile-section">
      <h3>Publications du compte</h3>
      <div class="profile-list">
        ${listings.length ? listings.map((listing) => `
          <button type="button" data-profile-listing="${listing._id}">
            <strong>${escapeHtml(listing.title)}</strong>
            <span>${statusLabel(listing.status)} · ${money(listing.price, listing.dealType)}</span>
          </button>
        `).join('') : '<div class="empty">Aucune publication.</div>'}
      </div>
    </section>
  `;
  els.userProfileModal.showModal();
  icons();
}

async function moderateListing(id, status) {
  let reason = '';
  if (status === 'rejected') {
    const result = await Swal.fire({
      title: 'Raison du refus',
      input: 'textarea',
      inputPlaceholder: 'Expliquez clairement ce qui doit être corrigé...',
      showCancelButton: true,
      confirmButtonText: 'Refuser',
      cancelButtonText: 'Annuler'
    });
    if (!result.isConfirmed) return;
    reason = result.value || '';
  }
  await api(`/api/admin/listings/${id}/moderation`, {
    method: 'PUT',
    headers: headers(true),
    body: JSON.stringify({ status, reason })
  });
  toast('Publication mise à jour');
  await loadAdminData();
}

async function handleListingAction(event) {
  const edit = event.target.closest('[data-edit-listing]');
  const featured = event.target.closest('[data-featured]');
  const approve = event.target.closest('[data-approve]');
  const reject = event.target.closest('[data-reject]');
  const remove = event.target.closest('[data-delete-listing]');
  const detailRow = event.target.closest('[data-view-listing]');
  if (!edit && !featured && !approve && !reject && !remove) {
    if (detailRow && !event.target.closest('button, a, input, select, textarea')) {
      const listing = state.listings.find((item) => String(item._id) === String(detailRow.dataset.viewListing));
      openListingDetail(listing);
    }
    return;
  }

  try {
    if (edit) {
      const listing = state.listings.find((item) => String(item._id) === edit.dataset.editListing);
      if (listing) openListingEditor(listing);
    } else if (featured) {
      await api(`/api/admin/listings/${featured.dataset.featured}/featured`, {
        method: 'PUT',
        headers: headers(true),
        body: JSON.stringify({ featured: featured.dataset.nextFeatured === 'true' })
      });
      toast('Mise à la une actualisée');
      await loadAdminData();
    } else if (approve) {
      await moderateListing(approve.dataset.approve, 'approved');
    } else if (reject) {
      await moderateListing(reject.dataset.reject, 'rejected');
    } else if (remove) {
      if (!confirm('Supprimer cette publication ?')) return;
      await api(`/api/admin/listings/${remove.dataset.deleteListing}`, { method: 'DELETE', headers: headers() });
      toast('Publication supprimée');
      await loadAdminData();
    }
  } catch (error) {
    toast(error.message);
  }
}

async function handleUserAction(event) {
  const message = event.target.closest('[data-message-user]');
  const activity = event.target.closest('[data-user-activity]');
  const account = event.target.closest('[data-account]');
  const verify = event.target.closest('[data-verify]');
  const remove = event.target.closest('[data-delete-user]');
  const profileRow = event.target.closest('[data-view-user]');
  if (!message && !activity && !account && !verify && !remove) {
    if (profileRow && !event.target.closest('button, a, input, select, textarea')) {
      const user = state.users.find((item) => String(item._id) === String(profileRow.dataset.viewUser));
      openUserProfile(user);
    }
    return;
  }

  try {
    if (message) {
      state.messageTarget = message.dataset.messageUser;
      els.messageTarget.textContent = `Message à ${message.dataset.userName || 'utilisateur'}`;
      els.messageForm.reset();
      els.messageModal.showModal();
    } else if (activity) {
      els.activityUser.textContent = activity.dataset.userName || 'Historique';
      els.activityList.innerHTML = '<div class="empty">Chargement...</div>';
      els.activityModal.showModal();
      const activities = await api(`/api/admin/users/${activity.dataset.userActivity}/activities?limit=80`, { headers: headers() });
      els.activityList.innerHTML = activities.length
        ? activities.map((item) => `
          <article class="activity-item">
            <span class="activity-icon"><i data-lucide="clock-3"></i></span>
            <div>
              <strong>${escapeHtml(activityLabel(item))}</strong>
              <small>${formatDateTime(item.createdAt)}</small>
            </div>
          </article>
        `).join('')
        : '<div class="empty">Aucune activité enregistrée.</div>';
      icons();
    } else if (account) {
      await api(`/api/admin/users/${account.dataset.account}`, {
        method: 'PUT',
        headers: headers(true),
        body: JSON.stringify({ accountType: account.dataset.accountType })
      });
      toast('Type de compte mis à jour');
      await loadAdminData();
    } else if (verify) {
      await api(`/api/admin/users/${verify.dataset.verify}`, {
        method: 'PUT',
        headers: headers(true),
        body: JSON.stringify({ identityVerified: verify.dataset.verified === 'true' })
      });
      toast('Vérification mise à jour');
      await loadAdminData();
    } else if (remove) {
      if (!confirm('Supprimer cet utilisateur ?')) return;
      await api(`/api/admin/users/${remove.dataset.deleteUser}`, { method: 'DELETE', headers: headers() });
      toast('Utilisateur supprimé');
      await loadAdminData();
    }
  } catch (error) {
    toast(error.message);
  }
}

els.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  window.location.replace('/login.html');
});

els.logoutButton.addEventListener('click', async () => {
  try {
    if (state.token) await api('/api/auth/logout', { method: 'POST', headers: headers() });
  } catch (_error) {
    // Ignore logout network errors and clear the local session.
  }
  localStorage.removeItem('maisonMadaToken');
  window.location.href = '/';
});

document.querySelectorAll('[data-admin-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    state.tab = button.dataset.adminTab;
    render();
  });
});

document.querySelectorAll('[data-admin-tab-jump]').forEach((button) => {
  button.addEventListener('click', () => {
    state.tab = button.dataset.adminTabJump;
    render();
  });
});

document.querySelectorAll('[data-listing-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    state.listingFilter = button.dataset.listingFilter;
    document.querySelectorAll('[data-listing-filter]').forEach((item) => item.classList.toggle('active', item === button));
    renderTables();
    icons();
  });
});

document.querySelectorAll('[data-user-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    state.userFilter = button.dataset.userFilter;
    document.querySelectorAll('[data-user-filter]').forEach((item) => item.classList.toggle('active', item === button));
    renderTables();
    icons();
  });
});

els.adminSearch.addEventListener('input', () => {
  state.search = els.adminSearch.value.trim();
  renderTables();
  icons();
});

els.themeToggle.addEventListener('click', () => {
  applyTheme(isDarkMode() ? 'light' : 'dark');
});

document.addEventListener('click', (event) => {
  const close = event.target.closest('[data-close-modal]');
  if (close) document.querySelector(`#${close.dataset.closeModal}`)?.close();

  const adminThumb = event.target.closest('[data-admin-thumb]');
  if (adminThumb) {
    const mainImage = adminThumb.closest('.detail-gallery')?.querySelector('[data-admin-main-image]');
    if (mainImage) mainImage.src = adminThumb.dataset.adminThumb;
    adminThumb.closest('.detail-thumbs')?.querySelectorAll('[data-admin-thumb]').forEach((button) => {
      button.classList.toggle('active', button === adminThumb);
    });
    return;
  }

  const detailEdit = event.target.closest('#listingDetailModal [data-edit-listing]');
  if (detailEdit) {
    const listing = state.listings.find((item) => String(item._id) === String(detailEdit.dataset.editListing));
    els.listingDetailModal.close();
    openListingEditor(listing);
    return;
  }

  const notificationListing = event.target.closest('[data-notification-listing]');
  if (notificationListing) {
    const listing = state.listings.find((item) => String(item._id) === String(notificationListing.dataset.notificationListing));
    openListingDetail(listing);
    return;
  }

  const notificationUser = event.target.closest('[data-notification-user]');
  if (notificationUser) {
    const user = state.users.find((item) => String(item._id) === String(notificationUser.dataset.notificationUser));
    openUserProfile(user);
    return;
  }

  const profileListing = event.target.closest('[data-profile-listing]');
  if (profileListing) {
    const listing = state.listings.find((item) => String(item._id) === String(profileListing.dataset.profileListing));
    els.userProfileModal.close();
    openListingDetail(listing);
    return;
  }
});

document.querySelectorAll('dialog.modal').forEach((modal) => {
  modal.addEventListener('pointerdown', (event) => {
    if (event.target === modal) modal.close();
  });
});

els.recentListingsTable.addEventListener('click', handleListingAction);
els.listingsTable.addEventListener('click', handleListingAction);
els.usersTable.addEventListener('click', handleUserAction);
els.listingForm.elements.dealType.addEventListener('change', applyListingFormRules);
els.listingForm.elements.propertyType.addEventListener('change', applyListingFormRules);

els.listingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.editingListingId) return;
  els.listingFormStatus.textContent = 'Enregistrement...';
  try {
    await api(`/api/admin/listings/${state.editingListingId}`, {
      method: 'PUT',
      headers: headers(),
      body: listingFormData()
    });
    els.listingModal.close();
    state.editingListingId = '';
    toast('Publication modifiée');
    await loadAdminData();
  } catch (error) {
    els.listingFormStatus.textContent = error.message;
  }
});

els.broadcastOpen.addEventListener('click', () => {
  state.messageTarget = 'all';
  els.messageTarget.textContent = 'Message à tous les utilisateurs';
  els.messageForm.reset();
  els.messageModal.showModal();
});

els.agentOpen.addEventListener('click', () => {
  els.agentForm.reset();
  els.agentFormStatus.textContent = '';
  els.agentModal.showModal();
});

els.agentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  els.agentFormStatus.textContent = 'Création...';
  try {
    await api('/api/admin/agents', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(Object.fromEntries(new FormData(els.agentForm)))
    });
    els.agentModal.close();
    toast('Compte agent créé');
    await loadAdminData();
  } catch (error) {
    els.agentFormStatus.textContent = error.message;
  }
});

els.adminMessageOpen.addEventListener('click', (event) => {
  event.stopPropagation();
  const nextOpen = els.adminMessagePanel.hidden;
  closeAdminPopovers();
  els.adminMessagePanel.hidden = !nextOpen;
  els.adminMessageOpen.setAttribute('aria-expanded', String(nextOpen));
  if (nextOpen) {
    els.supportConversationList.innerHTML = '<div class="empty">Chargement...</div>';
    loadSupportConversations().catch((error) => toast(error.message));
  }
});

els.adminMessageClose.addEventListener('click', closeAdminPopovers);

els.adminNotificationsOpen.addEventListener('click', (event) => {
  event.stopPropagation();
  const nextOpen = els.adminNotificationsPanel.hidden;
  closeAdminPopovers();
  els.adminNotificationsPanel.hidden = !nextOpen;
  els.adminNotificationsOpen.setAttribute('aria-expanded', String(nextOpen));
});

els.adminNotificationsClose.addEventListener('click', closeAdminPopovers);

els.supportConversationList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-support-conversation]');
  if (!button) return;
  const conversation = state.supportConversations.find((item) => String(item._id) === String(button.dataset.supportConversation));
  if (conversation) openSupportConversation(conversation).catch((error) => toast(error.message));
});

els.messageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = els.messageForm.elements.message.value.trim();
  if (!message) return;
  els.messageFormStatus.textContent = 'Envoi...';
  try {
    const path = state.messageTarget === 'all'
      ? '/api/admin/notifications/broadcast'
      : `/api/admin/users/${state.messageTarget}/notifications`;
    const result = await api(path, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ message })
    });
    els.messageModal.close();
    toast(state.messageTarget === 'all' ? `Message envoyé à ${result.count || 0} utilisateurs` : 'Message envoyé');
  } catch (error) {
    els.messageFormStatus.textContent = error.message;
  }
});

els.supportReplyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = els.supportReplyForm.elements.message.value.trim();
  if (!body || !state.activeSupportConversationId) return;
  connectSupportSocket();
  state.socket?.emit('chat:message', { conversationId: state.activeSupportConversationId, body }, (response) => {
    if (!response?.ok) {
      toast(response?.message || 'Message non envoyé');
      return;
    }
    els.supportReplyForm.reset();
    if (response.message && !state.supportMessages.some((item) => String(item._id) === String(response.message._id))) {
      state.supportMessages.push(response.message);
      renderSupportMessages();
    }
    loadSupportConversations().catch(() => {});
  });
});

els.supportReplyForm.elements.message.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    els.supportReplyForm.requestSubmit();
  }
});

document.addEventListener('pointerdown', (event) => {
  if (event.target.closest('.admin-popover-wrap')) return;
  closeAdminPopovers();
});

applyTheme(state.theme);
hydrate();
