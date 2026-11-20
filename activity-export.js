'use strict';

const crossDimensions={
  store:{label:'门店',value:shop=>shop.name},
  district:{label:'区域',value:shop=>shop.district},
  type:{label:'门店类型',value:shop=>shop.type},
  channel:{label:'交易渠道',value:(_shop,channel)=>({pos:'门店 POS',app_preorder:'App 预点',foodpanda:'foodpanda',keeta:'Keeta'})[channel]||channel},
  weekday:{label:'星期',value:(_shop,_channel,day)=>weekdayLabel(day)},
  date:{label:'日期',value:(_shop,_channel,day)=>day}
};
const selectableCrossKeys=['district','type','store','channel','weekday','date'];
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

let crossExpanded=new Set();
let crossVisibleLimit=60;
let crossSortMetric='revenue';
let crossSortDescending=true;
let crossRowsCache={};
function crossLeafRows(activity){
  const key=activity.activity_summary.activity_id+'|'+performanceCrossKeys.join('|');
  if(crossRowsCache.key!==key)crossRowsCache={key,rows:performanceCrossRows(activity,performanceCrossKeys)};
  return crossRowsCache.rows;
}
function crossTree(activity){
  const root={children:new Map(),revenue:0,orders:0,path:[]},n=performanceCrossKeys.length;
  for(const row of crossLeafRows(activity)){
    let node=root;node.revenue+=row[n];node.orders+=row[n+1];
    for(let i=0;i<n;i++){
      if(!node.children.has(row[i]))node.children.set(row[i],{label:row[i],path:row.slice(0,i+1),children:new Map(),revenue:0,orders:0});
      node=node.children.get(row[i]);node.revenue+=row[n];node.orders+=row[n+1];
    }
  }
  return root;
}
function crossVisibleNodes(activity){
  const root=crossTree(activity),rows=[];
  const visit=node=>{const children=[...node.children.values()].sort((a,b)=>(crossSortDescending?-1:1)*(a[crossSortMetric]-b[crossSortMetric])||a.label.localeCompare(b.label));
    for(const child of children){rows.push(child);if(crossExpanded.has(JSON.stringify(child.path)))visit(child)}};
  visit(root);return {root,rows};
}
function crossControlsHTML(){
  return '<div class="cross-builder"><div class="cross-dimension-bank" data-cross-bank><span class="cross-zone-title">可用维度</span>'+selectableCrossKeys.filter(key=>!performanceCrossKeys.includes(key)).map(key=>'<button type="button" draggable="true" data-cross-drag="'+key+'" data-cross-add="'+key+'" title="拖入下钻路径，也可点击添加"><span aria-hidden="true">⠿</span>'+crossDimensions[key].label+'<span aria-hidden="true">＋</span></button>').join('')+'</div>'+
    '<div class="cross-drill-zone" data-cross-drop role="list" aria-label="下钻路径"><span class="cross-zone-title">下钻路径</span>'+performanceCrossKeys.map((key,i)=>'<div role="listitem" class="cross-dimension-chip" draggable="true" data-cross-drag="'+key+'"><span class="cross-drag-handle" aria-hidden="true">⠿</span><span>'+crossDimensions[key].label+'</span><button type="button" data-cross-move="'+key+'" data-step="-1" aria-label="'+crossDimensions[key].label+'前移" '+(!i?'disabled':'')+'>‹</button><button type="button" data-cross-move="'+key+'" data-step="1" aria-label="'+crossDimensions[key].label+'后移" '+(i===performanceCrossKeys.length-1?'disabled':'')+'>›</button><button type="button" data-cross-remove="'+key+'" aria-label="移除'+crossDimensions[key].label+'">×</button></div>').join('')+(!performanceCrossKeys.length?'<span class="cross-drop-placeholder">将维度拖到这里</span>':'')+'</div></div>';
}
function performanceCrossPanel(activity){
  return '<section class="panel pad performance-cross"><div class="row spread"><h2>交叉分析</h2><button id="export-performance-cross" class="compact-action" type="button"><span class="action-symbol" aria-hidden="true">↓</span>导出交叉表</button></div><div id="cross-builder-controls">'+crossControlsHTML()+'</div>'+
    '<div class="cross-table-tools"><span class="tiny muted">从左到右逐层下钻，拖动可调整顺序</span><div class="row"><label>排序 <select data-cross-sort><option value="revenue" '+(crossSortMetric==='revenue'?'selected':'')+'>总营收</option><option value="orders" '+(crossSortMetric==='orders'?'selected':'')+'>总单量</option></select></label><button type="button" data-cross-action="sort">'+(crossSortDescending?'↓':'↑')+'</button><button type="button" data-cross-action="expand">展开全部</button><button type="button" data-cross-action="collapse">收起全部</button></div></div><div id="cross-announcement" role="status" class="tiny muted"></div><div id="performance-cross-results">'+performanceCrossPreview(activity)+'</div></section>';
}
function performanceCrossPreview(activity){
  if(!performanceCrossKeys.length)return '<p class="sub">拖入维度开始分析，也可点击可用维度添加。</p>';
  const {root,rows}=crossVisibleNodes(activity);
  if(!rows.length)return '<p class="sub">没有可用的活动交易明细。</p>';
  const values=node=>[fmt(node.revenue,2),fmt(node.orders),node.orders>0?fmt(node.revenue/node.orders,2):'—',root.revenue>0?pct(node.revenue/root.revenue*100):'—'];
  const total=['<strong>活动合计</strong>',...values(root)];
  return table([['下钻维度'],...crossMetricHeaders.map(label=>[label,'num'])],[total,...rows.slice(0,crossVisibleLimit).map(node=>{
    const key=encodeURIComponent(JSON.stringify(node.path)),expanded=crossExpanded.has(JSON.stringify(node.path));
    const label='<div class="cross-tree-label" style="padding-left:'+((node.path.length-1)*20)+'px">'+(node.children.size?'<button type="button" data-cross-toggle="'+key+'" aria-expanded="'+expanded+'" aria-label="'+(expanded?'收起':'展开')+escape(node.label)+'">'+(expanded?'⌄':'›')+'</button>':'<span class="cross-tree-spacer"></span>')+'<span>'+escape(node.label)+'</span><small>'+crossDimensions[performanceCrossKeys[node.path.length-1]].label+'</small></div>';
    return [label,...values(node)];
  })])+(rows.length>crossVisibleLimit?'<button type="button" class="compact-action" data-cross-action="more">显示更多（剩余 '+(rows.length-crossVisibleLimit)+' 行）</button>':'');
}
function updateCrossView(structure=false,message=''){
  const activity=currentPerformanceActivity();if(!activity)return;
  if(structure){crossExpanded.clear();crossVisibleLimit=60;document.querySelector('#cross-builder-controls').innerHTML=crossControlsHTML()}
  document.querySelector('#performance-cross-results').innerHTML=performanceCrossPreview(activity);
  const status=document.querySelector('#cross-announcement');if(status)status.textContent=message;
}
function insertCrossDimension(key,before){
  if(!selectableCrossKeys.includes(key)||key===before)return;
  performanceCrossKeys=performanceCrossKeys.filter(k=>k!==key);
  const index=before?performanceCrossKeys.indexOf(before):-1;
  performanceCrossKeys.splice(index<0?performanceCrossKeys.length:index,0,key);
  updateCrossView(true,'下钻路径：'+performanceCrossKeys.map(k=>crossDimensions[k].label).join(' → '));
}

