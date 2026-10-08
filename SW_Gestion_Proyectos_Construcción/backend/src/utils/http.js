class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const isBlank = (value) => value === undefined || value === null || value === '';

function str(value, field, { required = false, max = 255 } = {}) {
  if (isBlank(value)) {
    if (required) throw new HttpError(400, `${field} es obligatorio`);
    return null;
  }
  if (typeof value !== 'string') throw new HttpError(400, `${field} debe ser texto`);
  const text = value.trim();
  if (!text) {
    if (required) throw new HttpError(400, `${field} es obligatorio`);
    return null;
  }
  if (text.length > max) throw new HttpError(400, `${field} no puede superar ${max} caracteres`);
  return text;
}

function num(value, field, { required = true, min, positive = false } = {}) {
  if (isBlank(value)) {
    if (required) throw new HttpError(400, `${field} es obligatorio`);
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw new HttpError(400, `${field} debe ser un número`);
  if (positive && n <= 0) throw new HttpError(400, `${field} debe ser mayor que 0`);
  if (min !== undefined && n < min) throw new HttpError(400, `${field} debe ser mayor o igual a ${min}`);
  return n;
}

function int(value, field, options) {
  const n = num(value, field, options);
  if (n !== null && !Number.isInteger(n)) throw new HttpError(400, `${field} debe ser un número entero`);
  return n;
}

function oneOf(value, field, allowed, { required = true } = {}) {
  if (isBlank(value)) {
    if (required) throw new HttpError(400, `${field} es obligatorio`);
    return undefined;
  }
  if (!allowed.includes(value)) {
    throw new HttpError(400, `${field} inválido. Valores permitidos: ${allowed.join(', ')}`);
  }
  return value;
}

function bool(value, field) {
  if (isBlank(value)) return false;
  if (typeof value !== 'boolean') throw new HttpError(400, `${field} debe ser verdadero o falso`);
  return value;
}

module.exports = { HttpError, asyncHandler, str, num, int, oneOf, bool };
