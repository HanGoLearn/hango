# P1-08 — Matriz de QA de beta y privacidad

- Fecha de la línea base local: 28 de septiembre de 2026
- Repositorio inspeccionado: `C:\HanGo`
- Commit base observado: `2929a38`
- Estado general: **gate automatizable verde; cierre en dispositivos y servicios
  reales pendiente**.

## 1. Qué demuestra esta entrega

HanGo dispone ahora de un único gate repetible para las partes de P1-08 que sí
pueden comprobarse de forma segura antes del despliegue:

```text
npm run test:beta
```

El comando ejecuta dos capas:

1. `test:beta:static`: autorización, privacidad, alcance de la beta,
   bilingüismo, accesibilidad y lógica de voz sin usar servicios pagados.
2. `test:beta:local`: crea una base PostgreSQL temporal, aplica todas las
   migraciones, carga el currículo, ejecuta los flujos reales contra esa base y
   termina con un smoke test de la aplicación. La base y su storage temporal se
   eliminan al finalizar.

Última evidencia obtenida durante esta entrega:

- capa estática: **32 archivos, 246 pruebas, 246 aprobadas**;
- capa de integración profunda: **27 archivos, 163 pruebas, 163 aprobadas**;
- smoke de aplicación: **1/1 aprobado**;
- prueba A/B adicional de progreso y anuncios: **2/2 aprobadas**;
- nueva prueba del enlace de verificación de correo: **3/3 aprobadas**.
- prueba focalizada de Speaking Lab, incluida la finalización de carga directa,
  archivo inválido y aislamiento cruzado: **12/12 aprobadas**.

No se entregó ninguna clave a los tests, no se llamó a OpenAI y no se modificó
la base de desarrollo. Los errores de unicidad que PostgreSQL imprime durante
algunas pruebas son entradas deliberadamente repetidas para demostrar que la
protección anti-replay funciona; las suites finalizaron en verde.

## 2. Matriz A/B de aislamiento

| Recurso                               | Resultado local                       | Evidencia principal                                                                     | Qué se comprobó                                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audio privado de Speaking             | Aprobado                              | `audio-route-authorization.test.ts`, `speaking-upload*.test.ts`, `speaking-lab.test.ts` | Una cuenta no puede descargar, finalizar ni borrar el objeto de otra; los tokens están ligados a propietario/sesión, solo se emiten desde el mismo origen de HanGo y una carga inválida se elimina antes de STT. |
| Progreso de lección                   | Aprobado                              | `beta-account-isolation.test.ts`                                                        | Dos usuarios abren la misma lección; avanzar A no mueve el paso, respuestas ni completados de B.                                                                                                                 |
| Placement escrito y oral              | Aprobado                              | `placement-security.test.ts`, `placement-speaking-security.test.ts`                     | Sesiones, intentos, nivel y resultado permanecen ligados al propietario; replay concurrente rechazado.                                                                                                           |
| Quiz, Mission, Writing y Speaking Lab | Aprobado                              | suites específicas de cada superficie                                                   | Los identificadores de intentos ajenos no permiten leer ni mutar el recurso.                                                                                                                                     |
| Feedback                              | Aprobado                              | `admin-backoffice.test.ts`, `beta-feedback-actions.test.ts`                             | El historial del participante solo devuelve sus propios reportes; la administración exige rol.                                                                                                                   |
| Anuncios                              | Aprobado                              | `beta-account-isolation.test.ts`, `admin-backoffice.test.ts`                            | Cerrar un anuncio en A no lo cierra en B; borrador, idioma y vigencia también se respetan.                                                                                                                       |
| Límites individuales de IA            | Aprobado                              | `user-ai-usage-caps.test.ts`, `admin-ai-usage-action.test.ts`                           | Bloquear o personalizar una función para A no cambia el límite de B.                                                                                                                                             |
| Datos administrativos                 | Aprobado en autorización automatizada | `auth-role.test.ts` y tests de actions administrativas                                  | Una sesión ausente o un learner no obtiene privilegios de administración. La inspección visual final se hará en el dominio de beta.                                                                              |

Resultado de la matriz: **cero acceso cruzado reproducido y cero fallo crítico
automatizado abierto**. Este resultado no sustituye una prueba manual contra el
dominio, la base y el bucket definitivos.

## 3. Cuenta y acceso

| Flujo                      | Estado                  | Evidencia / pendiente                                                                                                                                              |
| -------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Invitación y registro      | Aprobado localmente     | Invitado, no invitado, revocado, duplicado y normalización de correo.                                                                                              |
| Verificación de correo     | Aprobado localmente     | El token se almacena hasheado, activa la cuenta una vez, conserva ES/EN, se consume y un token vencido no activa la cuenta.                                        |
| Login por credenciales     | Aprobado en lógica      | Error genérico, rate limit, contraseña hasheada y rechazo de cuenta no verificada cuando el correo real está activo. Falta recorrido de navegador con Resend real. |
| Google OAuth               | Pendiente de beta HTTPS | Localhost funciona; se debe autorizar y probar el callback del dominio definitivo.                                                                                 |
| Recuperación de contraseña | Aprobado localmente     | Mensaje no enumerable, token de un solo uso y contraseña actualizada. Falta recepción real de email.                                                               |
| Borrado de cuenta          | Aprobado localmente     | Borra el usuario, retira el audio privado y deja la outbox en estado completado. Falta repetir contra el bucket cloud.                                             |

## 4. Producto que recibirá el participante

