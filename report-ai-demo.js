'use strict';
(()=>{
 let context=null,pendingContext=null,card=null,proposal=null,generation=0,currentTurnId=null,currentCommand='';
 const terms={
  '目标人群':'目标人群是本次活动计划触达的用户群体，通常按会员特征、消费习惯或场景划分；它不等于实际触达或消费人数。',
  'ROI':'ROI 是投资回报率，用收益相对投入衡量回报。这里的校准 ROI＝（校准净增量毛利－活动总投入）÷活动总投入；不是总营收÷投入。',
  'CPM':'CPM 表示每千次曝光成本。广告 CPM＝付费媒体花费÷曝光量×1,000；它衡量曝光成本，不代表获客成本或利润。',
  'DID':'DID（双重差分）比较处理组活动前后的变化，再减去对照组同期变化。分组可比、前期趋势及同期干扰会影响解释，计算出差异不等于自动证明因果。',
  'Holdout':'Holdout 是投放前随机留出的不触达人群，用于和处理组比较结果。本平台会员方案按结构分层留出约5%，未购买会员也计入人均指标。',
  '送达率':'送达率＝已送达消息记录÷发送消息记录。当前已送达包含打开和点击状态；按消息条数统计，不能当作去重触达人数。',
  '客单价':'客单价＝总营收÷总单量，表示每笔订单的平均消费金额。它上升时仍需结合订单量判断整体表现。',
  '置信区间':'95%置信区间用于表达估计的不确定性。增量区间包含零时，当前数据不能排除无差异；区间较宽通常意味着估计精度不足。',
  '新客占比':'新客占比是符合新客定义的消费人数占全部可识别消费人数的比例。应先明确新客定义、统计窗口及匿名订单的处理。'
 };
 const lang=s=>localize(s);
 function historyKey(){return 'pacific-ai-report-history-'+(typeof scratchUser==='function'?scratchUser():'manager')}
 function readHistory(){try{return JSON.parse(sessionStorage.getItem(historyKey()))||[]}catch{return []}}
 function writeHistory(items){try{sessionStorage.setItem(historyKey(),JSON.stringify(items.slice(-10)))}catch{}}
 function renderHistory(){
  if(!card)return;
  card.querySelector('.ai-demo-history')?.remove();
  const items=readHistory().filter(t=>t.id!==currentTurnId);if(!items.length)return;
  const html='<div class="ai-demo-history"><span class="tiny muted">最近对话（最多10轮）</span>'+items.map(t=>'<details class="ai-history-turn"><summary data-language-original>'+escape(t.command)+'<small>'+new Date(t.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})+(t.applied?' · 已应用':'')+'</small></summary><div class="ai-history-response" data-language-original>'+cleanReportHTML(t.html)+'</div></details>').join('')+'</div>';
  card.querySelector('.ai-demo-context').insertAdjacentHTML('afterend',html);
 }
 function archiveResponse(output){
  const copy=output.cloneNode(true);copy.querySelectorAll('button').forEach(n=>n.remove());
  const items=readHistory().filter(t=>t.id!==currentTurnId);
  items.push({id:currentTurnId,command:currentCommand,html:copy.innerHTML,at:new Date().toISOString(),applied:false});writeHistory(items);
 }
 function markApplied(button,label){
  button.disabled=true;button.textContent=label;
  const items=readHistory(),turn=items.find(t=>t.id===currentTurnId);if(turn){turn.applied=true;writeHistory(items)}
  document.querySelector('[data-work="toggle-ai"]')?.setAttribute('aria-expanded','true');
 }
 function close(){generation++;document.body.classList.remove('ai-explanation-open');document.querySelector('[data-work="toggle-ai"]')?.setAttribute('aria-expanded','false');card?.remove();card=null;proposal=null;document.querySelectorAll('.report-ai-selected').forEach(n=>n.classList.remove('report-ai-selected'))}
 function ensureCard(){
  if(card)return card;card=document.createElement('aside');card.className='report-ai-context-card no-print';card.id='report-ai-context';card.setAttribute('aria-label',lang('AI报告助手'));card.setAttribute('role','region');document.body.append(card);
  card.addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault()});return card;
 }
 function show(ctx){
  generation++;context=ctx;proposal=null;currentTurnId=null;const el=ensureCard();el.classList.remove('is-explanation-sidebar');document.body.classList.remove('ai-explanation-open');document.querySelector('[data-work="toggle-ai"]')?.setAttribute('aria-expanded','true');
  el.innerHTML='<div class="ai-demo-head"><strong>✧ '+lang('AI报告助手')+'</strong><button type="button" data-ai-demo="close" aria-label="关闭">×</button></div><div class="ai-demo-context"><span class="ai-context-quote" aria-hidden="true">‘</span><span data-language-original>'+escape(ctx.image?(ctx.result?.title||lang('报告图片')):ctx.text?ctx.text.slice(0,180):lang('当前报告'))+'</span></div><div class="ai-demo-actions"><button type="button" data-ai-demo="explain" '+(!ctx.text&&!ctx.image?'disabled':'')+'>'+lang('为我解释')+'</button><button type="button" data-ai-demo="format">'+lang('帮我排版')+'</button><button type="button" data-ai-demo="organize">'+lang('为我整理报告')+'</button></div><div class="ai-demo-output" aria-live="polite"></div>';
  if(readHistory().length){el.querySelector('.ai-demo-actions').insertAdjacentHTML('afterend','<button type="button" class="ai-history-open" data-ai-demo="history">查看最近对话</button>');renderHistory()}
  const rect=document.querySelector('[data-work="toggle-ai"]')?.getBoundingClientRect()||{left:innerWidth-380,right:innerWidth-20,top:100,bottom:130};
  el.style.left=Math.max(12,Math.min(rect.right-el.offsetWidth,innerWidth-el.offsetWidth-12))+'px';el.style.top=Math.max(12,rect.bottom+el.offsetHeight+9<innerHeight?rect.bottom+9:rect.top-el.offsetHeight-9)+'px';
 }
 function updateChatContext(ctx){
  pendingContext=ctx;
  if(!card?.classList.contains('is-explanation-sidebar'))return;
  const citation=card.querySelector('.ai-demo-context>span:last-child');
  if(citation)citation.textContent=ctx?.image?(ctx.result?.title||lang('报告图片')):ctx?.text?ctx.text.slice(0,180):lang('当前报告');
  const footerQuote=card.querySelector('.ai-composer-context-text');if(footerQuote)footerQuote.textContent=ctx?.image?(ctx.result?.title||lang('报告图片')):ctx?.text?ctx.text.slice(0,120):lang('当前报告');
  const explainButton=card.querySelector('[data-ai-demo="explain"]');if(explainButton&&!card.querySelector('.ai-demo-output')?.dataset.generating)explainButton.disabled=!ctx?.image&&!ctx?.text;
 }
 function dockConversation(){
  card.classList.add('is-explanation-sidebar');document.body.classList.add('ai-explanation-open');
  if(!card.querySelector('.ai-demo-chat-feed')){
   const feed=document.createElement('div');feed.className='ai-demo-chat-feed';
   [...card.children].filter(n=>!n.classList.contains('ai-demo-head')).forEach(n=>feed.append(n));card.append(feed);
   const composer=document.createElement('div');composer.className='ai-demo-composer';
   composer.innerHTML='<div class="ai-demo-composer-quote"><span class="ai-context-quote" aria-hidden="true">‘</span><span class="ai-composer-context-text" data-language-original></span></div>';
   const actions=card.querySelector('.ai-demo-actions');if(actions)composer.append(actions);
   composer.insertAdjacentHTML('beforeend','<label class="ai-demo-input-label" for="ai-followup-input">'+lang('继续对话')+'</label><textarea id="ai-followup-input" rows="2" maxlength="2000" placeholder="'+lang('输入下一条指令，或选中内容后点击上方功能')+'" aria-label="'+lang('输入指令')+'"></textarea><div class="ai-demo-send-row"><small>'+lang('Enter 发送 · Shift+Enter 换行')+'</small><button type="button" class="primary" data-ai-demo="send">'+lang('发送')+'</button></div>');card.append(composer);
  }
  const footerQuote=card.querySelector('.ai-composer-context-text');if(footerQuote)footerQuote.textContent=context?.image?(context.result?.title||lang('报告图片')):context?.text?context.text.slice(0,120):lang('当前报告');
 }
 function setChatBusy(busy){
  if(!card)return;const out=card.querySelector('.ai-demo-output');if(out)out.dataset.generating=busy?'true':'';
  card.querySelectorAll('.ai-demo-actions button,[data-ai-demo="send"]').forEach(n=>n.disabled=busy);
  if(!busy){const ctx=pendingContext||context;const explainButton=card.querySelector('[data-ai-demo="explain"]');if(explainButton)explainButton.disabled=!ctx?.text&&!ctx?.image}
 }
 function captureSelection(){
  if(location.hash!=='#reports')return;
  const editor=document.querySelector('#report-body-editor'),sel=getSelection();
  if(!editor||!sel||sel.isCollapsed||!sel.rangeCount)return;
  const range=sel.getRangeAt(0);if(!editor.contains(range.commonAncestorContainer))return;
  const text=sel.toString().trim();if(!text)return;
  updateChatContext({text:text.slice(0,6000),range:range.cloneRange(),rect:range.getBoundingClientRect()});return pendingContext;
 }
 function imageFacts(r){
  if(!r)return ['这张图片没有可读取的关联数据，演示助手暂不能进行真正的图片识别；请补充图表数据或说明。'];
  const points=(r.points||[]).filter(p=>numeric(p.actual));
  if(points.length){
   const sorted=[...points].sort((a,b)=>a.actual-b.actual),low=sorted[0],high=sorted.at(-1),first=points[0],last=points.at(-1),unit=(r.unit||'').replace(/港元/g,'HKD');
   const name=p=>p.label||p.date;
   const facts=['最高点出现在 '+name(high)+'，数值为 '+fmt(high.actual,2)+' '+unit+'。','最低点出现在 '+name(low)+'，数值为 '+fmt(low.actual,2)+' '+unit+'。','首尾由 '+fmt(first.actual,2)+' 变为 '+fmt(last.actual,2)+' '+unit+'，'+(last.actual>=first.actual?'增加 ':'减少 ')+fmt(Math.abs(last.actual-first.actual),2)+' '+unit+'。'];
   const pairs=points.filter(p=>numeric(p.baseline));if(pairs.length){const avg=key=>pairs.reduce((s,p)=>s+p[key],0)/pairs.length;facts.push('有对照数据的时点中，'+(r.labels?.[0]||'当前组')+'均值为 '+fmt(avg('actual'),2)+'，'+(r.labels?.[1]||'对照组')+'均值为 '+fmt(avg('baseline'),2)+' '+unit+'。')}
   facts.push('观察范围为 '+name(first)+' 至 '+name(last)+'；以上为描述性特点，不能单凭图形判断活动因果效果。');return facts;
  }
  if(r.snapshotHTML){
   const host=document.createElement('div');host.innerHTML=r.snapshotHTML;
   const tips=[...host.querySelectorAll('[data-tip],[data-overview-tip]')].map(n=>n.dataset.tip||n.dataset.overviewTip);
   const parsed=tips.map(text=>{const lines=text.split('\n'),match=lines[1]?.match(/([-−]?[\d,]+(?:\.\d+)?)\s*(HKD|单|指数)/);return match?{date:lines[0],actual:Number(match[1].replace(/,/g,'').replace('−','-')),unit:match[2]}:null}).filter(p=>p&&numeric(p.actual));
   if(parsed.length>=2)return imageFacts({...r,points:parsed,unit:parsed[0].unit});
   let details=[...host.querySelectorAll('[data-metric-help],[data-tip],[aria-label]')].map(n=>n.dataset.metricHelp||n.dataset.tip||n.getAttribute('aria-label')).filter(s=>s&&/\d/.test(s));
   details=[...new Set(details)];
   if(details.length>=3)return details.slice(0,5).map(s=>s.replace(/\n/g,'；'));
   const lines=(r.summary||host.textContent||'').split(/[；\n]/).map(s=>s.trim()).filter(Boolean);
   if(lines.length>=3)return lines.slice(0,5);
  }
  const diagnostics=(r.diagnostics||[]).filter(([,v])=>numeric(v));if(diagnostics.length>=3)return diagnostics.slice(0,5).map(([label,value])=>label+'：'+fmt(value,2)+' '+(r.unit||''));
  return ['已关联素材：'+(r.title||'报告图表')+'。','来源范围：'+(r.detail||r.source||'素材库')+'。','关联数据不足以形成三项数值结论，请补充图表数据；演示助手不会猜测图片中的数值。'];
 }
 function explain(){
  if(context.image)return imageFacts(context.result);
  const text=context.text||'',key=Object.keys(terms).find(k=>text.toLowerCase().includes(k.toLowerCase()));
  if(key)return [terms[key]];
  const figures=text.match(/[-−+]?\d[\d,.]*\s*(?:%|HKD|人|单|家|天)?/g)||[];
  return ['这段内容主要围绕“'+text.slice(0,100)+'”展开。',figures.length?'其中包含 '+figures.slice(0,5).join('、')+' 等数值，解读时应核对对应指标、单位与统计期间。':'这段文字没有足够的指标定义或上下文，无法给出确定的专业释义。','若要形成报告结论，可补充比较对象、主要差异和下一步行动。'];
 }
 function correct(text){return text.replace(/的的/g,'的').replace(/进行进行/g,'进行').replace(/以经/g,'已经').replace(/在次/g,'再次').replace(/帐单/g,'账单')}
 function formatReport(){
  const draft=workspaceDraft(),host=document.createElement('div');host.innerHTML=reportBodyHTML(draft);
  host.querySelectorAll('h1').forEach(n=>{const h=document.createElement('h2');h.textContent=n.textContent;n.replaceWith(h)});
  host.querySelectorAll('p').forEach(n=>{const t=n.textContent.trim();if(/^[一二三四五六七八九十]+[、．.]/.test(t)&&t.length<45){const h=document.createElement('h2');h.textContent=t;n.replaceWith(h)}else if(/^\d+\.\d+\s*\S/.test(t)&&t.length<45){const h=document.createElement('h3');h.textContent=t;n.replaceWith(h)}});
  const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())node.nodeValue=correct(node.nodeValue);
  return {html:cleanReportHTML(host.innerHTML),summary:'已统一字体与行距、整理标题层级，并修正常见重复词和明确错字；复杂语病仍需人工核对。'};
 }
 function organizeReport(){
  const host=document.createElement('div');host.innerHTML=reportBodyHTML(workspaceDraft());
  const slots=[...host.querySelectorAll('[data-report-row]')].map(n=>n.outerHTML);
  const known=new Set([...host.querySelectorAll('[data-report-row]')].map(n=>n.dataset.reportRow));for(const block of reportBlocks(workspaceDraft()))if(!known.has(block.row)){slots.push('<div data-report-row="'+escape(block.row)+'"></div>');known.add(block.row)}
  host.querySelectorAll('[data-report-row]').forEach(n=>n.remove());
  const lines=[...host.querySelectorAll('p,li,blockquote,h1,h2,h3')].filter(n=>!n.querySelector('p,li,blockquote,h1,h2,h3')).map(n=>correct(n.textContent.trim())).filter(Boolean);
  const unique=[...new Set(lines)],actions=unique.filter(t=>/建议|下一步|优化|后续|负责人|计划/.test(t)),findings=unique.filter(t=>!actions.includes(t));
  const list=xs=>'<ul>'+xs.map(t=>'<li>'+escape(t)+'</li>').join('')+'</ul>';
  return {html:'<h2>'+lang('一、主要发现与分析')+'</h2>'+(findings.length?list(findings):'<p>'+lang('尚无文字分析，请补充图表解读与业务发现。')+'</p>')+(slots.length?'<h2>'+lang('二、图表证据')+'</h2>'+slots.join(''):'')+'<h2>'+lang('三、后续行动')+'</h2>'+(actions.length?list(actions):'<p>'+lang('待补充具体行动、负责人和完成时间。')+'</p>'),summary:'已按“主要发现—图表证据—后续行动”归类，去除完全重复的段落；未添加新的业务事实。'};
 }
 document.addEventListener('pointerup',event=>{
  if(event.target.closest('.report-ai-context-card'))return;
  const figure=event.target.closest('#report-body-editor [data-report-image-index]');
  if(figure&&!event.target.closest('button,input')){document.querySelectorAll('.report-ai-selected').forEach(n=>n.classList.remove('report-ai-selected'));figure.classList.add('report-ai-selected');updateChatContext({image:true,imageNumber:Number(figure.dataset.imageNumber)||0,result:workspaceDraft().evidence[Number(figure.dataset.reportImageIndex)],rect:figure.getBoundingClientRect()});return}
  const sel=getSelection();if(sel&&!sel.isCollapsed)captureSelection();else if(!event.target.closest('[data-work="toggle-ai"]')){if(event.target.closest('#report-body-editor'))updateChatContext(null);if(!card?.classList.contains('is-explanation-sidebar'))close();}
 });
 document.addEventListener('keydown',event=>{if(event.target.id==='ai-followup-input'&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();card?.querySelector('[data-ai-demo="send"]')?.click()}});
 document.addEventListener('keyup',event=>{if(event.key==='Escape'){close();return}if(event.shiftKey||event.key.startsWith('Arrow'))captureSelection()});
 document.addEventListener('pointerdown',event=>{if(event.target.closest('[data-work="toggle-ai"]')){captureSelection();event.preventDefault()}},true);
 document.addEventListener('click',event=>{
  if(!event.target.closest('[data-work="toggle-ai"]'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(card&&!card.classList.contains('is-explanation-sidebar')){close();return}captureSelection();show(pendingContext||{});
 },true);
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-ai-demo]');if(!button)return;
  let action=button.dataset.aiDemo;if(action==='close'){close();return}
  if(action==='history'){dockConversation();renderHistory();return}
  if(action==='apply'&&proposal){
   rememberReportChange();const draft=workspaceDraft();draft.bodyHTML=proposal.html;draft.text=reportPlainText(proposal.html);const saved=saveWorkspace();if(saved.startsWith('自动保存失败')){showWorkbookNotice(saved,true);return}renderWorkspace();markApplied(button,lang('已应用到报告'));showWorkbookNotice('已应用演示整理结果，可用工具栏撤销。');return;
  }
  if(action==='insert'&&proposal){
   rememberReportChange();const draft=workspaceDraft(),editor=document.querySelector('#report-body-editor');
   if(context.range&&editor?.contains(context.range.commonAncestorContainer)){const range=context.range.cloneRange();range.collapse(false);const fragment=range.createContextualFragment(proposal.html);range.insertNode(fragment);saveRichReport()}
   else{draft.bodyHTML=reportBodyHTML(draft)+proposal.html;draft.text=reportPlainText(draft.bodyHTML);saveWorkspace()}
   renderWorkspace();markApplied(button,lang('已插入报告'));return;
  }
  if(card.querySelector('.ai-demo-output')?.dataset.generating==='true')return;
  let request='';
  if(action==='send'){
   const input=card.querySelector('#ai-followup-input');request=input?.value.trim()||'';if(!request){input?.focus();return}
   action=/解释|解釋|explain|meaning|意思/i.test(request)?'explain':/排版|格式|错字|錯字|format|layout/i.test(request)?'format':/整理|报告|報告|organize|report|summar/i.test(request)?'organize':'explain';
   input.value='';
  }
  if(['explain','format','organize'].includes(action)){
   context=pendingContext||context||{};
   if(request){const term=Object.keys(terms).find(k=>request.toLowerCase().includes(k.toLowerCase()));if(term)context={text:term,range:context.range};else if(!context.image&&!context.text)context={text:request}}
   dockConversation();
   currentTurnId=crypto.randomUUID();
   renderHistory();
   card.querySelector('.ai-demo-command')?.remove();
   const command=action==='explain'?'为我解释':action==='format'?'帮我排版':'为我整理报告';
   const object=context.image?lang('这张图片'):context.text?'“'+context.text.slice(0,180)+'”':lang('当前报告');currentCommand=request||lang(command)+'：'+object;
   (card.querySelector('.ai-demo-history')||card.querySelector('.ai-demo-context')).insertAdjacentHTML('afterend','<div class="ai-demo-command" aria-label="用户指令"><p data-language-original>'+escape(currentCommand)+'</p></div>');
  }
  const output=card.querySelector('.ai-demo-output'),token=++generation;output.innerHTML='<p class="sub">'+lang('演示生成中…')+'</p>';setChatBusy(true);card.querySelector('.ai-demo-chat-feed')?.scrollTo({top:999999,behavior:'smooth'});
  setTimeout(async()=>{if(!card||token!==generation)return;
   try{
   if(document.querySelector('#report-body-editor'))saveRichReport();
   if(action==='explain'){
    const facts=explain(),rich=context.image?reportChartInsightHTML(context.result,context.imageNumber||0):'';
    proposal={html:lang(rich||'<h3>'+escape(context.image?'图表解读':'内容解释')+'</h3><ul>'+facts.map(t=>'<li>'+escape(t)+'</li>').join('')+'</ul>')};
    let marked=false;
    if(rich){try{marked=await annotateReportFigure(context.result,context.imageNumber||0)}catch{}}
    if(!card||token!==generation)return;
    output.innerHTML='<div class="ai-demo-result" data-language-original>'+proposal.html+'</div>'+(marked?'<p class="tiny muted">悬浮解读中的最高点或最低点，可在原图查看标记</p>':'')+'<button type="button" class="compact-action" data-ai-demo="insert">插入报告</button>';
   }
   else{proposal=action==='format'?formatReport():organizeReport();
    if(action==='format'){
     rememberReportChange();const draft=workspaceDraft(),before=structuredClone(draft);draft.bodyHTML=proposal.html;draft.text=reportPlainText(proposal.html);const saved=saveWorkspace();
     if(saved.startsWith('自动保存失败')){for(const key of Object.keys(draft))delete draft[key];Object.assign(draft,before);output.textContent=saved;return}renderWorkspace();
     output.innerHTML='<p class="ai-demo-summary">'+escape(lang(proposal.summary))+'</p><p class="sub">已应用到当前报告，可用工具栏撤销。</p>';
    }else output.innerHTML='<p class="sub">作用范围：当前报告</p><p class="ai-demo-summary">'+escape(lang(proposal.summary))+'</p><details><summary>预览整理内容</summary><div class="ai-demo-result" data-language-original>'+proposal.html+'</div></details><button type="button" class="compact-action primary" data-ai-demo="apply">应用到报告</button>';
   }
   archiveResponse(output);renderHistory();
   if(action==='format'){const items=readHistory(),turn=items.find(t=>t.id===currentTurnId);if(turn){turn.applied=true;writeHistory(items)}}
   if(!card.classList.contains('is-explanation-sidebar'))card.style.top=Math.max(12,Math.min(parseFloat(card.style.top)||12,innerHeight-card.offsetHeight-12))+'px';
   }catch{if(card)output.textContent=lang('处理失败，请重试。')}finally{if(card&&token===generation){setChatBusy(false);card.querySelector('.ai-demo-chat-feed')?.scrollTo({top:999999,behavior:'smooth'})}}
  },350);
 });
 window.addEventListener('hashchange',()=>{pendingContext=null;close()});
})();
