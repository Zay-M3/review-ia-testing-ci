// =============================================================================
//  ARCHIVO DE PRUEBA - ESTE CODIGO ESTA BIEN HECHO
// =============================================================================
//
//  PARA UN NINO:
//
//  Este archivo es el "control" del experimento. Esta TODO bien escrito.
//
//  Sirve para hacer la prueba al reves: si abris una Pull Request con este
//  archivo, la IA deberia decir "VEREDICTO: APTO" y GitHub te deberia dejar
//  mergear.
//
//  Si la IA se equivoca y dice "NO APTO" con este archivo, tambien tenes un
//  dato importante: la IA es demasiado estricta y te va a molestar en cada
//  PR. Eso se llama "falso positivo" y hay que ajustarlo.
// =============================================================================

const express = require('express');
const app = express();
const { Pool } = require('pg');

/** Porcentaje de descuento que se aplica a todos los pedidos. */
const PORCENTAJE_DESCUENTO = 0.9;

/**
 * Crea el pool de conexiones a la base de datos.
 *
 * La contrasena NO esta escrita aca: sale de una variable de entorno, que es
 * un lugar secreto guardado afuera del codigo. Asi, aunque alguien lea el
 * archivo, no se entera de la contrasena.
 *
 * @returns {Pool} El pool de conexiones listo para usar.
 */
function crearConexion() {
  return new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

/**
 * Devuelve todos los clientes.
 *
 * La consulta usa un placeholder ($1) en vez de pegar el valor directo.
 * Asi es imposible que alguien se cuele código dentro de la consulta.
 *
 * @param {import('express').Request} req  La petición HTTP.
 * @param {import('express').Response} res La respuesta HTTP.
 * @returns {Promise<void>}
 */
app.get('/api/clientes', async (req, res) => {
  try {
    const db = crearConexion();
    const resultado = await db.query(
      'SELECT * FROM clientes WHERE id = $1',
      [req.query.id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al listar clientes:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

/**
 * Calcula el precio final de un pedido.
 *
 * @param {number} cantidad    - Cuantos productos pidio el cliente.
 * @param {number} precioBase  - El precio de un solo producto.
 * @returns {number} El total a pagar, ya con el descuento aplicado.
 */
function calcularTotal(cantidad, precioBase) {
  return cantidad * precioBase * PORCENTAJE_DESCUENTO;
}

module.exports = { app, calcularTotal };