'use strict';

const didDiagnosed=new Set();
function didKey(){const f=analysisForm;return JSON.stringify([meta.version,f.activity,f.didUnit||'store',f.pre,f.metric,f.channel])}
function didReadiness(activity,preDays=Number(analysisForm.pre),unit=analysisForm.didUnit||'store'){
  const a=activities[activity.activity_id],mode=a.attribution.mode||'';
  const holdout=/holdout|随机对照/i.test(mode)&&!/未设置|未设|无.*对照/.test(mode);
  const control=(activity.control_stores||[]).filter(name=>!activity.stores.includes(name));
  const issues=[],warnings=[];
  if(invalidWindow(activity))issues.push(['活动日期倒挂','上线前校正开始、结束日期。']);
  if(!activity.stores.length)issues.push(['缺少参与门店','维护参与门店编号并冻结名单。']);
  if(unit==='member'){
    const exp=a.experiment;
    if(exp?.unit!=='member'){
      issues.push(['会员分组明细尚未接入','投放前随机分配会员，保存分组、同意及两组完整交易；不得事后选择未购买者。']);
    }else{
      const q=exp.quality;
      if(q.duplicates||q.missing_consent||q.late_assignment||q.control_reach||q.unassigned_outcomes||!q.srm_pass)issues.push(['实验质量检查未通过','核查重复分组、投放前冻结、同意、串组和样本分配比例。']);
      if(preDays!==28)issues.push(['观察窗口已预设','本实验预设前期28天，请选择28天，避免事后调整窗口。']);
      warnings.push('合成验证数据；按全部已分配会员计算ITT，包括未触达及未购买者。分层配额检查通过不代表样本量足以检出效果。');
    }
  }else{
    if(!control.length)issues.push([holdout?'会员 Holdout 不能替代门店对照':'没有可用门店对照','投放前确定不参与活动的对照门店，保存名单并核对店型、地区、基线销售和同期促销。']);
    if(control.length<2&&control.length)issues.push(['对照门店不足','至少需要多家独立门店才能检查门店间波动；应在上线前做样本量规划。']);
    if(activity.control_stores?.some(name=>activity.stores.includes(name)))warnings.push('原始门店名单有组间重叠，已剔除重叠对照；需复核分组。');
    const shops=new Map(revenueData.stores.map(s=>[s.name,s]));
    const types=names=>{const counts={};names.forEach(name=>{const t=shops.get(name)?.type||'未知';counts[t]=(counts[t]||0)+1});return counts};
    const left=types(activity.stores),right=types(control);
    if(control.length){
      const differences=[...new Set([...Object.keys(left),...Object.keys(right)])].filter(t=>Math.abs((left[t]||0)/Math.max(1,activity.stores.length)-(right[t]||0)/control.length)>.1);
      if(differences.length)warnings.push('两组店型构成不同：'+differences.join('、')+'。需复核匹配，当前不自动调整门店或宣称可比。');
      if(control.length<10)warnings.push('对照门店少于 10 家：仅作小样本探索，不展示当前算法的近似 95% 区间。');
    }
    warnings.push('门店对照并非会员随机实验；需核查同期促销、门店营业变化及组间污染。');
  }
  const exp=a.experiment;if(exp?.unit==='store'&&preDays>28)issues.push(['前期窗口超出实验日表','本实验仅补充28天前期，请选择14或28天。']);
  if(exp)warnings.push('合成验证数据，不能解释为真实活动效果；原始经营交易保持独立。');
  if(!invalidWindow(activity)&&(dateShift(activity.start,-preDays)<revenueData.dates[0]||activity.end>revenueData.dates.at(-1)))issues.push(['活动前后数据不完整','需要活动前 '+preDays+' 天与完整活动期数据；数据截至 '+revenueData.dates.at(-1)+'，不把未来日期补成零。']);
  return {holdout,control,issues,warnings,ready:issues.length===0,unit,label:issues.length?'待准备数据':unit==='store'?'可做门店探索评估':'可做会员随机评估'};
}
function didGuidePanel(activity){
  const f=analysisForm,unit=f.didUnit||'store';
  let html='<section class="panel pad incremental-guide"><h2>选择评估方法</h2><div class="incremental-methods">'+
    [['store','门店对照评估'],['member','会员随机留出']].map(([key,title])=>'<button type="button" data-did-unit="'+key+'" aria-pressed="'+(unit===key)+'" class="incremental-method '+(unit===key?'active':'')+'"><strong>'+title+'</strong></button>').join('')+'</div>';
  if(!activity)return html+'</section>';
  const readiness=didReadiness(activity);
  if(activities[activity.activity_id].experiment)html+='<span class="badge">合成验证数据</span>';
  if(readiness.ready){
  }
  return html+'</section>';
}
document.addEventListener('click',event=>{
  const method=event.target.closest('[data-did-unit]');
  if(method){analysisForm.didUnit=method.dataset.didUnit;analysisForm.didReviewed=false;lastResult=undefined;renderAnalysis();return}

});

