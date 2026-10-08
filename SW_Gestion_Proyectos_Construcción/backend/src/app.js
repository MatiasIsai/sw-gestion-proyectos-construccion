const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { HttpError } = require('./utils/http');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1', apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Recurso no encontrado' });
});

app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la solicitud no es un JSON válido' });
  }
  if (err.code === 'P2002') {
    const fields = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'campo único';
    return res.status(409).json({ message: `Ya existe un registro con el mismo valor en: ${fields}` });
  }
  if (err.code === 'P2003') {
    return res.status(409).json({ message: 'La referencia no existe o el registro está en uso' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Registro no encontrado' });
  }

  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;
