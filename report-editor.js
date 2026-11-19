'use strict';

function cleanReportHTML(html){
  const doc=document.createElement('div');doc.innerHTML=html;
  const allowed=new Set(['P','DIV','BR','H1','H2','H3','STRONG','B','EM','I','U','UL','OL','LI','BLOCKQUOTE']);
  for(const row of doc.querySelectorAll('[data-report-row]'))row.replaceChildren();
  for(const element of [...doc.querySelectorAll('*')].reverse()){
    if(['SCRIPT','STYLE','IFRAME','OBJECT'].includes(element.tagName)){element.remove();continue}
    if(!allowed.has(element.tagName)){element.replaceWith(...element.childNodes);continue}
    for(const attribute of [...element.attributes])if(!(element.tagName==='DIV'&&attribute.name==='data-report-row'))element.removeAttribute(attribute.name);
  }
  return doc.innerHTML;
}
function reportBodyHTML(draft){
  return draft.bodyHTML?cleanReportHTML(draft.bodyHTML):
    (draft.text||'').split(/\n\n/).map(part=>'<p>'+escape(part).replace(/\n/g,'<br>')+'</p>').join('');
}
function reportEditorHTML(draft){
  const buttons=[
    ['bold','B','加粗'],['italic','I','斜体'],['underline','U','下划线'],
    ['insertUnorderedList','•','项目列表'],['insertOrderedList','1.','编号列表'],
    ['undo','↶','撤销'],['redo','↷','重做']
  ];
  return '<div class="report-editor-tools no-print" role="toolbar" aria-label="正文排版">'+
    '<select id="report-block-type" aria-label="标题层级"><option value="p">正文</option><option value="h1">标题 1</option>'+
    '<option value="h2">标题 2</option><option value="h3">标题 3</option><option value="blockquote">引用</option></select>'+
    buttons.map(([command,label,title])=>'<button type="button" class="editor-tool" data-editor-command="'+command+'" title="'+title+
      '" aria-label="'+title+'">'+label+'</button>').join('')+'</div>'+
    '<div id="report-body-editor" class="report-rich-content" contenteditable="true" role="textbox" aria-label="报告正文" aria-multiline="true" data-placeholder="写下活动表现、发现与下一步行动">'+
    reportDocumentHTML(draft,false)+'</div>';
}
const reportHistory=new WeakMap();
function rememberReportChange(){
  const draft=workspaceDraft();
  let history=reportHistory.get(draft);
  if(!history){history={undo:[],redo:[]};reportHistory.set(draft,history)}
  const snapshot=JSON.stringify(draft);
  if(history.undo.at(-1)!==snapshot)history.undo.push(snapshot);
  if(history.undo.length>25)history.undo.shift();
  history.redo=[];
}
function restoreReportChange(command){
  const draft=workspaceDraft(),history=reportHistory.get(draft);
  if(!history)return;
  const source=history[command],target=history[command==='undo'?'redo':'undo'];
  if(!source.length)return;
  target.push(JSON.stringify(draft));
  const previous=JSON.parse(source.pop());
  for(const key of Object.keys(draft))delete draft[key];
  Object.assign(draft,previous);reportSelection=undefined;
  saveWorkspace();renderWorkspace();
}
let reportSelection;
document.addEventListener('selectionchange',()=>{
  const selection=window.getSelection(),editor=document.querySelector('#report-body-editor');
  if(editor&&selection.rangeCount&&editor.contains(selection.anchorNode)&&editor.contains(selection.focusNode))
    reportSelection=selection.getRangeAt(0).cloneRange();
});
function saveRichReport(){
  const editor=document.querySelector('#report-body-editor');if(!editor)return;
  const draft=workspaceDraft();draft.bodyHTML=cleanReportHTML(editor.innerHTML);draft.text=reportPlainText(draft.bodyHTML);
  const printed=document.querySelector('#print-text');if(printed)printed.innerHTML=reportDocumentHTML(draft,true);
  const status=document.querySelector('#workspace-status');if(status)status.textContent=saveWorkspace();
}
function applyReportCommand(command,value){
  if(command==='undo'||command==='redo'){restoreReportChange(command);return}
  rememberReportChange();
  const editor=document.querySelector('#report-body-editor');if(!editor)return;
  if(reportSelection?.startContainer.parentElement?.closest('[data-report-row]'))return;
  editor.focus();
  if(reportSelection&&editor.contains(reportSelection.startContainer)){
    const selection=window.getSelection();selection.removeAllRanges();selection.addRange(reportSelection);
  }
  document.execCommand(command,false,value);
  saveRichReport();
}
document.addEventListener('pointerdown',event=>{
  if(event.target.closest('[data-editor-command]'))event.preventDefault();
});
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-editor-command]');
  if(button)applyReportCommand(button.dataset.editorCommand);
});
document.addEventListener('change',event=>{
  if(event.target.id==='report-block-type')applyReportCommand('formatBlock',event.target.value);
});
document.addEventListener('input',event=>{
  if(event.target.closest('#report-body-editor')&&!event.target.closest('[data-report-row]'))saveRichReport();
});
document.addEventListener('paste',event=>{
  if(!event.target.closest('#report-body-editor'))return;
  event.preventDefault();document.execCommand('insertText',false,event.clipboardData.getData('text/plain'));
});

