// =============================================================================
//  Tests de la API de clientes.
//  Cada endpoint nuevo tiene que tener su prueba (regla GRAVE de REVIEW.md).
// =============================================================================

const test = require('node:test');
const assert = require('node:assert');

process.env.DB_PASSWORD = 'clave-de-prueba';

const {
  calcularTotal,
  tieneAccesoACliente,
  PORCENTAJE_DESCUENTO
} = require('../codigo-de-prueba/prueba-minimax');

test('calcularTotal aplica el descuento del proyecto', () => {
  const total = calcularTotal(3, 1000);

  assert.strictEqual(total, 3000 * PORCENTAJE_DESCUENTO);
  assert.strictEqual(total, 2700);
});

test('calcularTotal avisa si le pasan algo que no es un número', () => {
  assert.throws(() => calcularTotal('3', 1000), TypeError);
  assert.throws(() => calcularTotal(3, null), TypeError);
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

test('los endpoints de clientes están registrados en la app', () => {
  const { app } = require('../codigo-de-prueba/prueba-minimax');
  const rutas = [];
  app.router.stack.forEach((capa) => {
    if (capa.route) {
      rutas.push(capa.route.path);
    }
  });

  assert.ok(rutas.includes('/api/clientes'), 'falta el endpoint /api/clientes');
  assert.ok(
    rutas.includes('/api/clientes/:id/privado'),
    'falta el endpoint /api/clientes/:id/privado'
  );
});