# HanGo Avatar Art — Production Guide

Documento maestro para crear nuevos animales y accesorios sin perder alineación, identidad visual ni integración con el cuerpo.

## 1. Contrato visual y técnico

- Formato final: PNG, 1024 × 1024 px.
- Fondo: transparencia alfa real. Nunca dibujar un patrón de cuadros, fondo blanco, negro o de color.
- Cámara: personaje de frente, al nivel de los ojos, sin perspectiva lateral ni pose de tres cuartos.
- Encuadre: busto; cabeza, hombros y torso superior visibles.
- Posición: el personaje debe conservar exactamente el mismo tamaño, centro, altura de ojos, hombros y cabeza en todas sus variantes.
- Estilo: ilustración 3D cálida, pulida y amigable; materiales suaves, iluminación frontal superior uniforme y acabado compatible con Han.
- Sin halo, glow ni sombra proyectada fuera del personaje.
- No cambiar la anatomía, cara, expresión, color, proporciones ni textura del animal al añadir un accesorio.
- La referencia de ajuste puede generarse con el animal vestido, pero el archivo funcional `TORSO` siempre debe terminar como una prenda aislada y ajustada al cuerpo. Nunca se entrega el personaje completo dentro de la capa.
- No crear una prenda genérica y estirarla por su bounding box. La capa aislada debe conservar las coordenadas, proporciones y silueta anatómica obtenidas del ajuste sobre la base aprobada.

## 2. Orden real de capas en HanGo

La aplicación compone el avatar en este orden:

1. `BASE`
2. `TORSO`
3. `HEAD`
4. `FACE`

Consecuencia importante:

- Las capas `HEAD` y `FACE` deben contener únicamente el accesorio, correctamente alineado en el canvas.
- Las capas `TORSO` deben contener únicamente la prenda. El animal base siempre permanece visible debajo y nunca se hornea dentro de la prenda.
- Un render completo del animal vestido se usa exclusivamente como referencia de ajuste y como fuente para extraer la prenda. No es un archivo funcional ni puede copiarse a producción.
- La extracción debe preservar exactamente el anclaje del canvas original: no recortar, recentrar, estirar ni volver a encajar la prenda por su propio contorno.

## 3. Regla de oro del proceso

Toda pieza debe aprobarse primero como un render completo del animal usándola.

Nunca se acepta una pieza basándose únicamente en cómo se ve aislada. La prueba válida es la composición final sobre el personaje.

Flujo obligatorio:

1. Seleccionar la imagen base aprobada del animal.
2. Crear un render completo cambiando únicamente el accesorio solicitado.
3. Comparar el resultado con la base: cara, cuerpo, escala y posición deben permanecer fijos.
4. Aprobar visualmente el render completo.
5. Extraer la capa funcional según su slot, conservando las coordenadas exactas del render aprobado.
6. Crear una hoja de contacto con todas las combinaciones.
7. Validar transparencia, dimensiones, alineación y orden de capas.
8. Hacer una copia de seguridad antes de sobrescribir archivos de producción.
9. Guardar el archivo final únicamente en `C:\HanGo\public\avatar`.
10. No modificar `C:\HanGo\public\avatar\thumbs`; los thumbnails se gestionan por separado.

### 3.1. Corrección de una pieza existente

Cuando el defecto está en una pieza ya aprobada, no se vuelve a generar ni se reconstruye todo el accesorio:

1. Buscar primero la última versión aprobada en el historial de trabajo y comparar sus hashes y composiciones.
2. Copiar los archivos activos a una carpeta de respaldo antes de cualquier cambio.
3. Corregir únicamente la zona defectuosa sobre la capa ya alineada.
4. Para halos blancos o grises, descontaminar solo el borde afectado; nunca erosionar globalmente la silueta ni recortar la prenda.
5. Para un ajuste localizado de cuello, manga o borde, reutilizar píxeles de la misma prenda y mantener el resto del archivo intacto. No sustituir la prenda por un modelo genérico.
6. Si ImageGen produce una referencia con distinta escala, personaje redibujado, fondo de cuadros horneado o canvas diferente, usarla solo como referencia visual y rechazarla como archivo funcional.
7. Comparar `ANTES` y `DESPUÉS` mediante la composición real de la aplicación, en fondo claro, fondo oscuro, tamaño grande y tamaño de Shop.
8. Publicar únicamente la capa funcional aprobada en `public/avatar`; nunca copiar previews, renders completos ni archivos de `thumbs` a esa carpeta.

Reglas aprendidas durante la extracción de prendas:

