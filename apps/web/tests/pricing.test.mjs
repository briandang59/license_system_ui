import { test,afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require=createRequire(import.meta.url);
function load(path,imports={}){const compiled={exports:{}};const source=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;new Function("require","module","exports",source)(name=>imports[name]??require(name),compiled,compiled.exports);return compiled.exports;}
const schema=load("features/pricing/schema.ts");const {handlePricing}=load("features/pricing/handler.ts",{"./schema":schema});const {formatMoney}=load("features/pricing/money.ts");
const originalFetch=global.fetch;afterEach(()=>{global.fetch=originalFetch});
test("public proxy works anonymously without forwarding cookies or admin credentials",async()=>{
 let options,url;global.fetch=async(u,o)=>{url=u;options=o;return Response.json({success:true,data:{items:[],limit:100,offset:100}})};
 const response=await handlePricing(new Request("http://localhost:3000/api/pricing?offset=100&currency=USD",{headers:{cookie:"access_token=must-not-leak",authorization:"Bearer must-not-leak"}}));
 assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");assert.ok(url.includes("/public/pricing?"));assert.equal(new URL(url).searchParams.get("offset"),"100");assert.equal(options.headers,undefined);assert.equal(options.cache,"no-store");assert.ok(options.signal instanceof AbortSignal);
});

const catalogItem={kind:"plan",owner_id:1,product_id:4,product_name:"Bãi xe",name:"Cơ bản",code:"BASIC",description:null,feature_type:null,unit:null,benefits:[{name:"Camera",feature_type:"quantity",limit_value:0,unit:"camera"}]};
const presentation=load("features/pricing/presentation.ts");

test("public catalog proxy is anonymous, validates catalog and does not require prices",async()=>{
 let options,url;
 global.fetch=async(u,o)=>{url=u;options=o;return Response.json({success:true,data:{items:[catalogItem],limit:100,offset:0}})};
 const response=await handlePricing(new Request("http://localhost/api/catalog",{headers:{cookie:"private",authorization:"private"}}),"catalog");
 assert.equal(response.status,200);assert.ok(url.includes("/public/catalog?"));assert.equal(options.headers,undefined);
 assert.deepEqual((await response.json()).data.items,[catalogItem]);
 global.fetch=async()=>Response.json({success:true,data:{items:[{...catalogItem,benefits:"invalid"}],limit:100,offset:0}});
 assert.equal((await handlePricing(new Request("http://localhost/api/catalog"),"catalog")).status,502);
});

test("catalog presentation retains unpriced plans, zero/free values and exact currency/period selection",()=>{
 const offer={...catalogItem,price_id:7,amount_minor:0,currency:"VND",billing_interval:"month",effective_from:"2026-01-01",effective_to:null};
 const items=presentation.catalogWithPricedFallback([catalogItem,{...catalogItem,owner_id:2,name:"Nâng cao"}],[offer]);
 assert.equal(items.length,2);
 assert.equal(presentation.matchingPrice(items[0],[offer],"VND","month").amount_minor,0);
 assert.equal(presentation.matchingPrice(items[1],[offer],"VND","month"),undefined);
 assert.equal(presentation.matchingPrice(items[0],[offer],"USD","month"),undefined);
 assert.equal(presentation.matchingPrice(items[0],[offer],"VND","year"),undefined);
 assert.equal(presentation.benefitLimit(catalogItem.benefits[0]),"0 camera");
 assert.equal(presentation.benefitLimit({...catalogItem.benefits[0],limit_value:null}),"Hạn mức theo tư vấn");
 assert.equal(presentation.benefitLimit({...catalogItem.benefits[0],feature_type:"unlimited"}),"Không giới hạn");
});

test("public service loads all pages with cancellation and rejects inconsistent pagination",async()=>{
 const {publicPricingService}=load("features/pricing/service.ts",{"./schema":schema});
 const signal=new AbortController().signal;const calls=[];
 global.fetch=async(url,options)=>{calls.push({url,options});const offset=Number(new URL(url,"http://localhost").searchParams.get("offset"));return Response.json({success:true,data:{items:offset===0?[catalogItem]:[],limit:1,offset}})};
 assert.deepEqual(await publicPricingService.catalog(signal),[catalogItem]);
 assert.deepEqual(calls.map(c=>c.url),["/api/catalog?offset=0","/api/catalog?offset=1"]);
 assert.ok(calls.every(c=>c.options.signal===signal&&c.options.cache==="no-store"));
 global.fetch=async()=>Response.json({success:true,data:{items:[],limit:100,offset:99}});
 await assert.rejects(publicPricingService.catalog(signal),/Phân trang/);
});

const find=(node,type)=>!node||typeof node!=="object"?[]:Array.isArray(node)?node.flatMap(child=>find(child,type)):[...(node.type===type?[node]:[]),...find(node.props?.children,type)];
const textOf=node=>node==null?"":typeof node==="object"?Array.isArray(node)?node.map(textOf).join(" "):textOf(node.props?.children):String(node);

test("pricing UI shows unpriced plan benefits and comparison; price failures preserve the catalog",()=>{
 let state=[null,"","",""];let cursor=0;let priceError=false;let priceItems=[];
 const Page=load("features/pricing/page.tsx",{
  react:{useState:()=>{const index=cursor++;return [state[index],value=>{state[index]=value}];}},
  antd:{Alert:"alert",Button:"button",Segmented:"segmented",Select:"select"},
  "@tanstack/react-query":{useQuery:options=>options.queryKey[0]==="public-catalog"?{data:[catalogItem,{...catalogItem,owner_id:2,name:"Nâng cao"}]}:{data:priceItems,isError:priceError}},
  "./service":{publicPricingService:{}},"./presentation":presentation,"./money":{formatMoney},"@/features/registrations/dialog":{default:"registration-dialog"},
 }).default;
 const render=()=>{cursor=0;return Page({});};
 let tree=render();
 assert.equal(find(tree,"article").length,3);assert.match(textOf(tree),/Tùy chỉnh & đăng ký/);
 assert.match(textOf(tree),/Liên hệ tư vấn/);assert.match(textOf(tree),/Camera/);assert.match(textOf(tree),/0 camera/);
 assert.equal(find(tree,"table").length,1);
 assert.match(textOf(tree),/giá chưa công bố không được hiểu là miễn phí/);
 priceError=true;tree=render();assert.equal(find(tree,"article").length,3);assert.match(textOf(tree),/Tạm chưa tải được giá/);
 priceError=false;priceItems=[{...catalogItem,price_id:7,amount_minor:0,currency:"VND",billing_interval:"month"}];tree=render();
 assert.match(textOf(tree),/0/);assert.equal(find(tree,"article").length,3);
});
test("public proxy validates upstream shape and shields errors",async()=>{
 global.fetch=async()=>Response.json({success:true,data:{items:[{private:"secret"}],limit:100,offset:0}});
 assert.equal((await handlePricing(new Request("http://localhost/api/pricing"))).status,502);
 global.fetch=async()=>Response.json({error:"private SQL"},{status:500});const response=await handlePricing(new Request("http://localhost/api/pricing"));assert.equal(response.status,502);assert.equal((await response.text()).includes("private SQL"),false);
});
test("public pagination rejects negative offsets before fetch",async()=>{let calls=0;global.fetch=async()=>{calls++;throw Error("unexpected")};assert.equal((await handlePricing(new Request("http://localhost/api/pricing?offset=-1"))).status,400);assert.equal(calls,0)});
test("currency amounts use comma grouping and preserve each currency minor-unit scale",()=>{
 assert.equal(formatMoney(20000000,"VND"), "VND 20,000,000");
 assert.equal(formatMoney(2900,"USD"),new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",currencyDisplay:"code"}).format(29));
 assert.equal(formatMoney(2900,"JPY"),new Intl.NumberFormat("en-US",{style:"currency",currency:"JPY",currencyDisplay:"code"}).format(2900));
 assert.match(formatMoney(2900,"KWD"),/2\.900/);
 assert.equal(formatMoney(2900,"ZZZ"),"2,900 ZZZ đơn vị nhỏ nhất");
 assert.equal(formatMoney(Number.MAX_SAFE_INTEGER+1,"USD"),"Chưa có giá");
});
