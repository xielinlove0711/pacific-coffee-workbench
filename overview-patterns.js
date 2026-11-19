'use strict';

function overviewPatternPanels(shops,from,to,channelPanel=''){
  const dates=revenueData.dates.slice(from,to+1);
  const totals=new Map(dates.map(day=>[day,{revenue:null,orders:null}]));
  for(const shop of shops)for(const [index,cents,orders] of scopedDays(shop)){
    const record=totals.get(revenueData.dates[index]);
    if(!record)continue;
    record.revenue=(record.revenue??0)+cents/100;
    record.orders=(record.orders??0)+orders;
  }
  const groups=Array.from({length:7},()=>({sum:0,count:0}));
  for(const [date,record] of totals){
    if(!numeric(record.revenue))continue;
    const day=(new Date(date+'T00:00:00Z').getUTCDay()+6)%7;
    groups[day].sum+=record.revenue;groups[day].count++;
  }
  const averages=groups.map(g=>g.count?g.sum/g.count:null);
  const max=Math.max(1,...averages.filter(numeric));
  const bars=groups.map((group,i)=>{
    const value=averages[i],weekday='星期'+'一二三四五六日'[i];
    const help=weekday+' · 日均会员营收 '+(numeric(value)?fmt(value,2)+' HKD':'暂无数据')+' · '+group.count+' 个有记录日';
    return '<div class="weekday-column" tabindex="0" data-metric-help="'+escape(help)+'" aria-label="'+escape(help)+'">'+
      '<span class="weekday-value">'+(numeric(value)?fmt(value/1000,1)+'k':'—')+'</span>'+
      '<div class="weekday-track"><i style="height:'+(numeric(value)?value/max*100:0)+'%"></i></div>'+
      '<span>'+weekday+'</span><small>'+group.count+' 天</small></div>';
  }).join('');
  const values=[...totals.values()].map(d=>d.revenue).filter(numeric).sort((a,b)=>a-b);
  const thresholds=[.25,.5,.75].map(p=>values[Math.floor((values.length-1)*p)]);
  const firstDay=(new Date(dates[0]+'T00:00:00Z').getUTCDay()+6)%7;
  const weeks=Math.ceil((firstDay+dates.length)/7);
  const cells=[];
  const weekdayHeaders='一二三四五六日'.split('').map((day,i)=>'<span class="calendar-day-label" style="grid-row:'+(i+1)+';grid-column:1">'+day+'</span>').join('');
  for(let i=0;i<dates.length;i++){
    const date=dates[i],record=totals.get(date),position=firstDay+i;
    const level=!numeric(record.revenue)?'missing':record.revenue===0?0:1+thresholds.filter(t=>record.revenue>t).length;
    const help=date+' · '+weekdayLabel(date)+'\n会员营收 '+(numeric(record.revenue)?fmt(record.revenue,2)+' HKD':'无记录')+
      '\n会员订单 '+(numeric(record.orders)?fmt(record.orders):'—');
    cells.push('<span tabindex="0" class="calendar-cell intensity-'+level+'" style="grid-column:'+(2+Math.floor(position/7))+
      ';grid-row:'+(position%7+1)+'" data-metric-help="'+escape(help)+'" aria-label="'+escape(help)+'"></span>');
  }
  return '<div class="overview-pattern-grid overview-secondary-grid"><section class="panel pad"><h2 tabindex="0" data-metric-help="按星期汇总当前筛选范围的会员营收，再除以该星期有交易记录的天数。单位：HKD。">星期经营表现</h2>'+
    '<div class="weekday-columns">'+bars+'</div></section>'+
    '<section class="panel pad"><h2 tabindex="0" data-metric-help="颜色越深，当日营收越高。按当前范围的营收分位数着色，悬停色块可查看当日明细。">营收日历</h2>'+
    '<div class="calendar-scroll"><div class="revenue-calendar" style="grid-template-columns:18px repeat('+weeks+',15px)">'+weekdayHeaders+cells.join('')+
    '</div></div><div class="calendar-legend"><span>低</span>'+[0,1,2,3,4].map(i=>'<i class="calendar-cell intensity-'+i+'"></i>').join('')+
    '<span>高</span><i class="calendar-cell intensity-missing"></i><span>无记录</span></div>'+
    '</section>'+channelPanel+'</div>';
}


function channelDonutPanel(rows,total){
  const colors=['#9b3441','#a9988d','#557b76','#7b8496'];
  let angle=-Math.PI/2;
  const paths=rows.filter(([,count])=>count>0).map(([name,count],i)=>{
    const sweep=count/total*Math.PI*2,finish=angle+sweep;
    const x=a=>100+78*Math.cos(a),y=a=>100+78*Math.sin(a);
    const ix=a=>100+53*Math.cos(a),iy=a=>100+53*Math.sin(a);
    const end=sweep>=Math.PI*2?finish-.00001:finish;
    const d='M'+x(angle)+','+y(angle)+' A78,78 0 '+(sweep>Math.PI?1:0)+' 1 '+x(end)+','+y(end)+
      ' L'+ix(end)+','+iy(end)+' A53,53 0 '+(sweep>Math.PI?1:0)+' 0 '+ix(angle)+','+iy(angle)+'Z';
    angle=finish;
    const help=name+'\n'+fmt(count)+' 单 · '+pct(count/total*100);
    return '<path class="channel-sector" d="'+d+'" fill="'+colors[i%colors.length]+'" tabindex="0" role="img" '+
      'data-channel-index="'+i+'" data-metric-help="'+escape(help)+'" aria-label="'+escape(help)+'"/>';
  });
  return '<section class="panel pad channel-panel"><h2>订单渠道分布</h2>'+
    (total>0?'<div class="channel-donut-layout"><div class="channel-donut-svg"><svg viewBox="0 0 200 200" aria-label="订单渠道占比">'+
      paths.join('')+'</svg><div class="donut-center"><strong>'+fmt(total)+'</strong><small>总单量</small></div></div>'+
      '<div class="channel-donut-key">'+rows.filter(([,count])=>count>0).map(([name,count],i)=>
        '<div tabindex="0" data-channel-index="'+i+'" data-metric-help="'+escape(name+' · '+fmt(count)+' 单 · '+pct(count/total*100))+'">'+
        '<i style="background:'+colors[i%colors.length]+'"></i><span>'+escape(name)+'</span><strong>'+pct(count/total*100)+'</strong></div>'
      ).join('')+'</div></div>':'<p class="sub">暂无渠道订单。</p>')+'</section>';
}

function highlightChannel(target,active){
  const panel=target.closest('.channel-panel');
  if(!panel)return;
  const index=target.dataset.channelIndex;
  panel.querySelectorAll('[data-channel-index]').forEach(element=>{
    element.classList.toggle('channel-highlighted',active&&element.dataset.channelIndex===index);
  });
}
for(const type of ['pointerover','focusin'])document.addEventListener(type,event=>{
  const target=event.target.closest?.('[data-channel-index]');
  if(target)highlightChannel(target,true);
});
for(const type of ['pointerout','focusout'])document.addEventListener(type,event=>{
  const target=event.target.closest?.('[data-channel-index]');
  if(target&&!target.contains(event.relatedTarget))highlightChannel(target,false);
});
