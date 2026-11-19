'use strict';

const crossDimensions={
  district:{label:'区域',value:shop=>shop.district},
  type:{label:'门店类型',value:shop=>shop.type},
  channel:{label:'交易渠道',value:(_shop,channel)=>({pos:'门店 POS',app_preorder:'App 预点',foodpanda:'foodpanda',keeta:'Keeta'})[channel]||channel},
  weekday:{label:'星期',value:(_shop,_channel,day)=>weekdayLabel(day)},
  date:{label:'日期',value:(_shop,_channel,day)=>day}
};
const selectableCrossKeys=['district','type','channel','weekday'];
let performanceCrossKeys=['type','channel'];

function performanceCrossRows(activity,keys){
  const s=activity.activity_summary;
  if(invalidWindow(s)||!keys.length)return [];
  const scoped=new Set(s.stores),buckets=new Map();
  for(const shop of revenueData.stores){
    if(!scoped.has(shop.name))continue;
    for(const [channel,days] of Object.entries(shop.channels)){
      for(const [i,cents,orders] of days){
        const date=revenueData.dates[i];
        if(date<s.start||date>s.end)continue;
        const values=keys.map(key=>crossDimensions[key].value(shop,channel,date)||'未标注');
        const id=JSON.stringify(values);
        if(!buckets.has(id))buckets.set(id,{values,cents:0,orders:0});
        const row=buckets.get(id);
        row.cents+=cents;
        row.orders+=orders;
      }
    }
  }
  const total=[...buckets.values()].reduce((sum,row)=>sum+row.cents,0);
  return [...buckets.values()].sort((a,b)=>b.cents-a.cents).map(({values,cents,orders})=>
    [...values,cents/100,orders,orders>0?cents/orders/100:null,total>0?cents/total*100:null]);
}

const crossMetricHeaders=['总营收（HKD）','总单量','客单价（HKD）','营收占比（%）'];

function performanceCrossPanel(activity){
  return '<section class="panel pad performance-cross"><div class="row spread"><h2>交叉分析</h2>'+
    '<button id="export-performance-cross" class="compact-action" type="button"><span class="action-symbol" aria-hidden="true">↓</span>导出交叉表</button></div>'+
    '<fieldset class="cross-factors"><legend>勾选分析维度</legend>'+selectableCrossKeys.map(key=>
    '<label><input type="checkbox" data-cross-key="'+key+'" '+(performanceCrossKeys.includes(key)?'checked':'')+
    '> '+crossDimensions[key].label+'</label>').join('')+'</fieldset>'+
    '<p class="sub">按所选维度组合汇总活动期覆盖门店的会员与散客交易。营收占比以整场活动覆盖范围为分母。</p>'+
    '<div id="performance-cross-results">'+performanceCrossPreview(activity)+'</div></section>';
}

function performanceCrossPreview(activity){
  if(!performanceCrossKeys.length)return '<p class="sub">请勾选至少一项分析维度。</p>';
  const rows=performanceCrossRows(activity,performanceCrossKeys);
  if(!rows.length)return '<p class="sub">没有可用的活动交易明细。</p>';
  const dimensions=performanceCrossKeys.length;
  return '<p class="sub" role="status">共 '+rows.length+' 组'+(rows.length>20?'，预览营收前 20 组，导出包含全部。':'。')+'</p>'+
    table([...performanceCrossKeys.map(key=>[crossDimensions[key].label]),...crossMetricHeaders.map(label=>[label,'num'])],
      rows.slice(0,20).map(row=>row.map((value,i)=>i<dimensions?escape(value):
        !numeric(value)?'—':i===dimensions+1?fmt(value):i===dimensions+3?pct(value):fmt(value,2))));
}

