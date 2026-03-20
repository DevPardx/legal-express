# Bug & Problem Record — Legal Express

Record of errors encountered during development and how each was resolved.
Maintained as part of Exercise 5 (QA / Testing) deliverable.

---

## BUG-001 — Tailwind CSS 4 peer dependency breaks Vitest workers

**Area:** Frontend / Testing setup
**Severity:** Blocker

**Symptom:**
Running `vitest` in the frontend caused workers to crash immediately with:
```
Error: Cannot find module '@csstools/css-parser-algorithms'
```

**Root cause:**
`@tailwindcss/vite` (Tailwind CSS 4) pulls in `@csstools/css-calc`, which requires
`@csstools/css-parser-algorithms@^4` as a peer dependency. That peer was not installed,
and the Vite plugin attempted to load it inside the Vitest worker process.

**Resolution:**
1. Installed the missing peer: `npm install --save-dev @csstools/css-parser-algorithms@^4 @csstools/css-tokenizer@^4`
2. Created a standalone `vitest.config.ts` that does **not** extend `vite.config.ts`,
   using only the React plugin — this prevents the Tailwind Vite plugin from loading
   inside test workers at all.

---

## BUG-002 — `@testing-library/react@16` incompatible with React 18

**Area:** Frontend / Testing
**Severity:** Blocker

**Symptom:**
Component tests threw at runtime:
```
Error: A React Element from an older version of React was rendered.
```

**Root cause:**
`@testing-library/react@16` uses React 19 internal APIs (`act` from `react`).
The project targets React 18, which does not expose those APIs.

**Resolution:**
Downgraded to `@testing-library/react@^14.3.0`, which is the correct version
for React 18 projects.

---

## BUG-003 — Backend tests exiting with code 1 due to missing env vars

**Area:** Backend / Testing
**Severity:** Blocker

**Symptom:**
Running `vitest` locally caused the process to exit immediately with code 1
before any test ran.

**Root cause:**
`src/config/env.config.ts` validates required environment variables at import time
and calls `process.exit(1)` if any are missing. In a test environment without a
`.env` file loaded, all required vars were absent.

**Resolution:**
Created `src/tests/setup.ts` that sets default test values for every required
env var before any module import occurs. Referenced via `setupFiles` in
`vitest.config.ts` so it runs before the test suite.

---

## BUG-004 — Vitest mock path mismatch for database config

**Area:** Backend / Testing
**Severity:** High

**Symptom:**
`vi.mock(...)` calls in backend tests had no effect — the real Prisma client was
used instead of the mock, causing tests to attempt real DB connections.

**Root cause:**
Tests were mocking `@/config/database.js` but the actual import path used by
services is `@/config/database.config.js`. Vitest only intercepts a module if
the mock path matches the import path exactly.

**Resolution:**
Updated all `vi.mock(...)` calls to use the correct path `@/config/database.config.js`.

---

## BUG-005 — `vi.hoisted()` required to avoid temporal dead zone in mocks

**Area:** Backend / Testing
**Severity:** High

**Symptom:**
```
ReferenceError: Cannot access 'mockFindFirst' before initialization
```
Thrown when a `const` declared at module scope was referenced inside a `vi.mock()`
factory.

**Root cause:**
`vi.mock()` is hoisted to the top of the file by Vitest's transformer — above all
`const`/`let` declarations. Any variable used inside the factory must be defined
before hoisting occurs.

**Resolution:**
Wrapped shared mock functions with `vi.hoisted()`:
```typescript
const { mockFindFirst } = vi.hoisted(() => ({
    mockFindFirst: vi.fn().mockResolvedValue({ ... }),
}));
```

---

## BUG-006 — `z.date()` rejects ISO string timestamps from JSON webhooks

**Area:** Backend / Webhook controller
**Severity:** High

**Symptom:**
`POST /api/webhook/payment` returned 400 validation error on the `timestamp` field
even when a valid ISO 8601 string was provided.

**Root cause:**
`z.date()` requires an actual JavaScript `Date` object. JSON payloads always
deserialize dates as strings, so the validator always rejected the value.

**Resolution:**
Changed the schema field from `z.date()` to `z.coerce.date()`, which automatically
coerces ISO strings to `Date` objects before validation.

---

## BUG-007 — Document service mocked wrong Prisma model methods

**Area:** Backend / Testing
**Severity:** Medium

