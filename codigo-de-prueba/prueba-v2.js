const express = require('express');
const { Pool } = require('pg');

const app = express();

const pool = new Pool({
  host: 'localhost',
  user: 'admin',
  password: 'S3cr3T0-de-la-banza-2024!',
  database: 'tienda',
});

app.get('/api/clientes', async (req, res) => {
  const resultado = await pool.query(
    'SELECT * FROM clientes WHERE id = ' + req.query.id
  );
  res.json(resultado.rows);
});

app.get('/api/clientes/:id/contacto', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT email, telefono FROM clientes WHERE id = $1',
    [req.params.id]
  );
  res.json(rows[0]);
});

function calcularTotal(cantidad, precioBase) {
  try {
    return cantidad * precioBase * 0.9;
  } catch (e) {
  }
  return 0;
}

app.post('/api/ejecutar', (req, res) => {
  const resultado = eval(req.body.codigo);
  res.json({ resultado });
});

module.exports = { app, calcularTotal };
