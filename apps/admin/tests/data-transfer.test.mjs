import { test,afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require=createRequire(import.meta.url);
function load(path,imports={}){const compiled={exports:{}};const source=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function("require","module","exports",source)(name=>imports[name]??(name === "@/lib/display-labels" ? load("lib/display-labels.ts") : require(name)),compiled,compiled.exports);return compiled.exports;}
const schema=load("features/data-transfer/schema.ts");const {handleTransfer}=load("features/data-transfer/handler.ts",{"./schema":schema});const originalFetch=global.fetch;afterEach(()=>{global.fetch=originalFetch});
const origin=process.env.APP_ORIGIN||"http://localhost:3001";
function request(action,{cookie="access_token=test-only",from=origin,file="code,name\nAA,Example",name="input.csv",fingerprint,resource="products"}={}){
 const method=["preview","commit"].includes(action)?"POST":"GET";let body;if(method==="POST"){body=new FormData();body.set("file",new File([file],name));if(fingerprint)body.set("fingerprint",fingerprint)}
 return new Request(`http://localhost:3001/api/data-transfer/${resource}/${action}`,{method,headers:{cookie,origin:from},body});
}
const report={valid:true,committed:false,created:1,updated:0,fingerprint:"a".repeat(64),rows:[{row:2,action:"create",label:"Example",code:"",message:""}]};
test("transfer: import excludes subscriptions/licenses/logs while export includes all business resources",()=>{
 assert.equal(schema.importResources.length,8);for(const resource of ["subscriptions","subscription-features","licenses","license-audit-logs"]){assert.equal(schema.importResources.includes(resource),false);assert.equal(schema.exportResourceSchema.safeParse(resource).success,true)}
 for(const resource of ["auth-users","auth-sessions","auth-invites"]){assert.equal(schema.exportResourceSchema.safeParse(resource).success,false)}
});
test("transfer: validates session, origin, file, fingerprint and resource before fetch",async()=>{
 let calls=0;global.fetch=async()=>{calls++;throw Error("unexpected")};
 assert.equal((await handleTransfer(request("preview",{cookie:""}),"products","preview")).status,401);
 assert.equal((await handleTransfer(request("preview",{from:"https://foreign.example"}),"products","preview")).status,403);
 assert.equal((await handleTransfer(request("preview",{resource:"subscriptions"}),"subscriptions","preview")).status,400);
 assert.equal((await handleTransfer(request("export",{resource:"auth-users"}),"auth-users","export")).status,400);
 assert.equal((await handleTransfer(request("preview",{name:"input.exe"}),"products","preview")).status,400);
 assert.equal((await handleTransfer(request("preview",{file:"x".repeat(schema.maxFileBytes+1)}),"products","preview")).status,400);
 assert.equal((await handleTransfer(request("commit"),"products","commit")).status,400);
 assert.equal((await handleTransfer(request("export"),"products","preview")).status,405);
 assert.equal(calls,0);
});
test("transfer: multipart proxy preserves file bytes, scope and confirmation without JSON encoding",async()=>{
 let forwarded;global.fetch=async(url,options)=>{forwarded={url,options};return Response.json({success:true,data:report})};
 let response=await handleTransfer(request("preview"),"products","preview");assert.equal(response.status,200);assert.ok(forwarded.url.endsWith("/imports/products/preview"));assert.ok(forwarded.options.body instanceof FormData);assert.equal(await forwarded.options.body.get("file").text(),"code,name\nAA,Example");assert.equal(forwarded.options.headers["Content-Type"],undefined);assert.equal(forwarded.options.headers.Authorization,"Bearer test-only");assert.equal(forwarded.options.cache,"no-store");assert.equal((await response.text()).includes("test-only"),false);
 response=await handleTransfer(request("commit",{fingerprint:report.fingerprint}),"products","commit");assert.equal(response.status,200);assert.equal(forwarded.options.body.get("fingerprint"),report.fingerprint);assert.ok(forwarded.url.endsWith("/commit"));
});
test("transfer: rejects malformed reports and preserves safe upstream error codes",async()=>{
 global.fetch=async()=>Response.json({success:true,data:{valid:true}});assert.equal((await handleTransfer(request("preview"),"products","preview")).status,502);
 global.fetch=async()=>Response.json({success:false,error:{code:"VALIDATION_ERROR",message:"private SQL"}},{status:400});const response=await handleTransfer(request("preview"),"products","preview");assert.equal(response.status,400);assert.equal((await response.text()).includes("private SQL"),false);
});
test("export: forwards filters without paging and returns private CSV attachment",async()=>{
 let url;global.fetch=async(u)=>{url=u;return new Response("\ufeffcode,name\nAA,Example",{headers:{"Content-Type":"text/csv; charset=utf-8"}})};
 const response=await handleTransfer(new Request("http://localhost:3001/api/data-transfer/products/export?search=hello%20world",{headers:{cookie:"access_token=test-only"}}),"products","export");assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");assert.ok(response.headers.get("content-disposition").includes("products.csv"));const params=new URL(url).searchParams;assert.equal(params.get("search"),"hello world");assert.equal(params.has("limit"),false);assert.equal(params.has("offset"),false);
 global.fetch=async()=>Response.json({success:true,data:{}});assert.equal((await handleTransfer(request("export"),"products","export")).status,502);
});
test("templates: only CSV and XLSX formats are accepted",async()=>{
 let calls=0;global.fetch=async()=>{calls++;return new Response("bytes",{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}})};
 const req=format=>new Request(`http://localhost:3001/api/data-transfer/products/template?format=${format}`,{headers:{cookie:"access_token=test-only"}});
 assert.equal((await handleTransfer(req("xlsx"),"products","template")).status,200);assert.equal((await handleTransfer(req("xlsm"),"products","template")).status,400);assert.equal(calls,1);
});

