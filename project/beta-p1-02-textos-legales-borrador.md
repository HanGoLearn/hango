# P1-02 — Borradores: aviso de beta, privacidad, términos y aviso de IA

Estado: **borrador para revisión del usuario, no implementado**
Responsable de este borrador: Claude (P1-02, `PLAN_BETA_CERRADA_FASE_1.md`)
Fecha: 2026-09-19

## Cómo usar este documento

- Este archivo es solo texto. No wire técnico, no checkbox, no persistencia de
  consentimiento — eso es `P1-02` del lado de Codex.
- Todo lo marcado `[COMPLETAR: ...]` es un dato que no puedo inventar (razón
  social, dirección, jurisdicción, edad mínima del mercado, correo real). El
  usuario debe rellenarlo antes de publicar cualquier versión de estos textos.
- El contenido describe lo que la aplicación **realmente hace hoy**, verificado
  contra el código (proveedor de IA, retención configurable, borrado de cuenta,
  qué se graba y por qué), no una plantilla genérica de política de privacidad.
- Esta redacción es operativa para una beta cerrada de 10–30 personas
  invitadas. **Necesita revisión jurídica antes de cualquier lanzamiento
  público**, tal como indica `PLAN_BETA_CERRADA_FASE_1.md` P1-02.
- Cuatro documentos, cada uno en español e inglés: Aviso de Beta, Aviso de Uso
  de IA, Privacidad, Términos.

## Hechos verificados en el código que sustentan este borrador

- **Proveedor único de IA: OpenAI.** Se usa para el texto de Han Tutor/Han
  Companion, generación de voz (TTS), transcripción de voz (Whisper/STT) y la
  conversación oral en tiempo real de Speaking Lab/Speaking de Learning
  Journey (Realtime API).
- **Retención de grabaciones configurable por el usuario** (Configuración →
  Privacidad): nunca conservar, 7, 30, 90, 365 días, o indefinidamente hasta
  que el usuario decida. Un proceso automático borra lo vencido.
- **Guardar el historial de conversación con Han es una preferencia
  activable/desactivable** por el usuario (no se ve el nombre exacto del
  campo en un texto para usuarios, solo que existe el control).
- **Borrado de cuenta**: elimina las filas asociadas en la base de datos y
  encola el borrado de los archivos privados (audio, fotos de escritura) en
  un proceso de limpieza, no instantáneo pero garantizado por reintento.
- **Analítica**: uso interno propio (qué superficie se usa, cuánto tiempo,
  qué operaciones de IA se ejecutan y su costo aproximado) para operar y
  mejorar el producto — no hay trackers de terceros de publicidad.
- **Correo**: usado para verificación de cuenta y recuperación de contraseña
  (proveedor Resend, según `PLAN_BETA_CERRADA_FASE_1.md`).
- **Beta cerrada**: acceso solo por invitación, datos aislados del entorno de
  desarrollo, sin indexación en buscadores.

---

## 1. Aviso de Beta / Beta Notice

### 1.1 Español

**Estás usando una versión beta cerrada de HanGo**

HanGo está en fase de prueba cerrada con un grupo reducido de personas
invitadas. Esto significa:

- Puede haber errores, interrupciones o cambios sin aviso previo.
- Algunas funciones pueden estar limitadas, deshabilitadas temporalmente o
  comportarse de forma distinta a como se comportarán en la versión final.
- Tu acceso es personal e intransferible; fue otorgado por invitación y puede
  ser revocado si detectamos uso indebido o si la fase de prueba termina.
- Tus datos de esta beta **no se combinan** con ningún otro entorno o
  producto. Si en el futuro lanzamos una versión pública, te avisaremos antes
  de migrar o conservar cualquier dato tuyo, y podrás elegir no continuar.
- Puedes dejar de participar en cualquier momento y pedir que se borre tu
  cuenta y tus datos (ver la Política de Privacidad).
- Existe un presupuesto limitado para las funciones de inteligencia
  artificial de esta beta. Si el uso colectivo se acerca al límite, algunas
  funciones de IA podrían pausarse temporalmente; te lo indicaremos dentro de
  la aplicación.
