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
    (name) => imports[name] ?? (["@/features/pricing/panel", "@/features/units/unit-label", "@/features/data-transfer/actions", "@/features/plans/included-features"].includes(name) ? (() => null) : (name === "@/lib/display-labels" ? load("lib/display-labels.ts") : require(name))), compiled, compiled.exports,
  );
  return compiled.exports;
}
const schemas = load("features/plans/schema.ts");
const { handlePlan } = load("features/plans/handler.ts", { "@/features/plans/schema": schemas });
const origin = process.env.APP_ORIGIN || "http://localhost:3000";
const request = ({ method = "GET", body, cookie = "access_token=test-only", requestOrigin = origin, query = "" } = {}) =>
  new Request(`http://localhost:3000/api/plans/7/features${query}`, {
    method, headers: { cookie, origin: requestOrigin, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const input = { feature_id: 9, enabled: true, limit_value: 0 };
const record = { ...input, id: 1, plan_id: 7, created_at: "2026-10-16", updated_at: "2026-10-16" };
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test("plan features: validate IDs, origin, session, methods and integer limits before fetch", async () => {
  let calls = 0;
  global.fetch = async () => { calls++; throw new Error("Unexpected fetch"); };
  assert.equal((await handlePlan(request({ cookie: "" }), "7", "features")).status, 401);
  assert.equal((await handlePlan(request({ method: "POST", body: input, requestOrigin: "https://foreign.example" }), "7", "features")).status, 403);
  for (const id of ["0", "x", "9007199254740992", undefined]) {
    assert.equal((await handlePlan(request(), id, "features")).status, 400);
  }
  for (const body of [{}, { ...input, extra: true }, { ...input, feature_id: 0 }, { ...input, enabled: "yes" }, ...[-1, 1.5, Number.MAX_SAFE_INTEGER + 1].map((limit_value) => ({ ...input, limit_value }))]) {
    assert.equal((await handlePlan(request({ method: "POST", body }), "7", "features")).status, 400);
  }
  assert.equal((await handlePlan(request({ method: "PATCH", body: input }), "7", "features")).status, 405);
  assert.equal((await handlePlan(request({ query: "?offset=-1" }), "7", "features")).status, 400);
  assert.equal(calls, 0);
  assert.equal(schemas.planFeatureInputSchema.safeParse({ ...input, limit_value: null }).success, true);
  assert.equal(schemas.planFeatureInputSchema.safeParse(input).success, true);
});

test("plan features: forward list/create with no-store, validate response and hide backend errors", async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json({ success: true, data: options.method === "GET" ? { items: [record], offset: 20, limit: 20 } : record }, { status: options.method === "POST" ? 201 : 200 });
  };
  assert.equal((await handlePlan(request({ query: "?offset=20" }), "7", "features")).status, 200);
  assert.ok(calls[0].url.endsWith("/plans/7/features?limit=20&offset=20"));
  const created = await handlePlan(request({ method: "POST", body: input }), "7", "features");
  assert.equal(created.status, 201);
  assert.deepEqual((await created.json()).data, record);
  assert.equal(created.headers.get("cache-control"), "no-store");
  assert.equal(created.headers.get("set-cookie"), null);
  assert.equal(calls[1].options.cache, "no-store");
  assert.ok(calls[1].options.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(calls[1].options.body), input);
  global.fetch = async () => Response.json({ success: false, error: { code: "ALREADY_EXISTS", message: "secret" } }, { status: 409 });
  const rejected = await handlePlan(request({ method: "POST", body: input }), "7", "features");
  assert.equal(rejected.status, 409);
  assert.doesNotMatch(await rejected.text(), /secret/);
  global.fetch = async () => Response.json({ success: true, data: { id: 1 } });
  assert.equal((await handlePlan(request(), "7", "features")).status, 502);
  global.fetch = async () => { throw new Error("network"); };
  assert.equal((await handlePlan(request(), "7", "features")).status, 502);
});

test("plan features: fetch every assigned page and add concurrently with partial failure", async () => {
  const calls = [];
  const pending = [];
  const signal = new AbortController().signal;
  const { planService } = load("features/plans/service.ts", {
    "@/features/plans/urls": load("features/plans/urls.ts"),
    "@/lib/api": { api: (url, options) => {
      calls.push({ url, options });
      if (options.method === "POST") return new Promise((resolve, reject) => pending.push({ resolve, reject }));
      return Promise.resolve(calls.length === 1 ? { items: Array(20).fill(record), limit: 20, offset: 0 } : { items: [], limit: 20, offset: 20 });
    } },
  });
  assert.equal((await planService.getFeatures(7, signal)).length, 20);
  assert.deepEqual(calls.map((call) => call.url), ["/api/plans/7/features?offset=0", "/api/plans/7/features?offset=20"]);
  assert.ok(calls.every((call) => call.options.signal === signal));
  const resultPromise = planService.addFeatures(7, [input, { ...input, feature_id: 10 }]);
  assert.equal(pending.length, 2, "both requests start before either resolves");
  pending[1].reject(new Error("failed"));
  pending[0].resolve(record);
  const results = await resultPromise;
  assert.deepEqual(results.map((result) => result.status), ["fulfilled", "rejected"]);
  assert.deepEqual(JSON.parse(calls[2].options.body), input);
});

test("plan features: route awaits plan ID", async () => {
  const calls = [];
  const routes = load("app/api/plans/[id]/features/route.ts", {
    "@/features/plans/handler": { handlePlan: async (_, ...args) => { calls.push(args); return new Response(); } },
  });
  for (const method of ["GET", "POST"]) await routes[method](request(), { params: Promise.resolve({ id: "7" }) });
  assert.deepEqual(calls, [["7", "features"], ["7", "features"]]);
});

const find = (node, type) => {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap((child) => find(child, type));
  return [...(node.type === type ? [node] : []), ...find(node.props?.children, type)];
};

test("plan overview: proxy retains included product and disabled features, and rejects missing requested relations", async () => {
  const included = { feature_id: 9, code: "CAMERAS", name: "Cameras", feature_type: "quantity", unit: null, unit_id: 8, enabled: false, limit_value: 0 };
  const plan = { id: 7, product_id: 1, code: "PRO", name: "Pro", description: null, status: "active", created_at: "now", updated_at: "now", features: [included], product: {id:1,code:"APP",name:"App"} };
  let calls = 0;
  let payload = plan;
  global.fetch = async url => {
    calls++;
    assert.equal(new URL(url).searchParams.get("include"), "features,product");
    return Response.json({success:true,data:{items:[payload],limit:20,offset:0}});
  };
  const req = include => new Request(`http://localhost/api/plans?include=${include}`, {headers:{cookie:"access_token=test-only"}});
  const res = await handlePlan(req("features,product"));
  assert.equal(res.status,200);
  assert.deepEqual((await res.json()).data.items[0],plan);
  payload = {...plan, features:undefined};
  assert.equal((await handlePlan(req("features,product"))).status,502);
  assert.equal((await handlePlan(req("secret"))).status,400);
  assert.equal(calls,2);
});

test("included features: distinguish disabled, zero, unset and unlimited without hiding configured records", () => {
  const Included = load("features/plans/included-features.tsx", {
    antd:{Table:"table",Tag:"tag"},
    "./plan-feature-editor": {__esModule:true,default:"editor"},
  }).default;
  const quantity = {feature_id:1,name:"Camera",code:"CAM",feature_type:"quantity",unit:null,unit_id:8,enabled:false,limit_value:0};
  const tree = Included({plan:{features:[quantity]}});
  assert.equal(tree.props.dataSource.length,1);
  const availability = tree.props.columns.find(c=>c.title==="Trạng thái sử dụng").render(null,quantity);
  assert.equal(availability.props.children,"Tắt");
  const limit = tree.props.columns.find(c=>c.title==="Hạn mức").render;
  assert.equal(limit(null,quantity).props.children[0],"0");
  assert.equal(limit(null,{...quantity,limit_value:null}),"Chưa cấu hình");
  assert.equal(limit(null,{...quantity,feature_type:"unlimited"}),"Không giới hạn");
  assert.match(Included({plan:{features:[]}}).props.children,/Chưa có tính năng/);
  assert.match(Included({plan:{}}).props.children,/Không có thông tin/);
});

test("plan feature update proxy: enforces session, origin, parent/feature IDs and PATCH shape; retains false, zero and null", async () => {
  const calls = [];
  const req = (body, overrides={}) => new Request(`${origin}/api/plans/7/features/9`, {
    method:"PATCH", headers:{cookie:"access_token=test-only",origin,"Content-Type":"application/json",...overrides},body:JSON.stringify(body),
  });
  global.fetch = async (url,options) => {
    calls.push({url,options});
    return Response.json({success:true,data:{...record,...JSON.parse(options.body)}});
  };
  assert.equal((await handlePlan(req({enabled:false},{cookie:""}),"7","features","9")).status,401);
  assert.equal((await handlePlan(req({enabled:false},{origin:"https://foreign.example"}),"7","features","9")).status,403);
  for (const [id,fid] of [["0","9"],["7","0"],["7","x"],["7","9007199254740992"]])
    assert.equal((await handlePlan(req({enabled:false}),id,"features",fid)).status,400);
  for (const payload of [{},{feature_id:9},{enabled:null},{limit_value:-1},{limit_value:1.5}])
    assert.equal((await handlePlan(req(payload),"7","features","9")).status,400);
  assert.equal(calls.length,0);
  for (const limit_value of [0,null]) {
    assert.equal((await handlePlan(req({enabled:false,limit_value}),"7","features","9")).status,200);
    assert.deepEqual(JSON.parse(calls.at(-1).options.body),{enabled:false,limit_value});
    assert.ok(calls.at(-1).url.endsWith("/plans/7/features/9"));
    assert.equal(calls.at(-1).options.cache,"no-store");
  }
  global.fetch = async()=>Response.json({success:false,error:{code:"NOT_FOUND",message:"secret"}},{status:404});
  const missing=await handlePlan(req({enabled:true}),"7","features","9");
  assert.equal(missing.status,404); assert.doesNotMatch(await missing.text(),/secret/);
  global.fetch = async()=>Response.json({success:true,data:{id:1}});
  assert.equal((await handlePlan(req({enabled:true}),"7","features","9")).status,502);
});

test("plan feature update route and service preserve scoped IDs and PATCH payload", async () => {
  const calls=[];
  const route=load("app/api/plans/[id]/features/[featureId]/route.ts",{
    "@/features/plans/handler":{handlePlan:async(_, ...args)=>{calls.push(args);return new Response();}},
  });
  await route.PATCH(new Request("http://localhost",{method:"PATCH"}),{params:Promise.resolve({id:"7",featureId:"9"})});
  assert.deepEqual(calls[0],["7","features","9"]);
  const {planService}=load("features/plans/service.ts",{
    "@/features/plans/urls":load("features/plans/urls.ts"),
    "@/lib/api":{api:async(url,options)=>calls.push({url,options})},
  });
  await planService.updateFeature(7,9,{enabled:false,limit_value:null});
  assert.equal(calls[1].url,"/api/plans/7/features/9");
  assert.equal(calls[1].options.method,"PATCH");
  assert.deepEqual(JSON.parse(calls[1].options.body),{enabled:false,limit_value:null});
});

test("plan feature editor: prefill, type-specific limit, pending protection, safe errors and cache refresh", async () => {
  let pending=false, mutation, defaults, values;
  const calls=[];
  const Editor=load("features/plans/plan-feature-editor.tsx",{
    react:{useState:()=>[true,()=>calls.push("close")]},
    antd:{Button:"button",Modal:"modal",App:{useApp:()=>({message:{success:()=>calls.push("success"),error:()=>calls.push("error")}})}},
    "@tanstack/react-query":{
      useQueryClient:()=>({invalidateQueries:async key=>calls.push(["invalidate",key])}),
      useMutation:options=>{mutation=options;return {isPending:pending,mutate:v=>calls.push(["submit",v])};},
    },
    "@hookform/resolvers/zod":{zodResolver:()=>{}},
    "react-hook-form":{useForm:options=>{defaults=options.defaultValues;return {control:{},handleSubmit:fn=>()=>fn(values)};}},
    "@/components/form/form-input-number":{__esModule:true,default:"number"},
    "@/components/form/form-switch":{__esModule:true,default:"switch"},
    "@/lib/api-errors":{getApiErrorMessage:()=>"safe error"},
    "./schema":schemas,
    "./service":{planService:{updateFeature:async(...args)=>calls.push(["patch",...args])}},
  }).default;
  const feature={feature_id:9,name:"Cameras",feature_type:"quantity",enabled:false,limit_value:null};
  const render=(f=feature)=>{
    const wrapper=Editor({planId:7,feature:f});
    const modal=wrapper.props.children[1];
    return modal.type(modal.props);
  };
  let tree=render();
  assert.deepEqual(defaults,{enabled:false,limit_value:null});
  assert.equal(find(tree,"number").length,1);
  values={enabled:false,limit_value:0};
  find(tree,"form")[0].props.onSubmit();
  assert.deepEqual(calls.at(-1),["submit",values]);
  await mutation.mutationFn(values);
  assert.deepEqual(calls.at(-1),["patch",7,9,values]);
  pending=true; tree=render();
  const before=calls.length;
  tree.props.onCancel(); find(tree,"form")[0].props.onSubmit();
  assert.equal(calls.length,before);
  assert.equal(tree.props.closable,false);
  assert.equal(find(tree,"button").find(b=>b.props.children==="Hủy").props.disabled,true);
  mutation.onError(new Error("secret"));
  assert.equal(calls.at(-1),"error");
  await mutation.onSuccess();
  assert.deepEqual(calls.slice(-3),["success",["invalidate",{queryKey:["plans"]}],"close"]);
  pending=false;
  tree=render({...feature,feature_type:"boolean"});
  assert.equal(find(tree,"number").length,0);
  await mutation.mutationFn({enabled:true,limit_value:null});
  assert.deepEqual(calls.at(-1),["patch",7,9,{enabled:true}]);
});

test("product features: one server-filtered request preserves pagination, search and abort signal", async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const { featureService } = load("features/features/service.ts", {
    "@/features/features/urls": load("features/features/urls.ts"),
    "@/lib/api": { api: async (url, options) => {
      calls.push({ url, options });
      return { items: [{ id: 41, product_id: 1 }], limit: 20, offset: 20 };
    } },
  });
  const page = await featureService.getForProduct(1, 20, signal, " camera ");
  assert.deepEqual(page, { items: [{ id: 41, product_id: 1 }], hasMore: false });
  assert.equal(calls.length, 1);
  const query = new URL(calls[0].url, "http://localhost").searchParams;
  assert.equal(query.get("product_id"), "1");
  assert.equal(query.get("offset"), "20");
  assert.equal(query.get("search"), "camera");
  assert.equal(calls[0].options.signal, signal);
});

