'use strict';
const {activities, activity_summaries: summaries, meta, config} = window.MOCK;
const rules = config.thresholds;
const heroId = 'CMP-2026-0012';
const store = config.demo_store;
const main = document.querySelector('main');
const roleSelect = document.querySelector('#role');
const dialog = document.querySelector('dialog');
const picked = new Set();
let role = 'manager', page = 1, editing = false;
let filters = {query:'', month:'', status:'', channel:'', owner:''};
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
const numeric = n => Number.isFinite(n);
const fmt = (n, digits = 0) => numeric(n) ? n.toLocaleString('zh-CN',{minimumFractionDigits:digits,maximumFractionDigits:digits}).replace('-','−') : '无可用数据';
const money = n => numeric(n) ? fmt(n/10000,1)+' 万港元' : '无可用数据';
const ratio = n => numeric(n) ? fmt(n,2) : '暂不可估';
const date = x => (x || '').slice(0,10);
const pct = n => numeric(n) ? fmt(n,1)+'%' : '无可用数据';
const url = (id,tab='overview',anchor='') => '#activity/'+id+'/'+tab+(anchor?'/'+anchor:'');
const storeMode = () => role === 'store';
const ownRows = a => a.breakdown.dimensions.store?.rows || [];
const storeRow = a => ownRows(a).find(r=>r.dimension_value===store);
const ordered = [...summaries].sort((a,b) => (b.activity_id===heroId)-(a.activity_id===heroId) || b.end.localeCompare(a.end));
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
function catalog() {
  const rows=visible(), featured=rows.find(s=>s.activity_id===heroId) || rows[0], a=activities[featured.activity_id], e=state(a);
  const stats=storeMode() ? [
    ['本店覆盖活动',rows.length,store],['本店已复盘活动',rows.filter(s=>s.status==='已复盘').length,'按原型运行状态'],['本店进行中活动',rows.filter(s=>s.status==='进行中').length,'核对执行进度']
  ] : role==='ops' ? [
    ['我负责的活动',rows.length,'增长运营组'],['待补数据',rows.filter(s=>!state(activities[s.activity_id]).completeness).length,'完整度低于 90%'],['复盘草稿',rows.filter(s=>reportState(s.activity_id)==='草稿').length,'浏览器保存']
  ] : [
    ['全部活动',rows.length,'FY2026 模拟活动库'],['估计净 ROI ≥ 1.00',rows.filter(s=>numeric(state(activities[s.activity_id]).roi)&&state(activities[s.activity_id]).roi>=1).length,'含仅供参考结果'],['待核验证据',rows.filter(s=>state(activities[s.activity_id]).label!=='证据通过').length,'查看证据后再决策']
  ];
  main.innerHTML=head('活动目录',storeMode()?store+' · 本店覆盖活动':role==='ops'?'增长运营组 · 我负责的活动':'全部活动 · 查看活动表现与复盘证据')+
  '<section class="feature"><div><div class="eyebrow">'+(storeMode()?'本店执行':'重点复盘')+'</div><h2>'+escape(featured.name)+'</h2><p>'+ (storeMode()?'核对本店发券与核销记录，记录执行差异。':'按 v6 回流假设估算，未达盈亏线。证据仅供参考。')+'</p><div class="row">'+link(featured.activity_id,storeMode()?'overview':'evidence',storeMode()?'查看执行要点 →':'查看对照组问题 →','button feature-action')+'</div></div><div class="signal"><small>'+ (storeMode()?'负责门店':'估计净 ROI')+'</small><div class="big">'+(storeMode()?store:ratio(e.roi))+'</div><div>'+(storeMode()?badge(e):'盈亏线 1.00 &nbsp; '+badge(e))+'</div></div></section>'+
  '<section class="metrics" aria-label="岗位指标">'+stats.map(v=>metric(...v)).join('')+'</section>'+
  '<section class="panel"><div class="table-head row spread"><h2>活动列表</h2><div id="selection" class="row"></div></div><div class="toolbar"><input id="query" type="search" aria-label="搜索活动名称" placeholder="⌕  搜索活动名称"><select id="month" aria-label="结束月份">'+options([...new Set(rows.map(s=>date(s.end).slice(0,7)))].sort().reverse(),'全部时间')+'</select><select id="status" aria-label="运行状态">'+options([...new Set(rows.map(s=>s.status))],'全部状态')+'</select><details><summary class="button">更多筛选 ⌄</summary><div class="filterpop"><label>渠道<select id="channel">'+options([...new Set(rows.flatMap(s=>s.channels))],'全部渠道')+'</select></label><label>负责人<select id="owner">'+options([...new Set(rows.map(s=>s.owner))],'全部负责人')+'</select></label></div></details><button data-action="reset">清除筛选</button></div><div id="listing"></div><div class="footline row spread tiny muted" id="pages"></div></section>';
  for(const key of Object.keys(filters)) document.getElementById(key).value=filters[key];
  list();
}
function list(){
  const q=filters.query.trim().toLowerCase();
  const rows=visible().filter(s=>s.name.toLowerCase().includes(q) && (!filters.month||s.end.startsWith(filters.month)) && (!filters.status||s.status===filters.status) && (!filters.channel||s.channels.includes(filters.channel)) && (!filters.owner||s.owner===filters.owner));
  const size=8, pages=Math.max(1,Math.ceil(rows.length/size));
  page=Math.min(pages,page);
  const columns=(role==='manager'?'<th class="checkcell" scope="col"><span aria-label="选择对比活动">选</span></th>':'')+'<th scope="col">活动名称</th><th scope="col">结束时间</th><th scope="col">运行状态</th><th scope="col" class="num">'+(storeMode()?'本店范围':'参考净 ROI')+'</th><th scope="col">结果可用性</th><th scope="col">操作</th>';
  document.querySelector('#listing').innerHTML='<div class="scroller"><table><thead><tr>'+columns+'</tr></thead><tbody>'+ (rows.length?rows.slice((page-1)*size,page*size).map(s=>{
    const id=s.activity_id,a=activities[id],e=state(a);
    const entry=storeMode()?link(id,'overview','查看本店 →','entry'):
      role!=='ops'?link(id,'overview','查看复盘 →','entry'):
      !e.completeness?link(id,'evidence','查看待补数据 →','entry','quality'):
      load(id).finalized?link(id,'report','预览定稿 →','entry'):
      '<button class="entry linkbutton" data-action="edit-from" data-id="'+id+'">编辑复盘 →</button>';
    return '<tr data-row="'+id+'">'+(role==='manager'?'<td class="checkcell"><input type="checkbox" data-pick="'+id+'" aria-label="选择 '+escape(s.name)+'" '+(picked.has(id)?'checked':picked.size>=3?'disabled':'')+'></td>':'')+
      '<td>'+link(id,'overview',escape(s.name)+'<small>'+escape(s.type)+' · '+escape(s.owner)+'</small>','campaign')+'</td><td class="nowrap">'+date(s.end)+'</td><td class="nowrap">'+escape(s.status)+'</td><td class="num">'+(storeMode()?'已覆盖':numeric(e.roi)?ratio(e.roi):link(id,'evidence','暂不可估'))+'</td><td>'+badge(e)+'</td><td>'+entry+'</td></tr>';
  }).join(''):'<tr><td colspan="7">没有匹配活动。可调整搜索或筛选条件。</td></tr>')+'</tbody></table></div>';
  document.querySelector('#selection').innerHTML=picked.size?'<span class="tiny muted">已选 '+picked.size+' / 3</span><button data-action="compare" '+(picked.size<2?'disabled':'')+'>对比活动</button>':'';
  document.querySelector('#pages').innerHTML='<span>共 '+rows.length+' 场活动</span><div class="row"><button data-action="prev" '+(page===1?'disabled':'')+'>上一页</button><span>'+page+' / '+pages+'</span><button data-action="next" '+(page===pages?'disabled':'')+'>下一页</button></div>';
}
function chart(points,{heading,unit='港元',first='实际',second='对照估计',start,end,caption=''}){
  if(!points.length || !points.some(p=>numeric(p.actual))) return '<p class="muted">无可用趋势数据。</p>';
  const has=points.some(p=>numeric(p.baseline));
  const all=points.flatMap(p=>[p.actual,p.baseline]).filter(numeric), w=800,h=242, sx=70,ex=775,sy=32,ey=192;
  const axis=v=>unit==='港元' && Math.abs(v)>=1000 ? fmt(v/1000,1)+'k' : fmt(v,unit==='指数'&&Math.abs(v)<2?2:0);
  const top=Math.ceil(Math.max(...all)/4)*4 || 4;
  const times=points.map(p=>Date.parse(p.date)), timed=times.every(numeric) && times.at(-1)>times[0];
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
    indices.map(i=>'<text x="'+x(i)+'" y="221" text-anchor="middle">'+escape(points[i].date.slice(5))+'</text>').join('')+
    points.map((p,i)=>{
      const tip=escape(p.date+'\n'+first+' '+fmt(p.actual,unit==='指数'?1:0)+' '+unit+(has?'\n'+second+' '+fmt(p.baseline,unit==='指数'?1:0)+' '+unit:''));
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
  const target=s.roi_target ?? rules.roi_target_default, below=numeric(e.roi)&&e.roi<rules.roi_breakeven;
  const action=storeMode()?link(id,'overview','查看本店执行要点','button primary','execution') : id===heroId?link(id,'evidence','查看对照组问题','button primary','checks') : !e.completeness?link(id,'evidence','查看待补数据','button primary','quality'):role==='ops'?'<button class="primary" data-action="edit-from" data-id="'+id+'">编辑复盘</button>':link(id,'report','查看复盘摘要','button primary');
  const conclusion=storeMode()?'本店在活动覆盖范围内，执行差异待核对。':numeric(e.roi)?(below?'估计未回本。':'估计达到盈亏线。')+' '+(e.label==='证据通过'?'模拟结果符合归因与显著性规则。':'当前结果不足以支持预算决策。'):e.reason;
  const stats=storeMode()?[
    ['本店覆盖','已覆盖',store],['本店会员营收',money(storeRow(a)?.revenue),'活动期会员交易'],['本店会员订单',numeric(storeRow(a)?.orders)?fmt(storeRow(a).orders):'无可用数据','活动期订单（单）']
  ]:[['净 ROI',ratio(e.roi),'盈亏线 '+fmt(rules.roi_breakeven,2)+' · 目标 '+fmt(target,2)],['参考净增量毛利',money(t.net?.net_gross_profit),'v6 校准表'],['交易日覆盖率',pct(a.data_quality.completeness),'报告闸门 ≥ 90%']];
  const tabs=[['overview','结果概览'],['evidence','归因证据'],['report','复盘报告']];
  main.innerHTML='<a class="back tiny" href="#activities">← 返回活动目录</a><div class="pagehead"><div class="row"><h1>'+escape(s.name)+'</h1>'+badge(e)+'</div><p class="sub">'+date(s.start)+' 至 '+date(s.end)+' · '+(storeMode()?store:s.stores.length+' 家覆盖门店 · '+escape(t.caliber?.campaign_window||'活动期'))+'</p></div><div class="notice row spread"><strong>'+conclusion+'</strong>'+action+'</div><div class="metrics">'+stats.map(v=>metric(...v)).join('')+'</div><nav class="tabs no-print" aria-label="详情导航">'+tabs.map(([key,label])=>link(id,key,label,key===tab?'active':'')).join('')+'</nav>'+
    (tab==='evidence'?evidence(a,e):tab==='report'?report(a,e):overview(a,e));
}
function overview(a,e){
  const s=a.activity_summary,t=a.attribution,id=s.activity_id;
  const execution='<section class="panel pad" id="execution"><h2>本店执行要点</h2><p>'+escape(a.activity.mechanism||'查看活动发布信息')+'</p><p class="sub">核对活动期本店发券与核销记录，记录客诉及门店执行差异。本店营收与订单为会员交易汇总。核销明细未提供，执行差异待验证。</p>'+link(id,'report','查看本店复盘摘要 →','source-link')+'</section>';
  if(storeMode())return execution+quality(a,e);
  const series=a.trend.series.revenue||[];
  const inCampaign=series.filter(p=>p.is_in_campaign);
  const rows=series.filter(p=>inCampaign.length ? p.date<=inCampaign.at(-1).date : true).map(p=>({...p,baseline:t.control_group?.size?p.baseline:null}));
  const has=rows.some(p=>numeric(p.baseline));
  const types=(a.breakdown.dimensions.store_type?.rows||[]).slice().sort((x,y)=>y.revenue-x.revenue);
  const dims=a.breakdown.dimensions.store?.rows||[];
  const amount=t.net?.total_investment;
  const support=[
    ['营收与毛利','会员营收',money(a.metrics.revenue),'参与门店·活动期'],
    ['营收与毛利','会员订单',fmt(a.metrics.orders),'参与门店·活动期（单）'],
    ['成本与回报','总投入',money(amount),'v6 校准表'],
    ['成本与回报','参考净 ROI',ratio(e.roi),'盈亏线 1.00'],
    ['触达与核销','触达记录',fmt(a.metrics.sent),'活动触达表（条）'],
    ['触达与核销','送达率',pct(a.metrics.delivery),'累计送达、打开、点击 ÷ 触达记录'],
    ['触达与核销','核销率','无可用数据','缺少核销流水']];

  return '<section class="panel pad" id="trend"><div class="row spread"><h2>日营收趋势</h2>'+badge(e)+'</div>'+chart(rows,{heading:'日营收趋势',start:date(s.start),end:date(s.end),caption:'图示 '+(rows[0]?.date||'—')+' 至 '+(rows.at(-1)?.date||'—')+'。'+(inCampaign.at(-1)?.date<date(s.end)?' 数据包仅提供活动期部分日序列，活动结束 '+date(s.end)+' 在图示范围外。':'')+(has?' 对照估计沿用原型口径。':' '+e.reason)})+'</section>'+
  '<div class="cols"><section class="panel pad" id="water"><div class="row spread"><h2>净增量毛利构成</h2>'+badge(e)+'</div>'+waterfall(a,e)+'</section><section class="panel pad" id="stores"><div class="row spread"><h2>门店类型对比</h2>'+badge(e)+'</div><p class="tiny muted">'+(e.label==='证据通过'?'按会员营收降序。':'门店差异待验证 · 按会员营收降序。')+'</p>'+(types.length?table([['门店类型'],['会员营收','num'],['会员订单','num']],types.map(r=>[escape(r.dimension_value),money(r.revenue),fmt(r.orders)])):'<p class="sub">无可用数据。</p>')+(dims.length?'<details class="fold"><summary>查看参与门店</summary>'+table([['门店'],['会员营收','num'],['会员订单','num']],dims.map((r,i)=>['<button data-action="store-detail" data-id="'+id+'" data-index="'+i+'">'+escape(r.dimension_value)+'</button>',money(r.revenue),fmt(r.orders)]))+'</details>':'')+'</section></div>'+
  '<section class="panel pad"><h2>次要指标</h2>'+table([['分组'],['指标'],['活动期数值','num'],['对比基准']],support.map(([group,label,value,base])=>[group,label,value,base]))+'<p class="tiny muted">统计期间 '+escape(t.caliber?.campaign_window||date(s.start)+' 至 '+date(s.end))+'</p></section>'+
  '<details class="panel fold"><summary>预算构成与活动档案</summary><p>计划 '+money(a.activity.budget?.planned)+' · 实际 '+money(amount)+'</p><p class="sub">v6 提供总投入，暂无核销让利和媒体费用拆分。</p><p class="sub">'+escape(a.activity.mechanism)+' · '+escape(s.owner)+'</p></details><details class="panel fold"><summary>详细口径</summary><p>'+escape(t.caliber?.formula||'仅描述性口径')+'</p><p class="sub">'+escape(t.net?.formula||'')+'</p></details>';
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
    store+'活动期会员营收 '+money(storeRow(a)?.revenue)+'，会员订单 '+fmt(storeRow(a)?.orders)+'。',
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
  return '<article class="report panel pad"><div class="row spread"><div class="row"><span class="sim">模拟数据</span>'+badge(e)+'</div><span class="tiny muted">'+(doc.finalized?'已定稿 · '+escape(doc.finalized):storeMode()?'本店摘要':'草稿')+'</span></div><h2 style="margin-top:10px">'+escape(s.name)+'｜复盘摘要</h2><p class="muted">'+date(s.start)+' 至 '+date(s.end)+' · '+(storeMode()?store:escape(s.owner))+'</p>'+
    (!e.completeness?'<div class="notice">'+e.reason+' 当前可预览草稿。</div>':'')+
    fields.map((value,i)=>'<section><h3>'+labels[i]+'</h3>'+(editing&&canEdit?'<textarea maxlength="450" aria-label="'+labels[i]+'">'+escape(value)+'</textarea>':'<p style="white-space:pre-wrap">'+escape(value)+'</p>')+link(id,links[i][0],links[i][1]+' →','source-link',links[i][2])+'</section>').join('')+
    '<footer>数据来源 '+escape(meta.source)+' · 原型归档 '+escape(meta.version)+' · 数据截至 '+escape(a.data_quality.cutoff_time)+'<br>证据状态 '+e.label+' · '+escape(a.report.caliber_version||'模拟活动库')+'</footer>'+
    '<div class="row no-print" style="margin-top:17px">'+(editing&&canEdit?'<button class="primary" data-action="save" data-id="'+id+'">保存草稿</button><button data-action="cancel">取消</button>':
    (canEdit?'<button data-action="edit">编辑草稿</button>':'')+'<button class="primary" data-action="print">'+(!e.completeness?'打印草稿 / 保存草稿 PDF':'打印 / 保存 PDF')+'</button>'+
    (role==='manager'&&!doc.finalized?'<button data-action="finalize" data-id="'+id+'" '+(!e.finalize?'disabled title="'+escape(e.reason)+'"':'')+'>确认定稿</button>':''))+'<span id="report-note" role="status" class="tiny muted"></span></div></article>';
}
function reports(){
  main.innerHTML=head('复盘报告',storeMode()?store+' · 本店复盘摘要':'预览一页摘要，按岗位编辑和定稿。')+
    '<section class="panel">'+table([['活动'],['报告状态'],['证据状态'],['操作']],visible().map(s=>[escape(s.name),storeMode()?'本店摘要':reportState(s.activity_id),badge(state(activities[s.activity_id])),link(s.activity_id,'report','预览摘要 →','entry')]))+'</section>';
}
function methods(){
  main.innerHTML=head('帮助与方法','项目规则、数据来源与演示身份')+
  '<section class="panel pad"><h2>证据与报告规则</h2>'+table([['检查'],['项目规则'],['未通过后的处理']],[
    ['数据完整度','≥ 90%','阻断正式报告，保留草稿预览。'],
    ['活动前趋势相关系数','r ≥ 0.8','结果仅供参考，复核对照组。'],
    ['活动前均值偏差','≤ 15%','结果仅供参考，复核对照组。'],
    ['最大分层偏差','≤ 2%','结果仅供参考，复核分层匹配。'],
    ['归因成立后的显著性','95% 置信区间排除 0','区间包含 0 时显示「未观察到显著效果」。']
  ])+'</section><section class="panel pad"><h2>数据来源</h2><p>'+escape(meta.note)+'</p><p class="sub">v6 非唤回活动的效果来自档位校准。唤回活动的参考净增量按触后康复消费 × 68% 毛利率 ×（1 − 35% 自然回流假设）计算。独立模拟页另行使用已知增量验证 DID。</p><p class="sub">币种为港元。净 ROI =（估计增量毛利 − 蚕食）÷ 总投入。透支单独展示。</p><p class="sub">演示身份切换仅控制此原型。正式使用由服务端校验活动、门店、字段的访问范围与定稿权限。</p></section><a class="button primary" href="#simulation">打开模拟验证 →</a>';
}
function simulation(){
  const sim=window.VALIDATION;
  main.innerHTML=head('模拟验证','课程 Final · 使用已知增量检验同一套归因口径')+
  '<section class="metrics">'+metric('门店',21,'按门店分组')+metric('数据表',6,'固定种子生成')+metric('实验窗口','28 + 28 天','活动前 / 活动期')+'</section>'+
  '<section class="panel pad"><div class="row spread"><h2>增量恢复结果</h2><span class="sim">模拟数据</span></div><p class="sub">指标为活动期处理门店累计增量毛利。按门店计算前后日均差，使用近似 Welch 95% t 区间。</p>'+
  table([['场景'],['预设增量','num'],['估计增量','num'],['95% 区间（港元）','num'],['误差','num'],['结论']],sim.runs.map(r=>[r.name,fmt(r.truth)+' 港元',fmt(r.estimate)+' 港元',r.ci.map(x=>fmt(x)).join(' 至 '),fmt(r.estimate-r.truth)+' 港元',r.passed?(r.ci[0]<=0&&r.ci[1]>=0?'未观察到显著效果':'观察到显著效果'):'仅供参考']))+'</section>'+
  '<section class="panel pad"><h2>项目阈值实测</h2>'+table([['场景'],['相关系数 ≥ 0.8','num'],['均值偏差 ≤ 15%','num'],['分层偏差 ≤ 2%','num'],['处理']],sim.runs.map(r=>[r.name,fmt(r.r,3),pct(r.mean),pct(r.strata),r.passed?'进入区间判断':'降级为仅供参考']))+
  '<p class="sub tiny">以上均为本页模拟的运行结果。趋势使用未归一化日毛利的 7 日滚动均值。</p></section>'+
  '<details class="panel fold"><summary>六张表与生成约束</summary><p>每个场景用 14 家活动组和 7 家对照组门店，三个合成分层按 2∶1 配比。两组共享日期波动，活动期间每家活动组门店增加相同毛利，正增量与零增量用同一底表。失配场景将对照组的活动前波动反向，检验触发降级。</p>'+table([['表'],['每场景行数','num']],Object.entries(sim.tables).map(([name,count])=>[name,count]))+'<p class="sub tiny">可运行随附的 simulate.py 重新生成结果。</p></details><a class="button" href="#activities">返回活动目录 →</a>';
}
function render(){
  let [section,id,tab,anchor]=location.hash.slice(1).split('/');
  section=section||'activities';
  if(section==='activity'&&!visible().some(s=>s.activity_id===id)){location.hash='#activities';return}
  const nav=section==='activity'?'activities':section;
  document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===nav); if(a.dataset.nav===nav) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current')});
  if(nav==='methods'||nav==='simulation') document.querySelector('#helpNav').open=true;
  if(section==='activity') detail(id, ['overview','evidence','report'].includes(tab)?tab:'overview');
  else if(nav==='reports') reports();
  else if(nav==='methods') methods();
  else if(nav==='simulation') simulation();
  else catalog();
  if(anchor) document.getElementById(anchor)?.scrollIntoView({block:'start'});
}
function showDialog(title,content){
  dialog.innerHTML='<div class="row spread"><h2>'+title+'</h2><form method="dialog"><button aria-label="关闭弹窗">关闭</button></form></div>'+content;
  dialog.showModal();
}
function compare(){
  const acts=visible().filter(s=>picked.has(s.activity_id)).map(s=>activities[s.activity_id]);
  if(acts.length<2||acts.length>3||role!=='manager') return;
  const rows=[['净 ROI',a=>ratio(state(a).roi)],['运行状态',a=>escape(a.activity_summary.status)],['结果可用性',a=>badge(state(a))],['数据完整度',a=>pct(a.data_quality.completeness)]];
  showDialog('活动对比',table([['指标'],...acts.map(a=>[escape(a.activity_summary.name),'num'])],rows.map(([label,f])=>[label,...acts.map(f)]))+'<p class="sub tiny">预算决策前先检查各活动的证据状态。</p>');
}
roleSelect.addEventListener('change',()=>{
  role=roleSelect.value;page=1;editing=false;picked.clear();
  filters={query:'',month:'',status:'',channel:'',owner:''};
  if(location.hash==='#activities'||!location.hash) render();else location.hash='#activities';
});
window.addEventListener('hashchange',()=>{if(!location.hash.includes('/report')) editing=false;render();if(location.hash.split('/').length<4)window.scrollTo(0,0)});
main.addEventListener('input',ev=>{if(ev.target.id==='query'){filters.query=ev.target.value;page=1;list()}});
main.addEventListener('change',ev=>{
  const {id,dataset,checked,value}=ev.target;
  if(['month','status','channel','owner'].includes(id)){filters[id]=value;page=1;list()}
  if(dataset.pick){
    if(checked&&picked.size<3)picked.add(dataset.pick);
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
  if(action==='compare')compare();
  if(action==='prev'||action==='next'){page+=action==='prev'?-1:1;list();document.querySelector('.table-head').scrollIntoView({block:'nearest'})}
  if(action==='reset'){filters={query:'',month:'',status:'',channel:'',owner:''};page=1;catalog()}
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
    if(r)showDialog(escape(r.dimension_value),'<p>'+badge(state(a))+'</p><p class="sub">会员营收 '+money(r.revenue)+' · 会员订单 '+fmt(r.orders)+'</p><p class="sub">门店差异待验证。</p>');
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
render();