function activityExportSheets(activity,crossOnly){
  const s=activity.activity_summary,m=activity.metrics,kpis=activityEconomics(s);
  const cross=performanceCrossRows(activity,performanceCrossKeys);
  const dimensions=performanceCrossKeys.map(key=>crossDimensions[key].label);
  const sheets=[['筛选与口径',['项目','内容'],[
    ['活动',s.name],['编号',s.activity_id],['活动类型',s.type],['活动目标',s.goal],['覆盖门店',s.stores.length],['活动来源',s.scenario?'新增活动方案':'v9 活动主表'],['目标人群',s.target_audience||'—'],['计划预算（HKD）',s.planned_budget??null],['数据截止',meta.data_cutoff||'2026-10-31'],
    ['档期',s.start+' 至 '+s.end+(invalidWindow(s)?'（日期倒挂）':'')],
    ['数据来源','FY2026 v7 (5) 模拟工作簿'],['交叉维度',dimensions.join(' × ')||'未选择'],
    ['营收与订单','活动期覆盖门店的会员与散客交易。各交叉组按其维度组合汇总，未记录交易的组合不列出。'],
    ['客单价与营收占比','客单价＝总营收 ÷ 总单量；营收占比＝分组营收 ÷ 全活动覆盖门店总营收。'],
    ['ROI（校准）',economicsHeaders.roi.help],['广告 CPM',economicsHeaders.cpm.help],
    ['缺数','空白代表未观测到数据或指标不适用。观察结果可能包含同期活动影响。']
  ]]];
  if(!crossOnly){
    const byDate=new Map(performanceCrossRows(activity,['date']).map(row=>[row[0],row]));
    const storeRows=key=>activity.breakdown.dimensions[key].rows.map(row=>
      [row.dimension_value,row.revenue,row.orders,row.orders>0?row.revenue/row.orders:null]);
    const goal=performanceIndicators(activity).map(([label,value,formula])=>{
      const normalized=value.replace(/[,％%]/g,'').replace('−','-');
      return [label,value==='—'?null:numeric(Number(normalized))?Number(normalized):value,formula];
    });
    sheets.push(
      ['核心指标',['指标','数值','口径或单位'],[
        ['总营收',m.revenue,'HKD'],['总单量',m.orders,'单'],
        ['客单价',m.orders>0?m.revenue/m.orders:null,'HKD／单'],
        ['总投入',kpis.cost,'HKD，来自校准表'],['ROI（校准）',kpis.roi,economicsHeaders.roi.help],
        ['广告 CPM',kpis.cpm,economicsHeaders.cpm.help]]],
      ['目标效果',['指标','数值','计算口径'],goal],
      ['每日经营',['日期','星期','总营收（HKD）','总单量','客单价（HKD）'],
        activity.trend.series.revenue.map(point=>{
          const row=byDate.get(point.date);
          return [point.date,weekdayLabel(point.date),point.actual,row?.[2]??(numeric(point.actual)?0:null),row?.[3]??null];
        })],
      ['门店类型',['门店类型',...crossMetricHeaders.slice(0,3)],storeRows('store_type')],
      ['门店明细',['门店',...crossMetricHeaders.slice(0,3)],storeRows('store')],
      ['消息触达',['指标','数值','计算口径'],[
        ['消息记录',m.sent,'v9 触达明细 中对应活动的消息记录数。'],
        ['送达记录',m.sent>0?m.delivered:null,'计入 delivered、opened、clicked 状态。'],
        ['送达率（%）',kpis.delivery,economicsHeaders.delivery.help]]]
    );
  }
  if(!crossOnly&&numeric(m.ad_impressions))sheets.push(['广告投放',['指标','数值','单位'],[['广告曝光',m.ad_impressions,'次'],['广告点击',m.ad_clicks,'次'],['媒体花费',m.ad_spend,'HKD'],['广告 CPM',m.ad_cpm,'HKD'],['点击率',m.ad_clicks/m.ad_impressions*100,'%']]]);
  if(dimensions.length)sheets.push(['交叉分析',[...dimensions,...crossMetricHeaders],cross]);
  return sheets;
}

function currentPerformanceActivity(){
  const id=document.querySelector('[data-performance-activity]')?.dataset.performanceActivity;
  return comparisonActivities().some(s=>s.activity_id===id)?activities[id]:null;
}

document.addEventListener('change',event=>{
  if(!event.target.dataset.crossKey)return;
  const activity=currentPerformanceActivity();
  if(!activity)return;
  const {crossKey}=event.target.dataset;
  const selection=new Set(performanceCrossKeys);
  if(event.target.checked)selection.add(crossKey);
  else selection.delete(crossKey);
  performanceCrossKeys=selectableCrossKeys.filter(key=>selection.has(key));
  document.querySelector('#performance-cross-results').innerHTML=performanceCrossPreview(activity);
});

document.addEventListener('click',event=>{
  const button=event.target.closest?.('#export-performance,#export-performance-cross');
  if(!button)return;
  const activity=currentPerformanceActivity();
  if(!activity)return;
  const crossOnly=button.id==='export-performance-cross';
  if(crossOnly&&!performanceCrossKeys.length){
    document.querySelector('#performance-cross-results').innerHTML='<p role="status">请先勾选分析维度，再导出。</p>';
    return;
  }
  const s=activity.activity_summary;
  const name=s.name.replace(/[\\/:*?"<>|]/g,'_');
  downloadWorkbook(activityExportSheets(activity,crossOnly),'太平洋咖啡_'+s.activity_id+'_'+name+'_'+(crossOnly?'交叉分析':'活动效果'));
});
