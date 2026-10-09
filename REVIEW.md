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

| Caja | Qué significa | ¿Bloquea el merge? |
|---|---|---|
| 🛑 **SIEMPRE BLOQUEAR** | Esto es grave. Si está, el PR **no** se puede mergear. | **SÍ** |
| ⚠️ **AVISAR** | Molesta, pero no rompe nada. Se comenta y se sigue. | No |
| 🔇 **IGNORAR** | No molestes con esto. | No |

> **¿Por qué importa la diferencia?** Si todo bloqueara, al final nadie prestaría
> atención al revisor porque siempre estaría en rojo. Es como el semáforo:
> rojo es para de verdad.

---

## 🛑 CATEGORÍA 1 — SIEMPRE BLOQUEAR (rompe producción)

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

Esto es lo **más importante** para que funcione el bloqueo automático.

Al final de mi comentario en el Pull Request tengo que escribir
**exactamente** una de estas dos líneas, y nada más después:

```
VEREDICTO: APTO
```

o bien

```
VEREDICTO: NO APTO
```

- **NO APTO** = hay al menos un punto de la categoría 🛑.
- **APTO** = no hay ninguno.

> **Si no escribo ninguna de las dos**, el sistema `bloquear-merge.sh` no encuentra
> la línea y **falla igual** (no deja pasar el PR). Es la posición segura: si la
> IA se cae o se corta, no se cuela código sin revisar.

---

## 📝 Cambiar las reglas

1. Editás este archivo en cualquier editor (o le preguntás a la IA de escritorio).
2. Hacés commit y push.
3. La próxima PR se revisa con las reglas nuevas. No hay que tocar nada más.