function calculateMemberExperiment(activity,onlyPre){
  const f=analysisForm,e=activities[activity.activity_id].experiment;
  if(e?.unit!=='member')throw Error('未接入会员实验明细。');
  const metric=f.metric,groups=[e.groups.treatment,e.groups.control],phase=onlyPre?'pre':'post';
  const mean=(g,p)=>g[p][metric].sum/g.n;
  const variance=g=>{const x=g[phase][metric];return Math.max(0,(x.sumSquares-x.sum*x.sum/g.n)/(g.n-1))/g.n};
  const preDays=dateRange(e.pre_start,e.pre_end),postDays=dateRange(e.post_start,e.post_end),days=onlyPre?preDays:[...preDays,...postDays];
  const result={title:onlyPre?'会员实验质量诊断':'会员随机留出评估',method:'did',source:'合成验证数据 · 会员实验分组及消费',unit:(metric==='orders'?'单':'HKD')+'/会员',labels:['处理组','留出组'],detail:activity.name+' · '+groups[0].n+' 位处理会员 / '+groups[1].n+' 位留出会员',diagnostics:[['处理组前期人均',mean(groups[0],'pre')],['留出组前期人均',mean(groups[1],'pre')]],assessment:{path:'member',synthetic:true},note:'合成验证实验，不代表真实营销效果。按预先分配的全部会员计算ITT，未触达及未购买者均计入。主要估计为完整活动期人均结果之差；非门店DID。区间按会员独立样本作近似95%估计，不能据此保证实验功效。计划留出5%，按分层固定配额抽样；人数向下取整不超过5%，已通过配额校验；无重复、未同意、晚分组或留出组触达。',points:days.map(d=>({date:d,actual:(e.daily[d]?.treatment?.[metric==='orders'?1:0]||0)/groups[0].n,baseline:(e.daily[d]?.control?.[metric==='orders'?1:0]||0)/groups[1].n})),start:e.post_start};
  if(onlyPre){didDiagnosed.add(didKey());result.summary='分组、同意、冻结时间与串组检查通过；处理组 '+groups[0].n+' 人，留出组 '+groups[1].n+' 人，实际留出 '+(100*groups[1].n/(groups[0].n+groups[1].n)).toFixed(1)+'%（计划5%，人数向下取整）。按人群标签、等级、历史消费分层随机抽取。前期人均差异仅用于检查随机分配平衡。';}
  else{result.delta=mean(groups[0],'post')-mean(groups[1],'post');result.baseline=mean(groups[1],'post');const margin=1.96*Math.sqrt(groups.reduce((sum,g)=>sum+variance(g),0));result.interval=[result.delta-margin,result.delta+margin];result.diagnostics.push(['处理组活动期人均',mean(groups[0],'post')],['留出组活动期人均',mean(groups[1],'post')]);result.summary='合成验证：完整活动期每位处理会员较留出组差异 '+result.delta.toFixed(2)+' '+result.unit+'；近似95%区间 '+result.interval.map(v=>v.toFixed(2)).join(' 至 ')+'。'+(result.interval[0]<=0&&result.interval[1]>=0?'区间包含0，当前样本不能排除无差异。':'区间未包含0，仅说明本合成样本的统计差异。')+'按全部分配会员计算，不按是否购买筛选。';}
  return result;
}
