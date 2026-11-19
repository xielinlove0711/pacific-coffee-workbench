'use strict';

const methodsList = {period:'同期对比', general:'普通活动对比', peer:'同类型活动对比', did:'增量效果评估'};
const analysisForm = {method:'period', activity:'', peer:'', periodActivity:'', periodPeer:'', periodMonth:'', referenceMonth:'', pre:28, margin:'68', metric:'revenue', district:'', store:'', channel:''};
let currentRuns = [];
let runsRole;
let lastResult;

function scopedDays(shop, channel = summaryScope.channel) {
  return channel ? shop.channels[channel] || [] : shop.days;
}

function scopedActivities(limitDates = true) {
  const restrictStores=storeMode()||summaryScope.store||summaryScope.district;
  const shopNames=new Set(availableStores().filter(shop=>
    (!summaryScope.store||shop.name===summaryScope.store)&&
    (!summaryScope.district||shop.district===summaryScope.district)
  ).map(shop=>shop.name));
  return visible().filter(a =>
    (!limitDates||isLong(a)||invalidWindow(a)||(a.start<=summaryScope.to&&a.end>=summaryScope.from))&&
    (!summaryScope.type||a.type===summaryScope.type)&&
    (!restrictStores||a.stores.some(name=>shopNames.has(name)))
  );
}

function summaryFilters(shops) {
  return [['district','区域',[...new Set(shops.map(shop=>shop.district))]],
    ['channel','交易渠道',revenueData.channels],['type','活动类型',[...new Set(visible().map(a=>a.type))]]]
    .map(([key,label,values])=>'<label>'+label+' <select data-scope="'+key+'">'+options(values,'全部')+'</select></label>').join('')+
    (summaryView==='activity'?'<label class="row"><input type="checkbox" data-scope="limitActivities"> 限定活动日期</label>':'');
}

function permanentMetrics(s) {
  const known=new Set(revenueData.stores.map(shop=>shop.name));
  const covered=new Set(s.stores.filter(name=>known.has(name)));
  return [['覆盖门店',covered.size?fmt(covered.size)+' 家':'—'],
    ['门店覆盖率',known.size?pct(covered.size/known.size*100):'—']];
}

function permanentPanel(rows,title,open=false) {
  return '<details class="campaign-group permanent-panel" '+(open?'open':'')+'><summary><strong>'+title+
    '</strong><span class="tiny muted">'+rows.length+' 场</span></summary>'+
    (rows.length?table([['活动'],['活动类型'],['渠道'],['覆盖门店'],
      [metricHelpLabel('门店覆盖率','参与门店数 ÷ 门店主数据中的全部门店数 × 100%。')],['活动机制'],['操作']],rows.map(s=>[
      link(s.activity_id,'overview',escape(s.name),'campaign'),escape(s.type||'未分类'),escape(s.channels.join('、')),
      ...permanentMetrics(s).map(([,value])=>value),escape(activities[s.activity_id].activity.mechanism||'—'),
      link(s.activity_id,'overview','查看详情 →','entry')
    ])):'<p class="campaign-empty muted">没有匹配活动。</p>')+'</details>';
}

function activityEconomics(s) {
  const {worked_cost:cost,worked_profit:gross,delivered,sent}=activities[s.activity_id].metrics;
  const validCost=numeric(cost)&&cost>0;
  return {
    cost, gross, delivered,
    roi:validCost&&numeric(gross)?(gross-cost)/cost*100:null,
    cpm:activities[s.activity_id].metrics.ad_cpm??null,
    delivery:sent>0?delivered/sent*100:null
  };
}

function economicsTable(rows) {
  return table([['活动'],['活动类型'],['总投入（HKD）','num'],['校准净增量毛利（HKD）','num'],
    [economicsHeader('roi'),'num'],['送达记录','num'],[economicsHeader('delivery'),'num'],[economicsHeader('cpm'),'num'],['操作']],
    rows.map(s=>{
      const m=activityEconomics(s);
      return [link(s.activity_id,'overview',escape(s.name)),escape(s.type||'未分类'),
        numeric(m.cost)?fmt(m.cost,2):'—',numeric(m.gross)?fmt(m.gross,2):'—',
        numeric(m.roi)?pct(m.roi):'—',m.delivered>0?fmt(m.delivered):'—',
        numeric(m.delivery)?pct(m.delivery):'—',numeric(m.cpm)?fmt(m.cpm,2):'—',
        isLong(s)?link(s.activity_id,'overview','查看详情 →','entry'):
        invalidWindow(s)?durationLabel(s):'<a href="#analysis/'+s.activity_id+'">去比较 →</a>'];
    }));
}

const economicsHeaders = {
  roi:{
    label:'ROI（校准）',
    help:'（校准净增量毛利 − 总投入）÷ 总投入 × 100%。毛利和投入取自 活动预算与效果校准表；原表「净 ROI」为回收倍数。投入缺失、为零或缺毛利时显示「—」。'
  },
  cpm:{
    label:'广告 CPM（HKD）',
    help:'活动付费媒体花费 ÷ 广告曝光量 × 1,000。来源：广告投放表，按活动编号汇总所有平台与月份。曝光缺失或为零时显示「—」；不使用总投入或触达消息条数替代。'
  },
  delivery:{
    label:'送达率',
    help:'送达记录 ÷ 活动全部消息记录 × 100%。无消息记录时显示「—」，送达记录包括 delivered、opened、clicked。'
  }
};

function metricHelpLabel(label,help) {
  return '<span class="kpi-heading" tabindex="0" aria-label="'+escape(label+'。'+help)+
    '" data-metric-help="'+escape(help)+'">'+escape(label)+'</span>';
}

function economicsHeader(key) {
  const {label,help}=economicsHeaders[key];
  return metricHelpLabel(label,help);
}