document.addEventListener('beforeinput',event=>{
  if(!event.target.closest('#report-body-editor,.image-caption-input'))return;
  if(event.inputType==='historyUndo'||event.inputType==='historyRedo'){
    event.preventDefault();restoreReportChange(event.inputType==='historyUndo'?'undo':'redo');
  }else rememberReportChange();
});

function reportPlainText(html){
  const host=document.createElement('div');host.innerHTML=html;
  host.querySelectorAll('[data-report-row]').forEach(row=>row.remove());
  return [...host.childNodes].map(node=>node.textContent||'').join('\n\n');
}
function reportDocumentHTML(draft,preview){
  const host=document.createElement('div');host.innerHTML=reportBodyHTML(draft);
  const grid=document.createElement('div');grid.innerHTML=reportImageGrid(draft,preview);
  const available=[...grid.querySelectorAll('.report-auto-row')];
  const ids=new Set(available.map(row=>row.dataset.reportRow));
  const seen=new Set();
  for(const slot of [...host.querySelectorAll('[data-report-row]')]){
    const id=slot.dataset.reportRow;
    if(!ids.has(id)||seen.has(id)){slot.remove();continue}
    seen.add(id);slot.replaceWith(available.find(row=>row.dataset.reportRow===id));
  }
  for(const row of available)if(!seen.has(row.dataset.reportRow))host.append(row);
  if(!host.firstChild)host.innerHTML='<p><br></p>';
  for(const row of [...host.querySelectorAll('[data-report-row]')]){
    if(!row.previousSibling||row.previousSibling.matches?.('[data-report-row]'))row.before(emptyReportParagraph());
    if(!row.nextSibling||row.nextSibling.matches?.('[data-report-row]'))row.after(emptyReportParagraph());
  }
  draft.bodyHTML=cleanReportHTML(host.innerHTML);
  return host.innerHTML;
}
function emptyReportParagraph(){const p=document.createElement('p');p.innerHTML='<br>';return p}
function insertReportRowsAtRange(rows,range){
  const editor=document.querySelector('#report-body-editor');if(!editor||!rows.length)return;
  for(const slot of [...editor.querySelectorAll('[data-report-row]')])if(rows.includes(slot.dataset.reportRow))slot.remove();
  const fragment=document.createDocumentFragment();
  for(const id of rows){const slot=document.createElement('div');slot.dataset.reportRow=id;fragment.append(slot)}
  if(range&&editor.contains(range.startContainer)&&!range.startContainer.parentElement?.closest('[data-report-row]')){
    range.collapse(true);
    let block=range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement;
    while(block.parentElement&&block.parentElement!==editor)block=block.parentElement;
    if(block!==editor&&block.parentElement===editor){
      const tail=range.cloneRange();tail.setEndAfter(block);
      const after=tail.extractContents();fragment.append(after);block.after(fragment);
    }else range.insertNode(fragment);
  }else editor.append(fragment);
  const draft=workspaceDraft();draft.bodyHTML=cleanReportHTML(editor.innerHTML);draft.text=reportPlainText(draft.bodyHTML);
}
function reportRangeAtPoint(x,y){
  if(document.caretRangeFromPoint)return document.caretRangeFromPoint(x,y);
  const position=document.caretPositionFromPoint?.(x,y);if(!position)return;
  const range=document.createRange();range.setStart(position.offsetNode,position.offset);return range;
}

function insertReportTextAtRange(text,range){
  const editor=document.querySelector('#report-body-editor'),draft=workspaceDraft();
  if(!editor){draft.bodyHTML=reportBodyHTML(draft)+reportBodyHTML({text});draft.text=reportPlainText(draft.bodyHTML);return}
  const fragment=document.createDocumentFragment();
  for(const line of text.split('\n')){const p=document.createElement('p');p.textContent=line;fragment.append(p)}
  if(range&&editor.contains(range.startContainer)&&!range.startContainer.parentElement?.closest('[data-report-row]')){
    range.collapse(true);let block=range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement;
    while(block.parentElement&&block.parentElement!==editor)block=block.parentElement;
    if(block!==editor&&block.parentElement===editor){const tail=range.cloneRange();tail.setEndAfter(block);fragment.append(tail.extractContents());block.after(fragment)}else range.insertNode(fragment);
  }else editor.append(fragment);
  saveRichReport();
}
