# P1-09 — Entrevistas, síntesis cualitativa y recomendaciones (borrador)

Estado: **preguntas y plantillas listas para usar cuando exista una cohorte real**
Responsable de este borrador: Claude (P1-09, `PLAN_BETA_CERRADA_FASE_1.md`)
Fecha: 2026-09-19

División de trabajo (recordatorio): Codex se encarga de métricas, costos,
incidentes y la decisión técnica de ampliar/pausar. Yo preparo entrevistas,
síntesis cualitativa y recomendaciones de experiencia — todo lo que viene de
hablar con personas, no de leer dashboards.

La guía de participantes (qué probar, qué es beta, cómo reportar) ya está en
`beta-p1-06-comunicacion-feedback-soporte-borrador.md` — no la repito aquí
para no tener dos versiones que se desactualicen distinto.

## 1. Cuándo usar esto

Según `PLAN_BETA_CERRADA_FASE_1.md`, P1-09 es la Entrega 5 (apertura gradual
de la cohorte) — esto sirve para la Ola 1 en adelante (3-5 personas), no
para Ola 0 (el propietario y dos cuentas de prueba). No hay nadie real
todavía a quien entrevistar; esto queda listo para ese momento.

## 2. Consentimiento antes de entrevistar

El plan es explícito: "Entrevistar una muestra con consentimiento; no grabar
por defecto." Antes de cualquier entrevista:

- Pedir permiso explícito para tomar notas (y, solo si lo autorizan
  expresamente, para grabar).
- Explicar que es voluntario, que pueden saltarse cualquier pregunta, y que
  sus respuestas se usan de forma anónima en cualquier reporte (no se cita
  con nombre sin su permiso).
- Si se graba, decir cuánto tiempo se conserva la grabación y borrarla
  después de transcribir/sintetizar, salvo que pidan lo contrario.

## 3. Guion de entrevista (15-20 minutos, semi-estructurado)

Diseñado para escuchar más que para confirmar hipótesis — preguntas
abiertas primero, específicas después. Traducir a inglés si el participante
lo prefiere; mismo guion, no versión reducida.

### Apertura (romper el hielo, 2 min)
1. ¿Hace cuánto empezaste a usar HanGo, y con qué frecuencia lo abriste?
2. Antes de esto, ¿habías estudiado chino de alguna otra forma? ¿Cuál?

### Primera impresión y activación (3-4 min)
3. Cuéntame cómo fue la primera vez que abriste la app — ¿qué esperabas
   encontrar, y qué encontraste?
4. ¿Hubo algún momento, en esos primeros minutos, donde no supieras qué
   hacer o dónde ir? ¿Qué pasó ahí?
5. ¿Recuerdas cuál fue tu primera "victoria" — el primer momento en que
   sentiste que estabas realmente aprendiendo algo?

### Aprendizaje y uso real (5-6 min)
6. Describe una sesión típica tuya usando HanGo — ¿qué haces primero, qué
   haces después?
7. ¿Qué parte de la app usaste más? ¿Por qué esa y no otra?
8. Cuéntame sobre alguna vez que hablaste con Han. ¿Cómo fue esa
   experiencia? ¿Sentiste que te entendía?
9. Si usaste Speaking Lab o la práctica oral de una lección: ¿cómo se sintió
   hablar chino en voz alta con la app? ¿Te dio confianza o te generó
   nervios?
10. ¿Hubo algo que aprendiste con HanGo que después usaste o recordaste
    fuera de la app?

### Fricción y problemas (4-5 min)
11. ¿Hubo algún momento en que algo no funcionó como esperabas? Cuéntame qué
    pasó.
12. ¿Hubo algo que te resultó confuso, aunque técnicamente "funcionara"?
13. Si usaste el celular: ¿hubo algo que se viera mal, se cortara, o fuera
    difícil de tocar con el dedo?
14. ¿En algún momento pensaste en dejar de usar la app? ¿Qué te hizo
    quedarte (o qué te hizo alejarte)?

### Cierre y recomendación (2-3 min)
15. Si tuvieras que explicarle a un amigo qué es HanGo en una frase, ¿qué
    dirías?
16. ¿Se lo recomendarías a alguien? ¿A quién específicamente, y por qué (o
    por qué no)?
17. Si pudieras cambiar o agregar una sola cosa, ¿cuál sería?
18. ¿Algo más que quieras contarme que no te haya preguntado?

## 4. Plantilla de síntesis cualitativa (llenar después de cada ronda)

Copiar esta estructura por cada ola de entrevistas.

```markdown
## Síntesis cualitativa — Ola [N] — [fecha]

**Participantes entrevistados:** [N] de [N] invitados en esta ola
**Duración promedio de entrevista:** [minutos]

### Temas repetidos (mencionados por 2+ personas)
- [Tema 1]: [breve descripción + cuántas personas lo mencionaron]
- [Tema 2]: ...

### Citas representativas (anónimas salvo autorización expresa)
- "[cita textual]" — Participante [A]
- "[cita textual]" — Participante [B]

### Momentos de fricción identificados
| Dónde ocurrió | Qué pasó | Cuántos lo vivieron | Severidad (alta/media/baja) |
| --- | --- | --- | --- |
|     |     |     |     |

### Momentos de valor / "aha" identificados
| Dónde ocurrió | Qué sintió la persona | Cuántos lo vivieron |
| --- | --- | --- |
|     |     |     |

### Recomendaciones de experiencia (mías, basadas en lo anterior)
1. [Recomendación concreta, accionable, priorizada]
2. ...

### Lo que NO cambiaría (validado positivamente por la cohorte)
- [Elemento que funcionó bien, para no tocarlo sin razón]
```

## 5. Cómo se conecta esto con el resto del plan

- Las recomendaciones de experiencia de esta síntesis pueden convertirse en
  correcciones responsive (si son de diseño/móvil, dentro de mi alcance
  después de que Codex estabilice el backend) o en pedidos hacia Codex (si
  tocan datos, backend o autenticación).
- La decisión de ampliar, pausar o corregir antes de la siguiente ola
  (`LAUNCH-06` / criterio de pausa de `PLAN_BETA_CERRADA_FASE_1.md` sección
  8) la toma el usuario con esta síntesis más los datos técnicos de Codex —
  yo no decido eso solo.
