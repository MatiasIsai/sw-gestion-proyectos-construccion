import { apiRequest } from '../api/client.js';
import { esc, options, friendlyError } from '../ui.js';
import { PROJECT_TYPE, PROJECT_STATUS, UNIT_TYPE } from '../labels.js';

function setValues(form, values) {
  Object.entries(values).forEach(([name, value]) => {
    const input = form.elements[name];
    if (!input || value === null || value === undefined) return;
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = value;
  });
}

function detailValues(project) {
  const h = project.houseDetail;
  const b = project.buildingDetail;
  const l = project.lotDetail;
  return {
    ...(h && { casa_floors: h.floors, casa_bedrooms: h.bedrooms, casa_bathrooms: h.bathrooms, casa_builtArea: h.builtArea }),
    ...(b && {
      edif_floors: b.floors,
      edif_apartments: b.apartments,
      edif_commercialUnits: b.commercialUnits,
      edif_commonArea: b.commonArea,
      edif_builtArea: b.builtArea,
    }),
    ...(l && {
      lote_water: l.hasWater,
      lote_sewage: l.hasSewage,
      lote_electricity: l.hasElectricity,
      lote_other: l.otherServices,
    }),
  };
}

function buildBody(form) {
  const f = Object.fromEntries(new FormData(form));
  const checked = (name) => form.elements[name].checked;

  const detailByType = {
    CASA: { floors: f.casa_floors, bedrooms: f.casa_bedrooms, bathrooms: f.casa_bathrooms, builtArea: f.casa_builtArea },
    EDIFICIO: {
      floors: f.edif_floors,
      apartments: f.edif_apartments,
      commercialUnits: f.edif_commercialUnits,
      commonArea: f.edif_commonArea,
      builtArea: f.edif_builtArea,
    },
    LOTE: {
      hasWater: checked('lote_water'),
      hasSewage: checked('lote_sewage'),
      hasElectricity: checked('lote_electricity'),
      otherServices: f.lote_other,
    },
  };

  const projectedUnits = Object.keys(UNIT_TYPE)
    .filter((key) => f[`unit_${key}`] !== '' && f[`unit_${key}`] !== undefined)
    .map((key) => ({ unitType: key, quantity: f[`unit_${key}`] }));

  return {
    name: f.name,
    location: f.location,
    description: f.description,
    type: f.type,
    status: f.status,
    lotArea: f.lotArea,
    managerId: f.managerId,
    detail: detailByType[f.type],
    projectedUnits,
  };
}

export async function renderProjectForm(app, ctx) {
  const { id } = ctx.params;
  const [users, project] = await Promise.all([
    apiRequest('/users'),
    id ? apiRequest(`/projects/${id}`) : null,
  ]);
  if (ctx.isStale()) return;

  const managerOptions = users
    .filter((u) => u.isActive)
    .map((u) => `<option value="${esc(u.id)}">${esc(u.fullName)}</option>`)
    .join('');

  const unitInputs = Object.entries(UNIT_TYPE)
    .map(([key, label]) => `<label>${esc(label)}<input name="unit_${key}" type="number" min="0" step="1" /></label>`)
    .join('');

  app.innerHTML = `
    <form id="project-form" class="card wide">
      <h2>${id ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>

      <div class="grid">
        <label>Nombre del proyecto<input name="name" required maxlength="255" /></label>
        <label>Ubicación<input name="location" required maxlength="255" /></label>
        <label>Tipo de inmueble<select name="type">${options(PROJECT_TYPE, 'CASA')}</select></label>
        <label>Estado del proyecto<select name="status">${options(PROJECT_STATUS, 'PLANIFICACION')}</select></label>
        <label>Área del lote (m²)<input name="lotArea" type="number" min="0.01" step="0.01" required /></label>
        <label>Responsable<select name="managerId">${managerOptions}</select></label>
      </div>

      <label>Descripción general<textarea name="description" rows="3" maxlength="2000"></textarea></label>

      <fieldset data-type="CASA">
        <legend>Características de la casa</legend>
        <div class="grid">
          <label>Número de pisos<input name="casa_floors" type="number" min="1" step="1" required /></label>
          <label>Habitaciones<input name="casa_bedrooms" type="number" min="0" step="1" required /></label>
          <label>Baños<input name="casa_bathrooms" type="number" min="0" step="1" required /></label>
          <label>Área construida (m²)<input name="casa_builtArea" type="number" min="0.01" step="0.01" required /></label>
        </div>
      </fieldset>

      <fieldset data-type="EDIFICIO">
        <legend>Características del edificio</legend>
        <div class="grid">
          <label>Número de pisos<input name="edif_floors" type="number" min="1" step="1" required /></label>
          <label>Apartamentos<input name="edif_apartments" type="number" min="0" step="1" required /></label>
          <label>Locales comerciales<input name="edif_commercialUnits" type="number" min="0" step="1" required /></label>
          <label>Áreas comunes (m²)<input name="edif_commonArea" type="number" min="0" step="0.01" required /></label>
          <label>Área construida (m²)<input name="edif_builtArea" type="number" min="0.01" step="0.01" required /></label>
        </div>
      </fieldset>

      <fieldset data-type="LOTE">
        <legend>Servicios públicos del lote</legend>
        <div class="checks">
          <label><input name="lote_water" type="checkbox" /> Agua potable</label>
          <label><input name="lote_sewage" type="checkbox" /> Alcantarillado</label>
          <label><input name="lote_electricity" type="checkbox" /> Energía eléctrica</label>
        </div>
        <label>Otros servicios<input name="lote_other" maxlength="255" /></label>
      </fieldset>

      <fieldset>
        <legend>Unidades proyectadas por tipo (opcional)</legend>
        <div class="grid">${unitInputs}</div>
      </fieldset>

      <p id="form-error" class="error" hidden></p>
      <div class="actions">
        <button type="submit">${id ? 'Guardar cambios' : 'Crear proyecto'}</button>
        <a class="btn secondary" href="#/projects${id ? `/${esc(id)}` : ''}">Cancelar</a>
      </div>
    </form>
  `;

  const form = app.querySelector('#project-form');
  const errorBox = app.querySelector('#form-error');

  const syncType = () => {
    form.querySelectorAll('fieldset[data-type]').forEach((fieldset) => {
      const active = fieldset.dataset.type === form.elements.type.value;
      fieldset.hidden = !active;
      fieldset.disabled = !active;
    });
  };
  form.elements.type.addEventListener('change', syncType);

  if (project) {
    setValues(form, {
      name: project.name,
      location: project.location,
      description: project.description,
      type: project.type,
      status: project.status,
      lotArea: project.lotArea,
      managerId: project.managerId,
      ...detailValues(project),
      ...Object.fromEntries(project.projectedUnits.map((u) => [`unit_${u.unitType}`, u.quantity])),
    });
  } else {
    form.elements.managerId.value = ctx.user.id;
  }
  syncType();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;

    try {
      const saved = await apiRequest(id ? `/projects/${id}` : '/projects', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(buildBody(form)),
      });
      location.hash = `#/projects/${saved.id}`;
    } catch (error) {
      errorBox.textContent = friendlyError(error);
      errorBox.hidden = false;
      button.disabled = false;
    }
  });
}
