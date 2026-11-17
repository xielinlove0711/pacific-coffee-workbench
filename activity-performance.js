'use strict';

function performanceIndicators(activity) {
  const rows=goalPerformanceIndicators(activity);
  const {reported_new_members,new_members_reached,first_orders_7d}=activity.performance||{};
  if(numeric(reported_new_members))rows.push(['窗口内新会员（活动主表）',fmt(reported_new_members),'取自 v7 (5) 活动主表。']);
  if(numeric(new_members_reached))rows.push(
    ['触达新会员',fmt(new_members_reached),'取自 v7 (5) 活动预算与效果校准表的新会员触达转化记录。'],
    ['触后 7 天首单',fmt(first_orders_7d),'按工作簿记录，触达后 7 天内首次下单的新会员数。'],
    ['触后 7 天首单转化率',new_members_reached>0?pct(first_orders_7d/new_members_reached*100):'—','触后 7 天首单人数 ÷ 触达新会员人数。']
  );
  return rows;
}

function goalPerformanceIndicators(activity) {
  const {buyers,new_buyers,buyers_with_signup,signups,repeat_buyers,dormant_returners}=activity.performance||{};
  const {orders}=activity.metrics;
  const share=(n,d)=>d>0&&numeric(n)?pct(n/d*100):'—';
  const count=n=>numeric(n)?fmt(n):'—';
  switch(activity.activity_summary.goal){
    case '拉新': return [
      ['新客占比',share(new_buyers,buyers_with_signup),'活动覆盖门店内，统计期注册且有消费的去重会员 ÷ 同期有注册日期的去重消费会员。'],
      ['覆盖门店新注册消费会员',count(new_buyers),'注册与消费均落在统计期，且在覆盖门店有消费的去重会员。'],
      ['同期会员增加量（全网）',count(signups),'全网同期首次注册记录数。工作簿没有销户变动或注册来源与活动的关联，无法归因或计算会员净增。']
    ];
    case '提频': return [
      ['会员人均订单',buyers>0?fmt(orders/buyers,2):'—','覆盖门店会员订单量 ÷ 去重消费会员。'],
      ['重复购买率',share(repeat_buyers,buyers),'覆盖门店统计期内至少消费两单的去重会员 ÷ 去重消费会员。']
    ];
    case '唤醒': return [
      ['历史沉默回购会员',count(dormant_returners),'活动前连续 30 天在全网无购买、有更早购买记录，且统计期内在覆盖门店消费的去重会员。历史不足 30 天时留空。'],
      ['沉默回购者占比',share(dormant_returners,buyers),'历史沉默回购会员 ÷ 覆盖门店去重消费会员。属于消费观察。']
    ];
    case '推新品': return [
      ['新品营收','—','覆盖门店内目标新品的订单行实收金额之和。v7 缺活动与目标 SKU 映射及商品行实收金额。'],
      ['新品订单渗透率','—','含目标新品的订单数 ÷ 同期覆盖门店会员订单数。v7 缺活动与目标 SKU 映射。']
    ];
    default: return [];
  }
}

function performanceBars(rows,format){
  const available=rows.filter(([,value])=>numeric(value));
  if(!available.length)return '<p class="sub">暂无可用数据。</p>';
  const scale=Math.max(1,...available.map(([,value])=>value));
  return '<div class="performance-bars">'+available.map(([label,value])=>
    '<div class="performance-bar"><span>'+escape(label)+'</span><strong>'+escape(format(value))+'</strong>'+
    '<div class="performance-track" aria-hidden="true"><i style="width:'+Math.max(0,value/scale*100)+'%"></i></div></div>'
  ).join('')+'</div>';
}

function performanceGoalChart(activity){
  const p=activity.performance||{};
  const rows={
    '拉新':[['同期注册消费会员',p.new_buyers],['较早注册消费会员',p.buyers_with_signup-p.new_buyers]],
    '提频':[['购买至少两单',p.repeat_buyers],['购买一单',p.buyers-p.repeat_buyers]],
    '唤醒':[['历史沉默回购会员',p.dormant_returners],['其他消费会员',numeric(p.dormant_returners)?p.buyers-p.dormant_returners:null]]
  }[activity.activity_summary.goal];
  return rows?performanceBars(rows,value=>fmt(value)+' 人'):'';
}

