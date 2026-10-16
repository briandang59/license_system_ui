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
    (name) => imports[name] ?? require(name), compiled, compiled.exports,
  );
  return compiled.exports;
}

const { getProductColumns } = load("features/products/columns.tsx", {
  antd: { Button: "button", Popconfirm: "confirm", Space: "space", Tag: "tag" },
});
const { getProductDescriptionItems } = load("features/products/descriptions.ts", {
  "@/utils/functions/formatDateTime": load("utils/functions/formatDateTime.ts"),
});

test("product actions preserve record IDs, confirmation and pending deletion state", () => {
  const calls = [];
  for (const isDeleting of [false, true]) {
    const columns = getProductColumns({
      offset: 20,
      onView: (id) => calls.push(["view", id]),
      onEdit: (id) => calls.push(["edit", id]),
      onDelete: (id) => calls.push(["delete", id]),
      isDeleting,
      deletingId: 7,
    });
    assert.equal(columns[0].render(null, { id: 7 }, 0), 21);
    assert.equal(columns[0].render(null, { id: 7 }, 5), 26);
    const [view, edit, confirmation] = columns.at(-1).render(null, { id: 7 }).props.children;
    view.props.onClick();
    edit.props.onClick();
    assert.equal(confirmation.type, "confirm");
    assert.equal(confirmation.props.children.props.disabled, isDeleting);
    assert.equal(confirmation.props.children.props.loading, isDeleting);
    const otherRow = columns.at(-1).render(null, { id: 8 }).props.children.at(-1);
    assert.equal(otherRow.props.children.props.loading, false);
    confirmation.props.onConfirm();
  }
  assert.deepEqual(calls, [["view", 7], ["edit", 7], ["delete", 7], ["view", 7], ["edit", 7]]);
});

test("product descriptions preserve values, empty fallback and date formatting", () => {
  for (const description of [null, "", "Product description"]) {
    const items = getProductDescriptionItems({
      code: "CODE", name: "Product", status: "active", description,
      created_at: "2026-10-16T09:00:00", updated_at: "2026-10-16T10:00:00",
    });
    assert.deepEqual(items.map(({ children }) => children), [
      "CODE", "Product", description || "—", "active", "2026-10-16 09:00:00", "2026-10-16 10:00:00",
    ]);
  }
});
