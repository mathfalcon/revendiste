# Revendiste — Guideline de Contenido 9:16 para Instagram

**Versión 1.0** · Stories · Reels · Ads verticales

> _"Conseguí hoy lo que vivís esta noche."_

Este documento define los lineamientos gráficos y de marca para producir piezas en formato vertical (9:16) destinadas a Instagram Stories, Reels y anuncios. Toda pieza debe respetar la identidad visual de Revendiste y las zonas de seguridad de la plataforma.

---

## 1. Identidad de marca

### 1.1 Personalidad

Revendiste es una marca **directa, real y sin vueltas**. Hablamos como amigos, sin rodeos. Cercanos, confiables y apasionados por la música y los buenos planes. Si te pintó ir, te conseguimos la entrada.

### 1.2 Atributos de comunicación

| Atributo         | Traducción visual                                       |
| ---------------- | ------------------------------------------------------- |
| Sin vueltas      | Mensajes cortos, tipografía bold, jerarquía clara       |
| Confiable        | Uso coherente del logo, paleta limpia, sin ruido        |
| A último momento | Sentido de urgencia (contraste, color vivo, movimiento) |
| Para disfrutar   | Imágenes de eventos reales, energía nocturna, gente     |

### 1.3 Tono de voz en piezas

- **Directo**: "Hoy es la noche."
- **Real**: "Entregas 100% reales. Inmediato."
- **Urgente pero no desesperado**: "No te quedes afuera."
- Evitá corporativismo, jerga técnica y promesas genéricas ("la mejor plataforma", "la #1", etc.).

---

## 2. Paleta de colores

### 2.1 Paleta oficial de marca (manual)

| Color                 | HEX                   | Uso                                        |
| --------------------- | --------------------- | ------------------------------------------ |
| **Magenta principal** | `#E0116D` / `#DE2486` | Color hero, CTAs, acentos, texto destacado |
| **Negro profundo**    | `#0F0F10`             | Fondo principal nocturno                   |
| **Gris oscuro**       | `#2A2A2D`             | Fondos secundarios, cards, capas           |
| **Blanco roto**       | `#F2F2F2`             | Texto sobre oscuro, fondos claros          |

### 2.2 Paleta extendida (del sistema de diseño del producto)

Tomada de `apps/frontend/src/styles/app.css` — **Jazzberry Jam scale**. Usala para crear profundidad, hover states o degradados sutiles sin salirte de la marca.

| Token             | HEX           | Nota                           |
| ----------------- | ------------- | ------------------------------ |
| `primary-50`      | `#fdf2f9`     | Fondo muy claro                |
| `primary-100`     | `#fce7f5`     | Fondos suaves                  |
| `primary-200`     | `#fcceec`     |                                |
| `primary-300`     | `#faa7db`     |                                |
| `primary-400`     | `#f670c1`     |                                |
| `primary-500`     | `#ee46a7`     |                                |
| **`primary-600`** | **`#de2486`** | **Primary oficial de la app**  |
| `primary-700`     | `#c0166b`     | Hover / profundidad            |
| `primary-800`     | `#a6165c`     |                                |
| `primary-900`     | `#85164c`     | Texto sobre fondo claro        |
| `primary-950`     | `#51062a`     | Fondo oscuro con tinte magenta |

### 2.3 Gradiente oficial (hero / piezas hero)

```
linear-gradient(93deg, #ff00f8 -45.88%, #fe6525 115.13%)
```

Magenta → naranja. Reservalo para momentos de alto impacto: launches, covers de Reels, backgrounds de CTA principal. **No abusar** — máximo 1 vez por pieza.

### 2.4 Reglas de uso de color

- ✅ **Fondo dominante: negro profundo** (`#0F0F10`). Es la base nocturna de la marca.
- ✅ **Magenta como acento**: máximo 20–30% de la superficie de la pieza. El magenta resalta, no invade.
- ✅ **Texto principal**: blanco roto (`#F2F2F2`) sobre negro, o negro sobre magenta.
- ❌ No usar magenta sobre gris oscuro sin testear contraste (WCAG AA mínimo).
- ❌ No introducir colores ajenos a la paleta (azules, verdes, amarillos) salvo en fotos de evento.

---

## 3. Tipografía

### 3.1 Fuente oficial de marca

**Montserrat** — para todas las piezas gráficas de marketing (Stories, Reels, ads, flyers).

| Peso         | Uso                                         |
| ------------ | ------------------------------------------- |
| **Black**    | Titulares hero (impacto máximo)             |
| **Bold**     | Subtítulos, CTAs, palabras clave destacadas |
| **SemiBold** | Texto de apoyo, metadata                    |
| **Regular**  | Descripciones largas, disclaimers           |

### 3.2 Nota sobre Poppins

El **producto (app web)** usa Poppins como base tipográfica. Para contenido de marketing en redes, siempre usá **Montserrat** según el manual de marca. Mantené esa separación.

### 3.3 Tamaños recomendados en 9:16 (canvas 1080 × 1920)