**Symptom:**
`document.service.test.ts` passed but tested the wrong behavior — the mock used
`user.upsert` while the actual service code calls `user.findUnique` + `user.create`.

**Root cause:**
The mock was written based on an earlier version of the service before it was
refactored to use separate find/create calls for better concurrent request handling.

**Resolution:**
Updated the mock to reflect the actual call pattern:
```typescript
user: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) }
```

---

## BUG-008 — PDF Full Name field empty in generated documents

**Area:** Backend / PDF worker
**Severity:** High

**Symptom:**
Downloaded PDF documents showed "Full Name:" with no value in the Client Information
section, even though the user had filled in the field.

**Root cause:**
`document.service.ts` splits `formData.fullName` into `firstName`/`lastName` for
database user creation, but those derived values were never passed to the template
engine. The PDF worker spread raw `formData` into `templateData`, which contains
`fullName` but not the split fields expected by the Handlebars template
(`{{firstName}} {{lastName}}`).

**Resolution:**
Added the name-splitting logic to `pdf.worker.ts` so `firstName` and `lastName`
are explicitly included in `templateData` before rendering.

---

## BUG-009 — Invoices page always empty despite documents being generated

**Area:** Backend / Data model
**Severity:** High

**Symptom:**
The Invoices page showed no records even after sending a valid payment webhook.

**Root cause (two-part):**
1. The `matters` table was always empty because document creation never created
   a Matter record. Without a Matter, `document.matter` was null.
2. The webhook handler only creates an Invoice when `document.matter?.userId`
   is truthy — so the condition was never met.

**Resolution:**
Updated `document.service.ts` to automatically create a Matter record inside the
same transaction as the Document, linking both to the resolved user. The Matter
title defaults to the form's "Matter / Case Reference" field or falls back to
`"ClientName — DOCUMENT_TYPE"`.

---

## BUG-010 — Invoice `upsert` fails: `transactionId` used as UUID primary key

**Area:** Backend / Webhook controller
**Severity:** High

**Symptom:**
```
Invalid input value: invalid input syntax for type uuid: "txn-001"
```
Returned from `POST /api/webhook/payment`.

**Root cause:**
The original `invoice.upsert` used `transactionId` (a free-form string like
`"txn-001"`) as the record's `id` field, which is declared `UUID` in the schema.
Non-UUID strings are rejected by PostgreSQL's UUID type.

**Resolution:**
Added a dedicated `transaction_id TEXT UNIQUE` column to the `invoices` table
(schema change + `prisma db push`). The upsert now uses `where: { transactionId }`
and the `id` is generated automatically by the database. As a secondary measure,
switched from `upsert` to a `$queryRaw` idempotency check + `create`/`update`
to work around a Prisma v7 WASM client cache issue where the new unique field
was not recognized at runtime until the client was fully regenerated.

---

## BUG-011 — Prisma v7 WASM client not reflecting schema changes after `db push`

**Area:** Backend / Prisma client
**Severity:** Medium

**Symptom:**
After adding `transaction_id` to the schema and running `prisma generate`, the
runtime still threw "Unknown argument `transactionId`" in upsert `where` clauses,
even after restarting the dev server.

**Root cause:**
Prisma v7 uses a compiled WASM query compiler embedded in the generated client.
The TypeScript type definitions in `.prisma/client/index.d.ts` were updated
correctly, but the WASM binary retained a cached version of the previous schema.
The WASM is only fully invalidated when the `.prisma/client/` directory is deleted
and regenerated from scratch.

**Resolution:**
1. Deleted `.prisma/client/` entirely and re-ran `prisma generate`.
2. As a runtime workaround, replaced the `upsert` call with a `$queryRaw` lookup
   (bypasses client-side validation) followed by explicit `create` or `update`.

---

## BUG-012 — "Unknown User" displayed in Invoices client column

**Area:** Full stack / Data integrity
**Severity:** Low

**Symptom:**
Invoices page showed "Unknown User" in the CLIENT column for invoices linked to
a real user.

**Root cause:**
A user record had been created in an earlier test run with `firstName: "Unknown"`
and `lastName: "User"` — the fallback values used when `formData.fullName` is
empty. On subsequent document generations the service found the existing user
by email and did not update the name fields.

**Resolution:**
1. Added a conditional update in `document.service.ts`: if an existing user is
   found with `firstName === "Unknown"`, their name is updated with the values
   from the current form submission.
2. Fixed the specific record directly in the database via SQL UPDATE.
