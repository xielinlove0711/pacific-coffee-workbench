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
  try{return (JSON.parse(localStorage.getItem(scratchKey()))||[]).map(normalizeScratchItem).map(enrichScratchMetadata)}catch{return []}
}
function metricTextItem(target,title){
  const label=target.dataset.metricExportLabel||title;
  const value=target.querySelector('.big')?.textContent.trim()||'—';
  const help=[...target.querySelectorAll('[data-metric-help]')].map(n=>n.dataset.metricHelp).join(' ');
  const monetary=/HKD|营收|客单价|投入|花费|毛利|CPM|revenue|order value|spend|cost|profit/i.test(label+' '+help);
  const unit=monetary&&!value.includes('HKD')&&!value.includes('%')&&value!=='—'?' HKD':'';
  const plainTitle=metricDisplay(title).replace(/＋/g,'').trim();
  return {kind:'text',title:plainTitle,text:plainTitle+'：'+value+unit};
}
function normalizeScratchItem(item){
  if(item.kind==='snapshot'&&item.html){
    const host=document.createElement('div');host.innerHTML=item.html;
    const metric=host.querySelector('.metric');
    if(metric&&!host.querySelector('svg,.performance-bars')){
      const normalized={...item,...metricTextItem(metric,item.title)};
      delete normalized.html;delete normalized.thumbnail;return normalized;
    }
  }
  return item;
}
function scratchWrite(items){
  try{localStorage.setItem(scratchKey(),JSON.stringify(items));refreshCollectedStates();return true}
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
    escape(localize(scratchGroupTitle(group[0])))+'<small>'+localize(group.length+' 份素材')+'</small></h3>'+
    group.map(scratchItemHTML).join('')+'</section>').join('');
}
function scratchInfo(item){
  const ids=item.activityIds||[];
  const info=ids.map(id=>{
    const s=activities[id].activity_summary;
    return s.name+' · '+id+' · '+s.type+' · '+displayDateRange(s.start,s.end)+(s.scenario?' · 新增活动方案；门店经营数据截至 '+meta.data_cutoff:'');
  });
  if(!ids.length&&item.scope?.from)info.push(displayDateRange(item.scope.from,item.scope.to)+
    ' · '+(item.scope.store||item.scope.district||'全部门店')+' · '+(item.scope.channel||'全部渠道'));
  return [...info,item.pageLabel||scratchPageLabel(item.page)].filter(Boolean).join('\n');
}
function showScratchCollectionFeedback(already=false){
  const count=scratchRead().length;
  const text=localize(already==='removed'?'已取消收藏':already?'这份素材已在素材库中':'已加入素材库')+' · '+(uiLanguage==='en'?count+' items':'共 '+count+' 项');
  showWorkbookNotice(text);
  const notice=document.getElementById('workspace-notice');
  const action=document.createElement('a');action.href='#reports/materials';action.className='scratch-notice-action';action.textContent=localize('查看素材库');
  action.addEventListener('click',()=>notice.classList.remove('is-visible'));
  notice.append(action);
  clearTimeout(workbookNoticeTimer);workbookNoticeTimer=setTimeout(()=>{notice.classList.remove('is-visible');notice.textContent=''},7000);
  notice.onpointerenter=()=>clearTimeout(workbookNoticeTimer);
  notice.onfocusin=()=>clearTimeout(workbookNoticeTimer);
  const dismiss=()=>{clearTimeout(workbookNoticeTimer);workbookNoticeTimer=setTimeout(()=>{notice.classList.remove('is-visible');notice.textContent=''},4000)};
  notice.onpointerleave=dismiss;notice.onfocusout=dismiss;
}
function scratchAdd(item){
  const items=scratchRead();
  if(items.some(x=>x.fingerprint===item.fingerprint)){
    showScratchCollectionFeedback(true);return;
  }
  if(!scratchWrite([enrichScratchMetadata({...scratchContext(),...item,id:crypto.randomUUID(),remark:''}),...items]))return;
  showScratchCollectionFeedback();updateScratchCount();refreshCollectedStates();
  if(scratchIsOpen)openScratch();
}
function scratchEvidence(result){
  scratchAdd({kind:'analysis',title:result.title,fingerprint:JSON.stringify(result),result:structuredClone(result)});
}
function scratchSnapshotItem(target,title){
  if(target.matches('.reach-channel')){
    const lines=[...target.querySelectorAll('.metric')].map(metric=>{
      const label=metric.querySelector('.muted')?.textContent.trim()||'',item=metricTextItem(metric,label);
      const unit=/发送记录|已送达/.test(label)?' 条':/^(曝光|点击)$/.test(label)?' 次':'';
      return item.text+unit;
    });
    const text=lines.length?lines.join('\n'):(target.querySelector('.reach-empty')?.textContent||'暂无数据');
    return {kind:'text',title,text,fingerprint:JSON.stringify([location.hash,summaryScope,title,text])};
  }
  if(target.matches('.metric')){const item=metricTextItem(target,title);return {...item,fingerprint:JSON.stringify([location.hash,summaryScope,item.title,item.text])}}
  const copy=target.cloneNode(true);
  copy.querySelectorAll('button,.tooltip,[hidden],.chart-download,.scratch-collect').forEach(x=>x.remove());
  copy.querySelectorAll('.overview-crosshair').forEach(x=>x.remove());
  copy.querySelectorAll('[tabindex]').forEach(x=>x.removeAttribute('tabindex'));
  const text=copy.textContent.trim();
  return {kind:'snapshot',title,html:copy.outerHTML,text,fingerprint:JSON.stringify([location.hash,summaryScope,title,text])};
}
function scratchTargetTitle(target){
  const label=target.matches('.reach-channel')?target.querySelector('h3')?.textContent:target.matches('.metric')?[...(target.querySelector('.muted')?.childNodes||[])].filter(n=>n.nodeName!=='BUTTON').map(n=>n.textContent).join(''):target.closest('section')?.querySelector('h2,h3,h4')?.textContent;
  return label?.trim()||'数据图表';
}
function refreshCollectedStates(){
  const saved=new Set(scratchRead().map(item=>item.fingerprint));
  document.querySelectorAll('main .scratch-collectable').forEach(target=>{
    const button=target.matches('.metric,.reach-channel,.overview-weekday-card,.overview-calendar-card')?target.querySelector('.scratch-collect'):target.parentElement?.querySelector(':scope > .visual-action-bar .scratch-collect');
    if(!button)return;
    const collected=saved.has(scratchSnapshotItem(target,scratchTargetTitle(target)).fingerprint);
    button.classList.toggle('is-collected',collected);
    const title=localize(collected?'取消收藏':'加入素材库');
    if(button.title!==title)button.title=title;
    if(button.getAttribute('aria-label')!==title)button.setAttribute('aria-label',title);
    if(button.getAttribute('aria-pressed')!==String(collected))button.setAttribute('aria-pressed',String(collected));
  });
}
function scratchSnapshot(target,title){
  const candidate=scratchSnapshotItem(target,title),items=scratchRead(),index=items.findIndex(item=>item.fingerprint===candidate.fingerprint);
  if(index<0){scratchAdd(candidate);return}
  const removed=items[index];
  if(!scratchWrite(items.filter(item=>item.id!==removed.id)))return;
  scratchRemoved={key:scratchKey(),item:removed,index};
  updateScratchCount();refreshCollectedStates();showScratchCollectionFeedback('removed');
  if(scratchIsOpen)openScratch();
}
function updateScratchCount(){
  const counter=document.querySelector('#scratch-count');
  if(counter)counter.textContent=scratchRead().length;
}
function scratchRemarkHTML(item){
  const filled=!!item.remark?.trim();
  return '<div class="scratch-remark-editor"><button type="button" class="scratch-pencil" data-scratch-edit-remark="'+item.id+'" title="'+localize('记录发现')+'" aria-label="'+localize('记录发现')+'" aria-expanded="'+filled+'"'+(filled?' hidden':'')+'><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.8 3.2 4 4M3 17l4.3-1L17 6.3a1.5 1.5 0 0 0 0-2.1L15.8 3a1.5 1.5 0 0 0-2.1 0L4 12.7 3 17Z"/></svg></button><textarea rows="1" data-scratch-remark="'+item.id+'" aria-label="'+localize('记录发现')+'" placeholder="记录发现、疑问或下一步行动"'+(filled?'':' hidden')+'>'+escape(item.remark||'')+'</textarea></div>';
}
function scratchItemHTML(item){
  if(item.kind==='text')return '<article class="scratch-item scratch-text-item" draggable="true" data-id="'+item.id+'"><p class="scratch-text-content" data-language-original>'+escape(localize(item.text))+'</p>'+scratchRemarkHTML(item)+'<div class="row"><button class="compact-action" data-scratch="insert" data-id="'+item.id+'">插入报告</button><details class="scratch-text-source"><summary>来源</summary><p class="scratch-source" data-language-original>'+escape(localize(scratchInfo(item)))+'</p></details><button class="compact-action" data-scratch="remove" data-id="'+item.id+'">移除</button></div></article>';
  return '<article class="scratch-item" draggable="true" data-id="'+item.id+'"><div class="row spread"><input class="scratch-title" aria-label="素材标题" data-scratch-title="'+item.id+'" value="'+escape(item.title)+'">'+
    '<small>'+({snapshot:'图表／指标',analysis:'分析结果',note:'笔记'}[item.kind]||'素材')+'</small></div>'+
    (item.kind!=='note'?'<div class="scratch-thumbnail" draggable="true" data-thumbnail-id="'+item.id+'">'+(item.thumbnail?'<img draggable="true" src="'+item.thumbnail+'" alt="素材缩略图">':'<small>正在生成缩略图…</small>')+'</div>':'')+
    '<p class="scratch-source" data-language-original>'+escape(localize(scratchInfo(item)))+'</p>'+
    '<small>'+new Date(item.time).toLocaleString('zh-CN',{hour12:false})+'</small>'+
    scratchRemarkHTML(item)+
    '<div class="row"><button class="compact-action" data-scratch="insert" data-id="'+item.id+'">插入报告</button>'+
    '<a class="tiny" href="'+escape(item.page||'#summary')+'">回到来源</a>'+
    '<button class="compact-action" data-scratch="up" data-id="'+item.id+'" aria-label="向前移动">↑</button>'+
    '<button class="compact-action" data-scratch="remove" data-id="'+item.id+'">移除</button></div></article>';
}
function renderMaterialLibrary(){
  scratchIsOpen=false;scratchSidebarFromReport=false;
  const drawer=document.getElementById('scratch-drawer');if(drawer)drawer.hidden=true;
  const all=scratchRead(),query=scratchSearch.toLowerCase(),items=all.filter(item=>(item.title+' '+item.remark+' '+scratchInfo(item)).toLowerCase().includes(query));
  main.innerHTML='<a class="back tiny" href="#reports">← 返回报告工作台</a><div class="row spread">'+head('素材库','已收藏 '+all.length+' 份素材与笔记')+'<div class="row"><button type="button" class="compact-action" data-scratch="note">写笔记</button><button type="button" class="compact-action" data-scratch="backup">导出备份</button>'+(scratchRemoved?'<button type="button" class="compact-action" data-scratch="undo">撤销移除</button>':'')+'</div></div>'+
    '<section class="panel pad personal-material-library"><label class="scratch-search">搜索素材<input type="search" id="scratch-search" placeholder="搜索活动、素材或笔记" value="'+escape(scratchSearch)+'"></label><div class="personal-material-groups">'+
    (items.length?scratchGroupedHTML(items):'<div class="material-library-empty"><h2>'+(all.length?'暂无匹配素材':'素材库还没有内容')+'</h2><p class="sub">'+(all.length?'试试其他关键词。':'在图表或指标旁点击书签图标，即可收藏到这里。')+'</p>'+(!all.length?'<a class="compact-action button" href="#summary">去看板收集素材</a>':'')+'</div>')+'</div></section>';
  void prepareScratchThumbnails();
}