function performanceTrend(activity,key){
  const s=activity.activity_summary;
  const dates=revenueData.dates;
  const stores=new Set(s.stores);
  const orders=new Map();
  for(const shop of revenueData.stores){
    if(!stores.has(shop.name))continue;
    for(const [index,,count] of shop.days)orders.set(dates[index],(orders.get(dates[index])||0)+count);
  }
  const isRevenue=key==='revenue';
  const title=isRevenue?'会员营收':key==='orders'?'会员订单量':'会员客单价';
  const points=activity.trend.series.revenue.map(point=>{
    const count=orders.get(point.date);
    const value=isRevenue?point.actual:key==='orders'?(numeric(point.actual)?count||0:null):
      count>0&&numeric(point.actual)?point.actual/count:null;
    return {date:point.date,actual:value,baseline:null};
  });
  return chart(points,{heading:'每日'+title,unit:key==='orders'?'单':'港元',first:title,start:s.start,end:s.end});
}

function performanceCards(rows){
  const common=new Set(['会员营收','会员订单量','会员客单价']);
  return '<div class="performance-cards">'+rows.map(([label,value,formula])=>
    '<div class="metric"><div class="muted">'+(common.has(label)?escape(label):metricHelpLabel(label,formula))+'</div>'+
    '<div class="big">'+escape(value)+'</div></div>').join('')+'</div>';
}

const performanceFilters={query:'',type:'',goal:'',status:''};

function matchingPerformanceActivities(activities){
  const {query,type,goal,status}=performanceFilters;
  const term=query.trim().toLowerCase();
  return activities.filter(s=>(!term||s.name.toLowerCase().includes(term)||s.activity_id.toLowerCase().includes(term))&&
    (!type||s.type===type)&&(!goal||s.goal===goal)&&(!status||campaignStatus(s)===status));
}

function performanceFilterPanel(allowed,matching,selected){
  const select=(key,label,values)=>'<label>'+label+' <select data-performance-filter="'+key+'">'+
    '<option value="">全部</option>'+values.map(value=>'<option '+(value===performanceFilters[key]?'selected':'')+
    '>'+escape(value)+'</option>').join('')+'</select></label>';
  return '<section class="panel"><div class="toolbar performance-filters">'+
    '<label>搜索活动 <input type="search" data-performance-filter="query" value="'+escape(performanceFilters.query)+
    '" placeholder="活动名称或编号"></label>'+
    select('type','活动类型',[...new Set(allowed.map(s=>s.type))])+
    select('goal','活动目标',[...new Set(allowed.map(s=>s.goal))])+
    select('status','活动状态',campaignStatuses)+
    '<button type="button" id="clear-performance-filters">清除筛选</button>'+
    '<span class="sub" role="status">找到 '+matching.length+' 场活动</span></div>'+
    (matching.length>1?'<nav class="performance-matches" aria-label="匹配活动">'+matching.map(s=>
      '<a href="#analysis/performance/'+s.activity_id+'"'+(s===selected?' aria-current="page"':'')+'>'+escape(s.name)+'</a>'
    ).join('')+'</nav>':'')+'</section>';
}

