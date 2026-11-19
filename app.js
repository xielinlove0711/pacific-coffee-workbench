'use strict';
const {activities, activity_summaries: summaries, meta, config} = window.MOCK;
const rules = config.thresholds;
const heroId = 'CMP-2026-0012';
const store = config.demo_store;
const main = document.querySelector('main');
const dialog = document.querySelector('dialog');
const picked = new Set();
const role = 'manager';
let editing = false;
let filters = {query:'', month:'', status:'', channel:'', owner:''};
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
const numeric = n => Number.isFinite(n);
const fmt = (n, digits = 0) => numeric(n) ? n.toLocaleString('zh-CN',{minimumFractionDigits:digits,maximumFractionDigits:digits}).replace('-','−') : '无可用数据';
const money = n => numeric(n) ? fmt(n/10000,1)+' 万HKD' : '无可用数据';
const ratio = n => numeric(n) ? fmt(n,2) : '暂不可估';
const date = x => (x || '').slice(0,10);
const pct = n => numeric(n) ? fmt(n,1)+'%' : '无可用数据';
const url = (id,tab='overview',anchor='') => '#activity/'+id+'/'+tab+(anchor?'/'+anchor:'');
const storeMode = () => role === 'store';
const ownRows = a => a.breakdown.dimensions.store?.rows || [];
const storeRow = a => ownRows(a).find(r=>r.dimension_value===store);
const isLong = s => s.cadence === '常设';
const campaignDays = s => Math.round((Date.parse(s.end)-Date.parse(s.start))/86400000)+1;
const durationTieOrder = s => s.activity_id.endsWith('0014') ? 'CMP-2026-0021a' : s.activity_id;
const durationOrder = (a,b) => campaignDays(b)-campaignDays(a)||durationTieOrder(a).localeCompare(durationTieOrder(b));
const invalidWindow = s => s.start>s.end;
const campaignStatuses = ['未开始','进行中','已结束'];
const hongKongDateFormat = new Intl.DateTimeFormat('sv-SE',{
  timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'
});
function campaignStatus(s,today=hongKongDateFormat.format(new Date())){
  if(isLong(s)||!s.start||!s.end||invalidWindow(s))return '';
  if(today<s.start)return '未开始';
  return today>s.end?'已结束':'进行中';
}
function compactCampaignPeriod(s){
  if(invalidWindow(s))return durationLabel(s);
  const range=displayDateRange(s.start,s.end);
  return '<span class="compact-period" tabindex="0" data-metric-help="'+escape(s.start+' 至 '+s.end)+'">'+
    range+'<small>'+campaignDays(s)+' 天</small></span>';
}
function compactStatisticsPeriod(s,from,to,today=hongKongDateFormat.format(new Date())){
  if(invalidWindow(s))return '<span class="cadence-warning">日期待核</span>';
  const status=campaignStatus(s,today);
  if(status==='未开始')return '<span class="statistics-pending" data-metric-help="活动尚未开始，暂无实际统计期间。">◷ 待开始</span>';
  const marker=status==='进行中'?'<small class="statistics-live">● 统计中</small>':'';
  if(!from||!to)return marker+'<span class="muted">暂无记录</span>';
  const range=displayDateRange(from,to);
  return '<span class="compact-period" tabindex="0" data-metric-help="'+escape('统计期间：'+from+' 至 '+to+
    (status==='进行中'?'。活动尚未结束，当前为阶段数据。':''))+'">'+range+marker+'</span>';
}
function campaignStatusIcon(s,today){
  const status=campaignStatus(s,today);
  const states={
    '未开始':{symbol:'◷',style:'upcoming'},
    '进行中':{symbol:'●',style:'running'},
    '已结束':{symbol:'✓',style:'ended'}
  };
  const state=states[status];
  return state?'<span class="campaign-status-label status-'+state.style+'"><span aria-hidden="true">'+state.symbol+
    '</span>'+status+'</span>':'';
}
const durationLabel = s => invalidWindow(s)
  ? '<span class="cadence-warning">'+String(campaignDays(s)).replace('-','−')+' 天 · 日期倒挂</span>'
  : campaignDays(s)+' 天';
