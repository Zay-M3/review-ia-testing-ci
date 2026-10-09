// =============================================================================
//  ARCHIVO DE PRUEBA PARA LA RAMA prueba-revisor-minimax
// =============================================================================
//
//  👋 ESTE ARCHIVO TIENE ERRORES A PROPÓSITO.
//
//  No lo arregles. Está roto a propósito para ver si el revisor con IA
//  detecta los problemas y deja el comentario en la Pull Request.
//
//  Si el revisor dice "VEREDICTO: APTO" con este archivo lleno de errores,
//  significa que algo NO está funcionando y hay que revisarlo.
//
//  Cada error corresponde a una regla escrita en REVIEW.md.
//  Van marcados con [ERROR #n] para que se entienda cuál es cuál.
// =============================================================================

const express = require('express');
const app = express();
const { Pool } = require('pg');

// -----------------------------------------------------------------------------
// [ERROR #1] — CATEGORÍA GRAVE — CONTRASEÑA EN TEXTO PLANO
// -----------------------------------------------------------------------------
// Esta contraseña está escrita acá, en el archivo, a la vista de todos.
// Si subís el código a GitHub queda guardada en la historia para siempre:
// aunque después la borres, sigue ahí adentro.
//
// La forma correcta es leerla de una variable de entorno:
//     const password = process.env.DB_PASSWORD;
//
const DB_PASSWORD = 'S3cr3T0-de-la-banza-2024!';

// -----------------------------------------------------------------------------
// [ERROR #2] — CATEGORÍA GRAVE — CONSULTA SQL ARMADA CON CONCATENACIÓN
// -----------------------------------------------------------------------------
// Acá metemos el ID que viene de la URL directo adentro del texto de la
// consulta. Cualquiera podría mandar esto:
//
//     /api/clientes?id=1; DROP TABLE clientes; --
//
// y el código lo ejecuta como si fueran dos consultas. Eso se llama
// "inyección SQL" y es una de las vulnerabilidades más viejas y más
// peligrosas que existen.
//
// La forma correcta es pasar los valores por separado:
//     db.query('SELECT * FROM clientes WHERE id = $1', [req.query.id]);
//
app.get('/api/clientes', async (req, res) => {
  const db = new Pool({ host: 'localhost', user: 'admin' });

  const resultado = await db.query(
    'SELECT * FROM clientes WHERE id = ' + req.query.id
  );

  // [ERROR #3] — CATEGORÍA AVISAR — NOMBRE QUE NO DICE NADA
  //
  // `resultado` no dice qué es ni de dónde viene. Con un nombre mejor, el que
  // lea esto dentro de seis meses se entera sin adivinar.
  res.json(resultado.rows);
});

// -----------------------------------------------------------------------------
// [ERROR #4] — CATEGORÍA GRAVE — RUTA SIN AUTORIZACIÓN
// -----------------------------------------------------------------------------
// Esta ruta devuelve datos privados de un cliente (su email y su teléfono)
// pero no pregunta NADA sobre quién lo está pidiendo. Cualquiera, con solo
// adivinar el número, puede ver los datos de cualquier cliente.
//
// Falta verificar que quien pide sea el dueño de ese cliente, o un admin.
app.get('/api/clientes/:id/privado', async (req, res) => {
  const db = new Pool({ host: 'localhost', user: 'admin' });
  const fila = await db.query(
    'SELECT email, telefono FROM clientes WHERE id = $1',
    [req.params.id]
  );
  res.json(fila.rows[0]);
});

// -----------------------------------------------------------------------------
// [ERROR #5] — CATEGORÍA AVISAR — CATCH VACÍO
// -----------------------------------------------------------------------------
// El `catch` no hace nada: se come el error como si no hubiera pasado. Si
// algo falla, el programa sigue como si todo estuviera bien y nadie se
// entera nunca de qué se rompió.
//
// Debería ser:  console.error('Error al calcular el total:', error);
function calcularTotal(cantidad, precioBase) {
  // [ERROR #6] — CATEGORÍA AVISAR — NÚMERO MÁGICO
  //
  // El 0.9 es "10% de descuento", pero está escrito pelado y sin nombre.
  // Debería ser:  const PORCENTAJE_DESCUENTO = 0.9;
  try {
    return cantidad * precioBase * 0.9;
  } catch (error) {
  }

  return 0;
}

module.exports = app;