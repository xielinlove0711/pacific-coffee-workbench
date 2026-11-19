'use strict';

function enrichComparison(result,a,b,shopsA,shopsB,daysA,daysB){
  const aggregate=(shops,days)=>{
    const revenue=sample(shops,days,'revenue',analysisForm.channel).reduce((sum,n)=>sum+n,0);
    const orders=sample(shops,days,'orders',analysisForm.channel).reduce((sum,n)=>sum+n,0);
    return {revenue,orders,basket:orders>0?revenue/orders:null,
      revenuePerDay:revenue/shops.length/days.length,ordersPerDay:orders/shops.length/days.length,
      stores:shops.length,days:days.length};
  };
  const current=aggregate(shopsA,daysA),baseline=aggregate(shopsB,daysB);
  result.comparison={
    names:[a.name,b.name],current,baseline,
    rows:[
      ['每店每日会员营收','HKD／店日',current.revenuePerDay,baseline.revenuePerDay],
      ['每店每日会员订单','单／店日',current.ordersPerDay,baseline.ordersPerDay],
      ['会员客单价','HKD／单',current.basket,baseline.basket],
      ['覆盖门店','家',current.stores,baseline.stores],
      ['观察天数','天',current.days,baseline.days]
    ],
    conclusions:[
      '当前活动每店每日会员营收 '+fmt(current.revenuePerDay,2)+' HKD，基准为 '+fmt(baseline.revenuePerDay,2)+' HKD，'+differenceSentence(current.revenuePerDay,baseline.revenuePerDay)+'。',
      '会员订单频次（每店每日）'+differenceSentence(current.ordersPerDay,baseline.ordersPerDay)+'，客单价'+differenceSentence(current.basket,baseline.basket)+'。',
      '两场活动覆盖 '+current.stores+' / '+baseline.stores+' 家门店，观察 '+current.days+' / '+baseline.days+' 天；营收和订单按店日标准化后比较。'
    ]
  };
}

function differenceSentence(current,baseline){
  if(!numeric(current)||!numeric(baseline))return '数据不足';
  const delta=current-baseline;
  if(Math.abs(delta)<.000001)return '持平';
  return (delta>0?'高于':'低于')+'基准 '+fmt(Math.abs(delta),2)+(baseline>0?'（'+pct(Math.abs(delta)/baseline*100)+'）':'，基准为零，变化率暂缺');
}

function comparisonConclusionText(result){
  return result.comparison?result.comparison.conclusions.join('\n'):'';
}

function comparisonReportHTML(result){
  const c=result.comparison;
  if(!c)return '';
  const rows=c.rows.map(([label,unit,current,baseline])=>{
    const valid=numeric(current)&&numeric(baseline);
    const delta=valid?current-baseline:null;
    const maximum=Math.max(1,...[current,baseline].filter(numeric));
    const direction=!valid?'flat':delta>0?'up':delta<0?'down':'flat';
    const symbol=!valid?'—':delta>0?'↑':delta<0?'↓':'→';
    const visual=[current,baseline].map((value,index)=>
      '<div class="paired-metric"><i class="paired-bar '+(index?'paired-baseline':'paired-current')+
      '" style="width:'+(numeric(value)?Math.max(0,value)/maximum*100:0)+'%"></i>'+
      '<span>'+ (numeric(value)?fmt(value,2):'—')+'</span></div>').join('');
    return '<tr><td><strong>'+escape(label)+'</strong><small>'+escape(unit)+'</small></td>'+
      '<td><div class="paired-bars" role="img" aria-label="'+escape(c.names[0]+' '+fmt(current,2)+'；'+c.names[1]+' '+fmt(baseline,2))+'">'+visual+'</div></td>'+
      '<td class="num change-'+direction+'">'+symbol+' '+(valid?fmt(Math.abs(delta),2):'—')+
      '<small>'+(valid&&baseline>0?(delta>0?'+':delta<0?'−':'')+pct(Math.abs(delta)/baseline*100):'—')+'</small></td></tr>';
  }).join('');
  return '<section class="comparison-matrix"><div class="paired-key"><span><i class="paired-current"></i>'+escape(c.names[0])+
    '</span><span><i class="paired-baseline"></i>'+escape(c.names[1])+'</span></div>'+
    '<div class="scroller"><table><thead><tr><th>指标</th><th>双方数值</th><th class="num">差额 / 变化率</th></tr></thead><tbody>'+
    rows+'</tbody></table></div></section>'+
    '<section class="comparison-findings"><h4>主要发现</h4><ul>'+
    c.conclusions.map(text=>'<li>'+escape(text)+'</li>').join('')+'</ul></section>';
}
