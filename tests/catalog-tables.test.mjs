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
const controls = { Button: "button", Popconfirm: "confirm", Space: "space", Tag: "tag", Input: { Search: "search" }, Table: "table", Alert: "alert", Descriptions: "descriptions", Modal: "modal", Spin: "spin" };
const format = load("utils/functions/formatDateTime.ts");
const find = (node, type) => {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap((item) => find(item, type));
  return [...(node.type === type ? [node] : []), ...find(node.props?.children, type)];
};

for (const [name, plural] of [["product", "products"], ["company", "companies"], ["plan", "plans"], ["feature", "features"]]) {
  const cap = name[0].toUpperCase() + name.slice(1);
  const columnsModule = load(`features/${plural}/columns.tsx`, { antd: controls });
  const descriptionsModule = load(`features/${plural}/descriptions.ts`, { "@/utils/functions/formatDateTime": format });

  test(`${plural}: display row numbers, hide technical IDs and keep accessible icon actions`, () => {
    const calls = [];
    const columns = columnsModule[`get${cap}Columns`]({
      offset: 40, isDeleting: false,
      onView: (id) => calls.push(["view", id]),
      onEdit: (id) => calls.push(["edit", id]),
      onDelete: (id) => calls.push(["delete", id]),
      onAddFeatures: (plan) => calls.push(["addFeatures", plan.id]),
    });
    assert.equal(columns[0].render(null, {}, 0), 41);
    assert.equal(columns[0].render(null, {}, 19), 60);
    assert.ok(columns.every(({ dataIndex }) => !/(^|_)id$/.test(dataIndex ?? "")));
    const record = { id: 99, name: "Example", product_id: 500, created_at: "2026-10-16", updated_at: "2026-10-16" };
    const items = descriptionsModule[`get${cap}DescriptionItems`](record);
    assert.ok(items.every(({ key }) => !/(^|_)id$/.test(key)));
    const actions = columns.at(-1).render(null, record);
    const buttons = find(actions, "button");
    const [view, edit, remove] = name === "plan" ? buttons.slice(1) : buttons;
    for (const button of [view, edit, remove]) {
      assert.ok(button.props["aria-label"].includes("Example"));
      assert.ok(button.props.title);
      assert.equal(button.props.children, undefined);
      assert.equal(button.props.icon.props["aria-hidden"], "true");
    }
    view.props.onClick();
    edit.props.onClick();
    find(actions, "confirm")[0].props.onConfirm();
    assert.deepEqual(calls, [["view", 99], ["edit", 99], ["delete", 99]]);
    if (name === "plan") {
      buttons[0].props.onClick();
      assert.deepEqual(calls.at(-1), ["addFeatures", 99]);
      assert.match(buttons[0].props["aria-label"], /Example/);
    }
  });

  test(`${plural}: service and handler safely forward trimmed backend search and omit empty search`, async () => {
    const urls = load(`features/${plural}/urls.ts`);
    const calls = [];
    const service = load(`features/${plural}/service.ts`, {
      [`@/features/${plural}/urls`]: urls,
      "@/lib/api": { api: async (path, options) => calls.push({ path, options }) },
    })[`${name}Service`];
    const term = "  Việt &offset=999 +/?  ";
    const signal = new AbortController().signal;
    await service.getAll(20, signal, term);
    const query = new URL(calls[0].path, "http://localhost:3000").searchParams;
    assert.equal(query.get("search"), term.trim());
    assert.equal(query.get("offset"), "20");
    assert.equal(calls[0].options.signal, signal);
    await service.getAll(0, signal, "   ");
    assert.equal(new URL(calls[1].path, "http://localhost:3000").searchParams.has("search"), false);
    const schemas = load(`features/${plural}/schema.ts`);
    const handle = load(`features/${plural}/handler.ts`, { [`@/features/${plural}/schema`]: schemas })[`handle${cap}`];
    const upstream = [];
    global.fetch = async (url) => {
      upstream.push(new URL(url));
      return Response.json({ success: true, data: { items: [], limit: 20, offset: 20 } });
    };
    const response = await handle(new Request(`http://localhost:3000${calls[0].path}`, { headers: { cookie: "access_token=test-only" } }));
    assert.equal(response.status, 200);
    assert.equal(upstream[0].searchParams.get("search"), term.trim());
    assert.equal(upstream[0].searchParams.get("offset"), "20");
    await handle(new Request(`http://localhost:3000${calls[1].path}`, { headers: { cookie: "access_token=test-only" } }));
    assert.equal(upstream[1].searchParams.has("search"), false);
  });

  test(`${plural}: checkbox selection, applied search and pagination stay in sync`, async () => {
    const state = [20, "old", [99], null];
    let cursor = 0;
    let mutation;
    const queries = [];
    const calls = [];
    const imports = {
      react: { useState: (initial) => {
        const index = cursor++;
        if (state[index] === undefined) state[index] = initial;
        return [state[index], (value) => { state[index] = value; }];
      } },
      antd: { ...controls, App: { useApp: () => ({ message: {
        success: (message) => calls.push(["success", message]),
        error: (message) => calls.push(["error", message]),
      } }) } },
      "@tanstack/react-query": {
        useQueryClient: () => ({ invalidateQueries: async (key) => calls.push(["invalidate", key]) }),
        useQuery: (options) => {
          queries.push(options);
          return options.queryKey[1] === "list" ? { data: { items: Array(20).fill({ id: 99 }) } } : { isPending: true };
        },
        useMutation: (options) => { mutation = options; return { mutate: () => {} }; },
      },
      [`@/features/${plural}/form`]: { [`${cap}Form`]: "form" },
      [`@/features/${plural}/service`]: { [`${name}Service`]: {
        getAll: async (...args) => calls.push(["getAll", ...args]),
      } },
      [`@/features/${plural}/columns`]: columnsModule,
      [`@/features/${plural}/descriptions`]: descriptionsModule,
      "@/lib/api-errors": { getApiErrorMessage: () => "Request failed" },
      "@/features/plans/plan-features-modal": { default: "plan-features-modal" },
    };
    const Page = load(`features/${plural}/page.tsx`, imports).default;
    const render = () => { cursor = 0; queries.length = 0; return Page(); };
    let tree = render();
    const table = () => find(tree, "table")[0];
    assert.equal(table().props.rowKey, "id");
    assert.equal(table().props.rowSelection.type, "checkbox");
    assert.deepEqual(table().props.rowSelection.selectedRowKeys, [99]);
    assert.deepEqual(queries[0].queryKey, [plural, "list", 20, "old"]);
    const signal = new AbortController().signal;
    await queries[0].queryFn({ signal });
    assert.deepEqual(calls.at(-1), ["getAll", 20, signal, "old"]);
    find(tree, "search")[0].props.onSearch("  updated  ");
    tree = render();
    assert.deepEqual(queries[0].queryKey, [plural, "list", 0, "updated"]);
    assert.deepEqual(table().props.rowSelection.selectedRowKeys, []);
    table().props.rowSelection.onChange([88]);
    tree = render();
    assert.deepEqual(table().props.rowSelection.selectedRowKeys, [88]);
    find(tree, "button").find((button) => button.props.children === "Next").props.onClick();
    tree = render();
    assert.equal(state[0], 20);
    assert.deepEqual(table().props.rowSelection.selectedRowKeys, []);
    table().props.rowSelection.onChange([88]);
    tree = render();
    await mutation.onSuccess();
    assert.deepEqual(state[2], []);
    assert.ok(calls.some((call) => call[0] === "success" && call[1] === `${cap} deleted.`));
    assert.deepEqual(calls.at(-1), ["invalidate", { queryKey: [plural] }]);
    mutation.onError(new Error("secret"));
    assert.deepEqual(calls.at(-1), ["error", "Request failed"]);
    find(tree, "search")[0].props.onSearch("");
    tree = render();
    assert.deepEqual(queries[0].queryKey, [plural, "list", 0, ""]);
  });
}