function overviewCampaignTable() {
  const rows=scopedActivities(false);
  const view='overview';
  const controls=summaryMetricControls(view);
  const sorted=sortMetricRows(rows.map(s=>({...activityEconomics(s),activity:s,duration:campaignDays(s)})),view);
  const matching=sorted.filter(r=>!isLong(r.activity)).map(r=>r.activity);
  const permanent=sorted.filter(r=>isLong(r.activity)).map(r=>r.activity);
  return '<section class="panel pad seasonal-panel"><div class="row spread"><h2>活动效果</h2>'+
    '<a href="#summary/activity">按活动查看 →</a>'+'</div>'+
    '<p class="sub">指标使用各活动的全量投入、校准毛利及消息记录。日期、区域、门店和渠道筛选不拆分这些指标。</p>'+
    '<div class="toolbar metric-toolbar">'+controls+'</div>'+
    (matching.length?economicsTable(matching):'<p class="muted">筛选范围内没有非常设活动。</p>')+
    permanentPanel(permanent,'常设活动')+'</section>';
}

const comparisonActivities=()=>visible().filter(a=>!isLong(a));

function openPickedComparison() {
  const allowed=comparisonActivities();
  const [activity,peer]=[...picked].filter(id=>allowed.some(a=>a.activity_id===id));
  if(!peer)return;
  Object.assign(analysisForm,{method:'general',activity,peer,district:summaryScope.district,store:summaryScope.store,channel:summaryScope.channel});
  lastResult=undefined;
  location.hash='#analysis/compare';
}

function dateShift(value, days) {
  return new Date(Date.parse(value)+days*86400000).toISOString().slice(0,10);
}

function dateRange(from,to) {
  return revenueData.dates.filter(d=>d>=from&&d<=to);
}

function sample(shops, dates, metric, channel, perStore=false) {
  const amounts=new Map(dates.map(d=>[d,0]));
  for(const shop of shops) for(const [i,revenue,orders] of scopedDays(shop,channel)){
    const d=revenueData.dates[i];
    if(amounts.has(d)) amounts.set(d,amounts.get(d)+(metric==='orders'?orders:revenue/100));
  }
  return [...amounts.values()].map(value=>perStore?value/shops.length:value);
}

function periodCandidates(month) {
  return comparisonActivities().filter(a=>!invalidWindow(a)&&
    a.start.slice(0,7)<=month&&a.end.slice(0,7)>=month);
}

function coveredMonth(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month)&&revenueData.dates.some(day=>day.startsWith(month));
}

function periodFields(f, activityOptions) {
  const picker=(monthKey,activityKey,label)=>{
    const month=f[monthKey];
    const covered=coveredMonth(month);
    const candidates=covered?periodCandidates(month):[];
    const hint=!covered?'工作簿未覆盖该月份。':candidates.length?'':'该月份没有可选的非常设活动。';
    return '<fieldset class="period-picker"><legend>'+label+'</legend><label>月份 <input type="month" data-analysis="'+monthKey+
      '" placeholder="YYYY-MM" aria-label="'+label+'月份"></label><label>活动 <select data-analysis="'+activityKey+
      '" aria-label="'+label+'活动" '+(candidates.length?'':'disabled')+'><option value="">请选择活动</option>'+
      activityOptions(candidates)+'</select></label>'+(hint?'<p class="sub">'+hint+'</p>':'')+'</fieldset>';
  };
  return '<div class="period-pickers">'+picker('periodMonth','periodActivity','当前时期')+
    picker('referenceMonth','periodPeer','对比时期')+'</div>'+
    '<p class="sub period-note">可比较跨年同月，或同年同月／相近月份的两场活动。数据覆盖 '+
    revenueData.dates[0].slice(0,7)+' 至 '+revenueData.dates.at(-1).slice(0,7)+'。</p>';
}

function renderAnalysis(id) {
  if(runsRole!==role){
    try{currentRuns=JSON.parse(localStorage.getItem('pacific-comparisons-v7-'+role))||[]}
    catch{currentRuns=[]}
    runsRole=role;
  }
  const allowed=comparisonActivities();
  if(id&&visible().some(a=>a.activity_id===id&&isLong(a))){
    location.hash=url(id);
    return;
  }
  const f=analysisForm;
  const target=allowed.find(a=>a.activity_id===id);
  if(target&&f.method==='period'&&f.periodActivity!==id){
    const month=invalidWindow(target)?target.start.slice(0,7):target.end.slice(0,7);
    Object.assign(f,{periodActivity:invalidWindow(target)?'':id,periodMonth:month,referenceMonth:month,periodPeer:'',district:'',store:''});
    lastResult=undefined;
  }else if(target&&f.method!=='period'&&f.activity!==id){
    Object.assign(f,{activity:id,peer:'',district:'',store:''});
    lastResult=undefined;
  }
  f.periodMonth ||= summaryScope.to.slice(0,7);
  f.referenceMonth ||= f.periodMonth;
  if(f.method==='did'&&f.activity&&!didReadiness(activities[f.activity].activity_summary).holdout){
    f.activity='';
    lastResult=undefined;
  }
  const chosen=activities[f.activity]?.activity_summary;
  const peers=allowed.filter(a=>a.activity_id!==f.activity&&(f.method!=='peer'||(chosen&&a.type===chosen.type)));
  if(f.method==='peer'&&!peers.some(a=>a.activity_id===f.peer))f.peer='';
  const activityOptions=items=>items.map(a=>{
    const readiness=f.method==='did'?didReadiness(a):null;
    const disabled=readiness&&!readiness.holdout;
    const prefix=readiness?(disabled?'[未进行 Holdout · 不可选] ':'[Holdout · '+readiness.label+'] '):'';
    return '<option value="'+a.activity_id+'"'+(disabled?' disabled':'')+'>'+escape(prefix+a.name)+'</option>';
  }).join('');
  const isDid=f.method==='did';
  const pairMode=f.method==='peer'||f.method==='general';
  main.innerHTML=head('对比分析','选择基准和指标。每次运行可单独保存到报告。')+
    '<div class="method-grid">'+Object.entries(methodsList).map(([key,label])=>
      '<button class="panel method-choice '+(key===f.method?'active':'')+'" data-work="method" data-value="'+key+'" aria-pressed="'+(key===f.method)+'"><strong>'+label+(key==='did'?'<span class="did-question" data-metric-help="'+escape('DID（双重差分）用处理组活动前后的变化，减去对照组同期的变化，估计活动差异。本页仅允许选择有 Holdout 设计记录的活动。Holdout 是投放前预先留出的对照人群；还需保存分组名单及两组前后交易，并复核平行趋势和同期活动。有设计记录但缺少明细时需补数据才能运行。')+'" aria-hidden="true">?</span>':'')+'</strong><small>'+
      {period:'跨年同月或同年同期的活动对比',general:'任选两场非常设活动',peer:'按活动开始后的相同天数比较',did:'评估活动带来的额外增长'}[key]+'</small></button>').join('')+'</div>'+
    (isDid?didGuidePanel(chosen):'')+
    '<section class="panel toolbar work-fields">'+
    (f.method==='period'?periodFields(f,activityOptions):
    '<label>活动 <select data-analysis="activity"><option value="">请选择活动</option>'+activityOptions(allowed)+'</select></label>'+
      (pairMode?'<label>'+(f.method==='peer'?'同类活动':'对比活动')+' <select data-analysis="peer"><option value="">请选择基准</option>'+activityOptions(peers)+'</select></label>':
      '<label>活动前天数 <select data-analysis="pre"><option>14</option><option>28</option><option>56</option></select></label>'))+
    '<label>指标 <select data-analysis="metric"><option value="revenue">总营收</option><option value="orders">总单量</option></select></label>'+
    (f.metric==='revenue'?'<label>情景毛利率（%） <input type="number" min="0" max="100" step="0.1" data-analysis="margin"></label>':'')+
    '<label>交易渠道 <select data-analysis="channel">'+options(revenueData.channels,'全部')+'</select></label>'+
    (!isDid?'<label>区域 <select data-analysis="district">'+options([...new Set(availableStores().map(s=>s.district))],'全部')+'</select></label><label>门店 <select data-analysis="store">'+options(availableStores().map(s=>s.name),'全部')+'</select></label>':'')+
    (isDid?'<button data-work="diagnose">运行前趋势诊断</button>':'')+
    '<button class="primary" data-work="run">运行对比</button></section>'+
    '<div id="analysis-output" aria-live="polite"></div>'+
    '<section class="panel pad"><h2>已保存的比较</h2><div id="run-list"></div></section>';
  for(const input of main.querySelectorAll('[data-analysis]')) input.value=f[input.dataset.analysis];
  showResult();
}

