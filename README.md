# Revisor automatico de codigo con IA

Un repositorio de pruebas para ver si una IA puede revisar tus Pull Requests
**antes** de mergearlas, aplicando las reglas que vos mismo escribis.

Todo esta comentado en un tono simple, como para explicarle a un nino de 10
anos. Si algo no se entiende, es que esta mal explicado, no tuyo.

---

## 1. La idea en una imagen

```
   Tu escribes codigo
          |
          v
   Abres una Pull Request (PR)
          |
          v
   +-------------------------------------------+
   |  GitHub arranca una maquina virtual limpia |   <- esto es "Actions"
   |  y le da este repo como material           |
   +-------------------------------------------+
          |
          v
   +-------------------------------------------+
   |  PASO 1: la IA lee el archivo REVIEW.md   |   <- tus reglas
   |  PASO 2: la IA mira que cambio en la PR   |
   |  PASO 3: la IA postea los comentarios     |
   +-------------------------------------------+
          |
          v
   +-------------------------------------------+
   |  Vos lees y decidis: mergear o no         |
   +-------------------------------------------+
```

**Algo que casi nadie te dice:** la IA **no bloquea** nada, y esta bien que sea
asi. Escribe su comentario, marca en rojo lo que esta grave, y la decision
final es tuya. Un revisor que te PROHIBE tocar el boton de merge se vuelve un
molestia rapidisimo; uno que te avisa y te explica es un ayuda.

Por eso este proyecto necesita **un solo token**: el de la IA. Nada de token
de GitHub, nada de reglas que activar a mano.

---

## 2. Que hay adentro de esta carpeta

```
review-ia-testing/
|
|-- README.md                          <- estas palabras (lo que estas leyendo)
|
|-- REVIEW.md                          <- TUS REGLAS. La IA lee este archivo.
|      Editar este archivo es cambiar el comportamiento del revisor.
|
|-- codigo-de-prueba/
|   |-- con-errores.js                 <- archivo con 7 errores a proposito.
|   |                                    La IA deberia decir NO APTO.
|   `-- sin-errores.js                 <- archivo hecho bien, con su test.
|                                        La IA deberia decir APTO.
|
|-- .gitignore                          <- archivos que no hay que subir.
|
`-- .github/
    `-- workflows/
        `-- revision.yml               <- EL PLANO DE LA MAQUINA.
                                          Dice cuando arrancar y que hacer.
```

Los archivos que importan son dos: **REVIEW.md** (lo que queres que revise) y
**revision.yml** (la machinery que lo hace).

---

## 3. Que necesitas antes de empezar

| Necesitas | Para que | Gratis? |
|---|---|---|
| Una cuenta de GitHub | Para tener repositorios | Si |
| Un repositorio en GitHub | Para hostear esto | Si |
| Claude Pro o Max (suscripcion) | Para que la IA revise con tu plan | No, son ~20 USD/mes |
| O una API key de Anthropic | Alternativa, se paga por uso | Depende del uso |

**La diferencia importante:**

- Con `claude setup-token` usas tu **suscripcion**. No sumas nada de gasto.
- Con `ANTHROPIC_API_KEY` usas la **API**, que se cobra aparte por cada uso.
  Si tenes una tarjeta que no querés que se te gaste sola, usá el token.

---

## 4. Como subir esto a GitHub (paso a paso)

### Paso 1 - Crear el repositorio vacio en GitHub

1. Entrá a <https://github.com/new>.
2. Ponele un nombre, por ejemplo `review-ia-testing`.
3. **No tildes** ninguna de las casillas de README, .gitignore o licencia.
   Esas cosas ya las tiene esta carpeta.
4. Crealo.

### Paso 2 - Subir los archivos desde tu computadora

Abri PowerShell en esta carpeta y escribí estos comandos, uno por uno:

```powershell
cd $env:USERPROFILE\Desktop\review-ia-testing

git remote add origin git@github.com:TU_USUARIO/review-ia-testing.git
git branch -M main
git add .
git commit -m "Primera version del revisor con IA"
git push -u origin main
```

> **Ojo, la direccion empieza con `git@github.com`, no con `https://`.**
> Asi usas tu llave SSH y **GitHub nunca te pide contrasena ni token**.
> La version con `https://` es la que te hace crear un "token personal", que
> es justo lo que estamos tratando de evitar. Si ya tenes SSH configurado
> (es que pudiste hacer `git push` antes), esto te va a funcionar derecho.

---

## 5. Como darle la llave a la IA

La IA necesita una credencial para saber quien es. Son **dos pasos**, y se
hacen una sola vez por repositorio.

