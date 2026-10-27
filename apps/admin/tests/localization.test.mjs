import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path) {
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const compiled = { exports: {} };
  new Function("require", "module", "exports", source)(require, compiled, compiled.exports);
  return compiled.exports;
}

test("Vietnamese display labels preserve API enum values and validation uses Vietnamese", () => {
  const { displayLabel } = load("lib/display-labels.ts");
  for (const [value, label] of [["active","Hoạt động"],["quantity","Số lượng"],["pending","Chờ xử lý"],["month","Hàng tháng"],["create","Tạo mới"]])
    assert.equal(displayLabel(value), label);
  const { featureInputSchema } = load("features/features/schema.ts");
  const input = {product_id:4,code:"CAMERAS",name:"Camera",feature_type:"quantity",status:"active"};
  assert.deepEqual(featureInputSchema.parse(input), input);
  const invalid = featureInputSchema.safeParse({...input,product_id:0});
  assert.equal(invalid.success,false);
  assert.doesNotMatch(invalid.error.issues[0].message,/Too small|Invalid input/);
});

test("import row errors are actionable Vietnamese and unknown backend messages never leak", () => {
  const { importRowMessage } = load("features/data-transfer/messages.ts");
  const row = message => ({action:"error",message,code:"VALIDATION_ERROR"});
  assert.equal(importRowMessage(row("limit_value must be a valid non-negative integer")),"Hạn mức phải là số nguyên không âm hợp lệ.");
  assert.equal(importRowMessage(row("code must contain between 2 and 100 characters")),"Mã phải có từ 2 đến 100 ký tự.");
  assert.equal(importRowMessage(row("name exceeds 255 characters")),"Tên không được vượt quá 255 ký tự.");
  assert.equal(importRowMessage(row("effective_from must be an ISO timestamp with timezone")),"Ngày bắt đầu hiệu lực phải là ngày ISO có múi giờ.");
  assert.match(importRowMessage(row("duplicate key within this file")),/bị trùng/);
  assert.doesNotMatch(importRowMessage(row("private English database details")),/private|English|database/);
  assert.equal(importRowMessage({action:"create",message:"",code:""}),"");
});

test("both apps configure Vietnamese HTML, Ant Design and error pages", () => {
  for (const app of [".","../web"]) {
    assert.match(readFileSync(`${app}/app/layout.tsx`,"utf8"),/lang="vi"/);
    assert.match(readFileSync(`${app}/app/providers.tsx`,"utf8"),/locale=\{viVN\}/);
    for (const file of ["not-found.tsx","error.tsx","global-error.tsx"])
      assert.match(readFileSync(`${app}/app/${file}`,"utf8"),/Không (thể tải|tìm thấy)/);
  }
});

test("UI labels and JSX text do not reintroduce common English interface copy", () => {
  const english = /\b(?:Save changes|Add feature|Add plan|Create company|Delete product|Welcome back|Contact sales|Search features|Import data|Export CSV|Loading\.\.\.|No features configured|Something went wrong|This page could not be found)\b/;
  function scan(dir) {
    for (const entry of readdirSync(dir,{withFileTypes:true})) {
      if (["node_modules",".next","tests"].includes(entry.name)) continue;
      const path=`${dir}/${entry.name}`;
      if (entry.isDirectory()) { scan(path); continue; }
      if (!/\.(ts|tsx)$/.test(path)) continue;
      const source=ts.createSourceFile(path,readFileSync(path,"utf8"),ts.ScriptTarget.Latest,true);
      function visit(node) {
        if (ts.isJsxText(node) || ts.isStringLiteral(node)) assert.doesNotMatch(node.text,english,path);
        ts.forEachChild(node,visit);
      }
      visit(source);
    }
  }
  for(const dir of ["app","components","features","../web/app","../web/features"]) scan(dir);
});
