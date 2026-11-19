'use strict';

const feedbackCategories = ['页面不显示或加载异常','数据有误','操作或导出失败','其他问题'];
const feedbackLocal = location.protocol === 'file:';
let feedbackReference = '#summary';
function feedbackRecipient(){
  try{return window.PACIFIC_SUPPORT_EMAIL||localStorage.getItem('pacific-support-email')||'xielin_04@163.com'}catch{return window.PACIFIC_SUPPORT_EMAIL||'xielin_04@163.com'}
}
function feedbackTicket(form){
  const input=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,value.trim()]));
  delete input.recipient;
  const fingerprint=JSON.stringify(input);
  if(pendingFeedback?.fingerprint!==fingerprint){
    pendingFeedback={fingerprint,ticket:{...input,id:'PCC-'+crypto.getRandomValues(new Uint32Array(2)).join('-'),createdAt:new Date().toISOString()}};
  }
  return pendingFeedback.ticket;
}
function feedbackContents(ticket){
  return ['技术支持工单 '+ticket.id,'问题类型：'+ticket.category,'问题标题：'+ticket.title,
    '发生页面：'+(ticket.page||'未填写'),'提交人：'+(typeof scratchUser==='function'?scratchUser():'市场经理'),
    '回复联系方式：'+(ticket.contact||'未填写'),'创建时间：'+ticket.createdAt,'','问题描述',ticket.description].join('\n');
}


function renderFeedback() {
  main.innerHTML = head('问题反馈','描述你遇到的问题，提交给技术人员排查。')+
    '<form id="feedback-form" class="panel pad feedback-form">'+
    '<label>问题类型<select name="category" required><option value="">请选择问题类型</option>'+
    feedbackCategories.map(value=>'<option>'+value+'</option>').join('')+'</select></label>'+
    '<label>问题标题<input name="title" maxlength="100" required placeholder="例如：按活动页面加载后空白"></label>'+
    '<label>问题描述<textarea name="description" maxlength="3000" required rows="6" placeholder="请写明页面或活动、操作步骤、实际结果和预期结果"></textarea></label>'+
    '<label>发生页面<input name="page" maxlength="160" value="'+escape(feedbackReference)+'" placeholder="例如：数据总览 › 按门店"></label>'+
    '<label>回复联系方式（选填）<input name="contact" maxlength="120" placeholder="例如：工作邮箱"></label>'+
    '<label>平台负责人邮箱<input name="recipient" type="email" maxlength="254" value="'+escape(feedbackRecipient())+'" placeholder="填写平台负责人邮箱，供发送工单使用"></label>'+
    '<p class="sub">'+(feedbackLocal?'当前是本地文件。可下载工单并转交技术人员。':'提交后会生成工单编号，技术人员可以在工单队列查看。')+'</p>'+
    '<div class="row"><button class="primary" type="submit">'+(feedbackLocal?'下载工单':'提交工单')+
    '</button><button type="button" data-feedback-send>发送工单</button><span data-feedback-status role="status" aria-live="polite"></span></div></form>';
}

function downloadFeedback(ticket) {
  const contents=feedbackContents(ticket);
  const href = URL.createObjectURL(new Blob([contents],{type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = href;
  link.download = ticket.id+'.txt';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(href),10000);
}

let pendingFeedback;
document.addEventListener('submit',async event=>{
  const form=event.target;
  if(form.id!=='feedback-form')return;
  event.preventDefault();
  const status=form.querySelector('[data-feedback-status]');
  const button=form.querySelector('button[type="submit"]');
  const input=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,value.trim()]));
  if(!feedbackCategories.includes(input.category)||!input.title||!input.description){
    status.textContent='请填写问题类型、标题和描述。';
    return;
  }
  const ticket=feedbackTicket(form);
  if(feedbackLocal){
    downloadFeedback(ticket);
    status.textContent='已生成 '+ticket.id+'。请把下载的文件转交技术人员。';
    return;
  }
  button.disabled=true;
  status.textContent='正在提交…';
  try{
    const response=await fetch('/api/tickets',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ticket)
    });
    if(!response.ok)throw Error();
    const result=await response.json();
    form.reset();
    status.textContent='已进入技术工单队列。编号 '+result.id;
    pendingFeedback=undefined;
  }catch{
    status.textContent='暂时无法确认提交。表单已保留，可以重试。';
  }finally{
    button.disabled=false;
  }
});

document.addEventListener('click',event=>{
  if(!event.target.closest('[data-feedback-send]'))return;
  const form=document.querySelector('#feedback-form');
  if(!form.reportValidity())return;
  const status=form.querySelector('[data-feedback-status]');
  const field=form.elements.recipient,recipient=field.value.trim();
  if(!recipient){status.textContent='请先填写平台负责人的邮箱。';field.focus();return}
  if(!field.checkValidity()){field.reportValidity();return}
  if(!feedbackCategories.includes(form.elements.category.value))return;
  try{localStorage.setItem('pacific-support-email',recipient)}catch{}
  if(!form.elements.title.value.trim()||!form.elements.description.value.trim()){status.textContent='请填写问题标题和描述。';return}
  const ticket=feedbackTicket(form);
  const subject='[太平洋咖啡工单] '+ticket.id+' · '+ticket.category+' · '+ticket.title;
  const link=document.createElement('a');
  link.href='mailto:'+encodeURIComponent(recipient)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(feedbackContents(ticket));
  link.click();
  status.textContent='已请求打开邮件应用，请核对收件人和内容后发送。若未打开，请检查默认邮件应用设置，或下载工单转交负责人。';
});