- La cuadrícula que aparenta transparencia puede estar horneada. Comprobar siempre el canal alfa y las cuatro esquinas; ver cuadros en pantalla no demuestra que exista transparencia real.
- Si una extracción trae una cuadrícula horneada, solo puede limpiarse eliminando el fondo conectado a los bordes exteriores. Nunca borrar por color globalmente, porque se perderían logos, botones, ribetes y detalles claros de la prenda.
- Una prenda aislada generada en un canvas distinto nunca se publica directamente. Debe normalizarse con una única escala proporcional, anclarse contra la base aprobada y validarse en la composición `BASE + TORSO`. No estirar ancho y alto por separado.
- La aprobación final depende de la composición real, no de que la prenda aislada se vea bonita: cuello, hombros, mangas y volumen deben coincidir con la anatomía del animal sin tapar cara ni dejar el cuerpo horneado.

## 4. Prompt maestro para un animal nuevo

Usar la base visual de un animal ya aprobado como referencia de estilo y anclaje. Reemplazar los campos entre llaves.

```text
Use case: stylized-concept
Asset type: production base avatar for HanGo's layered student-avatar system

Primary request:
Create a front-facing bust portrait of a simple Chinese-zodiac {ANIMAL}. This is the bare base character, without clothing, hats, hair, glasses, jewelry, handheld objects, or other accessories.

Reference images:
- Use the approved HanGo animal bases only as references for visual style, lighting, framing, proportions, and production quality.
- Do not copy another animal's anatomy.

Character lock:
- Friendly, youthful, neutral expression.
- Symmetrical front view; eye-level camera.
- Head, shoulders, and upper torso only.
- Head centered horizontally and occupying approximately 55–65% of the canvas height.
- Shoulder line approximately 75–80% down the canvas.
- Both sides of the body must be anatomically continuous and clean.

Style:
Warm premium 3D illustration, soft tactile materials, subtle fur detail, polished but not photorealistic, consistent with the approved HanGo avatar family. Soft frontal-top lighting, balanced contrast and saturation.

Output:
Square 1024 × 1024 PNG with genuine alpha transparency. Large transparent margin around the character. No baked checkerboard.

Must preserve:
Centered geometry, bilateral symmetry, clean silhouette, consistent lighting, natural anatomy, and enough visible torso for future clothing.

Avoid:
Full body, profile, three-quarter angle, tilted head, asymmetric shoulders, dramatic pose, extra objects, text, watermark, floor shadow, glow, halo, solid background, checkerboard pattern, cropped ears, cropped shoulders, or clothing.
```

## 5. Prompt maestro para crear un accesorio sobre el personaje

Este prompt genera primero la referencia completa. Es obligatorio usar como imagen de edición la base aprobada del animal.

```text
Use case: identity-preserve
Asset type: fitted accessory reference for HanGo's layered avatar system

Primary request:
Edit the supplied approved {ANIMAL} base so the character is naturally wearing {ACCESSORY}. Change only the requested accessory.

Identity and geometry lock:
- Keep the exact same animal, face, expression, eyes, muzzle, ears, fur, head size, body proportions, pose, shoulder line, camera, crop, lighting, and canvas-relative position as the source.
- Do not redraw, resize, move, rotate, widen, narrow, or restyle the animal.
- The character must remain pixel-aligned to the approved base as closely as possible.

Fit requirement:
- The accessory must conform naturally to the animal's anatomy.
- Contact areas must look physically connected: no visible gap, floating edge, pasted-on surface, intersecting anatomy, duplicated limb, or abrupt color block.
- Preserve realistic fabric tension, folds, occlusion, and contact shadows only where the item touches the character.

Output:
Full character wearing the accessory, square 1024 × 1024, genuine transparent background, no checkerboard, no halo, no external shadow.

Avoid:
Product-packshot accessory, generic floating item, sticker effect, mannequin shape, body redesign, changed expression, changed animal identity, extra accessories, text, watermark, checkerboard, solid background, hard rectangular mask, broken limbs, detached sleeves, hollow black neck, or cropped item.
```

## 6. Reglas específicas por slot

### HEAD — gorra, sombrero, gorro o peinado