| Jerarquía             | Tamaño     | Peso     |
| --------------------- | ---------- | -------- |
| Hook / titular hero   | 110–140 px | Black    |
| Título principal      | 72–96 px   | Bold     |
| Subtítulo             | 48–60 px   | SemiBold |
| Body / descripción    | 36–42 px   | Regular  |
| Legales / disclaimers | 24–28 px   | Regular  |

- **Mínimo absoluto**: 28 px. Nada más chico se lee en mobile.
- **Máximo 6–8 palabras** por línea en titulares.
- **Interlineado**: 1.1 para titulares, 1.3–1.4 para texto corrido.
- **Tracking**: ligeramente negativo (-10 a -20) en titulares Black; 0 en body.

### 3.4 Reglas de texto

- ✅ Jerarquía clara: un solo titular dominante por pieza.
- ✅ Palabras clave en magenta: "HOY ES LA **NOCHE**." / "CONSEGUÍ HOY LO QUE VIVÍS **ESTA NOCHE**."
- ❌ No centrar párrafos largos (alineación a izquierda para body).
- ❌ No mezclar más de 2 pesos tipográficos en una misma pieza.

---

## 4. Logo e isotipo

### 4.1 Uso correcto

- **Logo completo** (`REVENDISTE` con el ticket en la V): header de piezas, covers de Reels, ads.
- **Isotipo** (ticket solo): avatar, watermark, favicon, cierres de Stories.

### 4.2 Tamaño mínimo

- Logo completo: **180 px** de ancho en canvas 1080 × 1920.
- Isotipo: **80 px** de ancho mínimo.

### 4.3 Área de respeto

Margen libre alrededor del logo = altura de la "R" del logotipo. Nada debe invadir esa zona.

### 4.4 Uso incorrecto (NO hacer)

- ❌ No deformar, rotar ni aplicar sombras al logo.
- ❌ No usar el logo con colores fuera de marca.
- ❌ No colocarlo sobre fondos de bajo contraste (gris medio, magenta claro).
- ❌ No usar el ticket de la V en otro color que no sea blanco o magenta según fondo.

---

## 5. Zonas de seguridad 9:16 (lo más crítico)

Instagram superpone UI sobre tu contenido. Si ignorás estas zonas, tu texto o logo queda tapado.

```
┌─────────────────────────────┐ ← 0 px
│  ZONA SUPERIOR: 250 px      │ ← avatar, username, "seguir"
│  ⚠️ NO poner texto/logo     │
├─────────────────────────────┤ ← 250 px
│                             │
│                             │
│     ZONA SEGURA CENTRAL     │
│      1080 × 1420 px         │ ← Todo el contenido importante
│                             │    va acá
│                             │
├─────────────────────────────┤ ← 1670 px
│  ZONA INFERIOR: 250–340 px  │ ← caption, likes, música,
│  ⚠️ NO poner CTA ni logo    │   sticker de link
└─────────────────────────────┘ ← 1920 px
```

### 5.1 Márgenes obligatorios

| Zona      | Stories       | Reels                                    |
| --------- | ------------- | ---------------------------------------- |
| Superior  | 250 px libres | 310 px libres                            |
| Inferior  | 250 px libres | **340–400 px libres** (caption + música) |
| Laterales | 60 px mínimo  | 60 px mínimo                             |

### 5.2 Safe area efectiva

Diseñá dentro de un rectángulo de **1080 × 1420 px centrado verticalmente** dentro del canvas. Ese es tu "lienzo real".

---

## 6. Composición y espacios vacíos

### 6.1 Regla del respiro

- **Máximo 40–50% de la pieza con contenido denso** (texto + gráficos).
- El resto debe ser imagen, fondo o espacio negativo.
- Un titular potente necesita aire alrededor para respirar.

### 6.2 Estructura base (template recomendado)

```
┌─────────────────────────────┐
│  [ safe zone superior ]     │
├─────────────────────────────┤
│  Logo (esquina sup. izq.)   │ ← 80–120 px de alto
│                             │
│                             │
│  HOOK / TITULAR HERO        │ ← centrado o alineado izq.
│  (Montserrat Black)         │   3–6 palabras máximo
│                             │
│  Subtítulo de apoyo         │
│                             │
│                             │
│  [ imagen/foto de evento ]  │ ← opcional, bien integrada
│                             │
│                             │
│  CTA visual (no clickeable) │ ← "Entrá a revendiste.com"
│  Isotipo pequeño            │
├─────────────────────────────┤
│  [ safe zone inferior ]     │ ← acá va el sticker de link
└─────────────────────────────┘
```

### 6.3 Reglas de composición

- ✅ **Una idea por pieza**. Si tenés 3 mensajes, hacé 3 slides.
- ✅ Alineación consistente (izquierda suele funcionar mejor para lectura rápida).
- ✅ Grid implícito: pensá en tercios verticales.
- ❌ No llenar toda la pantalla de texto.
- ❌ No pegar elementos al borde (respetá los 60 px laterales).
- ❌ No usar más de 3 elementos gráficos principales por pieza.

---

## 7. Iconografía y estilo visual

### 7.1 Iconografía oficial