function comparisonEconomics(result,activity,group,days) {
  const f=analysisForm;
  if(f.metric!=='revenue'){
    result.economicsNote='订单指标可估算订单差异。选择「总营收」可计算金额和情景 ROI。';
    return;
  }
  const margin=Number(f.margin);
  if(f.margin===''||!numeric(margin)||margin<0||margin>100){
    result.economicsNote='请输入 0–100% 的情景毛利率。';
    return;
  }
  const cost=activityEconomics(activity).cost;
  const revenue=result.delta*group.length*days;
  const gross=revenue*margin/100;
  const fullScope=!f.channel&&group.length===activity.stores.length;
  const fullDays=campaignDays(activity);
  const allocated=fullScope&&fullDays>=days&&numeric(cost)&&cost>0?cost*days/fullDays:null;
  const roi=numeric(allocated)?(gross-allocated)/allocated*100:null;
  result.economics={
    revenue,gross,margin,cost:allocated,roi,stores:group.length,days,
    note:!fullScope?'筛选范围缺少对应投入拆分，暂不计算 ROI。':
      !numeric(allocated)?'活动投入缺失或为零，暂不计算 ROI。':
      days<fullDays?'窗口投入按天均摊估算：'+fmt(cost,2)+' HKD全期总投入 × '+days+' ÷ '+fullDays+' 天。':
      '投入取自 校准表的活动总投入。'
  };
}

function economicsText(r){
  const x=r.economics;
  if(!x)return r.economicsNote||'';
  const context=r.method==='did'?'DID 增量情景':'相对基准情景';
  return context+'｜营收差额 '+fmt(x.revenue,2)+' HKD（每店每日营收差 × '+x.stores+' 家 × '+x.days+
    ' 天）；毛利差额 '+fmt(x.gross,2)+' HKD（营收差额 × '+fmt(x.margin,1)+'% 假设毛利率）；情景 ROI '+
    (numeric(x.roi)?pct(x.roi)+'（毛利差额 − '+fmt(x.cost,2)+' HKD投入）÷ 投入 × 100%。':'—。')+
    x.note+' 默认 68% 为工作簿校准示例假设，可调整。情景估算需核实成本口径及折让是否已计入；活动间差异仅作基准观察。';
}

