import { test } from "node:test";
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
    (name) => imports[name] ?? (name === "@/lib/display-labels" ? load("lib/display-labels.ts") : require(name)), compiled, compiled.exports,
  );
  return compiled.exports;
}

for (const domain of ["product", "login"]) {
  test(`${domain}: success and safe error messages are emitted by mutation callbacks`, async () => {
    const calls = [];
    let mutation;
    const imports = {
      antd: { Button: "button", App: { useApp: () => ({ message: {
        success: (content) => calls.push(["success", content]),
        error: (content) => calls.push(["error", content]),
      } }) } },
      "react-hook-form": { useForm: () => ({ control: {}, handleSubmit: () => {}, resetField: () => calls.push(["reset password"]) }) },
      "@hookform/resolvers/zod": { zodResolver: () => {} },
      "@tanstack/react-query": {
        useMutation: (options) => { mutation = options; return {}; },
        useQueryClient: () => ({ clear: () => calls.push(["clear"]), invalidateQueries: async () => calls.push(["invalidate"]) }),
      },
      "next/navigation": { useRouter: () => ({ replace: (url) => calls.push(["navigate", url]), refresh: () => {} }) },
      "@/features/products/schema": {},
      "@/features/products/service": { productService: {} },
      "@/features/auth/schema": {},
      "@/features/auth/service": { authService: {} },
      "@/lib/api-errors": { getApiErrorMessage: () => "Safe request error" },
    };
    for (const control of ["input", "select", "textarea"]) imports[`@/components/form/form-${control}`] = { default: control };
    const render = domain === "product"
      ? load("features/products/form.tsx", imports).ProductForm
      : load("features/auth/login-page.tsx", imports).default;
    render({ onSaved: () => calls.push(["saved"]) });
    await mutation.onSuccess();
    assert.deepEqual(calls[0], ["success", domain === "product" ? "Đã tạo sản phẩm." : "Đăng nhập thành công."]);
    assert.ok(calls.some((call) => call[0] === (domain === "product" ? "saved" : "navigate")));
    const before = calls.length;
    mutation.onError(new Error("secret backend message"));
    assert.equal(calls.length, before + 1);
    assert.deepEqual(calls.at(-1), ["error", "Safe request error"]);
    if (domain === "product") {
      render({ product: { id: 1 }, onSaved: () => {} });
      await mutation.onSuccess();
      assert.ok(calls.some((call) => call[0] === "success" && call[1] === "Đã cập nhật sản phẩm."));
    }
  });
}
