'use strict';
(()=>{
 const selector='input[type="date"],input[type="month"]';
 let picker=null,field=null,year,month;
 const pad=n=>String(n).padStart(2,'0');
 const key=(y,m)=>y+'-'+pad(m+1);
 function dismiss(restore=false){picker?.remove();picker=null;if(restore&&field?.isConnected)field.focus()}
 function allowed(value){return (!field.min||value>=field.min)&&(!field.max||value<=field.max)}
 function choose(value){const input=field;if(!allowed(value))return;dismiss();input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));if(input.isConnected)input.focus()}
 function render(){
  const isMonth=field.type==='month',selected=field.value,baseYear=new Date().getFullYear();
  const first=Number(field.min?.slice(0,4))||Math.min(year-5,baseYear-5),last=Number(field.max?.slice(0,4))||Math.max(year+5,baseYear+5);
  picker.innerHTML='<div class="date-picker-heading"><button type="button" data-picker-step="-1" aria-label="上一'+(isMonth?'年':'月')+'">‹</button><div><select data-picker-year aria-label="年份">'+Array.from({length:last-first+1},(_,i)=>first+i).map(y=>'<option '+(y===year?'selected':'')+'>'+y+'</option>').join('')+'</select>'+(isMonth?'':'<select data-picker-month aria-label="月份">'+Array.from({length:12},(_,m)=>'<option value="'+m+'" '+(m===month?'selected':'')+'>'+pad(m+1)+'</option>').join('')+'</select>')+'</div><button type="button" data-picker-step="1" aria-label="下一'+(isMonth?'年':'月')+'">›</button><button type="button" data-picker-close aria-label="关闭日期选择">×</button></div>';
  let body='';
  if(isMonth){body='<div class="date-picker-month-grid">'+Array.from({length:12},(_,m)=>{const value=key(year,m);return '<button type="button" data-picker-value="'+value+'" '+(!allowed(value)?'disabled':'')+' aria-pressed="'+(value===selected)+'">'+pad(m+1)+'</button>'}).join('')+'</div>'}
  else{
   const offset=(new Date(year,month,1).getDay()+6)%7,days=new Date(year,month+1,0).getDate();
   body='<div class="date-picker-day-grid">'+['一','二','三','四','五','六','日'].map((name,i)=>'<span aria-hidden="true">'+(uiLanguage==='en'?['M','T','W','T','F','S','S'][i]:name)+'</span>').join('')+Array.from({length:offset},()=>'<span></span>').join('')+Array.from({length:days},(_,i)=>{const value=key(year,month)+'-'+pad(i+1);return '<button type="button" data-picker-value="'+value+'" '+(!allowed(value)?'disabled':'')+' aria-label="'+value+'" aria-pressed="'+(value===selected)+'">'+(i+1)+'</button>'}).join('')+'</div>';
  }
  picker.insertAdjacentHTML('beforeend',body);localizeUi(picker);
  const rect=field.getBoundingClientRect();picker.style.left=Math.max(8,Math.min(rect.left,innerWidth-picker.offsetWidth-8))+'px';picker.style.top=Math.max(8,rect.bottom+picker.offsetHeight+8<innerHeight?rect.bottom+6:rect.top-picker.offsetHeight-6)+'px';
 }
 function open(input){
  if(input.disabled||input.readOnly)return;
  // Native pickers retain OS keyboard/date-entry conventions where supported.
  if(typeof input.showPicker==='function'){try{input.showPicker();return}catch{}}
  dismiss();field=input;const value=input.value||input.min||new Date().toISOString().slice(0,10);year=Number(value.slice(0,4));month=Number(value.slice(5,7))-1;
  picker=document.createElement('div');picker.className='platform-date-picker no-print';picker.setAttribute('role','dialog');picker.setAttribute('aria-label',localize(input.type==='month'?'选择月份':'选择日期'));document.body.append(picker);render();
 }
 document.addEventListener('click',event=>{
  const input=event.target.closest(selector);if(input){event.preventDefault();open(input);return}
  if(!picker)return;
  const target=event.target;
  if(target.closest('[data-picker-close]')){dismiss(true);return}
  const day=target.closest('[data-picker-value]');if(day){choose(day.dataset.pickerValue);return}
  const step=target.closest('[data-picker-step]');if(step){if(field.type==='month')year+=Number(step.dataset.pickerStep);else{const next=new Date(year,month+Number(step.dataset.pickerStep),1);year=next.getFullYear();month=next.getMonth()}render();return}
  if(!picker.contains(target))dismiss();
 });
 document.addEventListener('change',event=>{if(!picker)return;if(event.target.matches('[data-picker-year]')){year=Number(event.target.value);render()}else if(event.target.matches('[data-picker-month]')){month=Number(event.target.value);render()}});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')dismiss(true);if(event.target.matches(selector)&&(event.key===' '||event.key==='Enter'||event.altKey&&event.key==='ArrowDown')){event.preventDefault();open(event.target)}});
 window.addEventListener('hashchange',()=>dismiss());window.addEventListener('resize',()=>dismiss());window.addEventListener('scroll',event=>{if(picker&&(!(event.target instanceof Node)||!picker.contains(event.target)))dismiss()},true);
})();
