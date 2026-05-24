const state = {
  mode: 'login',
  token: localStorage.getItem('maisonMadaToken') || ''
};

const els = {
  panel: document.querySelector('.login-panel'),
  form: document.querySelector('#authForm'),
  eyebrow: document.querySelector('#authEyebrow'),
  heading: document.querySelector('#authHeading'),
  themeToggle: document.querySelector('#themeToggle'),
  submit: document.querySelector('#authSubmit'),
  status: document.querySelector('#authStatus')
};

function icons() {
  if (window.lucide) window.lucide.createIcons();
}

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.classList.toggle('dark-mode', dark);
  document.body.classList.toggle('dark-mode', dark);
  localStorage.setItem('maisonMadaTheme', dark ? 'dark' : 'light');
  els.themeToggle.innerHTML = `<i data-lucide="${dark ? 'sun' : 'moon'}"></i>`;
  icons();
}

function redirectFor(user) {
  if (user.role === 'admin') {
    window.location.replace('/admin.html');
    return;
  }
  if (user.role === 'agent') {
    window.location.replace('/agent.html');
    return;
  }
  window.location.replace('/');
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Erreur serveur');
  }
  return response.json();
}

function setMode(mode) {
  state.mode = mode === 'register' ? 'register' : 'login';
  const register = state.mode === 'register';
  els.panel.classList.toggle('is-register', register);
  els.eyebrow.textContent = register ? 'Création de compte' : 'Connexion';
  els.heading.textContent = register ? 'Créer un compte' : 'Connectez-vous';
  document.querySelector('.register-copy').hidden = !register;
  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.mode);
  });
  document.querySelectorAll('[data-switch-mode]').forEach((button) => {
    button.hidden = button.dataset.switchMode === state.mode;
  });
  document.querySelectorAll('.register-only').forEach((field) => {
    field.hidden = !register;
    field.querySelectorAll('input, select').forEach((input) => {
      input.disabled = !register;
      input.required = register && input.name === 'name';
    });
  });
  els.submit.textContent = register ? 'Créer mon compte' : 'Se connecter';
  els.status.textContent = '';
}

async function hydrate() {
  if (!state.token) return;
  try {
    const user = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    redirectFor(user);
  } catch (_error) {
    localStorage.removeItem('maisonMadaToken');
    state.token = '';
  }
}

document.querySelectorAll('[data-mode]').forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

document.querySelectorAll('[data-switch-mode]').forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.switchMode));
});

els.themeToggle.addEventListener('click', () => {
  const dark = document.documentElement.classList.contains('dark-mode');
  applyTheme(dark ? 'light' : 'dark');
});

els.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  els.status.textContent = state.mode === 'register' ? 'Création...' : 'Connexion...';
  try {
    const payload = Object.fromEntries(new FormData(els.form).entries());
    const session = await api(`/api/auth/${state.mode === 'register' ? 'register' : 'login'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    localStorage.setItem('maisonMadaToken', session.token);
    redirectFor(session.user);
  } catch (error) {
    els.status.textContent = error.message;
  }
});

setMode('login');
applyTheme(localStorage.getItem('maisonMadaTheme') || 'light');
hydrate();
