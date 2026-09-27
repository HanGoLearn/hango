# Alcance pedagógico de la primera beta

Estado: alcance técnico implementado y verificado localmente; cohorte real pendiente  
Fecha: 2026-09-26  
Ámbito: Learning Journey y Speaking Lab

## Resultado implementado

- La configuración `HANGO_BETA_LEARNING_SCOPE` deja a los participantes de
  beta en Foundations y permite restaurar el producto completo con `FULL`.
- Las cuentas de administrador conservan acceso completo para revisión y QA.
- Everyday Life y Advanced Situations permanecen visibles como vistas previas,
  pero sus capítulos, escenarios, lecciones y recomendaciones están protegidos
  también en el servidor.
- El examen de nivel se omite para la cohorte Foundations y permanece disponible
  para administradores o cuando el alcance vuelve a `FULL`.
- Speaking Lab muestra tres estaciones guiadas relacionadas con lecciones reales;
  los modos anteriores siguen intactos para administrador/QA y para `FULL`.
- La experiencia se comprobó en español e inglés y en una vista móvil de
  390 × 844 px con un alumno temporal desde onboarding hasta Speaking Lab.
- No se modificaron Han Tutor, Han Companion, el Speaking interno de Learning
  Journey, ni prompts, voz o transcripción de Han.

## 1. Decisión recomendada

La primera prueba debe validar un núcleo pequeño y bien terminado, no toda la
amplitud futura de HanGo.

- Learning Journey se presenta como un camino largo, pero la primera cohorte
  de principiantes usa solamente **Foundations**.
- **Everyday Life** y **Advanced Situations** permanecen visibles como parte
  del futuro recorrido, pero se identifican honestamente como no incluidas en
  esta primera prueba.
- Speaking Lab muestra solo tres estaciones de práctica seleccionadas. Las
  estaciones reutilizan el contenido y el motor de Shadowing existentes.
- No se elimina código, currículo, progreso ni datos. El alcance reducido se
  controla con una configuración reversible de beta.
- Han Tutor, Han Companion, el Speaking de Learning Journey y Speaking Lab
  continúan siendo cuatro superficies diferentes. Esta propuesta no modifica
  personalidad, prompts, voz, pedagogía ni transcripción de Han.

## 2. A quién se dirige la primera cohorte

La cohorte inicial debe ser deliberadamente pequeña:

- 10 a 15 personas que empiezan mandarín desde cero o casi desde cero.
- Uso principal desde teléfonos reales.
- Español o inglés como idioma de interfaz.
- Invitación explícita a una beta gratuita y limitada.

No se debe invitar todavía a una mezcla indiscriminada de principiantes,
intermedios y avanzados. Una persona avanzada a la que se le bloquea el
contenido de su nivel concluiría, correctamente, que la prueba no fue diseñada
para ella.

Después de observar a la primera cohorte se abre una segunda cohorte separada
para nivel intermedio. El nivel avanzado se prueba después de una revisión
humana específica de su currículo.

## 3. Learning Journey durante la primera beta

### 3.1 Foundations

Foundations queda disponible. Se conserva el orden secuencial que ya existe
dentro de cada escenario: la primera lección está disponible y las siguientes
se abren al completar la anterior.

La pantalla debe destacar una sola acción principal:

- **Continuar mi aprendizaje**, cuando ya existe progreso.
- **Empezar desde cero**, para una cuenta nueva.

El usuario puede explorar los escenarios de Foundations, pero la recomendación
visual siempre conduce a la siguiente lección coherente.

### 3.2 Everyday Life y Advanced Situations

Ambos capítulos siguen visibles para comunicar que HanGo acompaña al estudiante
más allá del nivel inicial. Durante esta prueba no son enlaces activos para un
alumno ordinario.

Texto sugerido:

- Insignia: **Próxima fase de la beta**.
- Explicación: **Estamos terminando de revisar este nivel antes de abrirlo a
  más estudiantes.**
- Acción secundaria: **Ver lo que aprenderás**, que abre una explicación breve
  sin permitir iniciar una lección.

No se debe decir “completa Foundations para desbloquearlo” mientras la apertura
no sea automática. La interfaz debe explicar la restricción real, no inventar
una regla de progreso.

### 3.3 Excepciones de acceso

- Administrador y cuentas internas de QA: acceso completo.
- Participantes de la primera cohorte: Foundations.
- Futuras cuentas de cohorte intermedia: Foundations y Everyday Life.
- Futuras cuentas de cohorte avanzada: acceso completo después de la revisión
  curricular correspondiente.

