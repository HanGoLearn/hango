# Speaking: tres correcciones y progresión por experiencia

Fecha de cierre: 22/10/2026. Implementación local; no publicada.

## 1. Nivel explícito para cada nuevo intento de lección

- El servidor toma el `hskReference` curricular y los puntos ya guardados en
  `LearnerProfile.generalLevelPoints`. El navegador no puede proporcionar puntos
  ni elegir el nivel del intento. No se cambian los umbrales existentes de HanGo.
- Se congela un contexto versionado en el snapshot JSON actual: puntos,
  General Level interno, nivel de la lección, apoyo inicial y extensión máxima.
  No requiere nuevas tablas, migraciones ni recalcular notas históricas.
- Nivel de experiencia: función existente `hskNumberForPoints`. La escala 0–9
  describe progresión interna, **no certificación ni equivalencia oficial HSK**.
- Nivel curricular: referencia de la lección, acotada a 1–9. Sin referencia:
  BEGINNER=1, INTERMEDIATE=3, UPPER_INTERMEDIATE=5, ADVANCED=6.
- Apoyo inicial: máximo entre 1 y el mínimo del nivel curricular y el máximo de
  (nivel curricular − 1, nivel de experiencia). Un alumno con menos experiencia
  recibe hasta un escalón adicional de apoyo, sin cambiar de escenario.
- Extensión máxima: un escalón por encima de la lección solamente si su nivel de
  experiencia ya supera el curricular; nunca más de 9. Es un techo opcional, no
  una orden de subir dificultad. Se necesita comprensión demostrada durante
  varios intercambios o solicitud explícita del alumno.
- Ejemplos: Saludos/nivel curricular 1 sigue empezando con recursos elementales
  tanto con 0 como con 1.800 puntos. Un alumno experimentado puede recibir una
  extensión limitada a 2, nunca un salto a 8. En una tarea curricular 3, pasar
  de experiencia 2 (350 puntos) a 3 (700) reduce el apoyo inicial de 2 a 3.
- **La nota se juzga contra la tarea curricular**, no contra los puntos ni un
  hablante nativo. Repetir una lección básica con mucha experiencia no endurece
  su nota. Los puntos no demuestran tonos, pronunciación ni dominio de palabras.
- Las instrucciones iniciales y por turno reciben el mismo contexto congelado.
  Las instrucciones del personaje no incluyen el bloque privado de calificación.
  Se conservan conversación natural y ayuda ES/EN, no un examen/checklist hablado.
- El juicio textual y el acústico reciben ese mismo nivel. El acústico recibe,
  además, objetivos y recursos core acotados y anclas distintas para etapas
  iniciales, de desarrollo y avanzadas: pausas normales, tonos contextuales,
  articulación y agrupación de frases; no velocidad nativa universal.
- El resultado acústico lleva la huella del snapshot. La lectura del servidor
  rechaza resultados de otro contexto o sin esa referencia en nuevos intentos.
  Esto verifica vinculación, **no autentica independientemente audio/proveedor**.
- La reflexión integrada muestra los niveles y puntos al comenzar el intento.
  Ganar puntos después no altera una evaluación ya guardada. Los intentos antiguos
  no se convierten silenciosamente ni se vuelve a comprar su evaluación.

## 2. Recuperación de fallo anterior al primer envío

- Un FAILED con cero solicitudes, sin respuesta guardada y motivo conocido
  (`structured_provider_unavailable`, `budget_blocked`, `processing_expired`)
  permite **una acción explícita** para intentar la primera evaluación.
- Debe ser el intento propio, sellado, con versión/idioma/captura coherentes.
  Se vuelve a comprobar el presupuesto antes del envío. El bloqueo no se evita.
- La misma protección de concurrencia y lease permite un único despacho aunque
  haya clics simultáneos. Un lease antiguo no puede despachar después de perderlo.
- Lectura, reapertura y guardado no recuperan automáticamente ni compran IA.
- Con una respuesta guardada, la recuperación sigue siendo exclusivamente
  offline. Con `requestCount > 0` no hay otra compra en la política unificada.
  Fallos desconocidos o ambiguos permanecen cerrados, no se resetean contadores.
- La UI distingue revisión gratuita de respuesta guardada y recuperación con
  posible consumo. Se preserva la conversación, no se pide repetir la lección.

## 3. Coherencia ante evidencia contradictoria

- Cuando el control semántico marca EVIDENCE_MISMATCH, ese objetivo deja de
  contarse como independiente/asistido/autocorregido y pasa a no confirmado.
  No se convierte en error del alumno ni se inventa una evidencia sustitutiva.
- Se retienen la nota total y las cuatro valoraciones textuales, con motivo
  localizado. El audio y los resultados reales de ejercicios se conservan.
- Ese objetivo no aparece como logro ni corrección. La nota de Han explica el
  problema del evaluador, sin reutilizar el elogio inválido de su prosa original.
- El candidato original y su respuesta pagada permanecen intactos para revisión
  offline. No se rebajan puntuaciones arbitrariamente ni se solicita otra IA.
- Regresión concreta: decir solamente 我叫小林。 no demuestra preguntar el nombre.
  Cobertura independiente=0, objetivo no confirmado=1, nota retenida y ningún
  elogio «Has preguntado su nombre de forma independiente».

## Verificación y límites

- Suite completa local: 2.112 pruebas en 173 archivos, antes del último ajuste
  de separación de instrucciones de personaje/evaluadores.
- Integración: 40/40 casos en tres archivos sobre Postgres desechable, retirado
  al terminar. Incluye ES/EN, JSONB/hash, guardado/reapertura, nivel congelado y
  actualizado solo en un intento nuevo, rechazo de puntos del navegador,
  recuperación concurrente y presupuesto aún bloqueado/restablecido.
- Verificación final posterior al ajuste menor: 143/143 pruebas dirigidas y
  40/40 integraciones repetidas sobre otra base desechable, retirada. Tipos,
  lint, formato y diff correctos. Build aislado completo: 73 páginas, claves
  de IA vacías y conexión de BD ficticia; sin publicación.
- No hubo llamadas reales a OpenAI, acceso a bases reales, borrado de cuentas,
  recompensas nuevas, commit, push ni despliegue de Vercel.
- La reflexión integral sigue en ensayo para nuevos intentos ADMINISTRATOR;
  no se amplía silenciosamente a todos los alumnos. El contexto de nivel sí se
  guarda en nuevos intentos Journey, sin mezclar Han burbuja, Companion ni Lab.
- Los tres P1 se corrigen técnicamente. Sigue pendiente el ensayo real acotado
  de audio/proveedor y la calibración docente; pruebas simuladas no demuestran
  precisión de tonos. Los P2 de la auditoría (idioma de prosa, prioridades,
  duplicación y detalle de errores de ejercicios) no se declaran resueltos aquí.

Referencias: `final-audit-2026-10-21.md`, `unified-reflection-2026-10-21.md`,
`src/lib/journey-speaking-level.ts` y pruebas Journey de nivel/audio/reflexión.
