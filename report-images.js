'use strict';

function reportBlocks(draft){
  const blocks=[];
  draft.evidence.forEach((r,i)=>{
    if(r.textOnly)return;
    r.figureId ||= crypto.randomUUID();
    const images=r.reportImages?.length?r.reportImages:[null];
    images.forEach((src,j)=>blocks.push({key:r.figureId+':'+j,r,i,j,src}));
  });
  const keys=new Set(blocks.map(b=>b.key));
  draft.imageLayout=(draft.imageLayout||[]).filter(entry=>keys.has(entry.key));
  for(const b of blocks)if(!draft.imageLayout.some(entry=>entry.key===b.key))
    draft.imageLayout.push({key:b.key,row:crypto.randomUUID()});
  return draft.imageLayout.filter(entry=>!(draft.hiddenReportImages||[]).includes(entry.key)).map(entry=>({...blocks.find(b=>b.key===entry.key),row:entry.row,width:entry.width}));
}
function reportImageGrid(draft,preview){
  const blocks=reportBlocks(draft),rows=new Map();
  for(const block of blocks){if(!rows.has(block.row))rows.set(block.row,[]);rows.get(block.row).push(block)}
  return '<div class="report-image-droparea" data-report-dropzone>'+
    (blocks.length?'':'<p class="report-drop-empty no-print">把草稿纸里的图表拖到这里</p>')+
    [...rows.values()].map(group=>'<div contenteditable="false" data-report-row="'+group[0].row+'" class="report-auto-row" style="--image-gap-share:'+14*(group.length-1)/group.length+'px">'+group.map(({r,i,j,key,src,width})=>{
      const note=r.imageRemarks?.[j]??(j===0?(r.imageRemark??r.materialRemark??r.note??''):'');
      return '<figure class="report-image-block" data-report-key="'+key+'" data-report-image-index="'+i+'" data-image-number="'+j+'" style="--image-width:'+(width||100/group.length)+'%"'+
        (preview?'':' draggable="true"')+'>'+
        (preview?'':'<button class="report-image-delete no-print" data-remove-report-image="'+key+'" type="button" aria-label="移除图片" title="移除图片"><span aria-hidden="true"></span></button>'+
        ['left','right'].map(edge=>'<button class="report-image-resize no-print" data-resize-edge="'+edge+'" type="button" aria-label="拖动调整图片宽度" title="拖动调整图片宽度"><span>↔</span></button>').join(''))+
        '<figcaption>'+escape(r.title)+(j?' · '+(j+1):'')+'</figcaption>'+
        (src?'<img draggable="false" src="'+src+'" alt="'+escape(r.title)+'">':'<p class="sub">正在生成图片…</p>')+
        (preview?'<p class="preserve image-remark-text" data-language-original>'+escape(note)+'</p>':
        '<div class="no-print image-caption-edit"><button type="button" class="image-caption-toggle" data-caption-edit>'+
        escape(note||'图片备注')+'</button><input type="text" class="image-caption-input" hidden data-image-remark="'+i+'" data-image-number="'+j+
        '" aria-label="图片备注" placeholder="输入备注，按 Enter 完成" value="'+escape(note)+'"></div>'+
        '<p class="print-value preserve" data-language-original>'+escape(note)+'</p>')+'</figure>';
    }).join('')+'</div>').join('')+'</div>';
}

async function makeEvidenceImages(result){
  const host=document.createElement('div');
  host.innerHTML=evidenceHTML(result);
  const targets=[...host.querySelectorAll('.chart,.performance-bars,.channel-donut-svg,.goal-ring-refined,.comparison-matrix')];
  if(!targets.length)targets.push(host);
  const images=[];
  for(const target of targets){
    let canvas;
    if(target.querySelector('svg')||target.querySelector('.performance-bar')){
      canvas=await chartCanvas(target);
    }else{
      canvas=document.createElement('canvas');
      const lines=(target.innerText||target.textContent||'').trim().split(/\n/).filter(Boolean);
      const chunks=lines.flatMap(line=>line.match(/.{1,42}/g)||[]);
      canvas.width=900;canvas.height=Math.max(120,chunks.length*28+40);
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#fffefd';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#473330';ctx.font='18px system-ui';
      chunks.forEach((line,i)=>ctx.fillText(line,24,30+i*28));
    }
    // Store a compact image while retaining a readable full-width preview.
    const compact=document.createElement('canvas');
    compact.width=900;compact.height=Math.round(canvas.height*900/canvas.width);
    compact.getContext('2d').drawImage(canvas,0,0,compact.width,compact.height);
    images.push(compact.toDataURL('image/png'));
  }
  return images;
}

