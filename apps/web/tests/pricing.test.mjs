import { test,afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require=createRequire(import.meta.url);
function load(path,imports={}){const compiled={exports:{}};const source=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function("require","module","exports",source)(name=>imports[name]??require(name),compiled,compiled.exports);return compiled.exports;}
const schema=load("features/pricing/schema.ts");const {handlePricing}=load("features/pricing/handler.ts",{"./schema":schema});const {formatMoney}=load("features/pricing/money.ts");
const originalFetch=global.fetch;afterEach(()=>{global.fetch=originalFetch});
test("public proxy works anonymously without forwarding cookies or admin credentials",async()=>{
 let options,url;global.fetch=async(u,o)=>{url=u;options=o;return Response.json({success:true,data:{items:[],limit:100,offset:100}})};
 const response=await handlePricing(new Request("http://localhost:3000/api/pricing?offset=100&currency=USD",{headers:{cookie:"access_token=must-not-leak",authorization:"Bearer must-not-leak"}}));
 assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");assert.ok(url.includes("/public/pricing?"));assert.equal(new URL(url).searchParams.get("offset"),"100");assert.equal(options.headers,undefined);assert.equal(options.cache,"no-store");assert.ok(options.signal instanceof AbortSignal);
});
test("public proxy validates upstream shape and shields errors",async()=>{
 global.fetch=async()=>Response.json({success:true,data:{items:[{private:"secret"}],limit:100,offset:0}});
 assert.equal((await handlePricing(new Request("http://localhost/api/pricing"))).status,502);
 global.fetch=async()=>Response.json({error:"private SQL"},{status:500});const response=await handlePricing(new Request("http://localhost/api/pricing"));assert.equal(response.status,502);assert.equal((await response.text()).includes("private SQL"),false);
});
test("public pagination rejects negative offsets before fetch",async()=>{let calls=0;global.fetch=async()=>{calls++;throw Error("unexpected")};assert.equal((await handlePricing(new Request("http://localhost/api/pricing?offset=-1"))).status,400);assert.equal(calls,0)});
test("currency amounts use Vietnamese formatting and preserve each currency minor-unit scale",()=>{
 assert.equal(formatMoney(2900,"USD"),new Intl.NumberFormat("vi-VN",{style:"currency",currency:"USD"}).format(29));
 assert.equal(formatMoney(2900,"JPY"),new Intl.NumberFormat("vi-VN",{style:"currency",currency:"JPY"}).format(2900));
 assert.match(formatMoney(2900,"KWD"),/2,900/);
 assert.equal(formatMoney(2900,"ZZZ"),"2900 ZZZ đơn vị nhỏ nhất");
 assert.equal(formatMoney(Number.MAX_SAFE_INTEGER+1,"USD"),"Chưa có giá");
});
