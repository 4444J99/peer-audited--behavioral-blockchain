import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
const repository = process.cwd();
function setup(t) {
  const root = mkdtempSync(resolve(tmpdir(), 'pr994-sharing-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path, text, mode=0o644) => {
    const target=resolve(root,path); mkdirSync(dirname(target),{recursive:true}); writeFileSync(target,text,{mode});
  };
  put('src/web/out/index.html','root'); put('src/web/out/tour/index.html','snapshot-tour');
  put('artifacts/styx-demo-native.env','STYX_DEMO_WEB_URL=http://127.0.0.1:4311\n');
  put('bin/curl', `#!/bin/bash
output=''; status=false; url=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    -o) output="$2"; shift 2 ;;
    -w) status=true; shift 2 ;;
    http://*) url="$1"; shift ;;
    *) shift ;;
  esac
done
printf '%s\\n' "$url" >> "$REQUESTS"
if [ "$status" = true ]; then printf '%s' "\${API_STATUS:-404}"; else printf '%s' "\${TOUR_BODY:-snapshot-tour}" > "$output"; fi
`,0o755);
  put('bin/npx','#!/bin/bash\nprintf "%s\\n" "$@" > "$NPX_ARGS"\n[ "$1" = --yes ] && [ "$2" = serve@14.2.6 ]\n',0o755);
  put('bin/mise','#!/bin/bash\nshift 3\nexec "$@"\n',0o755);
  mkdirSync(resolve(root,'scripts/demo'),{recursive:true});
  for(const file of ['share.sh','snapshot.sh'])copyFileSync(resolve(repository,'scripts/demo',file),resolve(root,'scripts/demo',file));
  const env={...process.env,PATH:resolve(root,'bin')+':'+process.env.PATH,STYX_DEMO_SHARE_HOST:'192.168.50.4',REQUESTS:resolve(root,'requests'),NPX_ARGS:resolve(root,'npx-args')};
  delete env.STYX_DEMO_SHARE_PORT; delete env.STYX_SNAPSHOT_LAN; delete env.API_STATUS; delete env.TOUR_BODY;
  return {root,env,run:(script,args=[],extra={})=>spawnSync('bash',['scripts/demo/'+script,...args],{cwd:root,env:{...env,...extra},encoding:'utf8'})};
}
test('LAN QR selects the static snapshot, not the native live port',t=>{
  const f=setup(t),result=f.run('share.sh');
  assert.equal(result.status,0,result.stdout+result.stderr);
  assert.match(result.stdout,/192\.168\.50\.4:4315\/tour\//);
  assert.doesNotMatch(readFileSync(resolve(f.root,'requests'),'utf8'),/:4311/);
  assert.match(result.stdout,/No live login/); assert.match(result.stdout,/Do not share/);
});
for(const [name,extra] of [['different export',{TOUR_BODY:'live-login'}],['live API',{API_STATUS:'200'}]])test('sharing rejects '+name,t=>{
  const f=setup(t),result=f.run('share.sh',[],extra);assert.notEqual(result.status,0);assert.doesNotMatch(result.stdout,/snapshot for the room/);
});
test('sharing refuses an unbuilt export',t=>{
  const f=setup(t);rmSync(resolve(f.root,'src/web/out'),{recursive:true});assert.notEqual(f.run('share.sh').status,0);
});
for(const [lan,host] of [['false','127.0.0.1'],['true','0.0.0.0']])test('snapshot listener has explicit LAN opt-in: '+lan,t=>{
  const f=setup(t),result=f.run('snapshot.sh',['serve'],{STYX_SNAPSHOT_LAN:lan});
  assert.equal(result.status,0,result.stdout+result.stderr);
  const args=readFileSync(resolve(f.root,'npx-args'),'utf8');assert.match(args,/serve@14\.2\.6/);assert.ok(args.includes('tcp://'+host+':4315'));assert.ok(args.includes(resolve(f.root,'src/web/out')));
});
test('browser registration uses the identity-free transport options',()=>{
  const page=readFileSync(resolve(repository,'src/web/app/register/page.tsx'),'utf8');
  assert.match(page,/register\(email, password, browserRegistrationOptions\(dateOfBirth\)\)/);
  assert.doesNotMatch(page,/deviceIdentifier|randomUUID|localStorage/);
});