La restricción debe comprobarse también en el servidor. Ocultar o desactivar
una tarjeta no basta: una URL directa no debe saltarse el alcance asignado.

### 3.4 Examen de nivel

El examen no debe prometer acceso inmediato a niveles que esta cohorte no está
probando.

Para la primera cohorte de principiantes se recomienda no ofrecerlo durante el
onboarding. Las cuentas internas mantienen el acceso para QA. Cuando se abra la
cohorte intermedia, el examen vuelve a mostrarse y su recomendación respeta el
alcance asignado al participante.

## 4. Speaking Lab reducido a tres estaciones

La portada actual prioriza la conversación libre, mientras Shadowing y Scenario
Role Play están construidos pero bloqueados. Para un principiante, la práctica
libre presenta demasiadas decisiones y hace más difícil identificar qué valor
obtuvo.

La beta debe reutilizar el motor de Shadowing para ofrecer estas estaciones:

### Estación 1 — Saluda y preséntate

- Fuente: primeras lecciones de `getting-started`.
- Resultado: saludar, decir el nombre y responder una presentación sencilla.
- Disponible después de comenzar la primera lección relacionada.

### Estación 2 — Números, hora y fecha

- Fuente: lección correspondiente de `getting-started`.
- Resultado: decir un número, una hora y una fecha breve.
- Se abre al completar o comenzar esa lección.

### Estación 3 — Pregunta el precio y paga

- Fuente: `basic-shopping-asking-the-price`.
- Resultado: preguntar cuánto cuesta algo, comprender un precio y responder.
- Permanece visible con su requisito hasta que el usuario alcance esa lección.

No se duplican frases en una tabla nueva. Cada estación apunta a contenido
curricular publicado, de manera que una corrección del currículo también
actualiza la práctica.

## 5. Secuencia de cada estación

La interacción debe durar entre dos y cuatro minutos:

1. **Objetivo:** una frase que explica qué podrá hacer el estudiante.
2. **Escucha:** audio del diálogo o línea modelo ya existente.
3. **Comprende:** caracteres simplificados, pinyin visible y traducción en el
   idioma de interfaz.
4. **Repite:** grabación breve, reproducción y comparación.
5. **Intenta otra vez:** repetición voluntaria sin castigo.
6. **Cierre:** resumen sencillo de lo practicado y recomendación de la siguiente
   lección o estación.

El pinyin se mantiene porque es una ayuda necesaria para el público inicial.
Puede ocultarse voluntariamente, pero aparece por defecto en esta cohorte.

## 6. Qué queda temporalmente fuera de la portada

- Conversación libre con Han.
- Selector de las 164 lecciones publicadas.
- Shadowing de cualquier lección elegida manualmente.
- Scenario Role Play abierto.
- Modos experimentales o rutas de QA.

Estas capacidades no se borran. Las cuentas internas pueden conservar acceso y
las funciones se reabren gradualmente cuando superen su revisión.

La conversación libre puede regresar primero para una cohorte intermedia, con
una etiqueta clara de práctica libre. No sustituye las estaciones guiadas.

## 7. Estados y mensajes necesarios

Cada estación puede estar en uno de estos estados:

- **Disponible:** botón “Practicar ahora”.
- **En progreso:** botón “Continuar práctica”.
- **Completada:** marca de finalización y opción “Practicar otra vez”.
- **Aún no disponible:** muestra la lección concreta que debe alcanzarse.
- **Temporalmente no disponible:** fallo técnico; nunca se presenta como error
  del estudiante.

La ausencia de voz, ruido o una grabación demasiado corta no debe producir una
transcripción inventada ni una puntuación. Debe mostrarse: **No escuchamos una
frase clara. Inténtalo otra vez cuando quieras.**

## 8. Métricas mínimas de la prueba

### Learning Journey

- Onboarding terminado.
- Primera lección iniciada y terminada.
- Tiempo hasta completar la primera actividad útil.
- Paso exacto donde se abandona una lección.
- Retorno al día siguiente y durante la primera semana.

### Speaking Lab

- Estación mostrada, abierta y completada.
- Permiso de micrófono concedido o rechazado.
- Grabación válida, silencio detectado y error técnico.
- Número de repeticiones voluntarias.
- Finalización por estación y por dispositivo.
- Costo de transcripción o IA por práctica completada.

Los eventos no deben guardar audio ni texto adicional solo para analítica. La
retención de grabaciones continúa obedeciendo la preferencia de privacidad del
usuario.

## 9. Criterios para abrir más contenido

