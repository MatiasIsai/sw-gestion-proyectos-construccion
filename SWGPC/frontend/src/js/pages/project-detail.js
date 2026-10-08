import { apiRequest } from '../api/client.js';
import { esc, money, number, options, friendlyError } from '../ui.js';
import { PROJECT_TYPE, PROJECT_STATUS, UNIT_TYPE, PROPERTY_STATUS } from '../labels.js';

function typeDetails(project) {
  const h = project.houseDetail;
  const b = project.buildingDetail;
  const l = project.lotDetail;
  const yes = (v) => (v ? 'Sí' : 'No');

  if (h) {
    return [['Pisos', h.floors], ['Habitaciones', h.bedrooms], ['Baños', h.bathrooms], ['Área construida', `${number(h.builtArea)} m²`]];
  }
  if (b) {
    return [
      ['Pisos', b.floors],
      ['Apartamentos', b.apartments],
      ['Locales comerciales', b.commercialUnits],
      ['Áreas comunes', `${number(b.commonArea)} m²`],
      ['Área construida', `${number(b.builtArea)} m²`],
    ];
  }
  if (l) {
    return [
      ['Agua potable', yes(l.hasWater)],
      ['Alcantarillado', yes(l.hasSewage)],
      ['Energía eléctrica', yes(l.hasElectricity)],
      ['Otros servicios', l.otherServices || '—'],
    ];
  }
  return [];
}

