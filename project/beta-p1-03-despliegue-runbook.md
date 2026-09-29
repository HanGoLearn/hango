# P1-03 — Runbook de despliegue de la beta cerrada

Fecha de actualización: 27 de septiembre de 2026.

Este documento describe el entorno real que debe recibir la primera cohorte.
No contiene secretos y no autoriza por sí solo un despliegue. Han Tutor, Han
Companion, Speaking de Learning Journey y Speaking Lab siguen siendo sistemas
separados; P1-03 no modifica su pedagogía ni su comportamiento.

## 1. Arquitectura elegida

| Componente         | Elección para beta                                     | Estado                                              |
| ------------------ | ------------------------------------------------------ | --------------------------------------------------- |
| Web y cron         | Vercel, proyecto exclusivo de beta                     | Pendiente de crear/conectar                         |
| Base de datos      | Prisma Postgres, base exclusiva de beta                | Pendiente de crear                                  |
| Archivos privados  | Vercel Blob privado                                    | Proveedor implementado; store pendiente             |
| Correo             | Resend con dominio/remitente verificado                | Adaptador existente; cuenta pendiente               |
| Login social       | Google OAuth web para el dominio HTTPS                 | Pendiente de callback real                          |
| IA                 | OpenAI con límite de aplicación y límite del proveedor | Código conectado; secreto/alerta de beta pendientes |
| Señales operativas | `/admin/operations` y `/api/health`                    | Implementado; destino externo pendiente             |

No se reutiliza la base de desarrollo ni el disco local. El entorno de beta debe
tener credenciales, datos, backups y límites propios.

## 2. Trabajo técnico ya preparado

- `VercelBlobStorageProvider` implementa `StorageProvider` con objetos privados,
  descarga mediada por `/api/audio/...`, claves internas y operaciones de
  carga, descarga, listado, existencia y borrado.
- Speaking Lab prepara una clave ligada al usuario y la sesión, obtiene un token
  de carga de 10 minutos y envía el audio directamente al Blob privado. El token
  limita MIME, tamaño, ruta y overwrite; su endpoint exige el mismo origen de
  HanGo para evitar solicitudes desde otros sitios. El servidor vuelve a
  descargar y valida contenedor, duración, tamaño y propiedad antes de STT o
  feedback.
- Una carga inválida se elimina de inmediato; una carga interrumpida queda bajo
  el escáner de huérfanos y la outbox de borrado. Localhost conserva el flujo
  anterior para no depender de servicios cloud durante desarrollo y pruebas.
- Producción elige `vercel-blob` por defecto y rechaza explícitamente el
  proveedor local. Desarrollo y pruebas siguen usando `.storage/`.
- La outbox y el cron de retención ya dependen de `StorageProvider`; al activar
  Blob usarán el mismo listado/borrado sin guardar URLs públicas en la base.
- El pool PostgreSQL es configurable y usa 5 conexiones por instancia en
  producción, 20 en desarrollo salvo override.
- Prisma CLI usa `DIRECT_URL` para migraciones y `DATABASE_URL` queda reservado
  para el runtime. Si `DIRECT_URL` no existe, desarrollo conserva el fallback.
- `vercel.json` programa el payout semanal y la retención privada diaria. Ambos
  endpoints rechazan llamadas cuando `CRON_SECRET` falta o no coincide.
- Build de producción, typecheck, lint, formato y auditoría de dependencias
  quedaron verdes. El gate estático suma 246/246; 24/24 pruebas focalizadas de
  storage/carga y 12/12 de Speaking Lab con PostgreSQL temporal también pasan.

## 3. Variables del entorno de beta

Configurar únicamente en el panel del proveedor, nunca en Git ni en variables
`NEXT_PUBLIC_*`, salvo las dos variables públicas indicadas.

### Públicas

| Variable               | Valor esperado                          |
| ---------------------- | --------------------------------------- |
| `NEXT_PUBLIC_APP_NAME` | `HanGo`                                 |
| `NEXT_PUBLIC_APP_URL`  | origen HTTPS definitivo, sin ruta final |

### Privadas

