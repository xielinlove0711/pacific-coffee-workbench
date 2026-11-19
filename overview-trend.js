'use strict';

let overviewTrendPoints=[];
let overviewTrendPeriod='day';
let pinnedOverviewPoint=null;

function groupedOverviewPoints(points,period){
  const buckets=new Map();
  for(const p of points){
    let key=p.date;
    if(period==='month')key=p.date.slice(0,7);
    if(period==='week'){
      const day=new Date(p.date+'T00:00:00Z');
      day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);
      key=day.toISOString().slice(0,10);
    }
    if(!buckets.has(key))buckets.set(key,{date:p.date,end:p.date,actual:null,baseline:null});
    const b=buckets.get(key);b.end=p.date;
    for(const field of ['actual','baseline'])if(numeric(p[field]))b[field]=(b[field]??0)+p[field];
  }
  return [...buckets.values()];
}

function overviewTrendPanel(points){
  overviewTrendPoints=points;
  pinnedOverviewPoint=null;
  return '<section class="panel pad overview-trend-panel"><div class="row spread"><div><h2>营收与活动投入</h2>'+
    '</div>'+
    '<div class="trend-period" role="group" aria-label="趋势周期">'+[['day','日'],['week','周'],['month','月']].map(([value,label])=>
    '<button type="button" data-trend-period="'+value+'" aria-pressed="'+(value===overviewTrendPeriod)+'">'+label+'</button>').join('')+'</div></div>'+
    '<div id="overview-trend-body">'+overviewTrendBody()+'</div></section>';
}

function overviewTrendBody(){
  const points=groupedOverviewPoints(overviewTrendPoints,overviewTrendPeriod);
  if(!points.some(p=>numeric(p.actual)))return '<p>暂无可用趋势。</p>';
  const w=1000,h=290,l=66,r=975,t=30,b=238;
  const max=Math.max(1,...points.flatMap(p=>[p.actual,p.baseline]).filter(numeric));
  const step=10**Math.floor(Math.log10(max));
  const top=Math.ceil(max/step)*step;
  const x=i=>l+(r-l)*i/Math.max(1,points.length-1);
  const y=value=>b-value/top*(b-t);
  const line=key=>{
    let previous=false;
    return points.map((p,i)=>{
      if(!numeric(p[key])){previous=false;return ''}
      const command=previous?'L':'M';previous=true;
      return command+x(i).toFixed(2)+','+y(p[key]).toFixed(2);
    }).join(' ');
  };
  const area=[];
  let segment=[];
  const flush=()=>{
    if(segment.length){
      const [first,last]=[segment[0],segment.at(-1)];
      area.push('M'+x(first)+','+b+' '+segment.map(i=>'L'+x(i)+','+y(points[i].actual)).join(' ')+' L'+x(last)+','+b+'Z');
      segment=[];
    }
  };
  points.forEach((p,i)=>{if(numeric(p.actual))segment.push(i);else flush()});flush();
  const hasSpend=points.some(p=>numeric(p.baseline));
  const tickIndexes=[...new Set(Array.from({length:Math.min(6,points.length)},(_,i)=>Math.round(i*(points.length-1)/Math.max(1,Math.min(6,points.length)-1))))];
  return '<div class="trend-key"><span><i></i>总营收</span>'+(hasSpend?'<span><i class="spend-key"></i>活动投入</span>':'')+
    '</div><div class="chart overview-interactive-chart"><div class="tooltip" hidden></div>'+
    '<svg viewBox="0 0 '+w+' '+h+'" aria-label="营收与活动投入趋势" role="group">'+
    '<defs><linearGradient id="overview-revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ac202a" stop-opacity=".14"/><stop offset="1" stop-color="#ac202a" stop-opacity=".015"/></linearGradient></defs>'+
    '<text x="12" y="17" fill="#8b252e">HKD</text>'+
    [0,1,2,3,4].map(i=>'<line x1="'+l+'" x2="'+r+'" y1="'+y(top*i/4)+'" y2="'+y(top*i/4)+'" stroke="#ece5df" stroke-dasharray="3 5"/><text x="'+(l-12)+'" y="'+(y(top*i/4)+4)+'" text-anchor="end">'+fmt(top*i/4/1000,1)+'k</text>').join('')+
    '<path d="'+area.join(' ')+'" fill="url(#overview-revenue-fill)"/>'+
    '<path d="'+line('actual')+'" fill="none" stroke="#ac202a" stroke-width="2.5" stroke-linejoin="round"/>'+
    (hasSpend?'<path d="'+line('baseline')+'" fill="none" stroke="#9a795c" stroke-width="2" stroke-dasharray="5 4"/>':'')+
    (points.length<=40?points.map((p,i)=>numeric(p.actual)?'<circle cx="'+x(i)+'" cy="'+y(p.actual)+'" r="3" fill="#fffefd" stroke="#ac202a" stroke-width="1.6"/>':'').join(''):'')+
    '<line class="overview-crosshair" x1="0" x2="0" y1="'+t+'" y2="'+b+'" stroke="#bda69c" stroke-dasharray="3 3" visibility="hidden"/>'+
    tickIndexes.map(i=>'<text x="'+x(i)+'" y="266" text-anchor="middle">'+points[i].date.slice(5)+'</text>').join('')+
    points.map((p,i)=>{
      const label=p.date+(p.end!==p.date?' — '+p.end:' · '+weekdayLabel(p.date));
      const tip=label+'\n总营收 '+(numeric(p.actual)?fmt(p.actual,2):'—')+' HKD'+
        (hasSpend?'\n活动投入 '+(numeric(p.baseline)?fmt(p.baseline,2):'—')+' HKD':'');
      const width=(r-l)/Math.max(1,points.length-1);
      return '<rect class="overview-hit" tabindex="0" role="button" aria-label="'+escape(tip)+'" data-overview-point="'+i+
        '" data-overview-x="'+x(i)+'" data-overview-tip="'+escape(tip)+'" x="'+Math.max(l-10,x(i)-width/2)+'" y="'+t+'" width="'+width+'" height="'+(b-t)+'" fill="transparent"/>';
    }).join('')+'</svg></div><div class="trend-foot"><span>'+points[0].date+' — '+points.at(-1).end+'</span>'+
    '<span id="trend-pin-status" role="status"></span></div>';
}

