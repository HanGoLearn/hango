# P1-07 — Observabilidad y respuesta operativa de la beta

Estado: implementado técnicamente el 27 de septiembre de 2026. Este documento
es el procedimiento operativo; no sustituye la configuración del hosting,
correo, almacenamiento persistente, cron ni los topes del proveedor.

## Responsable y fuente de verdad

- Responsable inicial: Arean Mendoza, administrador único de HanGo.
- Panel principal: `/admin/operations`.
- Presupuesto y pausas de IA: `/admin/limits`.
- Invitaciones: `/admin/invitations`.
- Estado técnico sin detalles privados: `GET /api/health`.
- Frecuencia durante la beta: revisar Operaciones antes de cada ola y al menos
  una vez al día mientras haya participantes activos.

## Qué se registra y qué no

`AiOperationLog` conserva la telemetría ya existente de funciones de IA. Los
fallos generales se agrupan en `OperationalEvent` por origen, código normalizado,
ruta sanitizada, método y digest seguro. Los cron y el correo actualizan su
último resultado en `OperationalHeartbeat`.

Nunca se guardan en estos eventos cuerpos o encabezados HTTP, cookies, tokens,
contraseñas, IP, correo o identificador del usuario, mensajes o stacks crudos,
prompts, conversaciones, transcripciones, audio ni respuestas del proveedor.
La ruta pierde query/fragment y enmascara segmentos con aspecto de identificador.

## Señales y umbrales iniciales

| Señal                     | Atención                           | Crítica                      | Primera acción                                          |
| ------------------------- | ---------------------------------- | ---------------------------- | ------------------------------------------------------- |
| Aplicación, DB o storage  | degradado                          | caído                        | pausar invitaciones y revisar el despliegue             |
| Error de servidor/cliente | 3 repeticiones                     | severidad crítica            | reproducir ruta, revisar cambio más reciente            |
| Proveedor de IA           | error >=20% o p95 >=10 s           | error >=40% o p95 >=20 s     | pausar familia afectada en Límites de IA                |
| Presupuesto diario        | 50% o 75%                          | 90% o bloqueo 100%           | revisar uso; reducir límite de usuario o pausar familia |
| Cron de borrado           | sin éxito en 36 h                  | última ejecución fallida     | ejecutar diagnóstico del cron y revisar la cola         |
| Cron de leaderboard       | sin éxito en 9 días                | última ejecución fallida     | revisar secreto/programador antes del siguiente cierre  |
| Cola de borrado           | cualquier fallo/vencido            | >=5 fallidos o >=10 vencidos | conservar outbox, corregir storage y reintentar cron    |
| Correo                    | no configurado antes de producción | último envío fallido         | mantener registro público cerrado y revisar Resend      |

Los estados locales “sin configurar” no generan alerta crítica. En producción
sí aparecen como señal porque una beta pública necesita esos servicios reales.

## Procedimiento de incidente

1. Abrir `/admin/operations` y anotar hora, servicio, código seguro, ruta y
   número de ocurrencias. No copiar información privada desde otras pantallas.
2. Si el fallo implica gasto o respuesta incorrecta de IA, abrir
   `/admin/limits` y desactivar solo la familia afectada: TEXT, STT, TTS o
   Realtime. Esto no modifica la pedagogía ni mezcla los sistemas de Han.
3. Si impide registro, aprendizaje básico o borrado privado, detener la entrada
   de participantes: mantener `HANGO_BETA_ACCESS_MODE=INVITE_ONLY` y revocar en
   `/admin/invitations` todas las invitaciones pendientes de la siguiente ola.
   Las cuentas existentes pueden seguir entrando para diagnóstico controlado.
4. Reproducir con una cuenta de prueba, en la misma ruta e idioma, sin usar
   datos de una persona real. Consultar logs del host solo durante el diagnóstico
   y no copiar secretos ni contenido sensible a issues o chats.
5. Corregir en un cambio pequeño. Ejecutar typecheck, lint, pruebas específicas,
   build y smoke del flujo afectado.
6. Desplegar y comprobar `/api/health`, `/admin/operations` y el flujo real.
   Marcar el incidente como resuelto únicamente después de esa comprobación.
7. Registrar causa, alcance, corrección y prevención en el informe de la beta.

## Rollback y recuperación

- Cambio de aplicación defectuoso: volver al último despliegue conocido como
  bueno. La migración de P1-07 es aditiva; no borrar sus tablas durante un
  rollback de código.
- Migración nueva defectuosa: no usar `reset` ni borrar datos. Detener la ola,
  preparar una migración correctiva hacia adelante y validarla en un destino
  aislado antes de producción.
- Proveedor de IA inestable: usar los kill switches; no apagar HanGo completo.
- Storage inestable: no eliminar filas de `PrivateObjectDeletion`; la outbox
  está diseñada para conservar y reintentar el trabajo.
- Correo inestable: no abrir nuevas invitaciones por contraseña hasta confirmar
  un envío real. Google OAuth puede validarse por separado en el dominio HTTPS.
- Base de datos caída: pausar tráfico/invitaciones desde el host, verificar el
  proveedor y restaurar desde backup/PITR solo después de un simulacro válido.

## Comprobación previa a cada ola

- `/api/health` responde `200` con `status: ok`.
- No hay servicios caídos ni incidentes críticos abiertos en Operaciones.
- Los cron muestran una ejecución correcta dentro de su intervalo.
- La cola de borrado no tiene fallidos ni vencidos.
- El presupuesto diario tiene margen y el tope independiente del proveedor está
  configurado.
- Se completó un registro con correo real, un login Google HTTPS y un recorrido
  corto desde móvil.

La notificación externa automática (correo/servicio de incidentes) queda para
la configuración del entorno real. Hasta entonces, el panel, el endpoint de
salud y la revisión diaria son la señal operativa oficial.