const activityPeriod = s => isLong(s) ? '长期在线' : date(s.start)+' 至 '+date(s.end);
const analysisPeriod = (s,t) => '统计期间 '+escape(t.caliber?.campaign_window || date(s.start)+' 至 '+date(s.end));
const ordered = [...summaries].sort((a,b) => b.end.localeCompare(a.end));
const visible = () => ordered.filter(s => role==='manager' || (role==='ops' ? s.owner==='增长运营组' : s.stores.includes(store)));
const state = a => {
  const t=a.attribution, p=t.parallel_trend, g=t.control_group, q=a.data_quality;
  const completeness=numeric(q.completeness) && q.completeness>=rules.completeness_gate_min;
  const trend=numeric(p?.correlation) && p.correlation>=rules.parallel_correlation_min;
  const mean=numeric(p?.mean_relative_deviation) && p.mean_relative_deviation<=rules.parallel_mean_deviation_max;
  const strata=numeric(g?.max_deviation_pct) && g.max_deviation_pct<=rules.strata_deviation_max;
  const roi=t.net?.net_roi, ci=t.increment?.gross_profit_ci;
  const attributed=Boolean(g?.size && completeness && trend && mean && strata && t.confidence?.usable_for_budget && numeric(roi));
  const interval=Array.isArray(ci) && ci.length===2 && ci.every(numeric);
  const crosses=interval && ci[0]<=0 && ci[1]>=0;
  const label=!numeric(roi) ? '暂不可估' : !attributed ? '仅供参考' : !interval ? '仅供参考' : crosses ? '未观察到显著效果' : '证据通过';
  const reason=(!completeness ? '活动期有交易记录的日期不足 90%，正式报告已阻断。' : '')+(a.attribution.reason || (!completeness ? '数据完整度低于 90%，正式报告已阻断。' :
    !g?.size ? '缺少可用对照组，当前只能查看描述性表现。' :
    !trend || !mean || !strata ? '对照组可比性检查未通过或缺失，当前结果不足以支持预算决策。' :
    !numeric(roi) ? '原型数据包暂无可用的净 ROI 估计。' :
    !attributed ? '原型证据未达到预算使用条件。' :
    !interval ? '缺少可用的 95% 置信区间，显著性待判定。' :
    crosses ? '95% 置信区间包含 0，未观察到显著效果。' : '对照组检查通过，95% 置信区间排除 0。'));
  return {completeness,trend,mean,strata,roi,ci,attributed,interval,crosses,label,reason,finalize:attributed && interval && a.report.can_finalize===true};
};
const badge = s => '<span class="badge '+(s.label==='证据通过'?'ok':s.label==='暂不可估'?'':'warn')+'" title="'+escape(s.reason)+'">'+s.label+'</span>';
const metric = (label,value,note) => '<div class="metric"><div class="muted">'+label+'</div><div class="big">'+value+'</div><small>'+note+'</small></div>';
const head = (title,sub) => '<div class="pagehead"><h1>'+title+'</h1><p class="sub">'+sub+'</p></div>';
const table = (columns, records) => '<div class="scroller"><table><thead><tr>'+columns.map(([name,cls])=>'<th scope="col" class="'+(cls||'')+'">'+name+'</th>').join('')+'</tr></thead><tbody>'+records.map(record=>'<tr>'+record.map((cell,i)=>'<td class="'+(columns[i][1]||'')+'">'+cell+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const options = (values, first) => '<option value="">'+first+'</option>'+values.map(v=>'<option value="'+escape(v)+'">'+escape(v)+'</option>').join('');
const link = (id,tab,text,cls='',anchor='') => '<a class="'+cls+'" href="'+url(id,tab,anchor)+'">'+text+'</a>';
const load = id => {try{return JSON.parse(localStorage.getItem('pacific-review-'+id)) || {}}catch{return {}}};
const save = (id,value) => {try{localStorage.setItem('pacific-review-'+id,JSON.stringify(value));return true}catch{return false}};
const reportState = id => load(id).finalized ? '已定稿' : '草稿';
const revenueData=window.MOCK.revenue_summary;
const summaryScope={from:revenueData.dates.at(-15),to:revenueData.dates.at(-1),store:'',district:'',channel:'',type:''};
const viewSettings=Object.fromEntries(Object.entries({day:'name',store:'revenue',activity:'duration',overview:'duration'})
  .map(([view,sort])=>[view,{sort,direction:-1,type:'',metric:'revenue'}]));
const summaryMetricLabels={
  name:'日期',duration:'档期天数',revenue:'总营收（HKD）',orders:'总单量',
  basket:'客单价（HKD）',cost:'活动花费（HKD）',gross:'校准净增量毛利（HKD）',
  roi:'ROI（%）',cpm:'广告 CPM（HKD）',delivered:'送达记录',delivery:'送达率（%）'
};
function summaryMetricKeys(view){
  const transaction=['revenue','orders','basket'];
  const economics=['cost','roi','cpm','gross','delivered','delivery'];
  if(view==='day')return ['name',...transaction,...(dailySpendAvailable()?['cost']:[])];
  if(view==='store')return ['name',...transaction];
  if(view==='activity')return ['duration',...transaction,'cost','roi','cpm'];
  return ['duration',...economics];
}
function dailySpendAvailable(){
  return !storeMode()&&!summaryScope.store&&!summaryScope.district&&!summaryScope.channel&&!summaryScope.type;
}
function summaryMetricControls(view){
  const settings=viewSettings[view],keys=summaryMetricKeys(view);
  if(!keys.includes(settings.sort))settings.sort=keys[0];
  return '<label>排序指标 <select data-view-setting="sort">'+keys.map(key=>
    '<option value="'+key+'" '+(key===settings.sort?'selected':'')+'>'+(key==='name'&&view==='store'?'门店名称':summaryMetricLabels[key])+'</option>').join('')+'</select></label>'+
    '<button type="button" data-action="metric-direction" title="切换排序方向">'+(settings.direction===1?'↑ 升序':'↓ 降序')+'</button>';
}
function sortMetricRows(rows,view){
  const {sort,direction}=viewSettings[view];
  const value=r=>sort==='revenue'?(numeric(r.revenue)?r.revenue/100:null):r[sort];
  return [...rows].sort((a,b)=>{
    const x=value(a),y=value(b);
    if(x==null)return y==null?0:1;
    if(y==null)return -1;
    if(sort==='duration'&&x===y){
      const activityA=a.activity||activities[a.id]?.activity_summary;
      const activityB=b.activity||activities[b.id]?.activity_summary;
      return durationOrder(activityA,activityB);
    }
    return direction*(typeof x==='number'?x-y:x.localeCompare(y,'zh'));
  });
}
const basketValue=(revenue,orders)=>orders>0?revenue/orders/100:null;
let summaryView='day';
let summaryRows=[];
let overviewExportSheets=[];
let overviewChannelPanel='';
const hkd=n=>numeric(n)?fmt(n/100,2):'—';
function availableStores(){return revenueData.stores.filter(s=>!storeMode()||s.name===store)}
const estimatedSpend=revenueData.spend;
function comparison(current,previous,period){
  if(!numeric(current)||!numeric(previous)||previous===0)return '—';
  const change=(current-previous)/previous*100;
  const kind=change>0?'up':change<0?'down':'flat';
  return '<span class="change-'+kind+'" tabindex="0" data-metric-help="'+escape('环比统计期间：'+period)+'" aria-label="'+
    (change>0?'上升':change<0?'下降':'持平')+'"><span aria-hidden="true">'+
    (change>0?'↑':change<0?'↓':'→')+'</span> '+fmt(Math.abs(change),1)+'%</span>';
}

const weekdayLabel=date=>'星期'+'日一二三四五六'[new Date(date+'T00:00:00Z').getUTCDay()];

const overviewProductGroups={
  '咖啡':['热鲜奶咖啡','鲜奶咖啡','摩卡','手冲咖啡','冰美式','美式咖啡','卡布奇诺','拿铁','桂花米乳咖啡'],
  '茶饮与鸳鸯':['鸳鸯','港式奶茶','洋甘菊茶','伯爵茶'],
  '其他饮品':['朱古力','其乐冰(冷饮)'],
  '轻食':['沙律','Nutribite健康餐','三文治'],
  '糕点与节庆食品':['牛角包/糕点','芝士蛋糕','月饼(中秋)']
};

function categorySalesRows(products,current,previous,hasPrevious){
  const groupNames=Object.keys(overviewProductGroups);
  const counts=new Map([...groupNames,'未分类'].map(name=>[name,[0,0]]));
  products.forEach((product,id)=>{
    const group=groupNames.find(name=>overviewProductGroups[name].includes(product))||'未分类';
    const amounts=counts.get(group);
    amounts[0]+=current.get(id)||0;
    amounts[1]+=previous.get(id)||0;
  });
  const rows=[...counts].filter(([name,[now,before]])=>name!=='未分类'||now||before);
  const totals=rows.reduce(([current,previous],[,[now,before]])=>[current+now,previous+before],[0,0]);
  return [['合计',totals],...rows].map(([name,[now,before]])=>{
    const change=now-before;
    return [name,now,hasPrevious?before:null,hasPrevious?change:null,
      hasPrevious&&before>0?change/before*100:null,
      !hasPrevious?'缺上期数据':change>0?'增长':change<0?'下降':'持平'];
  });
}
function overviewSalesCharts(shops,from,to){
  const current=new Map(),previous=new Map(),channels=new Map();
  const previousStart=from-(to-from+1);
  for(const shop of shops){
    for(const [index,channel,product,quantity] of shop.product_sales){
      if(summaryScope.channel&&channel!==summaryScope.channel)continue;
      if(index<Math.max(0,previousStart)||index>to)continue;
      const counts=index>=from?current:previous;
      counts.set(product,(counts.get(product)||0)+quantity);
    }
    for(const [channel,rows] of Object.entries(shop.channels)){
      if(summaryScope.channel&&channel!==summaryScope.channel)continue;
      for(const [index,,orders] of rows){
        if(index>=from&&index<=to)channels.set(channel,(channels.get(channel)||0)+orders);
      }
    }
  }
  const products=revenueData.products;
  const best=[...current].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,units])=>[products[id],units]);
  const fastest=previousStart<0?[]:[...current].flatMap(([id,units])=>{
    const base=previous.get(id)||0;
    return base>=10&&units>base?[[products[id],base,units,(units-base)/base*100]]:[];
  }).sort((a,b)=>b[3]-a[3]).slice(0,5);
  const totalOrders=[...channels.values()].reduce((sum,n)=>sum+n,0);
  const channelNames={pos:'门店 POS',app_preorder:'App 预点',foodpanda:'foodpanda',keeta:'Keeta'};
  const channelRows=[...channels].sort((a,b)=>b[1]-a[1]).map(([key,orders])=>[channelNames[key]||key,orders]);
  const hasPrevious=previousStart>=0;
  const bestRows=best.map(([name,units],i)=>{
    const base=previous.get(products.indexOf(name))||0;
    return ['畅销榜',i+1,name,units,hasPrevious?base:null,hasPrevious&&base>0?(units-base)/base*100:null];
  });
  const growthRows=fastest.map(([name,base,units,rate],i)=>['增长榜',i+1,name,units,base,rate]);
  overviewExportSheets.push(
    ['商品榜单',['榜单','排名','商品','本期销量（件）','上期销量（件）','增长率（%）'],[...bestRows,...growthRows]],
    ['全品类销量',['品类','本期销量（件）','上期销量（件）','增减量（件）','变化率（%）','变化方向'],
      categorySalesRows(products,current,previous,hasPrevious)],
    ['订单渠道',['渠道','订单量','订单占比（%）'],channelRows.map(([label,n])=>[label,n,n/totalOrders*100])]
  );
  overviewChannelPanel=channelDonutPanel(channelRows,totalOrders);
  return '<div class="overview-sales-grid">'+overviewChannelPanel+
    '<section class="panel pad bestseller-panel"><h2 tabindex="0" data-metric-help="当前期间销量前 5，按件数统计">畅销商品</h2>'+
    performanceBars(best,n=>fmt(n)+' 件')+'</section>'+
    '<section class="panel pad growth-panel"><h2 tabindex="0" data-metric-help="较上一等长区间，基准销量至少 10 件">销量增长最快</h2>'+
    (previousStart<0?'<p class="sub">上一等长区间超出数据范围。</p>':
      fastest.length?'<div class="performance-bars">'+fastest.map(([name,,units,rate],index)=>
        '<div class="growth-list-row"><span class="growth-rank">'+(index+1)+'</span><span class="growth-product">'+escape(name)+
        '<small>'+fmt(units)+' 件</small></span><strong class="growth-rate">↑ '+pct(rate)+'</strong></div>'
      ).join('')+'</div>':'<p class="sub">暂无符合条件的增长商品。</p>')+'</section>'+'</div>';
}
function summary(){
  const dates=revenueData.dates;
  const from=dates.indexOf(summaryScope.from),to=dates.indexOf(summaryScope.to);
  const allowed=availableStores();
  const selected=storeMode()?store:summaryScope.store;
  const included=allowed.filter(s=>(!selected||s.name===selected)&&(!summaryScope.district||s.district===summaryScope.district));
  const days=dates.slice(from,to+1).map(name=>({name,revenue:null,orders:null}));
  let total=0,orderTotal=0;
  for(const shop of included){
    for(const [d,revenue,orders] of scopedDays(shop)){
      if(d<from||d>to)continue;
      const day=days[d-from];
      day.revenue=(day.revenue??0)+revenue;
      day.orders=(day.orders??0)+orders;
      total+=revenue;
      orderTotal+=orders;
    }
  }
  const recorded=days.filter(d=>d.orders!==null).length;
  const controls='<div class="toolbar summary-scope"><label>开始日期 <input type="date" data-scope="from" value="'+summaryScope.from+'" min="'+dates[0]+'" max="'+summaryScope.to+'"></label><label>结束日期 <input type="date" data-scope="to" value="'+summaryScope.to+'" min="'+summaryScope.from+'" max="'+dates.at(-1)+'"></label>'+
    (storeMode()?'<span>'+escape(store)+'</span>':'<label>门店 <select data-scope="store">'+options(allowed.map(s=>s.name),'全部门店')+'</select></label>')+summaryFilters(allowed)+'</div>';
  const titles={overview:'数据总览',day:'按日',store:'按门店',activity:'按活动'};
  const overview=summaryView==='overview';
  const costAvailable=dailySpendAvailable();
  const costs=estimatedSpend.slice(from,to+1);
  const costTotal=costAvailable&&costs.some(numeric)?costs.reduce((sum,n)=>sum+(n??0),0):null;
  const registrations=revenueData.daily_registrations.slice(from,to+1).reduce((sum,n)=>sum+n,0);
  const prevStart=from-days.length;
  const priorPeriod=prevStart>=0?dates[prevStart]+' 至 '+dates[from-1]:'上一等长区间超出数据范围';
  let priorRevenue=null;
  if(prevStart>=0){
    for(const shop of included)for(const [d,revenue] of scopedDays(shop)){
      if(d>=prevStart&&d<from)priorRevenue=(priorRevenue??0)+revenue;
    }
  }
  const priorCosts=prevStart>=0&&costAvailable?estimatedSpend.slice(prevStart,from):[];
  const priorSpend=priorCosts.some(numeric)?priorCosts.reduce((sum,n)=>sum+(n??0),0):null;
  const revenueChange=overview?comparison(recorded?total:null,priorRevenue,priorPeriod):'';
  const spendChange=overview&&costAvailable?comparison(costTotal,priorSpend,priorPeriod):'';
  const metricWithChange=(label,value,change)=>'<div class="metric"><div class="muted">'+label+
    '</div><div class="metric-value-row"><div class="big">'+value+'</div><span class="metric-change">'+change+'</span></div></div>';
  main.innerHTML='<div class="row spread summary-page-head">'+head(titles[summaryView],'会员与散客交易')+
    '<button type="button" class="compact-action accent-action no-print" data-action="export-summary"><span class="action-symbol" aria-hidden="true">↓</span>导出 Excel</button></div>'+
    '<section class="panel">'+controls+'</section><section class="metrics">'+
    (overview?metricWithChange('总营收（HKD）',recorded?hkd(total):'—',revenueChange):
      metric('总营收（HKD）',recorded?hkd(total):'—',escape(selected||'全部门店')))+
    metric(overview?'总单量':'总单量',recorded?fmt(orderTotal):'—',overview?'':'单')+
    (overview?metric('会员总数',fmt(revenueData.member_count),'')+
      metric('新增会员数',fmt(registrations),''):'')+
    metric(overview?'客单价（HKD）':'客单价（HKD）',orderTotal?hkd(total/orderTotal):'—','')+
    (overview?metricWithChange('活动投入（HKD）',hkd(costTotal),spendChange):'')+
    (overview?'<div class="metric"><div class="muted">有记录天数</div><div class="big" tabindex="0" data-metric-help="所选范围内">'+recorded+' / '+days.length+'</div></div>':
      metric('有交易记录的天数',recorded+' / '+days.length,'所选范围内'))+'</section>'+
    '<div id="summary-content"></div>';
  for(const field of main.querySelectorAll('[data-scope]')){
    if(field.type==='checkbox')field.checked=!!summaryScope[field.dataset.scope];
    else field.value=summaryScope[field.dataset.scope];
  }
  const shopSelect=main.querySelector('[data-scope="store"]');
  if(shopSelect)shopSelect.value=summaryScope.store;
  if(overview){
    const content=document.querySelector('#summary-content');
    const points=days.map((d,i)=>({date:d.name,actual:numeric(d.revenue)?d.revenue/100:null,
      baseline:costAvailable&&numeric(costs[i])?costs[i]/100:null}));
    content.innerHTML=overviewTrendPanel(points);
    overviewExportSheets=[
      ['每日经营',['日期','星期','总营收（HKD）','总单量','客单价（HKD）','活动投入（HKD）'],
        days.map((d,i)=>[d.name,weekdayLabel(d.name),numeric(d.revenue)?d.revenue/100:null,d.orders,basketValue(d.revenue,d.orders),
          costAvailable&&numeric(costs[i])?costs[i]/100:null])]
    ];
    const productCharts=overviewSalesCharts(included,from,to);
    const primaryTrend=content.innerHTML;
    content.innerHTML='<div class="overview-main-layout">'+primaryTrend+overviewPatternPanels(included,from,to)+'</div>'+
      productCharts+overviewCampaignTable();
    return;
  }
  const rangeTotal=(shop,lo=from,hi=to)=>scopedDays(shop).reduce((value,[d,revenue,orders])=>{
    if(d>=lo&&d<=hi){value.revenue=(value.revenue??0)+revenue;value.orders=(value.orders??0)+orders}
    return value;
  },{revenue:null,orders:null});
  if(summaryView==='day')summaryRows=days.map((row,i)=>({...row,basket:basketValue(row.revenue,row.orders),cost:costAvailable&&numeric(costs[i])?costs[i]/100:null}));
  if(summaryView==='store')summaryRows=included.map(shop=>{
    const totals=rangeTotal(shop);
    return {...totals,name:shop.name,type:shop.type,basket:basketValue(totals.revenue,totals.orders)};
  });
  if(summaryView==='activity'){
    const fullCatalog=!summaryScope.limitActivities;
    summaryRows=scopedActivities(!fullCatalog).map(s=>{
      if(isLong(s))return {id:s.activity_id,name:s.name,revenue:null,orders:null};
      const today=hongKongDateFormat.format(new Date());
      const lower=[s.start,dates[fullCatalog?0:from]].sort().at(-1);
      const upper=[s.end,today,dates[fullCatalog?dates.length-1:to]].sort()[0];
      const lo=dates.findIndex(day=>day>=lower);
      const hi=dates.findLastIndex(day=>day<=upper);
      const valid=lo>=0&&hi>=lo&&!invalidWindow(s);
      const members=new Set(s.stores);
      let revenue=null,orders=null;
      for(const shop of included){
        if(!valid||!members.has(shop.name))continue;
        const result=rangeTotal(shop,lo,hi);
        if(result.orders===null)continue;
        revenue=(revenue??0)+result.revenue;
        orders=(orders??0)+result.orders;
      }
      return {id:s.activity_id,name:s.name,revenue,orders,basket:basketValue(revenue,orders),duration:campaignDays(s),...activityEconomics(s),period:compactStatisticsPeriod(s,valid?dates[lo]:null,valid?dates[hi]:null,today)};
    });
  }
  const settings=viewSettings[summaryView];
  const content=document.querySelector('#summary-content');
  const selector=(key,label,values,first)=>'<label>'+label+' <select data-view-setting="'+key+'">'+options(values,first)+'</select></label>';
  content.innerHTML=(summaryView==='day'?'<section class="panel pad"><div class="row spread"><h2>每日趋势</h2><label>指标 <select data-view-setting="metric"><option value="revenue">总营收</option><option value="orders">总单量</option></select></label></div><div id="summary-chart"></div></section>':'')+
    '<section class="panel"><div class="toolbar">'+
    (summaryView==='store'?selector('type','门店类型',[...new Set(included.map(s=>s.type))],'全部类型'):'')+
    summaryMetricControls(summaryView)+
    (summaryView==='store'?'<span class="sub">工作簿暂无按门店拆分的花费、ROI 或 CPM。</span>':
      summaryView==='day'&&!costAvailable?'<span class="sub">日投入仅适用于全网范围。</span>':'')+
    '</div></section>'+
    (summaryView==='activity'?'<p class="sub summary-note">默认展示全年活动目录及各活动的统计窗口。勾选「限定活动日期」可按所选日期查看。活动营收为统计期间内参与门店的会员与散客交易。活动可能重叠，各行不可加总，也不表示活动增量。</p><div id="activity-catalog"></div>':'<section class="panel" id="summary-results"></section>');
  for(const key of ['type','metric']){
    const field=content.querySelector('[data-view-setting="'+key+'"]');
    if(field)field.value=settings[key];
  }
  if(summaryView==='activity'){catalog(document.querySelector('#activity-catalog'));return}
  drawSummary();
}
function filteredSummaryRows(){
  const {type}=viewSettings[summaryView];
  const permanent=summaryView==='activity'?summaryRows.filter(r=>isLong(activities[r.id].activity_summary)):[];
  const rows=summaryRows.filter(r=>(summaryView!=='activity'||!isLong(activities[r.id].activity_summary))&&(!type||type===r.type));
  return [...permanent,...sortMetricRows(rows,summaryView)];
}