let reportImagePreparing=false;
async function prepareReportImages(draft){
  if(reportImagePreparing)return;
  const pending=draft.evidence.filter(result=>!result.textOnly&&!result.reportImages?.length);
  if(!pending.length)return;
  reportImagePreparing=true;
  try{
    for(const result of pending)result.reportImages=await makeEvidenceImages(result);
    saveWorkspace();
    if(location.hash==='#reports'&&workspaceDraft()===draft)renderWorkspace();
  }catch{
    showWorkbookNotice('图片生成失败，请重新打开报告重试。',true);
  }finally{reportImagePreparing=false}
}
document.addEventListener('input',event=>{
  if(event.target.dataset.imageRemark===undefined)return;
  const result=workspaceDraft().evidence[Number(event.target.dataset.imageRemark)];
  if(!result)return;
  result.imageRemarks ||= [];
  result.imageRemarks[Number(event.target.dataset.imageNumber||0)]=event.target.value;
  event.target.closest('figure').querySelector('.print-value').textContent=event.target.value;
  document.querySelector('#workspace-status').textContent=saveWorkspace();
});

let reportDrag;
function clearReportDropHints(){
  document.querySelectorAll('.drop-beside,.drop-before,.drop-after,.report-drop-active,.report-text-drop').forEach(node=>
    node.classList.remove('drop-beside','drop-before','drop-after','report-drop-active','report-text-drop'));
}
document.addEventListener('dragstart',event=>{
  if(event.target.closest('input,textarea,button'))return;
  const figure=event.target.closest('[data-report-key]');
  const material=event.target.closest('.scratch-item');
  if(figure)reportDrag={key:figure.dataset.reportKey};
  else if(material)reportDrag={materialId:material.dataset.id};
  else return;
  event.dataTransfer.setData('application/x-pacific-material',JSON.stringify(reportDrag));
  event.dataTransfer.setData('text/plain',material?.querySelector('.scratch-title')?.value||figure?.querySelector('figcaption')?.textContent||'报告图表');
  const preview=material?.querySelector('.scratch-thumbnail img')||figure?.querySelector('img');
  if(preview)event.dataTransfer.setDragImage(preview,Math.min(preview.width/2,80),Math.min(preview.height/2,40));
  event.dataTransfer.effectAllowed=figure?'move':'copy';
});
document.addEventListener('dragover',event=>{
  if(!reportDrag)return;
  const zone=event.target.closest('[data-report-dropzone],.workspace-paper');
  if(!zone)return;
  event.preventDefault();
  event.dataTransfer.dropEffect=reportDrag.materialId?'copy':'move';
  clearReportDropHints();
  const target=event.target.closest('[data-report-key]');
  if(!target){
    const paragraph=event.target.closest('#report-body-editor>p,#report-body-editor>h1,#report-body-editor>h2,#report-body-editor>h3');
    if(paragraph)paragraph.classList.add('report-text-drop');else zone.classList.add('report-drop-active');return
  }
  const rect=target.getBoundingClientRect();
  const fraction=(event.clientX-rect.left)/rect.width;
  const edge=fraction<.27||fraction>.73;
  target.classList.add(edge?'drop-beside':event.clientY<rect.top+rect.height/2?'drop-before':'drop-after');
},true);
document.addEventListener('drop',event=>{
  const zone=event.target.closest('[data-report-dropzone],.workspace-paper');
  if(!zone||!reportDrag)return;
  event.preventDefault();event.stopPropagation();
  saveRichReport();
  const draft=workspaceDraft();
  const dropRange=reportRangeAtPoint(event.clientX,event.clientY);
  const target=event.target.closest('[data-report-key]');
  const targetKey=target?.dataset.reportKey;
  const beside=target?.classList.contains('drop-beside');
  const before=target?.classList.contains('drop-before');
  rememberReportChange();
  let movingKeys=[];
  if(reportDrag.materialId){
    const item=scratchRead().find(item=>item.id===reportDrag.materialId);
    if(!item){clearReportDropHints();return}
    if(item.kind==='text'||item.kind==='note'){placeScratchText(item,dropRange);saveWorkspace();clearReportDropHints();reportDrag=undefined;renderWorkspace();return}
    let result=draft.evidence.find(r=>r.materialId===item.id);
    if(!result){result=scratchResult(item);draft.evidence.push(result)}
    reportBlocks(draft);
    movingKeys=draft.imageLayout.filter(entry=>entry.key.startsWith(result.figureId+':')).map(entry=>entry.key);
    draft.hiddenReportImages=(draft.hiddenReportImages||[]).filter(key=>!movingKeys.includes(key));
  }else movingKeys=[reportDrag.key];
  if(movingKeys.includes(targetKey)){clearReportDropHints();return}
  const moving=draft.imageLayout.filter(entry=>movingKeys.includes(entry.key));
  const remaining=draft.imageLayout.filter(entry=>!movingKeys.includes(entry.key));
  const anchor=remaining.find(entry=>entry.key===targetKey);
  const destination=beside&&anchor?anchor.row:crypto.randomUUID();
  moving.forEach(entry=>{entry.row=destination;delete entry.width});
  if(beside&&anchor)remaining.filter(entry=>entry.row===anchor.row).forEach(entry=>delete entry.width);
  let index=anchor?remaining.indexOf(anchor)+(before?0:1):remaining.length;
  if(beside&&anchor){
    const siblings=remaining.filter(entry=>entry.row===anchor.row);
    index=remaining.indexOf(siblings.at(-1))+1;
  }
  remaining.splice(index,0,...moving);
  draft.imageLayout=remaining;
  if(!target)insertReportRowsAtRange([destination],dropRange);
  else if(!beside){
    const slot=document.createElement('div');slot.dataset.reportRow=destination;
    const anchorRow=target.closest('[data-report-row]');
    if(before)anchorRow.before(slot);else anchorRow.after(slot);
    saveRichReport();
  }
  saveWorkspace();clearReportDropHints();reportDrag=undefined;renderWorkspace();
},true);
document.addEventListener('dragend',()=>{reportDrag=undefined;clearReportDropHints()});

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-caption-edit]');
  if(!button)return;
  const field=button.parentElement.querySelector('input');
  button.hidden=true;field.hidden=false;field.focus();
  field.setSelectionRange(field.value.length,field.value.length);
});
function closeImageCaption(field){
  const button=field.parentElement.querySelector('[data-caption-edit]');
  button.textContent=field.value.trim()||'图片备注';
  button.hidden=false;field.hidden=true;
}
document.addEventListener('focusout',event=>{
  if(event.target.matches('.image-caption-input'))closeImageCaption(event.target);
});
document.addEventListener('keydown',event=>{
  if(event.target.matches('.image-caption-input')&&event.key==='Enter'){
    event.preventDefault();event.target.blur();
  }
});