- Tu opinión es esencial: puedes enviar feedback directamente desde la
  aplicación en cualquier momento.

Contacto de soporte y privacidad: `arean.mendoza@unmsm.edu.pe` (correo
temporal para esta beta cerrada, autorizado por el usuario el 2026-09-20)

### 1.2 English

**You are using a closed beta version of HanGo**

HanGo is in a closed testing phase with a small group of invited people. This
means:

- There may be bugs, interruptions, or changes without advance notice.
- Some features may be limited, temporarily disabled, or behave differently
  than they will in the final version.
- Your access is personal and non-transferable; it was granted by invitation
  and may be revoked if we detect misuse or when the testing phase ends.
- Your data from this beta is **never combined** with any other environment
  or product. If we launch a public version in the future, we will notify you
  before migrating or keeping any of your data, and you will be able to opt
  out.
- You can stop participating at any time and request that your account and
  data be deleted (see the Privacy Policy).
- This beta operates under a limited AI budget. If collective usage
  approaches that limit, some AI features may be paused temporarily; we will
  show this inside the app.
- Your feedback matters: you can send it directly from the app at any time.

Support and privacy contact: `arean.mendoza@unmsm.edu.pe` (temporary email
for this closed beta, authorized by the user on 2026-09-20)

---

## 2. Aviso de Uso de IA / AI Usage Notice

### 2.1 Español

**Cómo usa HanGo la inteligencia artificial**

HanGo usa inteligencia artificial de OpenAI para enseñarte chino de forma
conversacional. Es importante que sepas exactamente qué se procesa:

**Texto.** Cuando conversas con Han (tutor lateral o Han Companion), escribes
en un ejercicio o pides una explicación, ese texto se envía a OpenAI para
generar la respuesta pedagógica. No se usa para entrenar los modelos
generales de OpenAI (según la política de la API de OpenAI vigente para
clientes de API, distinta de sus productos de consumo).

**Voz.** Si usas Speaking Lab o la práctica oral de una lección:

- Tu audio se envía a OpenAI para transcribirlo (convertir voz a texto) y,
  en las conversaciones orales en tiempo real, para sostener la conversación
  y evaluar tu producción oral.
- La voz de Han que escuchas es generada por OpenAI (texto a voz), no es una
  grabación de una persona real.
- Puedes elegir cuánto tiempo se conserva tu audio grabado (nunca, 7, 30, 90,
  365 días o indefinidamente) desde Configuración → Privacidad.

**Conversaciones.** Puedes decidir si HanGo guarda el historial de tus
conversaciones con Han para darte continuidad (por ejemplo, para que Han
recuerde contexto de una sesión a otra) o si prefieres que no se guarde. Este
es un ajuste que tú controlas.

**Lo que la IA no hace:** no toma decisiones automáticas que te nieguen
acceso a la beta, no se usa para publicidad, y no comparte tu contenido con
terceros distintos del proveedor necesario para prestar el servicio (OpenAI).

**Errores de la IA:** Han puede cometer errores, malinterpretar tu chino o dar
explicaciones imprecisas. Es una herramienta de aprendizaje, no un profesor
certificado ni una fuente de verdad absoluta sobre el idioma.

### 2.2 English

**How HanGo uses artificial intelligence**

HanGo uses OpenAI's artificial intelligence to teach you Chinese
conversationally. Here is exactly what gets processed:

**Text.** When you chat with Han (the side tutor or Han Companion), write an
exercise answer, or ask for an explanation, that text is sent to OpenAI to
generate the pedagogical response. It is not used to train OpenAI's general
models (per OpenAI's current API-customer policy, which differs from their
consumer products).

**Voice.** If you use Speaking Lab or a lesson's speaking practice:

- Your audio is sent to OpenAI to be transcribed (speech to text) and, in
  real-time voice conversations, to hold the conversation and assess your
  spoken production.
- Han's voice that you hear is generated by OpenAI (text to speech) — it is
  not a recording of a real person.
- You can choose how long your recorded audio is kept (never, 7, 30, 90, 365
  days, or indefinitely) from Settings → Privacy.

**Conversations.** You can decide whether HanGo saves your conversation
history with Han to give you continuity (so Han can remember context between
sessions) or whether you'd rather it isn't saved. This is a setting you
control.

