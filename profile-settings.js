'use strict';
function personalKey(){return 'pacific-personal-settings-'+scratchUser()}
function personalSettings(){try{return JSON.parse(localStorage.getItem(personalKey()))||{}}catch{return {}}}
function savePersonalSettings(settings){try{localStorage.setItem(personalKey(),JSON.stringify(settings));return true}catch{showWorkbookNotice('设置保存失败，请检查浏览器存储空间。',true);return false}}
function applyPersonalSettings(){
  const settings=personalSettings();
  document.documentElement.dataset.theme=settings.dark?'dark':'light';
  const user=document.querySelector('#workspace-user');
  if(user){user.classList.toggle('has-personal-avatar',!!settings.avatar);user.style.setProperty('--personal-avatar',settings.avatar?'url("'+settings.avatar+'")':'none')}
  if(settings.language&&settings.language!==uiLanguage)setUiLanguage(settings.language);
}
function personalAvatar(settings){
  return settings.avatar?'<img src="'+settings.avatar+'" alt="个人头像">':
    '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="24" r="10" stroke="currentColor" stroke-width="2"/><path d="M13 53c1-12 8-18 19-18s18 6 19 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
}
function renderPersonalProfile(){
  const settings=personalSettings(),draft=workspaceDraft(),items=scratchRead();
  main.innerHTML=head('个人主页','')+'<div class="personal-page">'+
    '<section class="panel personal-account"><label class="personal-avatar" title="更换头像">'+personalAvatar(settings)+
    '<span class="personal-avatar-edit">更换头像</span><input id="personal-avatar-file" type="file" accept="image/png,image/jpeg,image/webp" aria-label="更换头像"></label>'+
    '<div><h2 data-language-original>'+escape(scratchUser())+'</h2><p class="sub">市场经理</p></div></section>'+
    '<section class="panel personal-settings"><h2>偏好设置</h2><div class="personal-setting-row"><div><strong>语言设置</strong><p class="sub">应用到页面与导出表格</p></div>'+
    '<select id="personal-language" aria-label="语言设置"><option value="zh-CN"'+(uiLanguage==='zh-CN'?' selected':'')+'>简体中文</option><option value="zh-HK"'+(uiLanguage==='zh-HK'?' selected':'')+'>繁體中文</option><option value="en"'+(uiLanguage==='en'?' selected':'')+'>English</option></select></div>'+
    '<div class="personal-setting-row"><div><strong>黑夜模式</strong><p class="sub">降低界面亮度，适合夜间使用</p></div><button type="button" class="personal-switch" role="switch" id="personal-dark-mode" aria-label="黑夜模式" aria-checked="'+!!settings.dark+'"><span></span></button></div></section>'+
    '<section class="panel personal-settings"><h2>报告草稿</h2><div class="personal-setting-row"><div><strong>报告草稿</strong><p class="sub"><span data-language-original>'+escape(draft.title==='营销活动复盘'?localize(draft.title):draft.title)+'</span> · '+draft.evidence.length+' 份引用素材</p></div><div class="row"><a class="compact-action button" href="#reports">继续编辑</a><button type="button" class="compact-action" data-report-history>查看已存版本（'+reportVersionsStore().items.length+'）</button></div></div></section>'+
    '<section class="panel personal-settings"><h2>素材库</h2>'+
    '<div class="personal-setting-row"><div><strong>素材库</strong><p class="sub">已保存 '+items.length+' 份素材与笔记</p></div><a class="compact-action button" href="#reports/materials">查看素材库</a></div><p class="personal-storage-note sub">素材保存在当前浏览器，可在素材库中导出备份。</p></section>'+
    '<section class="panel personal-settings"><details class="personal-about"><summary><strong>关于平台</strong><span aria-hidden="true">⌄</span></summary><div><h3>太平洋咖啡营销复盘工作台</h3><p class="sub">查看经营数据、分析活动表现、比较活动效果，并整理素材与撰写报告。</p><p class="sub">使用中遇到页面或数据问题，可通过问题反馈联系平台负责人。</p><a href="#feedback">问题反馈 →</a></div></details></section><p id="personal-save-status" class="sub" role="status" aria-live="polite"></p></div>';
}
function personalSaved(){const status=document.querySelector('#personal-save-status');if(status)status.textContent=localize('设置已保存')}
document.addEventListener('change',async event=>{
  if(event.target.id==='personal-language'){
    const settings=personalSettings();settings.language=event.target.value;
    if(savePersonalSettings(settings)){setUiLanguage(settings.language);const login=document.querySelector('#login-language');if(login)login.value=settings.language;renderPersonalProfile();personalSaved()}
  }
  if(event.target.id==='personal-avatar-file'){
    const file=event.target.files[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){showWorkbookNotice('请选择 PNG、JPG 或 WebP 图片。',true);return}
    const url=URL.createObjectURL(file);
    try{
      const img=new Image();img.src=url;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=canvas.height=192;
      const size=Math.min(img.width,img.height);canvas.getContext('2d').drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,192,192);
      const settings=personalSettings();settings.avatar=canvas.toDataURL('image/png');
      if(savePersonalSettings(settings)){applyPersonalSettings();renderPersonalProfile();personalSaved()}
    }catch{showWorkbookNotice('图片无法读取，请换一张图片。',true)}finally{URL.revokeObjectURL(url)}
  }
});
document.addEventListener('click',event=>{
  const button=event.target.closest('#personal-dark-mode');if(!button)return;
  const settings=personalSettings();settings.dark=!settings.dark;
  if(savePersonalSettings(settings)){applyPersonalSettings();button.setAttribute('aria-checked',String(settings.dark));personalSaved()}
});
applyPersonalSettings();