function calculate(onlyPre) {
  const f=analysisForm, allowed=comparisonActivities();
  const activityId=f.method==='period'?f.periodActivity:f.activity;
  const a=allowed.find(s=>s.activity_id===activityId);
  if(f.method==='general'&&a&&invalidWindow(a))throw Error('当前活动日期倒挂，请先修正活动日期。');
  if(activityId&&!a)throw Error('请选择可对比的非常设活动。');
  const shops=(names, scoped=true)=>availableStores().filter(s=>(!names||names.includes(s.name))&&
    (!scoped||((!f.store||s.name===f.store)&&(!f.district||s.district===f.district))));
  const unit=f.metric==='orders'?'单':'HKD';
  const total=xs=>xs.reduce((sum,x)=>sum+x,0);
  const avg=xs=>total(xs)/xs.length;
  const groupA=shops(a?.stores,f.method!=='did');
  const take=(group,days,normalize)=>sample(group,days,f.metric,f.channel,normalize);
  const result={title:methodsList[f.method],source:'会员与散客交易 · '+(f.channel||'全部交易渠道'),unit,method:f.method};
  let days, first, second;
  if(f.method==='did'&&a){
    const eligibility=didReadiness(a);
    if(!eligibility.holdout)throw Error('该活动未进行 Holdout，无法选择。下次投放前设置随机留出组，冻结分组名单并保留两组前后交易。');
    if(!eligibility.ready)throw Error(eligibility.issues.map(([issue,action])=>issue+'。'+action).join(' '));
  }
  if(!['period','peer'].includes(f.method)&&!groupA.length)throw Error('所选范围没有可用门店。');
  if(f.method==='period'){
    const {periodMonth,referenceMonth}=f;
    if(!coveredMonth(periodMonth)||!coveredMonth(referenceMonth)){
      throw Error('工作簿未覆盖所选月份，补充该月份的活动和交易数据后才可比较。');
    }
    if(periodMonth.slice(0,4)!==referenceMonth.slice(0,4)&&periodMonth.slice(5)!==referenceMonth.slice(5)){
      throw Error('跨年同期请选择相同月份。同一年可选同月或相近月份。');
    }
    const b=periodCandidates(referenceMonth).find(s=>s.activity_id===f.periodPeer);
    if(!a||!periodCandidates(periodMonth).includes(a)||!b||a===b){
      throw Error('请从两个时期各选一场不同的活动。');
    }
    const groupB=shops(b.stores);
    if(!groupA.length||!groupB.length)throw Error('其中一场活动在所选范围没有可用门店。');
    const currentDays=dateRange(a.start,a.end).filter(day=>day.startsWith(periodMonth));
    const referenceDays=dateRange(b.start,b.end).filter(day=>day.startsWith(referenceMonth));
    const current=take(groupA,currentDays,true),reference=take(groupB,referenceDays,true);
    const byDay=(dates,values)=>new Map(dates.map((day,i)=>[day.slice(-2),values[i]]));
    const currentValues=byDay(currentDays,current),referenceValues=byDay(referenceDays,reference);
    const dayNumbers=[...new Set([...currentValues.keys(),...referenceValues.keys()])].sort();
    days=dayNumbers.map(day=>(currentValues.has(day)?periodMonth:referenceMonth)+'-'+day);
    first=dayNumbers.map(day=>currentValues.get(day)??null);
    second=dayNumbers.map(day=>referenceValues.get(day)??null);
    result.points=dayNumbers.map((day,i)=>({
      date:days[i], label:day+' 日', actual:first[i], baseline:second[i]
    }));
    result.labels=['当前活动','基准活动'];
    const describe=(activity,range,group)=>activity.name+'（'+range[0]+' 至 '+range.at(-1)+'，'+range.length+' 天，'+group.length+' 家门店）';
    result.detail=describe(a,currentDays,groupA)+' 对比 '+describe(b,referenceDays,groupB);
    result.unit=unit+'/店日';
    result.delta=avg(current)-avg(reference);
    result.baseline=avg(reference);
    result.diagnostics=[['当前活动日均值',avg(current)],['基准活动日均值',avg(reference)]];
    enrichComparison(result,a,b,groupA,groupB,currentDays,referenceDays);
    comparisonEconomics(result,a,groupA,currentDays.length);
    result.note='各自按所选月份内的实际活动天数和参与门店标准化。趋势按月内日号对齐。结果反映参与门店的会员与散客交易差异，可能受同期活动及门店结构影响。';
  }else if(f.method==='peer'||f.method==='general'){
    const sameType=f.method==='peer';
    const b=allowed.find(s=>s.activity_id===f.peer&&(!sameType||s.type===a?.type)&&s.activity_id!==a?.activity_id);
    if(!a||!b)throw Error(sameType?'请选择两场不同的同类型活动。':'请选择两场不同的非常设活动。');
    if(!sameType&&invalidWindow(b))throw Error('对比活动日期倒挂，请先修正活动日期。');
    const groupB=shops(b.stores);
    const allA=dateRange(a.start,a.end), allB=dateRange(b.start,b.end);
    if(sameType){
      const overlap=groupA.filter(shop=>groupB.some(other=>other.name===shop.name)).length;
      result.warnings=[
        '活动期间：'+a.name+'（'+a.start+' 至 '+a.end+'）；'+b.name+'（'+b.start+' 至 '+b.end+'）。',
        '当前筛选内门店：'+groupA.length+' / '+groupB.length+' 家，共同门店 '+overlap+' 家。'
      ];
      if(a.start!==b.start||a.end!==b.end)result.warnings.push('活动期间不同，季节、节假日及观察天数可能影响结果。');
      if(groupA.length!==overlap||groupB.length!==overlap)result.warnings.push('门店范围不同，店型和地区结构可能影响结果。');
      result.warnings.push('按各自活动第几天对齐，使用每店每日指标比较。');
      if(!allA.length||!allB.length||!groupA.length||!groupB.length){
        const series=(group,range)=>group.length&&range.length?take(group,range,true):[];
        const valuesA=series(groupA,allA),valuesB=series(groupB,allB);
        result.labels=['当前活动','同类活动'];
        result.detail=a.name+' 对比 '+b.name;
        result.unit=unit+'/店日';
        result.points=Array.from({length:Math.max(valuesA.length,valuesB.length)},(_,i)=>({
          date:allA[i]||allB[i],label:'第 '+(i+1)+' 天',actual:valuesA[i]??null,baseline:valuesB[i]??null
        }));
        result.summary='部分活动缺少有效日期或当前筛选内门店，仅展示可用一方的趋势。差额、变化率和 ROI 暂缺。';
        result.warnings.push('请核对活动日期和门店映射，或放宽门店／区域筛选；补齐前无法计算双边差异。');
        result.note=result.warnings.join(' ');
        return result;
      }
    }
    if(!allA.length||!allB.length||!groupB.length)throw Error('活动日期或门店范围内没有可比较数据。');
    if(!sameType){
      const valuesA=take(groupA,allA,true),valuesB=take(groupB,allB,true);
      const describe=(activity,range,group)=>activity.name+'（'+range[0]+' 至 '+range.at(-1)+'，'+range.length+' 天，'+group.length+' 家门店）';
      result.detail=describe(a,allA,groupA)+' 对比 '+describe(b,allB,groupB);
      result.labels=['当前活动','对比活动'];
      result.points=Array.from({length:Math.max(allA.length,allB.length)},(_,i)=>({
        date:allA[i]||allB[i],label:'第 '+(i+1)+' 天',actual:valuesA[i]??null,baseline:valuesB[i]??null
      }));
      result.delta=avg(valuesA)-avg(valuesB);
      result.baseline=avg(valuesB);
      result.unit=unit+'/店日';
      result.diagnostics=[['当前活动每店每日均值',avg(valuesA)],['对比活动每店每日均值',avg(valuesB)]];
      enrichComparison(result,a,b,groupA,groupB,allA,allB);
      comparisonEconomics(result,a,groupA,allA.length);
      result.note='各自按工作簿覆盖的活动期和参与门店计算。趋势按活动第几天对齐，较短档期结束后留空。观察差异可能受门店结构、季节及同期活动影响。';
      return result;
    }
    const length=Math.min(allA.length,allB.length);
    days=allA.slice(0,length);
    first=take(groupA,days,true); second=take(groupB,allB.slice(0,length),true);
    result.labels=['当前活动','同类活动'];
    result.detail=a.name+' 对比 '+b.name+' · 各自前 '+length+' 天 · '+groupA.length+' / '+groupB.length+' 家门店';
    result.delta=avg(first)-avg(second);
    result.baseline=avg(second);
    result.unit=unit+'/店日';
    enrichComparison(result,a,b,groupA,groupB,days,allB.slice(0,length));
    comparisonEconomics(result,a,groupA,length);
    result.note='按参与门店与共同天数标准化。数据为对应门店的会员与散客交易，含其他同期活动影响。';
  }else{
    if(!a||storeMode()||isLong(a))throw Error('请选择有门店对照的短期活动。');
    const groupB=shops(a.control_stores?.filter(name=>!a.stores.includes(name)),false);
    if(!a.control_stores?.length||!groupB.length)throw Error('工作簿缺少可用的门店对照。');
    const pre=dateRange(dateShift(a.start,-Number(f.pre)),dateShift(a.start,-1));
    const post=dateRange(a.start,a.end);
    if(pre.length!==Number(f.pre)||!post.length||post.at(-1)!==a.end)throw Error('工作簿无法覆盖该活动所选的前后窗口。');
    days=onlyPre?pre:[...pre,...post];
    first=take(groupA,days,true); second=take(groupB,days,true);
    const gaps=pre.map((_,i)=>first[i]-second[i]);
    const gapChange=avg(gaps.slice(pre.length/2))-avg(gaps.slice(0,pre.length/2));
    result.detail=a.name+' · '+groupA.length+' 家处理门店 / '+groupB.length+' 家对照门店 · '+days[0]+' 至 '+days.at(-1);
    result.labels=['处理组','对照组'];
    result.unit=unit+'/店日';
    result.start=a.start;
    result.title=onlyPre?'平行趋势诊断':'增量效果评估';
    result.note='探索性结果。活动前差值的变化用于检查趋势偏离；需复核同期活动、营业变化及组间污染。';
    result.diagnostics=[['前窗均值 '+result.labels[0],avg(first.slice(0,pre.length))],['前窗均值 '+result.labels[1],avg(second.slice(0,pre.length))],['前窗后半段与前半段的组间差值变化',gapChange]];
    if(!onlyPre){
      const ag=avg(first.slice(pre.length)),bg=avg(second.slice(pre.length));
      result.diagnostics.push(['活动期均值 '+result.labels[0],ag],['活动期均值 '+result.labels[1],bg]);
      result.delta=ag-bg-avg(gaps);
      result.baseline=bg+avg(gaps);
      comparisonEconomics(result,a,groupA,post.length);
      const variation=group=>group.map(shop=>avg(take([shop],post))-avg(take([shop],pre)));
      const changes=[variation(groupA),variation(groupB)];
      if(changes.every(xs=>xs.length>=10)){
        const variance=xs=>xs.reduce((s,x)=>s+(x-avg(xs))**2,0)/(xs.length-1)/xs.length;
        const margin=1.96*Math.sqrt(variance(changes[0])+variance(changes[1]));
        result.interval=[result.delta-margin,result.delta+margin];
      }
    }
  }
  result.points??=days.map((date,i)=>({date,actual:first[i],baseline:second[i]}));
  return result;
}