function renderPerformance(id) {
  const allowed=comparisonActivities();
  if(id&&visible().some(s=>s.activity_id===id&&isLong(s))){
    location.hash=url(id);
    return;
  }
  const matching=matchingPerformanceActivities(allowed);
  const selected=matching.find(s=>s.activity_id===id)||matching.find(s=>s.goal==='拉新')||matching[0];
  const filterPanel=performanceFilterPanel(allowed,matching,selected);
  if(!selected){
    main.innerHTML=head('活动效果分析','')+filterPanel+'<section class="panel pad">没有符合条件的活动。</section>';
    return;
  }
  const a=activities[selected.activity_id];
  const kpis=activityEconomics(selected);
  const goal=performanceIndicators(a);
  const {revenue,orders,sent,delivered}=a.metrics;
  const general=[
    ['会员营收',numeric(revenue)?fmt(revenue,2)+' 港元':'—','活动窗口内覆盖门店的会员订单实收总额。'],
    ['会员订单量',numeric(orders)?fmt(orders):'—','活动窗口内覆盖门店的会员交易笔数。'],
    ['会员客单价',orders>0?fmt(revenue/orders,2)+' 港元':'—','会员营收 ÷ 会员订单量。'],
    ['ROI（校准）',numeric(kpis.roi)?pct(kpis.roi):'—',economicsHeaders.roi.help],
    ['送达 CPM',numeric(kpis.cpm)?fmt(kpis.cpm,2)+' 港元':'—',economicsHeaders.cpm.help]
  ];
  const types=a.breakdown.dimensions.store_type.rows;
  const stores=a.breakdown.dimensions.store.rows.slice().sort((x,y)=>y.revenue-x.revenue);
  main.innerHTML=head('活动效果分析','')+filterPanel+
    '<section class="panel pad performance-overview" data-performance-activity="'+selected.activity_id+'"><div class="row spread"><h2>'+
    escape(selected.name)+'</h2><div class="row performance-actions"><button type="button" class="compact-action accent-action" id="export-performance"><span class="action-symbol" aria-hidden="true">↓</span>导出 Excel</button><a class="compact-action" href="#analysis/compare/'+selected.activity_id+'"><span class="action-symbol" aria-hidden="true">⇄</span>对比分析</a></div></div>'+
    '<p class="sub">'+escape(selected.type)+' · '+escape(selected.goal)+' · '+selected.stores.length+' 家覆盖门店 · '+
    (invalidWindow(selected)?durationLabel(selected):escape(selected.start)+' 至 '+escape(selected.end))+'</p>'+
    performanceCards(general)+'</section>'+
    '<div class="performance-grid"><section class="panel pad performance-trend"><div class="row spread"><h2>每日经营趋势</h2>'+
    '<label>指标 <select id="performance-trend-metric"><option value="revenue">会员营收</option>'+
    '<option value="orders">会员订单</option><option value="basket">会员客单价</option></select></label></div>'+
    '<div id="performance-trend" data-id="'+selected.activity_id+'">'+performanceTrend(a,'revenue')+'</div></section>'+
    '<section class="panel pad"><h2>'+escape(selected.goal)+'目标表现</h2>'+performanceCards(goal)+performanceGoalChart(a)+'</section>'+
    '<section class="panel pad"><h2>门店类型营收</h2>'+
    performanceBars(types.map(row=>[row.dimension_value,row.revenue]),value=>fmt(value,2)+' 港元')+'</section>'+
    '<section class="panel pad"><h2>活动消息送达</h2>'+
    performanceBars(sent>0?[['消息记录',sent],['已送达（含打开及点击）',delivered]]:[],value=>fmt(value)+' 条')+
    (numeric(kpis.delivery)?'<p><strong>送达率 '+pct(kpis.delivery)+'</strong></p>':'')+'</section></div>'+
    (stores.length?'<details class="panel fold"><summary>查看 '+stores.length+' 家门店明细</summary>'+
    table([['门店'],['会员营收（港元）','num'],['会员订单量','num']],stores.map(row=>
      [escape(row.dimension_value),fmt(row.revenue,2),fmt(row.orders)]))+'</details>':'')+
    performanceCrossPanel(a)+
    '<details class="panel fold"><summary>指标口径与缺数说明</summary>'+
    table([['指标'],['计算口径']], [...general,...goal].map(([label,,formula])=>[escape(label),escape(formula)]))+
    '<p class="sub">送达率＝送达记录 ÷ 活动全部消息记录。门店图按店型加总会员营收。以上数据用于观察活动期间的表现。</p></details>';
}
function updatePerformanceFilter(event){
  const key=event.target.dataset.performanceFilter;
  if(!key||(event.type==='input')!==(key==='query')||event.isComposing)return;
  performanceFilters[key]=event.target.value;
  const caret=event.target.selectionStart;
  const selected=document.querySelector('[data-performance-activity]')?.dataset.performanceActivity;
  renderPerformance(selected);
  const field=document.querySelector('[data-performance-filter="'+key+'"]');
  field.focus();
  if(key==='query'&&caret!==null)field.setSelectionRange(caret,caret);
}
document.addEventListener('input',updatePerformanceFilter);
document.addEventListener('compositionend',event=>{
  if(event.target.dataset.performanceFilter==='query')event.target.dispatchEvent(new Event('input',{bubbles:true}));
});
document.addEventListener('click',event=>{
  if(event.target.id!=='clear-performance-filters')return;
  Object.assign(performanceFilters,{query:'',type:'',goal:'',status:''});
  renderPerformance(document.querySelector('[data-performance-activity]')?.dataset.performanceActivity);
  document.querySelector('[data-performance-filter="query"]').focus();
});
document.addEventListener('change',event=>{
  updatePerformanceFilter(event);
  if(event.target.id==='performance-trend-metric'){
    const node=document.querySelector('#performance-trend');
    node.innerHTML=performanceTrend(activities[node.dataset.id],event.target.value);
  }
});
