// =============================================================================
//  API de clientes — versión corregida según las reglas de REVIEW.md
// =============================================================================

const express = require('express');
const { Pool } = require('pg');

const app = express();

/** Descuento aplicado al total: 0.9 significa "10% de descuento". */
const PORCENTAJE_DESCUENTO = 0.9;

/**
 * Columnas que devuelve el listado de clientes. A propósito NO incluye
 * email ni telefono: esos datos son privados y van en otra ruta, con
 * control de acceso.
 */
const COLUMNAS_PUBLICAS = 'id, nombre';

/**
 * Crea el pool de conexiones a la base de datos de clientes.
 *
 * @param {string} [password] Contraseña de la base. Si no se pasa, se toma
 *   de la variable de entorno DB_PASSWORD.
 * @returns {import('pg').Pool} Pool listo para hacer consultas.
 * @throws {Error} Si no hay ninguna contraseña disponible.
 */
function crearPool(password = process.env.DB_PASSWORD) {
  // La contraseña NUNCA va escrita en el archivo: tiene que venir del
  // entorno del servidor.
  if (!password) {
    throw new Error('Falta la variable de entorno DB_PASSWORD.');
  }

  return new Pool({ host: 'localhost', user: 'admin', password });
}

/**
 * Calcula el total a cobrar aplicando el descuento del proyecto.
 *
 * @param {number} cantidad Cantidad de unidades compradas.
 * @param {number} precioBase Precio de una unidad, sin descuento.
 * @returns {number} Total con el descuento ya aplicado.
 * @throws {TypeError} Si alguno de los dos valores no es un número.
 */
function calcularTotal(cantidad, precioBase) {
  if (typeof cantidad !== 'number' || typeof precioBase !== 'number') {
    throw new TypeError('calcularTotal necesita dos números.');
  }

  return cantidad * precioBase * PORCENTAJE_DESCUENTO;
}

/**
 * Devuelve la sesión de quien está haciendo la petición.
 *
 * @param {object} peticion Petición de Express.
 * @returns {object|null} La sesión, o null si no hay ninguna.
 */
function obtenerSesion(peticion) {
  return peticion.sesion || peticion.user || null;
}

/**
 * Convierte en un número entero un id que viene en la URL.
 *
 * Sirve para dos cosas: rechazar de entrada los valores que no son
 * números (por ejemplo `?id=1 OR 1=1`), y normalizar "7" y 7 para que la
 * comparación de permisos no falle por un detalle de formato.
 *
 * @param {string|number|undefined} valor Valor crudo que llega en la query.
 * @returns {number|undefined} El id como entero, o undefined si no vino.
 * @throws {TypeError} Si el valor viene pero no es un número entero.
 */
function leerId(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return undefined;
  }

  const id = Number(valor);

  if (!Number.isInteger(id)) {
    throw new TypeError('El id tiene que ser un número entero.');
  }

  return id;
}

/**
 * Verifica que quien pide los datos privados sea el dueño del cliente o un
 * administrador. Sin esto, cualquiera con el id correcto vería los datos de
 * otro cliente.
 *
 * @param {object} peticion Petición de Express (debe traer la sesión).
 * @param {number|string} idCliente Dueño de los datos que se quieren leer.
 * @returns {boolean} true si la petición está autorizada.
 */
function tieneAccesoACliente(peticion, idCliente) {
  const sesion = obtenerSesion(peticion);

  if (!sesion) {
    return false;
  }

  if (sesion.rol === 'admin') {
    return true;
  }

  return Number(sesion.idCliente) === Number(idCliente);
}

/**
 * GET /api/clientes — lista los clientes visibles para quien pregunta.
 *
 * IMPORTANTE (regla GRAVE de REVIEW.md): esta ruta devuelve filas de la
 * base, así que NO puede devolver todo a cualquiera. Solo hay dos casos:
 *
 *   - quien es admin ve la lista completa;
 *   - el resto ve únicamente su propia ficha.
 *
 * Nunca se devuelve la lista entera "porque sí": un usuario común con
 * sesión válida que pide la ruta sin filtro se llevaría los datos de todos
 * los clientes de la empresa.
 *
 * @param {object} req Petición de Express.
 * @param {object} res Respuesta de Express.
 * @returns {Promise<void>} Termina la respuesta con la lista o un error.
 */
app.get('/api/clientes', async (req, res) => {
  // Autorización: sin sesión no se devuelve nada, ni siquiera sin filtro.
  const sesion = obtenerSesion(req);
  if (!sesion) {
    return res.status(401).json({ error: 'Tenés que iniciar sesión.' });
  }

  // El id pedido tiene que ser un número entero, si viene algo.
  const idPedido = leerId(req.query.id);

  if (sesion.rol !== 'admin') {
    // Un usuario que no es admin solo puede consultar su propio cliente.
    if (idPedido !== undefined && !tieneAccesoACliente(req, idPedido)) {
      return res.status(403).json({ error: 'No tenés permiso para ver estos datos.' });
    }

    // Y el id con el que se filtra es SIEMPRE el suyo: el que venga en la
    // URL no se usa. Así la ruta no se puede usar para listar a todos.
    idPedido = Number(sesion.idCliente);
  }

  const pool = crearPool();

  try {
    // Consulta CON PARÁMETROS: el id nunca se pega dentro del texto SQL,
    // así no hay forma de inyectar código por la URL.
    const filasClientes = await pool.query(
      `SELECT ${COLUMNAS_PUBLICAS} FROM clientes WHERE ($1::int IS NULL OR id = $1)`,
      [idPedido]
    );

    return res.json(filasClientes.rows);
  } catch (error) {
    console.error('Error al listar clientes:', error);
    return res.status(500).json({ error: 'No se pudieron obtener los clientes.' });
  }
});

/**
 * GET /api/clientes/:id/privado — email y teléfono de un cliente.
 * Routea los datos de contacto, así que exige autorización.
 *
 * @param {object} req Petición de Express.
 * @param {object} res Respuesta de Express.
 * @returns {Promise<void>} Termina la respuesta con los datos o un error.
 */
app.get('/api/clientes/:id/privado', async (req, res) => {
  let idCliente;

  // Un id que no sea un número entero se rechaza antes de tocar la base.
  try {
    idCliente = leerId(req.params.id);
  } catch (error) {
    return res.status(400).json({ error: 'El id tiene que ser un número entero.' });
  }

  if (idCliente === undefined) {
    return res.status(400).json({ error: 'Falta el id del cliente.' });
  }

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
  obtenerSesion,
  tieneAccesoACliente,
  leerId,
  PORCENTAJE_DESCUENTO,
  COLUMNAS_PUBLICAS
};