document.addEventListener('click',event=>{
  const button=event.target.closest('[data-remove-report-image]');
  if(!button)return;
  const draft=workspaceDraft(),key=button.dataset.removeReportImage;
  rememberReportChange();
  draft.hiddenReportImages ||= [];
  if(!draft.hiddenReportImages.includes(key))draft.hiddenReportImages.push(key);

  saveWorkspace();renderWorkspace();
});
let reportResize;
document.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('.report-image-resize');if(!handle)return;
  event.preventDefault();event.stopPropagation();
  const figure=handle.closest('[data-report-key]'),row=figure.parentElement;
  const width=row.getBoundingClientRect().width;
  const draft=workspaceDraft();
  rememberReportChange();
  const rowEntries=[...row.querySelectorAll('[data-report-key]')];
  rowEntries.forEach(node=>{
    const entry=draft.imageLayout.find(x=>x.key===node.dataset.reportKey);
    entry.width=parseFloat(node.style.getPropertyValue('--image-width'))||100/rowEntries.length;
  });
  reportResize={handle,figure,draft,width,startX:event.clientX,direction:handle.dataset.resizeEdge==='left'?-1:1,startWidth:parseFloat(figure.style.getPropertyValue('--image-width')),key:figure.dataset.reportKey};
  row.classList.add('report-resizing');figure.draggable=false;handle.setPointerCapture(event.pointerId);
});
document.addEventListener('pointermove',event=>{
  if(!reportResize)return;
  const state=reportResize;
  const next=Math.max(25,Math.min(100,state.startWidth+state.direction*(event.clientX-state.startX)/state.width*100));
  state.figure.style.setProperty('--image-width',next+'%');
});
function finishReportResize(){
  if(!reportResize)return;
  const {draft,figure,key}=reportResize;
  const entry=draft.imageLayout.find(x=>x.key===key);
  entry.width=parseFloat(figure.style.getPropertyValue('--image-width'));
  const siblings=draft.imageLayout.filter(x=>x.row===entry.row&&!(draft.hiddenReportImages||[]).includes(x.key));
  let used=0,row=entry.row;
  for(const sibling of siblings){
    const width=sibling.width||100/siblings.length;
    if(used+width>100.1){row=crypto.randomUUID();used=0}
    if(row!==sibling.row&&!document.querySelector('[data-report-row="'+row+'"]')){
      const slot=document.createElement('div');slot.dataset.reportRow=row;figure.parentElement.after(slot);
    }
    sibling.row=row;used+=width;
  }
  saveRichReport();reportResize=undefined;saveWorkspace();renderWorkspace();
}
document.addEventListener('pointerup',finishReportResize);
document.addEventListener('pointercancel',finishReportResize);