**What the AI does not do:** it does not make automated decisions that deny
you access to the beta, it is not used for advertising, and your content is
not shared with any third party other than the provider necessary to deliver
the service (OpenAI).

**AI mistakes:** Han can make mistakes, misread your Chinese, or give
imprecise explanations. It is a learning tool, not a certified teacher or an
absolute source of truth about the language.

---

## 3. Política de Privacidad / Privacy Policy

### 3.1 Español

**Política de Privacidad — beta cerrada de HanGo**
Última actualización: `[COMPLETAR: fecha de publicación]`

**Quién procesa tus datos.** `[COMPLETAR: razón social o nombre del
responsable]`, contacto: `arean.mendoza@unmsm.edu.pe` (correo temporal
para esta beta cerrada).

**Qué datos recopilamos:**

- Datos de cuenta: correo electrónico, contraseña (almacenada de forma
  cifrada, nunca en texto plano), nombre para mostrar.
- Datos de aprendizaje: tu progreso, nivel, resultados del examen de
  ubicación, respuestas a ejercicios, escenarios y lecciones completadas.
- Contenido generado por ti: texto que escribes en ejercicios, escritura
  libre, y —si lo activas— historial de conversaciones con Han.
- Voz: grabaciones de audio de Speaking Lab y práctica oral, y su
  transcripción, según tu preferencia de retención.
- Uso de la aplicación: qué funciones usas, tiempo de actividad y errores
  técnicos, para operar y mejorar el producto.
- Feedback que envíes voluntariamente desde la aplicación.

**Qué NO recopilamos:** no pedimos documento de identidad, ubicación precisa,
contactos de tu teléfono, ni acceso a otras apps. No usamos rastreadores
publicitarios de terceros.

**Con quién se comparte:**

- OpenAI (Estados Unidos), como proveedor de inteligencia artificial de
  texto y voz — ver el Aviso de Uso de IA.
- `[COMPLETAR: proveedor de correo, ej. Resend]`, para enviarte correos de
  verificación y recuperación de contraseña.
- `[COMPLETAR: proveedor de almacenamiento en la nube]`, para guardar tus
  grabaciones de audio de forma privada.
- No vendemos tus datos a nadie, bajo ninguna circunstancia.

**Cuánto tiempo conservamos tus datos:**

- Grabaciones de voz: según lo que elijas en Configuración → Privacidad
  (nunca, 7, 30, 90, 365 días, o indefinidamente). Un proceso automático
  elimina lo vencido.
- Historial de conversaciones con Han: mientras mantengas activada esa
  preferencia; puedes desactivarla y/o pedir su borrado en cualquier momento.
- Datos de cuenta y progreso: mientras tu cuenta esté activa.
- Copias de seguridad de la base de datos: `[COMPLETAR: política de
  retención de backups del proveedor elegido]`.

**Tus derechos:**

- Acceder a tus datos, corregirlos o pedir una copia.
- Eliminar tu cuenta desde Configuración. Esto borra tus datos de la base de
  datos y encola el borrado de tus archivos privados (audio, imágenes); el
  borrado de archivos puede tardar un poco pero está garantizado con
  reintentos automáticos.
- Retirar tu consentimiento y dejar de participar en la beta en cualquier
  momento.
- Escribir a `arean.mendoza@unmsm.edu.pe` para cualquier solicitud
  relacionada con tus datos.

**Seguridad.** Tu contraseña se almacena cifrada. Las conexiones a HanGo usan
HTTPS. Tus grabaciones de audio son privadas: solo tú puedes acceder a ellas
a través de tu sesión autenticada.

**Menores de edad.** `[COMPLETAR: edad mínima para esta beta según el
mercado/jurisdicción — no se define en este borrador porque depende de una
decisión legal/de producto]`.

**Cambios a esta política.** Si cambiamos algo importante de esta política
durante la beta, te lo notificaremos dentro de la aplicación y te pediremos
aceptar la nueva versión antes de continuar usándola.

### 3.2 English

**Privacy Policy — HanGo closed beta**
Last updated: `[COMPLETE: publication date]`