Los íconos de marca son **line icons** en magenta sobre negro, con trazos limpios y finos. Ejes conceptuales:

- **Entradas** (ticket)
- **Seguridad** (escudo con check)
- **Rapidez** (rayo)
- **Comunidad** (personas)

### 7.2 Texturas y estilo visual

La marca se apoya en 4 pilares visuales que deben estar presentes:

| Pilar          | Cómo se traduce                                     |
| -------------- | --------------------------------------------------- |
| **Contraste**  | Negro profundo + magenta sin medias tintas          |
| **Energía**    | Fotos de recitales, luces, gente                    |
| **Urbano**     | Collages, mezcla de fotografía real y grafismo      |
| **Movimiento** | Blur de luces, líneas de velocidad, motion en Reels |

### 7.3 Fotografía

- ✅ Fotos de eventos reales, conciertos, fiestas, multitudes.
- ✅ Preferencia por imágenes con **luces de colores** (magentas, naranjas, violetas) que dialoguen con la paleta.
- ✅ Alto contraste, sombras profundas.
- ❌ No usar stock genérico de oficinas, gente sonriendo en fondo blanco, etc.
- ❌ No usar fotos sobreexpuestas o planas.

### 7.4 Mockups de tickets

El ticket (blanco o magenta con código de barras) es un elemento gráfico recurrente. Usalo como:

- Elemento decorativo rotado en el fondo.
- Protagonista de piezas "mostrar el producto".
- Marcador visual de secciones.

---

## 8. Video (Reels) específico

### 8.1 Especificaciones técnicas

- **Resolución**: 1080 × 1920 px
- **Duración ideal**: 15–30 s (máx. 90 s)
- **FPS**: 30 o 60
- **Bitrate**: 3.5 Mbps mínimo
- **Audio**: siempre con trending sound o música licenciada

### 8.2 Primeros 3 segundos

Son críticos para retención. Obligatorio:

- Hook textual fuerte en pantalla (Montserrat Black).
- Movimiento visual (zoom, corte, flash).
- Magenta dominante en el primer frame.

### 8.3 Subtítulos

- **Siempre quemados** en el video (80% de la gente mira sin sonido).
- Ubicados en la **zona central**, nunca en los últimos 340 px.
- Fondo semitransparente negro al 60% si el video tiene mucha variación de luz.
- Montserrat Bold, 48–56 px, blanco con borde/shadow sutil.

---

## 9. CTAs (Call to Action)

### 9.1 Tipos

| Tipo            | Dónde va                       | Ejemplo                  |
| --------------- | ------------------------------ | ------------------------ |
| CTA visual      | Dentro del diseño              | "Entrá a revendiste.com" |
| CTA interactivo | Sticker de IG en zona inferior | Link sticker, "Ver más"  |

### 9.2 Copys recomendados

- "Conseguila hoy"
- "No te quedes afuera"
- "Entrá ya"
- "Tu entrada está en Revendiste"
- "Comprá 100% segura"

### 9.3 Formato visual del CTA

- Botón rectangular con bordes redondeados suaves (radius ~12 px).
- Magenta (`#DE2486`) sobre negro, texto blanco Bold.
- Mínimo 72 px de alto para ser tappeable visualmente (aunque no sea clickeable).

---

## 10. Checklist antes de publicar

Antes de exportar y subir una pieza 9:16, validá:

**Marca**

- [ ] Uso de Montserrat en todos los textos
- [ ] Paleta respetada (negro + magenta dominantes)
- [ ] Logo o isotipo presente dentro de la safe zone
- [ ] Tono "directo, real, sin vueltas"

**Técnico**

- [ ] Canvas 1080 × 1920 px
- [ ] Texto importante entre los 250 px superiores y 340 px inferiores
- [ ] Márgenes laterales de al menos 60 px
- [ ] Contraste WCAG AA (mínimo 4.5:1 para body, 3:1 para titulares)
- [ ] Texto mínimo 28 px

**Contenido**

- [ ] Una sola idea principal
- [ ] Máximo 6–8 palabras en el titular
- [ ] CTA claro
- [ ] Primeros 3 segundos con hook (si es Reel)
- [ ] Subtítulos quemados (si es Reel)

**Accesibilidad**

- [ ] Se entiende sin sonido
- [ ] Se lee en un iPhone SE (pantalla chica)
- [ ] No depende solo del color para comunicar

---

## 11. Ejemplos de aplicación (según manual)

El manual de marca muestra 3 piezas de referencia que cumplen con estos lineamientos:

1. **"HOY ES LA NOCHE. TENÉS TU ENTRADA?"** — foto de recital, titular Black blanco + magenta, isotipo abajo.
2. **"CONSEGUÍ HOY LO QUE VIVÍS ESTA NOCHE."** — mockup de celular con la app, gradiente magenta de fondo.
3. **"NO TE QUEDES AFUERA."** — fondo blanco, titular Black negro + magenta (variante invertida para contraste).

Usalos como plantilla mental para nuevas piezas.

---

**Última actualización**: Abril 2026
**Contacto**: equipo de marca Revendiste
