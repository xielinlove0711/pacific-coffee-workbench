'use strict';
function reportChartSeries(result){
  if(!result)return [];
  const direct=(result.points||[]).filter(p=>numeric(p.actual));if(direct.length)return direct;
  if(!result.snapshotHTML)return [];
  const host=document.createElement('div');host.innerHTML=result.snapshotHTML;
  return [...host.querySelectorAll('[data-tip],[data-overview-tip]')].map(node=>{
    const lines=(node.dataset.tip||node.dataset.overviewTip).split('\n'),match=lines[1]?.match(/([-−]?[\d,]+(?:\.\d+)?)\s*(HKD|单|指数)/);
    return match?{date:lines[0],actual:Number(match[1].replace(/,/g,'').replace('−','-')),unit:match[2]}:null;
  }).filter(p=>p&&numeric(p.actual));
}
function reportChartInsightHTML(result,imageNumber=0){
 const points=reportChartSeries(result);if(points.length<2)return '';
 const high=points.reduce((a,b)=>b.actual>a.actual?b:a),low=points.reduce((a,b)=>b.actual<a.actual?b:a),first=points[0],last=points.at(-1),unit=(result.unit||points[0].unit||'').replace(/港元/g,'HKD');
 const diff=last.actual-first.actual,kind=diff>0?'up':diff<0?'down':'flat',arrow=diff>0?'↑':diff<0?'↓':'→',name=p=>p.label||p.date;
 const badge='<span class="report-insight-change change-'+kind+'">'+arrow+' '+(diff>0?'+':diff<0?'−':'')+fmt(Math.abs(diff),2)+' '+escape(unit)+(first.actual!==0?'（'+pct(diff/Math.abs(first.actual)*100)+'）':'')+'</span>';
 const facts=['最高点出现在 '+escape(name(high))+'，数值为 <strong>'+fmt(high.actual,2)+' '+escape(unit)+'</strong>。','最低点出现在 '+escape(name(low))+'，数值为 <strong>'+fmt(low.actual,2)+' '+escape(unit)+'</strong>。','首尾由 '+fmt(first.actual,2)+' 变为 '+fmt(last.actual,2)+' '+escape(unit)+'，变化 '+badge+'。'];
 const pairs=points.filter(p=>numeric(p.baseline));if(pairs.length){const avg=k=>pairs.reduce((s,p)=>s+p[k],0)/pairs.length;facts.push(escape(result.labels?.[0]||'当前组')+'均值为 <strong>'+fmt(avg('actual'),2)+'</strong>，'+escape(result.labels?.[1]||'对照组')+'均值为 <strong>'+fmt(avg('baseline'),2)+'</strong> '+escape(unit)+'。')}
 facts.push('观察范围为 '+escape(name(first))+' 至 '+escape(name(last))+'；以上为描述性特点，不代表活动因果效果。');
 return localize('<h3>图表解读</h3><ul>'+facts.map((f,i)=>'<li'+(i<2?' tabindex="0" data-insight-extreme="'+(i===0?'high':'low')+'" data-insight-figure="'+escape((result.figureId||'')+':'+imageNumber)+'"':'')+'>'+f+'</li>').join('')+'</ul>');
}
function annotateReportChart(target,result){
 if(!target.matches('.chart'))return false;
 const svg=target.querySelector('svg'),points=reportChartSeries(result);if(!svg||points.length<2)return false;
 const path=[...svg.querySelectorAll('path')].find(p=>/--red|#ac202a|#ac202A/i.test(p.getAttribute('stroke')||''));if(!path)return false;
 const coords=[...path.getAttribute('d').matchAll(/[ML]\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);if(coords.length!==points.length)return false;
 svg.querySelectorAll('[data-ai-extrema]').forEach(n=>n.remove());
 const high=points.reduce((best,p,i)=>p.actual>points[best].actual?i:best,0),low=points.reduce((best,p,i)=>p.actual<points[best].actual?i:best,0);
 const box=svg.viewBox.baseVal,unit=(result.unit||points[0].unit||'').replace(/港元/g,'HKD'),ns='http://www.w3.org/2000/svg';
 const marks=high===low?[[high,'最高 / 最低','#9b3441']]:[[high,'最高','#9b3441'],[low,'最低','#557b76']];
 marks.forEach(([index,label,color])=>{
  const [x,y]=coords[index],g=document.createElementNS(ns,'g');g.dataset.aiExtrema=label;g.setAttribute('class','ai-chart-extremum');
  const circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',x);circle.setAttribute('cy',y);circle.setAttribute('r','4.5');circle.setAttribute('fill',color);circle.setAttribute('stroke','#fffefd');circle.setAttribute('stroke-width','2');g.append(circle);
  const text=localize(label)+' '+fmt(points[index].actual,2)+' '+unit,width=Math.min(box.width-90,Math.max(110,text.length*7)),left=Math.max(72,Math.min(x-width/2,box.width-width-8));
  const top=label==='最低'?(y>box.height-80?Math.max(5,y-30):y+8):Math.max(5,y-30);
  const rect=document.createElementNS(ns,'rect');Object.entries({x:left,y:top,width,height:23,rx:4,fill:'#fffefd',stroke:color,'stroke-width':'.8'}).forEach(([k,v])=>rect.setAttribute(k,v));g.append(rect);
  const note=document.createElementNS(ns,'text');Object.entries({x:left+7,y:top+15,fill:color,'font-size':11,'font-weight':700}).forEach(([k,v])=>note.setAttribute(k,v));note.textContent=text;g.append(note);
  const title=document.createElementNS(ns,'title');title.textContent=(points[index].label||points[index].date)+' · '+text;g.append(title);svg.append(g);
 });return true;
}
function hideReportExtrema(){document.querySelectorAll('.report-extrema-overlay [data-ai-extrema]').forEach(g=>g.style.visibility='hidden')}
async function annotateReportFigure(result,imageNumber){
 const host=document.createElement('div');host.innerHTML=evidenceHTML(result);
 const targets=[...host.querySelectorAll('.chart,.performance-bars,.channel-donut-svg,.goal-ring-refined,.comparison-matrix')];
 const target=targets[imageNumber];if(!target||!annotateReportChart(target,result))return false;
 const key=result.figureId+':'+imageNumber;
 const figure=[...document.querySelectorAll('#report-body-editor [data-report-key]')].find(n=>n.dataset.reportKey===key);
 const image=figure?.querySelector('img');if(!image)return false;
 let holder=image.closest('.report-insight-image-host');
 if(!holder){holder=document.createElement('div');holder.className='report-insight-image-host';image.before(holder);holder.append(image)}
 holder.querySelector('.report-extrema-overlay')?.remove();
 const ns='http://www.w3.org/2000/svg',overlay=document.createElementNS(ns,'svg'),inner=document.createElementNS(ns,'svg');
 overlay.setAttribute('class','report-extrema-overlay');overlay.setAttribute('viewBox','0 0 900 340');overlay.setAttribute('aria-hidden','true');
 inner.setAttribute('x','0');inner.setAttribute('y','40');inner.setAttribute('width','900');inner.setAttribute('height','280');inner.setAttribute('viewBox',target.querySelector('svg').getAttribute('viewBox'));
 target.querySelectorAll('[data-ai-extrema]').forEach(g=>{const copy=g.cloneNode(true);copy.style.visibility='hidden';inner.append(copy)});overlay.append(inner);holder.append(overlay);return true;
}
let reportExtremaHoverToken=0;
async function highlightReportExtremum(target){
 const key=target.dataset.insightFigure,kind=target.dataset.insightExtreme,token=++reportExtremaHoverToken;
 hideReportExtrema();
 const figure=[...document.querySelectorAll('#report-body-editor [data-report-key]')].find(n=>n.dataset.reportKey===key);if(!figure)return;
 const result=workspaceDraft().evidence[Number(figure.dataset.reportImageIndex)],j=Number(figure.dataset.imageNumber)||0;if(!result)return;
 if(!figure.querySelector('.report-extrema-overlay'))await annotateReportFigure(result,j);
 if(token!==reportExtremaHoverToken)return;
 figure.querySelectorAll('[data-ai-extrema]').forEach(g=>{g.style.visibility=(kind==='high'?g.dataset.aiExtrema.includes('最高'):g.dataset.aiExtrema.includes('最低'))?'visible':'hidden'});
}
for(const type of ['pointerover','focusin'])document.addEventListener(type,event=>{const target=event.target.closest?.('[data-insight-extreme]');if(target&&!target.contains(event.relatedTarget))void highlightReportExtremum(target)});
for(const type of ['pointerout','focusout'])document.addEventListener(type,event=>{const target=event.target.closest?.('[data-insight-extreme]');if(target&&!target.contains(event.relatedTarget)){reportExtremaHoverToken++;hideReportExtrema()}});
window.addEventListener('hashchange',()=>{reportExtremaHoverToken++;hideReportExtrema()});
