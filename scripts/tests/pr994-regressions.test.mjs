import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkPagesAssets } from '../ci/check-pages-assets.mjs';
const repository = process.cwd();
function fixture(t) { const p = mkdtempSync(resolve(tmpdir(),'pr994-')); t.after(()=>rmSync(p,{recursive:true,force:true})); return p; }
function put(root,path,text) {mkdirSync(dirname(resolve(root,path)),{recursive:true}); writeFileSync(resolve(root,path),text);}
const incomplete = {overallStatus:'incomplete',gates:[{name:'live',required:true,status:'skipped'}]};
for (const [code,required,receipt,expected] of [
  [0,'false',incomplete,0],[1,'false',incomplete,1],[78,'false',incomplete,78],
  [2,'false',incomplete,0],[2,'true',incomplete,2],[2,undefined,incomplete,2],
  [2,'false',{...incomplete,overallStatus:'passed'},1],
  [2,'false',{...incomplete,gates:[{required:true,status:'failed'}]},1],
  [2,'false',{overallStatus:'incomplete',gates:[]},1],
]) test(`readiness exit ${code}, require=${required}, ${JSON.stringify(receipt)}`,t=>{
  const root=fixture(t); put(root,'scripts/smoke/beta-readiness.sh',`#!/bin/bash\nexit ${code}\n`);
  copyFileSync(resolve(repository,'scripts/smoke/beta-readiness-ci.sh'),resolve(root,'scripts/smoke/beta-readiness-ci.sh'));
  put(root,'receipt.json',JSON.stringify(receipt));
  const env={...process.env,READINESS_OUTPUT_PATH:resolve(root,'receipt.json')};
  delete env.READINESS_REQUIRE_TARGETS; delete env.GITHUB_STEP_SUMMARY;
  if(required!==undefined) env.READINESS_REQUIRE_TARGETS=required;
  const result=spawnSync('bash',['scripts/smoke/beta-readiness-ci.sh'],{cwd:root,env,encoding:'utf8'});
  assert.equal(result.status,expected,result.stdout+result.stderr);
  if(code===2 && expected===0) assert.match(result.stdout,/INCOMPLETE/);
});
test('readiness missing receipt does not pass',t=>{
 const root=fixture(t);put(root,'scripts/smoke/beta-readiness.sh','exit 2\n');
 copyFileSync(resolve(repository,'scripts/smoke/beta-readiness-ci.sh'),resolve(root,'scripts/smoke/beta-readiness-ci.sh'));
 const result=spawnSync('bash',['scripts/smoke/beta-readiness-ci.sh'],{cwd:root,env:{...process.env,READINESS_REQUIRE_TARGETS:'false',READINESS_OUTPUT_PATH:resolve(root,'missing.json')}});
 assert.notEqual(result.status,0);
});
for(const from of ['BUILD_STARTED','BUILD_DONE','TESTED','BUG']) test(`triage rejects ${from} to CLOSED without mutating history`,t=>{
 const root=fixture(t);const data=JSON.stringify({issues:{178:{state:from,history:[]}},batches:[]});put(root,'docs/triage.json',data);
 const result=spawnSync('bash',[resolve(repository,'scripts/triage/state-transition.sh'),'178','CLOSED','--evidence','test:1'],{cwd:root});
 assert.notEqual(result.status,0);assert.equal(readFileSync(resolve(root,'docs/triage.json'),'utf8'),data);
});
test('triage full lifecycle and reasoned recovery preserve history',t=>{
 const root=fixture(t);put(root,'docs/triage.json',JSON.stringify({issues:{178:{state:'TRACKING',history:[]}},batches:[]}));
 const run=(state,...args)=>spawnSync('bash',[resolve(repository,'scripts/triage/state-transition.sh'),'178',state,...args],{cwd:root,encoding:'utf8'});
 for(const state of ['BUILD_STARTED','BUILD_DONE','TESTED','PR_CREATED','PR_MERGED','CLOSED']) {const result=run(state,'--evidence','test:1','--pr','https://github.com/example/repo/pull/1');assert.equal(result.status,0,result.stdout+result.stderr);}
 assert.notEqual(run('BUILD_STARTED').status,0);
 assert.equal(run('BUILD_STARTED','--reason','premature closure correction').status,0);
 const entry=JSON.parse(readFileSync(resolve(root,'docs/triage.json'),'utf8')).issues[178];assert.equal(entry.history.length,7);assert.equal(entry.history.at(-1).reason,'premature closure correction');assert.equal(entry.state,'BUILD_STARTED');
});
test('Pages root and nested bundles are real; stale hashes and wrong base fail',t=>{
 const root=fixture(t);put(root,'assets/root.js','export{}');put(root,'ask-styx/assets/app.js','export{}');
 put(root,'index.html','<script type="module" src="./assets/root.js"></script>');
 put(root,'ask-styx/index.html','<script type="module" src="/peer-audited--behavioral-blockchain/ask-styx/assets/app.js"></script>');
 assert.deepEqual(checkPagesAssets(root),{pages:2,localAssetsChecked:2});
 put(root,'ask-styx/index.html','<script src="/peer-audited--behavioral-blockchain/assets/root.js"></script>');assert.throws(()=>checkPagesAssets(root),/subpath/);
 put(root,'ask-styx/index.html','<script src="./assets/nonexistent.js"></script>');assert.throws(()=>checkPagesAssets(root),/missing local asset/);
});
