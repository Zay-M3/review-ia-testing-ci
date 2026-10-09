// =============================================================================
//  API de clientes — versión corregida según las reglas de REVIEW.md
// =============================================================================

const express = require('express');
const { Pool } = require('pg');

const app = express();

/** Descuento aplicado al total: 0.9 significa "10% de descuento". */
const PORCENTAJE_DESCUENTO = 0.9;

// La contraseña NUNCA va escrita acá. Tiene que venir del entorno del
// servidor (variable de entorno o gestor de secretos del hosting).
const CONTRASENA_BASE_DATOS = process.env.DB_PASSWORD;

if (!CONTRASENA_BASE_DATOS) {
  throw new Error(
    'Falta la variable de entorno DB_PASSWORD: la base de datos no se puede abrir sin ella.'
  );
}

/**
 * Crea el pool de conexiones a la base de datos de clientes.
 *
 * @param {string} [password] Contraseña de la base. Si no se pasa, usa
 *   la variable de entorno DB_PASSWORD.
 * @returns {import('pg').Pool} Pool listo para hacer consultas.
 */
function crearPool(password = CONTRASENA_BASE_DATOS) {
  return new Pool({ host: 'localhost', user: 'admin', password });
}

/**
 * Calcula el total a cobrar aplicando el descuento del proyecto.
 *
 * @param {number} cantidad Cantidad de unidades compradas.
 * @param {number} precioBase Precio de una unidad, sin descuento.
 * @returns {number} Total con el descuento ya aplicado.
 * @throws {TypeError} Si alguno de los dos valores no es un número válido.
 */
function calcularTotal(cantidad, precioBase) {
  if (typeof cantidad !== 'number' || typeof precioBase !== 'number') {
    throw new TypeError('calcularTotal necesita dos números.');
  }

  try {
    return cantidad * precioBase * PORCENTAJE_DESCUENTO;
  } catch (error) {
    // El catch vacío se tragaba los errores sin avisar nada. Ahora se
    // reporta y se vuelve a lanzar para que el llamador lo vea.
    console.error('Error al calcular el total:', error);
    throw error;
  }
}

/**
 * Verifica que quien pide los datos privados sea el dueño del cliente o un
 * administrador. Sin esto, cualquiera con el id correcto ve los datos de
 * otro cliente.
 *
 * @param {object} peticion Petición de Express (debe traer req.sesion).
 * @param {number} idCliente Dueño de los datos que se quieren leer.
 * @returns {boolean} true si la petición está autorizada.
 */
function tieneAccesoACliente(peticion, idCliente) {
  const sesion = peticion.sesion || {};

  if (sesion.rol === 'admin') {
    return true;
  }

  return Number(sesion.idCliente) === Number(idCliente);
}

/** Lista los clientes, opcionalmente filtrados por id. */
app.get('/api/clientes', async (req, res) => {
  const pool = crearPool();

  try {
    // Consulta CON PARÁMETROS: el id nunca se pega dentro del texto SQL,
    // así no hay forma de inyectar código por la URL.
    const filasClientes = await pool.query(
      'SELECT * FROM clientes WHERE id = $1',
      [req.query.id]
    );

    res.json(filasClientes.rows);
  } catch (error) {
    console.error('Error al listar clientes:', error);
    res.status(500).json({ error: 'No se pudieron obtener los clientes.' });
  }
});

/** Devuelve los datos privados de un cliente (email y teléfono). */
app.get('/api/clientes/:id/privado', async (req, res) => {
  const idCliente = req.params.id;

  // Autorización: sin esto la ruta filtra datos de cualquier cliente.
  if (!tieneAccesoACliente(req, idCliente)) {
    return res.status(403).json({ error: 'No tenés permiso para ver estos datos.' });
  }

  const pool = crearPool();

  try {
    const datosPrivados = await pool.query(
      'SELECT email, telefono FROM clientes WHERE id = $1',
      [idCliente]
    );

    if (datosPrivados.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    return res.json(datosPrivados.rows[0]);
  } catch (error) {
    console.error('Error al obtener los datos del cliente:', error);
    return res.status(500).json({ error: 'No se pudieron obtener los datos.' });
  }
});

module.exports = {
  app,
  crearPool,
  calcularTotal,
  tieneAccesoACliente,
  PORCENTAJE_DESCUENTO
};