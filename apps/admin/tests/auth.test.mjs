import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const loadDependency = createRequire(import.meta.url);

function load(path, imports = {}) {
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const compiled = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => imports[name] ?? loadDependency(name), compiled, compiled.exports,
  );
  return compiled.exports;
}

const schemas = load("features/auth/schema.ts");
const { handleAuth } = load("features/auth/handler.ts", { "@/features/auth/schema": schemas });
const { POST } = load("app/api/auth/login/route.ts", { "@/features/auth/handler": { handleAuth } });
const { proxy, config } = load("proxy.ts");
const { NextRequest } = loadDependency("next/server");
const { unstable_doesMiddlewareMatch } = loadDependency("next/experimental/testing/server");

test("page redirects follow access-token cookie presence", () => {
  for (const [path, cookie, destination] of [
    ["/", "", "/auth/login"],
    ["/licenses", "", "/auth/login"],
    ["/auth/login", "", null],
    ["/auth/login", "access_token=test", "/"],
    ["/", "access_token=test", null],
    ["/", "access_token=", "/auth/login"],
  ]) {
    const response = proxy(new NextRequest(`http://localhost:3000${path}`, {
      headers: { cookie },
    }));
    assert.equal(response.headers.get("location"), destination ? `http://localhost:3000${destination}` : null);
  }
});

test("proxy covers pages and excludes API and static assets", () => {
  for (const [url, expected] of [
    ["/", true], ["/auth/login", true], ["/licenses", true],
    ["/api/auth/login", false], ["/_next/static/test.js", false],
    ["/favicon.ico", false], ["/next.svg", false], ["/auth-workspace.svg", false],
  ]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }), expected);
  }
});
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

function request(body, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST", headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
const credentials = { email: "test@example.com", password: "test-only" };

test("configured public origin accepts Docker requests and rejects foreign or missing origins", async () => {
  const previous = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = "https://license.example.com";
  global.fetch = () => { throw new Error("Backend must not be called for invalid input"); };
  try {
    const productSchemas = load("features/products/schema.ts");
    const { handleProduct } = load("features/products/handler.ts", { "@/features/products/schema": productSchemas });
    for (const origin of [process.env.APP_ORIGIN, "https://other.example", null]) {
      const headers = { "Content-Type": "application/json", cookie: "access_token=test" };
      if (origin) headers.origin = origin;
      const makeRequest = () => new Request("http://0.0.0.0:3000/api/test", {
        method: "POST", headers, body: "{}",
      });
      const expected = origin === process.env.APP_ORIGIN ? 400 : 403;
      assert.equal((await handleAuth(makeRequest(), "login")).status, expected);
      assert.equal((await handleProduct(makeRequest())).status, expected);
    }
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previous;
  }
});

test("auth services use centralized paths, methods and request bodies", async () => {
  const { authUrls } = load("features/auth/urls.ts");
  const calls = [];
  const { authService } = load("features/auth/service.ts", {
    "@/features/auth/urls": { authUrls },
    "@/lib/api": { api: async (path, options) => { calls.push({ path, options }); } },
  });
  await authService.login(credentials);
  await authService.register({ ...credentials, invite_token: "test" });
  await authService.logout();
  await authService.refresh();
  const signal = new AbortController().signal;
  await authService.me(signal);
  assert.deepEqual(calls.map(({ path }) => path), [
    "/api/auth/login", "/api/auth/register", "/api/auth/logout", "/api/auth/refresh", "/api/auth/me",
  ]);
  assert.ok(calls.slice(0, 4).every(({ options }) => options.method === "POST"));
  assert.deepEqual(JSON.parse(calls[0].options.body), credentials);
  assert.equal(calls[4].options.signal, signal);
});

test("logout waits for query cancellation before clearing cache and navigating", async () => {
  const calls = [];
  let completeCancellation;
  const cancellation = new Promise((resolve) => { completeCancellation = resolve; });
  const logout = () => {};
  const { useLogout } = load("features/auth/use-logout.ts", {
    antd: { App: { useApp: () => ({ message: {
      success: (message) => calls.push(message),
      error: (message) => calls.push(message),
    } }) } },
    "@/lib/api-errors": { getApiErrorMessage: () => "Safe logout error" },
    "next/navigation": { useRouter: () => ({
      replace: (path) => calls.push(path),
      refresh: () => calls.push("refresh"),
    }) },
    "@tanstack/react-query": {
      useMutation: (options) => options,
      useQueryClient: () => ({
        cancelQueries: () => { calls.push("cancel"); return cancellation; },
        clear: () => calls.push("clear"),
      }),
    },
    "@/features/auth/service": { authService: { logout } },
  });
  const mutation = useLogout();
  assert.equal(mutation.mutationFn, logout);
  assert.equal(mutation.retry, false);
  const completion = mutation.onSuccess();
  assert.deepEqual(calls, ["cancel"]);
  completeCancellation();
  await completion;
  assert.deepEqual(calls, ["cancel", "clear", "Đăng xuất thành công.", "/auth/login", "refresh"]);
  mutation.onError(new Error("secret"));
  assert.equal(calls.at(-1), "Safe logout error");
});

test("shared Ant Design input renders password fields and marks invalid fields", () => {
  const { createElement } = loadDependency("react");
  const { renderToStaticMarkup } = loadDependency("react-dom/server");
  const { useForm } = loadDependency("react-hook-form");
  const FormInput = load("components/form/form-input.tsx", {
    "./form-field": load("components/form/form-field.tsx"),
  }).default;
  function Example() {
    const { control } = useForm({
      defaultValues: { password: "" },
      errors: { password: { type: "required", message: "Vui lòng nhập mật khẩu." } },
    });
    return createElement(FormInput, { control, name: "password", label: "Mật khẩu", type: "password" });
  }
  const html = renderToStaticMarkup(createElement(Example));
  assert.match(html, /type="password"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="[^"]+-error"/);
  assert.match(html, /ant-form-item-has-error/);
});

test("login validates email and requires a password without trimming it", () => {
  assert.equal(schemas.loginSchema.safeParse({ email: "bad", password: "" }).success, false);
  assert.equal(schemas.loginSchema.parse({ ...credentials, password: " pass " }).password, " pass ");
});

test("rejects invalid input and cross-origin requests before calling backend", async () => {
  global.fetch = () => { throw new Error("Backend must not be called"); };
  assert.equal((await POST(request({}))).status, 400);
  assert.equal((await POST(request(credentials, "https://other.example"))).status, 403);
});

test("sets an HttpOnly cookie and never returns the token to JavaScript", async () => {
  global.fetch = async () => Response.json({ success: true, data: {
    access_token: "test-token", expires_in: 900, token_type: "Bearer",
  } });
  const response = await POST(request(credentials));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: null });
  assert.match(response.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(response.headers.get("set-cookie"), /Max-Age=900/i);
});