**Who processes your data.** `[COMPLETE: legal name/entity]`, contact:
`arean.mendoza@unmsm.edu.pe` (temporary email for this closed beta).

**What data we collect:**

- Account data: email address, password (stored encrypted, never in plain
  text), display name.
- Learning data: your progress, level, placement exam results, exercise
  answers, completed scenarios and lessons.
- Content you generate: text you write in exercises, free writing, and — if
  you turn it on — your conversation history with Han.
- Voice: audio recordings from Speaking Lab and lesson speaking practice, and
  their transcription, per your retention preference.
- App usage: which features you use, active time, and technical errors, to
  operate and improve the product.
- Feedback you voluntarily submit from the app.

**What we do NOT collect:** we do not ask for a government ID, precise
location, your phone's contacts, or access to other apps. We do not use
third-party advertising trackers.

**Who we share it with:**

- OpenAI (United States), as the text and voice AI provider — see the AI
  Usage Notice.
- `[COMPLETE: email provider, e.g. Resend]`, to send you verification and
  password-reset emails.
- `[COMPLETE: cloud storage provider]`, to privately store your audio
  recordings.
- We never sell your data to anyone, under any circumstances.

**How long we keep your data:**

- Voice recordings: per your choice in Settings → Privacy (never, 7, 30, 90,
  365 days, or indefinitely). An automated process deletes what's expired.
- Han conversation history: while you keep that preference on; you can turn
  it off and/or request its deletion at any time.
- Account and progress data: while your account is active.
- Database backups: `[COMPLETE: chosen provider's backup retention policy]`.

**Your rights:**

- Access your data, correct it, or request a copy.
- Delete your account from Settings. This removes your data from the
  database and queues deletion of your private files (audio, images); file
  deletion may take a little time but is guaranteed via automatic retries.
- Withdraw your consent and stop participating in the beta at any time.
- Write to `arean.mendoza@unmsm.edu.pe` for any data-related request.

**Security.** Your password is stored encrypted. Connections to HanGo use
HTTPS. Your audio recordings are private: only you can access them through
your authenticated session.

**Minors.** `[COMPLETE: minimum age for this beta per market/jurisdiction —
left undefined here because it is a legal/product decision]`.

**Changes to this policy.** If we change anything material during the beta,
we will notify you inside the app and ask you to accept the new version
before continuing to use it.

---

## 4. Términos de Servicio / Terms of Service

### 4.1 Español

**Términos de Servicio — beta cerrada de HanGo**
Última actualización: `[COMPLETAR: fecha]`

**1. Aceptación.** Al usar HanGo durante esta beta, aceptas estos Términos,
la Política de Privacidad y el Aviso de Uso de IA.

**2. Naturaleza del servicio.** HanGo es una aplicación web para aprender
chino mandarín mediante lecciones, práctica oral y escrita, y conversación
con un tutor de inteligencia artificial ("Han"). Esta es una versión beta
cerrada: el servicio puede cambiar, fallar o discontinuarse durante la
prueba.

**3. Tu cuenta.** El acceso es solo por invitación. Eres responsable de la
confidencialidad de tu contraseña y de la actividad en tu cuenta. Debes
proporcionar un correo electrónico válido y verificarlo.

**4. Uso aceptable.** No debes: compartir tu acceso con personas no
invitadas; intentar acceder a datos de otros usuarios; usar HanGo para
generar contenido ilegal, dañino o abusivo; intentar sobrecargar,
interferir con o realizar ingeniería inversa del servicio; ni usar
automatización para extraer contenido curricular o conversaciones.

**5. Contenido que generas.** Mantienes tus derechos sobre el texto y audio
que produces (tus respuestas, escritura, grabaciones de voz). Nos das
permiso para procesarlo únicamente con el fin de prestarte el servicio
(por ejemplo, enviarlo a OpenAI para generar una respuesta pedagógica o
evaluarlo).

**6. Limitaciones de la IA.** Han es una herramienta de aprendizaje asistida
por IA. Puede cometer errores. No debes depender de HanGo como única fuente
para decisiones importantes (por ejemplo, un examen oficial de certificación
de idioma).