| Variable                    | Uso y regla                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`              | URL **pooled** de Prisma Postgres con `sslmode=verify-full`                  |
| `DIRECT_URL`                | URL **directa** de la misma base con `sslmode=verify-full`; solo migraciones |
| `DATABASE_POOL_MAX`         | `5` inicialmente                                                             |
| `AUTH_SECRET`               | valor nuevo, aleatorio y exclusivo de beta, mínimo 32 caracteres             |
| `HANGO_BETA_ACCESS_MODE`    | `INVITE_ONLY`                                                                |
| `HANGO_BETA_LEARNING_SCOPE` | `FOUNDATIONS_ONLY`                                                           |
| `HANGO_STORAGE_PROVIDER`    | `vercel-blob`                                                                |
| `BLOB_READ_WRITE_TOKEN`     | secreto suministrado al conectar el store privado                            |
| `CRON_SECRET`               | secreto aleatorio exclusivo de cron                                          |
| `RESEND_API_KEY`            | clave restringida del entorno beta                                           |
| `EMAIL_FROM`                | remitente verificado, por ejemplo `HanGo <cuentas@dominio>`                  |
| `GOOGLE_CLIENT_ID`          | cliente OAuth web del dominio beta                                           |
| `GOOGLE_CLIENT_SECRET`      | secreto del mismo cliente OAuth                                              |
| `OPENAI_API_KEY`            | clave de proyecto beta con presupuesto/alerta en OpenAI                      |
| `HANGO_LEGAL_CONTACT_EMAIL` | contacto que realmente atenderá privacidad/soporte                           |

`ANTHROPIC_API_KEY` debe quedar vacío si OpenAI es el único proveedor elegido.
No copiar `.env.local` completo: se cargan las variables anteriores una por una.

## 4. Orden de creación y despliegue

1. Confirmar un punto de recuperación en Git y una ejecución verde de CI.
2. Crear el proyecto Vercel de beta conectado al repositorio, sin publicar aún
   el enlace a participantes.
3. Crear una base Prisma Postgres exclusiva. Guardar por separado la URL pooled
   y la URL directa; fijar `sslmode=verify-full` en ambas.
4. Crear/conectar un store Vercel Blob **private**. Cargar su token solamente en
   Vercel y establecer `HANGO_STORAGE_PROVIDER=vercel-blob`.
5. Verificar el dominio de envío en Resend y crear una clave exclusiva de beta.
6. Crear o actualizar el cliente Google OAuth con:
   - origen JavaScript: `https://<dominio-beta>`;
   - callback: `https://<dominio-beta>/api/auth/callback/google`.
7. Generar `AUTH_SECRET` y `CRON_SECRET` nuevos; cargar toda la matriz anterior.
8. Ejecutar, desde una estación autorizada y apuntando a la URL directa:
   `npm run db:migrate:deploy`.
9. Antes de invitar personas, cargar el currículo inicial y verificar sus conteos.
   El `prisma/seed.ts` actual elimina y recrea escenarios; es aceptable únicamente
   en una base nueva y vacía. **No volver a ejecutarlo después de que existan
   progresos reales** hasta disponer de un publicador de contenido no destructivo.
10. Crear la cuenta administrativa y las invitaciones desde la administración.
11. Desplegar y ejecutar el gate de la sección 5. Solo después compartir el URL.

## 5. Gate obligatorio en el dominio real

### Infraestructura

- `GET /api/health` responde 200 y `{ "status": "ok" }`.
- Un redeploy conserva una grabación de prueba y los datos de la cuenta.
- La conexión runtime usa la URL pooled; `migrate deploy` usa la directa.
- Una URL con certificado/hostname inválido es rechazada; no se rebaja TLS.
- El panel del proveedor confirma backups administrados y permite restaurar una
  copia en una base temporal sin tocar beta.

### Privacidad y autorización

- Un usuario A puede reproducir su audio; un usuario B obtiene 404/403 para la
  misma clave; una persona sin sesión tampoco accede.
- El store no entrega una URL pública utilizable directamente.
- El cron de retención elimina un objeto vencido y actualiza su outbox.
- Los dos cron devuelven 401 sin el `Authorization: Bearer <CRON_SECRET>` correcto.
- El bundle del navegador no contiene `DATABASE_URL`, `DIRECT_URL`, tokens,
  secretos OAuth, Resend, cron ni OpenAI.

### Flujos reales

- Invitado → registro → correo real → verificación → login → onboarding.
- Google login funciona desde el dominio HTTPS si se habilita en la cohorte.
- Una lección, Speaking Lab, Writing y una llamada de IA real respetan límites.
- Restablecimiento de contraseña llega por correo y los enlaces no aparecen en
  logs ni respuestas públicas.
- `/admin/operations` muestra base, storage, correo y cron saludables.

## 6. Carga directa preparada; verificación cloud pendiente

Vercel limita el cuerpo recibido por una Function a 4.5 MB. Speaking Lab permite
grabaciones mayores, por lo que aumentar `serverActions.bodySizeLimit` no basta.
La carga directa ya está implementada mediante un token corto y autenticado,
seguida de validación server-side y comprobación de propiedad. La ruta es
exclusiva de Speaking Lab y no toca el flujo de voz de Han. Para considerar el
riesgo cerrado todavía se debe enviar en el dominio real un audio mayor de 4.5
MB, comprobar progreso/reintento en red móvil y verificar que otra cuenta no
puede leerlo, finalizarlo ni borrarlo.

## 7. Pausa y rollback

- Pausar entradas: mantener `INVITE_ONLY` y revocar invitaciones no activadas.
- Pausar gasto: usar los kill switches globales en `/admin/limits` y el límite de
  la cuenta OpenAI.
- Fallo de despliegue: promover la última revisión verde de Vercel.
- Fallo de migración: detener tráfico; no usar `migrate reset` ni cambios
  destructivos. Restaurar una copia en un proyecto temporal, diagnosticar y solo
  entonces decidir la recuperación.
- Fallo de storage: no cambiar a local en producción. Mostrar indisponibilidad,
  conservar la outbox y reintentar cuando el proveedor se recupere.

## 8. Condición para cerrar P1-03

El código preparado no cierra P1-03 por sí solo. Se cierra cuando los recursos
externos existen, el gate anterior tiene evidencia en el dominio HTTPS, una
restauración de backup fue ensayada y una grabación de más de 4.5 MB completa la
carga directa sin quedar pública ni accesible por otra cuenta.
