'use strict';

async function chartCanvas(target){
  const canvas=document.createElement('canvas');
  const width=900;
  let height=340;
  const svg=target.querySelector('svg');
  if(svg){
    const copy=svg.cloneNode(true);
    copy.querySelectorAll('.overview-hit,.overview-crosshair').forEach(node=>node.remove());
    copy.querySelectorAll('*').forEach(node=>{
      for(const attribute of ['stroke','fill']){
        const value=node.getAttribute(attribute);
        if(value?.includes('var('))node.setAttribute(attribute,value.includes('--red')?'#ac202a':'#856d62');
      }
    });
    copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
    copy.setAttribute('width','900');
    copy.setAttribute('height','280');
    const style=document.createElementNS('http://www.w3.org/2000/svg','style');
    style.textContent='text{fill:#70625f;font:12px sans-serif}.point{fill:transparent}';
    copy.prepend(style);
    canvas.width=width*2;canvas.height=height*2;
    const ctx=canvas.getContext('2d');ctx.scale(2,2);
    ctx.fillStyle='#fffefd';ctx.fillRect(0,0,width,height);
    const image=new Image();
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(copy));
    await image.decode();
    ctx.drawImage(image,0,40);
    ctx.fillStyle='#51413a';ctx.font='16px sans-serif';
    ctx.fillText(target.previousElementSibling?.classList.contains('legend')?target.previousElementSibling.textContent.trim():'Pacific Coffee',24,25);
  }else{
    const rows=[...target.querySelectorAll('.performance-bar')];
    height=rows.length*62+28;
    canvas.width=width*2;canvas.height=height*2;
    const ctx=canvas.getContext('2d');ctx.scale(2,2);
    ctx.fillStyle='#fffefd';ctx.fillRect(0,0,width,height);
    rows.forEach((row,i)=>{
      const y=26+i*62;
      ctx.fillStyle='#29211f';ctx.font='15px sans-serif';ctx.textAlign='left';
      ctx.fillText(row.querySelector('span').textContent,22,y,590);
      ctx.textAlign='right';ctx.fillText(row.querySelector('strong').textContent,width-22,y);
      ctx.fillStyle='#f8eeea';ctx.fillRect(22,y+12,width-44,8);
      ctx.fillStyle='#ac202a';
      const percent=parseFloat(row.querySelector('.performance-track i').style.width);
      ctx.fillRect(22,y+12,(width-44)*percent/100,8);
    });
  }
  return canvas;
}

function attachChartDownloads(){
  document.querySelectorAll('main .chart').forEach(target=>{
    if(target.querySelector(':scope > .chart-download'))return;
    target.classList.add('downloadable-chart');
    const button=document.createElement('button');
    button.type='button';
    button.className='chart-download no-print';
    button.setAttribute('aria-label',localize('下载图表 PNG'));
    button.title=localize('下载图表 PNG');
    button.innerHTML='<span class="chart-download-icon" aria-hidden="true"><span></span></span>';
    button.addEventListener('click',async()=>{
      button.disabled=true;
      try{
        const canvas=await chartCanvas(target);
        const link=document.createElement('a');
        link.download='Pacific-Coffee-chart.png';
        link.href=canvas.toDataURL('image/png');
        link.click();
      }catch{
        showWorkbookNotice(localize('图表下载失败，请重试。'),true);
      }finally{button.disabled=false}
    });
    target.append(button);
  });
}
let chartDownloadPending=false;
new MutationObserver(()=>{
  if(chartDownloadPending)return;
  chartDownloadPending=true;
  queueMicrotask(()=>{chartDownloadPending=false;attachChartDownloads()});
}).observe(document.querySelector('main'),{childList:true,subtree:true});
attachChartDownloads();
