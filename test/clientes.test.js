// =============================================================================
//  Tests de la API de clientes.
//  Cada endpoint tiene su prueba REAL: se levanta el servidor y se le
//  hacen peticiones de verdad por HTTP (regla GRAVE de REVIEW.md).
// =============================================================================

const test = require('node:test');
const assert = require('node:assert');

process.env.DB_PASSWORD = 'clave-de-prueba-falsa';

const {
  app,
  calcularTotal,
  tieneAccesoACliente,
  leerId,
  PORCENTAJE_DESCUENTO,
  COLUMNAS_PUBLICAS
} = require('../codigo-de-prueba/prueba-minimax');

/**
 * Levanta la app en un puerto libre y devuelve una función para pegarle.
 *
 * @returns {Promise<{pedir: Function, cerrar: Function}>} El helper y el cierre.
 */
async function levantarServidor() {
  const servidor = app.listen(0);
  await new Promise((resolver) => servidor.once('listening', resolver));
  const puerto = servidor.address().port;

  return {
    pedir: (ruta) => fetch(`http://127.0.0.1:${puerto}${ruta}`),
    cerrar: () => new Promise((resolver) => servidor.close(resolver))
  };
}

test('calcularTotal aplica el descuento del proyecto', () => {
  const total = calcularTotal(3, 1000);

  assert.strictEqual(total, 3000 * PORCENTAJE_DESCUENTO);
  assert.strictEqual(total, 2700);
});

test('calcularTotal avisa si le pasan algo que no es un número', () => {
  assert.throws(() => calcularTotal('3', 1000), TypeError);
  assert.throws(() => calcularTotal(3, null), TypeError);
});

test('el listado no expone email ni telefono', () => {
  assert.ok(!COLUMNAS_PUBLICAS.includes('email'));
  assert.ok(!COLUMNAS_PUBLICAS.includes('telefono'));
});

test('GET /api/clientes rechaza a quien no tiene sesión (401)', async () => {
  const { pedir, cerrar } = await levantarServidor();

  try {
    const respuesta = await pedir('/api/clientes');

    assert.strictEqual(respuesta.status, 401);
  } finally {
    await cerrar();
  }
});

test('GET /api/clientes/privado rechaza a otro usuario (403)', async () => {
  const { pedir, cerrar } = await levantarServidor();

  try {
    const respuesta = await pedir('/api/clientes/9/privado');

    assert.strictEqual(respuesta.status, 403);
  } finally {
    await cerrar();
  }
});

test('el dueño del cliente puede ver sus datos privados', () => {
  const peticion = { sesion: { idCliente: 7, rol: 'usuario' } };

  assert.strictEqual(tieneAccesoACliente(peticion, 7), true);
});

test('otro usuario NO puede ver los datos privados de otro cliente', () => {
  const peticion = { sesion: { idCliente: 7, rol: 'usuario' } };

  assert.strictEqual(tieneAccesoACliente(peticion, 9), false);
});

test('un administrador sí puede ver cualquier cliente', () => {
  const peticion = { sesion: { idCliente: 7, rol: 'admin' } };

  assert.strictEqual(tieneAccesoACliente(peticion, 9), true);
});

test('sin sesión no se accede a nada', () => {
  assert.strictEqual(tieneAccesoACliente({}, 7), false);
});

test('leerId acepta un número entero y lo normaliza', () => {
  assert.strictEqual(leerId('7'), 7);
  assert.strictEqual(leerId(7), 7);
  assert.strictEqual(leerId(undefined), undefined);
  assert.strictEqual(leerId(''), undefined);
});

test('leerId rechaza lo que no es un número entero', () => {
  // Este es el intento típico de inyección: si el id no se valida, un
  // "1 OR 1=1" llega tal cual a la consulta.
  assert.throws(() => leerId('1 OR 1=1'), TypeError);
  assert.throws(() => leerId('abc'), TypeError);
  assert.throws(() => leerId('7.5'), TypeError);
});

test('GET /api/clientes devuelve 400 si el id no es un número', async () => {
  const { pedir, cerrar } = await levantarServidor();

  try {
    const respuesta = await pedir('/api/clientes/abc/privado');

    assert.strictEqual(respuesta.status, 400);
  } finally {
    await cerrar();
  }
});
