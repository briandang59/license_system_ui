import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, imports = {}) {
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const compiled = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => imports[name] ?? require(name), compiled, compiled.exports,
  );
  return compiled.exports;
}

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const domains = [["company", "companies"], ["plan", "plans"], ["feature", "features"]];
const origin = process.env.APP_ORIGIN || "http://localhost:3000";
const request = (plural, { method = "GET", cookie = "access_token=test-only", body, query = "", requestOrigin = origin } = {}) =>
  new Request(`http://localhost:3000/api/${plural}${query}`, {
    method, headers: { cookie, origin: requestOrigin, "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

for (const [name, plural] of domains) {
  const cap = name[0].toUpperCase() + name.slice(1);
  const schemas = load(`features/${plural}/schema.ts`);
  const handle = load(`features/${plural}/handler.ts`, { [`@/features/${plural}/schema`]: schemas })[`handle${cap}`];
  const input = { code: "TEST", name: "Test record", ...(name !== "company" ? { product_id: 1 } : {}) };
  const record = { ...input, id: 1, status: "active", created_at: "2026-10-16T09:00:00Z", updated_at: "2026-10-16T09:00:00Z",
    ...(name === "company" ? { tax_code: null, email: null, phone: null } : { description: null }),
    ...(name === "feature" ? { feature_type: "boolean", unit: null } : {}),
  };

  test(`${name}: validates create, PATCH fields and nullable clearing`, () => {
    assert.equal(schemas[`${name}InputSchema`].safeParse(input).success, true);
    assert.equal(schemas[`${name}InputSchema`].safeParse({ ...input, extra: true }).success, false);
    assert.equal(schemas[`${name}InputSchema`].safeParse({ ...input, code: "x" }).success, false);
    assert.equal(schemas[`${name}InputSchema`].safeParse({ ...input, status: "wrong" }).success, false);
    assert.equal(schemas[`${name}UpdateSchema`].safeParse({}).success, false);
    assert.equal(schemas[`${name}UpdateSchema`].safeParse({ name: null, status: null }).success, false);
    assert.equal(schemas[`${name}UpdateSchema`].safeParse({ name: "New name" }).success, true);
    const cleared = name === "company" ? { tax_code: null, email: null, phone: null } : { description: null };
    assert.deepEqual(schemas[`${name}UpdateSchema`].parse(cleared), cleared);
    if (name !== "company") {
      assert.equal(schemas[`${name}InputSchema`].safeParse({ ...input, product_id: 0 }).success, false);
      assert.equal(schemas[`${name}InputSchema`].safeParse({ ...input, product_id: Number.MAX_SAFE_INTEGER + 1 }).success, false);
    }
    if (name === "company") assert.equal(schemas.companyInputSchema.safeParse({ ...input, code: "x".repeat(51) }).success, false);
    if (name === "plan") assert.equal(schemas.planUpdateSchema.safeParse({ product_id: 2, code: "NEW" }).success, false);
    if (name === "feature") {
      assert.equal(schemas.featureInputSchema.safeParse({ ...input, feature_type: "invalid" }).success, false);
      assert.equal(schemas.featureUpdateSchema.safeParse({ product_id: 2, feature_type: "quantity", unit: null }).success, true);
    }
  });

  test(`${name}: rejects unauthenticated, foreign-origin and invalid requests before fetch`, async () => {
    let calls = 0;
    global.fetch = async () => { calls++; throw new Error("Unexpected fetch"); };
    assert.equal((await handle(request(plural, { cookie: "" }))).status, 401);
    assert.equal((await handle(request(plural, { method: "POST", requestOrigin: "https://foreign.example", body: input }))).status, 403);
    for (const id of ["0", "-1", "abc", "9007199254740992"]) assert.equal((await handle(request(plural), id)).status, 400);
    for (const query of ["?offset=-1", "?offset=1.5", "?offset=2147483648", "?offset=invalid"]) {
      assert.equal((await handle(request(plural, { query }))).status, 400);
    }
    assert.equal((await handle(request(plural, { method: "POST", body: {} }))).status, 400);
    assert.equal((await handle(request(plural, { method: "PATCH", body: {} }), "1")).status, 400);
    assert.equal((await handle(request(plural, { method: "PUT", body: input }), "1")).status, 405);
    assert.equal(calls, 0);
  });

  test(`${name}: forwards methods, pagination and validated responses without exposing credentials`, async () => {
    const calls = [];
    global.fetch = async (url, options) => {
      calls.push({ url, options });
      const data = options.method === "GET" && url.includes("?") ? { items: [record], limit: 20, offset: 20 } : record;
      return Response.json({ success: true, data }, { status: options.method === "POST" ? 201 : 200 });
    };
    const list = await handle(request(plural, { query: "?offset=20" }));
    assert.equal(list.status, 200);
    assert.equal((await list.json()).data.items[0].id, 1);
    assert.ok(calls[0].url.endsWith(`/${plural}?limit=20&offset=20`));
    assert.equal(calls[0].options.headers.Authorization, "Bearer test-only");
    assert.equal(calls[0].options.cache, "no-store");
    assert.ok(calls[0].options.signal instanceof AbortSignal);
    assert.equal((await handle(request(plural), "1")).status, 200);
    const created = await handle(request(plural, { method: "POST", body: input }));
    assert.equal(created.status, 201);
    assert.equal(created.headers.get("set-cookie"), null);
    assert.equal(created.headers.get("cache-control"), "no-store");
    const cleared = name === "company" ? { email: null } : { description: null };
    assert.equal((await handle(request(plural, { method: "PATCH", body: cleared }), "1")).status, 200);
    assert.deepEqual(JSON.parse(calls.at(-1).options.body), cleared);
    assert.equal(calls.at(-1).options.method, "PATCH");
  });

  test(`${name}: keeps DELETE empty and handles upstream errors and malformed responses`, async () => {
    global.fetch = async () => new Response(null, { status: 204 });
    const deleted = await handle(request(plural, { method: "DELETE" }), "1");
    assert.equal(deleted.status, 204);
    assert.equal(await deleted.text(), "");
    global.fetch = async () => Response.json({ success: false, error: { code: "RESOURCE_IN_USE", message: "secret backend detail" } }, { status: 409 });
    const rejected = await handle(request(plural, { method: "DELETE" }), "1");
    assert.equal(rejected.status, 409);
    const error = await rejected.json();
    assert.equal(error.error.code, "RESOURCE_IN_USE");
    assert.equal(JSON.stringify(error).includes("secret"), false);
    global.fetch = async () => Response.json({ success: true, data: { id: 1 } });
    assert.equal((await handle(request(plural), "1")).status, 502);
    global.fetch = async () => new Response("invalid JSON");
    assert.equal((await handle(request(plural))).status, 502);
    global.fetch = async () => { throw new Error("network"); };
    assert.equal((await handle(request(plural))).status, 502);
  });

  test(`${name}: service uses same-origin URLs, cancellation, PATCH payload and empty DELETE`, async () => {
    const urls = load(`features/${plural}/urls.ts`);
    const calls = [];
    const service = load(`features/${plural}/service.ts`, {
      [`@/features/${plural}/urls`]: urls,
      "@/lib/api": { api: async (url, options) => { calls.push({ url, options }); } },
    })[`${name}Service`];
    const signal = new AbortController().signal;
    await service.getAll(20, signal);
    await service.getById(1, signal);
    await service.create(input);
    await service.update(1, { name: "Updated" });
    await service.remove(1);
    assert.deepEqual(calls.map(({ url }) => url), [`/api/${plural}?limit=20&offset=20`, `/api/${plural}/1`, `/api/${plural}`, `/api/${plural}/1`, `/api/${plural}/1`]);
    assert.equal(calls[0].options.signal, signal);
    assert.equal(calls[1].options.signal, signal);
    assert.equal(calls[2].options.method, "POST");
    assert.deepEqual(JSON.parse(calls[3].options.body), { name: "Updated" });
    assert.equal(calls[3].options.method, "PATCH");
    assert.equal(calls[4].options.method, "DELETE");
  });

  test(`${name}: API route passes awaited dynamic params to its handler`, async () => {
    const calls = [];
    const routes = load(`app/api/${plural}/[id]/route.ts`, {
      [`@/features/${plural}/handler`]: { [`handle${cap}`]: async (_, id) => { calls.push(id); return new Response(); } },
    });
    for (const method of ["GET", "PATCH", "DELETE"]) {
      await routes[method](request(plural), { params: Promise.resolve({ id: "7" }) });
    }
    assert.deepEqual(calls, ["7", "7", "7"]);
  });

  test(`${name}: form sends nullable clears, keeps immutable plan fields out of PATCH, and blocks pending submits`, async () => {
    const calls = [];
    const formData = { ...input, status: "active", ...(name === "company" ? { tax_code: "", email: "", phone: "" } : { description: "" }),
      ...(name === "feature" ? { feature_type: "quantity", unit: "" } : {}),
    };
    let mutation;
    let pending = false;
    const imports = {
      antd: { App: { useApp: () => ({ message: {
        success: (message) => calls.push(["success", message]),
        error: (message) => calls.push(["error", message]),
      } }) }, Button: "button" },
      "react-hook-form": { useForm: () => ({ control: {}, handleSubmit: (callback) => () => callback(formData) }) },
      "@hookform/resolvers/zod": { zodResolver: () => {} },
      "@tanstack/react-query": {
        useQueryClient: () => ({ invalidateQueries: async (key) => calls.push(["invalidate", key]) }),
        useMutation: (options) => {
          mutation = options;
          return { isPending: pending, mutate: (data) => calls.push(["submit", data]) };
        },
      },
      "@/lib/api-errors": { getApiErrorMessage: () => "Request failed" },
      [`@/features/${plural}/schema`]: schemas,
      [`@/features/${plural}/service`]: { [`${name}Service`]: {
        create: async (data) => calls.push(["create", data]),
        update: async (id, data) => calls.push(["update", id, data]),
      } },
    };
    for (const control of ["input", "select", "textarea"]) imports[`@/components/form/form-${control}`] = { default: control };
    imports["@/features/products/product-select"] = { default: "product-select" };
    const Form = load(`features/${plural}/form.tsx`, imports)[`${cap}Form`];
    let saved = 0;
    const form = Form({ [name]: record, onSaved: () => saved++ });
    form.props.onSubmit();
    assert.equal(calls[0][0], "submit");
    await mutation.mutationFn(formData);
    const [, id, payload] = calls.at(-1);
    assert.equal(id, record.id);
    if (name === "plan") {
      assert.equal("code" in payload, false);
      assert.equal("product_id" in payload, false);
    } else assert.equal(payload.code, formData.code);
    for (const field of name === "company" ? ["tax_code", "email", "phone"] : ["description", ...(name === "feature" ? ["unit"] : [])]) {
      assert.equal(payload[field], null);
    }
    await mutation.onSuccess();
    assert.equal(saved, 1);
    assert.ok(calls.some((call) => call[0] === "success" && call[1] === `${cap} updated.`));
    assert.deepEqual(calls.at(-1), ["invalidate", { queryKey: [plural] }]);
    mutation.onError(new Error("secret backend detail"));
    assert.deepEqual(calls.at(-1), ["error", "Request failed"]);
    pending = true;
    const blocked = Form({ onSaved: () => saved++ });
    const count = calls.length;
    blocked.props.onSubmit();
    assert.equal(calls.length, count);
    await mutation.mutationFn(formData);
    assert.equal(calls.at(-1)[0], "create");
    if (name !== "company") assert.equal(calls.at(-1)[1].product_id, 1);
  });
}

test("product selector loads further pages, keeps selected products and retries failures", () => {
  const calls = [];
  const { default: ProductSelect } = load("features/products/product-select.tsx", {
    antd: { Alert: "alert", Button: "button" },
    "@/components/form/form-select": { default: "select" },
    "@/features/products/service": { productService: {} },
    "@/lib/api-errors": { getApiErrorMessage: () => "Products unavailable" },
    "@tanstack/react-query": {
      useInfiniteQuery: (options) => {
        assert.equal(options.getNextPageParam({ items: Array(20), limit: 20, offset: 20 }), 40);
        assert.equal(options.getNextPageParam({ items: [], limit: 20, offset: 40 }), undefined);
        return { data: { pages: [{ items: [{ id: 1, name: "First", code: "ONE" }] }] },
          hasNextPage: true, isError: true, error: new Error(),
          refetch: () => calls.push("retry"), fetchNextPage: () => calls.push("next"),
        };
      },
      useQuery: () => ({ data: { id: 99, name: "Selected", code: "SELECTED" } }),
    },
  });
  const [select, error, more] = ProductSelect({ control: {}, name: "product_id", label: "Product", productId: 99 }).props.children;
  assert.deepEqual(select.props.options.map(({ value }) => value), [1, 99]);
  more.props.onClick();
  error.props.children.props.action.props.onClick();
  assert.deepEqual(calls, ["next", "retry"]);
});

test("shared catalog errors are safe and domain-neutral", () => {
  const api = load("lib/api.ts");
  const { getApiErrorMessage } = load("lib/api-errors.ts", { "./api": api });
  for (const code of ["ALREADY_EXISTS", "RESOURCE_IN_USE", "VALIDATION_ERROR"]) {
    const message = getApiErrorMessage(new api.ApiError(400, "secret", code));
    assert.doesNotMatch(message, /secret|product|password/);
  }
});
