# Propuesta visual de reflexión — 18 de octubre de 2026

Estado: diseño aprobado e integrado localmente en el informe v2. Sin publicación.

## Alcance

Ruta `/es/reflection-design` y equivalente EN, solo en development; producción devuelve notFound. No reemplaza el informe activo ni `/speaking-preview`. No lee cuentas, conversa, captura audio, invoca proveedores, guarda resultados o concede recompensas. Los datos, intervenciones y mediciones acústicas son ficticios y se identifican en pantalla. Los prototipos de las entregas 2/3 no generan estas cifras.

## Estructura propuesta

1. Resumen con identidad de HanGo, nota de lección y estrellas de ejemplo.
2. Resultados separados de vocabulario, gramática, comprensión y conversación, con aciertos y contribución.
3. Seis variables de Speaking visibles, con nivel, aporte y explicación desplegable por clic/teclado: comunicación, vocabulario, gramática, pronunciación/tonos, interacción/autonomía y fluidez.
4. Logros con evidencia concreta y una nota de Han referida a una intervención, no elogio genérico.
5. Prioridades limitadas: original, alternativa, pinyin, traducción y explicación útil para el siguiente intento.
6. Próximo intento breve, sin botones falsos de grabación o repetición.

Pesos ilustrativos de Speaking: 20/15/20/25/10/10. No son umbrales calibrados ni sustituyen las reglas activas. La nota de lección conserva la propuesta 20/20/30/30 entre ejercicios y Speaking; no se aplica a datos reales.

Tres estados: aspectos por mejorar (Speaking 64, global 84), buen desempeño (94 y 98) y audio sin evaluar (sin nota global/estrellas, sin redistribuir pesos ni inventar error tonal). Un caso correcto ofrece ampliación, no una corrección artificial.

## Comprobaciones

- Suite previa al último ajuste: 1.752 pruebas unitarias/componentes en 156 archivos pasan.
- Tras añadir localización de decimales y cobertura de tema claro: 16/16 pruebas dirigidas en tres archivos pasan. Incluyen aritmética, ruta cerrada en producción, estados, pinyin, ausencia de peticiones y accesibilidad automatizada del ejemplo ES completo y parcial claro.
- Typecheck y lint dirigido pasan; formato y diff sin errores.
- Navegador local: ES/EN, oscuro/claro, selección de tres estados y despliegue de criterio comprobados. Anchuras 320/390/768/1440 sin desbordamiento horizontal. Ajuste de cabecera móvil para no separar estrellas/nota en filas.
- Esto es emulación de dimensiones, no prueba en teléfonos reales ni certificación completa de accesibilidad. No se ejecutó build/publicación en este bloque.
- Captura de revisión local en `.codex-tmp/reflection-design-criteria.png`, excluida de Git.

## Pendiente

Aprobación visual del usuario; captura/consentimiento/presupuesto y calibración humana; conectar contrato validado con informe real, persistencia, recuperación, puntuación y recompensas; QA de dispositivos y despliegue autorizado. La mejora de precisión del evaluador no se deduce de esta propuesta visual ni de sus fixtures.

## Aplicación aprobada

El usuario aprobó el diseño y pidió aplicarlo. `JourneyFinalReport` ahora utiliza
la estructura visual en los resultados reales v2 (cierre y reapertura). La ruta
de diseño continúa siendo una propuesta ficticia; no es el origen de los datos.

- Cabecera verde, estrellas y cuatro tarjetas con notas/aciertos reales.
- Criterios visibles con aporte calculado usando las constantes del evaluador
  activo: comunicación 40%, uso del idioma 30%, interacción 20%, autonomía 10%.
  Evidencias exactas desplegables; no se sustituyen ordinales ni notas guardadas.
- Pronunciación/tonos y fluidez acústica se identifican sin evaluar. El contrato
  activo no separa vocabulario/gramática: se explica, sin inventar seis notas.
- Logro, comentario de Han, prioridad y ejemplo con chino/pinyin/traducción,
  próximo intento. Usa exclusivamente feedback guardado, sin regeneración.
- Conserva estados técnicos/pendientes/parciales, detalle de respuestas y estado
  de recompensas. No modifica `JourneyReportPanel`, acciones o persistencia.
- No toca Han burbuja, Companion, Speaking Lab ni el informe legacy.

Verificación: 1.757 pruebas unitarias/componentes en 156 archivos pasan,
incluyendo pruebas de acciones sin evaluación automática y accesibilidad ES/EN.
Tipos/lint dirigido pasan. Navegador: informe integrado con fixture identificado,
escritorio y ancho 390; sin desbordamiento observado. Captura local ignorada
`.codex-tmp/reflection-integrated.png`. No se verificó con una nueva conversación
pagada, no se ejecutó build mientras el servidor de desarrollo estaba activo,
ni se publicó en GitHub/Vercel. Quedan pendientes las etapas de calibración/audio,
nuevo contrato lingüístico, revisión real en dispositivos y publicación.