test("business errors, malformed responses and network failures do not set cookies", async () => {
  for (const mock of [
    async () => Response.json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid" } }),
    async () => Response.json({ success: true, data: {} }),
    async () => { throw new Error("Offline"); },
  ]) {
    global.fetch = mock;
    const response = await POST(request(credentials));
    assert.ok(response.status >= 400);
    assert.equal(response.headers.get("set-cookie"), null);
  }
});

function authRequest(action, cookie = "", method = "POST") {
  return new Request(`http://localhost:3000/api/auth/${action}`, {
    method, headers: { origin: "http://localhost:3000", cookie },
  });
}

test("logout forwards refresh cookie, revokes upstream session and clears both cookies", async () => {
  global.fetch = async (url, options) => {
    assert.match(url, /\/auth\/logout$/);
    assert.equal(options.headers.get("Cookie"), "license_refresh=test-refresh");
    return new Response(null, { status: 204 });
  };
  const response = await handleAuth(authRequest("logout", "access_token=test; license_refresh=test-refresh"), "logout");
  assert.equal(response.status, 204);
  assert.equal(response.cookies.get("access_token").value, "");
  assert.equal(response.cookies.get("license_refresh").value, "");
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
});

test("failed logout keeps cookies and reports failure", async () => {
  global.fetch = async () => { throw new Error("Offline"); };
  const response = await handleAuth(authRequest("logout", "license_refresh=test-refresh"), "logout");
  assert.equal(response.status, 502);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("refresh rotates both HttpOnly cookies without exposing tokens", async () => {
  global.fetch = async (_url, options) => {
    assert.equal(options.headers.get("Cookie"), "license_refresh=old");
    return Response.json({ success: true, data: { access_token: "new-access", expires_in: 900, token_type: "Bearer" } },
      { headers: { "Set-Cookie": "license_refresh=new-refresh; Path=/; HttpOnly; Max-Age=604800" } });
  };
  const response = await handleAuth(authRequest("refresh", "license_refresh=old"), "refresh");
  assert.equal(response.cookies.get("access_token").value, "new-access");
  assert.equal(response.cookies.get("license_refresh").value, "new-refresh");
  assert.deepEqual(await response.json(), { success: true, data: null });
});

test("me requires an access token and forwards Bearer authentication", async () => {
  global.fetch = async (_url, options) => {
    assert.equal(options.headers.get("Authorization"), "Bearer test");
    return Response.json({ success: true, data: { id: 1, email: "test@example.com" } });
  };
  assert.equal((await handleAuth(authRequest("me", "", "GET"), "me")).status, 401);
  const response = await handleAuth(authRequest("me", "access_token=test", "GET"), "me");
  assert.equal((await response.json()).data.email, "test@example.com");
});

test("register rejects invalid invitations and password inputs locally", async () => {
  assert.equal((await handleAuth(request(credentials), "register")).status, 400);
});

test("login and register forward the backend refresh cookie", async () => {
  for (const action of ["login", "register"]) {
    global.fetch = async (url, options) => {
      assert.ok(url.endsWith(`/auth/${action}`));
      const input = JSON.parse(options.body);
      assert.equal(input.email, credentials.email);
      if (action === "register") assert.equal(input.invite_token, "test-invite");
      return Response.json({ success: true, data: { access_token: "test", expires_in: 900, token_type: "Bearer" } }, {
        status: action === "register" ? 201 : 200,
        headers: { "Set-Cookie": "license_refresh=test-refresh; Path=/; HttpOnly" },
      });
    };
    const response = await handleAuth(request({ ...credentials, password: "test-password-long", invite_token: "test-invite" }), action);
    assert.equal(response.cookies.get("license_refresh").value, "test-refresh");
    assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  }
});

test("refresh refuses cross-origin requests and requests without a refresh cookie", async () => {
  global.fetch = () => { throw new Error("Backend must not be called"); };
  assert.equal((await handleAuth(request({}, "https://other.example"), "refresh")).status, 403);
  assert.equal((await handleAuth(authRequest("refresh"), "refresh")).status, 401);
});