- Generar primero al animal usando el accesorio.
- La pieza debe seguir la curvatura real del cráneo.
- Conservar siempre la proporción original del accesorio. Nunca redimensionar ancho y alto de forma independiente ni forzar la pieza dentro de una caja fija: esto aplana la copa, deforma el ala y genera un aspecto artificial.
- Si el accesorio y el animal base provienen del mismo canvas de referencia, aplicar primero exactamente la misma escala y el mismo desplazamiento usados para normalizar la base. Nunca recortar, recentrar o ajustar la pieza según su propio bounding box: un sombrero ancho no debe cambiar el tamaño ni el anclaje del personaje.
- Las orejas deben quedar delante o detrás de la pieza de manera físicamente coherente.
- No aplastar, duplicar, cortar ni recolorear las orejas.
- Gorras y beanies deben conservar volumen textil tridimensional, profundidad frontal, curvatura de la copa y un borde inferior que siga la frente sin parecer una banda plana.
- La gorra debe cubrir realmente la parte superior del cráneo y extenderse hacia ambos laterales con una escala coherente con las orejas. Si deja demasiada frente o parece una gorra infantil pequeña, se rechaza.
- En el sombrero de bambú deben verse la copa cónica completa, el tejido, el grosor del borde y la cara inferior. El ala debe ser suficientemente ancha para sobrepasar visualmente la cabeza, quedar por encima de los ojos y nunca atravesarlos ni taparlos. Las orejas deben permanecer naturalmente detrás del sombrero.
- Todo accesorio apoyado sobre la cabeza debe producir una sombra de contacto suave y localizada bajo su borde. No usar una sombra exterior uniforme ni un halo.
- Nunca conservar la cabeza completa dentro de una capa `HEAD` para simular integración: al combinarla con la base puede producir orejas o rasgos duplicados. Solo se conserva el accesorio y, cuando sea imprescindible, una zona mínima y difuminada de contacto que no incluya ojos, orejas ni cara completa.
- El archivo funcional final contiene solo el accesorio, en el mismo canvas y coordenadas del render aprobado.
- Se permite una sombra de contacto muy sutil dentro del borde inferior; nunca un halo exterior.

Adición al prompt:

```text
Head-slot requirements:
Fit the item to this animal's exact skull and ear anatomy. Resolve ear occlusion naturally. Keep the item firmly seated on the head with a soft localized contact shadow under the touching edge. When the accessory reference and base share a source canvas, use the base character's exact normalization transform; never trim, recenter, or fit the accessory by its own bounding box. Preserve the accessory's original aspect ratio unless the current approved base has demonstrably different facial proportions; in that case adapt only the minimum necessary height while preserving the intended width, volume, and silhouette. Caps and beanies must retain realistic three-dimensional textile volume, fully cover the crown, and follow the forehead curvature. A bamboo hat must preserve the complete conical crown, woven texture, rim thickness, and visible underside; its brim must extend beyond the head, sit above the eyes without covering them, and leave the ears naturally behind it. Never bake the complete head into a HEAD layer, because it can duplicate ears or facial features when composed. Do not shrink the item into a decorative icon.
```

#### Ajuste específico del sombrero de bambú

- Usar el conejo aprobado como referencia de **integración física**, no como plantilla literal de tamaño ni de huecos para orejas.
- Ajustar cada sombrero al cráneo y a las orejas del animal: el conejo puede atravesar el ala con sus orejas verticales; las orejas redondas del mono y del tigre, y las orejas caídas del perro, deben quedar naturalmente detrás del sombrero.
- Conservar el tejido y las proporciones del render aprobado; corregir primero con una única escala proporcional y un desplazamiento vertical. No regenerar el animal ni incluirlo en la capa funcional.
- La copa debe ocultar la parte superior del cráneo que físicamente quedaría debajo. No debe verse una segunda cúpula de pelo asomando por encima o detrás de la copa.
- El borde inferior debe descansar sobre la frente y dejar una separación cómoda respecto a cejas y ojos. Un ala demasiado baja parece una imagen pegada y empeora la legibilidad facial.
- Añadir solo una sombra de contacto marrón, suave y estrecha, bajo el ala. Debe estar recortada por el alfa de la base del animal para que nunca aparezca sobre el fondo.
- No conservar una superficie inferior marrón ancha entre el ala y la frente. Si el reverso domina visualmente o parece una pieza pegada, eliminarlo y conservar únicamente el borde fino del ala; la frente del animal debe volver a ser visible inmediatamente debajo.
- Validar además la pieza a escala de Shop: a tamaño reducido deben seguir percibiéndose la copa, el borde del ala y el punto de contacto con la cabeza, sin una banda inferior oscura dominante.

### FACE — lentes

- Los centros ópticos deben coincidir con las pupilas.
- Los aros deben rodear los ojos sin cortarlos ni pincharlos.
- El puente debe descansar naturalmente sobre el hocico o nariz.
- Las patillas deben dirigirse hacia los laterales de la cabeza.
- Ningún fragmento de nariz, hocico, ojos o pelaje puede quedar horneado en la capa final.
- El archivo funcional final contiene únicamente los lentes.

