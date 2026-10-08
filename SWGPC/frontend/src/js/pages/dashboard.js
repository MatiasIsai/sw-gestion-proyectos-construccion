import { esc } from '../ui.js';
import { ROLE } from '../labels.js';

export function renderDashboard(app, { user }) {
  app.innerHTML = `
    <section class="card">
      <h2>Bienvenido, ${esc(user.fullName)}</h2>
      <p>Rol: ${esc(ROLE[user.role] || user.role)}</p>
      <p><a class="btn" href="#/projects">Ver proyectos</a></p>
    </section>
  `;
}
