# Actualización de HanGo — 11 de octubre de 2026

## Alcance autorizado

Subir a HanGoLearn/hango el trabajo local pendiente de la última semana.
Añadir almacenamiento de la evaluación Speaking de Learning Journey.
Eliminar cuentas y datos propios salvo hango.learn@gmail.com en los dos
entornos, conservando currículo y con respaldo previo. No usar migrate reset
ni volver a ejecutar semillas contra bases persistentes.

## Cambios preparados para GitHub

- Han Tutor: ajustes de conversación, idioma de ayuda, pronunciación e
  interrupción por mantener presionado; modalidad texto/voz independiente.
- Speaking Lab: conversaciones por estaciones y navegación renovada, sin
  reutilizar la conversación de Han Tutor.
- Learning Journey: bancos de las 164 lecciones, gramática/dificultad y ancla
  temática, ayuda ES/EN, captura separada por intento, nueva evaluación,
  resultado compacto y conexión transaccional con General Level y recompensas.
- Administración: categorías de gasto y límites por experiencia conectados;
  separación Tutor/Companion/Journey/Lab y tarifas estimadas diferenciadas.
- Se retiró la invitación a preguntar a IA sobre un punto gramatical.
- Documentación, auditorías y pruebas relacionadas se conservan.

Han de la burbuja, Companion, Journey, Speaking Lab y Placement permanecen
independientes. Las tarifas estimadas no sustituyen la factura del proveedor.

## Datos: realizado en la base usada por localhost

Respaldo lógico de filas, definiciones de columnas/constraints y migraciones,
cifrado AES-256-GCM, con hash y descifrado comprobados. Se guarda solo en
`.codex-tmp/db-backups`, excluido de Git. No contiene una copia de los archivos
de audio externos; conserva sus referencias. No es un snapshot físico del
proveedor. Se conservan el archivo cifrado y su clave privada para recuperación.

Dos migraciones aditivas añadieron JourneySpeakingAttempt,
JourneySpeakingTurn y JourneySpeakingEvaluation, junto con metadatos de captura.
No se reescribieron resultados históricos al migrar.

Después se eliminaron 28 cuentas no administradoras y sus datos dependientes;
quedó únicamente el administrador verificado. Se conservaron 164 lecciones y
41 escenarios. La operación validó que cuentas y dependencias no hubieran
cambiado desde el respaldo y comprobó el administrador/currículo antes de
confirmar la transacción. Las 13 grabaciones privadas asociadas quedaron en la
cola de eliminación existente, sin tocar audio compartido del currículo.

Los gastos históricos de cuentas eliminadas desaparecen de sus filas de uso
por la cascada existente. Se conservaron en el respaldo cifrado y en un resumen
privado sin identificadores; no se atribuyen al administrador y la eliminación
no devuelve dinero de OpenAI.

La nueva evaluación está habilitada mediante el modo local solo en desarrollo.
La página speaking-preview sigue siendo una demostración con datos sintéticos.
Todavía hace falta aceptación de voz real; pruebas simuladas no certifican la
calidad pedagógica de las respuestas del modelo.

## Producción: pendiente de identificar

El usuario autorizó descargar temporalmente las variables privadas de Vercel.
El proveedor ocultó la conexión y devolvió [SENSITIVE]. No se usa el placeholder
como URL ni se deduce una base desde la cuenta de GitHub.

Falta la conexión de la base usada por Vercel. Solo después se puede confirmar
si es distinta de la usada por localhost, respaldarla, comprobar su administrador,
aplicar únicamente sus migraciones pendientes y borrar las cuentas autorizadas.
Si ambas configuraciones usan la misma base física, los cambios de datos de
local también serían visibles en producción: no se ha demostrado separación.

Subir código no modifica cuentas ni activa automáticamente las migraciones.
El opt-in `local` se ignora en producción: no prometer la evaluación nueva en
Vercel hasta activar un despliegue verificado específicamente para ese entorno.

## Recuperación

No subir respaldos, claves, archivos .env o grabaciones a GitHub. Para recuperar
datos: descifrar el respaldo con su recovery.key en un entorno controlado,
restaurar primero en una base aislada compatible y validar filas/relaciones.
No reemplazar producción directamente ni mezclar el respaldo con datos nuevos
sin revisar conflictos. No se realizó un ensayo completo de restauración.

## Verificación de publicación

Antes de subir: comprobar tipos, lint, detector de secretos, compilación y suites
de lógica/componentes/integración. Proveedores de IA simulados en pruebas;
integraciones usan PostgreSQL desechable, nunca la base real.

Verificación confirmada: 1.612 pruebas de lógica/componentes en 148 archivos,
376 integraciones en 59 archivos y una prueba de arranque pasan (1.989 en total).
Tipos, lint y detector de secretos pasan; compilación de 70 páginas pasa.
La primera prueba de arranque detectó el servidor interactivo ya abierto: se
separó su carpeta temporal y se repitió con éxito sin cerrar localhost. El
PostgreSQL temporal de integración fue retirado. No se gastó API de IA.

El trabajo se prepara en `codex/journey-speaking-release-20261011`, sin cambiar
master ni sustituir la web pública mientras se verifica la base de producción.
