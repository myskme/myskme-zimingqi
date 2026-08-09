import {cp,mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const out=resolve(process.argv[2]||join(tmpdir(),'zimingqi-edgeone.zip'));
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const stage=await mkdtemp(join(tmpdir(),'zimingqi-edgeone-'));
const runtime=['index.html','manifest.webmanifest','sw.js','edgeone.json','og-cover.png','assets'];

try{
  await mkdir(stage,{recursive:true});
  for(const item of runtime)await cp(join(root,item),join(stage,item),{recursive:true});
  await rm(out,{force:true});
  const zip=spawnSync('zip',['-qr',out,'.'],{cwd:stage,stdio:'inherit'});
  if(zip.status!==0)throw new Error('zip 构建失败');
  console.log(out);
}finally{
  await rm(stage,{recursive:true,force:true});
}
