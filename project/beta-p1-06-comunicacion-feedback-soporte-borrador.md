# P1-06 — Experiencia, textos y guía de comunicación con la cohorte

Estado: **implementado el 2026-09-27; publicación de la bienvenida pendiente de la cohorte**
Responsable de este borrador: Claude (P1-06, `PLAN_BETA_CERRADA_FASE_1.md`)
Fecha: 2026-09-19

División de trabajo (recordatorio del plan): Codex construye el modelo de
datos, las actions, la autorización y la bandeja administrativa. Yo diseño
la experiencia visual/textual: el mensaje de bienvenida, el formulario de
feedback, el mensaje de soporte y la guía para participantes. Nada de este
documento está conectado todavía — son especificación y copy para revisar.

## 1. Mensaje de bienvenida (reutiliza el sistema de anuncios existente)

El plan pide reutilizar `Announcement` (ya existe: `title`, `message`,
`status`, `startsAt`, `endsAt`, `createdByUserId`) en vez de construir algo
nuevo. Esto es solo el **contenido** de ese anuncio, listo para que Codex lo
cargue cuando P1-01/P1-02 estén cerrados.

### Español

**Título:** ¡Bienvenido a la beta cerrada de HanGo! 🎉

**Mensaje:**
Gracias por ser parte de este primer grupo. Estás probando una versión que
todavía se está terminando de pulir — puede que encuentres errores o cosas
que no se sientan perfectas, y tu ayuda para encontrarlos es exactamente lo
que necesitamos.

Un par de cosas antes de empezar:

- Puedes reportar cualquier problema desde el botón de feedback dentro de la
  app, en cualquier momento.
- Tu progreso y tus datos de esta beta son solo tuyos — no se comparten con
  nadie fuera del equipo de HanGo.
- Si algo deja de funcionar, no es tu culpa — cuéntanos y lo revisamos.

Empieza por completar tu perfil inicial y prueba tu primera lección.
¡Disfruta aprendiendo chino!

### English

**Title:** Welcome to the HanGo closed beta! 🎉

**Message:**
Thanks for being part of this first group. You're trying a version that's
still being polished — you might run into bugs or things that don't feel
perfect yet, and your help finding them is exactly what we need.

A couple of things before you start:

- You can report any problem from the feedback button inside the app, at
  any time.
- Your progress and data from this beta are yours alone — they're not
  shared with anyone outside the HanGo team.
- If something breaks, it's not you — tell us and we'll look into it.

Start by completing your initial profile and trying your first lesson.
Enjoy learning Chinese!

## 2. Formulario de feedback — diseño de experiencia

Campos que el plan define para el modelo de datos (Codex): categoría,
puntuación opcional, mensaje, ruta, idioma, usuario. Esto es cómo se ve y se
siente para quien lo llena — pensado para completarse **en menos de un
minuto desde el celular** (criterio de salida de P1-06).

### Punto de entrada

Un botón/ícono de feedback siempre visible y de fácil alcance con el pulgar
en móvil — sugiero integrarlo junto al ícono de Han flotante o en el menú de
Configuración, no como una pantalla nueva separada de todo lo demás.
Decisión final de ubicación exacta la toma quien implemente, pero debe
cumplir: alcanzable con una mano, visible en cualquier pantalla de la app
autenticada.

### Categorías propuestas (para el campo "categoría")

Alineadas con las superficies reales de la app, no genéricas:

- 🐛 Encontré un error / algo no funciona
- 💡 Tengo una idea o sugerencia
- 😕 Algo fue confuso o difícil de usar
- 📚 Sobre el contenido de una lección (chino, pinyin, traducción)
- 🗣️ Sobre Han (Tutor, Companion, Speaking Lab)
- ⭐ Otro comentario

### Estructura del formulario

1. **¿Qué tipo de comentario es?** (las categorías de arriba, selección
   única, con ícono — fácil de tocar).
2. **¿Cómo calificarías tu experiencia hasta ahora?** (opcional,
   1-5, con emojis o estrellas — nunca obligatorio, un usuario debe poder
   enviar sin calificar).
3. **Cuéntanos más** (campo de texto libre, obligatorio, placeholder: "Describe
   lo que pasó o tu idea..." — sin mínimo de caracteres estricto, para no
   frustrar a alguien que solo quiere decir "esto no cargó").
4. Botón **Enviar** grande, de fácil alcance táctil.
5. Confirmación clara después de enviar: "¡Gracias! Lo revisaremos pronto." —
   sin redirigir a otra pantalla, para no perder el hilo de lo que el
   usuario estaba haciendo.

La ruta actual (`pathname`) y el idioma de interfaz se capturan
automáticamente, sin pedírselo al usuario — esto ya es dato disponible en el
servidor (mismo patrón que otras acciones de esta app), no algo que la
persona deba escribir.

### Qué NO incluir en esta primera cohorte (por decisión explícita del plan)