### Paso 5a - Sacar el token en tu computadora

Abre PowerShell (o la terminal) y escribe:

```powershell
claude setup-token
```

Se abre el navegador, inicias sesion con tu cuenta de Claude y autorizas.
Despues te imprime un texto largo que empieza con `sk-ant-oat01-`.
**Copiá ese texto entero.** No lo mandes a nadie: es como una contrasena.

### Paso 5b - Guardarlo en GitHub

1. En tu repositorio: **Settings**.
2. En el menu lateral: **Secrets and variables** → **Actions**.
3. Click en **New repository secret**.
4. Completar:

   | Campo | Valor |
   |---|---|
   | **Name** | `CLAUDE_CODE_OAUTH_TOKEN` |
   | **Secret** | el texto que copiaste en el paso anterior |

5. **Add secret**.

> **Por que "secret" y no una variable normal?**
> Un secret esta cifrado y GitHub nunca lo muestra de nuevo en pantalla.
> En cambio, una variable normal se puede ver editando el YAML.
> Las claves tienen que ser secrets, siempre.

---

## 6. Como hacer la prueba

### Prueba A: deberia FALLAR

1. Crear una rama nueva:

   ```powershell
   git checkout -b prueba-con-errores
   ```

2. Copiar el archivo con errores a una ruta nueva (asi parece un cambio real):

   ```powershell
   Copy-Item codigo-de-prueba\con-errores.js codigo-de-prueba\servicio-clientes.js
   git add .
   git commit -m "Agrego servicio de clientes"
   ```

3. Subir la rama y abrir la PR:

   ```powershell
   git push -u origin prueba-con-errores
   ```

   Se abre una pagina de GitHub que dice "Compare & pull request". Click en
   **Create pull request**.

4. Esperar. La IA tarda entre 1 y 3 minutos.

5. **Lo que deberias ver:**
   - Un comentario general con el analisis y las reglas que se violaron.
   - Comentarios pegados en las lineas exactas del codigo que esta mal.
   - Cada punto grave marcado con 🛑 y el archivo y la linea.
   - Al final, la linea `VEREDICTO: NO APTO`.

6. **El boton Merge pull request sigue habilitado.** Eso es a proposito: la IA
   te aviso, pero mergear o no lo decís vos.

### Prueba B: deberia PASAR

1. Volver a la base y crear otra rama:

   ```powershell
   git checkout main
   git checkout -b prueba-sin-errores
   ```

2. Copiar el archivo bueno:

   ```powershell
   Copy-Item codigo-de-prueba\sin-errores.js codigo-de-prueba\reporte-ventas.js
   git add .
   git commit -m "Agrego reporte de ventas"
   git push -u origin prueba-sin-errores
   ```

3. Crear la PR y esperar.

4. **Lo que deberias ver:**
   - Comentario de la IA diciendo que esta todo bien.
   - La linea `VEREDICTO: APTO`.

### Prueba C: cambiar las reglas y ver el efecto

Editar `REVIEW.md`, agregar una regla nueva en la categoria que quieras, hacer
commit y push. La proxima PR se revisa con la regla nueva. No hay que tocar
nada del workflow.

---

## 7. La lista para diagnosticar

| Lo que pasa | Por que | Que hacer |
|---|---|---|
| El workflow ni siquiera aparece en Actions | El archivo esta mal guardado | Tiene que estar en `.github/workflows/` y terminar en `.yml` o `.yaml` |
| `Error: Resource not accessible by integration` | Faltan permisos | Agregar `pull-requests: write` en `revision.yml` |
| `Error: OAuth token not found` | El secret no esta puesto | Repetir pasos 5a y 5b. Ojo: es `CLAUDE_CODE_OAUTH_TOKEN` en mayusculas |
| `Error: claude not found` | No hay sesion | El secret caduca. Repetir `claude setup-token` |
| La IA no escribio la linea `VEREDICTO:` | Se corto el comentario | Mirá los logs. Suele ser que el `prompt` quedo cortado |
| Dice que hay algo grave pero el codigo esta bien | Es un falso positivo | Movelo de categoria en `REVIEW.md`, de GRAVE a AVISAR |

**Como ver los logs:** pestana **Actions** de tu repo → click en el run que
fallo → click en el paso que fallo → se abre la pantalla con todo lo que
escribio la maquina.

---

## 8. Ajustar el comportamiento cuando se equivoca

Es normal que al principio la IA sea estricta de mas o de menos.