Adición al prompt:

```text
Face-slot requirements:
Fit the glasses precisely around both eyes. Center each lens on the corresponding pupil, keep complete continuous rims, place the bridge naturally over the nose/muzzle, and align both temples toward the sides of the head. The glasses must never pierce, cover incorrectly, or distort the eyes.
```

### TORSO — polos, chaquetas, hanfu y prendas similares

- Generar primero una referencia completa del animal vestido para resolver correctamente cuello, hombros, axilas, mangas y volumen corporal.
- El archivo funcional final contiene **solo la prenda aislada** en el canvas original de 1024 × 1024.
- No puede contener cabeza, cuello, pelaje, brazos, torso ni ninguna otra parte del animal.
- La prenda aislada conserva exactamente la escala, posición y proporciones de la referencia aprobada. Nunca se ajusta por su propio bounding box.
- El cuello debe rodear el cuello real del animal sin dejar huecos accidentales ni cubrir la mandíbula.
- En polos y chaquetas, debe permanecer visible una franja corta y natural de cuello/pelaje entre la mandíbula y la abertura de la prenda. Si las puntas del cuello llegan hasta la cara o hacen parecer que el animal no tiene cuello, bajar la prenda completa de forma proporcional antes de redibujar o parchear el cuello.
- Las mangas deben cubrir el nacimiento de los brazos de forma continua; no pueden dejar cuñas blancas/de pelaje ni mostrar una segunda manga debajo.
- Los bordes exteriores deben ser suaves y continuos. Se rechazan bordes dentados, «picados», recortados por color o con mordidas transparentes.
- El alfa exterior debe estar descontaminado: ningún píxel blanco, gris o del antiguo fondo puede sobrevivir en el contorno.
- Se permiten sombras de contacto mínimas y localizadas dentro del límite de la prenda; nunca una silueta del cuerpo, halo exterior o sombra rectangular.
- La cara y la cabeza permanecen completamente transparentes en el archivo de torso para que la base y los slots superiores funcionen correctamente.

Adición al prompt:

```text
Torso-slot requirements:
First create a fitted full-character reference so the neckline, shoulders, arm openings, sleeves, fabric folds, and body volume are anatomically correct. Then derive the production overlay from that approved reference. The final PNG must contain ONLY the garment on the untouched 1024x1024 canvas, in the exact same coordinates as the source reference. Never bake in the animal's head, neck, fur, arms, chest, or body. Never trim, recenter, independently resize, non-uniformly stretch, or fit the isolated garment by its own bounding box. Remove all animal-colored remnants and all white/gray matte contamination. The outer silhouette must be smooth and continuous, with no jagged or chipped edges. The neckline must fully and naturally meet the animal's neck when composed; sleeves must cover the arm roots without gaps, duplicate sleeves, or visible fur wedges. Validate the real BASE + TORSO composition on both light and dark backgrounds before publishing.
```

## 7. Preparación de archivos funcionales

### BASE

- Conservar solo el animal base y transparencia exterior.

### HEAD y FACE

- Partir del render completo aprobado.
- Extraer únicamente el accesorio sin redibujarlo, escalarlo ni recentrarlo.
- Mantener exactamente sus coordenadas en el canvas 1024 × 1024.
- Verificar que no contiene píxeles del animal.

### TORSO

- Partir del render completo aprobado del animal vestido.
- Extraer únicamente la prenda, sin partes del animal y sin fondo.
- Mantener el canvas 1024 × 1024 y las coordenadas exactas del render aprobado.
- No recortar, recentrar, estirar ni reencajar la prenda después de extraerla.
- Limpiar el matte del borde y reconstruir cualquier discontinuidad usando la prenda aprobada como fuente; nunca rellenar con pelaje ni con una prenda genérica.
- Una limpieza de alfa nunca debe crear mangas dentadas ni adelgazar el contorno completo. Si solo hay un halo, se corrige el RGB/alfa del borde contaminado y se conserva la máscara estructural original.
- Si hace falta elevar o cerrar parcialmente un cuello, reutilizar una zona del propio cuello por debajo de la capa original, limitada al área de contacto. No redimensionar el torso completo ni introducir píxeles del animal.
- No cerrar un escote con una pieza añadida o un parche, aunque provenga de la misma tela: en la composición final suele percibirse como una superficie pegada. Si el cuello no ajusta, recuperar una versión previamente aprobada o reconstruir de forma continua la máscara y la textura del cuello original, validando que no exista ninguna unión visible.
- Para reparar un contorno «picado», reconstruir solo la máscara alfa exterior mediante una silueta continua y rellenar los píxeles nuevos desde la tela vecina. Proteger expresamente el escote y los cruces internos para no convertirlos en una masa sólida.

