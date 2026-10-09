#!/usr/bin/env bash
# =============================================================================
#  🔒 bloquear-merge.sh — El candado
# =============================================================================
#
#  📖 PARA UN NIÑO:
#
#  La IA dejó un cartelito en la puerta de la Pull Request que dice
#  "APTO" o "NO APTO". Pero GitHub, cuando ve un cartelito, no hace nada:
#  para frenarlo tiene que ver un cartelito de la máquina de color ROJO.
#
#  Este script traduce el cartelito de la IA al cartelito de la máquina:
#
#      "NO APTO"    →  exit 1  →  marca ROJO    →  GitHub NO deja mergear
#      "APTO"       →  exit 0  →  marca VERDE   →  GitHub deja mergear
#
#  ⚠️ Si no encuentra ningún veredicto, también sale con error (exit 1).
#  Es lo que se llama "fallar de forma segura": si algo se rompe (la IA se
#  cortó, se cayó internet, el prompt se rompió), preferimos frenar el
#  merge antes que dejar pasar código sin revisar.
# =============================================================================

# `set -e`  → si una línea falla, el script se frena ahí mismo en vez de seguir
#             como si nada. Es el modo "si algo sale mal, abortá".
# `set -u`  → si usamos una variable que no existe, nos avisa en vez de
#             inventarse un valor vacío en silencio.
# `set -o pipefail` → si una parte de una tubería falla, falla todo el conjunto.
set -euo pipefail

# -----------------------------------------------------------------------------
# 1) ¿QUÉ NÚMERO DE PR ESTAMOS REVISANDO?
# -----------------------------------------------------------------------------
# GitHub guarda cada ejecución en una carpeta con un archivo llamado `event.json`
# que tiene los datos de lo que pasó. Con `jq` le sacamos el número de la PR.
#
#   -r  → en vez de mostrar las comillas de JSON, muestra el texto pelado.
#   .pull_request.number → la parte del JSON que nos interesa.
PR=$(jq -r '.pull_request.number' "$GITHUB_EVENT_PATH")
echo "🔍 Revisando el veredicto de la PR #$PR"

# -----------------------------------------------------------------------------
# 2) BAJAMOS TODOS LOS COMENTARIOS DE ESA PR
# -----------------------------------------------------------------------------
# `gh` es la versión de línea de comandos de GitHub. Le pedimos la lista de
# comentarios en formato JSON (por eso el flag `-q`).
# Lo guardamos en un archivo para poder buscarlo varias veces sin volver a
# llamar a la red.
gh api "repos/$GITHUB_REPOSITORY/issues/$PR/comments" \
    --paginate \
    -q '.[] | {cuerpo: .body, creado: .created_at, actualizado: .updated_at}' \
    > comentarios.json

# -----------------------------------------------------------------------------
# 3) NOS QUEDAMOS SOLO CON EL COMENTARIO DE LA IA DE ESTA EJECUCIÓN
# -----------------------------------------------------------------------------
# Puede haber comentarios viejos de otros runs. Para no confundirnos:
#   - solo los que la IA escribió DESDE que arrancó este run (variable $DESDE),
#   - y de esos, el ÚLTIMO (el más reciente), que es el veredicto final.
#
# El filtro, traducido de humano a máquina:
#   "de todos los comentarios, quedate con los que tienen la palabra VEREDICTO;
#    de esos, ordenalos por fecha; y devolveme el último".
ULTIMO=$(jq -r '
  [ .[]
    | select(.cuerpo | test("VEREDICTO"))
    | select(.creado >= env.DESDE)
  ]
  | sort_by(.actualizado)
  | last
  | .cuerpo // "vacio"
' comentarios.json)

# -----------------------------------------------------------------------------
# 4) LEEMOS LA ÚLTIMA LÍNEA QUE DICE "VEREDICTO"
# -----------------------------------------------------------------------------
# La IA escribe mucho texto arriba. El veredicto es SIEMPRE la última línea
# que menciona "VEREDICTO".
# `tac` = "leer al revés" (de abajo hacia arriba).
# `grep` = "buscar".
# `head -1` = "quedate con la primera" (que era la última).
# `|| true` = "si no encuentra nada, no te quejes y seguí".
VEREDICTO=$(echo "$ULTIMO" \
  | tac \
  | grep -i "VEREDICTO" \
  | head -1 \
  | tr -d '`' \
  | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
  || true)

echo "─────────────────────────────────────────"
echo "Veredicto encontrado: '${VEREDICTO:-NINGUNO}'"
echo "─────────────────────────────────────────"

# -----------------------------------------------------------------------------
# 5) LA DECISIÓN
# -----------------------------------------------------------------------------
# `exit 1` = "termino con error". GitHub lo pinta en ROJO y, si el repo tiene
#            Branch Protection activado, no deja mergear.
# `exit 0` = "termino bien". GitHub lo pinta en VERDE y deja mergear.

# Caso A — la IA dijo que NO APTO: frenamos.
if echo "$VEREDICTO" | grep -qi "NO APTO"; then
  echo ""
  echo "🛑 VEREDICTO NEGATIVO: hay problemas de la categoría SIEMPRE BLOQUEAR."
  echo "   Este PR no se puede mergear hasta que se corrija."
  echo "   Mirá los comentarios de la IA para saber qué arreglar."
  exit 1
fi

# Caso B — la IA dijo APTO: dejamos pasar.
if echo "$VEREDICTO" | grep -qi "VEREDICTO: APTO"; then
  echo ""
  echo "✅ VEREDICTO POSITIVO: el código cumple las reglas del REVIEW.md."
  echo "   Este PR se puede mergear."
  exit 0
fi

# Caso C — no encontramos veredicto: fallamos de forma segura.
echo ""
echo "⚠️  NO SE ENCONTRÓ NINGÚN VEREDICTO."
echo "   Puede que la IA se haya caído, o que no haya escrito la línea"
echo "   'VEREDICTO: APTO' / 'VEREDICTO: NO APTO'."
echo "   Por seguridad, este PR queda BLOQUEADO."
echo "   👉 Revisá los logs del paso 'La IA lee el código' para ver qué pasó."
exit 1