**7. Disponibilidad.** Al ser una beta, no garantizamos disponibilidad
continua. Podemos pausar funciones de IA si se alcanza el presupuesto
definido para la prueba, y te lo notificaremos dentro de la aplicación.

**8. Terminación.** Puedes dejar de usar HanGo y eliminar tu cuenta en
cualquier momento. Podemos revocar tu acceso si incumples estos Términos o
si la fase beta termina; en ese caso te avisaremos con la antelación que
razonablemente podamos.

**9. Sin garantías / limitación de responsabilidad.** El servicio se ofrece
"tal cual" durante la beta, sin garantías de exactitud pedagógica,
disponibilidad ininterrumpida o ausencia de errores. `[COMPLETAR: cláusula
de limitación de responsabilidad ajustada a la jurisdicción aplicable —
requiere revisión legal]`.

**10. Ley aplicable.** `[COMPLETAR: jurisdicción — requiere decisión legal]`.

**11. Contacto.** `arean.mendoza@unmsm.edu.pe` (correo temporal para esta
beta cerrada).

### 4.2 English

**Terms of Service — HanGo closed beta**
Last updated: `[COMPLETE: date]`

**1. Acceptance.** By using HanGo during this beta, you accept these Terms,
the Privacy Policy, and the AI Usage Notice.

**2. Nature of the service.** HanGo is a web app for learning Mandarin
Chinese through lessons, spoken and written practice, and conversation with
an AI tutor ("Han"). This is a closed beta version: the service may change,
fail, or be discontinued during testing.

**3. Your account.** Access is by invitation only. You are responsible for
keeping your password confidential and for activity on your account. You
must provide a valid email address and verify it.

**4. Acceptable use.** You must not: share your access with uninvited
people; attempt to access other users' data; use HanGo to generate illegal,
harmful, or abusive content; attempt to overload, interfere with, or
reverse-engineer the service; or use automation to scrape curricular content
or conversations.

**5. Content you generate.** You keep your rights over the text and audio
you produce (your answers, writing, voice recordings). You grant us
permission to process it solely to provide you the service (for example,
sending it to OpenAI to generate a pedagogical response or assess it).

**6. AI limitations.** Han is an AI-assisted learning tool. It can make
mistakes. You should not rely on HanGo as the sole source for important
decisions (for example, an official language certification exam).

**7. Availability.** As a beta, we do not guarantee continuous availability.
We may pause AI features if the budget defined for the test is reached, and
we will notify you inside the app.

**8. Termination.** You can stop using HanGo and delete your account at any
time. We may revoke your access if you breach these Terms or when the beta
phase ends; in that case we will notify you with as much advance notice as
we reasonably can.

**9. No warranties / limitation of liability.** The service is provided "as
is" during the beta, without guarantees of pedagogical accuracy,
uninterrupted availability, or absence of errors. `[COMPLETE: liability
limitation clause tailored to the applicable jurisdiction — requires legal
review]`.

**10. Governing law.** `[COMPLETE: jurisdiction — requires a legal
decision]`.

**11. Contact.** `arean.mendoza@unmsm.edu.pe` (temporary email for this
closed beta).

---

## 5. Lo que falta para que esto sea implementable (no lo hago yo)

Esto es información para Codex/el usuario, no una tarea mía:

- Decidir y rellenar lo que sigue pendiente: razón social/nombre del
  responsable, fecha de publicación, jurisdicción, edad mínima, proveedor
  de correo transaccional y de almacenamiento en la nube, política de
  backups del proveedor elegido. **Los correos de contacto ya se
  completaron** (2026-09-20): el usuario autorizó usar
  `arean.mendoza@unmsm.edu.pe` temporalmente como correo de soporte y
  privacidad durante la beta cerrada — reemplaza ese correo antes de
  cualquier lanzamiento público, no es una dirección pensada para ese uso
  a largo plazo.
- `P1-02` del lado de Codex: modelo de consentimiento versionado
  (usuario, versión, fecha, idioma), enforcement en credenciales y OAuth sin
  casillas premarcadas, y persistencia.
- Decidir si estos 4 documentos viven como páginas propias en la app o como
  un modal de aceptación con enlaces — decisión de UX que puedo apoyar
  cuando se me pida, pero no soy quien implementa el consentimiento técnico.
