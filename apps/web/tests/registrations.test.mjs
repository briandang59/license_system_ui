import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require=createRequire(import.meta.url);
function load(path,imports={}) { const mod={exports:{}}; const code=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText; new Function("require","module","exports",code)(name=>imports[name]??require(name),mod,mod.exports);return mod.exports; }
const schema=load("features/registrations/schema.ts");
const {handlePublicRegistration}=load("features/registrations/handler.ts",{"./schema":schema});
const savedFetch=global.fetch;const savedOrigin=process.env.APP_ORIGIN;afterEach(()=>{global.fetch=savedFetch;if(savedOrigin===undefined) delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=savedOrigin});
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
test("configured public origin accepts Docker's internal URL and rejects foreign origins",async()=>{
 process.env.APP_ORIGIN="https://brianense.id.vn";let calls=0;
 global.fetch=async()=>{calls++;return Response.json({success:true,data:{reference:"REG-1",status:"pending"}},{status:201})};
 const request=(origin)=>new Request("http://0.0.0.0:3000/api/registrations",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(input)});
 assert.equal((await handlePublicRegistration(request("https://brianense.id.vn"),"create")).status,201);
 assert.equal((await handlePublicRegistration(request("https://other.example"),"create")).status,403);
 assert.equal(calls,1);
});
test("registration form notifies success, server errors, and invalid fields",()=>{
 const notifications=[];let mutation;let invalid=false;let receipt="";
 const Form=load("features/registrations/form.tsx",{
  react:{useState:()=>[receipt,value=>{receipt=value}],useRef:()=>({current:null})},
  "next/link":{default:"link"},
  antd:{App:{useApp:()=>({message:{success:text=>notifications.push(["success",text]),error:text=>notifications.push(["error",text])}})},Alert:"alert",Button:"button",Result:"result"},
  "lucide-react":{ArrowLeft:"arrow",Check:"check",Plus:"plus",Trash2:"trash"},
  "react-hook-form":{useForm:()=>({control:{},formState:{errors:{}},handleSubmit:(valid,invalidHandler)=>()=>invalid?invalidHandler({}):valid(input)}),useFieldArray:()=>({fields:[]}),useWatch:()=>null},
  "@hookform/resolvers/zod":{zodResolver:()=>()=>{}},
  "@tanstack/react-query":{useMutation:options=>{mutation=options;return {isPending:false,mutate:()=>{}}}},
  "./fields":{Field:"field"},"./schema":schema,"./service":{registrationService:{create:()=>{}}},
 }).default;
 const tree=Form({selection:{product:{id:1,name:"Product"},plans:[],features:[],planID:null,priceUnavailable:false}});
 const findForm=node=>!node||typeof node!=="object"?null:Array.isArray(node)?node.map(findForm).find(Boolean):node.type==="form"?node:findForm(node.props?.children);
 invalid=true;findForm(tree).props.onSubmit({});
 mutation.onError(new Error("private details"));mutation.onSuccess({reference:"REG-1"});
 assert.deepEqual(notifications.map(item=>item[0]),["error","error","success"]);
 assert.match(notifications[0][1],/kiểm tra/);assert.doesNotMatch(notifications[1][1],/private/);assert.equal(receipt,"REG-1");
});