test("import dialog: changing the selected file removes confirmation; pending commit prevents closing",async()=>{
 const first=new File(["code,name\nAA,Example"],"input.csv");let selected=first;let pending=false;let cursor=0;const state=[true,report,first];const mutations=[];const notices=[];const invalidations=[];
 const Actions=load("features/data-transfer/actions.tsx",{
  react:{useState:()=>{const index=cursor++;return[state[index],value=>{state[index]=typeof value==="function"?value(state[index]):value}]}},
  antd:{App:{useApp:()=>({message:{success:text=>notices.push(text),error:text=>notices.push(text)}})},Button:"button",Modal:"modal",Space:"space",Alert:"alert",Table:"table"},
  "react-hook-form":{useForm:()=>({control:{},handleSubmit:callback=>()=>callback({files:[{originFileObj:selected,name:selected.name,size:selected.size}]}),reset:()=>{}}),useWatch:()=>[{originFileObj:selected,name:selected.name,size:selected.size}]},
  "@hookform/resolvers/zod":{zodResolver:()=>{}},
  "@tanstack/react-query":{useQueryClient:()=>({invalidateQueries:async filter=>invalidations.push(filter)}),useMutation:options=>{const index=mutations.length;mutations.push(options);return {isPending:index%3===2&&pending,mutate:()=>{}}}},
  "@/components/form/form-upload":{default:"upload"},"@/lib/api-errors":{getApiErrorMessage:()=>"Safe error"},
  "./service":{downloadFile:async()=>{},importFile:async()=>{},saveBlob:()=>{}},"./schema":schema,"./messages":load("features/data-transfer/messages.ts"),
 }).default;
 function find(node,type){if(!node||typeof node!=="object")return [];if(Array.isArray(node))return node.flatMap(n=>find(n,type));return [...(node.type===type?[node]:[]),...find(node.props?.children,type)]}
 const render=()=>{cursor=0;mutations.length=0;return Actions({resource:"products"})};
 let tree=render();let confirm=find(tree,"button").find(b=>b.props.children==="Xác nhận nhập");assert.equal(confirm.props.disabled,false);
 selected=new File(["code,name\nBB,Changed"],"input.csv");tree=render();assert.equal(find(tree,"button").some(b=>b.props.children==="Xác nhận nhập"),false);
 selected=first;pending=true;tree=render();find(tree,"modal")[0].props.onCancel();assert.equal(state[0],true);assert.equal(find(tree,"modal")[0].props.closable,false);
 pending=false;render();await mutations[2].onSuccess({...report,committed:true});assert.ok(notices[0].includes("1 tạo mới"));assert.ok(invalidations.some(i=>i.queryKey[0]==="products"));tree=render();confirm=find(tree,"button").find(b=>b.props.children==="Xác nhận nhập");assert.equal(confirm.props.disabled,true);
});