Everyday Life no se abre por calendario. Se abre a una cohorte intermedia cuando:

- al menos 10 principiantes completaron el recorrido observado;
- no quedan bloqueos graves en onboarding, primera lección o navegación móvil;
- las tres estaciones funcionan en Android Chrome e iPhone Safari;
- se revisaron entrevistas, abandonos, errores y costo;
- el equipo puede explicar qué hizo volver o abandonar a los participantes.

Advanced Situations requiere además una revisión humana de chino, pinyin,
traducciones, dificultad y naturalidad de una muestra completa del nivel.

La conversación libre y Scenario Role Play se liberan cuando las pruebas con
audio real confirmen que silencio, ruido, finalización, costos y feedback se
comportan de forma confiable.

## 10. Implementación por etapas

### Etapa A — Integración

- Esperar a que termine el lote visual en curso.
- Revisar el diff conjunto y guardar un punto de control limpio.
- No implementar el modo beta sobre archivos que todavía estén cambiando.

### Etapa B — Control reversible de alcance

- Añadir una configuración de alcance de beta.
- Aplicarla a portada, capítulos, rutas directas y acción “Continuar”.
- Añadir acceso completo para administrador/QA.
- Cubrir las reglas con pruebas de acceso.

### Etapa C — Portada de estaciones

- Reutilizar Shadowing y el contenido curricular existente.
- Mostrar únicamente las tres estaciones seleccionadas.
- Mantener el selector completo y otros modos fuera de la experiencia pública.

### Etapa D — Calidad

- Español e inglés completos.
- Pruebas en 360, 390 y 430 px, además de escritorio.
- Android Chrome e iPhone Safari reales.
- Teclado, lector de pantalla, contraste, permisos y zonas seguras.
- Prueba explícita de silencio y ruido para impedir transcripciones falsas.

### Etapa E — Lanzamiento controlado

- Invitar la cohorte de principiantes.
- Observar las primeras sesiones y realizar entrevistas breves.
- Revisar activación, aprendizaje, problemas, retorno y costo antes de ampliar.

## 11. Criterios de aceptación técnicos y de producto

- Un participante de la primera cohorte no abre Everyday Life o Advanced
  Situations mediante la interfaz ni mediante una URL directa.
- Una cuenta autorizada de QA sí puede probar los tres capítulos.
- “Continuar” nunca recomienda contenido fuera del alcance del usuario.
- Speaking Lab público muestra exactamente tres estaciones y ninguna ruta de
  prueba.
- Cada estación usa caracteres simplificados, pinyin y traducción correcta.
- Silencio o audio no inteligible no genera texto, puntuación ni progreso.
- Las tres estaciones pueden completarse con una mano en una pantalla de 360
  px sin solapamientos.
- El alcance puede desactivarse sin restaurar código borrado ni migrar datos.
- Ninguna modificación alcanza los prompts o el comportamiento de Han Tutor,
  Han Companion o el Speaking interno de las lecciones.

## 12. Decisiones que deben aprobarse antes de programar

1. Confirmar que la primera cohorte estará formada principalmente por
   principiantes.
2. Confirmar las tres estaciones propuestas.
3. Confirmar que los capítulos posteriores se mostrarán como próximas fases de
   beta, no como recompensas desbloqueables todavía.
4. Confirmar que la conversación libre queda fuera de la portada pública
   inicial, pero no se elimina.

## 13. Estado de implementación

Implementado y verificado al 27 de septiembre de 2026:

- `FOUNDATIONS_ONLY` es el alcance predeterminado y puede revertirse con
  `HANGO_BETA_LEARNING_SCOPE=FULL`.
- Everyday Life y Advanced permanecen visibles como próximas etapas, pero no se
  pueden abrir mediante tarjetas, continuidad ni URL directa en la cohorte.
- Las cuentas administrativas y de QA conservan acceso completo.
- Speaking Lab de beta muestra exactamente tres estaciones curriculares con
  caracteres, pinyin y traducción; la experiencia completa no fue eliminada.
- Han Tutor, Han Companion, los prompts, la voz, la transcripción y el Speaking
  interno de Learning Journey no fueron modificados.
- Pruebas unitarias, de componentes, accesibilidad e integración completadas;
  la suite de integración terminó en 296/296.
- El crédito masivo del examen de nivel conserva su idempotencia y redujo su
  prueba enfocada de 331 a 86 segundos mediante escrituras y recompensas por
  lotes.

Quedan fuera del cierre de código: comprobación en Android/iPhone físicos,
dominio HTTPS de beta, revisión lingüística humana y ejecución de la cohorte.