function resultSummary(r) {
  if(r.summary)return r.summary;
  if(!numeric(r.delta)) return r.diagnostics.map(([label,value])=>label+' '+fmt(value,2)+(r.method==='did'?' '+r.unit:'')).join('；');
  const formula=r.method==='did'?'计算口径：（处理组活动期 − 处理组前期）−（对照组活动期 − 对照组前期）；相对差异＝DID ÷ 处理组同期反事实。':
    r.unit.endsWith('/店日')?'计算口径：活动窗口内总营收或订单 ÷ 参与门店数 ÷ 日历天数；绝对差异＝当前值 − 基准值，相对差异＝绝对差异 ÷ 基准值。':
    '计算口径：绝对差异＝当前窗口合计 − 基准窗口合计；相对差异＝绝对差异 ÷ 基准窗口合计。';
  const relative=r.baseline>0?'（'+pct(r.delta/r.baseline*100)+'）':'';
  const interval=r.interval?'。近似 95% 区间 '+r.interval.map(x=>fmt(x,2)).join(' 至 ')+' '+r.unit+'（点估计 ± 1.96 × 门店前后差的组间标准误）':'';
  return (r.method==='did'?'DID 探索估计 ':'观察差异 ')+fmt(r.delta,2)+' '+r.unit+relative+interval+'。'+formula;
}

