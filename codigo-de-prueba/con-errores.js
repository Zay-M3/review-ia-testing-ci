// =============================================================================
//  ARCHIVO DE PRUEBA - ESTE CODIGO TIENE ERRORES A PROPOSITO
// =============================================================================
//
//  PARA UN NINO:
//
//  Este archivo esta hecho con errores a proposito. No es codigo bueno.
//
//  Es como una hoja de ejercicios con las respuestas equivocadas escritas a
//  proposito, para ver si el profesor (en este caso, la IA) las detecta.
//
//  Cuando abras una Pull Request agregando o modificando este archivo,
//  la IA deberia decirte "VEREDICTO: NO APTO" y marcar cada problema con
//  la linea exacta donde esta. Si te dice "APTO", algo anda mal.
//
//  Ojo: la IA NO bloquea el merge. GitHub te va a dejar mergear igual,
//  porque la decision final la tomas vos.
//
//  CADA ERROR DE ABAJO CORRESPONDE A UNA REGLA DEL REVIEW.md.
//  Los marque con [ERROR #n] para que sepas cual.
// =============================================================================

// -----------------------------------------------------------------------------
// Endpoint de ejemplo. FINGE que es una ruta real de la API.
// -----------------------------------------------------------------------------
const express = require('express');
const app = express();
const { Pool } = require('pg');

// [ERROR #1] CATEGORIA "GRAVE" - SECRETO EN EL CODIGO
//
// Esta contrasena esta escrita aca, en el archivo, en texto plano.
// Si subis esto a GitHub, queda guardada en la historia del repositorio
// PARA SIEMPRE: aunque la borres despues, sigue ahi adentro, y cualquiera
// que la haya visto puede usarla.
//
// La forma correcta es leerla de una variable de entorno:
//     const password = process.env.DB_PASSWORD;
//
const DB_PASSWORD = 'S3cr3T0-de-la-banza-2024!';

// [ERROR #2] CATEGORIA "GRAVE" - ENDPOINT NUEVO SIN TEST
//
// Este endpoint es nuevo. Segun el REVIEW.md, todo endpoint nuevo tiene que
// tener un test que lo pruebe. No hay ninguno en este archivo.
//
app.get('/api/clientes', async (req, res) => {
  // Construimos el "pool" de conexiones a la base de datos.
  const db = new Pool({
    host: 'localhost',
    user: 'admin',
    // [ERROR #3] CATEGORIA "GRAVE" - SQL PEGADO CON TEXTOS
    //
    // Acá concatenamos el ID que viene de la URL directo dentro del texto
    // de la consulta. Un usuario podría mandar esto por la URL:
    //
    //     /api/clientes?id=1; DROP TABLE clientes; --
    //
    // y el código lo ejecuta como si fueran dos consultas. Eso se llama
    // "inyeccion SQL" y es una de las vulnerabilidades mas viejas y mas
    // peligrosas que existen.
    //
    // La forma correcta es pasarle los valores aparte:
    //     const resultado = await db.query(
    //         'SELECT * FROM clientes WHERE id = $1',
    //         [req.query.id]
    //     );
    const resultado = await db.query(
      'SELECT * FROM clientes WHERE id = ' + req.query.id
    );

    // [ERROR #4] CATEGORIA "AVISAR" - FALTA EL COMENTARIO Y EL BUEN NOMBRE
    //
    // La regla del proyecto dice que toda funcion publica necesita un bloque
    // de comentario con @param y @returns. Aca no hay nada.
    // Ademas el nombre `resultado` no dice que es ni de donde viene.
    res.json(resultado.rows);
});

// -----------------------------------------------------------------------------
// Funcion auxiliar con varios problemas de la categoria "AVISAR"
// -----------------------------------------------------------------------------
/**
 * Calcula el precio final de un pedido.
 *
 * @param {number} cantidad    - Cuantos productos pidio el cliente.
 * @param {number} precioBase  - El precio de un solo producto.
 * @returns {number} El total a pagar.
 */
function calcularTotal(cantidad, precioBase) {
  // [ERROR #5] CATEGORIA "AVISAR" - NUMERO MAGICO
  //
  // El 0.9 es "10% de descuento". Esta escrito pelado, sin nombre.
  // Seis meses despues, ni vos ni nadie se acuerda de donde salio.
  // Deberia ser:
  //     const PORCENTAJE_DESCUENTO = 0.9;
  const DESCUENTO_POR_DEFECTO = 0.9; // escrito pero con nombre raro

  // [ERROR #6] CATEGORIA "AVISAR" - CATCH VACIO
  //
  // El `catch` no hace nada: se come el error como si no hubiera pasado.
  // Si algo falla, el programa sigue como si todo estuviera bien, y nadie
  // se entera nunca de que fue lo que se rompio.
  try {
    return cantidad * precioBase * DESCUENTO_POR_DEFECTO;
  } catch (error) {
    // deberia: console.error('Error al calcular el total:', error);
  }

  return 0;
}

// -----------------------------------------------------------------------------
// Ruta que NO chequea permisos
// -----------------------------------------------------------------------------
// [ERROR #7] CATEGORIA "GRAVE" - SIN AUTORIZACION
//
// Esta ruta devuelve datos privados de un usuario (su email y su telefono),
// pero no pregunta NADA sobre quien lo esta pidiendo. Cualquiera, con solo
// adivinar el numero, puede ver los datos de cualquier cliente.
//
// Falta algo como: verificar que quien pide sea el dueno de ese cliente,
// o que sea un administrador.
//
app.get('/api/clientes/:id/privado', async (req, res) => {
  const db = new Pool({ host: 'localhost', user: 'admin' });
  const fila = await db.query(
    'SELECT email, telefono FROM clientes WHERE id = $1',
    [req.params.id]
  );
  res.json(fila.rows[0]);
});

module.exports = app;