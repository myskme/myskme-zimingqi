import {createServer} from 'node:http';
import {mkdir,readFile,stat,writeFile} from 'node:fs/promises';
import {dirname,extname,resolve} from 'node:path';
import {createHash} from 'node:crypto';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');

const ROOT=resolve(process.argv[2]||'.');
const OUT=resolve(ROOT,'assets/codex-atlas-20260810/zimingqi-atlas-2400.png');
const OUT_WEB=resolve(ROOT,'assets/codex-atlas-20260810/zimingqi-atlas-1200.jpg');
const OUT_PREVIEW=resolve(ROOT,'assets/codex-atlas-20260810/zimingqi-atlas-preview-600.jpg');
const OUT_DATA=resolve(ROOT,'assets/codex-atlas-20260810/atlas-data.json');
const OUT_MANIFEST=resolve(ROOT,'assets/codex-atlas-20260810/manifest.json');
const BG_SOURCE=resolve(ROOT,'assets/codex-atlas-20260810/atlas-background-source.png');
const BG_WEB=resolve(ROOT,'assets/codex-atlas-20260810/atlas-background.webp');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://local/').pathname);
    const file=resolve(ROOT,pathname==='/'?'index.html':pathname.replace(/^\/+/,''));
    if(!file.startsWith(ROOT))throw new Error('bad path');
    const body=await readFile(file);res.writeHead(200,{'Content-Type':TYPES[extname(file)]||'application/octet-stream'});res.end(body);
  }catch{res.writeHead(404);res.end('404')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));

