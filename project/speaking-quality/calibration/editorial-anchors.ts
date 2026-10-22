import type {
  CalibrationCase,
  CalibrationRating,
} from "../../../src/lib/journey-speaking-teacher-calibration";

const greetings = "foundations-greetings-and-introductions";
const restaurant = "restaurant-entering-and-ordering";
const contract = "negotiating-job-contract-reviewing-contract-terms";
type Level = CalibrationRating["level"];
/** Entirely fictional text cases authored by Codex. NOT recordings, students,
 * native-teacher ratings, a held-out corpus, or validated pronunciation examples. */
function anchor(
  id: string,
  lessonSlug: string,
  task: string,
  dialogue: string[],
  levels: [Level, Level, Level, Level],
  reasons: [string, string, string, string],
  teachingNote: string,
): CalibrationCase {
  const turns = dialogue.map((content, index) => ({
    id: `${id}-${index}`,
    role: index % 2 ? ("user" as const) : ("assistant" as const),
    content,
  }));
  const userCites = turns
    .filter((turn) => turn.role === "user")
    .map((turn) => ({ turnId: turn.id, quote: turn.content }));
  const partnerCites = turns
    .filter((turn) => turn.role === "assistant")
    .map((turn) => ({ turnId: turn.id, quote: turn.content }));
  return {
    id,
    lessonSlug,
    task,
    modality: "TEXT_ONLY",
    turns,
    editorialReference: {
      provenance: "CODEX_AI_ASSISTED_DRAFT",
      teachingNote,
      ratings: (
        ["communication", "vocabulary", "grammar", "interaction"] as const
      ).map((dimension, index) => ({
        dimension,
        level: levels[index]!,
        reason: reasons[index]!,
        citations:
          levels[index] === null
            ? []
            : dimension === "interaction"
              ? [...partnerCites, ...userCites]
              : userCites,
      })) as CalibrationRating[],
    },
  };
}
const taskG =
  "Saludar, presentarte, preguntar el nombre y el origen del interlocutor. No exigir una nacionalidad concreta ni una respuesta larga.";
const taskR =
  "Pedir un plato y una bebida elegidos por ti y preguntar si el plato es picante. No imponer un plato ni confundir preferencia con pregunta.";
const taskC =
  "Consultar el alcance de una cláusula ficticia, plantear una objeción con tacto y solicitar documentación escrita. La misión fuente menciona 具体涵盖哪些范围 y 是不是有点: registrar su producción por separado de la intención lograda. No evaluar validez legal.";