function evidenceHTML(r) {
  if(r.snapshotHTML)return '<article class="panel pad evidence-card"><h3>'+escape(r.title)+'</h3>'+r.snapshotHTML+
    (r.note?'<p class="preserve" data-language-original>'+escape(r.note)+'</p>':'')+'</article>';
  return '<article class="panel pad evidence-card"><h3>'+escape(r.title)+'</h3><p class="sub">'+escape(r.detail)+' · '+escape(r.source)+'</p>'+
    (r.points.length?chart(r.points,{heading:escape(r.title),unit:escape(r.unit),first:r.labels[0],second:r.labels[1]||'',start:r.start}):'')+
    (r.warnings?.length?'<details class="fold"><summary>活动期间与门店范围提示</summary><ul>'+r.warnings.map(text=>'<li>'+escape(text)+'</li>').join('')+'</ul></details>':'')+
    comparisonReportHTML(r)+
    (!r.comparison?'<p><strong>'+escape(resultSummary(r).split('。计算口径：')[0])+'</strong></p>':'')+
    (!r.comparison&&r.diagnostics?table([['指标'],[['did','period','general'].includes(r.method)?escape(r.unit):'数值','num']],r.diagnostics.map(([label,value])=>[escape(label),fmt(value,2)])):'')+
    (!r.comparison?'<p class="sub">'+escape(r.note)+'</p>':'')+'</article>';
}

function showResult() {
  const output=main.querySelector('#analysis-output');
  if(lastResult) output.innerHTML=evidenceHTML(lastResult)+'<div class="row toolbar"><button data-work="save-run">保存结果</button><button data-work="send-run">加入素材草稿纸</button></div>';
  main.querySelector('#run-list').innerHTML=currentRuns.length?currentRuns.map((r,i)=>'<div class="row run-row"><span>'+escape(r.title+' · '+r.detail)+'</span><button data-work="view-run" data-value="'+i+'">打开</button></div>').join(''):'<p class="sub">运行比较后可保存到当前浏览器。</p>';
}

function scopeSnapshot(activity) {
  if(activity&&isLong(activity)){
    return {title:activity.name+'｜常设活动概况',detail:activity.type+' · '+activity.channels.join('、'),
      source:'会员与散客交易',unit:'',labels:[],points:[],
      summary:permanentMetrics(activity).map(([key,value])=>key+' '+value).join('；'),
      note:activities[activity.activity_id].activity.mechanism};
  }
  const shops=availableStores().filter(s=>activity?activity.stores.includes(s.name):(!summaryScope.store||s.name===summaryScope.store)&&(!summaryScope.district||s.district===summaryScope.district));
  const days=activity?dateRange(activity.start,activity.end):dateRange(summaryScope.from,summaryScope.to);
  const channel=activity?'':summaryScope.channel;
  const values=sample(shops,days,'revenue',channel);
  const orders=sample(shops,days,'orders',channel);
  const source=(activity?.scenario?'新增活动方案 · ':'')+'会员与散客交易 · '+(channel||'全部交易渠道');
  const points=days.map((date,i)=>({date,actual:orders[i]?values[i]:null,baseline:null}));
  return {title:activity?activity.name+'｜总营收与订单':'总营收与订单',detail:(days.length?days[0]+' 至 '+days.at(-1):'无有效活动窗口')+' · '+(activity?shops.length+' 家范围内门店':summaryScope.store||summaryScope.district|| (storeMode()?store:'全部门店')),
    source,unit:'HKD',labels:['总营收'],points,
    diagnostics:[['区间总营收（HKD）',values.reduce((sum,n)=>sum+n,0)],['总单量（单）',orders.reduce((sum,n)=>sum+n,0)]],
    note:'覆盖所选门店的会员与散客交易。无交易记录的日期留空，营业状态待核。'};
}

const reportDefault=()=>({title:'营销活动复盘',text:'',evidence:[]});
function reportDraft() {
  try{return JSON.parse(localStorage.getItem('pacific-workbench-v7-'+role))||reportDefault()}
  catch{return reportDefault()}
}
let draftState;
let draftRole;
function workspaceDraft() {
  if(draftRole!==role){draftRole=role;draftState=reportDraft()}
  return draftState;
}
function saveWorkspace() {
  try{
    localStorage.setItem('pacific-workbench-v7-'+role,JSON.stringify(workspaceDraft()));
    return '草稿已保存在当前浏览器';
  } catch{return '浏览器无法保存草稿，可在离开前导出。'}
}
function includeEvidence(result) {
  const draft=workspaceDraft();
  if(!draft.evidence.some(item=>JSON.stringify(item)===JSON.stringify(result)))draft.evidence.push(result);
  saveWorkspace();
  if(location.hash==='#reports')renderWorkspace();else location.hash='#reports';
}

function renderWorkspace(preview=false) {
  const draft=workspaceDraft();
  main.innerHTML=head('报告工作台','选用总览图表和对比结果，编辑后预览与导出。')+
    '<section class="panel toolbar no-print"><button data-work="preview" data-value="'+(!preview)+'">'+(preview?'返回编辑':'预览报告')+'</button>'+
    '<button data-work="pdf">打印 / 导出 PDF</button><button data-work="word">导出 Word</button><span id="workspace-status" role="status" class="sub"></span></section>'+
    '<div class="workspace-grid">'+
    '<aside class="panel pad no-print"><div class="row spread"><h2>引用素材</h2><button class="compact-action" data-scratch="open">调用草稿纸</button></div>'+
    (draft.evidence.length?draft.evidence.map((r,i)=>'<div class="asset"><strong>'+escape(r.title)+'</strong><small>'+escape(r.detail)+'</small><button data-work="remove-evidence" data-value="'+i+'">移除</button></div>').join(''):'<p class="sub">从总览或对比分析加入素材。</p>')+
    '<a href="#analysis/compare">打开对比分析 →</a></aside>'+
    '<div class="report-main-column"><article class="report panel pad workspace-paper">'+
    (preview?'<h2 data-language-original>'+escape(draft.title)+'</h2><div class="report-rich-content" data-language-original>'+reportDocumentHTML(draft,true)+'</div>':
      '<label class="editor-field">报告标题<input data-draft="title" value="'+escape(draft.title)+'"></label>'+
      reportEditorHTML(draft)+
      '<div class="print-value"><h2 id="print-title" data-language-original>'+escape(draft.title)+'</h2><div id="print-text" class="report-rich-content" data-language-original>'+reportDocumentHTML(draft,true)+'</div></div>')+
    '<footer>数据来源：太平洋咖啡 · 会员与散客交易</footer></article>'+
    '<div class="report-ai-launch no-print"><button type="button" class="compact-action accent-action" data-work="toggle-ai" aria-expanded="false" aria-controls="report-ai-panel">AI报告助手</button></div>'+
    '<section id="report-ai-panel" class="panel pad no-print" hidden><p class="sub">根据报告素材生成可编辑的复盘段落。</p>'+
    '<div class="assist-buttons"><button data-work="generate">AI数据总结</button><button data-work="ai">AI帮写</button></div>'+
    '<p id="draft-suggestion" class="preserve" aria-live="polite"></p><button id="insert-suggestion" data-work="insert" hidden>追加到正文</button></section></div></div>';
  void prepareReportImages(draft);
}

