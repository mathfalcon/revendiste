# Campaña 1 — Guía: Meta + TikTok y seguimiento en PostHog (Marketing analytics)

Documento de seguimiento para la primera oleada de campañas pagas. Actualizá este archivo o creá subcarpetas (`campaign-2`, etc.) cuando cambie la estrategia o el naming.

## Contexto

PostHog **Marketing analytics** (función en **beta**; activala en _Feature previews_ si aplica) permite ver **costos y métricas de anuncios** junto con **conversiones en el sitio**, cuando los datos del lado del anuncio y los eventos del sitio se **unen** por convenciones coherentes de campaña y fuente (principalmente `utm_campaign` y `utm_source`).

Referencia oficial: [Marketing analytics – PostHog Docs](https://posthog.com/docs/web-analytics/marketing-analytics).

En Revendiste el sitio ya envía eventos de producto (p. ej. embudo de publicación, checkout) vía la capa central de analítica; lo que falta para “cerrar el círculo” en PostHog es **URLs con UTMs correctos** en los anuncios y **objetivos de conversión** bien definidos en el proyecto.

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

### A2. URL de destino (siempre con UTMs en el enlace del anuncio)

Ejemplo Meta (ángulo vendedor):

`https://revendiste.com/?utm_source=meta&utm_medium=paid_social&utm_campaign=revendiste_vendedores_uy_2026_04&utm_content=vendedor_video_9x16_v1`

Ejemplo TikTok:

`https://revendiste.com/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=revendiste_vendedores_uy_2026_04&utm_content=vendedor_video_9x16_tiktok_v1`

**Buenas prácticas:**

- Sin espacios; usar `_` o `-`.
- No cambiar el `utm_campaign` a mitad de una misma línea de presupuesto si querés comparar periodos.
- Si probás compradores, usá otro `utm_campaign` (ej.: `revendiste_compradores_uy_2026_04`) o prefijos muy claros en `utm_content`; lo más limpio es **campañas / UTMs separados** por intención.

### A3. Estructura en Meta / TikTok (pocos “compartimentos” al inicio)

Con pocos días de aprendizaje, conviene **pocas celdas**:

- **1 campaña** por fase / mercado (ej. “UY vendedores abril 2026”).
- **2–4 conjuntos de anuncios** como máximo (dividir placement solo si hay presupuesto suficiente).
- **2–4 anuncios** por conjunto; **cada anuncio** con su URL (único `utm_content`).

**Presupuesto:** priorizar vendedores; compradores con poco gasto hasta que haya inventario publicado.

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

**Objetivos compradores (menor prioridad sin inventario):**

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
