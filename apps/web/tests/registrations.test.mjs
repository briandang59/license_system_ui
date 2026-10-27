import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require=createRequire(import.meta.url);
function load(path,imports={}) { const mod={exports:{}}; const code=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText; new Function("require","module","exports",code)(name=>imports[name]??require(name),mod,mod.exports);return mod.exports; }
const schema=load("features/registrations/schema.ts");
const {handlePublicRegistration}=load("features/registrations/handler.ts",{"./schema":schema});
const savedFetch=global.fetch;afterEach(()=>{global.fetch=savedFetch});
const input={request_key:"64c15ebe-68ab-4fd3-b04f-ea710702e58d",company_name:"Company",contact_name:"Contact",email:"user@example.com",phone:"123",tax_code:"",address:"",note:"",product_id:1,plan_id:null,plan_price_id:null,features:[]};
const req=(body,origin="http://localhost:3000")=>new Request("http://localhost:3000/api/registrations",{method:"POST",headers:{origin,"content-type":"application/json",cookie:"private"},body:JSON.stringify(body)});
test("registration proxy validates input and origin before contacting backend",async()=>{
 let calls=0;global.fetch=async()=>{calls++;throw Error("unexpected")};
 assert.equal((await handlePublicRegistration(req(input,"https://other.example"),"create")).status,403);
 assert.equal((await handlePublicRegistration(req({...input,email:"invalid"}),"create")).status,400);
 assert.equal((await handlePublicRegistration(req({...input,extra:"bad"}),"create")).status,400);assert.equal(calls,0);
});
test("registration proxy forwards validated anonymous payload and checks response",async()=>{
 let options;global.fetch=async(_,o)=>{options=o;return Response.json({success:true,data:{reference:"REG-1",status:"pending"}},{status:201})};
 const res=await handlePublicRegistration(req(input),"create");assert.equal(res.status,201);assert.equal(res.headers.get("cache-control"),"no-store");assert.equal(options.headers.cookie,undefined);assert.equal(options.headers.Authorization,undefined);
 global.fetch=async()=>Response.json({success:true,data:{private:"secret"}},{status:201});assert.equal((await handlePublicRegistration(req(input),"create")).status,502);
});
