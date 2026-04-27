# Campaña 1 — Guía: Meta + TikTok y seguimiento en PostHog (Marketing analytics)

Documento de seguimiento para la primera oleada de campañas pagas. Actualizá este archivo o creá subcarpetas (`campaign-2`, etc.) cuando cambie la estrategia o el naming.

## Contexto

PostHog **Marketing analytics** (función en **beta**; activala en _Feature previews_ si aplica) permite ver **costos y métricas de anuncios** junto con **conversiones en el sitio**, cuando los datos del lado del anuncio y los eventos del sitio se **unen** por convenciones coherentes de campaña y fuente (principalmente `utm_campaign` y `utm_source`).

Referencia oficial: [Marketing analytics – PostHog Docs](https://posthog.com/docs/web-analytics/marketing-analytics).

En Revendiste el sitio ya envía eventos de producto (p. ej. embudo de publicación, checkout) vía la capa central de analítica; lo que falta para “cerrar el círculo” en PostHog es **URLs con UTMs correctos** en los anuncios y **objetivos de conversión** bien definidos en el proyecto.

---

## Configuración práctica Meta y TikTok — Primera campaña (sin experiencia en publicidad)

Esta sección es para **vos como desarrollador** que lanzás la primera campaña con poco tiempo: evento **muy próximo**, mucha **demanda reprimida** (agotado hace semanas), público **18–35**, y dos metas a la vez: que **conozcan Revendiste** y que **hagan algo útil** (publicar entradas y/o comprar con confianza).

### Tu situación en una frase

Tenés **ventana corta** (pocos días), **intención alta** en la calle (“quiero ir / tengo extra”) y una marca **nueva**. Los algoritmos de Meta y TikTok necesitan **señal** (clics, tiempo en sitio, conversiones) para optimizar; con **3 días** no vas a “entrenar” un modelo perfecto, pero sí podés **captar tráfico caliente** si el mensaje y el destino son claros.

### Expectativas realistas (importante para no frustrarte)

- Los primeros **24–48 h** son sobre todo **aprendizaje y prueba de creativos**; el costo por resultado puede moverse mucho.
- Con poco presupuesto, **menos es más**: pocas campañas, pocos conjuntos de anuncios, **varios creativos** rotando dentro del mismo presupuesto.
- “Mejor resultado posible” en 3 días = **mensaje claro + URL correcta + UTMs bien puestos + revisión diaria**, no micromanagement cada hora.

### Dos intenciones de anuncio (recomendación)

Como el evento ya está **agotado** y hay **demanda**, tiene sentido correr **en paralelo** (con presupuestos distintos):

| Intención           | Objetivo del anuncio (humano)                                | Prioridad de presupuesto sugerida              |
| ------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| **Oferta**          | “Tenés entrada extra → publicala acá con garantía”           | **Alta** (sin oferta no hay marketplace)       |
| **Demanda / marca** | “Agotó oficialmente → conseguí reventa segura en Revendiste” | **Media–alta** (hay intención de compra real)  |
| **Marca pura**      | “Revendiste = reventa con garantía en Uruguay”               | **Media** (soporta confianza en los otros dos) |

No hace falta 10 campañas: **2 campañas** (una más “vendedor”, otra más “comprador / agotado”) o **1 campaña con 2 conjuntos de anuncios** (uno por intención) suele alcanzar.

### Público 18–35 (Meta y TikTok)

- **Edad:** en ambas plataformas podés limitar **18–35** (o 18–34 si la UI lo ofrece así). No apretes demasiado más al inicio: si el público es muy chico, el algoritmo tarda en encontrar gente.
- **Ubicación:** Uruguay (y si querés test muy controlado, **solo Uruguay** al principio). Expandir después solo si sobra presupuesto y tenés creativos para otro país.
- **Idioma:** español (Uruguay / LATAM según lo que ofrezca la plataforma).

Evitá al principio **audiencias hiper personalizadas** (“solo fans de X artista”) si no sabés cómo construirlas: con ventana corta, **intereses amplios + buen creativo** suele funcionar mejor que micro-targeting.

---

### Meta (Facebook e Instagram) — qué tocás, en orden

Las palabras exactas del menú pueden variar según la cuenta (nuevo Experiencias de Advantage+, etc.), pero la lógica es esta:

1. **Crear campaña**

   - **Objetivo comercial:** para “que conozcan Revendiste” + tráfico al sitio, suele usarse algo como **Tráfico** o **Interacción** (vistas, alcance) si solo querés ojos; si querés que el algoritmo busque gente con más probabilidad de **hacer algo en la web**, muchas cuentas usan **Ventas** o **Clientes potenciales** cuando ya hay **pixel / eventos** configurados (vos tenés GTM + eventos en sitio).
   - **Consejo práctico:** si Meta te sugiere **Advantage+ (una estructura simplificada)**, podés aceptarlo para la primera vez; reduís decisiones. Si te abruma, elegí estructura **manual** con **1 campaña → 2 conjuntos de anuncios máximo**.

2. **Conjunto de anuncios (ad set)**

   - **Presupuesto:** si podés, **presupuesto a nivel de conjunto** o de campaña (lo que la interfaz permita) con un monto **diario** que puedas sostener 3 días sin drama.
   - **Ubicación:** Uruguay.
   - **Edad:** 18–35.
   - **Placements:** para empezar, **Advantage placements** (automático) está bien; si querés control, priorizá **Reels / Stories** para video 9:16 y dejá también Feed para estáticos.
   - **Optimización:** al inicio, optimizar hacia **clics en el enlace** o **visitas al perfil del sitio** es razonable si el pixel aún no tiene volumen; cuando veas tráfico estable, podés probar optimización hacia **conversiones** (evento del sitio) si Meta lo ofrece y el pixel está disparando bien.

3. **Anuncio (creativo)**

   - Subí **video 9:16** y **imagen** en el mismo conjunto o en anuncios separados con **URLs distintas** (`utm_content` distinto) para saber qué ganó en PostHog.
   - Texto principal: **1 idea + 1 verbo** (“Agotó en oficial → conseguí entrada en Revendiste”, “Vendé tu extra con garantía”).
   - **Llamado a la acción (CTA)** del botón: alineado al objetivo (“Más información”, “Registrarse”, “Comprar” — lo que Meta permita y tenga sentido con la landing).

4. **URL de destino**

   - Misma base que en la Parte A: **siempre** `https://revendiste.com/...` con **UTMs completos**. Para compradores podés mandar a home o a la página del evento si tenés URL estable; para vendedores, idealmente a **flujo de publicación** si existe ruta corta.

5. **Publicación**
   - Revisá **vista previa** en móvil (como se ve en Instagram y Facebook).
   - Activá la campaña y anotá hora + cambio en la tabla “Notas de seguimiento” al final del documento.

---

### TikTok — qué tocás, en orden

1. **Crear campaña**

   - Objetivo típico para web: **Tráfico** o **Conversiones** (según si TikTok ya tiene datos de pixel en tu cuenta). Si es la primera vez, **Tráfico** al sitio con buen creativo 9:16 es una entrada segura.
   - **Presupuesto diario** total que podás mantener los 3 días.

2. **Grupo de anuncios**

   - **Ubicación:** Uruguay.
   - **Edad:** 18–35.
   - **Audiencia:** empezá **sin** intereses súper raros; dejá que el creativo haga el filtro (“agotó”, “reventa”, “garantía”).
   - **Placement:** **TikTok** (in-feed); Spark Ads es otra historia (no lo necesitás para arrancar).

3. **Anuncio**

   - **9:16 nativo**, primeros **1–2 segundos** con el mensaje principal (texto grande, legible sin audio).
   - Variá 2–3 piezas (misma oferta, distinto hook).
   - URL con UTMs (`utm_source=tiktok`, etc.).

4. **Publicación y revisión**
   - TikTok a veces tarda en **revisar** creativos; lanzá con margen de **horas**, no a último minuto del mismo día del evento.

---

### Mensajes que encajan con “agotado hace 2 semanas” + marca Revendiste

**Comprador (demanda):**

- “Oficial agotado → entradas entre personas con **garantía** en Revendiste.”
- “No compres al azar: **custodia** y vendedores verificados.” (solo si es verdad según tu producto.)

**Vendedor (oferta):**

- “Te sobra una entrada para [evento] → **publicala** en minutos.”
- “Reventa **segura**: el comprador paga y vos cobrás cuando corresponda.” (ajustá el copy a tu flujo real.)

**Marca (awareness):**

- “Revendiste: reventa de entradas en Uruguay **con garantía**.”

Evitá promesas que no puedas cumplir (precios “imposibles”, “entrada 100% segura” sin letra chica legal). Eso no es solo ética: **reduce rechazos de anuncio** y reclamos.

---

### Creativos: qué subir y cómo testear

- **Video 9:16:** 15–30 s suele bastar; subtítulos **quemados** en el video (mucha gente sin sonido).
- **Imagen:** mismo mensaje que el mejor frame del video; sirve para **Feed** y para comparar coste vs video.
- **Test simple:** mismo conjunto, **2–4 anuncios** con distinto `utm_content`; a las 48 h pausá el peor CTR si hay diferencia clara; no toques todo a la vez.

---

### Cómo repartir presupuesto en solo 3 días (regla simple)

Ejemplo **orientativo** (ajustá a tu bolsillo real):

- **50–60%** en intención **vendedor** (oferta).
- **30–40%** en intención **comprador / agotado** (demanda + confianza).
- **10%** en **marca** muy amplia (opcional; podés fundirlo en los anteriores con un creativo “quiénes somos”).

Si el presupuesto es **muy chico**, hacé **solo 1 campaña por plataforma** con **2 conjuntos** (vendedor vs comprador) y listo.

---

### Checklist “día 0” antes de poner en vivo

- [ ] Cada URL de anuncio tiene **`utm_source`**, **`utm_medium`**, **`utm_campaign`**, **`utm_content`** y coincide con lo que configuraste en PostHog (Parte A + Parte C).
- [ ] El `utm_campaign` en el enlace coincide con la campaña en Meta/TikTok según **A1 bis** y _Campaign field preference_ en PostHog (nombre **idéntico** al slug, o **mapeo manual** si el nombre en la plataforma es distinto).
- [ ] Probaste abrir el enlace en **incógnito**: carga revendiste.com, sin errores, CTA claro.
- [ ] Tenés acceso a **Meta Business** y **TikTok Ads** con facturación / método de pago ok.
- [ ] Anotás en “Notas de seguimiento” fecha, monto diario y nombres de campaña.

### Checklist “día 1 y 2” (1 h total)

- Mirar **CTR** (clics / impresiones): si es muy bajo, el problema suele ser **creativo o primer frame**, no la edad.
- Mirar **CPC** solo como referencia; lo que importa para vos es **coste por evento en PostHog** (`ticket_listing_created`, `checkout_completed`, etc.) cuando ya haya volumen.
- No cambies **utm_campaign** a mitad del día; si falló el nombre, corregí en **nueva** campaña o mapeá manual en PostHog.

### Si algo se siente “demasiado”

Ambas plataformas tienen **centros de ayuda** para políticas de **entradas / terceros**. Si un creativo es rechazado, simplificá claims y mostrá **marca + proceso** en lugar de promesas absolutas.

---

## Parte A — Crear campañas en Meta y TikTok (UTMs que PostHog pueda enlazar)

### A1. Estrategia de nombres (crítica)

PostHog relaciona filas de gasto de la plataforma con conversiones on-site usando:

- **`utm_campaign`** ↔ **Nombre de campaña o ID de campaña** en Meta/TikTok (configurable en PostHog: _Campaign field preference_ por plataforma).
- **`utm_source`** ↔ **Fuente**; se pueden definir **mapeos / listas permitidas** por integración (p. ej. que `meta`, `facebook`, `instagram` cuenten como Meta).

**Recomendación para Revendiste:**

- Un **`utm_campaign` estable** por iniciativa (ej.: `revendiste_vendedores_uy_2026_04`).
- Creatividades / formatos / ángulos en **`utm_content`** (ej.: `vendedor_video_9x16_v1`).
- **`utm_medium=paid_social`** (o `cpc`, pero conviene unificar).
- **`utm_source`**: valores que vas a mapear en PostHog, por ejemplo:
  - Meta: `meta` (y si hace falta, permitir también `facebook`, `instagram`).
  - TikTok: `tiktok`.

### A1 bis — Valores UTM concretos para Campaña 1 (5 vendedor + 3 comprador)

Tenés **dos líneas de campaña** en las plataformas (recomendado): una para **vendedores** y una para **compradores**. El nombre **exacto** de cada campaña en Meta/TikTok debe coincidir con **`utm_campaign`** (o mapearlo manual en PostHog — ver A4).

#### Valores fijos que repetís en todos los enlaces

| Parámetro    | Valor fijo        | Notas                                     |
| ------------ | ----------------- | ----------------------------------------- |
| `utm_medium` | `paid_social`     | Mismo en Meta y TikTok.                   |
| `utm_source` | `meta` o `tiktok` | Según plataforma; mapeá ambos en PostHog. |

#### `utm_campaign` — dos strings (uno por intención)

Elegí **estos slugs** (o renombrá la campaña en Meta/TikTok para que sea **idéntica** a ellos si usás _Campaign name_ en PostHog):

| Intención   | `utm_campaign` (usar en URL y como nombre de campaña en ads) |
| ----------- | ------------------------------------------------------------ |
| Vendedores  | `revendiste_c1_vendedores_uy`                                |
| Compradores | `revendiste_c1_compradores_uy`                               |

Si en Meta el nombre visible tiene espacios (“Revendiste C1 Vendedores UY”), **o** cambiás el nombre de la campaña al slug de arriba, **o** en PostHog usás **mapeo manual** del slug al nombre real.

#### `utm_content` — un valor **único por creativo** (8 en total)

**Vendedores (5):** 1 video 9:16 + 4 fotos 9:16.

| #   | Tipo     | Descripción interna | `utm_content` (copiar en la URL del anuncio) |
| --- | -------- | ------------------- | -------------------------------------------- |
| 1   | Video    | único video 9:16    | `c1_seller_vid_v1`                           |
| 2   | Estático | foto 9:16 diseño A  | `c1_seller_img_a`                            |
| 3   | Estático | foto 9:16 diseño B  | `c1_seller_img_b`                            |
| 4   | Estático | foto 9:16 diseño C  | `c1_seller_img_c`                            |
| 5   | Estático | foto 9:16 diseño D  | `c1_seller_img_d`                            |

**Compradores (3):** (asumimos estáticos o mix; los nombres son únicos por pieza.)

| #   | `utm_content`     |
| --- | ----------------- |
| 1   | `c1_buyer_crea_a` |
| 2   | `c1_buyer_crea_b` |
| 3   | `c1_buyer_crea_c` |

Si algún comprador es video, podés usar `c1_buyer_vid_v1` en lugar de uno de los `crea_*` — lo importante es **no repetir** el mismo `utm_content` en dos anuncios distintos.

#### URLs de ejemplo (Meta — vendedor video)

`https://revendiste.com/?utm_source=meta&utm_medium=paid_social&utm_campaign=revendiste_c1_vendedores_uy&utm_content=c1_seller_vid_v1`

#### URLs de ejemplo (TikTok — comprador creativo B)

`https://revendiste.com/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=revendiste_c1_compradores_uy&utm_content=c1_buyer_crea_b`

#### Tabla resumen: qué va en cada anuncio

| Plataforma | Intención | Creativo (tu archivo) | `utm_campaign`                                | `utm_content`                     |
| ---------- | --------- | --------------------- | --------------------------------------------- | --------------------------------- |
| Meta       | Vendedor  | video 9:16            | `revendiste_c1_vendedores_uy`                 | `c1_seller_vid_v1`                |
| Meta       | Vendedor  | foto 9:16 A–D         | `revendiste_c1_vendedores_uy`                 | `c1_seller_img_a` … `d`           |
| Meta       | Comprador | diseño A–C            | `revendiste_c1_compradores_uy`                | `c1_buyer_crea_a` … `c`           |
| TikTok     | (igual)   | (mismos 8 creativos)  | **misma** `utm_campaign` por intención        | **mismo** `utm_content` por pieza |
| TikTok     |           |                       | Solo cambiá **`utm_source=tiktok`** en la URL |                                   |

**Regla de oro:** mismo creativo (mismo diseño) en Meta y TikTok puede reutilizar el **mismo** `utm_content` si querés comparar **creativo vs creativo** agregando fuentes en PostHog; si querés ver **Meta vs TikTok** del mismo archivo, usá `utm_content` distinto (ej. `c1_seller_vid_v1_meta` / `c1_seller_vid_v1_tiktok`). Para la Campaña 1, **reutilizar el mismo `utm_content` cross-plataforma** suele bastar y simplifica la hoja de cálculo.

#### Parámetros opcionales (no obligatorios)

- `utm_term`: audiencia o test, ej. `cold_uy`, `broad_18_35`.
- No hace falta `utm_id` salvo que uses una convención interna; con `utm_content` ya separás 8 piezas.

### A2. URL de destino (siempre con UTMs en el enlace del anuncio)

Los valores concretos de `utm_campaign` y `utm_content` para cada creativo están en **A1 bis**. Patrón general:

`https://revendiste.com/?utm_source=<meta|tiktok>&utm_medium=paid_social&utm_campaign=<vendedores|compradores>&utm_content=<id_creativo>`

Ejemplo rápido Meta (vendedor, video):

`https://revendiste.com/?utm_source=meta&utm_medium=paid_social&utm_campaign=revendiste_c1_vendedores_uy&utm_content=c1_seller_vid_v1`

Ejemplo TikTok (comprador, creativo B):

`https://revendiste.com/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=revendiste_c1_compradores_uy&utm_content=c1_buyer_crea_b`

**Buenas prácticas:**

- Sin espacios; usar `_` o `-`.
- No cambiar el `utm_campaign` a mitad de una misma línea de presupuesto si querés comparar periodos.
- Si probás compradores, usá otro `utm_campaign` (ej.: `revendiste_compradores_uy_2026_04`) o prefijos muy claros en `utm_content`; lo más limpio es **campañas / UTMs separados** por intención.

### A3. Estructura en Meta / TikTok (pocos “compartimentos” al inicio)

Con pocos días de aprendizaje, conviene **pocas celdas**:

- **1 campaña** por fase / mercado (ej. “UY vendedores abril 2026”).
- **2–4 conjuntos de anuncios** como máximo (dividir placement solo si hay presupuesto suficiente).
- **2–4 anuncios** por conjunto; **cada anuncio** con su URL (único `utm_content`).

**Presupuesto:** priorizar **vendedores** si sin oferta no hay marketplace; si el evento ya está **agotado** y hay **demanda reprimida**, subí también el peso a **compradores / “agotado”** (ver sección anterior). Ajustá según inventario real en el sitio.

### A4. Alinear “Campaign field preference” con tus UTMs

En PostHog → Marketing analytics → Ajustes avanzados:

- Si `utm_campaign` = **nombre legible** de la campaña en Meta/TikTok → elegir **Campaign name**.
- Si `utm_campaign` = **ID numérico** de la campaña en la plataforma → elegir **Campaign ID**.

Elegí una convención y mantenela.

---

## Parte B — Requisitos en el sitio (para que existan conversiones que atribuir)

1. **Las URLs de los anuncios llevan UTMs** (Parte A).
2. PostHog captura UTMs en los eventos web (comportamiento habitual con query params en la primera vista / sesión).
3. Definís **objetivos de conversión** que reflejen el negocio (no solo clics).

**Objetivos orientados a oferta (prioridad):**

- **`ticket_listing_created`** — se publicó una entrada (señal fuerte de oferta).
- Opcional: **`listing_form_started`** — inicio del flujo de publicación.

**Objetivos compradores** (subí prioridad en PostHog cuando haya entradas publicadas o mucha intención de compra; p. ej. evento agotado hace días):

- **`order_started`**, **`checkout_completed`**

Configuración: [Marketing analytics → Conversion goals](https://posthog.com/docs/web-analytics/marketing-analytics).

---

## Parte C — Checklist en PostHog después de lanzar

### C1. Fuentes nativas (Meta + TikTok)

En ajustes de Marketing analytics:

- Integraciones **conectadas** y tablas requeridas **sincronizando** (Meta: campañas + stats; TikTok: campañas + reporte — según la guía de cada fuente en la documentación de PostHog).

### C2. Objetivos de conversión

1. Marketing analytics → Configuración → **Conversion goals**
2. Añadir objetivos primarios (vendedores): `ticket_listing_created`, etc.
3. Añadir objetivos compradores cuando tenga sentido.

### C3. Mapeos para que “gaste” y “convierta” se unan

En orden:

1. **Campaign field preference** por plataforma (nombre vs ID) coherente con `utm_campaign`.
2. **UTM campaign manual mappings** si el string de `utm_campaign` no coincide exactamente con Meta/TikTok.
3. **Custom source mappings** / allowlist: que `utm_source=meta` (y variantes) vaya a Meta, `tiktok` a TikTok, etc.

### C4. Validar en el panel

- **Marketing costs over time** — gasto por plataforma.
- **Campaign breakdown** — coste, clics, impresiones, CTR, CPC y rendimiento vs objetivos de conversión.

Comprobaciones rápidas:

- Aparece gasto en el rango de fechas correcto.
- Las filas de campaña coinciden con lo que ves en Meta/TikTok.
- Las columnas de objetivos de conversión se mueven cuando hay tráfico con UTMs y usuarios completan eventos en el sitio.

### C5. Ritmo operativo (primeros 7 días)

- **Diario:** revisar que cada anuncio nuevo tenga la URL final correcta con UTMs (un enlace mal copiado rompe la atribución de ese creativo).
- **Cada 2–3 días:** pausar perdedores claros (CTR/CPC), sin fragmentar demasiado el presupuesto.
- **Semanal:** optimizar por **coste por `ticket_listing_created`** (u objetivo equivalente), no solo por CPC.

---

## Anexo — Problemas frecuentes

| Síntoma                         | Causa probable                                                | Qué hacer                                      |
| ------------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| Hay costos, no hay conversiones | Faltan UTMs en la URL del anuncio                             | Corregir URL de destino                        |
| Hay conversiones, no hay costos | Sync / permisos / cuenta de anuncios incorrecta               | Revisar integración nativa                     |
| Hay ambos pero no se unen       | `utm_campaign` no coincide con nombre o ID elegido en PostHog | Ajustar UTMs o mapeos manuales                 |
| Meta mal atribuido por fuente   | `utm_source` no está en la allowlist                          | Añadir mapeo (`meta`, `facebook`, `instagram`) |

---

## Referencias

- PostHog — [Marketing analytics](https://posthog.com/docs/web-analytics/marketing-analytics) (beta).
- Repo — `apps/frontend/docs/analytics.md` (GTM, `dataLayer`, nombres de eventos PostHog).

---

## Notas de seguimiento (rellenar)

| Fecha | Cambio (campaña / creativo / presupuesto) | Responsable |
| ----- | ----------------------------------------- | ----------- |
|       |                                           |             |