const anchors: CalibrationCase[] = [
  anchor(
    "G0",
    greetings,
    taskG,
    [
      "你叫什么名字？",
      "你我叫是。",
      "Puedes decir tu nombre con 我叫 + nombre. Por ejemplo: 我叫小林。 Ahora di el tuyo.",
      "叫是你我。",
    ],
    [0, 1, 0, 1],
    [
      "No se comunica un nombre tras una oportunidad y un modelo accesible; es desempeño de esta muestra, no incapacidad general.",
      "Hay elementos aislados de presentación, pero no una selección que comunique el nombre.",
      "No construye una relación de presentación interpretable ni después del modelo explícito.",
      "Hay respuestas a los turnos, pero no adaptación funcional del modelo pese al apoyo.",
    ],
    "Revisión humana especialmente necesaria para el límite 0/1: confirmar intención y que la consigna fue accesible. No usar silencio como equivalente.",
  ),
  anchor(
    "G1",
    greetings,
    taskG,
    [
      "你好，你叫什么名字？",
      "小明。",
      "我叫小林。你是哪国人？",
      "名字。",
      "Te pregunto de qué país eres. Puedes decir 我是秘鲁人, cambiando el país si corresponde.",
      "国。",
    ],
    [1, 1, null, 1],
    [
      "Comunica el nombre elípticamente, pero no el origen después de una aclaración accesible.",
      "Nombre funcional y palabras aisladas que no resuelven la pregunta de origen.",
      "La elipsis del nombre es válida; la muestra no permite calificar un control gramatical general.",
      "No adapta la respuesta de origen al intercambio pese a ayuda explícita.",
    ],
    "No inventar un error en 小明: es una respuesta contextual válida. La limitación está en lo que sigue.",
  ),
  anchor(
    "G2",
    greetings,
    taskG,
    [
      "你好，你叫什么名字？",
      "No sé cómo contestar.",
      "Puedes decir 我叫 + tu nombre. Por ejemplo 我叫小林。",
      "我叫小明。",
      "Ahora pregunta mi nombre con 你叫什么名字？",
      "你叫什么名字？",
      "我叫小林。你是哪国人？",
      "我是秘鲁人。",
    ],
    [2, 2, 2, 2],
    [
      "Consigue parte de la tarea con modelos explícitos recurrentes; no hay pregunta propia de origen.",
      "Aplica recursos funcionales, algunos inmediatamente modelados; no demuestra transferencia suficiente de todos ellos.",
      "Produce relaciones correctas tras modelos; no asignar dominio independiente del patrón copiado.",
      "Mantiene intercambio con dirección recurrente. Pedir ayuda no es el error; la dependencia demostrada limita el nivel.",
    ],
    "No tratar como ayuda la pregunta normal 你是哪国人. La asistencia son los dos modelos explícitos.",
  ),
  anchor(
    "G3",
    greetings,
    taskG,
    [
      "你好，你叫什么名字？",
      "你好，我叫是小明。你呢？",
      "我叫小林。你是哪国人？",
      "我是秘鲁人，你呢？",
      "我是中国人。",
    ],
    [4, 4, 3, 4],
    [
      "Saluda, se presenta comprensiblemente y devuelve preguntas de nombre y origen.",
      "Selección léxica pertinente para la tarea; el 是 añadido se analiza como sintaxis, no doble penalización léxica.",
      "我叫是小明 contiene un 是 adicional en esta presentación y no se repara en la muestra.",
      "Respuestas e iniciativas pertinentes sin modelo instructivo del personaje.",
    ],
    "No bajar todas las variables por el mismo 是. Propuesta de corrección local: 我叫小明。 Wǒ jiào Xiǎomíng. Me llamo Xiaoming.",
  ),
  anchor(
    "G4",
    greetings,
    taskG,
    [
      "你好。",
      "你好，你叫什么名字？",
      "我叫小林，你呢？",
      "我叫小明，很高兴认识你。你是哪国人？",
      "我是中国人，你呢？",
      "我是秘鲁人。",
    ],
    [4, 4, 4, 4],
    [
      "Los cuatro actos de la tarea aparecen con contexto pertinente.",
      "Recursos propios suficientes para esta tarea breve; no hacen falta sinónimos sofisticados.",
      "Presentación y preguntas pertinentes, sin error sintáctico confirmado pendiente en lo observado.",
      "Responde y toma iniciativa sin ayuda instructiva; el modelo del nombre del personaje no prueba copia por sí solo.",
    ],
    "Cuatro máximos textuales pueden ser legítimos en una tarea pequeña. No equivalen a 100 oral integral, tonos perfectos o HSK certificado.",
  ),
  anchor(
    "GX",
    greetings,
    taskG,
    ["你好，你叫什么名字？"],
    [null, null, null, null],
    [
      "No hay intervención del alumno.",
      "Solo habla el personaje.",
      "No hay producción propia que permita medir relaciones.",
      "No existe intercambio de dos participantes.",
    ],
    "Ausencia de muestra: no cero, no máximo. No reconstruir respuestas a partir de lo que diga el personaje.",
  ),
  anchor(
    "R0",
    restaurant,
    taskR,
    [
      "您想点什么菜？",
      "菜要我份。",
      "Puedes pedir diciendo 我要 + el plato. Por ejemplo 我要炒饭。 Prueba con tu elección.",
      "份我菜要。",
    ],
    [0, 1, 0, 1],
    [
      "No comunica una elección de plato tras apoyo explícito y accesible.",
      "Palabras relacionadas con el pedido, pero no una selección de plato interpretable.",
      "No construye una relación de petición interpretable en estas dos formulaciones.",
      "Responde, pero no adapta el modelo a una petición funcional.",
    ],
    "No emitir juicios de pronunciación ni de nivel general. El límite 0/1 requiere contraste docente.",
  ),
  anchor(
    "R1",
    restaurant,
    taskR,
    [
      "您想吃什么？",
      "炒饭。",
      "您想喝什么？",
      "炒饭。",
      "Te pregunto qué quieres beber. Puedes elegir agua o té; no comida.",
      "炒饭。",
    ],
    [1, 1, null, 1],
    [
      "El plato se comunica, pero la bebida no se resuelve tras aclaración.",
      "炒饭 es adecuado en la primera respuesta y no responde a la pregunta de bebida en las siguientes.",
      "La respuesta elíptica inicial no es incorrecta; no hay una muestra sintáctica suficiente para otra nota.",
      "Se mantiene una respuesta que no se adapta al cambio de pregunta pese a aclaración.",
    ],
    "No tratar todas las apariciones de 炒饭 como errores ni confundir falta de bebida con gramática incorrecta.",
  ),
  anchor(
    "R2",
    restaurant,
    taskR,
    [
      "您想点什么？",
      "Ayúdame a pedirlo.",
      "Puedes decir 我要一份炒饭。",
      "我要一份炒饭。",
      "Para pedir bebida puedes decir 我要一杯茶。",
      "我要一杯茶。",
      "Para preguntar si pica: 这道菜辣不辣？",
      "这道菜辣不辣？",
    ],
    [2, 2, 2, 2],
    [
      "Resuelve las tres intenciones con modelos directos recurrentes.",
      "Recursos pertinentes, pero se repiten después de proporcionarlos el personaje.",
      "Formas correctas asistidas; no hay aplicación posterior distinta que demuestre independencia.",
      "Depende de dirección continua para formular cada intervención.",
    ],
    "El máximo no se concede por copiar correctamente. Tampoco se transforma la ayuda en un error lingüístico inventado.",
  ),
  anchor(
    "R3",
    restaurant,
    taskR,
    [
      "您想点什么？",
      "我要一份炒饭和一杯茶。这个菜辣不辣？",
      "有点辣。",
      "那我想要不辣的。",
      "可以。",
    ],
    [4, 4, 4, 4],
    [
      "Pide plato y bebida, pregunta por picante y actúa sobre la respuesta.",
      "Elecciones y preferencia suficientes para la tarea, sin exigir otro plato.",
      "Peticiones y pregunta A-no-A pertinentes; sin error gramatical textual confirmado.",
      "Sigue el dato de picante con una decisión propia; no hay ayuda instructiva.",
    ],
    "No bajar el nivel por brevedad ni por preferir no picante. Todos los máximos son locales y textuales, no acústicos.",
  ),
  anchor(
    "R4",
    restaurant,
    taskR,
    [
      "您想点什么？",
      "我要一份炒饭。",
      "喝的呢？",
      "我要一杯茶。这个菜辣不辣吗？",
      "有点辣。",
      "请做不辣的。",
    ],
    [4, 4, 3, 4],
    [
      "Las tres intenciones se comunican y se añade una petición pertinente.",
      "Comida y bebida elegidas adecuadamente; la pregunta redundante se evalúa en gramática, no como selección léxica errónea.",
      "La pregunta combina A-no-A y 吗: en esta interrogación simple se propone 这个菜辣不辣？ o 这个菜辣吗？, sin mantener ambos formatos.",
      "Responde a la pregunta de bebida y decide sobre el picante; esa pregunta normal no constituye ayuda instructiva.",
    ],
    "Corregir la construcción de la pregunta, no inventar un fallo de selección de plato, bebida o comprensión.",
  ),
  anchor(
    "RX",
    restaurant,
    taskR,
    [
      "您想点什么？",
      "Quiero una bebida, ¿cómo se dice?",
      "Para pedir agua puedes decir 我要水。",
    ],
    [null, null, null, null],
    [
      "Hay una intención comunicada en español, pero aún no una muestra suficiente de la tarea en mandarín.",
      "No atribuir 水 del personaje al alumno.",
      "No hay relación gramatical china producida por el estudiante.",
      "Pedir ayuda es una estrategia válida, pero no basta para puntuar su aplicación posterior, aún ausente.",
    ],
    "No castigar el español como mala gramática china ni conceder dominio porque la IA dio el modelo.",
  ),
  anchor(
    "C0",
    contract,
    taskC,
    [
      "您想确认这条条款的什么内容？",
      "范围哪些条款我。",
      "Puedes preguntar 这条条款包括哪些内容？ para consultar qué incluye. Inténtalo con esta cláusula ficticia.",
      "条款我范围哪些。",
    ],
    [0, 1, 0, 1],
    [
      "No se logra una consulta interpretable sobre la cláusula tras apoyo accesible.",
      "Términos del tema aislados, sin consulta funcional.",
      "Las relaciones entre cláusula, alcance y pregunta no llegan a construirse pese al modelo.",
      "Hay respuesta pero no adaptación funcional del apoyo.",
    ],
    "No usar conocimientos jurídicos como criterio. Revisar con docente la severidad 0/1 y la comprensión de la consigna.",
  ),
  anchor(
    "C1",
    contract,
    taskC,
    [
      "您想确认哪一条？",
      "保密条款。",
      "您想了解什么？",
      "文件。",
      "¿Quieres preguntar qué incluye? Puedes decir 保密条款包括哪些内容？",
      "保密。",
    ],
    [1, 1, null, 1],
    [
      "Identifica el tema, pero no comunica una consulta concreta ni una solicitud de documentación.",
      "Términos pertinentes aislados; no se atribuye a 文件 una petición escrita completa.",
      "Fragmentos insuficientes para valorar control de relaciones; no convertirlos automáticamente en una estructura errónea.",
      "No desarrolla la consulta después de una aclaración accesible.",
    ],
    "Mencionar una cláusula no demuestra preguntar su alcance; decir 文件 no demuestra solicitar documentación.",
  ),
  anchor(
    "C2",
    contract,
    taskC,
    [
      "您想确认哪一条？",
      "Necesito ayuda para decirlo.",
      "Puedes preguntar 这条条款具体涵盖哪些范围？",
      "这条条款具体涵盖哪些范围？",
      "Para plantear una preocupación: 这个期限是不是有点长？",
      "这个期限是不是有点长？",
      "Para pedirlo por escrito: 请提供书面说明。",
      "请提供书面说明。",
    ],
    [2, 2, 2, 2],
    [
      "Comunica las tres intenciones con modelos explícitos continuos.",
      "Usa recursos funcionales proporcionados inmediatamente; sin transferencia observada.",
      "Produce las formas modeladas correctamente, pero aún no demuestra control independiente.",
      "La dirección instructiva es continua; no atribuir autonomía máxima.",
    ],
    "Copiar los dos patrones exactos no equivale a dominarlos. No evaluar legalidad de lo que la escena pueda negociar.",
  ),
  anchor(
    "C3",
    contract,
    taskC,
    [
      "您想确认哪一条？",
      "保密条款具体涵盖哪些范围？",
      "主要包括客户资料和技术文件。",
      "那客户公开的信息也包括吗？这个期限是不是有点长？",
      "我们可以讨论期限。",
      "能不能把这些内容写进合同？",
    ],
    [4, 4, 4, 4],
    [
      "Precisa alcance, pregunta sobre la respuesta, plantea una objeción y solicita constancia.",
      "Recursos específicos y pertinentes sin tecnicismos ajenos exigidos.",
      "Relaciones y patrones de alcance/objeción/petición aplicados en contexto; sin error textual confirmado pendiente.",
      "Sigue la respuesta de RR. HH. y formula iniciativa propia sin modelo instructivo.",
    ],
    "No implica acuerdo firmado, precisión jurídica, voz nativa ni perfección general. Máximos referidos solo al desempeño textual de esta escena.",
  ),
  anchor(
    "C4",
    contract,
    taskC,
    [
      "我们讨论保密条款。您想确认什么？",
      "这个条款的范围是什么？",
      "包括客户资料和技术文件。",
      "这个期限可以缩短一点吗？可以用邮件确认吗？",
    ],
    [4, 4, null, 4],
    [
      "Consulta el alcance, pide ajuste y confirmación por escrito con paráfrasis comprensibles.",
      "Selección pertinente a la negociación ficticia sin inventar carencias por usar palabras sencillas.",
      "Las paráfrasis son comprensibles, pero las dos formas centrales exigidas (具体涵盖哪些范围 y 是不是有点) no aparecen: evidencia insuficiente para calificar el control gramatical de esos objetivos; no se declaran errores en las alternativas.",
      "Iniciativa propia y peticiones pertinentes sin instrucción modelada.",
    ],
    "Caso frontera: perfil textual alto NO acredita los dos requisitos formales de la misión fuente. Sin resolver esa cobertura, no habilita nota integral ni aprobación del objetivo completo.",
  ),
  anchor(
    "CX",
    contract,
    taskC,
    ["这条条款涉及保密。您想确认什么？"],
    [null, null, null, null],
    [
      "Solo existe intervención del personaje.",
      "保密 dicho por RR. HH. no es producción del estudiante.",
      "No hay gramática propia del alumno evaluable.",
      "No hay intercambio completo.",
    ],
    "Sin alumno no hay cero, máximo ni documento solicitado por inferencia.",
  ),
];
for (const entry of anchors)
  entry.editorialReference.ratings.push(
    {
      dimension: "pronunciation",
      level: null,
      reason:
        "Caso solo textual: no hay audio evaluable ni medición acústica validada.",
      citations: [],
    },
    {
      dimension: "fluency",
      level: null,
      reason:
        "No hay audio/tiempos de habla verificables; el texto no demuestra ritmo, velocidad o pausas.",
      citations: [],
    },
  );
export const EDITORIAL_CALIBRATION_ANCHORS = anchors;
