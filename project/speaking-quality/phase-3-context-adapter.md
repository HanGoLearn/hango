# Conexión del contexto congelado con el candidato de calidad

18 de octubre de 2026. Ingeniería offline; no activación productiva.

`src/lib/journey-speaking-quality-context.ts` prepara el contexto del candidato
a partir de un snapshot y una captura del mismo intento. Es una función pura;
no busca registros, envía audio/texto, genera juicios, guarda datos ni calcula notas.
Su entrada debe venir de una lectura autorizada del servidor. Comprobar igualdad
de IDs no sustituye autenticar al usuario ni comprobar propiedad en la base.

## Reglas

- Identidad de intento, lección y banco coherente. Conserva idioma ES/EN.
- Recursos separados por tipo e ID original; deduplicación de entradas repetidas
  entre buckets sin fusionar homógrafos de registros distintos. Ante identidad
  contradictoria, rechazo; no se escoge arbitrariamente una versión.
- Vocabulario/gramática core, apoyo y extensión son oportunidades opcionales,
  nunca una cuota de uso o prueba de dominio. Recursos solo del personaje se
  excluyen. Los actos requeridos necesitan selección editorial explícita limitada
  a las condiciones de éxito congeladas; sin selección no se impone un checklist.
- Valida límites de captura, autores y metadatos de reconocimiento con el contrato
  existente. Conserva contenido e hipótesis originales sin sustituirlos; rechaza
  normalización silenciosa, IDs/secuencias duplicados o secuencias inválidas.
- Ordena por secuencia sin mutar ni compartir referencias con la entrada.
- Captura sin metadatos de cierre completos, con turno del estudiante pendiente,
  abandono o fallo técnico no se declara completa. Interrumpir al personaje por sí
  solo no significa que falte intervención del estudiante. Completo técnicamente
  tampoco significa suficiente evidencia pedagógica ni audio verificable.

## Verificación y límites

21 pruebas nuevas, incluyendo recorrido adaptador → inspector con candidato
ficticio: separa criterios y conserva `score=null`, sin elegibilidad de recompensas.
Lote adaptador/candidato/baseline: 72/72 pasan. Regresión unitaria completa:
1.550/1.550 pruebas en 120 archivos. Tipos, lint dirigido y diff pasan.

No hay consumidor de aplicación: el adaptador solo se ejecuta en su prueba.
No cambia evaluador v2, prompts, informes anteriores, General Level o Vercel.
No se importó configuración de producción, no se grabó voz ni se consumió OpenAI.

Pendiente para conectar a un juicio nuevo real: revisión editorial de selección de
objetivos, generación de candidato versionado, revisión de idioma/semántica,
calibración docente, política de audio/consentimiento/coste y almacenamiento seguro
de resultados compatibles. No añadir automáticamente una segunda llamada de IA
por intento ni presentarlo como calificación acústica o mejora validada de precisión.
