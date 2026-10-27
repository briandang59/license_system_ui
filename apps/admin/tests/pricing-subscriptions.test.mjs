import { test,afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname,resolve } from "node:path";
import ts from "typescript";
const require=createRequire(import.meta.url);
const cache=new Map();
function load(path){path=resolve(path);if(cache.has(path))return cache.get(path);const compiled={exports:{}};cache.set(path,compiled.exports);const source=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function("require","module","exports",source)(name=>name.startsWith("@/")?load(`${name.slice(2)}.ts`):name.startsWith(".")?load(resolve(dirname(path),`${name}.ts`)):(name === "@/lib/display-labels" ? load("lib/display-labels.ts") : require(name)),compiled,compiled.exports);cache.set(path,compiled.exports);return compiled.exports;}
const prices=load("features/pricing/schema.ts");
const subs=load("features/subscriptions/schema.ts");
const units=load("features/units/schema.ts");
const {handlePricing}=load("features/pricing/handler.ts");
const {handleSubscription,handleAddon}=load("features/subscriptions/handler.ts");
const originalFetch=global.fetch;afterEach(()=>{global.fetch=originalFetch});
const origin=process.env.APP_ORIGIN||"http://localhost:3001";
function request(path,{method="GET",body,cookie="access_token=test-only",from=origin}={}){return new Request(`http://localhost:3001/api/${path}`,{method,headers:{cookie,origin:from,"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});}
const price={id:1,plan_id:2,amount_minor:0,currency:"USD",billing_interval:"month",effective_from:"2026-10-27T00:00:00Z",effective_to:null,status:"active",created_at:"2026-10-27T00:00:00Z",updated_at:"2026-10-27T00:00:00Z"};
test("prices: preserve free prices and reject immutable PATCH, invalid periods and unsafe numbers",()=>{
 const input=Object.fromEntries(Object.entries(price).filter(([key])=>!["id","plan_id","created_at","updated_at"].includes(key)));assert.equal(prices.priceInputSchema.safeParse(input).success,true);
 for(const patch of [{amount_minor:99},{status:null},{}])assert.equal(prices.priceUpdateSchema.safeParse(patch).success,false);
 assert.deepEqual(prices.priceUpdateSchema.parse({effective_to:null}),{effective_to:null});
 assert.equal(prices.priceInputSchema.safeParse({...input,effective_to:input.effective_from}).success,false);
 assert.equal(prices.priceInputSchema.safeParse({...input,amount_minor:Number.MAX_SAFE_INTEGER+1}).success,false);
});
test("units: nullable symbol differs from required name/code/status",()=>{
 assert.equal(units.unitInputSchema.safeParse({code:"SEAT",name:"Seats",symbol:null}).success,true);
 assert.equal(units.unitUpdateSchema.safeParse({symbol:null}).success,true);
 for(const value of [{name:null,symbol:"s"},{status:null},{code:null},{}])assert.equal(units.unitUpdateSchema.safeParse(value).success,false);
});
test("subscriptions: immutable identity, nullable end and false auto renew",()=>{
 assert.deepEqual(subs.subscriptionUpdateSchema.parse({auto_renew:false,end_date:null}),{auto_renew:false,end_date:null});
 for(const value of [{plan_id:2},{price_id:1},{status:null},{auto_renew:null},{}])assert.equal(subs.subscriptionUpdateSchema.safeParse(value).success,false);
 assert.equal(subs.addonInputSchema.safeParse({feature_id:1,price_id:2,quantity:0}).success,false);
 assert.equal(subs.addonInputSchema.safeParse({feature_id:1,price_id:2,quantity:null}).success,false);
 assert.equal(subs.addonUpdateSchema.safeParse({limit_value:0}).success,true);
 assert.equal(subs.addonUpdateSchema.safeParse({limit_value:null}).success,true);
 assert.equal(subs.addonUpdateSchema.safeParse({price_id:2}).success,false);
 assert.deepEqual(subs.transitions.cancel,["cancel"]);
});
test("admin new routes: invalid IDs, foreign origins and missing sessions do not reach backend",async()=>{
 let calls=0;global.fetch=async()=>{calls++;throw Error("unexpected")};
 assert.equal((await handlePricing(request("plans/1/prices",{cookie:""}),"plans","1")).status,401);
 assert.equal((await handlePricing(request("plans/1/prices",{method:"POST",body:{},from:"https://foreign.example"}),"plans","1")).status,403);
 assert.equal((await handlePricing(request("plans/0/prices"),"plans","0")).status,400);
 assert.equal((await handlePricing(request("plans/1/prices?offset=-1"),"plans","1")).status,400);
 assert.equal((await handleAddon(request("subscriptions/1/features",{method:"POST",body:{feature_id:2,price_id:3,quantity:null}}),"1")).status,400);
 assert.equal(calls,0);
});
test("pricing proxy: scopes both IDs, preserves data, hides tokens and supports DELETE 204",async()=>{
 let call;global.fetch=async(url,options)=>{call={url,options};return Response.json({success:true,data:price})};
 let response=await handlePricing(request("plans/2/prices/1",{method:"PATCH",body:{effective_to:null}}),"plans","2","1");assert.equal(response.status,200);assert.ok(call.url.endsWith("/plans/2/prices/1"));assert.deepEqual(JSON.parse(call.options.body),{effective_to:null});assert.equal(call.options.cache,"no-store");assert.equal(call.options.headers.Authorization,"Bearer test-only");assert.equal(JSON.stringify(await response.json()).includes("test-only"),false);
 global.fetch=async()=>new Response(null,{status:204});response=await handlePricing(request("plans/2/prices/1",{method:"DELETE"}),"plans","2","1");assert.equal(response.status,204);assert.equal(await response.text(),"");
 global.fetch=async()=>Response.json({success:true,data:{}});assert.equal((await handlePricing(request("plans/2/prices"),"plans","2")).status,502);
 global.fetch=async()=>Response.json({success:false,error:{code:"RESOURCE_IN_USE",message:"private SQL"}},{status:409});response=await handlePricing(request("plans/2/prices/1",{method:"DELETE"}),"plans","2","1");assert.equal(response.status,409);assert.equal((await response.text()).includes("private SQL"),false);
});
test("subscription proxy: forces catalog includes for labels and keeps status filtering",async()=>{
 let url;global.fetch=async(u)=>{url=u;return Response.json({success:true,data:{items:[],limit:20,offset:20}})};
 const response=await handleSubscription(request("subscriptions?offset=20&status=pending"));assert.equal(response.status,200);const query=new URL(url).searchParams;assert.equal(query.get("include"),"plan,company");assert.equal(query.get("status"),"pending");assert.equal(query.get("offset"),"20");
});
