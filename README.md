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
   |  y le da este repo como_material           |
   +-------------------------------------------+
          |
          v
   +-------------------------------------------+
   |  PASO 1: la IA lee el archivo REVIEW.md   |   <- tus reglas
   |  PASO 2: la IA mira que cambio en la PR   |
   |  PASO 3: la IA postea un comentario       |
   +-------------------------------------------+
          |
          v
   +-------------------------------------------+
   |  PASO 4: un script lee el veredicto        |
   |  "NO APTO" -> rojo -> NO deja mergear     |
   |  "APTO"    -> verde -> deja mergear       |
   +-------------------------------------------+
```

**La parte clave que casi nadie te dice:** la IA por si sola **no bloquea**
nada. Escribe un comentario y ya. Lo que frena el merge es que el proceso
termine en error (marca roja). Por eso hay un paso extra, el "candado", que
traduce la opinion de la IA a un semaforo que GitHub si entiende.

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
|-- scripts/
|   `-- bloquear-merge.sh              <- EL CANDADO. Traduce el veredicto
|                                         de la IA en rojo o verde.
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

git remote add origin https://github.com/TU_USUARIO/review-ia-testing.git
git branch -M main
git add .
git commit -m "Primera version del revisor con IA"
git push -u origin main
```

> Si te pide usuario y contrasena: usuario es tu usuario de GitHub, y
> **en vez de contrasena** tenes que pegar un "token personal".
> Buscalo en GitHub → tu foto → Settings → Developer settings →
> Personal access tokens → Generate new token (classic), con permiso `repo`.
> GitHub ya no acepta la contrasena normal por linea de comandos.

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
> Las claves tienen que ser secrets, siempre.---

## 6. Activar el bloqueo de verdad (Branch Protection)

Esto es **imprescindible**. Sin este paso, el revisor escribe su comentario,
pone el semaforo en rojo, y GitHub lo ignora: vos igual podes mergear.

Que es lo que hay que activar:

1. En tu repositorio: **Settings**.
2. Menu lateral: **Rules** → **Rulesets**.
3. **New ruleset** → **New repository ruleset**.
4. Completar:

   | Campo | Valor |
   |---|---|
   | **Ruleset Name** | `bloquear-codigo-malo` |
   | **Enforcement status** | Active |
   | **Target branches** | `main` |

5. En **Rules**, activar la casilla:
   **Require status checks to pass before merging**.
6. Cuando te pida elegir el check, escribi:
   `🔒 ¿Se puede mergear?`
   (es el nombre que le pusimos al job en `revision.yml`; si no aparece en la
   lista, guardalo y volve a cargar la pagina: a veces hay que ejecutar el
   workflow una vez antes de que GitHub lo conozca).
7. Guardar.

**Lo que acabas de hacer:** GitHub ahora dice *"no puedo mergear esta PR hasta
que el check 🔒 pase en verde"*. Como la IA devuelve rojo cuando encuentra algo
grave, el codigo problematico no puede pasar.

---

## 7. Como hacer la prueba

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
   - Un comentario con el analisis y las reglas que se violaron.
   - Al final, la linea `VEREDICTO: NO APTO`.
   - El check 🔒 en **rojo**.
   - El boton **Merge pull request** en gris o con un cartel que impide mergear.

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
   - El check 🔒 en **verde**.
   - Boton **Merge pull request** habilitado.

### Prueba C: cambiar las reglas y ver el efecto

Editar `REVIEW.md`, agregar una regla nueva en la categoria que quieras, hacer
commit y push. La proxima PR se revisa con la regla nueva. No hay que tocar
nada del workflow.

---

## 8. La lista para diagnosticar

| Lo que pasa | Por que | Que hacer |
|---|---|---|
| El workflow ni siquiera aparece en Actions | El archivo esta mal guardado | Tiene que estar en `.github/workflows/` y terminar en `.yml` o `.yaml` |
| `Error: Resource not accessible by integration` | Faltan permisos | Agregar `pull-requests: write` en `revision.yml` |
| `Error: OAuth token not found` | El secret no esta puesto | Repetir pasos 5a y 5b. Ojo: es `CLAUDE_CODE_OAUTH_TOKEN` en mayusculas |
| `Error: claude not found` | No hay sesion | El secret caduca. Repetir `claude setup-token` |
| El check queda en rojo con "no se encontro veredicto" | La IA no escribio la linea final | Mirá los logs. Suele ser que el `prompt` quedo cortado |
| El check esta rojo pero GitHub deja mergear | Falta el Branch Protection | Repetir la seccion 6 |
| `zjq: command not found` | (no deberia pasar) | Volver a correr el job desde la pestana Actions |

**Como ver los logs:** pestana **Actions** de tu repo → click en el run que
fallo → click en el paso que fallo → se abre la pantalla con todo lo que
escribio la maquina.

---

## 9. Ajustar el comportamiento cuando se equivoca

Es normal que al principio la IA sea estricta de mas o de menos.

**Si bloquea de mas** (te frena cosas que estan bien): mover la regla de
`SIEMPRE BLOQUEAR` a `AVISAR` en `REVIEW.md`.

**Si deja pasar de mas** (no frena lo que deberia): agregar el caso concreto
a `SIEMPRE BLOQUEAR`. Cuanto mas concreto sea el ejemplo, mejor. En vez de
"no dejar pasar secrets", mejor:
*"si una cadena tiene la forma sk-... o contiene 'password', bloquear"*.

**Se llama "falso positivo"** cuando marca algo que esta bien, y
**"falso negativo"** cuando deja pasar algo que esta mal.

---

## 10. Cuanto cuesta

Con tu suscripcion de Claude Pro o Max: **cero extra**. Usa el mismo plan que
ya estas pagando.

Lo que si cuesta:
- Los minutos de GitHub Actions. Los repos publicos son gratis; los privados
  dan 2000 minutos por mes en el plan free.
- Tu propia suscripcion de Claude.

---

## 11. Resumen en 6 pasos

1. Crear el repo vacio en GitHub.
2. `git remote add origin ...` y `git push`.
3. `claude setup-token` y pegar el secret en GitHub.
4. Activar el Branch Protection con el check `🔒 ¿Se puede mergear?`.
5. Crear una rama, tocar un archivo, abrir la PR.
6. Ver que la IA comenta y que el semaforo se pone rojo o verde solo.