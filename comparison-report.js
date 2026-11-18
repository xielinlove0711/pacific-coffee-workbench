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
      ['每店每日会员营收','港元／店日',current.revenuePerDay,baseline.revenuePerDay],
      ['每店每日会员订单','单／店日',current.ordersPerDay,baseline.ordersPerDay],
      ['会员客单价','港元／单',current.basket,baseline.basket],
      ['覆盖门店','家',current.stores,baseline.stores],
      ['观察天数','天',current.days,baseline.days]
    ],
    conclusions:[
      '当前活动每店每日会员营收 '+fmt(current.revenuePerDay,2)+' 港元，基准为 '+fmt(baseline.revenuePerDay,2)+' 港元，'+differenceSentence(current.revenuePerDay,baseline.revenuePerDay)+'。',
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
  const bars=c.rows.slice(0,3).map(([label,unit,current,baseline])=>
    '<section class="comparison-mini"><h4>'+escape(label)+'</h4>'+
    performanceBars([[c.names[0],current],[c.names[1],baseline]],n=>fmt(n,2)+' '+unit)+'</section>').join('');
  return '<div class="comparison-bars">'+bars+'</div>'+
    '<section class="comparison-findings"><h4>主要发现</h4><ul>'+
    c.conclusions.map(text=>'<li>'+escape(text)+'</li>').join('')+'</ul></section>'+
    '<details class="fold"><summary>指标对照明细</summary>'+
    table([['指标'],['单位'],['当前活动','num'],['基准活动','num'],['差额','num']],c.rows.map(([label,unit,current,baseline])=>
      [label,unit,numeric(current)?fmt(current,2):'—',numeric(baseline)?fmt(baseline,2):'—',
        numeric(current)&&numeric(baseline)?fmt(current-baseline,2):'—']))+'</details>';
}