test("feature proxy: validates product ID before fetch and forwards it with search and pagination", async () => {
  const featureSchemas = load("features/features/schema.ts");
  const { handleFeature } = load("features/features/handler.ts", { "@/features/features/schema": featureSchemas });
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({url, options});
    return Response.json({success:true,data:{items:[],limit:20,offset:20}});
  };
  const req = query => new Request(`http://localhost/api/features?${query}`, {headers:{cookie:"access_token=test-only"}});
  for (const value of ["", "0", "-1", "x", "1.5", "9007199254740992"]) {
    assert.equal((await handleFeature(req(`product_id=${value}`))).status,400);
  }
  assert.equal(calls.length,0);
  assert.equal((await handleFeature(req("product_id=4&offset=20&search=camera"))).status,200);
  const query = new URL(calls[0].url).searchParams;
  assert.equal(query.get("product_id"),"4");
  assert.equal(query.get("offset"),"20");
  assert.equal(query.get("search"),"camera");
  assert.equal(calls[0].options.cache,"no-store");
});

test("feature picker: product-scoped search and pagination clear selection; assigned rows stay disabled", async () => {
  let state = [0, ""];
  let cursor = 0;
  let query;
  const changes = [];
  const calls = [];
  const Picker = load("features/features/feature-picker.tsx", {
    react: { useState: () => { const index = cursor++; return [state[index], (value) => { state[index] = value; }]; } },
    antd: { Table: "table", Input: { Search: "search" }, Button: "button", Tag: "tag", Alert: "alert" },
    "@tanstack/react-query": { useQuery: (options) => { query = options; return { data: { items: Array(20).fill(record), hasMore: true } }; } },
    "@/features/features/service": { featureService: { getForProduct: (...args) => calls.push(args) } },
    "@/lib/api-errors": { getApiErrorMessage: () => "safe error" },
  }).default;
  const props = { productId: 1, assignedFeatureIds: [9], selectedIds: [10], onChange: (rows) => changes.push(rows), disabled: false, renderConfiguration: () => null };
  const render = () => { cursor = 0; return Picker(props); };
  let tree = render();
  const checkbox = find(tree, "table")[0].props.rowSelection.getCheckboxProps;
  assert.equal(checkbox({ id: 9, product_id: 1 }).disabled, true);
  assert.equal(checkbox({ id: 10, product_id: 2 }).disabled, true);
  assert.equal(checkbox({ id: 10, product_id: 1 }).disabled, false);
  let prevented = false;
  find(tree, "search")[0].props.onSearch("  members  ", { preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true, "search Enter must not submit the add-features form");
  tree = render();
  assert.deepEqual(query.queryKey, ["features", "product", 1, 0, "members"]);
  const signal = new AbortController().signal;
  await query.queryFn({ signal });
  assert.deepEqual(calls[0], [1, 0, signal, "members"]);
  find(tree, "button").find((button) => button.props.children === "Tiếp").props.onClick();
  tree = render();
  assert.deepEqual(query.queryKey, ["features", "product", 1, 20, "members"]);
  assert.deepEqual(changes, [[], []]);
  state = [20, "members"];
});

test("plan features modal: pending blocks submit/close; partial success retains only failed values and updates cache", async () => {
  const first = { id: 9, name: "First", feature_type: "quantity" };
  const second = { id: 10, name: "Second", feature_type: "boolean" };
  const state = [[first, second], null];
  let cursor = 0;
  let pending = false;
  let mutation;
  let values = [input, { feature_id: 10, enabled: false, limit_value: null }];
  const calls = [];
  const Modal = load("features/plans/plan-features-modal.tsx", {
    react: { useState: () => { const index = cursor++; return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value; }]; } },
    antd: { Alert: "alert", Button: "button", Modal: "modal", ConfigProvider: "config-provider", App: { useApp: () => ({ message: {
      success: (message) => calls.push(["success", message]),
      warning: (message) => calls.push(["warning", message]),
      error: (message) => calls.push(["error", message]),
    } }) } },
    "@hookform/resolvers/zod": { zodResolver: () => {} },
    "react-hook-form": { useForm: () => ({ control: {}, handleSubmit: (callback) => () => callback({ values }), getValues: () => ({ values }), reset: (data) => { values = data.values; } }) },
    "@/components/form/form-switch": { __esModule: true, default: "switch" },
    "@/components/form/form-input-number": { __esModule: true, default: "number" },
    "@/features/features/feature-picker": { __esModule: true, default: "picker" },
    "@/features/plans/schema": schemas,
    "@/features/plans/service": { planService: { addFeatures: () => {} } },
    "@/lib/api-errors": { getApiErrorMessage: () => "safe error" },
    "@tanstack/react-query": {
      useQuery: () => ({ data: [] }),
      useQueryClient: () => ({ setQueryData: (_, update) => calls.push(["cache", update([])]), invalidateQueries: async (key) => calls.push(["invalidate", key]) }),
      useMutation: (options) => { mutation = options; return { isPending: pending, mutate: (items) => calls.push(["submit", items]) }; },
    },
  }).default;
  const render = () => { cursor = 0; return Modal({ plan: { id: 7, name: "Pro", product_id: 1 }, onClose: () => calls.push(["close"]) }); };
  let tree = render();
  find(tree, "form")[0].props.onSubmit();
  assert.deepEqual(calls[0], ["submit", values]);
  const picker = find(tree, "picker")[0];
  assert.equal(find(picker.props.renderConfiguration(first), "number").length, 1);
  assert.equal(find(picker.props.renderConfiguration(second), "number").length, 0);
  pending = true;
  tree = render();
  const count = calls.length;
  find(tree, "form")[0].props.onSubmit();
  tree.props.onCancel();
  assert.equal(calls.length, count);
  await mutation.onSuccess([{ status: "fulfilled", value: record }, { status: "rejected", reason: new Error("secret") }], values);
  assert.deepEqual(state[0], [second]);
  assert.deepEqual(values, [{ feature_id: 10, enabled: false, limit_value: null }]);
  assert.deepEqual(state[1], { added: 1, failed: 1, message: "safe error" });
  assert.equal(calls.filter((call) => call[0] === "warning").length, 1);
  assert.ok(calls.some((call) => call[0] === "warning" && call[1] === "Tính năng: 1 đã thêm, 1 thất bại."));
  assert.deepEqual(calls.at(-2), ["cache", [record]]);
  assert.deepEqual(calls.at(-1), ["invalidate", { queryKey: ["plans"] }]);
  await mutation.onSuccess([{ status: "rejected", reason: new Error("secret") }], values);
  assert.equal(calls.filter((call) => call[0] === "error").length, 1);
  assert.deepEqual(state[0], [second]);
  await mutation.onSuccess([{ status: "fulfilled", value: { ...record, feature_id: 10 } }], values);
  assert.equal(calls.filter((call) => call[0] === "success").length, 1);
  assert.deepEqual(state[0], []);
  assert.deepEqual(values, []);
});