| Superficie                   | Cobertura automatizada                                                                                            | Comprobación manual que aún falta                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Learning Journey             | Lección, pasos, ejercicios, quiz, reflexión, progreso y cierre de escenario                                       | Recorrido táctil completo en Android/iPhone.                                                              |
| Han Tutor                    | Conversación, almacenamiento opcional, rate limit, costos y separación de mensajes de Speaking                    | Conversación real de varios turnos en ambos idiomas de interfaz.                                          |
| Han Companion                | Reglas Realtime, rechazo de ruido/silencio, turn guard, práctica libre y audio hablado                            | Micrófono real, interrupción, ruido ambiental y reanudación en ambos teléfonos.                           |
| Speaking de Learning Journey | Prompts de modo, reflexión y criterios de finalización                                                            | Una lección Foundations completa con voz real.                                                            |
| Speaking Lab                 | Sesión, carga directa privada, validación server-side, transcripción, feedback, no-retención, borrado y ownership | Estaciones visibles, audio >4.5 MB, red interrumpida y permisos permitidos/denegados contra el Blob real. |
| Writing Lab                  | Borrador, envío, feedback, reescritura y ownership                                                                | Teclado móvil, texto largo y escritura manuscrita/cámara si se mantiene visible.                          |
| Missions                     | Inicio, conversación, reporte, cierre y ownership                                                                 | Misión completa desde una cuenta invitada nueva.                                                          |
| HanVocabulary                | ES/EN, nivel real, caché compartida y cero cobro repetido para la misma consulta                                  | Búsqueda visible en ambos idiomas y desde dos cuentas reales.                                             |

Han Tutor, Han Companion, Speaking de Learning Journey y Speaking Lab se
mantienen como sistemas separados. Esta entrega solo añadió pruebas y el gate;
no cambió prompts, pedagogía, voz, transcripción ni interfaz de Han.

## 5. Idiomas

Automatizado y aprobado:

- rutas y controles localizados de onboarding, Learning Journey, placement y
  Writing Lab;
- feedback y mensajes principales en español e inglés;
- el contenido generado o escrito por el usuario no se traduce accidentalmente;
- el cambio de locale conserva rutas seguras.

Pendiente manual:

- crear una cuenta en español, completar el recorrido y cambiar a inglés;
- repetir desde una cuenta iniciada en inglés y volver a español;
- comprobar que no queda texto de interfaz en el idioma anterior en modales,
  errores, permisos, límites o anuncios.

## 6. Retención y borrado

La lógica local está aprobada para 0, 7, 30 y 90 días, retención indefinida,
objetos recientes, huérfanos, fallos del proveedor y reintento idempotente. La
opción de 0 días procesa el audio pero no lo conserva. El borrado de cuenta
también usa una outbox durable.

Antes de invitar usuarios se debe repetir la prueba con el proveedor cloud de
storage definitivo y provocar un fallo controlado para confirmar que
`/admin/operations` alerta la entrada pendiente y que el reintento la resuelve.

## 7. Checklist manual de dispositivos

Ejecutar la misma cuenta nueva en Android Chrome y iPhone Safari:

1. abrir el dominio HTTPS sin modo escritorio;
2. aceptar términos y avisos, verificar correo e iniciar sesión;
3. completar onboarding y el tour guiado;
4. completar una lección Foundations de principio a fin;
5. probar Tutor, Companion, Speaking de Learning Journey y Speaking Lab por
   separado;
6. permitir micrófono y cámara, luego denegarlos y comprobar una salida clara;
7. interrumpir una respuesta de voz, bloquear/desbloquear el teléfono y volver;
8. simular red lenta/offline, recuperar conexión y confirmar que no se duplica
   progreso, gasto ni recompensas;
9. abrir teclado, rotar el teléfono y revisar modal, navegación, Han, feedback y
   botones de cierre;
10. cambiar ES ↔ EN y repetir una búsqueda en HanVocabulary;
11. enviar feedback y confirmar que aparece en administración;
12. solicitar borrado y verificar usuario, audio y outbox.

Registrar por cada caso: dispositivo, sistema operativo, navegador, cuenta,
hora, ruta, resultado esperado, resultado observado, captura y severidad. No
copiar audio, tokens, contraseñas, prompts ni transcripciones al reporte.

## 8. Bloqueos externos para cerrar P1-08

P1-08 aún no puede declararse terminado porque faltan dependencias que no se
pueden simular honestamente en localhost:

- URL HTTPS y hosting de beta;
- PostgreSQL y bucket privado exclusivos de beta;
- Resend con dominio verificado y recepción real de verificación/recuperación;
- callback Google OAuth autorizado para el dominio;
- Android Chrome e iPhone Safari físicos;
- restauración de un backup real en un destino aislado;
- smoke final con una cuenta invitada nueva en el entorno desplegado.

## 9. Gate de salida

No abrir la ola 0 si ocurre cualquiera de estos casos:

- una cuenta observa o modifica datos de otra;
- un audio obtiene una URL pública permanente;
- registro, login, primera lección o borrado no se pueden completar;
- la restauración del backup falla o altera producción;
- existe un fallo crítico sin rollback;
- Android o iPhone no pueden completar el flujo esencial;
- aparecen tokens, audio, prompts o transcripciones en eventos operativos.

Cuando las comprobaciones externas terminen, actualizar este documento con la
evidencia, marcar P1-08 como cerrado y recién entonces ejecutar P1-09, ola 0.
