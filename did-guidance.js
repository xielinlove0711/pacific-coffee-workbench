'use strict';

function didReadiness(activity,preDays=Number(analysisForm.pre)){
  const a=activities[activity.activity_id];
  const holdout=/holdout|随机对照/i.test(a.attribution.mode||'');
  const control=(activity.control_stores||[]).filter(name=>!activity.stores.includes(name));
  const issues=[];
  if(invalidWindow(activity))issues.push(['日期倒挂','上线前核对开始和结束日期，并冻结活动窗口。']);
  if(!activity.stores.length)issues.push(['缺少处理门店名单','上线前维护参与门店 ID，并保存名单版本。']);
  if(!control.length)issues.push([holdout?'记录了会员 Holdout，但没有可复算的分组名单':'缺少门店对照组',
    holdout?'投放前按会员 ID 随机分组，保存全部合资格会员的处理／留出标签、分配时间和触达日志；保留未核销会员及两组交易。当前门店 DID 无法替代会员随机实验。':
    '投放前选择可比且不参与活动的对照门店；记录店型、历史销售及同期促销，协调保持对照组不受活动影响。']);
  if(!invalidWindow(activity)&&(dateShift(activity.start,-preDays)<revenueData.dates[0]||activity.end>revenueData.dates.at(-1))){
    issues.push(['前后窗口数据不足','上线前安排完整基线与追踪数据，覆盖至少所选的 '+preDays+' 天前期；数据不足时调整窗口并说明依据。']);
  }
  return {holdout,control,issues,ready:issues.length===0,
    label:issues.length?'需补条件':'可运行门店 DID · 待诊断'};
}

function didGuidePanel(activity){
  if(!activity)return '';
  const selected=didReadiness(activity);
  return '<section class="panel pad did-guide"><div class="did-selected"><strong>'+
    escape(activity.name)+' · '+escape(selected.label)+'</strong>'+
    '<p class="sub">'+(selected.holdout?'有 Holdout 设计记录 · ':'')+activity.stores.length+' 家处理门店 / '+
    selected.control.length+' 家对照门店</p>'+
    (selected.issues.length?table([['当前缺口'],['上线前如何准备']],selected.issues.map(row=>row.map(escape))):
      '<p class="sub">可运行前趋势诊断和探索性评估，正式结论仍需复核。</p>')+'</div></section>';
}