function openScratch(){
  if(location.hash.startsWith('#reports/materials')){renderMaterialLibrary();return}
  loadScratchView();scratchIsOpen=true;
  scratchSidebarFromReport=location.hash==='#reports'&&scratchView.mode!=='float';
  let panel=document.getElementById('scratch-drawer');
  if(!panel){
    panel=document.createElement('aside');panel.id='scratch-drawer';panel.setAttribute('aria-label','素材库');
    document.body.append(panel);
  }
  const docked=location.hash==='#reports'&&scratchView.mode!=='float';
  panel.classList.toggle('scratch-docked',docked);
  panel.classList.toggle('scratch-floating',scratchView.mode==='float');
  panel.classList.toggle('scratch-pinned',!!scratchView.pinned);
  panel.style.left='';panel.style.top='';
  const slot=document.querySelector('.workspace-grid>aside:not(#scratch-drawer)');
  if(slot)slot.hidden=true;
  const grid=document.querySelector('.workspace-grid');
  if(docked&&grid)grid.prepend(panel);else document.body.append(panel);
  panel.hidden=false;
  const items=scratchRead().filter(item=>(item.title+' '+item.remark+' '+scratchInfo(item)).toLowerCase().includes(scratchSearch.toLowerCase()));
  panel.innerHTML='<div class="scratch-window-head"><h2>素材库</h2><div class="scratch-window-actions">'+
    '<button type="button" class="scratch-window-tool" data-scratch="mode" data-scratch-tip="'+(scratchView.mode==='float'?'切回左侧边栏':'切换为悬浮窗口')+'" title="'+(scratchView.mode==='float'?'切回左侧边栏':'切换悬浮窗口')+'" aria-label="'+(scratchView.mode==='float'?'切回左侧边栏':'切换悬浮窗口')+'">'+(scratchView.mode==='float'?'◧':'▣')+'</button>'+
    (scratchView.mode==='float'?'<button type="button" class="scratch-window-tool" data-scratch="pin" aria-pressed="'+!!scratchView.pinned+'" title="'+(scratchView.pinned?'解除固定，允许拖动':'固定当前位置')+'">'+(scratchView.pinned?'解除固定':'固定')+'</button>':'')+
    '<button type="button" class="scratch-window-tool" data-scratch="close" title="关闭" aria-label="关闭">×</button></div></div>'+
    '<p class="sub">点击看板上的书签图标收藏，写报告时随时调用。</p>'+
    '<div class="row"><button class="compact-action" data-scratch="note">＋ 写笔记</button><button class="compact-action" data-scratch="backup">导出备份</button>'+
    (scratchRemoved?'<button class="compact-action" data-scratch="undo">撤销移除</button>':'')+'</div>'+
    '<label class="scratch-search">搜索素材<input type="search" id="scratch-search" value="'+escape(scratchSearch)+'"></label>'+
    '<div>'+scratchGroupedHTML(items)+(items.length?'':'<p class="sub">暂无匹配素材。</p>')+'</div>';
  if(scratchView.mode==='float')positionScratchFloat(panel);
  updateScratchCount();
  void prepareScratchThumbnails();
}
function scratchResult(item){
  if(item.kind==='text'||item.kind==='note')return {title:item.title,detail:scratchInfo(item),source:item.source,summary:item.text||item.remark||item.title,note:item.remark||'',materialId:item.id,textOnly:true,points:[],labels:[],unit:''};
  if(item.kind==='analysis')return {...structuredClone(item.result),materialId:item.id,materialRemark:item.remark};
  return {title:item.title,detail:scratchInfo(item),source:item.source,
    points:[],labels:[],unit:'',summary:item.kind==='note'?(item.remark||item.title):item.text,
    note:item.remark||'',materialId:item.id,snapshotHTML:item.html||''};
}
function placeScratchText(item,range){
  const draft=workspaceDraft();
  if(!draft.evidence.some(r=>r.materialId===item.id))draft.evidence.push(scratchResult(item));
  const content=[item.activityIds?.length?scratchGroupTitle(item):'',item.text||item.remark||item.title,item.kind==='text'?item.remark:''].filter(Boolean).join('\n');
  insertReportTextAtRange(content,range);
}
function insertScratch(item){
  const draft=workspaceDraft();
  if(draft.evidence.some(r=>r.materialId===item.id)){
    showWorkbookNotice('报告已引用此素材');return;
  }
  if(location.hash==='#reports')rememberReportChange();
  if(item.kind==='text'||item.kind==='note'){placeScratchText(item,reportSelection);saveWorkspace();if(location.hash==='#reports')renderWorkspace();else location.hash='#reports';showWorkbookNotice('文字已加入报告');return}
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
function renderProfile(){if(location.hash.startsWith('#reports/materials'))renderMaterialLibrary();else renderPersonalProfile()}
function markCollectionHoverOwners(){
  document.querySelectorAll('main .visual-action-wrap').forEach(wrap=>{
    const button=wrap.querySelector(':scope > .visual-action-bar > .scratch-collect');if(!button)return;
    const owner=wrap.closest('section.panel,article.panel,.goal-focus-panel')||wrap;
    owner.classList.add('collection-hover-owner');
  });
}
function collectButtons(){
  document.querySelectorAll('main .chart,main .performance-bars,main .channel-donut-svg,main .goal-ring-refined,main .reach-channel,main .overview-weekday-card,main .overview-calendar-card,main .metric').forEach(target=>{
    if(target.closest('.workspace-paper,.scratch-item')||target.dataset.scratchBound||target.matches('.metric')&&target.closest('.reach-channel'))return;
    const button=document.createElement('button');
    button.className='scratch-collect no-print';button.type='button';button.innerHTML='<svg class="scratch-collect-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M7 10h4M7 14h6M7 18h4"/><path d="M15 3h6v8l-3-2-3 2z"/></svg>';
    button.title='加入素材库';button.setAttribute('aria-label','加入素材库');
    target.dataset.scratchBound='true';
    target.classList.add('scratch-collectable');
    button.addEventListener('click',()=>{
      scratchSnapshot(target,scratchTargetTitle(target));
    });
    if(target.matches('.overview-weekday-card,.overview-calendar-card')){
      const heading=target.querySelector('h2');if(heading){heading.classList.add('overview-collection-heading');heading.append(button)}
    }else if(target.matches('.reach-channel')){
      const heading=target.querySelector('h3');if(heading){heading.classList.add('reach-channel-heading-actions');heading.append(button)}
    }else if(target.matches('.metric')){
      const heading=target.querySelector('.muted');
      if(heading){heading.classList.add('metric-heading-actions');heading.append(button)}
    }else visualActionBar(target).append(button);
  });
  refreshCollectedStates();markCollectionHoverOwners();
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

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-scratch-edit-remark]');if(!button)return;
  const field=button.parentElement.querySelector('[data-scratch-remark]');
  button.hidden=true;button.setAttribute('aria-expanded','true');field.hidden=false;field.focus();
});
document.addEventListener('focusout',event=>{
  const field=event.target;if(!field.matches('[data-scratch-remark]')||field.value.trim())return;
  field.hidden=true;const button=field.parentElement.querySelector('[data-scratch-edit-remark]');
  if(button){button.hidden=false;button.setAttribute('aria-expanded','false')}
});