function drawSummary(){
  const settings=viewSettings[summaryView];
  const rows=filteredSummaryRows();
  const chartNode=document.querySelector('#summary-chart');
  if(chartNode){
    const isRevenue=settings.metric==='revenue';
    chartNode.innerHTML=chart([...rows].sort((a,b)=>a.name.localeCompare(b.name)).map(r=>({date:r.name,actual:isRevenue&&r.revenue!==null?r.revenue/100:r[settings.metric],baseline:null})),
      {heading:isRevenue?'每日总营收':'每日总单量',unit:isRevenue?'HKD':'单',caption:'趋势按选定日期与门店展示。无交易记录的日期留空。'});
  }
  const columns=[['name',summaryView==='day'?'日期':'门店'],...(summaryView==='store'?[['type','门店类型']]:[]),['revenue','总营收（HKD）'],['orders','总单量'],['basket','客单价（HKD）'],...(summaryView==='day'&&dailySpendAvailable()?[['cost','活动花费（HKD）']]:[]),['status','记录状态']];
  const header=columns.map(([key,label])=>{
    const direction=settings.direction===1?'ascending':'descending';
    const numericClass=['revenue','orders','basket','cost'].includes(key)?' class="num"':'';
    return '<th scope="col"'+numericClass+(settings.sort===key?' aria-sort="'+direction+'"':'')+'>'+
      ((key==='name'||summaryMetricKeys(summaryView).includes(key))?'<button class="linkbutton" data-action="summary-sort" data-key="'+key+'">'+label+(settings.sort===key?(settings.direction===1?' ↑':' ↓'):'')+'</button>':label)+'</th>';
  }).join('');
  const body=rows.map(r=>'<tr><td>'+(summaryView==='store'?'<button class="linkbutton entry" data-action="store-days" data-store="'+escape(r.name)+'">'+escape(r.name)+'</button>':r.name)+'</td>'+
    (summaryView==='store'?'<td>'+escape(r.type)+'</td>':'')+
    '<td class="num">'+hkd(r.revenue)+'</td><td class="num">'+(r.orders===null?'—':fmt(r.orders))+'</td><td class="num">'+(numeric(r.basket)?fmt(r.basket,2):'—')+'</td>'+(summaryView==='day'&&dailySpendAvailable()?'<td class="num">'+(numeric(r.cost)?fmt(r.cost,2):'—')+'</td>':'')+'<td>'+(r.orders===null?'无交易记录':'有交易记录')+'</td></tr>').join('');
  document.querySelector('#summary-results').innerHTML='<div class="table-head">符合条件 '+rows.length+(summaryView==='day'?' 天':' 家')+'</div>'+
    (rows.length?'<div class="scroller summary-table"><table><thead><tr>'+header+'</tr></thead><tbody>'+body+'</tbody></table></div>':'<p class="pad">没有符合条件的记录。</p>');
}
function catalog(container) {
  const rows=visible();
  container.innerHTML=
  '<section class="panel catalog-panel" aria-label="活动检索与列表">'+
    '<div class="toolbar" role="search" aria-label="检索活动">'+
      '<input id="query" type="search" aria-label="搜索活动名称" placeholder="⌕  搜索活动名称">'+
      '<select id="month" aria-label="结束月份">'+options([...new Set(rows.filter(s=>!isLong(s)).map(s=>date(s.end).slice(0,7)))].sort().reverse(),'全部时间')+'</select>'+
      '<select id="status" aria-label="运行状态">'+options(campaignStatuses,'全部状态')+'</select>'+
      '<details><summary class="button">更多筛选</summary><div class="filterpop">'+
        '<label>渠道<select id="channel">'+options([...new Set(rows.flatMap(s=>s.channels))],'全部渠道')+'</select></label>'+
        '<label>负责人<select id="owner">'+options([...new Set(rows.map(s=>s.owner))],'全部负责人')+'</select></label>'+
      '</div></details>'+
    '</div>'+
    '<div class="table-head row spread"><div class="row"><strong id="result-count" aria-live="polite"></strong><div id="active-filters" class="row"></div></div><div id="selection" class="row"></div></div>'+
    '<div id="listing"></div>'+
  '</section>';
  for(const key of Object.keys(filters)) document.getElementById(key).value=filters[key];
  list();
}
function list(){
  const q=filters.query.trim().toLowerCase();
  const metricsById=new Map(filteredSummaryRows().map(row=>[row.id,row]));
  const byId=new Map(visible().map(s=>[s.activity_id,s]));
  const scope=[...metricsById.keys()].map(id=>byId.get(id)).filter(Boolean);
  const today=hongKongDateFormat.format(new Date());
  const rows=scope.filter(s=>s.name.toLowerCase().includes(q) && (isLong(s)||((!filters.month||s.end.startsWith(filters.month))&&(!filters.status||campaignStatus(s,today)===filters.status))) && (!filters.channel||s.channels.includes(filters.channel)) && (!filters.owner||s.owner===filters.owner));
  document.querySelector('#result-count').textContent='共 '+rows.length+' 场活动';
  const names={month:'结束月份',status:'运行状态',channel:'渠道',owner:'负责人'};
  const chips=Object.entries(names).filter(([key])=>filters[key]).map(([key,label])=>
    '<button class="filter-chip" data-action="remove-filter" data-key="'+key+'" aria-label="清除'+label+'">'+label+' '+escape(filters[key])+' ×</button>');
  if(chips.length||q) chips.push('<button class="linkbutton" data-action="reset">清除筛选</button>');
  document.querySelector('#active-filters').innerHTML=chips.join('');
  const listing=document.querySelector('#listing');
  const longOpen=listing.querySelector('.permanent-panel')?.open;
  const long=rows.filter(isLong).sort((a,b)=>a.activity_id.localeCompare(b.activity_id));
  const short=rows.filter(s=>!isLong(s));
  const columns=()=>(role==='manager'?'<th class="checkcell" scope="col"><span aria-label="选择对比活动">选</span></th>':'')+'<th scope="col">活动名称</th><th scope="col">活动类型</th><th scope="col">档期</th><th scope="col">统计期间</th><th scope="col" class="num">总营收（HKD）</th><th scope="col" class="num">总单量</th><th scope="col" class="num">客单价（HKD）</th><th scope="col" class="num">活动花费（HKD）</th><th scope="col" class="num">'+economicsHeader('roi')+'</th><th scope="col" class="num">'+economicsHeader('cpm')+'</th><th scope="col">操作</th>';
  const campaignTable=(items,label)=>items.length?'<div class="scroller"><table aria-label="'+label+'"><thead><tr>'+columns()+'</tr></thead><tbody>'+items.map(s=>{
    const id=s.activity_id,a=activities[id],e=state(a),sales=metricsById.get(id),kpis=activityEconomics(s);
    const entry='<a class="entry" href="#analysis/performance/'+id+'">看活动效果 →</a> · <a href="#analysis/compare/'+id+'">去对比 →</a>';
    return '<tr data-row="'+id+'"'+(picked.has(id)?' class="selected"':'')+'>'+(role==='manager'?'<td class="checkcell"><input type="checkbox" data-pick="'+id+'" aria-label="选择 '+escape(s.name)+'" '+(picked.has(id)?'checked':picked.size>=2?'disabled':'')+'></td>':'')+
      '<td>'+link(id,'overview',escape(s.name),'campaign')+campaignStatusIcon(s,today)+'</td><td class="nowrap">'+escape(s.type||'未分类')+'</td><td class="nowrap">'+compactCampaignPeriod(s)+'</td><td class="nowrap">'+sales.period+'</td><td class="num">'+hkd(sales.revenue)+'</td><td class="num">'+(sales.orders===null?'—':fmt(sales.orders))+'</td><td class="num">'+(numeric(sales.basket)?fmt(sales.basket,2):'—')+'</td><td class="num">'+(numeric(kpis.cost)?fmt(kpis.cost,2):'—')+'</td><td class="num">'+(numeric(kpis.roi)?pct(kpis.roi):'—')+'</td><td class="num">'+(numeric(kpis.cpm)?fmt(kpis.cpm,2):'—')+'</td><td>'+entry+'</td></tr>';
  }).join('')+'</tbody></table></div>':'<p class="campaign-empty muted">没有匹配活动。</p>';
  listing.innerHTML=
    '<section class="campaign-group seasonal-panel" aria-labelledby="short-title"><header><h2 id="short-title">非常设活动</h2><span class="tiny muted">'+summaryMetricLabels[viewSettings.activity.sort]+' · '+short.length+' 场</span></header>'+campaignTable(short,'非常设活动')+'</section>'+permanentPanel(long,'常设活动',longOpen);
  document.querySelector('#selection').innerHTML=picked.size?'<span class="tiny muted">已选 '+picked.size+' / 2</span><button data-action="compare" '+(picked.size<2?'disabled':'')+'>对比活动</button>':'';
}
function chart(points,{heading,unit='HKD',first='实际',second='对照估计',start,end,caption=''}){
  if(!points.length || !points.some(p=>numeric(p.actual)||numeric(p.baseline))) return '<p class="muted">无可用趋势数据。</p>';
  const has=points.some(p=>numeric(p.baseline));
  const all=points.flatMap(p=>[p.actual,p.baseline]).filter(numeric), w=800,h=242, sx=70,ex=775,sy=32,ey=192;
  const axis=v=>unit==='HKD' && Math.abs(v)>=1000 ? fmt(v/1000,1)+'k' : fmt(v,unit==='指数'&&Math.abs(v)<2?2:0);
  const top=Math.ceil(Math.max(...all)/4)*4 || 4;
  const times=points.map(p=>Date.parse(p.date)), timed=!points.some(p=>p.label) && times.every(numeric) && times.at(-1)>times[0];
  const x=i=>sx+(ex-sx)*(timed?(times[i]-times[0])/(times.at(-1)-times[0]):i/Math.max(1,points.length-1));
  const y=v=>ey-v/top*(ey-sy);
  const path=key=>{
    let previous=false;
    return points.map((p,i)=>{
      const valid=numeric(p[key]); const gap=timed && i>0 && times[i]-times[i-1]>86400000*1.5;
      const result=valid?(previous&&!gap?'L':'M')+x(i).toFixed(2)+' '+y(p[key]).toFixed(2):'';
      previous=valid;
      return result;
    }).join(' ');
  };
  const indices=[...new Set(Array.from({length:Math.min(6,points.length)},(_,i)=>Math.round(i*(points.length-1)/Math.max(1,Math.min(6,points.length)-1))))];
  const markers=[[start,'开始'],[end,'结束']].map(([d,l])=>{
    const i=points.findIndex(p=>p.date===d);
    return i<0?'':'<line x1="'+x(i)+'" x2="'+x(i)+'" y1="27" y2="'+ey+'" stroke="#c8afa1" stroke-dasharray="3 4"/><text x="'+x(i)+'" y="20" text-anchor="'+(i<points.length/2?'start':'end')+'">'+l+'</text>';
  }).join('');
  return '<div class="legend"><span><i></i>'+first+'</span>'+(has?'<span><i class="dash"></i>'+second+'</span>':'')+'</div><div class="chart"><div class="tooltip" hidden></div><svg viewBox="0 0 '+w+' '+h+'" role="group" aria-label="'+heading+'"><text x="4" y="18">'+unit+'</text>'+
    [0,1,2,3,4].map(i=>'<line x1="'+sx+'" x2="'+ex+'" y1="'+y(top*i/4)+'" y2="'+y(top*i/4)+'" stroke="#e9ded2"/><text x="61" y="'+(y(top*i/4)+4)+'" text-anchor="end">'+axis(top*i/4)+'</text>').join('')+markers+
    '<path d="'+path('actual')+'" fill="none" stroke="var(--red)" stroke-width="2.5"/>'+(has?'<path d="'+path('baseline')+'" fill="none" stroke="var(--coffee-line)" stroke-width="2" stroke-dasharray="6 5"/>':'')+
    indices.map(i=>'<text x="'+x(i)+'" y="221" text-anchor="middle">'+escape(points[i].label||points[i].date.slice(5))+'</text>').join('')+
    points.map((p,i)=>{
      const tip=escape((p.label||p.date)+'\n'+first+' '+fmt(p.actual,unit==='指数'?1:0)+' '+unit+(has?'\n'+second+' '+fmt(p.baseline,unit==='指数'?1:0)+' '+unit:''));
      return '<rect class="point" tabindex="0" role="img" aria-label="'+tip+'" data-tip="'+tip+'" data-x="'+x(i)/w+'" x="'+(x(i)-Math.min(10,(ex-sx)/points.length/2))+'" y="30" width="'+Math.min(20,(ex-sx)/points.length)+'" height="163"/>';
    }).join('')+'</svg></div><p class="tiny muted">'+caption+'</p>';
}
function waterfall(a,e){
  const t=a.attribution,g=t.increment?.gross_profit,c=t.cannibalization?.amount,n=t.net?.net_gross_profit;
  if(![g,c,n].every(numeric) || g<=0 || n<0 || c<0) return '<p class="muted">参考净增量毛利 '+money(n)+'。当前口径缺少独立的蚕食扣减额和透支数据。</p>';
  const bars=[[g,0,'增量毛利',money(g),'#9b6754'],[g,n,'扣减蚕食','−'+money(c),'#c19472'],[n,0,'净增量毛利',money(n),'#7e3c33']];
  const y=v=>145-v/g*100;
  return '<div class="water"><svg viewBox="0 0 440 181" role="img" aria-label="'+bars.map(b=>b[2]+' '+b[3]).join('，')+'"><line x1="12" x2="429" y1="145" y2="145" stroke="#dbcfc2"/>'+bars.map(([hi,lo,label,value,color],i)=>{
    const x=27+i*145;
    return '<rect x="'+x+'" y="'+y(hi)+'" width="94" height="'+(y(lo)-y(hi))+'" fill="'+color+'" rx="3"/><text x="'+(x+47)+'" y="'+(y(hi)-10)+'" text-anchor="middle">'+value+'</text><text x="'+(x+47)+'" y="168" text-anchor="middle">'+label+'</text>'+(i<2?'<line x1="'+(x+94)+'" x2="'+(x+145)+'" y1="'+y(i===0?g:n)+'" y2="'+y(i===0?g:n)+'" stroke="#ad8d7a" stroke-dasharray="3 3"/>':'');
  }).join('')+'</svg></div><p class="tiny muted">透支 '+money(t.pull_forward?.amount)+' · 口径仅展示透支，净毛利按增量毛利减蚕食计算。</p>';
}
function quality(a,e){
  return '<div class="panel pad" id="quality"><h2>活动交易日覆盖率</h2><p class="'+(e.completeness?'muted':'bad')+'">'+pct(a.data_quality.completeness)+' · '+(e.completeness?'达到 90% 交易日覆盖闸门':'低于 90%，正式报告已阻断')+'</p><details class="fold"><summary>查看数据异常与待补事项</summary>'+a.data_quality.anomalies.map(n=>'<p class="sub">'+escape(n.desc)+'</p>').join('')+'</details></div>';
}
function detail(id,tab){
  const a=activities[id], s=a.activity_summary,t=a.attribution,e=state(a);
  if(isLong(s)){
    main.innerHTML='<a class="back tiny" href="#summary/activity">← 返回按活动</a>'+
      head(escape(s.name),'常设活动 · '+escape(s.type)+' · '+escape(s.owner))+
      '<div class="row no-print"><button data-work="activity-report" data-value="'+id+'">加入报告</button></div>'+
      '<section class="metrics">'+permanentMetrics(s).map(([label,value])=>metric(label,value,'')).join('')+'</section>'+
      '<section class="panel pad permanent-panel"><h2>活动机制</h2><p>'+escape(a.activity.mechanism)+'</p>'+
      '<p class="sub">渠道 '+escape(s.channels.join('、'))+'</p></section>';
    return;
  }
  const below=numeric(e.roi)&&e.roi<rules.roi_breakeven;
  const action='<div class="row no-print"><a class="button primary" href="#analysis/'+id+'">去对比分析</a><button data-work="activity-report" data-value="'+id+'">加入报告</button></div>';
  const conclusion=storeMode()?'本店在活动覆盖范围内，执行差异待核对。':numeric(e.roi)?(below?'估计未回本。':'估计达到盈亏线。')+' '+(e.label==='证据通过'?'模拟结果符合归因与显著性规则。':'当前结果不足以支持预算决策。'):e.reason;
  const stats=storeMode()?[
    ['本店覆盖','已覆盖',store],['本店总营收',money(storeRow(a)?.revenue),'活动期会员与散客交易'],['本店总单量',numeric(storeRow(a)?.orders)?fmt(storeRow(a).orders):'无可用数据','活动期订单（单）']
  ]:[['校准回收倍数',ratio(a.metrics.worked_roi),'活动全期参考'],['增量 ROI','待复核','需有效的增量与成本估计'],['交易日覆盖率',pct(a.data_quality.completeness),'报告闸门 ≥ 90%']];
  const tabs=[['overview','结果概览'],['evidence','归因证据'],['report','复盘报告']];
  main.innerHTML='<a class="back tiny" href="#summary/activity">← 返回按活动</a><div class="pagehead"><div class="row"><h1>'+escape(s.name)+'</h1>'+badge(e)+'</div><p class="sub">'+activityPeriod(s)+' · '+(storeMode()?store:s.stores.length+' 家覆盖门店')+' · '+analysisPeriod(s,t)+'</p></div><div class="notice row spread"><strong>'+conclusion+'</strong>'+action+'</div><div class="metrics">'+stats.map(v=>metric(...v)).join('')+'</div><nav class="tabs no-print" aria-label="详情导航">'+tabs.map(([key,label])=>link(id,key,label,key===tab?'active':'')).join('')+'</nav>'+
    '<section class="panel pad cadence-detail '+'seasonal-panel'+'"><h2>'+
    '非常设活动 · 档期概况'+'</h2><p>'+
    escape(s.start)+' 至 '+escape(s.end)+' · '+durationLabel(s)+
    '</p></section>'+
    (tab==='evidence'?evidence(a,e):tab==='report'?report(a,e):overview(a,e));
}
function overview(a,e){
  const s=a.activity_summary,t=a.attribution,id=s.activity_id;
  const execution='<section class="panel pad" id="execution"><h2>本店执行要点</h2><p>'+escape(a.activity.mechanism||'查看活动发布信息')+'</p><p class="sub">核对活动期本店发券与核销记录，记录客诉及门店执行差异。本店营收与订单为会员与散客交易汇总。核销明细未提供，执行差异待验证。</p>'+link(id,'report','查看本店复盘摘要 →','source-link')+'</section>';
  if(storeMode())return execution+quality(a,e);
  const series=a.trend.series.revenue||[];
  const inCampaign=series.filter(p=>p.is_in_campaign);
  const rows=series.filter(p=>inCampaign.length ? p.date<=inCampaign.at(-1).date : true).map(p=>({...p,baseline:t.control_group?.size?p.baseline:null}));
  const has=rows.some(p=>numeric(p.baseline));
  const types=(a.breakdown.dimensions.store_type?.rows||[]).slice().sort((x,y)=>y.revenue-x.revenue);
  const dims=a.breakdown.dimensions.store?.rows||[];
  const amount=t.net?.total_investment;
  const support=[
    ['营收与毛利','总营收',money(a.metrics.revenue),'参与门店·活动期'],
    ['营收与毛利','总单量',fmt(a.metrics.orders),'参与门店·活动期（单）'],
    ['成本与回报','总投入',money(amount),'校准表'],
    ['成本与回报','校准回收倍数',ratio(a.metrics.worked_roi),'校准表'],
    ['触达与核销','触达记录',fmt(a.metrics.sent),'活动触达表（条）'],
    ['触达与核销','送达率',pct(a.metrics.delivery),'累计送达、打开、点击 ÷ 触达记录'],
    ['触达与核销','核销率','无可用数据','缺少核销流水']];

  return '<section class="panel pad" id="trend"><div class="row spread"><h2>日营收趋势</h2>'+badge(e)+'</div>'+chart(rows,{heading:'日营收趋势',start:isLong(s)?null:date(s.start),end:isLong(s)?null:date(s.end),caption:'图示 '+(rows[0]?.date||'—')+' 至 '+(rows.at(-1)?.date||'—')+'。'+(!isLong(s)&&inCampaign.at(-1)?.date<date(s.end)?' 数据包仅提供活动期部分日序列，活动结束 '+date(s.end)+' 在图示范围外。':'')+(has?' 对照估计沿用原型口径。':' '+e.reason)})+'</section>'+
  '<div class="cols"><section class="panel pad" id="water"><div class="row spread"><h2>净增量毛利构成</h2>'+badge(e)+'</div>'+waterfall(a,e)+'</section><section class="panel pad" id="stores"><div class="row spread"><h2>门店类型对比</h2>'+badge(e)+'</div><p class="tiny muted">'+(e.label==='证据通过'?'按总营收降序。':'门店差异待验证 · 按总营收降序。')+'</p>'+(types.length?table([['门店类型'],['总营收','num'],['总单量','num']],types.map(r=>[escape(r.dimension_value),money(r.revenue),fmt(r.orders)])):'<p class="sub">无可用数据。</p>')+(dims.length?'<details class="fold"><summary>查看参与门店</summary>'+table([['门店'],['总营收','num'],['总单量','num']],dims.map((r,i)=>['<button data-action="store-detail" data-id="'+id+'" data-index="'+i+'">'+escape(r.dimension_value)+'</button>',money(r.revenue),fmt(r.orders)]))+'</details>':'')+'</section></div>'+
  '<section class="panel pad"><h2>次要指标</h2>'+table([['分组'],['指标'],['活动期数值','num'],['对比基准']],support.map(([group,label,value,base])=>[group,label,value,base]))+'<p class="tiny muted">统计期间 '+escape(t.caliber?.campaign_window||date(s.start)+' 至 '+date(s.end))+'</p></section>'+
  '<details class="panel fold"><summary>预算构成与活动档案</summary><p>计划 '+money(a.activity.budget?.planned)+' · 实际 '+money(amount)+'</p><p class="sub">提供总投入，暂无核销让利和媒体费用拆分。</p><p class="sub">'+escape(a.activity.mechanism)+' · '+escape(s.owner)+'</p></details>';
}
function evidence(a,e){
  const t=a.attribution,p=t.parallel_trend,g=t.control_group,id=a.activity_summary.activity_id;
  if(storeMode()) return '<section class="panel pad"><h2>本店证据状态</h2><p>'+badge(e)+' · 本店执行差异待验证。</p></section>'+quality(a,e);
  const checks=[['趋势相关系数','r ≥ 0.8',fmt(p?.correlation,3),e.trend],['均值偏差','≤ 15%',pct(p?.mean_relative_deviation),e.mean],['最大分层偏差','≤ 2%',pct(g?.max_deviation_pct),e.strata]];
  const pre=p?.pre_trend;
  const avg=xs=>xs.reduce((a,b)=>a+(numeric(b)?b:0),0)/xs.length;
  const meanT=pre?.treatment?.length?avg(pre.treatment):0,meanC=pre?.control?.length?avg(pre.control):0;
  const points=meanT>0&&meanC>0?pre.dates.map((date,i)=>({date,actual:numeric(pre.treatment[i])?100*pre.treatment[i]/meanT:null,baseline:numeric(pre.control[i])?100*pre.control[i]/meanC:null})):[];
  return '<section class="panel pad" id="checks"><div class="row spread"><h2>对照组检查</h2>'+badge(e)+'</div><p class="sub">'+e.reason+'</p><p class="sub tiny">'+escape(t.mode)+' '+(g?.size?'· 对照组 '+fmt(g.size)+' '+escape(g.unit):'')+'</p>'+table([['项目规则'],['通过条件','num'],['实际值','num'],['结果']],checks.map(([l,test,v,ok])=>[l,test,v,v==='无可用数据'?'无可用数据':'<span class="badge '+(ok?'ok':'warn')+'">'+(ok?'通过':'未通过')+'</span>']))+
  (g?.strata_check?.length?'<details class="fold"><summary>查看分层差异</summary>'+table([['分层'],['活动组','num'],['对照组','num'],['偏差','num']],g.strata_check.map(r=>[escape(r.stratum),pct(r.treatment_pct),pct(r.holdout_pct),fmt(r.deviation_pct,1)+' 个百分点']))+'</details>':'')+'</section>'+
  '<section class="panel pad" id="pre"><h2>活动前趋势检查</h2>'+chart(points,{heading:'活动前两组营收趋势',unit:'指数',first:'活动组',second:'对照组',caption:'如有可复核的活动前双组序列，按各组均值归一化为 100 展示。当前活动缺少可复核的双组序列。'})+'</section>'+
  '<section class="panel pad"><h2>归因结果</h2><p>估计增量毛利 '+money(t.increment?.gross_profit)+' · 95% 置信区间 '+(e.interval?e.ci.map(money).join(' 至 '):'无可用数据')+'</p><p class="sub">'+(e.attributed?(e.crosses?'未观察到显著效果':e.interval?'模拟区间排除 0':'显著性待判定'):'归因条件未满足，区间随估计值保留，仅供参考。')+'</p><div class="methodcards" style="margin-top:13px"><div><h3>DID 双重差分</h3>活动组的前后变化减去同期对照组的变化。<span class="sketch">活动组 ↗ − 对照组 ↗</span></div><div><h3>平行趋势</h3>先看活动前两组走势是否相似，再判断能否比较。<span class="sketch">▁▃▂▅　▁▃▂▅</span></div><div><h3>蚕食率 '+pct(t.cannibalization?.rate)+'</h3>估计用券订单里原本也会发生的购买占比。<span class="sketch">自然用券订单 ÷ 用券订单</span></div></div></section>'+quality(a,e)+'<div class="no-print">'+link(id,'report','预览复盘摘要 →','button primary')+'</div>';
}
function report(a,e){
  const s=a.activity_summary,id=s.activity_id,t=a.attribution;
  const doc=storeMode()?{}:load(id);
  const canEdit=!storeMode()&&!doc.finalized;
  const initial=storeMode() ? [
    store+'活动期总营收 '+money(storeRow(a)?.revenue)+'，总单量 '+fmt(storeRow(a)?.orders)+'。',
    '门店执行差异待验证。活动证据状态为'+e.label+'。',
    '核对本店发券与核销台账，记录执行时间、异常及客诉。'
  ] : [
    numeric(e.roi)?'估计净 ROI '+ratio(e.roi)+'，盈亏线 1.00，活动目标 '+ratio(s.roi_target??1.5)+'。'+(e.roi<1?'估计未回本。':'估计达到盈亏线。')+'估计净增量毛利 '+money(t.net?.net_gross_profit)+'。':e.reason,
    e.label+'。'+e.reason+' 数据完整度 '+pct(a.data_quality.completeness)+'。',
    id===heroId?'重新匹配对照组并检查分层偏差，复核会员自然购买倾向和蚕食估计。门店差异列为待验证。':e.label==='证据通过'?'复核门店差异并记录下一轮计划。':'补齐数据或复核对照条件，再审阅活动估计。'
  ];
  const fields=doc.fields||initial;
  const labels=['发生了什么','证据够不够','下一轮做什么'];
  const links=storeMode()?[['overview','查看本店执行','execution'],['evidence','查看本店证据',''],['overview','回到本店执行要点','execution']]:
    [['overview','查看净增量毛利图','water'],['evidence','查看对照组检查','checks'],['overview','查看门店类型对比','stores']];
  return '<article class="report panel pad"><div class="row spread"><div class="row">'+badge(e)+'</div><span class="tiny muted">'+(doc.finalized?'已定稿 · '+escape(doc.finalized):storeMode()?'本店摘要':'草稿')+'</span></div><h2 style="margin-top:10px">'+escape(s.name)+'｜复盘摘要</h2><p class="muted">'+activityPeriod(s)+' · '+(storeMode()?store:escape(s.owner))+' · '+analysisPeriod(s,t)+'</p>'+
    (!e.completeness?'<div class="notice">'+e.reason+' 当前可预览草稿。</div>':'')+
    fields.map((value,i)=>'<section><h3>'+labels[i]+'</h3>'+(editing&&canEdit?'<textarea maxlength="450" aria-label="'+labels[i]+'">'+escape(value)+'</textarea>':'<p style="white-space:pre-wrap">'+escape(value)+'</p>')+link(id,links[i][0],links[i][1]+' →','source-link',links[i][2])+'</section>').join('')+
    '<footer>数据截至 '+escape(a.data_quality.cutoff_time)+'<br>证据状态 '+e.label+'</footer>'+
    '<div class="row no-print" style="margin-top:17px">'+(editing&&canEdit?'<button class="primary" data-action="save" data-id="'+id+'">保存草稿</button><button data-action="cancel">取消</button>':
    (canEdit?'<button data-action="edit">编辑草稿</button>':'')+'<button class="primary" data-action="print">'+(!e.completeness?'打印草稿 / 保存草稿 PDF':'打印 / 保存 PDF')+'</button>'+
    (role==='manager'&&!doc.finalized?'<button data-action="finalize" data-id="'+id+'" '+(!e.finalize?'disabled title="'+escape(e.reason)+'"':'')+'>确认定稿</button>':''))+'<span id="report-note" role="status" class="tiny muted"></span></div></article>';
}
function reports(){
  main.innerHTML=head('复盘报告',storeMode()?store+' · 本店复盘摘要':'预览一页摘要，按岗位编辑和定稿。')+
    '<section class="panel">'+table([['活动'],['报告状态'],['证据状态'],['操作']],visible().map(s=>[escape(s.name),storeMode()?'本店摘要':reportState(s.activity_id),badge(state(activities[s.activity_id])),link(s.activity_id,'report','预览摘要 →','entry')]))+'</section>';
}
function methods(){
  main.innerHTML=head('帮助与方法','项目规则、数据来源与市场经理工作区')+
  '<section class="panel pad"><h2>证据与报告规则</h2>'+table([['检查'],['项目规则'],['未通过后的处理']],[
    ['数据完整度','≥ 90%','阻断正式报告，保留草稿预览。'],
    ['活动前趋势相关系数','r ≥ 0.8','结果仅供参考，复核对照组。'],
    ['活动前均值偏差','≤ 15%','结果仅供参考，复核对照组。'],
    ['最大分层偏差','≤ 2%','结果仅供参考，复核分层匹配。'],
    ['归因成立后的显著性','95% 置信区间排除 0','区间包含 0 时显示「未观察到显著效果」。']
  ])+'</section><section class="panel pad"><h2>数据来源</h2><p>'+escape(meta.note.replace('模拟数据 · ',''))+'</p><p class="sub">非唤回活动的效果来自档位校准。唤回活动的参考净增量按触后康复消费 × 68% 毛利率 ×（1 − 35% 自然回流假设）计算。</p><p class="sub">币种为HKD。校准回收倍数沿用工作簿的净 ROI 列。增量 ROI 需另行复核，日投入取自日损益表。</p><p class="sub">当前工作台采用市场经理视图。</p></section><a class="button primary" href="#feedback">反馈问题 →</a>';
}
function render(){
  let [section,id,tab,anchor]=location.hash.slice(1).split('/');
  if(section==='activities'){section='summary';id='activity'}
  section=section||'summary';
  if(section==='simulation')section='feedback';
  if(section==='summary'&&id==='effects'){location.hash='#summary/activity';return;}
  if(section==='activity'&&!visible().some(s=>s.activity_id===id)){location.hash='#summary';return}
  const nav=section==='activity'?'summary-activity':section==='summary'&&['day','store','activity'].includes(id)?'summary-'+id:section;
  const activeNav=section==='analysis'?'analysis-'+(!id||id==='performance'?'performance':'compare'):nav;
  document.querySelectorAll('[data-nav]').forEach(a=>{
    const current=a.dataset.nav===activeNav;
    a.classList.toggle('active',current);
    if(current)a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
  if(nav!=='feedback')feedbackReference=location.hash||'#summary';
  if(nav==='methods'||nav==='feedback') document.querySelector('#helpNav').open=true;
  if(section==='activity') detail(id, ['overview','evidence','report'].includes(tab)?tab:'overview');
  else if(nav==='analysis'){
    if(!id||id==='performance')renderPerformance(tab);
    else renderAnalysis(id==='compare'?tab:id);
  }
  else if(nav==='reports') renderWorkspace();
  else if(nav==='profile') renderProfile();
  else if(nav==='methods') methods();
  else if(nav==='feedback') renderFeedback();
  else {summaryView=['day','store','activity'].includes(id)?id:'overview';summary()}
  if(anchor) document.getElementById(anchor)?.scrollIntoView({block:'start'});
}
function showDialog(title,content){
  dialog.innerHTML='<div class="row spread"><h2>'+title+'</h2><form method="dialog"><button aria-label="关闭弹窗">关闭</button></form></div>'+content;
  dialog.showModal();
}
function setNavigationExpanded(button,expanded){
  const group=document.getElementById(button.getAttribute('aria-controls'));
  group.hidden=!expanded;
  button.setAttribute('aria-expanded',String(expanded));
  button.setAttribute('aria-label',(expanded?'折叠':'展开')+button.dataset.navLabel);
}
for(const button of document.querySelectorAll('.nav-disclosure')){
  button.addEventListener('click',()=>setNavigationExpanded(button,button.getAttribute('aria-expanded')!=='true'));
  button.parentElement.querySelector('a').addEventListener('click',()=>setNavigationExpanded(button,true));
}
window.addEventListener('hashchange',()=>{if(!location.hash.includes('/report')) editing=false;render();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)main.animate?.([{opacity:.7},{opacity:1}],{duration:160});if(location.hash.split('/').length<4)window.scrollTo(0,0)});
main.addEventListener('input',ev=>{if(ev.target.id==='query'){filters.query=ev.target.value;list()}});
main.addEventListener('change',ev=>{
  const {id,dataset,checked,value}=ev.target;
  if(dataset.scope){
    if(dataset.scope==='limitActivities')summaryScope.limitActivities=checked;
    else if(!['from','to'].includes(dataset.scope)||revenueData.dates.includes(value))summaryScope[dataset.scope]=value;
    if(summaryScope.from>summaryScope.to)summaryScope[dataset.scope==='from'?'to':'from']=value;
    summary();
    main.querySelector('[data-scope="'+dataset.scope+'"]')?.focus();
    return;
  }
  if(dataset.viewSetting){
    const settings=viewSettings[summaryView];
    settings[dataset.viewSetting]=value;
    summary();
    main.querySelector('[data-view-setting="'+dataset.viewSetting+'"]')?.focus();
    return;
  }
  if(['month','status','channel','owner'].includes(id)){filters[id]=value;list()}
  if(dataset.pick){
    if(checked&&picked.size<2&&comparisonActivities().some(a=>a.activity_id===dataset.pick))picked.add(dataset.pick);
    if(!checked)picked.delete(dataset.pick);
    list();
    document.querySelector('[data-pick="'+dataset.pick+'"]')?.focus();
  }
});
main.addEventListener('click',ev=>{
  const button=ev.target.closest('[data-action]');
  if(!button){
    const row=ev.target.closest('[data-row]');
    if(row&&!ev.target.closest('a,input,button'))location.hash=url(row.dataset.row);
    return;
  }
  const {action,id,index}=button.dataset;
  if(action==='export-summary')downloadSummaryWorkbook();
  if(action==='compare')openPickedComparison();
  if(action==='summary-sort'||action==='metric-direction'){
    const settings=viewSettings[summaryView],key=button.dataset.key||settings.sort;
    if(settings.sort===key)settings.direction*=-1;
    else Object.assign(settings,{sort:key,direction:key==='name'?1:-1});
    summary();
    main.querySelector(action==='metric-direction'?'[data-action="metric-direction"]':
      '[data-action="summary-sort"][data-key="'+key+'"]')?.focus();
  }
  if(action==='store-days'){
    summaryScope.store=button.dataset.store;
    location.hash='#summary/day';
  }
  if(action==='reset'||action==='remove-filter'){
    const keys=action==='reset'?Object.keys(filters):[button.dataset.key];
    for(const key of keys){
      filters[key]='';
      document.getElementById(key).value='';
    }
    list();
    document.getElementById('query').focus();
  }
  if(action==='edit'){editing=true;render();main.querySelector('textarea')?.focus()}
  if(action==='edit-from'){editing=!load(id).finalized;location.hash=url(id,'report')}
  if(action==='cancel'){editing=false;render()}
  if(action==='save'&&!storeMode()&&!load(id).finalized){
    const fields=[...main.querySelectorAll('textarea')].map(t=>t.value.trim());
    const ok=save(id,{fields});
    if(ok){editing=false;render()}
    document.querySelector('#report-note').textContent=ok?'草稿已保存':'浏览器无法保存草稿';
  }
  if(action==='finalize'&&role==='manager'&&state(activities[id]).finalize){
    const ok=save(id,{...load(id),finalized:new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'})});
    render();document.querySelector('#report-note').textContent=ok?'报告已定稿':'浏览器无法保存定稿';
  }
  if(action==='print'){document.body.classList.add('printing');window.print()}
  if(action==='store-detail'&&!storeMode()){
    const a=activities[id],r=ownRows(a)[Number(index)];
    if(r)showDialog(escape(r.dimension_value),'<p>'+badge(state(a))+'</p><p class="sub">总营收 '+money(r.revenue)+' · 总单量 '+fmt(r.orders)+'</p><p class="sub">门店差异待验证。</p>');
  }
});
window.addEventListener('afterprint',()=>document.body.classList.remove('printing'));
function tip(ev,hide){
  const point=ev.target.closest?.('[data-tip]');
  if(!point)return;
  const chart=point.closest('.chart'),box=chart.querySelector('.tooltip');
  box.hidden=hide;
  if(!hide){box.textContent=point.dataset.tip;box.style.left=Math.min(chart.clientWidth-193,Math.max(0,chart.clientWidth*Number(point.dataset.x)))+'px';box.style.top='6px'}
}
for(const event of ['mouseover','focusin'])main.addEventListener(event,e=>tip(e,false));
for(const event of ['mouseout','focusout'])main.addEventListener(event,e=>tip(e,true));
const metricHelpBox=document.getElementById('metric-help');
let metricHelpTarget;
function hideMetricHelp(){
  metricHelpBox.hidden=true;
  metricHelpTarget=undefined;
}
function showMetricHelp(target){
  metricHelpTarget=target;
  metricHelpBox.textContent=target.dataset.metricHelp;
  metricHelpBox.hidden=false;
  const anchor=target.getBoundingClientRect();
  const width=metricHelpBox.offsetWidth,height=metricHelpBox.offsetHeight;
  metricHelpBox.style.left=Math.max(8,Math.min(anchor.left,innerWidth-width-8))+'px';
  const top=anchor.bottom+height+14<=innerHeight?anchor.bottom+6:anchor.top-height-6;
  metricHelpBox.style.top=Math.max(8,top)+'px';
}
for(const type of ['pointerover','focusin'])document.addEventListener(type,event=>{
  const target=event.target.closest?.('[data-metric-help]');
  if(target)showMetricHelp(target);
});
for(const type of ['pointerout','focusout'])document.addEventListener(type,event=>{
  if(metricHelpTarget&&metricHelpTarget.contains(event.target)&&!metricHelpTarget.contains(event.relatedTarget))hideMetricHelp();
});
window.addEventListener('scroll',hideMetricHelp,true);
window.addEventListener('resize',hideMetricHelp);
window.addEventListener('hashchange',hideMetricHelp);
document.addEventListener('keydown',event=>{if(event.key==='Escape')hideMetricHelp()});
document.addEventListener('DOMContentLoaded',()=>render(),{once:true});