const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
try{
  const page=await browser.newPage({viewport:{width:2400,height:3000},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(`http://127.0.0.1:${server.address().port}/?atlas=poster`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#atlas-poster[data-ready="true"]',{timeout:30000});
  await page.waitForTimeout(300);
  const report=await page.evaluate(()=>({
    width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
    elements:document.querySelectorAll('.ap-elem').length,units:document.querySelectorAll('.ap-unit').length,
    bonds:document.querySelectorAll('.ap-bond').length,combos:document.querySelectorAll('.ap-combo').length,
    cycleOverlapsElements:(()=>{const c=document.querySelector('.ap-cycle').getBoundingClientRect();return [...document.querySelectorAll('.ap-elem')].some(el=>{const r=el.getBoundingClientRect();return c.left<r.right&&c.right>r.left&&c.top<r.bottom&&c.bottom>r.top})})(),
    sectionOverlaps:(()=>{const nodes=[...document.querySelectorAll('.ap-head,.ap-cycle,.ap-elements,.ap-bonds,.ap-combos,.ap-foot')],pairs=[];for(let i=0;i<nodes.length-1;i++){const a=nodes[i].getBoundingClientRect(),b=nodes[i+1].getBoundingClientRect();if(a.bottom>b.top+.5)pairs.push(`${nodes[i].className}>${nodes[i+1].className}`)}return pairs})(),
    elementOverflow:[...document.querySelectorAll('.ap-elem')].filter(el=>el.scrollHeight>el.clientHeight+1).map(el=>el.querySelector('h2')?.textContent||'unknown'),
    failedImages:[...document.images].filter(img=>!img.naturalWidth).map(img=>img.src)
  }));
  if(errors.length||report.width!==2400||report.height!==3000||report.elements!==4||report.units<40||report.bonds!==6||report.combos!==8||report.cycleOverlapsElements||report.sectionOverlaps.length||report.elementOverflow.length||report.failedImages.length){
    throw new Error(`poster validation failed\n${JSON.stringify({report,errors},null,2)}`);
  }
  await mkdir(dirname(OUT),{recursive:true});
  const dataset=await page.evaluate(()=>({
    schemaVersion:1,assetVersion:'20260810a',title:'自鸣棋 · 四象星图',brand:'MYSKME',
    source:{units:'UNITS',zodiac:'ZODIAC',bonds:'BONDS',combos:'COMBOS'},
    counterCycle:ATLAS_ELEMS.map(key=>({from:key,fromName:ELEM_CN[key],to:ELEM_COUNTER[key],toName:ELEM_CN[ELEM_COUNTER[key]]})),
    elements:ATLAS_ELEMS.map(key=>{const b=BONDS[key],units=UNITS.filter(u=>unitElem(u.id)===key);return {
      id:key,name:ELEM_CN[key],color:atlasColor(key),bond:{name:b.n,chip:b.chip,thresholds:b.th.slice(),effects:b.d.slice()},
      zodiacs:[...new Set(units.map(u=>ZODIAC[u.id][0]))],units:units.map(u=>({
        id:u.id,name:u.n,zodiac:ZODIAC[u.id][0],rarity:u.rar,cost:u.cost,beast:u.beast||'',
        art:ART[u.id]?'assets/'+ART[u.id]:null,axes:atlasUnitAxes(u.id).map(axis=>({id:axis,name:BONDS[axis].n,chip:BONDS[axis].chip}))
      }))};}),
    playBonds:ATLAS_PLAYS.map(key=>{const b=BONDS[key];return {id:key,name:b.n,chip:b.chip,color:atlasColor(key),thresholds:b.th.slice(),effects:b.d.slice(),members:b.ids.map(id=>({id,name:UMAP[id].n}))}}),
    combos:COMBOS.map(c=>{const p=atlasComboParts(c);return {name:p.name,effect:p.effect,memberIds:p.ids,members:p.members,requiredStar:c.reqStar||1,ultimate:!!c.reqStar}})
  }));
  await writeFile(OUT_DATA,JSON.stringify(dataset,null,2)+'\n','utf8');
  await page.screenshot({path:OUT,type:'png',clip:{x:0,y:0,width:2400,height:3000},animations:'disabled'});
  const highData='data:image/png;base64,'+(await readFile(OUT)).toString('base64');
  const rasterVariant=async(width,height,path,quality)=>{
    const base64=await page.evaluate(async({src,width,height,quality})=>{const img=new Image();img.src=src;await img.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,width,height);return canvas.toDataURL('image/jpeg',quality).split(',')[1]},{src:highData,width,height,quality});
    await writeFile(path,Buffer.from(base64,'base64'));
  };
  await rasterVariant(1200,1500,OUT_WEB,.91);
  await rasterVariant(600,750,OUT_PREVIEW,.86);
  const describe=async(path,role,width,height,mime)=>{const body=await readFile(path),info=await stat(path);return {role,width,height,mime,bytes:info.size,sha256:createHash('sha256').update(body).digest('hex')}};
  const manifest={schemaVersion:1,assetVersion:'20260810a',generator:'tools/build-atlas-poster.mjs',
    contract:'ZODIAC / BONDS / COMBOS are the single source of truth; generated files must not be hand-edited.',
    reusableFor:['自鸣棋游戏内保存','MYSKME Hub','世界编年史','微信版本','未来 iOS 版本','社交平台分享'],
    files:{
      'atlas-background-source.png':await describe(BG_SOURCE,'无字四象底纹母版',1122,1402,'image/png'),
      'atlas-background.webp':await describe(BG_WEB,'游戏内轻量底纹',1122,1402,'image/webp'),
      'zimingqi-atlas-2400.png':await describe(OUT,'高清收藏版',2400,3000,'image/png'),
      'zimingqi-atlas-1200.jpg':await describe(OUT_WEB,'网页与社交传播版',1200,1500,'image/jpeg'),
      'zimingqi-atlas-preview-600.jpg':await describe(OUT_PREVIEW,'列表缩略图',600,750,'image/jpeg'),
      'atlas-data.json':await describe(OUT_DATA,'跨端结构化图鉴数据',null,null,'application/json')
    }};
  await writeFile(OUT_MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
  console.log(JSON.stringify({outputs:[OUT,OUT_WEB,OUT_PREVIEW,OUT_DATA,OUT_MANIFEST],...report,dataset:{elements:dataset.elements.length,units:dataset.elements.reduce((n,x)=>n+x.units.length,0),bonds:dataset.playBonds.length,combos:dataset.combos.length}},null,2));
}finally{await browser.close();server.close()}
