import { apiRequest } from '../api/client.js';
import { esc, number } from '../ui.js';
import { PROJECT_TYPE, PROJECT_STATUS } from '../labels.js';

export async function renderProjects(app, ctx) {
  const projects = await apiRequest('/projects');
  if (ctx.isStale()) return;

  const canEdit = ctx.user.role === 'ADMINISTRADOR';

  const rows = projects
    .map(
      (p) => `
      <tr>
        <td><a href="#/projects/${esc(p.id)}">${esc(p.name)}</a></td>
        <td>${esc(PROJECT_TYPE[p.type])}</td>
        <td><span class="badge">${esc(PROJECT_STATUS[p.status])}</span></td>
        <td>${esc(p.location)}</td>
        <td class="num">${number(p.lotArea)} m²</td>
        <td>${esc(p.manager.fullName)}</td>
        <td class="num">${p._count.properties}</td>
      </tr>`
    )
    .join('');

  app.innerHTML = `
    <div class="page-head">
      <h2>Proyectos</h2>
      ${canEdit ? '<a class="btn" href="#/projects/new">Nuevo proyecto</a>' : ''}
    </div>
    ${
      projects.length
        ? `<div class="table-wrap"><table>
            <thead><tr><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Ubicación</th><th>Área del lote</th><th>Responsable</th><th>Propiedades</th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>`
        : '<p>Aún no hay proyectos registrados.</p>'
    }
  `;
}