## 8. Nomenclatura

```text
avatar-{animal}-base.png
avatar-{animal}-head-{item}.png
avatar-{animal}-face-{item}.png
avatar-{animal}-torso-{item}.png
```

Usar nombres en minúsculas y guiones. No añadir `final`, `new`, `fixed`, números de versión ni fechas a los archivos de producción. Las variantes de trabajo deben permanecer fuera de `public/avatar`.

## 9. Control de calidad obligatorio

Antes de reemplazar cualquier archivo:

- [ ] El canvas mide exactamente 1024 × 1024.
- [ ] El PNG tiene canal alfa real.
- [ ] Las cuatro esquinas son completamente transparentes.
- [ ] No existe patrón de cuadros horneado.
- [ ] El animal mantiene la misma identidad y expresión.
- [ ] Cabeza, ojos, hombros y torso mantienen sus anclajes.
- [ ] La pieza no parece flotante, pegada ni superpuesta.
- [ ] Ningún accesorio fue estirado o achatado; se conservó su relación de aspecto original.
- [ ] La pieza comparte exactamente el anclaje y la transformación de la base; no fue recentrada ni ajustada por su propio contorno.
- [ ] No hay extremidades cortadas, duplicadas o atravesadas.
- [ ] No hay huecos negros en cuello, mangas o sombreros.
- [ ] No hay orejas, ojos, frente ni rasgos faciales duplicados por una capa `HEAD` que contenga demasiado personaje.
- [ ] El sombrero de bambú conserva la copa y el ala completas, muestra su cara inferior, sobrepasa el ancho de la cabeza y no tapa los ojos.
- [ ] Las gorras y beanies tienen tamaño suficiente para cubrir el cráneo y conservan volumen, profundidad y curvatura natural sobre la frente.
- [ ] Existe una sombra de contacto suave bajo el borde, sin halo ni sombra exterior genérica.
- [ ] Los lentes tienen ambos aros completos y centrados.
- [ ] Las prendas envuelven naturalmente cuello, hombros y brazos.
- [ ] Cada archivo `TORSO` contiene solo la prenda; no contiene cuello, pelaje, brazos, cara ni cuerpo del animal.
- [ ] No hay bordes blancos/grises, píxeles del fondo anterior ni franjas de color del animal en cuello, axilas o mangas.
- [ ] La silueta exterior no tiene dientes, mordidas, cortes ni zonas «picadas».
- [ ] No aparecen dos cuellos, dos juegos de mangas ni una prenda duplicada al superponerla.
- [ ] La validación se hizo con las capas funcionales de producción a tamaño real y también reducidas al tamaño usado en Shop.
- [ ] Se probó la combinación `BASE + TORSO + HEAD + FACE`.
- [ ] Se generó una hoja de contacto de todas las variantes.
- [ ] La persona responsable aprobó visualmente la hoja de contacto.
- [ ] Existe una copia de seguridad de los archivos anteriores.
- [ ] No se modificó la carpeta `thumbs`.
- [ ] Se comparó contra la última versión aprobada antes de considerar una regeneración.
- [ ] Ningún preview, thumbnail o render completo fue publicado como capa funcional.

## 10. Criterio de rechazo inmediato

Rechazar la pieza sin integrarla si aparece cualquiera de estos defectos:

- Aspecto de pegatina o imagen superpuesta.
- Prenda genérica que no sigue el cuerpo del animal.
- Orejas, brazos, ojos o cuello cortados.
- Accesorio demasiado pequeño o demasiado grande.
- Cambio de rostro, proporciones o identidad entre variantes.
- Partes del animal horneadas dentro de una capa `HEAD` o `FACE`.
- Partes del animal horneadas dentro de una capa `TORSO`.
- Cuñas de pelaje visibles entre cuello/prenda o brazo/manga.
- Bordes dentados, «picados», con huecos o con matte blanco/gris.
- Dobles mangas, doble cuello o dos siluetas de prenda causadas por mezclar una capa antigua con una nueva.
- Fondo falso de cuadros, blanco o negro.
- Halo, borde blanco, contorno negro o sombra rectangular.
- Desalineación visible al alternar accesorios.

## 11. Regla de publicación

No sobrescribir archivos de `C:\HanGo\public\avatar` hasta que la hoja de contacto final haya sido revisada y aprobada. La aprobación debe corresponder a las capas funcionales reales, no a un mockup diferente.