**Si marca de mas** (te avisa de cosas que estan bien): mover esa regla de la
categoria `GRAVE` a `AVISAR` en `REVIEW.md`.

**Si marca de menos** (no te avisa de lo que deberia): agregar el caso concreto
a la categoria `GRAVE`. Cuanto mas concreto sea el ejemplo, mejor. En vez de
"no dejar pasar secrets", mejor:
*"si una cadena tiene la forma sk-... o contiene 'password', marcarla grave"*.

**Se llama "falso positivo"** cuando marca algo que esta bien, y
**"falso negativo"** cuando deja pasar algo que esta mal.

---

## 9. Cuanto cuesta

Con tu suscripcion de Claude Pro o Max: **cero extra**. Usa el mismo plan que
ya estas pagando.

Lo que si cuesta:
- Los minutos de GitHub Actions. Los repos publicos son gratis; los privados
  dan 2000 minutos por mes en el plan free.
- Tu propia suscripcion de Claude.

---

## 10. Resumen en 5 pasos

1. Crear el repo vacio en GitHub.
2. `git remote add origin ...` y `git push`.
3. Pegar el secret de la IA (Claude o MiniMax) en GitHub. Listo: **solo eso**.
4. Crear una rama, tocar un archivo, abrir la PR.
5. Leer el comentario de la IA y decidir vos si mergear.---

## 11. ¿Claude o MiniMax? Elegí el tuyo

Buena pregunta: **el workflow NO necesita Claude**. Hay dos archivos y cada
uno habla con una IA distinta. Los dos hacen exactamente lo mismo.

```
┌─────────────────────────────┬──────────────────┬──────────────────┐
│                             │  revision.yml    │revision-minimax.yml│
├─────────────────────────────┼──────────────────┼──────────────────┤
│ ¿Qué IA usa?                │  Claude          │  MiniMax         │
│ ¿Qué necesitás tener?       │  Suscripción     │  Suscripción     │
│                             │  de Claude       │  M Plan          │
│ ¿Dónde sacás la credencial? │  `claude         │  platform.minimax│
│                             │  setup-token`    │  .io → M Plan    │
│ Nombre del secreto          │CLAUDE_CODE_     │  MINIMAX_API_KEY│
│                             │  OAUTH_TOKEN     │                  │
│ Costo del review            │  incluido en tu  │  incluido en tu  │
│                             │  plan            │  plan            │
└─────────────────────────────┴──────────────────┴──────────────────┘
```

### El truco que hace posible usar MiniMax

Claude Code es un programa que, por dentro, habla con Anthropic usando un
formato de mensajes propio. **MiniMax construyó un servidor que habla
exactamente ese mismo formato** (lo llaman "Anthropic-Compatible Protocol").

Entonces el mismo programa puede hablar con los dos: solo hay que decirle
**a qué dirección** va y **con qué credencial**. Eso son dos renglones:

```yaml
ANTHROPIC_BASE_URL: https://api.minimax.io/anthropic
ANTHROPIC_AUTH_TOKEN: ${{ secrets.MINIMAX_API_KEY }}
```

`BASE_URL` es la dirección de la puerta. `AUTH_TOKEN` es la credencial.

> Fuente: docs oficiales de MiniMax,
> `platform.minimax.io/docs/token-plan/other-tools` → "Anthropic-Compatible Protocol".

### Cómo configurarlo (si elegís MiniMax)

1. Entrá a **platform.minimax.io** y comprá el **M Plan** (el plan pensado
   para programar con IA).
2. Copiá tu **Subscription Key** (empieza con `sk-cp-...`).
3. En tu repo: **Settings → Secrets and variables → Actions → New repository
   secret**.
4. Nombre: `MINIMAX_API_KEY`. Valor: la key que copiaste.
5. Subí el repo y hacé una PR de prueba.

### ⚠️ Importante: no actives los dos a la vez

Si dejás los dos workflows files, cada PR dispara **dos revisiones** y vas
a tener dos comentarios de IA peleándose por el mismo PR. Elegí uno y
borrá el otro (o simplemente renombrá la extensión del que no uses a
`.yml.txt`).

---

## 12. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Error: Invalid API key` | El secreto se llama distinto a como lo pide el workflow | Revisá el nombre: son **exactamente** `CLAUDE_CODE_OAUTH_TOKEN` o `MINIMAX_API_KEY` |
| La IA responde en chino o mezclando idiomas | El modelo se confundió | Agregalo a `REVIEW.md`: "Responde siempre en español" |
| El workflow no arranca | El YAML tiene un error de sangría | Revisá que las líneas con `#` no estén pegadas a código |