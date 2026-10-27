import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { useForm } = require("react-hook-form");
const dayjs = require("dayjs");
const { FormProvider } = require("react-hook-form");

function load(path, imports = {}) {
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const compiled = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => imports[name] ?? (name.startsWith("@/utils/functions/") ? load(`${name.slice(2)}.ts`) : name === "@/lib/display-labels" ? load("lib/display-labels.ts") : require(name)), compiled, compiled.exports,
  );
  return compiled.exports;
}

test("inline pricing renders parent form values with accessible dates, zero amount and pending controls", () => {
  const FormField = load("components/form/form-field.tsx");
  const imports = { "./entry-schema": {}, "./save-with-prices": {} };
  for (const name of ["input", "input-number", "select", "date-picker"]) {
    imports[`@/components/form/form-${name}`] = load(`components/form/form-${name}.tsx`, { "./form-field": FormField });
  }
  const Entry = load("features/pricing/price-entry.tsx", imports).default;
  function Example() {
    const form = useForm({ defaultValues: { prices: [{ amount_minor: 0, currency: "VND", billing_interval: "month", status: "active", effective_from: load("utils/functions/formatDateTime.ts").parseDateTime("2026-10-27T09:00:00+07:00"), effective_to: null }] } });
    return createElement(FormProvider, form, createElement(Entry, { disabled: true, existing: false }));
  }
  const html = renderToStaticMarkup(createElement(Example));
  assert.match(html, /Giá bán/);
  assert.match(html, /value="0"/);
  assert.match(html, /value="VND"/);
  assert.match(html, /giờ Việt Nam/);
  assert.match(html, /value="27\/10\/2026 09:00"/);
  assert.match(html, /aria-label="Bỏ dòng giá 1"/);
  assert.match(html, /<fieldset[^>]*disabled/);
  assert.doesNotMatch(html, /<form/);
});

test("form controls preserve values and bind change, blur, disabled and accessible errors", () => {
  const date = dayjs("2026-10-16");
  const files = [{ uid: "1", name: "license.txt" }];
  for (const [slug, initial, event, expected] of [
    ["input", "before", { target: { value: "after" } }, "after"],
    ["textarea", "before", { target: { value: "after" } }, "after"],
    ["autocomplete", "before", "after", "after"],
    ["select", "active", "inactive", "inactive"],
    ["tree-select", ["one"], ["two"], ["two"]],
    ["checkbox", false, { target: { checked: true } }, true],
    ["checkbox-group", [], ["one"], ["one"]],
    ["radio-group", "one", { target: { value: "two" } }, "two"],
    ["date-picker", date, null, null],
    ["date-range-picker", [date, date], null, null],
    ["time-picker", null, date, date],
    ["time-range-picker", null, [date, date], [date, date]],
    ["input-number", 10, null, null],
    ["switch", false, true, true],
    ["slider", 10, 20, 20],
    ["range-slider", [10, 20], [20, 30], [20, 30]],
    ["rate", 1, 4, 4],
    ["upload", [], { fileList: files }, files],
  ]) {
    let captured;
    let methods;
    const Control = (props) => { captured = props; return null; };
    Control.Password = Control.TextArea = Control.Group = Control.RangePicker = Control;
    const antd = {
      ...require("antd"),
      ...Object.fromEntries(["Input", "AutoComplete", "Select", "TreeSelect", "Checkbox", "Radio", "DatePicker", "TimePicker", "InputNumber", "Switch", "Slider", "Rate", "Upload"].map((name) => [name, Control])),
    };
    const FormField = load("components/form/form-field.tsx", {
      antd: { Form: { Item: ({ label, help, children }) => createElement("div", null, label, children, help) } },
    });
    const Component = load(`components/form/form-${slug}.tsx`, { antd, "./form-field": FormField }).default;
    function Example() {
      methods = useForm({
        defaultValues: { field: initial },
        errors: { field: { type: "required", message: "Required field" } },
      });
      return createElement(Component, { control: methods.control, name: "field", label: "Example", disabled: true });
    }
    const html = renderToStaticMarkup(createElement(Example));
    assert.equal(captured.disabled, true, slug);
    assert.match(html, /Required field/, slug);
    if (slug === "upload") {
      assert.equal(captured.beforeUpload(), false, "upload must wait for form submission");
      assert.deepEqual(captured.fileList, initial);
    } else {
      assert.equal(captured["aria-invalid"], true, slug);
      assert.ok(html.includes(`id="${captured["aria-describedby"]}"`), slug);
      assert.ok(html.includes(`id="${captured["aria-labelledby"]}"`), slug);
      assert.deepEqual(slug === "checkbox" || slug === "switch" ? captured.checked : captured.value, initial, slug);
      captured.onBlur();
      assert.equal(methods.getFieldState("field").isTouched, true, slug);
    }
    captured.onChange(event);
    assert.deepEqual(methods.getValues("field"), expected, slug);
    methods.reset({ field: initial });
    assert.deepEqual(methods.getValues("field"), initial, slug);
  }
});
