'use strict';

function performanceIndicators(activity) {
  const rows=goalPerformanceIndicators(activity);
  const {reported_new_members,new_members_reached,first_orders_7d}=activity.performance||{};
  if(numeric(reported_new_members))rows.push(['窗口内新会员（活动主表）',fmt(reported_new_members),'取自 活动主表。']);
  if(numeric(new_members_reached))rows.push(
    ['触达新会员',fmt(new_members_reached),'取自 活动预算与效果校准表的新会员触达转化记录。'],
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
      ['同期会员增加量',count(signups),'全网同期首次注册记录数。工作簿没有销户变动或注册来源与活动的关联，无法归因或计算会员净增。']
    ];
    case '提频': return [
      ['会员人均订单',buyers>0?fmt((activity.performance.member_orders??orders)/buyers,2):'—','覆盖门店已识别会员订单量 ÷ 去重消费会员；不含匿名散客。'],
      ['重复购买率',share(repeat_buyers,buyers),'覆盖门店统计期内至少消费两单的去重会员 ÷ 去重消费会员。']
    ];
    case '唤醒': return [
      ['历史沉默回购会员',count(dormant_returners),'活动前连续 30 天在全网无购买、有更早购买记录，且统计期内在覆盖门店消费的去重会员。历史不足 30 天时留空。'],
      ['沉默回购者占比',share(dormant_returners,buyers),'历史沉默回购会员 ÷ 覆盖门店去重消费会员。属于消费观察。']
    ];
    case '推新品': return [
      ['新品营收','—','覆盖门店内目标新品的订单行实收金额之和。缺活动与目标 SKU 映射及商品行实收金额。'],
      ['新品订单渗透率','—','含目标新品的订单数 ÷ 同期覆盖门店总单量数。缺活动与目标 SKU 映射。']
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
  const title=isRevenue?'总营收':key==='orders'?'总单量':'客单价';
  const points=activity.trend.series.revenue.map(point=>{
    const count=orders.get(point.date);
    const value=isRevenue?point.actual:key==='orders'?(numeric(point.actual)?count||0:null):
      count>0&&numeric(point.actual)?point.actual/count:null;
    return {date:point.date,actual:value,baseline:null};
  });
  return chart(points,{axisGroup:key==='basket'?'basket':'daily-total',heading:'每日'+title,unit:key==='orders'?'单':'HKD',first:title,start:s.start,end:s.end});
}

function performanceStoreTypeDonut(activity){
  const rows=(activity.breakdown.dimensions.store_type?.rows||[]).filter(row=>numeric(row.revenue)&&row.revenue>0).sort((a,b)=>b.revenue-a.revenue);
  const total=rows.reduce((sum,row)=>sum+row.revenue,0);
  if(!total)return '<section class="panel pad store-revenue-panel"><h2>门店类型营收</h2><p class="sub">暂无可用门店营收。</p></section>';
  const colors=['#9b3441','#557b76','#a9988d','#7b8496','#73604e','#996f83'];
  const covered=new Set(activity.activity_summary.stores),counts={};
  revenueData.stores.forEach(shop=>{if(covered.has(shop.name))counts[shop.type]=(counts[shop.type]||0)+1});
  let angle=-Math.PI/2;
  const tip=row=>row.dimension_value+'\n营收 '+fmt(row.revenue,2)+' HKD · 占比 '+pct(row.revenue/total*100)+(counts[row.dimension_value]?'\n覆盖 '+counts[row.dimension_value]+' 家门店':'');
  const paths=rows.map((row,i)=>{
    const sweep=row.revenue/total*Math.PI*2,finish=angle+sweep,end=sweep>=2*Math.PI?finish-.00001:finish;
    const at=(radius,a)=>[100+radius*Math.cos(a),100+radius*Math.sin(a)].join(',');
    const d='M'+at(78,angle)+' A78,78 0 '+(sweep>Math.PI?1:0)+' 1 '+at(78,end)+' L'+at(53,end)+' A53,53 0 '+(sweep>Math.PI?1:0)+' 0 '+at(53,angle)+'Z';angle=finish;
    return '<path class="channel-sector" d="'+d+'" fill="'+colors[i%colors.length]+'" tabindex="0" role="img" data-channel-index="'+i+'" data-metric-help="'+escape(tip(row))+'" aria-label="'+escape(tip(row))+'"/>';
  }).join('');
  return '<section class="panel pad channel-panel store-revenue-panel"><h2>门店类型营收</h2><div class="store-revenue-donut-layout"><div class="channel-donut-svg"><svg viewBox="0 0 200 200" role="group" aria-label="门店类型营收占比">'+paths+'</svg><div class="donut-center"><strong>'+ (total>=10000?fmt(total/1000,1)+'k':fmt(total,0))+'</strong><small>总营收 HKD</small></div></div><div class="channel-donut-key">'+rows.map((row,i)=>'<div tabindex="0" data-channel-index="'+i+'" data-metric-help="'+escape(tip(row))+'"><i style="background:'+colors[i%colors.length]+'"></i><span>'+escape(row.dimension_value)+'<small>'+fmt(row.revenue,2)+' HKD</small></span><strong>'+pct(row.revenue/total*100)+'</strong></div>').join('')+'</div></div></section>';
}

function performanceReachPanel(activity){
  const m=activity.metrics,hasMessages=numeric(m.sent)&&m.sent>0,hasAds=numeric(m.ad_impressions)&&m.ad_impressions>0;
  const delivery=hasMessages&&numeric(m.delivered)?m.delivered/m.sent*100:null;
  const messageHelp='App推送、短信等会员通知的发送与送达记录；包含打开、点击状态的消息视为已送达。按消息条数统计，不代表去重人数，与付费广告曝光不是同一批数据。';
  const adsHelp='付费媒体的曝光、点击与媒体花费；与会员通知是并行触达渠道，不能把消息送达当作广告曝光的下一步，也不能相加成总触达人数。';
  const icon=kind=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+(kind==='message'?'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>':'<path d="m4 10 13-5v14L4 14zM4 10H2v4h2m4 2 1 5h3l-1-4m10-9 2-2m-2 12 2 2"/>')+'</svg>';
  return '<section class="panel pad reach-performance"><div class="row spread"><h2>活动触达</h2></div><div class="reach-columns">'+
    '<section class="reach-channel"><h3 tabindex="0" data-metric-help="'+escape(messageHelp)+'">'+icon('message')+'会员通知</h3>'+
    (hasMessages?performanceCards([['发送记录',fmt(m.sent),messageHelp],['已送达',numeric(m.delivered)?fmt(m.delivered):'—','已送达消息条数，含打开与点击状态；不是去重人数。'],['送达率',numeric(delivery)?pct(delivery):'—','已送达消息条数 ÷ 发送记录 × 100%。']])+
      (numeric(delivery)?'<div class="reach-delivery-track" role="img" aria-label="'+escape('送达率 '+pct(delivery))+'"><i style="width:'+Math.max(0,Math.min(100,delivery))+'%"></i></div>':''):'<p class="sub reach-empty">暂无会员通知记录</p>')+'</section>'+
    '<section class="reach-channel"><h3 tabindex="0" data-metric-help="'+escape(adsHelp)+'">'+icon('ads')+'付费广告</h3>'+
    (hasAds?performanceCards([['曝光',fmt(m.ad_impressions),adsHelp],['点击',numeric(m.ad_clicks)?fmt(m.ad_clicks):'—','付费广告点击次数，不能与会员通知的点击记录混用。'],['点击率',numeric(m.ad_clicks)?pct(m.ad_clicks/m.ad_impressions*100):'—','广告点击次数 ÷ 广告曝光次数 × 100%。'],['媒体花费',numeric(m.ad_spend)?fmt(m.ad_spend,2)+' HKD':'—','仅付费媒体花费，已包含在活动投入中，不重复计入。']]):'<p class="sub reach-empty">暂无付费广告记录</p>')+'</section></div></section>';
}

function performanceCards(rows){
  const common=new Set(['总营收','总单量','客单价']);
  return '<div class="performance-cards">'+rows.map(([label,value,formula])=>
    '<div class="metric"><div class="muted">'+metricHelpLabel(metricDisplay(label),formula)+'</div>'+
    '<div class="big">'+escape(metricDisplay(value))+'</div></div>').join('')+'</div>';
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
    '<div class="activity-picker"><label>搜索活动 <span class="activity-picker-input"><input type="search" data-performance-filter="query" autocomplete="off" value="'+escape(performanceFilters.query)+
    '" placeholder="活动名称或编号" aria-controls="performance-options"><button type="button" id="toggle-performance-options" aria-label="展开活动清单" aria-expanded="false">⌄</button></span></label>'+
    '<div id="performance-options" class="activity-picker-options" hidden>'+
    (matching.length?matching.map(s=>'<button type="button" data-choose-performance="'+s.activity_id+'"><strong>'+escape(s.name)+
      '</strong><small>'+escape(s.activity_id)+' · '+escape(s.type)+'</small></button>').join(''):'<p class="sub">没有匹配活动。</p>')+'</div></div>'+
    select('type','活动类型',[...new Set(allowed.map(s=>s.type))])+
    select('goal','活动目标',[...new Set(allowed.map(s=>s.goal))])+
    select('status','活动状态',campaignStatuses)+
    '<button type="button" id="clear-performance-filters">清除筛选</button>'+
    '<span class="sub" role="status">找到 '+matching.length+' 场活动</span></div>'+
    '</section>';
}

function goalFocusPanel(activity){
  const s=activity.activity_summary,p=activity.performance||{};
  const number=n=>numeric(n)?fmt(n):'—';
  const ring=(numerator,denominator,label)=>{
    const value=numeric(numerator)&&denominator>0?numerator/denominator*100:null;
    if(!numeric(value))return '<div class="goal-ring-empty"><strong>—</strong><span>'+label+'</span></div>';
    const segment=(share,start,fill,text)=>{
      if(share<=0)return '';
      const finish=start+Math.min(share,99.9999)/100*Math.PI*2;
      const at=(angle,r)=>[80+r*Math.cos(angle),80+r*Math.sin(angle)].join(',');
      const large=share>50?1:0;
      const d='M'+at(start,65)+' A65,65 0 '+large+' 1 '+at(finish,65)+' L'+at(finish,51)+
        ' A51,51 0 '+large+' 0 '+at(start,51)+'Z';
      return '<path class="goal-ring-segment" d="'+d+'" fill="'+fill+'" tabindex="0" role="img" aria-label="'+escape(text)+
        '" data-metric-help="'+escape(text)+'"/>';
    };
    const safe=Math.max(0,Math.min(100,value));
    const mainTip=label+' · '+fmt(numerator)+' 人 / '+fmt(denominator)+' 人 · '+pct(value);
    const otherTip='其他消费会员 · '+fmt(Math.max(0,denominator-numerator))+' 人 · '+pct(100-safe);
    return '<div class="goal-ring-refined"><svg viewBox="0 0 160 160" aria-label="'+escape(label)+'">'+
      segment(safe,-Math.PI/2,'#a33142',mainTip)+
      segment(100-safe,-Math.PI/2+safe/100*Math.PI*2,'#e7ddd5',otherTip)+
      '</svg><div class="goal-ring-center"><strong>'+pct(value)+'</strong><span>'+label+'</span></div></div>';
  };
  let visualization='';
  if(s.goal==='拉新'){
    visualization='<div class="goal-acquisition">'+ring(p.new_buyers,p.buyers_with_signup,'新客占比')+
      '<div class="goal-conversion"><h3>新会员首单转化</h3><div class="goal-steps">'+
      '<div><strong>'+number(p.new_members_reached)+'</strong><span>触达新会员</span></div><span class="goal-step-arrow">→</span>'+
      '<div><strong>'+number(p.first_orders_7d)+'</strong><span>触后 7 天首单</span></div></div>'+
      '<div class="goal-conversion-track"><i style="width:'+(p.new_members_reached>0?p.first_orders_7d/p.new_members_reached*100:0)+'%"></i></div>'+
      '<p class="sub">'+(p.new_members_reached>0?pct(p.first_orders_7d/p.new_members_reached*100)+' 首单转化率':'暂无触达转化记录')+'</p></div></div>';
  }else if(s.goal==='提频'||s.goal==='唤醒'){
    const repeat=s.goal==='提频';
    const count=repeat?p.repeat_buyers:p.dormant_returners;
    visualization='<div class="goal-acquisition">'+ring(count,p.buyers,repeat?'重复购买率':'沉默回购者占比')+
      '<div class="goal-conversion"><h3>'+ (repeat?'重复购买会员':'沉默回购会员')+'</h3><div class="goal-main-number">'+number(count)+
      '<small>人</small></div>'+performanceGoalChart(activity)+'</div></div>';
  }else{
    visualization='<div class="goal-missing"><strong>新品表现</strong><p>补充活动与商品的对应关系后，可展示新品销售额、订单渗透率和销量趋势。</p></div>';
  }
  return '<section class="panel pad goal-focus"><div class="row spread"><h2>'+escape(s.goal)+'目标表现</h2>'+
    '<span class="goal-priority">核心表现</span></div>'+visualization+
    '<details class="goal-details"><summary>查看目标指标</summary>'+performanceCards(performanceIndicators(activity))+'</details></section>';
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
    main.innerHTML='<a class="back tiny" href="#summary/activity">← 返回按活动</a>'+head('活动效果分析','')+filterPanel+'<section class="panel pad">没有符合条件的活动。</section>';
    return;
  }
  const a=activities[selected.activity_id];
  const kpis=activityEconomics(selected);
  const goal=performanceIndicators(a);
  const {revenue,orders,sent,delivered}=a.metrics;
  const general=[
    ['总营收',numeric(revenue)?fmt(revenue,2)+' HKD':'—','活动窗口内覆盖门店的会员与散客实收总额。'],
    ['总单量',numeric(orders)?fmt(orders):'—','活动窗口内覆盖门店的会员与散客交易笔数。'],
    ['客单价',orders>0?fmt(revenue/orders,2)+' HKD':'—','总营收 ÷ 总单量。'],
    ['活动投入（HKD）',numeric(kpis.cost)?fmt(kpis.cost,2):'—','活动全期总投入。'],
    ['ROI（校准）',numeric(kpis.roi)?pct(kpis.roi):'—',economicsHeaders.roi.help],
    ['广告 CPM',numeric(kpis.cpm)?fmt(kpis.cpm,2)+' HKD':'—',economicsHeaders.cpm.help]
  ];
  const types=a.breakdown.dimensions.store_type.rows;
  const stores=a.breakdown.dimensions.store.rows.slice().sort((x,y)=>y.revenue-x.revenue);
  main.innerHTML='<a class="back tiny" href="#summary/activity">← 返回按活动</a>'+head('活动效果分析','')+filterPanel+
    '<section class="panel pad performance-overview" data-performance-activity="'+selected.activity_id+'"><div class="row spread"><h2>'+
    escape(selected.name)+'</h2><div class="row performance-actions"><button type="button" class="compact-action accent-action" id="export-performance"><span class="action-symbol" aria-hidden="true">↓</span>导出 Excel</button><a class="compact-action" href="#analysis/compare/'+selected.activity_id+'"><span class="action-symbol" aria-hidden="true">⇄</span>对比分析</a></div></div>'+
    '<p class="sub">'+escape(selected.type)+' · '+escape(selected.goal)+' · '+selected.stores.length+' 家覆盖门店 · '+
    (invalidWindow(selected)?durationLabel(selected):escape(selected.start)+' 至 '+escape(selected.end))+'</p>'+
    (selected.scenario?'<p class="sub scenario-campaign-note">新增活动方案 · '+escape(selected.target_audience)+' · 计划预算 '+fmt(selected.planned_budget,0)+' HKD。经营数据截至 '+meta.data_cutoff+'；实际投入、ROI 与 CPM 待投放记录补齐。</p>':'')+
    '<div class="routine-metrics">'+performanceCards(general)+'</div></section>'+
    goalFocusPanel(a)+
    '<div class="performance-grid"><section class="panel pad performance-trend"><div class="row spread"><h2>每日经营趋势</h2>'+
    '<label>指标 <select id="performance-trend-metric"><option value="revenue">总营收</option>'+
    '<option value="orders">总单量</option><option value="basket">客单价</option></select></label></div>'+
    '<div id="performance-trend" data-id="'+selected.activity_id+'">'+performanceTrend(a,'revenue')+'</div></section>'+

    performanceStoreTypeDonut(a)+
    performanceReachPanel(a)+'</div>'+
    (stores.length?'<details class="panel fold"><summary>查看 '+stores.length+' 家门店明细</summary>'+
    table([['门店'],['总营收（HKD）','num'],['总单量','num']],stores.map(row=>
      [escape(row.dimension_value),fmt(row.revenue,2),fmt(row.orders)]))+'</details>':'')+
    performanceCrossPanel(a)+
    '';
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

function openPerformanceOptions(open){
  const menu=document.querySelector('#performance-options');
  if(!menu)return;
  menu.hidden=!open;
  document.querySelector('#toggle-performance-options').setAttribute('aria-expanded',String(open));
}
document.addEventListener('focusin',event=>{
  if(event.target.matches('[data-performance-filter="query"]'))openPerformanceOptions(true);
});
document.addEventListener('click',event=>{
  const chosen=event.target.closest('[data-choose-performance]');
  if(chosen){
    performanceFilters.query=chosen.dataset.choosePerformance;
    renderPerformance(chosen.dataset.choosePerformance);
    location.hash='#analysis/performance/'+chosen.dataset.choosePerformance;
    return;
  }
  if(event.target.closest('#toggle-performance-options')){
    openPerformanceOptions(document.querySelector('#performance-options').hidden);
    return;
  }
  if(event.target.matches('[data-performance-filter="query"]'))openPerformanceOptions(true);
  else if(!event.target.closest('.activity-picker'))openPerformanceOptions(false);
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')openPerformanceOptions(false);
  if(event.target.matches('[data-performance-filter="query"]')&&event.key==='ArrowDown'){
    event.preventDefault();openPerformanceOptions(true);
    document.querySelector('[data-choose-performance]')?.focus();
  }
});