function activityExportSheets(activity,crossOnly){
  const s=activity.activity_summary,m=activity.metrics,kpis=activityEconomics(s);
  const cross=performanceCrossRows(activity,performanceCrossKeys).sort((a,b)=>(crossSortDescending?-1:1)*(a[performanceCrossKeys.length+(crossSortMetric==='orders'?1:0)]-b[performanceCrossKeys.length+(crossSortMetric==='orders'?1:0)]));
  const dimensions=performanceCrossKeys.map(key=>crossDimensions[key].label);
  const sheets=[['筛选与口径',['项目','内容'],[
    ['活动',s.name],['编号',s.activity_id],['活动类型',s.type],['活动目标',s.goal],['覆盖门店',s.stores.length],['活动来源',s.scenario?'新增活动方案':'v9 活动主表'],['目标人群',s.target_audience||'—'],['计划预算（HKD）',s.planned_budget??null],['数据截止',meta.data_cutoff||'2026-10-31'],
    ['档期',s.start+' 至 '+s.end+(invalidWindow(s)?'（日期倒挂）':'')],
    ['数据来源',meta.source_file||meta.source],['交叉维度',dimensions.join(' → ')||'未选择'],['交叉排序',(crossSortMetric==='orders'?'总单量':'总营收')+(crossSortDescending?'降序':'升序')],['下钻视图','当前下钻视图对应页面已显示层级和行数；交叉分析表包含全部最细组合；父级与子级为包含关系，不可重复加总。'],
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
  if(dimensions.length){const {root,rows}=crossVisibleNodes(activity);sheets.push(['当前下钻视图',['层级','维度','分组路径',...crossMetricHeaders],rows.slice(0,crossVisibleLimit).map(node=>[node.path.length,crossDimensions[performanceCrossKeys[node.path.length-1]].label,node.path.join(' → '),node.revenue,node.orders,node.orders>0?node.revenue/node.orders:null,root.revenue>0?node.revenue/root.revenue*100:null])]);}
  return sheets;
}

function currentPerformanceActivity(){
  const id=document.querySelector('[data-performance-activity]')?.dataset.performanceActivity;
  return comparisonActivities().some(s=>s.activity_id===id)?activities[id]:null;
}

document.addEventListener('change',event=>{
  if(!event.target.matches('[data-cross-sort]'))return;
  crossSortMetric=event.target.value;updateCrossView();
});
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-cross-add],[data-cross-remove],[data-cross-move],[data-cross-toggle],[data-cross-action]');if(!button)return;
  if(button.dataset.crossAdd){insertCrossDimension(button.dataset.crossAdd);return}
  if(button.dataset.crossRemove){performanceCrossKeys=performanceCrossKeys.filter(k=>k!==button.dataset.crossRemove);updateCrossView(true);return}
  if(button.dataset.crossMove){const i=performanceCrossKeys.indexOf(button.dataset.crossMove),j=i+Number(button.dataset.step);if(j>=0&&j<performanceCrossKeys.length)[performanceCrossKeys[i],performanceCrossKeys[j]]=[performanceCrossKeys[j],performanceCrossKeys[i]];updateCrossView(true);return}
  if(button.dataset.crossToggle){const key=decodeURIComponent(button.dataset.crossToggle);if(crossExpanded.has(key))crossExpanded.delete(key);else crossExpanded.add(key);updateCrossView();return}
  const action=button.dataset.crossAction;
  if(action==='sort'){crossSortDescending=!crossSortDescending;button.textContent=crossSortDescending?'↓':'↑'}
  if(action==='collapse')crossExpanded.clear();
  if(action==='expand'){const activity=currentPerformanceActivity();if(!activity)return;const visit=node=>{for(const n of node.children.values()){if(n.children.size)crossExpanded.add(JSON.stringify(n.path));visit(n)}};visit(crossTree(activity))}
  if(action==='more')crossVisibleLimit+=100;
  updateCrossView();
});
let crossDraggingKey;
document.addEventListener('dragstart',event=>{
  const chip=event.target.closest?.('[data-cross-drag]');if(!chip)return;
  crossDraggingKey=chip.dataset.crossDrag;event.dataTransfer.setData('application/x-pacific-cross',crossDraggingKey);event.dataTransfer.effectAllowed='move';chip.classList.add('cross-dragging');event.stopPropagation();
});
document.addEventListener('dragover',event=>{
  const zone=event.target.closest?.('[data-cross-drop],[data-cross-bank]');if(!zone||!crossDraggingKey)return;
  event.preventDefault();event.dataTransfer.dropEffect='move';zone.classList.add('cross-drop-active');
});
document.addEventListener('dragleave',event=>{const zone=event.target.closest?.('[data-cross-drop],[data-cross-bank]');if(zone&&!zone.contains(event.relatedTarget))zone.classList.remove('cross-drop-active')});
document.addEventListener('drop',event=>{
  const zone=event.target.closest?.('[data-cross-drop],[data-cross-bank]');if(!zone||!crossDraggingKey)return;
  event.preventDefault();event.stopPropagation();const key=crossDraggingKey;crossDraggingKey=undefined;
  if(zone.matches('[data-cross-bank]')){performanceCrossKeys=performanceCrossKeys.filter(k=>k!==key);updateCrossView(true)}
  else{const chip=event.target.closest('[data-cross-drag]');insertCrossDimension(key,chip?.dataset.crossDrag)}
  document.querySelectorAll('.cross-drop-active,.cross-dragging').forEach(el=>el.classList.remove('cross-drop-active','cross-dragging'));
});
document.addEventListener('dragend',()=>{crossDraggingKey=undefined;document.querySelectorAll('.cross-drop-active,.cross-dragging').forEach(el=>el.classList.remove('cross-drop-active','cross-dragging'))});

document.addEventListener('click',event=>{
  const button=event.target.closest?.('#export-performance,#export-performance-cross');
  if(!button)return;
  const activity=currentPerformanceActivity();
  if(!activity)return;
  const crossOnly=button.id==='export-performance-cross';
  if(crossOnly&&!performanceCrossKeys.length){
    document.querySelector('#performance-cross-results').innerHTML='<p role="status">请先拖入分析维度，再导出。</p>';
    return;
  }
  const s=activity.activity_summary;
  const name=s.name.replace(/[\\/:*?"<>|]/g,'_');
  downloadWorkbook(activityExportSheets(activity,crossOnly),'太平洋咖啡_'+s.activity_id+'_'+name+'_'+(crossOnly?'交叉分析':'活动效果'));
});
