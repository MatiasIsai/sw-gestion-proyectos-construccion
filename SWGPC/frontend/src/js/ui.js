export function esc(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

export function money(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function number(value, decimals = 2) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: decimals }).format(Number(value) || 0);
}

export function options(map, selected) {
  return Object.entries(map)
    .map(([key, label]) => `<option value="${key}"${key === selected ? ' selected' : ''}>${esc(label)}</option>`)
    .join('');
}

export function friendlyError(error) {
  return error.message === 'Failed to fetch' ? 'No fue posible conectar con la API.' : error.message;
}