- Adjuntar archivos o capturas de pantalla.
- Campos obligatorios de puntuación.
- Cualquier paso adicional después de enviar (mantenerlo en un solo envío).

## 3. Soporte

### Texto para mostrar dentro de la app (Configuración o pantalla de ayuda)

**Español:**
"¿Necesitas ayuda o encontraste un problema? Escríbenos a
`arean.mendoza@unmsm.edu.pe`. Normalmente respondemos en
un máximo de 2 días hábiles durante la beta cerrada."

**English:**
"Need help or found a problem? Write to us at
`arean.mendoza@unmsm.edu.pe`. We usually reply within
2 business days during the closed beta."

El correo ya está definido: el usuario autorizó (2026-09-20) usar
`arean.mendoza@unmsm.edu.pe` como correo temporal de soporte y privacidad
para esta beta cerrada — mismo correo usado en P1-02, para no tener dos
fuentes de verdad distintas del mismo dato. Reemplazarlo antes de un
lanzamiento público. Para la primera cohorte se adopta un compromiso inicial
de hasta 2 días hábiles; puede ajustarse antes de enviar invitaciones.

## 4. Guía breve para participantes (qué probar, qué es beta, cómo reportar)

Pensada para enviarse por correo junto a la invitación, y/o vivir dentro de
la app como una pantalla corta. Una sola versión que sirve para ambos usos.

### Español

**Guía rápida de la beta de HanGo**

Estás probando una versión temprana de HanGo, antes de que esté disponible
para más personas. Esto es lo que necesitas saber:

**¿Qué es una beta cerrada?**
Es una versión funcional pero todavía en ajuste. Puede tener errores,
funciones limitadas o cambios de un día a otro. Tu opinión ayuda a decidir
qué mejorar antes de abrirlo a más gente.

**Qué te pedimos que pruebes:**

1. Regístrate y completa el perfil inicial (onboarding).
2. Empieza en Fundamentos desde cero y abre tu primera lección.
3. Completa al menos una lección completa, incluyendo su parte de práctica
   oral si tu dispositivo tiene micrófono.
4. Habla con Han (el tutor) al menos una vez — pregúntale algo sobre lo que
   acabas de aprender.
5. Si tienes un momento libre, explora una de las tres estaciones guiadas de
   Speaking Lab o prueba Writing Lab.

**Cómo reportar un problema:**
Usa el botón de feedback dentro de la app en cualquier momento — no hace
falta esperar a "terminar de probar todo". Entre más pronto nos cuentes,
más rápido lo podemos revisar. Si algo te impide continuar por completo,
también puedes escribirnos directamente a `arean.mendoza@unmsm.edu.pe`.

**Qué NO es esta beta:**
No es la versión final. No tiene todo el contenido. No debes compartir tu
acceso con nadie más — es personal, por invitación.

Gracias por probar HanGo con nosotros. 🙏

### English

**HanGo beta quick guide**

You're trying an early version of HanGo, before it's available to more
people. Here's what you need to know:

**What is a closed beta?**
It's a working version that's still being adjusted. It may have bugs,
limited features, or day-to-day changes. Your feedback helps decide what
to improve before opening it up to more people.

**What we're asking you to try:**

1. Register and complete the initial profile (onboarding).
2. Start from zero in Foundations and open your first lesson.
3. Complete at least one full lesson, including its speaking practice part
   if your device has a microphone.
4. Talk to Han (the tutor) at least once — ask about something you just
   learned.
5. If you have a free moment, explore one of the three guided Speaking Lab
   stations or try Writing Lab.

**How to report a problem:**
Use the feedback button inside the app at any time — no need to wait until
you're "done testing everything." The sooner you tell us, the faster we can
look into it. If something completely blocks you, you can also write
directly to `arean.mendoza@unmsm.edu.pe`.

**What this beta is NOT:**
It's not the final version. It doesn't have all the content yet. Don't
share your access with anyone else — it's personal, invitation-only.

Thank you for trying HanGo with us. 🙏

## 5. Implementación cerrada

- `BetaFeedback` guarda categoría, puntuación opcional, mensaje, ruta, idioma,
  usuario, estado y seguimiento administrativo; no acepta adjuntos.
- El botón Feedback permanece accesible en la aplicación autenticada y abre
  un formulario de una sola pantalla. En móvil queda a la izquierda, separado
  de Han, y en escritorio en la esquina inferior izquierda.
- El usuario ve sus cinco reportes recientes y cualquier respuesta del equipo.
- `/admin/feedback` permite filtrar por nuevo, revisando o resuelto, responder
  al usuario y guardar una nota interna.
- Configuración muestra el correo temporal de soporte y el compromiso de
  respuesta. Los anuncios ahora pueden dirigirse a español, inglés o ambos.
- Antes de abrir la cohorte solo falta crear/publicar los dos anuncios de
  bienvenida con el contenido de la sección 1 y comprobar el recorrido en un
  teléfono físico autenticado.