function draftEvidenceText() {
  return workspaceDraft().evidence.map(r=>r.title+'｜'+r.detail+'\n'+comparisonConclusionText(r)+'\n'+resultSummary(r)+(r.comparison?'':'\n'+r.note)).join('\n\n');
}

async function suggest(useAI) {
  const output=main.querySelector('#draft-suggestion'), insert=main.querySelector('#insert-suggestion');
  insert.hidden=true;
  const evidence=draftEvidenceText();
  if(!evidence){output.textContent='请先从总览或对比分析加入素材。';return}
  if(!useAI){
    output.textContent='一、活动表现与比较\n'+evidence+'\n\n二、下一步\n核对异常时段、同期活动与数据覆盖，并记录后续行动。';
    insert.hidden=false;
    return;
  }
  let session;
  try{
    const model=globalThis.LanguageModel;
    const config={expectedInputs:[{type:'text',languages:['zh']}],expectedOutputs:[{type:'text',languages:['zh']}]};
    if(!model||await model.availability(config)!=='available'){
      output.textContent='当前浏览器的本机 AI 未就绪。可先生成数据摘要并手工编辑。';
      return;
    }
    output.textContent='正在根据已选素材起草…';
    session=await model.create(config);
    output.textContent=await session.prompt('请根据以下营销数据证据写一份中文复盘草稿，含关键发现、局限和可验证的下一步。严格保留原数值和单位，探索性结果不能写成因果结论。\n'+evidence);
    insert.hidden=false;
  }catch{
    output.textContent='本机 AI 暂时无法起草，可使用数据摘要。';
  }finally{session?.destroy()}
}

function trendPng(result) {
  const canvas=document.createElement('canvas');
  canvas.width=1000;
  canvas.height=310;
  const ctx=canvas.getContext('2d');
  const values=result.points.flatMap(p=>[p.actual,p.baseline]).filter(numeric);
  const maximum=Math.max(1,...values);
  const left=104, right=970, top=50, bottom=258;
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.font='18px sans-serif';
  ctx.fillStyle='#51413a';
  ctx.fillText(result.unit,16,31);
  ctx.fillText(result.points[0].label||result.points[0].date,left,292);
  ctx.textAlign='right';
  ctx.fillText(result.points.at(-1).label||result.points.at(-1).date,right,292);
  for(let i=0;i<=4;i++){
    const y=bottom-(bottom-top)*i/4;
    ctx.strokeStyle='#e2d8cf';
    ctx.beginPath();
    ctx.moveTo(left,y);
    ctx.lineTo(right,y);
    ctx.stroke();
    ctx.fillText(fmt(maximum*i/4),left-8,y+5);
  }
  ctx.textAlign='left';
  for(const [index,key] of ['actual','baseline'].entries()){
    if(!result.labels[index])continue;
    const color=index?'#a87752':'#b92536';
    ctx.fillStyle=color;
    ctx.fillText(result.labels[index],left+index*210,27);
    ctx.strokeStyle=color;
    ctx.lineWidth=3;
    ctx.setLineDash(index?[8,5]:[]);
    ctx.beginPath();
    let previous=false;
    result.points.forEach((p,i)=>{
      if(!numeric(p[key])){previous=false;return}
      const x=left+(right-left)*i/Math.max(1,result.points.length-1);
      const y=bottom-(bottom-top)*p[key]/maximum;
      if(previous)ctx.lineTo(x,y);else ctx.moveTo(x,y);
      previous=true;
    });
    ctx.stroke();
  }
  return Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0));
}

