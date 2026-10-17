# Entrega de Speaking: producción

## Alcance autorizado

Publicar el lote acumulado en GitHub y Vercel, respaldar/limpiar cuentas de
producción conservando `hango.learn@gmail.com`, y habilitar la evaluación real
de Speaking de Learning Journey. No modificar currículo ni mezclar Han Tutor,
Han Companion, Speaking Lab o sus registros con esta evaluación.

## Identidad de los entornos

| Entorno | Proyecto Prisma | Administrador | Primera lección |
| --- | --- | --- | --- |
| Desarrollo/localhost | HanGo Desarrollo (`m4opkjo0oix109ukcgbhu0f9`) | `cmtdtjzjn000adweot84z12is` | `cmstle3r600oa3weojyh95hvd` |
| Producción/Vercel | HanGo Producción (`cmstjb77p0ml702dzw4qnapuj`) | `cmuttzogr000004l8hwvevmiz` | `cmurrlgze00omtseohmebgigz` |

Identificación cruzada mediante datos de solo lectura y la sesión del sitio
publicado. Los nombres de proyecto se aclararon en Console; no son prueba por
sí solos. La conexión temporal de producción nunca sustituye `.env.local`.

## Respaldo y limpieza realizados

- Respaldo lógico de todas las tablas y definiciones/SQL de migraciones,
  comprimido y cifrado AES-256-GCM. Descifrado y hash comprobados; no es un
  `pg_dump` físico ni incluye los binarios de almacenamiento externo. No se
  realizó un ensayo integral de restauración.
- Ubicación privada: `C:\HanGo\.codex-tmp\db-backups\production-1792203624260`.
  Conservar `rows.json.gz.aes`, `recovery.key` y `manifest.json` juntos para
  recuperación; no subirlos a GitHub. Quien acceda a ambos podrá descifrarlos.
- Producción: dos cuentas antes, una después; se eliminó la no administradora
  y sus datos dependientes dentro de transacción, tras comprobar que el respaldo
  seguía vigente. Administrador y currículo preservados.
- Dos grabaciones privadas en outbox de eliminación; su eliminación física por
  el proceso de retención aún no está certificada. Audio compartido preservado.
- Consumo histórico guardado en respaldo y resumen privado, no reasignado al
  administrador. La limpieza no reinicia el saldo facturado por OpenAI.
- No se cambió `emailVerified`: para preservar al administrador se comprobó el
  identificador exacto, además de correo y rol, sin alterar autenticación.
- Desarrollo ya tenía únicamente administrador tras el mantenimiento anterior.
  No se volvió a borrar ni migrar desarrollo durante esta entrega.

## Migraciones comprobadas

Se verificaron checksums del historial y se permitió solo este conjunto:

1. `20261010120000_separate_realtime_usage_limits`
2. `20261010130000_separate_han_text_usage_limits`
3. `20261010140000_shared_ai_experience_budgets`
4. `20261011150000_journey_speaking_evidence_v2`
5. `20261011170000_journey_speaking_capture_quality`

Aplicadas; preflight posterior sin pendientes, tablas/columnas accesibles,
164 lecciones/41 escenarios conservados. Se fijaron ambas variables de conexión
del proceso de migración al destino explícito para impedir fallback a local.
No se usaron reset, seed ni `db push`.

## Activación y aceptación

`HANGO_JOURNEY_EVALUATION_V2=production` añadido solo a Production de Vercel.
El código requiere coincidencia del modo con su entorno y comprueba las tablas;
la variable local no habilita producción. Los informes antiguos requieren redo
explícito; no se etiquetan retrospectivamente como evaluación v2.

Base y variable listas. Pasan 1.613 pruebas unitarias/componentes (148 archivos),
tipos, lint dirigido, formato, revisión de secretos y compilación de 70 páginas.
El primer intento de pruebas encontró un permiso de archivos temporales de
Windows; la repetición fuera del sandbox pasó. No es un fallo de la aplicación.
Las 376 integraciones y smoke del lote anterior ya estaban comprobadas; no se
repitieron en producción. No se hizo una conversación pagada por el agente.

### Bloqueo encontrado antes de publicar

La excepción de tooling de Prisma vence hoy, por lo que `security:audit` falla
cerrado. La consulta nueva de `npm audit` informa 13 altas, una crítica y una
moderada. Entre ellas hay un aviso crítico de Next 16.3.5 (`next/og`), no solo
el tooling previamente exceptuado. La CI de master anterior también fallaba en
auditoría; no presentar su resultado como verde ni confundirlo con Vercel Ready.

Metadatos del registro npm comprobados: existen Next/ESLint 16.3.8 y Prisma
7.10.1 (este último reemplaza las dependencias vulnerables fijadas de
deepmerge-ts/mysql2). Sharp tiene parche 0.35.5. Braces aún publica 3.0.3 como
latest, dentro del aviso; estudiar alternativas/reachability de tooling antes
de decidir una excepción nueva. No aplicar `audit fix --force`, no degradar
Next a 14 y no extender la fecha para fingir que el control pasa.

