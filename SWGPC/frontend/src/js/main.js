import { getToken, getUser, logout } from './api/client.js';
import { esc, friendlyError } from './ui.js';
import { ROLE } from './labels.js';
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderProjects } from './pages/projects.js';
import { renderProjectForm } from './pages/project-form.js';
import { renderProjectDetail } from './pages/project-detail.js';

const app = document.getElementById('app');
const nav = document.getElementById('nav');

let currentUser = null;
let renderId = 0;

const routes = [
  { re: /^#\/projects\/new$/, adminOnly: true, render: renderProjectForm },
  { re: /^#\/projects\/([^/]+)\/edit$/, adminOnly: true, render: renderProjectForm },
  { re: /^#\/projects\/([^/]+)$/, render: renderProjectDetail },
  { re: /^#\/projects$/, render: renderProjects },
  { re: /^#?\/?$/, render: renderDashboard },
];

async function route() {
  const id = ++renderId;

  for (const r of routes) {
    const match = location.hash.match(r.re);
    if (!match) continue;

    if (r.adminOnly && currentUser.role !== 'ADMINISTRADOR') {
      app.innerHTML = '<div class="card"><p class="error">No tiene permisos para ver esta página.</p></div>';
      return;
    }

    const ctx = { user: currentUser, params: { id: match[1] }, isStale: () => id !== renderId };
    app.innerHTML = '<p>Cargando...</p>';
    try {
      await r.render(app, ctx);
    } catch (error) {
      if (!ctx.isStale()) {
        app.innerHTML = `<div class="card"><p class="error">${esc(friendlyError(error))}</p></div>`;
      }
    }
    return;
  }

  app.innerHTML = '<div class="card"><p>Página no encontrada.</p></div>';
}

function renderNav() {
  nav.innerHTML = `
    <a href="#/">Inicio</a>
    <a href="#/projects">Proyectos</a>
    <span class="user">${esc(currentUser.fullName)} · ${esc(ROLE[currentUser.role] || currentUser.role)}</span>
    <button id="logout-btn" type="button" class="secondary">Cerrar sesión</button>
  `;
  nav.querySelector('#logout-btn').addEventListener('click', doLogout);
}

function startApp(user) {
  currentUser = user;
  renderNav();
  route();
}

function doLogout() {
  logout();
  currentUser = null;
  nav.innerHTML = '';
  location.hash = '';
  renderLogin(app, startApp);
}

window.addEventListener('hashchange', () => {
  if (currentUser) route();
});

const savedUser = getUser();
if (getToken() && savedUser) {
  startApp(savedUser);
} else {
  renderLogin(app, startApp);
}
