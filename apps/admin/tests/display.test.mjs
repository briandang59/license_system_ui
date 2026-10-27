import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(path) {
  const compiled = { exports: {} };
  const source = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function("require", "module", "exports", source)(require, compiled, compiled.exports);
  return compiled.exports;
}
const numbers = load("utils/functions/formatNumber.ts");
const dates = load("utils/functions/formatDateTime.ts");

test("display: comma grouping round-trips money, decimals, zero and BigInt totals", () => {
  for (const value of [0, 20000000, -1234.5, Number.MAX_SAFE_INTEGER]) {
    assert.equal(numbers.parseNumber(numbers.formatNumber(value)), value);
  }
  assert.equal(numbers.formatNumber(20000000), "20,000,000");
  assert.equal(numbers.formatNumber(9223372036854775807n), "9,223,372,036,854,775,807");
  assert.ok(Number.isNaN(numbers.parseNumber("")));
  assert.ok(Number.isNaN(numbers.parseNumber("1abc")));
  assert.equal(numbers.formatNumberInput(20000000, { userTyping: true, input: "20,000000" }), "20,000,000");
  assert.equal(numbers.formatNumberInput(1234.5, { userTyping: true, input: "1234.50" }), "1,234.50");
  assert.equal(numbers.formatNumberInput(undefined, { userTyping: false, input: "" }), "");
});

test("display: ISO instants open in Vietnam and picker wall time submits the same UTC instant", () => {
  const iso = "2026-10-27T02:00:00.000Z";
  const parsed = dates.parseDateTime(iso);
  assert.equal(parsed.format("DD/MM/YYYY HH:mm"), "27/10/2026 09:00");
  assert.equal(parsed.utcOffset(), 420);
  assert.equal(parsed.toISOString(), iso);
  assert.equal(dates.formatDateTime(iso), "27/10/2026 09:00");
  const selected = dates.pickerToVietnam(require("dayjs")("2026-10-27T09:00:00"));
  assert.equal(selected.toISOString(), iso);
  assert.equal(dates.pickerToVietnam(parsed).toISOString(), iso);
  assert.equal(dates.pickerToVietnam(null), null);
  assert.equal(dates.parseDateTime(null), null);
  assert.equal(dates.isValidDateTime("2026-10-27"), false);
});