Se detuvo la publicación en master/Vercel; la entrega queda en su rama separada.
La web pública sigue con la versión anterior. Se requiere corregir/revalidar
estas dependencias antes de desplegar el lote nuevo. La advertencia crítica
tampoco demuestra por sí sola explotación en HanGo; no se hizo tal afirmación.

### Actualización de seguridad autorizada posteriormente

El usuario autorizó corregir las dependencias, repetir pruebas y publicar;
posteriormente autorizó una excepción específica hasta el 23 de octubre.

- Next y su configuración ESLint fijados en 16.3.8; Prisma CLI/Client/adapter-pg
  en 7.10.1, sin salto a Prisma 8. Sharp 0.35.5 y music-metadata 11.16.1.
- Overrides acotados a líneas compatibles: brace-expansion 1.x → 1.1.21,
  5.x → 5.0.12; source-map-js 1.2.2; undici 8.x → 8.10.2. Mantenerlos mientras
  las dependencias padre no resuelvan esas correcciones por sí mismas.
- Cliente Prisma regenerado siguiendo la guía Prisma CLI, sin migrar ni sembrar
  ninguna base persistente. No cambios a prompts, personajes ni currículo.
- `npm audit --omit=dev`: cero avisos. Auditoría completa: cinco avisos altos
  derivados de una sola causa de tooling sin parche, ninguno crítico/moderado.
- Excepción propietaria: `GHSA-vfj7-8cjw-p6xm`, exclusivamente `braces@3.0.3`
  bajo `micromatch@4.0.8 → fast-glob@3.3.1 → @next/eslint-plugin-next@16.3.8
  → eslint-config-next@16.3.8`, todos dev-only. Finaliza al acabar el 23/10/2026
  en America/Bogota (`2026-10-24T00:00:00-05:00`). No es prórroga de Prisma.
- Política rechaza cualquier causa/aviso extra, crítica, versión/ruta distinta,
  promoción a dependencia runtime o informe malformado. Runtime no exceptúa
  ninguna severidad. Quince pruebas nuevas cubren estas barreras y vencimiento.
- No hay `settings.next.rootDir` en la configuración; ese es el único input de
  patrones en el helper de este plugin. El control prohíbe habilitarlo durante
  la excepción. Sigue existiendo riesgo residual en tooling si cambia la forma
  de ejecutar esa cadena fuera del flujo comprobado; no se declara parcheada.
- Se excluye `.next-smoke` de ESLint, igual que `.next`, para no recorrer código
  generado de pruebas. No se excluye código fuente de la aplicación.

Fuente del aviso sin parche:
[GitHub Advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
La revisión de metadatos se realizó en npm; no se usó `audit fix --force`, ni una
versión mayor de Next/Prisma/React, ni un fork ajeno para esconder el aviso.

Verificados por ahora: compilación completa de 70 páginas, 1.613 pruebas
unitarias/componentes existentes, 15 de política y typecheck. Las 376
integraciones y smoke (1) también pasan en PostgreSQL desechable; clúster
retirado. Se corrigió una comparación de prueba que ordenaba flotantes de
agrupaciones distintas: ahora compara micro-USD, igual que el ledger, sin
cambiar tarifas, cálculos ni enforcement de la aplicación.

El primer CI remoto del lote rechazó cinco suites de Journey antes de ejecutarlas:
su servicio PostgreSQL usaba localhost:5432/hango_ci y las suites requieren
127.0.0.1:54329/hango_local_test. Se alinearon nombre, puerto, ambas variables de
conexión y healthcheck del servicio desechable de CI; no se relajaron los guards
ni se cambiaron destinos persistentes. La publicación espera el CI repetido.

Aviso de tooling: jsdom 30
declara Node >=24.15 en esta línea; la PC tiene 24.14 y las pruebas pasan, pero
se recomienda actualizar el runtime local a un parche soportado por separado.

### Cierre del acceso de mantenimiento

Con confirmación explícita, se revocó únicamente la conexión temporal terminada
en vPaY, creada hoy; Console confirmó eliminación y conserva las seis conexiones
originales. Se retiró `.env.production-maintenance.local` de la PC. No se borró
ningún respaldo ni se sustituyeron las conexiones de Vercel/localhost.

Prueba del usuario tras confirmar despliegue:

1. Entrar en `https://hango-three.vercel.app/es/login` con el administrador.
2. Abrir Saludos y presentaciones, completar ejercicios y Speaking real
   manteniendo presionado el botón para hablar; pedir ayuda en español si hace
   falta. Si aparece un resultado antiguo, usar el reinicio explícito.
3. Finalizar y comprobar informe único en español, evidencia oral, nota explicada
   o motivo explícito de datos insuficientes; recargar no debe generar otro cobro
   ni premios duplicados. Verificar aporte real a General Level.

Guías utilizadas: Prisma CLI y Client API para destino explícito, migraciones y
transacciones; Prisma Postgres para conexión de mantenimiento en Console.
