'use strict';

let scratchRemoved;
let scratchSearch='';
let scratchIsOpen=false;
let scratchSidebarFromReport=false;
let scratchViewUser;
let scratchView={mode:'sidebar',pinned:false,x:undefined,y:undefined};
function loadScratchView(){
  if(scratchViewUser===scratchUser())return;
  scratchViewUser=scratchUser();
  try{scratchView={mode:'sidebar',pinned:false,...JSON.parse(localStorage.getItem('pacific-scratch-view-'+scratchViewUser)||'{}')}}catch{scratchView={mode:'sidebar',pinned:false}}
}
function saveScratchView(){try{localStorage.setItem('pacific-scratch-view-'+scratchUser(),JSON.stringify(scratchView))}catch{}}
function positionScratchFloat(panel){
  const box=panel.getBoundingClientRect(),margin=12;
  const x=Math.max(margin,Math.min(scratchView.x??(innerWidth-box.width-margin),Math.max(margin,innerWidth-box.width-margin)));
  const y=Math.max(margin,Math.min(scratchView.y??90,Math.max(margin,innerHeight-box.height-margin)));
  panel.style.left=x+'px';panel.style.top=y+'px';
  scratchView.x=x;scratchView.y=y;
}

function scratchUser(){
  try{return sessionStorage.getItem('pacific-workbench-demo-user')||'市场经理'}catch{return '市场经理'}
}
function scratchKey(){return 'pacific-materials-'+scratchUser()}
function scratchRead(){
  try{return (JSON.parse(localStorage.getItem(scratchKey()))||[]).map(enrichScratchMetadata)}catch{return []}
}
function scratchWrite(items){
  try{localStorage.setItem(scratchKey(),JSON.stringify(items));return true}
  catch{showWorkbookNotice('保存失败，请先导出备份。',true);return false}
}
function enrichScratchMetadata(item){
  if(item.activityIds?.length)return item;
  const ids=new Set();
  const add=id=>{if(id&&activities[id])ids.add(id)};
  add(item.scope?.activity);
  const route=(item.page||'').match(/CMP-\d{4}-\d{4}/);
  if(route)add(route[0]);
  for(const name of item.result?.comparison?.names||[]){
    add(summaries.find(s=>s.name===name)?.activity_id);
  }
  const activityIds=[...ids].sort();
  return {...item,activityIds,groupKey:activityIds.length?activityIds.join('|'):
    item.kind==='analysis'?'comparison-unknown':'overview',
    pageLabel:item.pageLabel||scratchPageLabel(item.page)};
}
function scratchPageLabel(page=''){
  if(page.includes('/compare'))return '对比分析';
  if(page.includes('/performance'))return '活动效果分析';
  if(page.includes('#activity/'))return '活动详情';
  if(page.includes('/store'))return '按门店';
  if(page.includes('/day'))return '按日';
  if(page.includes('/activity'))return '按活动';
  return '数据总览';
}
function scratchContext(){
  const activity=document.querySelector('[data-performance-activity]')?.dataset.performanceActivity;
  return {page:location.hash||'#summary',scope:activity?{activity}:structuredClone(summaryScope),
    pageLabel:scratchPageLabel(location.hash),time:new Date().toISOString(),source:meta.version};
}
function scratchGroupTitle(item){
  const ids=item.activityIds||[];
  return ids.length?ids.map(id=>activities[id].activity_summary.name).join(' × '):
    item.groupKey==='comparison-unknown'?'跨活动对比':'经营总览与笔记';
}
function scratchGroupedHTML(items){
  const groups=new Map();
  for(const item of items){
    const key=item.groupKey||'overview';
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(item);
  }
  return [...groups.values()].map(group=>'<section class="scratch-group"><h3 data-language-original>'+
    escape(scratchGroupTitle(group[0]))+'<small>'+group.length+' 份素材</small></h3>'+
    group.map(scratchItemHTML).join('')+'</section>').join('');
}
function scratchInfo(item){
  const ids=item.activityIds||[];
  const info=ids.map(id=>{
    const s=activities[id].activity_summary;
    return s.name+' · '+id+' · '+s.type+' · '+displayDateRange(s.start,s.end);
  });
  if(!ids.length&&item.scope?.from)info.push(displayDateRange(item.scope.from,item.scope.to)+
    ' · '+(item.scope.store||item.scope.district||'全部门店')+' · '+(item.scope.channel||'全部渠道'));
  return [...info,item.pageLabel||scratchPageLabel(item.page)].filter(Boolean).join('\n');
}
function scratchAdd(item){
  const items=scratchRead();
  if(items.some(x=>x.fingerprint===item.fingerprint)){
    showWorkbookNotice('这份素材已在草稿纸中');return;
  }
  if(!scratchWrite([enrichScratchMetadata({...scratchContext(),...item,id:crypto.randomUUID(),remark:''}),...items]))return;
  showWorkbookNotice('已加入素材草稿纸');
  updateScratchCount();
}
function scratchEvidence(result){
  scratchAdd({kind:'analysis',title:result.title,fingerprint:JSON.stringify(result),result:structuredClone(result)});
}
function scratchSnapshot(target,title){
  const copy=target.cloneNode(true);
  copy.querySelectorAll('button,.tooltip,[hidden],.chart-download,.scratch-collect').forEach(x=>x.remove());
  // Clear transient hover graphics from the captured chart.
  copy.querySelectorAll('.overview-crosshair').forEach(x=>x.remove());
  copy.querySelectorAll('[tabindex]').forEach(x=>x.removeAttribute('tabindex'));
  const text=copy.textContent.trim();
  scratchAdd({kind:'snapshot',title,html:copy.outerHTML,text,fingerprint:JSON.stringify([location.hash,summaryScope,title,text])});
}
function updateScratchCount(){
  const counter=document.querySelector('#scratch-count');
  if(counter)counter.textContent=scratchRead().length;
}
function scratchItemHTML(item){
  return '<article class="scratch-item" draggable="true" data-id="'+item.id+'"><div class="row spread"><input class="scratch-title" aria-label="素材标题" data-scratch-title="'+item.id+'" value="'+escape(item.title)+'">'+
    '<small>'+({snapshot:'图表／指标',analysis:'分析结果',note:'笔记'}[item.kind]||'素材')+'</small></div>'+
    (item.kind!=='note'?'<div class="scratch-thumbnail" draggable="true" data-thumbnail-id="'+item.id+'">'+(item.thumbnail?'<img draggable="true" src="'+item.thumbnail+'" alt="素材缩略图">':'<small>正在生成缩略图…</small>')+'</div>':'')+
    '<p class="scratch-source" data-language-original>'+escape(scratchInfo(item))+'</p>'+
    '<small>'+new Date(item.time).toLocaleString('zh-CN',{hour12:false})+'</small>'+
    '<textarea rows="2" data-scratch-remark="'+item.id+'" placeholder="记录发现、疑问或下一步行动">'+escape(item.remark||'')+'</textarea>'+
    '<div class="row"><button class="compact-action" data-scratch="insert" data-id="'+item.id+'">插入报告</button>'+
    '<a class="tiny" href="'+escape(item.page||'#summary')+'">回到来源</a>'+
    '<button class="compact-action" data-scratch="up" data-id="'+item.id+'" aria-label="向前移动">↑</button>'+
    '<button class="compact-action" data-scratch="remove" data-id="'+item.id+'">移除</button></div></article>';
}
function openScratch(){
  loadScratchView();scratchIsOpen=true;
  scratchSidebarFromReport=location.hash==='#reports'&&scratchView.mode!=='float';
  let panel=document.getElementById('scratch-drawer');
  if(!panel){
    panel=document.createElement('aside');panel.id='scratch-drawer';panel.setAttribute('aria-label','素材草稿纸');
    document.body.append(panel);
  }
  const docked=location.hash==='#reports'&&scratchView.mode!=='float';
  panel.classList.toggle('scratch-docked',docked);
  panel.classList.toggle('scratch-floating',scratchView.mode==='float');
  panel.classList.toggle('scratch-pinned',!!scratchView.pinned);
  panel.style.left='';panel.style.top='';
  const slot=document.querySelector('.workspace-grid>aside:not(#scratch-drawer)');
  if(slot)slot.hidden=true;
  if(docked&&slot)slot.after(panel);else document.body.append(panel);
  panel.hidden=false;
  const items=scratchRead().filter(item=>(item.title+' '+item.remark+' '+scratchInfo(item)).toLowerCase().includes(scratchSearch.toLowerCase()));
  panel.innerHTML='<div class="scratch-window-head"><h2>素材草稿纸</h2><div class="scratch-window-actions">'+
    '<button type="button" class="scratch-window-tool" data-scratch="mode" data-scratch-tip="'+(scratchView.mode==='float'?'切回左侧边栏':'切换为悬浮窗口')+'" title="'+(scratchView.mode==='float'?'切回左侧边栏':'切换悬浮窗口')+'" aria-label="'+(scratchView.mode==='float'?'切回左侧边栏':'切换悬浮窗口')+'">'+(scratchView.mode==='float'?'◧':'▣')+'</button>'+
    (scratchView.mode==='float'?'<button type="button" class="scratch-window-tool" data-scratch="pin" aria-pressed="'+!!scratchView.pinned+'" title="'+(scratchView.pinned?'解除固定，允许拖动':'固定当前位置')+'">'+(scratchView.pinned?'解除固定':'固定')+'</button>':'')+
    '<button type="button" class="scratch-window-tool" data-scratch="close" title="关闭" aria-label="关闭">×</button></div></div>'+
    '<p class="sub">在看板中点「＋」收集，写报告时随时调用。</p>'+
    '<div class="row"><button class="compact-action" data-scratch="note">＋ 写笔记</button><button class="compact-action" data-scratch="backup">导出备份</button>'+
    (scratchRemoved?'<button class="compact-action" data-scratch="undo">撤销移除</button>':'')+'</div>'+
    '<label class="scratch-search">搜索素材<input type="search" id="scratch-search" value="'+escape(scratchSearch)+'"></label>'+
    '<div>'+scratchGroupedHTML(items)+(items.length?'':'<p class="sub">暂无匹配素材。</p>')+'</div>';
  if(scratchView.mode==='float')positionScratchFloat(panel);
  updateScratchCount();
  void prepareScratchThumbnails();
}
function scratchResult(item){
  if(item.kind==='analysis')return {...structuredClone(item.result),materialId:item.id,materialRemark:item.remark};
  return {title:item.title,detail:scratchInfo(item),source:item.source,
    points:[],labels:[],unit:'',summary:item.kind==='note'?(item.remark||item.title):item.text,
    note:item.remark||'',materialId:item.id,snapshotHTML:item.html||''};
}
function insertScratch(item){
  const draft=workspaceDraft();
  if(draft.evidence.some(r=>r.materialId===item.id)){
    showWorkbookNotice('报告已引用此素材');return;
  }
  if(location.hash==='#reports')rememberReportChange();
  const result=scratchResult(item);draft.evidence.push(result);
  reportBlocks(draft);
  const rows=[...new Set(draft.imageLayout.filter(entry=>entry.key.startsWith(result.figureId+':')).map(entry=>entry.row))];
  if(location.hash==='#reports')insertReportRowsAtRange(rows,reportSelection);
  if(item.remark){
    const addition=item.title+'\n'+item.remark;
    draft.bodyHTML=reportBodyHTML(draft)+reportBodyHTML({text:addition});
    draft.text=[draft.text,addition].filter(Boolean).join('\n\n');
  }
  saveWorkspace();
  scratchIsOpen=false;document.getElementById('scratch-drawer').hidden=true;
  if(location.hash==='#reports')renderWorkspace();else location.hash='#reports';
  showWorkbookNotice('素材及备注已加入报告');
}
function renderProfile(){renderPersonalProfile()}
function collectButtons(){
  document.querySelectorAll('main .chart,main .performance-bars,main .channel-donut-svg,main .goal-ring-refined,main .metric').forEach(target=>{
    if(target.closest('.workspace-paper,.scratch-item')||target.querySelector(':scope > .scratch-collect'))return;
    const button=document.createElement('button');
    button.className='scratch-collect no-print';button.type='button';button.textContent='＋';
    button.title='加入素材草稿纸';button.setAttribute('aria-label','加入素材草稿纸');
    target.classList.add('scratch-collectable');
    button.addEventListener('click',()=>{
      const label=target.matches('.metric')?target.querySelector('.muted')?.textContent:
        target.closest('section')?.querySelector('h2,h3,h4')?.textContent;
      scratchSnapshot(target,label?.trim()||'数据图表');
    });
    target.append(button);
  });
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-scratch]');if(!button)return;
  const action=button.dataset.scratch,id=button.dataset.id,items=scratchRead(),item=items.find(x=>x.id===id);
  if(action==='open')openScratch();
  if(action==='mode'){scratchView.mode=scratchView.mode==='float'?'sidebar':'float';saveScratchView();openScratch()}
  if(action==='pin'){scratchView.pinned=!scratchView.pinned;saveScratchView();openScratch()}

  if(action==='close'){
    scratchIsOpen=false;
    document.getElementById('scratch-drawer').hidden=true;
    const original=document.querySelector('.workspace-grid>aside:not(#scratch-drawer)');
    if(original)original.hidden=false;
  }
  if(action==='insert'&&item)insertScratch(item);
  if(action==='remove'&&item){
    scratchRemoved={key:scratchKey(),item,index:items.indexOf(item)};
    if(scratchWrite(items.filter(x=>x.id!==id))){openScratch();if(location.hash==='#profile')renderProfile()}
  }
  if(action==='undo'&&scratchRemoved?.key===scratchKey()){
    items.splice(scratchRemoved.index,0,scratchRemoved.item);
    if(scratchWrite(items)){scratchRemoved=undefined;openScratch()}
  }
  if(action==='up'&&item){
    const index=items.indexOf(item);
    if(index>0){[items[index-1],items[index]]=[items[index],items[index-1]];scratchWrite(items);openScratch()}
  }
  if(action==='note'){scratchAdd({title:'新笔记',kind:'note',fingerprint:crypto.randomUUID()});openScratch()}
  if(action==='backup'){
    const href=URL.createObjectURL(new Blob([JSON.stringify(items,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=href;link.download='Pacific-Coffee-materials.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(href),10000);
  }
});
document.addEventListener('input',event=>{
  const titleId=event.target.dataset.scratchTitle;
  if(titleId){const items=scratchRead(),item=items.find(x=>x.id===titleId);if(item){item.title=event.target.value;scratchWrite(items)}}
  const id=event.target.dataset.scratchRemark;
  if(id){const items=scratchRead(),item=items.find(x=>x.id===id);if(item){item.remark=event.target.value;scratchWrite(items)}}
  if(event.target.id==='scratch-search'){
    scratchSearch=event.target.value;openScratch();const field=document.querySelector('#scratch-search');field.focus();field.setSelectionRange(field.value.length,field.value.length);
  }
});
document.addEventListener('click',event=>{
  if(event.target.id==='logout'){scratchIsOpen=false;document.getElementById('scratch-drawer')?.setAttribute('hidden','');scratchRemoved=undefined}
});
let scratchPending=false;
new MutationObserver(()=>{
  if(scratchPending)return;scratchPending=true;
  queueMicrotask(()=>{scratchPending=false;collectButtons();updateScratchCount();if(!closeDepartedScratchSidebar()&&scratchIsOpen&&!document.getElementById('scratch-drawer'))openScratch()});
}).observe(document.querySelector('main'),{childList:true,subtree:true});
collectButtons();updateScratchCount();

const thumbnailJobs=new Set();
async function prepareScratchThumbnails(){
  const key=scratchKey();
  for(const node of document.querySelectorAll('[data-thumbnail-id]')){
    const id=node.dataset.thumbnailId;
    const item=scratchRead().find(item=>item.id===id);
    if(!item||item.thumbnail||thumbnailJobs.has(id))continue;
    thumbnailJobs.add(id);
    try{
      const images=await makeEvidenceImages(scratchResult(item));
      const image=new Image();image.src=images[0];await image.decode();
      const canvas=document.createElement('canvas');canvas.width=360;canvas.height=Math.round(image.height*360/image.width);
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      const thumbnail=canvas.toDataURL('image/png');
      if(scratchKey()!==key)continue;
      const items=scratchRead(),current=items.find(x=>x.id===id);
      if(current){current.thumbnail=thumbnail;scratchWrite(items)}
      document.querySelectorAll('[data-thumbnail-id]').forEach(target=>{
        if(target.dataset.thumbnailId!==id)return;
        const img=document.createElement('img');img.src=thumbnail;img.alt='素材缩略图';img.draggable=true;target.replaceChildren(img);
      });
    }catch{node.textContent='缩略图暂不可用'}finally{thumbnailJobs.delete(id)}
  }
}

let scratchWindowDrag;
document.addEventListener('pointerdown',event=>{
  const header=event.target.closest('.scratch-window-head');
  if(!header||event.target.closest('button,input')||scratchView.mode!=='float'||scratchView.pinned||event.button!==0)return;
  const panel=header.closest('#scratch-drawer'),box=panel.getBoundingClientRect();
  scratchWindowDrag={panel,header,dx:event.clientX-box.left,dy:event.clientY-box.top};
  header.setPointerCapture(event.pointerId);panel.classList.add('scratch-moving');event.preventDefault();
});
document.addEventListener('pointermove',event=>{
  if(!scratchWindowDrag)return;
  scratchView.x=event.clientX-scratchWindowDrag.dx;scratchView.y=event.clientY-scratchWindowDrag.dy;
  positionScratchFloat(scratchWindowDrag.panel);
});
function endScratchWindowDrag(){
  if(!scratchWindowDrag)return;
  scratchWindowDrag.panel.classList.remove('scratch-moving');scratchWindowDrag=undefined;saveScratchView();
}
document.addEventListener('pointerup',endScratchWindowDrag);
document.addEventListener('pointercancel',endScratchWindowDrag);
window.addEventListener('resize',()=>{const panel=document.getElementById('scratch-drawer');if(panel&&!panel.hidden&&scratchView.mode==='float')positionScratchFloat(panel)});
function closeDepartedScratchSidebar(){
  if(!scratchIsOpen||!scratchSidebarFromReport||scratchView.mode==='float'||location.hash==='#reports')return false;
  scratchIsOpen=false;scratchSidebarFromReport=false;
  document.getElementById('scratch-drawer')?.remove();
  return true;
}
window.addEventListener('hashchange',()=>{if(!closeDepartedScratchSidebar()&&scratchIsOpen)openScratch()});