function indicatorCard(label, value) {
  return `<div class="indicator"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function unitsTable(project) {
  const registered = {};
  project.properties.forEach((p) => {
    registered[p.type] = (registered[p.type] || 0) + 1;
  });
  const projected = Object.fromEntries(project.projectedUnits.map((u) => [u.unitType, u.quantity]));

  const types = Object.keys(UNIT_TYPE).filter((t) => projected[t] !== undefined || registered[t]);
  if (!types.length) return '<p class="muted">No hay unidades proyectadas ni registradas.</p>';

  return `<div class="table-wrap"><table>
    <thead><tr><th>Tipo de unidad</th><th>Proyectadas</th><th>Registradas</th></tr></thead>
    <tbody>${types
      .map((t) => `<tr><td>${esc(UNIT_TYPE[t])}</td><td class="num">${projected[t] ?? '—'}</td><td class="num">${registered[t] || 0}</td></tr>`)
      .join('')}</tbody></table></div>`;
}

export async function renderProjectDetail(app, ctx) {
  const id = ctx.params.id;
  const [project, ind] = await Promise.all([
    apiRequest(`/projects/${id}`),
    apiRequest(`/projects/${id}/indicators`),
  ]);
  if (ctx.isStale()) return;

  const canEdit = ctx.user.role === 'ADMINISTRADOR';
  const byId = Object.fromEntries(project.properties.map((p) => [p.id, p]));

  const propertyRows = project.properties
    .map((p) => {
      const editable = canEdit && p.status === 'DISPONIBLE';
      return `<tr>
        <td>${esc(p.code)}</td>
        <td>${esc(UNIT_TYPE[p.type])}</td>
        <td class="num">${number(p.area)} m²</td>
        <td class="num">${money(p.price)}</td>
        <td><span class="badge status-${esc(p.status)}">${esc(PROPERTY_STATUS[p.status])}</span></td>
        <td>${esc(p.features || '')}</td>
        ${canEdit ? `<td class="row-actions">${
          editable
            ? `<button type="button" class="link" data-action="edit" data-id="${esc(p.id)}">Editar</button>
               <button type="button" class="link danger" data-action="delete" data-id="${esc(p.id)}">Eliminar</button>`
            : ''
        }</td>` : ''}
      </tr>`;
    })
    .join('');

  const propertyForm = canEdit
    ? `<form id="property-form" class="subform">
        <h4 id="property-form-title">Agregar propiedad</h4>
        <div class="grid">
          <label>Código<input name="code" required maxlength="50" /></label>
          <label>Tipo<select name="type">${options(UNIT_TYPE, 'APARTAMENTO')}</select></label>
          <label>Área (m²)<input name="area" type="number" min="0.01" step="0.01" required /></label>
          <label>Precio de venta<input name="price" type="number" min="0" step="1" required /></label>
        </div>
        <label>Características<input name="features" maxlength="2000" /></label>
        <p id="property-error" class="error" hidden></p>
        <div class="actions">
          <button type="submit">Guardar propiedad</button>
          <button type="button" id="property-cancel" class="secondary" hidden>Cancelar edición</button>
        </div>
      </form>`
    : '';

  app.innerHTML = `
    <div class="page-head">
      <h2>${esc(project.name)}</h2>
      <div class="actions">
        <a class="btn secondary" href="#/projects">Volver</a>
        ${canEdit ? `<a class="btn" href="#/projects/${esc(project.id)}/edit">Editar proyecto</a>` : ''}
      </div>
    </div>

    <section class="card wide">
      <div class="facts">
        <div><span>Tipo</span><strong>${esc(PROJECT_TYPE[project.type])}</strong></div>
        <div><span>Estado</span><strong>${esc(PROJECT_STATUS[project.status])}</strong></div>
        <div><span>Ubicación</span><strong>${esc(project.location)}</strong></div>
        <div><span>Área del lote</span><strong>${number(project.lotArea)} m²</strong></div>
        <div><span>Responsable</span><strong>${esc(project.manager.fullName)}</strong></div>
        ${typeDetails(project).map(([k, v]) => `<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}
      </div>
      ${project.description ? `<p>${esc(project.description)}</p>` : ''}
    </section>

    <section class="card wide">
      <h3>Indicadores</h3>
      <div class="indicators">
        ${indicatorCard('Área vendible', `${number(ind.sellableArea)} m²`)}
        ${indicatorCard('Áreas comunes', `${number(ind.commonAreaPercent)} %`)}
        ${indicatorCard('Ventas proyectadas', money(ind.projectedSales))}
        ${indicatorCard('Inversión estimada', money(ind.totalInvestment))}
        ${indicatorCard('Utilidad estimada', money(ind.estimatedProfit))}
        ${indicatorCard('Margen estimado', `${number(ind.profitMarginPercent)} %`)}
        ${Object.entries(ind.propertiesByStatus).map(([s, n]) => indicatorCard(PROPERTY_STATUS[s], n)).join('')}
      </div>
    </section>

    <section class="card wide">
      <h3>Unidades por tipo</h3>
      ${unitsTable(project)}
    </section>

    <section class="card wide">
      <h3>Propiedades</h3>
      ${
        project.properties.length
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Código</th><th>Tipo</th><th>Área</th><th>Precio</th><th>Estado</th><th>Características</th>${canEdit ? '<th></th>' : ''}</tr></thead>
              <tbody id="properties-body">${propertyRows}</tbody>
            </table></div>`
          : '<p class="muted">Aún no hay propiedades registradas.</p>'
      }
      ${propertyForm}
    </section>
  `;

  if (!canEdit) return;

  const form = app.querySelector('#property-form');
  const title = app.querySelector('#property-form-title');
  const errorBox = app.querySelector('#property-error');
  const cancel = app.querySelector('#property-cancel');
  let editingId = null;

  const resetForm = () => {
    editingId = null;
    form.reset();
    title.textContent = 'Agregar propiedad';
    cancel.hidden = true;
    errorBox.hidden = true;
  };
  cancel.addEventListener('click', resetForm);

  app.querySelector('#properties-body')?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const property = byId[button.dataset.id];

    if (button.dataset.action === 'edit') {
      editingId = property.id;
      form.elements.code.value = property.code;
      form.elements.type.value = property.type;
      form.elements.area.value = property.area;
      form.elements.price.value = property.price;
      form.elements.features.value = property.features || '';
      title.textContent = `Editar propiedad ${property.code}`;
      cancel.hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!confirm(`¿Eliminar la propiedad ${property.code}?`)) return;
    try {
      await apiRequest(`/properties/${property.id}`, { method: 'DELETE' });
      await renderProjectDetail(app, ctx);
    } catch (error) {
      alert(friendlyError(error));
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;

    try {
      const body = { ...Object.fromEntries(new FormData(form)), projectId: project.id };
      await apiRequest(editingId ? `/properties/${editingId}` : '/properties', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      await renderProjectDetail(app, ctx);
    } catch (error) {
      errorBox.textContent = friendlyError(error);
      errorBox.hidden = false;
      submit.disabled = false;
    }
  });
}
