# dLocal Go — Payouts v3 (Uruguay y Argentina)

## Resumen

- **PostHog** `dlocal_go_payouts_enabled`: con la bandera apagada, todo sigue como **manual (Uruguay)**. Con la bandera en **ON**, `uruguayan_bank` usa el proveedor `dlocal_go` (API Payouts v3); `argentinian_bank` exige el flag.
- **Base** de la API: mismo host que los pagos dLocal (Go) salvo `DLOCAL_PAYOUTS_BASE_URL` opcional, rutas `POST /payouts/v3/quote` y `POST /payouts/v3`.
- **Remitente** (obligatorio para ejecutar en producción): `DLOCAL_PAYOUT_REMITTER_*` en el backend + opcional `DLOCAL_PAYOUT_NOTIFICATION_URL`.

## Variables de entorno

| Variable                                                                      | Uso                                                                                      |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `DLOCAL_PAYOUTS_BASE_URL`                                                     | Opcional; default `DLOCAL_BASE_URL`                                                      |
| `DLOCAL_PAYOUTS_TIMEOUT_MS`                                                   | Timeout HTTP (ms)                                                                        |
| `DLOCAL_PAYOUT_REMITTER_FIRST_NAME` / `LAST_NAME`                             | remitter en el body a dLocal                                                             |
| `DLOCAL_PAYOUT_REMITTER_EMAIL` / `PHONE`                                      | Opcionales (beneficiary toma el email de env si aplica)                                  |
| `DLOCAL_PAYOUT_REMITTER_NATIONALITY`                                          | Default `UY`                                                                             |
| `DLOCAL_PAYOUT_REMITTER_DOCUMENT_ID` + `DLOCAL_PAYOUT_REMITTER_DOCUMENT_TYPE` | Documento del remitente (empresa)                                                        |
| `DLOCAL_PAYOUT_NOTIFICATION_URL`                                              | Webhook; si falta, `API_BASE_URL/api/webhooks/dlocal/payouts` (hay que implementar ruta) |
| `PAYOUT_MINIMUM_ARS`                                                          | Mínimo en ARS al cotizar a pesos (método AR)                                             |

## Argentina (ARS)

- Solo ganancias en **USD**. Cotización con `POST /payouts/v3/quote` (`source_currency: USD` → `destination_currency: ARS`); se guarda `dLocalArRateLock` en `payouts.metadata` y se liquida vía dLocal con `quote_id` al completar.
- Método en **USD** sin lock ARS: mismo flujo, sin `quote_id` (solo USD/USD hacia banco local).

## Post-GA

Ver `docs/dlocal-go-payouts-post-ga-cleanup.md` (raíz del repo).
