# File uploads (frontend + backend)

Short reference so we stop repeating the same multipart bugs (multer never receiving the file, “upload succeeded” UI that never hit the server, etc.).

## Frontend: use the generated API, plain object body

The OpenAPI client (`apps/frontend/src/lib/api/generated.ts`) marks file fields with `ContentType.FormData`. For those operations it builds a real `FormData` and appends each key (e.g. `file`) as the multipart field name.

**Do this (same pattern as ticket uploads):**

```ts
// apps/frontend/src/lib/api/ticket-listings/index.ts
api.ticketListings.uploadDocument(ticketId, {file}).then(res => res.data);
```

Reference UI: [`apps/frontend/src/components/TicketUploadModal/index.tsx`](apps/frontend/src/components/TicketUploadModal/index.tsx) — `FileDropzone` keeps a `File` in state; a **Submit** button calls `mutation.mutate(selectedFile)`; the mutation calls the generated method with `{ file }` only.

**Do not:**

1. **Set `Content-Type: multipart/form-data` yourself** in the third `RequestParams` argument. That header must include a `boundary=…` segment. A bare `multipart/form-data` breaks multer and matches the class of bug we fixed on payout document upload.
2. **Build `FormData` by hand** and then also pass `{ file }` to the client (dead code / confusion). If you ever need a raw `FormData`, pass that instance as the body only when the codegen path supports it; otherwise stick to `{ file, … }`.
3. **Mismatch the field name** — the object key must match what the backend expects (`file`, `documents`, etc.).

**Audit:** Some helpers still pass manual multipart headers (e.g. `uploadEventImageMutation`, `verifyIdentityDocument`). Prefer aligning them with the ticket pattern (no extra headers) when touching those flows.

## Backend: TSOA + Multer field name

- Use `@UploadedFile('file')` (or the correct name) on the controller method. The string must match the multipart field name the client sends.
- Do **not** add a second multer middleware on the same route (see repo rule: global multer + `@UploadedFile` only).
- Validate type/size in the service layer after the controller passes the buffer/metadata.

Examples: [`apps/backend/src/controllers/ticket-listings/index.ts`](apps/backend/src/controllers/ticket-listings/index.ts) (`@UploadedFile('file')`), [`apps/backend/src/controllers/admin/payouts/index.ts`](apps/backend/src/controllers/admin/payouts/index.ts) (`POST …/documents`).

## UX pattern with `FileDropzone`

Used across listing upload, ticket modals, identity verification, admin payout voucher, etc.:

1. `onFileSelect` → store `File` in React state (optional: validate with dropzone props).
2. User confirms with an explicit action → `mutation.mutate(file)` (or `{ payoutId, file }`).
3. On success: invalidate/refetch queries; clear selection; toast.
4. On error: toast with `error.response?.data?.message` when present (axios), plus inline `error` on `FileDropzone` where useful.

## Quick checklist for a new upload

| Step | Check |
|------|--------|
| OpenAPI / TSOA | Operation uses `multipart/form-data`; regenerate client after spec change. |
| FE mutation | `api.*.method(id, { file, …optional })` — **no** manual `Content-Type`. |
| BE controller | `@UploadedFile('file')` (or documented field name). |
| Manual test | Network tab: request is multipart; server returns 200 and file is persisted. |
