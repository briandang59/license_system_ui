import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import ts from "typescript";
const require = createRequire(import.meta.url); const cache = new Map();
function load(path) { path=resolve(path); if(cache.has(path))return cache.get(path);const mod={exports:{}};const source=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function("require","module","exports",source)(name=>name.startsWith("@/")?load(`${name.slice(2)}.ts`):name.startsWith(".")?load(resolve(dirname(path),`${name}.ts`)):require(name),mod,mod.exports);cache.set(path,mod.exports);return mod.exports;}
const { handleDashboard }=load("features/dashboard/handler.ts");const { handleLicenses }=load("features/licenses/handler.ts");const { formatMoneyMinor }=load("features/dashboard/money.ts");const { dashboardSchema }=load("features/dashboard/schema.ts");
const original=global.fetch;afterEach(()=>{global.fetch=original;});
const request=(path,cookie="access_token=test-only")=>new Request(`http://localhost:3001/api/${path}`,{headers:{cookie}});
const data={from:"2026-09-30T17:00:00Z",to:"2026-10-31T17:00:00Z",calculated_at:"2026-10-30T01:00:00Z",counts:{companies:0,active_subscriptions:0,pending_subscriptions:0,expiring_subscriptions:0,open_registrations:0,pending_review:0},money:[],daily:[],recent:[]};
test("dashboard forwards non-paginated report dates and Unicode search without exposing session",async()=>{
 let sent;global.fetch=async(url,options)=>{sent={url:new URL(url),options};return Response.json({success:true,data});};
 const query=new URLSearchParams({from:data.from,to:data.to,search:"  Công ty & Sản phẩm  ",ignored:"secret"});
 const response=await handleDashboard(request(`dashboard?${query}`));assert.equal(response.status,200);assert.equal(sent.url.searchParams.get("from"),data.from);assert.equal(sent.url.searchParams.get("to"),data.to);assert.equal(sent.url.searchParams.get("search"),"Công ty & Sản phẩm");assert.equal(sent.url.searchParams.has("ignored"),false);assert.equal(sent.url.searchParams.has("limit"),false);assert.equal(sent.options.headers.Authorization,"Bearer test-only");assert.equal(response.headers.get("Cache-Control"),"no-store");assert.deepEqual((await response.json()).data,data);
});
test("dashboard rejects invalid ranges and missing session before calling backend",async()=>{
 global.fetch=async()=>assert.fail("must not fetch");
 assert.equal((await handleDashboard(request("dashboard", ""))).status,401);
 for(const query of ["from=bad&to=bad","from=2026-10-01T00:00:00Z","from=2026-10-01T00:00:00Z&to=2026-09-01T00:00:00Z","search="+"x".repeat(201)])assert.equal((await handleDashboard(request("dashboard?"+query))).status,400);
});
test("dashboard validates exact string money and rejects malformed upstream",async()=>{
 const good={...data,money:[{currency:"VND",received_minor:"18014398509481982",manual_minor:"18014398509481982",sepay_minor:"0",outstanding_minor:"0",receipt_count:2,outstanding_requests:0}]};assert.equal(dashboardSchema.safeParse(good).success,true);assert.equal(dashboardSchema.safeParse({...good,money:[{...good.money[0],received_minor:18014398509481982}]}).success,false);
 global.fetch=async()=>Response.json({success:true,data:{...data,counts:null}});assert.equal((await handleDashboard(request("dashboard"))).status,502);
});
test("money formatting preserves totals beyond safe integer and currency scales",()=>{
 assert.equal(formatMoneyMinor("18014398509481982","VND"),"18.014.398.509.481.982 VND");assert.equal(formatMoneyMinor("12345","USD"),"123,45 USD");assert.equal(formatMoneyMinor("1001","KWD"),"1,001 KWD");assert.equal(formatMoneyMinor("0","VND"),"0 VND");
});
test("licenses search combines pagination/status and strips secret keys from upstream",async()=>{
 let sent;global.fetch=async url=>{sent=new URL(url);return Response.json({success:true,data:{items:[{id:1,company_name:"Công ty",product_name:"Sản phẩm",status:"active",valid_from:data.from,valid_until:null,issued_at:null,created_at:data.from,max_activations:null,active_activations:0,feature_count:0,license_key:"must-stay-secret"}],limit:20,offset:20}});};
 const response=await handleLicenses(request("licenses?search=host&status=active&offset=20"));assert.equal(response.status,200);assert.equal(sent.searchParams.get("search"),"host");assert.equal(sent.searchParams.get("offset"),"20");assert.equal(sent.searchParams.get("status"),"active");assert.equal(JSON.stringify(await response.json()).includes("must-stay-secret"),false);
});