function showOverviewPoint(target){
  const plot=target.closest('.chart'),tip=plot.querySelector('.tooltip'),guide=plot.querySelector('.overview-crosshair');
  tip.textContent=target.dataset.overviewTip;
  tip.hidden=false;
  const left=Number(target.dataset.overviewX)/1000*plot.clientWidth;
  tip.style.left=Math.max(0,Math.min(left+12,plot.clientWidth-230))+'px';
  tip.style.top='24px';
  guide.setAttribute('x1',target.dataset.overviewX);
  guide.setAttribute('x2',target.dataset.overviewX);
  guide.setAttribute('visibility','visible');
}
function hideOverviewPoint(){
  if(pinnedOverviewPoint!==null)return;
  document.querySelector('.overview-interactive-chart .tooltip')?.setAttribute('hidden','');
  document.querySelector('.overview-crosshair')?.setAttribute('visibility','hidden');
}
for(const event of ['pointerover','focusin'])document.addEventListener(event,e=>{
  const target=e.target.closest?.('[data-overview-point]');
  if(target&&pinnedOverviewPoint===null)showOverviewPoint(target);
});
for(const event of ['pointerout','focusout'])document.addEventListener(event,e=>{
  if(e.target.matches?.('[data-overview-point]'))hideOverviewPoint();
});
document.addEventListener('click',event=>{
  const period=event.target.closest('[data-trend-period]');
  if(period){
    overviewTrendPeriod=period.dataset.trendPeriod;pinnedOverviewPoint=null;
    document.querySelector('#overview-trend-body').innerHTML=overviewTrendBody();
    document.querySelectorAll('[data-trend-period]').forEach(button=>button.setAttribute('aria-pressed',String(button===period)));
  }
  const target=event.target.closest('[data-overview-point]');
  if(!target)return;
  pinnedOverviewPoint=pinnedOverviewPoint===target.dataset.overviewPoint?null:target.dataset.overviewPoint;
  showOverviewPoint(target);
  document.querySelector('#trend-pin-status').textContent=pinnedOverviewPoint===null?'':'已固定 · 再次点击取消';
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){pinnedOverviewPoint=null;hideOverviewPoint();const status=document.querySelector('#trend-pin-status');if(status)status.textContent=''}
  if(['Enter',' '].includes(event.key)&&event.target.matches?.('[data-overview-point]')){event.preventDefault();event.target.click()}
});
