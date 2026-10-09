# 📋 REVIEW.md — Las reglas del revisor automático

> **Si estás leyendo esto:** este archivo es el "libro de instrucciones" que le
> entregás a la IA. Ella no adivina qué está bien y qué está mal: hace **exactamente
> lo que está escrito acá abajo**. Si cambiás una línea de este archivo, cambiás el
> comportamiento del revisor en la próxima PR.

---

## ¿Qué es este archivo?

Imaginá que tenés un becario nuevo. Es inteligente, pero **no conoce las reglas de
tu empresa**. Si no le decís qué le importa, te va a descargar los cambios de forma rara.

Este archivo es ese "manual de instrucciones". Está escrito en texto normal de
Markdown: `#` es un título, `-` es una lista. No es código ni tiene sintaxis rara.

---

## Las tres categorías

Cada regla va en **una** de estas tres cajas. La IA decide en cuál cae cada cosa
que encuentra:

| Caja | Qué significa | Qué hace el revisor |
|---|---|---|
| 🛑 **GRAVE** | Esto es grave. Rompe producción o filtra secretos. | Lo marca en rojo y avisa que **no conviene mergear** |
| ⚠️ **AVISAR** | Molesta, pero no rompe nada. Se comenta y se sigue. | Lo menciona como sugerencia |
| 🔇 **IGNORAR** | No molestes con esto. | No dice nada |

> **Ojo, esto es importante:** el revisor **no bloquea** el merge. GitHub siempre
> deja mergear, porque la decisión final la tomás vos. Lo que hace la IA es
> analizar el código y avisarte con claridad: si hay algo grave, lo destaca con
> una etiqueta 🛑 para que la decisión sea tuya, no automática.

> **¿Por qué importa la diferencia entre grave y avisar?** Si todo fuera igual de
> urgente, después de un rato dejarías de leer los comentarios del revisor. Por
> eso lo grave se destaca y lo demás es solo una sugerencia.

---

## 🛑 CATEGORÍA 1 — GRAVE (rompe producción o filtra secretos)

- Cualquier **contraseña, token, API key o secreto escrito en el código**.
  Nunca van en el repo: van en variables de entorno.
- **SQL armado con texto pegado** (ej: `"SELECT * FROM users WHERE id = " + id`).
  Eso permite que alguien meta código dañino. Hay que usar parámetros (`?` o `$1`).
- **Endpoint nuevo de la API sin ningún test** que lo pruebe.
- Se **borra o sobrescribe un archivo** de configuración de producción sin
  avisarlo explícitamente en la descripción del PR.
- Uso de `eval`, `exec`, o ejecutar una consulta que venga de la URL sin
  validarla.
- Falta el chequeo de **permisos/autorización** en una ruta que devuelve datos
  de un usuario.
- La función dice en un comentario que devuelve `"datos de ejemplo"` pero el
  nombre del endpoint dice que devuelve datos reales (trampa para producción).

---

## ⚠️ CATEGORÍA 2 — AVISAR (no bloquea, pero conviene arreglar)

- Falta el comentario `/** ... */` en funciones **públicas**.
- El nombre de una variable no describe qué guarda (ej: `data`, `x`, `temp`).
- El código repite la misma lógica en tres lugares distintos.
- Un número mágico sin nombre (ej: `86400`) que debería ser una constante con
  nombre (ej: `SEGUNDOS_EN_UN_DIA`).
- El `catch` está vacío: se traga el error y no dice nada.
- Falta un `await` y la función no es `async` (el código corre en el aire).

---

## 🔇 CATEGORÍA 3 — IGNORAR (no comentes esto)

- Archivos generados automáticamente (cualquier cosa con `lock`, `generated`,
  `dist/`, `build/`, `*.min.js`).
- Cambios **solo** de documentación (`.md`, comentarios de texto).
- Cambios de formato/estilo que no cambian el comportamiento (espacios, orden
  de imports).
- Este mismo archivo `REVIEW.md`.

---

## 📐 Estilo general del proyecto (si no está en otra categoría, es ⚠️ aviso)

- Idioma: **español** en nombres de variables, funciones y comentarios.
- Cada función pública necesita su bloque de comentario con `@param` y `@returns`.
- Máximo 3 niveles de `if` anidados; si hay más, usar funciones auxiliares.

---

## 🧾 Cómo tengo que terminar mi respuesta

Al final de tu comentario en el Pull Request escribí una línea de resumen, sola,
que sea una de estas dos:

```
VEREDICTO: APTO
```

o bien

```
VEREDICTO: NO APTO
```

- **NO APTO** = hay al menos un punto de la categoría 🛑 GRAVE.
- **APTO** = no hay ninguno (solo cosas de la categoría ⚠️).

> Esta línea **no bloquea nada** por sí sola: es un resumen para que la persona
> que lee el PR de un vistazo sepa si hay algo grave. Mergear o no es siempre
> decisión de quien lo revisa.

---

## 📝 Cambiar las reglas

1. Editás este archivo en cualquier editor (o le preguntás a la IA de escritorio).
2. Hacés commit y push.
3. La próxima PR se revisa con las reglas nuevas. No hay que tocar nada más.
