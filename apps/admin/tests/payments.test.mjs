import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import ts from "typescript";
const require = createRequire(import.meta.url); const cache = new Map();
function load(path) { path = resolve(path); if (cache.has(path)) return cache.get(path); const mod = { exports: {} }; const source = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText; new Function("require", "module", "exports", source)(name => name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : name.startsWith(".") ? load(resolve(dirname(path), `${name}.ts`)) : require(name), mod, mod.exports); cache.set(path, mod.exports); return mod.exports; }
const schema = load("features/payments/schema.ts"); const handlers = load("features/payments/handler.ts"); const subs = load("features/subscriptions/schema.ts");
const origin = process.env.APP_ORIGIN || "http://localhost:3001"; const original = global.fetch; afterEach(() => { global.fetch = original; });
const manual = { request_key: "64c15ebe-68ab-4fd3-b04f-ea710702e58d", amount_minor: 400, method: "bank_transfer", account_number: "1234", reference: "FT123", note: "", received_at: "2026-10-30T01:00:00Z" };
const request = (path, method = "GET", body, from = origin, cookie = "access_token=test-only") => new Request(`http://localhost:3001/api/${path}`, { method, headers: { origin: from, cookie, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
test("manual receipt validates exact amounts, bank references, dates and idempotency key", () => {
 assert.equal(schema.manualPaymentSchema.safeParse(manual).success, true);
 assert.equal(schema.manualPaymentSchema.safeParse({ ...manual, method: "cash", reference: "", account_number: "" }).success, true);
 for (const change of [{ amount_minor: 0 }, { amount_minor: -1 }, { amount_minor: 0.5 }, { amount_minor: Number.MAX_SAFE_INTEGER + 1 }, { account_number: "" }, { reference: "" }, { reference: null }, { request_key: "bad" }, { confirmed_by: 99 }, { received_at: "invalid" }]) assert.equal(schema.manualPaymentSchema.safeParse({ ...manual, ...change }).success, false, JSON.stringify(change));
});
test("payment proxy rejects unauthorized, cross-origin, invalid IDs and bodies before fetch", async () => {
 global.fetch = async () => assert.fail("invalid requests must not reach backend");
 assert.equal((await handlers.handlePaymentRequest(request("payment-requests", "GET", undefined, origin, ""))).status, 401);
 assert.equal((await handlers.handleManualPayment(request("payment-requests/1/transactions", "POST", manual, "https://foreign.example"), "1")).status, 403);
 assert.equal((await handlers.handleManualPayment(request("payment-requests/0/transactions", "POST", manual), "0")).status, 400);
 assert.equal((await handlers.handleManualPayment(request("payment-requests/1/transactions", "POST", { ...manual, amount_minor: null }), "1")).status, 400);
});
test("manual payment preserves request key and scope, validates backend result, never returns session token", async () => {
 let sent; global.fetch = async (url, options) => { sent = { url, options }; return Response.json({ success: true, data: { id: 8, payment_request_id: 7, status: "confirmed" } }, { status: 201 }); };
 const response = await handlers.handleManualPayment(request("payment-requests/7/transactions", "POST", manual), "7");
 assert.equal(response.status, 201); assert.ok(sent.url.endsWith("/payment-requests/7/transactions")); assert.deepEqual(JSON.parse(sent.options.body), manual); assert.equal(sent.options.headers.Authorization, "Bearer test-only"); assert.equal(response.headers.get("Cache-Control"), "no-store"); assert.equal(JSON.stringify(await response.json()).includes("test-only"), false);
 global.fetch = async () => Response.json({ success: true, data: { id: 8, status: "paid" } });
 assert.equal((await handlers.handleManualPayment(request("payment-requests/7/transactions", "POST", manual), "7")).status, 502);
});
test("review requires a target for confirmation and preserves rejection without target", () => {
 assert.equal(schema.reviewPaymentSchema.safeParse({ payment_request_id: null, status: "confirmed", note: "checked" }).success, false);
 assert.equal(schema.reviewPaymentSchema.safeParse({ payment_request_id: null, status: "rejected", note: "not a receipt" }).success, true);
});
test("supplement requires customer confirmation and rejects duplicate features", () => {
 const change = { request_key: manual.request_key, amount_minor: 500, currency: "VND", description: "Bổ sung làn", confirmation_note: "Khách đã đồng ý qua email", items: [{ feature_id: 1, enabled: true, limit_value: 0 }] };
 assert.equal(schema.changeInputSchema.safeParse(change).success, true);
 for (const patch of [{ confirmation_note: "" }, { items: [] }, { amount_minor: 0 }, { items: [...change.items, ...change.items] }]) assert.equal(schema.changeInputSchema.safeParse({ ...change, ...patch }).success, false);
});
test("unpaid quote subscription accepts null start and payment transaction lists preserve empty arrays", () => {
 assert.equal(subs.subscriptionSchema.safeParse({ id: 1, company_id: 1, plan_id: 1, source_quote_id: 1, price_id: null, amount_minor: 1000, currency: "VND", start_date: null, end_date: null, billing_cycle: "yearly", auto_renew: false, status: "pending", created_at: manual.received_at, updated_at: manual.received_at }).success, true);
 assert.deepEqual(schema.transactionListSchema.parse({ items: [], limit: 20, offset: 0 }).items, []);
});
