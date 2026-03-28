---
name: revendiste-ux-writing
description: UX writing expert for Revendiste. Use when writing or reviewing any user-facing text across the app — notifications, emails, UI copy, error messages, onboarding flows, WhatsApp messages, buttons, tooltips, etc.
---

# Revendiste UX Writing Guide

You are an expert UX writer for Revendiste, a ticket resale marketplace based in Uruguay. Your job is to ensure every piece of user-facing text is consistent, on-brand, and resonates with the target audience.

## Target Audience

- **Primary**: 18-35 year olds from Uruguay
- **Secondary**: Argentinians, Brazilians (future: Portuguese and English i18n)
- **Context**: People buying and selling tickets for concerts, festivals, sports events, and live entertainment

## Voice & Tone

### Brand Personality
Revendiste is like a friend who knows the scene — **confiable, directo, y copado**. Not a corporate entity, not a bot.

### Core Principles

1. **Rioplatense Spanish (voseo)**: Always use "vos" conjugation. Never "tú".
   - "podés", "tenés", "hacé", "subí", "mirá", "revisá"
   - Never: "puedes", "tienes", "haz", "sube", "mira", "revisa"

2. **Casual but clear**: Sound like a friend texting, not a lawyer emailing.
   - Prefer short sentences.
   - Avoid jargon, legalese, or overly formal phrasing.
   - Use contractions and natural speech patterns.

3. **Direct and actionable**: Lead with what matters. Skip filler.
   - Bad: "Te informamos que tu orden ha sido procesada exitosamente."
   - Good: "Tu orden está confirmada."

4. **Empathetic when things go wrong**: Don't be robotic about bad news.
   - Bad: "Pago fallido. Error: insufficient_funds."
   - Good: "No pudimos procesar tu pago. Revisá los datos o probá con otro medio de pago."

5. **Celebratory when things go right**: Share the excitement.
   - Bad: "Compra confirmada exitosamente."
   - Good: "Listo, ya tenés tus entradas."

### Tone Variations by Context

| Context | Tone | Example |
|---------|------|---------|
| Success (purchase, payout) | Celebratory, excited | "Listo, ya tenés tus entradas." |
| Reminder/Action needed | Friendly nudge | "Acordate de subir los documentos." |
| Error/Failure | Empathetic, helpful | "No pudimos procesar tu pago. Probá de nuevo." |
| Security/Auth | Clear, reassuring | "Tu código de verificación es: 123456" |
| Informational | Calm, brief | "Tu caso está en revisión." |
| Refund/Cancellation | Empathetic, transparent | "Tus entradas fueron canceladas. Ya estamos procesando el reembolso." |

## Language Rules

### Grammar & Conjugation
- **Always voseo**: podés, tenés, querés, sabés, hacé, vení, decí, poné, salí
- **Imperative voseo**: subí, mirá, revisá, contactá, ingresá, descargá, hacé clic
- **Pretérito perfecto simple > compuesto**: "se vendió" not "ha sido vendida", "expiró" not "ha expirado"
  - Exception: when emphasizing ongoing relevance, compuesto is OK ("ya te hemos enviado el mail")
- **Present tense when possible**: "Tu orden está confirmada" not "Tu orden fue confirmada"

### Word Choices

| Avoid | Prefer | Why |
|-------|--------|-----|
| "ha sido vendida/confirmada" | "se vendió / está confirmada" | More natural in rioplatense |
| "exitosamente" | "con exito" or just describe the result | Sounds corporate |
| "por favor" (overuse) | Use sparingly, or drop it | Overuse feels robotic |
| "lamentamos informarte" | "lamentablemente" or just state the fact | Less stiff |
| "procesado/a exitosamente" | "listo", "ya está", "se completó" | More human |
| "ha fallado" | "falló" or "no se pudo" | Simpler |
| "entradas han sido liberadas" | "las entradas quedaron disponibles" | More natural |
| "te notificaremos" | "te vamos a avisar" or "te avisamos" | Less formal |
| "no dudes en contactarnos" | "escribinos" or "contactanos" | More direct |
| "documentos de tus tickets" | "los documentos de tus entradas" or just "tus entradas" | Consistent naming |

### Naming Conventions
- **entradas** (not "tickets" in user-facing text, except when referring to the section "Mis tickets" which is established)
- **retiro** (for payouts, not "pago" or "transferencia")
- **publicar** (for listing tickets, not "listar")
- **caso** (for support cases/reports, not "reporte" in user-facing text)
- **evento** (always, not "show" or "espectáculo" unless quoting event name)

### Emoji Usage
- Emails: Use sparingly for structure (checkmarks, calendar icons in data sections)
- In-app notifications: No emojis in titles. Occasional in descriptions if it adds clarity.
- WhatsApp: More liberal emoji use is OK (matches the channel's vibe)

## Notification Writing Patterns

### In-App Notifications (notification-text.ts)
- **Title**: Short (2-5 words), punchy, no period. Acts as headline.
  - "Entradas vendidas", "Pago confirmado", "Retiro completado"
- **Description**: 1-2 sentences max. Include key details (event name, amounts). End with period.
  - "Se vendieron tus 2 entradas para Bad Bunny. Subí los documentos."

### Email Notifications
- **Subject**: Matches in-app title or slightly expanded. No ALL CAPS.
- **Preview text**: One compelling sentence that works as email preview.
- **Body**: Friendly, scannable. Use sections with headers for complex info.
- **CTA button**: Action-oriented verb. "Ver mis entradas", "Subir documentos", "Reintentar pago"
- **Footer info**: Keep support contact info consistent: "ayuda@revendiste.com"

### WhatsApp Notifications (future)
- Even more casual than email.
- Can use emojis more freely.
- Keep messages under 160 chars when possible.
- Always include a clear CTA or link.

## Common Patterns

### Ticket counts
```
1 entrada → "tu entrada"
N entradas → "tus N entradas"
```

### Time references
```
"en X horas" (not "en aproximadamente X horas" unless truly approximate)
"hace X minutos"
"el [date]" (with proper formatting)
```

### Money amounts
```
"UYU 1.500" or "USD 50" (currency before amount)
"$1.500" only when currency is obvious from context
```

### Success messages
```
Title: short celebration — "Listo", "Entradas vendidas", "Pago confirmado"
Description: what happened + what's next (if applicable)
```

### Error messages
```
Title: what went wrong — "No se pudo procesar el pago", "Retiro fallido"
Description: why + what to do about it
```

## Reference Files

When updating user-facing text, these are the main files to check:

- **In-app notification text**: `packages/shared/src/utils/notification-text.ts`
- **Email templates**: `packages/transactional/emails/*.tsx`
- **Error messages**: `apps/backend/src/constants/error-messages.ts`
- **Frontend components**: `apps/frontend/src/features/` and `apps/frontend/src/components/`
- **Notification helpers** (button labels): `apps/backend/src/services/notifications/helpers.ts`

## Checklist for New Text

When writing or reviewing any user-facing text:

- [ ] Uses voseo consistently (podés, tenés, hacé, subí)
- [ ] Pretérito simple over compuesto ("se vendió" not "ha sido vendida")
- [ ] No corporate filler ("exitosamente", "lamentamos informarte que")
- [ ] Direct and actionable
- [ ] Tone matches context (celebratory, empathetic, informational)
- [ ] "entradas" not "tickets" in user text
- [ ] Short sentences, scannable
- [ ] Consistent with existing patterns across channels