function downloadWord(draft) {
  const xmlHeader='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const paragraph=(text,bold=false)=>'<w:p><w:r>'+(bold?'<w:rPr><w:b/></w:rPr>':'')+'<w:t xml:space="preserve">'+escape(text)+'</w:t></w:r></w:p>';
  const image=(id,title)=>'<w:p><w:r><w:drawing><wp:inline><wp:extent cx="5300000" cy="1643000"/>'+
    '<wp:docPr id="'+id+'" name="Trend '+id+'" descr="'+escape(title)+'"/>'+
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>'+
    '<pic:nvPicPr><pic:cNvPr id="'+id+'" name="Trend '+id+'"/><pic:cNvPicPr/></pic:nvPicPr>'+
    '<pic:blipFill><a:blip r:embed="rId'+id+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'+
    '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="5300000" cy="1643000"/></a:xfrm>'+
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'+
    '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
  const files={
    '[Content_Types].xml':xmlHeader+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels':xmlHeader+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
  };
  const relations=[];
  const documentHost=document.createElement('div');documentHost.innerHTML=reportDocumentHTML(draft,true);
  let figureNumber=0;
  const renderWordNode=node=>{
    if(node.nodeType===3)return node.textContent.trim()?paragraph(node.textContent):'';
    if(node.matches('[data-report-row]')){
      const cells=[...node.querySelectorAll('figure')].map(figure=>{
        const img=figure.querySelector('img');if(!img)return '';
        const id=++figureNumber,title=img.alt||'';
        files['word/media/trend'+id+'.png']=Uint8Array.from(atob(img.src.split(',')[1]),c=>c.charCodeAt(0));
        relations.push('<Relationship Id="rId'+id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/trend'+id+'.png"/>');
        const width=parseFloat(figure.style.getPropertyValue('--image-width'))||100;
        const px=Number(img.getAttribute('width'))||900;
        const bytes=files['word/media/trend'+id+'.png'];
        const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
        const ratio=bytes.length>24?view.getUint32(20)/view.getUint32(16):.4;
        const cx=Math.round(5300000*width/100),cy=Math.round(cx*ratio);
        const drawing=image(id,title).replaceAll('5300000',String(cx)).replaceAll('1643000',String(cy));
        const caption=figure.querySelector('.image-remark-text')?.textContent||'';
        return '<w:tc><w:tcPr><w:tcW w:w="'+Math.round(8300*width/100)+'" w:type="dxa"/></w:tcPr>'+paragraph(title,true)+drawing+(caption?paragraph(caption):'')+'</w:tc>';
      }).join('');
      return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tr>'+cells+'</w:tr></w:tbl>';
    }
    if(node.matches('p,h1,h2,h3,li,blockquote'))return paragraph(node.textContent,node.matches('h1,h2,h3'));
    return [...node.childNodes].map(renderWordNode).join('');
  };
  const evidence=[...documentHost.childNodes].map(renderWordNode).join('');
  files['word/_rels/document.xml.rels']=xmlHeader+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+relations.join('')+'</Relationships>';
  files['word/document.xml']=xmlHeader+'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '+
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '+
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
    '<w:body>'+paragraph(draft.title,true)+evidence+
    paragraph('数据来源：太平洋咖啡 · 会员与散客交易')+'</w:body></w:document>';
  const href=URL.createObjectURL(new Blob(zipDocument(files),{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
  const link=document.createElement('a');
  link.href=href;
  link.download=(draft.title.trim()||'营销活动复盘').replace(/[\\/:*?"<>|]/g,'_')+'.docx';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(href),10000);
}

function zipDocument(files) {
  const encode=new TextEncoder(), local=[], central=[];
  const header=length=>{
    const bytes=new Uint8Array(length), view=new DataView(bytes.buffer);
    return {bytes,word:(at,value)=>view.setUint16(at,value,true),long:(at,value)=>view.setUint32(at,value,true)};
  };
  let offset=0, directoryLength=0;
  for(const [filename,content] of Object.entries(files)){
    const name=encode.encode(filename), data=typeof content==='string'?encode.encode(content):content;
    let crc=-1;
    for(const byte of data){
      crc^=byte;
      for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
    }
    const l=header(30), c=header(46);
    l.long(0,0x04034b50); l.word(4,20); l.long(14,~crc);
    l.long(18,data.length); l.long(22,data.length); l.word(26,name.length);
    c.long(0,0x02014b50); c.word(4,20); c.word(6,20); c.long(16,~crc);
    c.long(20,data.length); c.long(24,data.length); c.word(28,name.length); c.long(42,offset);
    local.push(l.bytes,name,data); central.push(c.bytes,name);
    offset+=30+name.length+data.length;
    directoryLength+=46+name.length;
  }
  const end=header(22), count=Object.keys(files).length;
  end.long(0,0x06054b50); end.word(8,count); end.word(10,count);
  end.long(12,directoryLength); end.long(16,offset);
  return [...local,...central,end.bytes];
}

document.addEventListener('input',event=>{
  const key=event.target.dataset.draft;
  if(!key)return;
  workspaceDraft()[key]=event.target.value;
  main.querySelector('#print-'+key).textContent=event.target.value;
  main.querySelector('#workspace-status').textContent=saveWorkspace();
});
document.addEventListener('change',event=>{
  const key=event.target.dataset.analysis;
  if(!key)return;
  analysisForm[key]=event.target.value;
  lastResult=undefined;
  if(key==='activity')analysisForm.peer='';
  if(key==='periodMonth')analysisForm.periodActivity='';
  if(key==='referenceMonth')analysisForm.periodPeer='';
  renderAnalysis();
});
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-work]');
  if(!button)return;
  const {work,value}=button.dataset;
  switch(work){
    case 'activity-report': {
      const activity=visible().find(item=>item.activity_id===value);
      if(activity) includeEvidence(scopeSnapshot(activity));
      break;
    }
    case 'method':
      analysisForm.method=value;
      lastResult=undefined;
      renderAnalysis();
      break;
    case 'run': case 'diagnose':
      try{
        lastResult=calculate(work==='diagnose');showResult();
        if(lastResult.warnings?.length)showDialog('同类型活动对比提示',
          '<ul>'+lastResult.warnings.map(text=>'<li>'+escape(text)+'</li>').join('')+'</ul>');
      }
      catch(error){
        lastResult=undefined;
        main.querySelector('#analysis-output').innerHTML='<p class="notice">'+escape(error.message)+'</p>';
      }
      break;
    case 'save-run':
      if(!currentRuns.includes(lastResult))currentRuns.unshift(lastResult);
      showResult();
      try{localStorage.setItem('pacific-comparisons-v7-'+role,JSON.stringify(currentRuns))}
      catch{button.textContent='本次会话已保存'}
      break;
    case 'view-run': lastResult=currentRuns[Number(value)];showResult();break;
    case 'send-run': scratchEvidence(lastResult); break;
    case 'remove-evidence':
      workspaceDraft().evidence.splice(Number(value),1);
      saveWorkspace();
      renderWorkspace();
      break;
    case 'toggle-ai': {
      const panel=main.querySelector('#report-ai-panel');
      panel.hidden=!panel.hidden;
      button.setAttribute('aria-expanded',String(!panel.hidden));
      break;
    }
    case 'preview': renderWorkspace(value==='true'); break;
    case 'generate': case 'ai': void suggest(work==='ai'); break;
    case 'insert':
      rememberReportChange();
      workspaceDraft().bodyHTML=reportBodyHTML(workspaceDraft())+reportBodyHTML({text:main.querySelector('#draft-suggestion').textContent});
      workspaceDraft().text=reportPlainText(workspaceDraft().bodyHTML);
      saveWorkspace();
      renderWorkspace();
      break;
    case 'pdf': window.print(); break;
    case 'word': downloadWord(workspaceDraft()); break;
  }
});
