'use strict';

function exportTable(tableNode,name){
  const columns=[...tableNode.querySelectorAll('thead th')];
  const indexes=columns.flatMap((cell,i)=>cell.matches('.checkcell')||['操作',localize('操作')].includes(cell.textContent.trim())?[]:[i]);
  const clean=text=>text.trim().replace(/\s*[↑↓]$/,'');
  const result=[name,indexes.map(i=>clean(columns[i].textContent)),
    [...tableNode.querySelectorAll('tbody tr')].map(row=>indexes.map(i=>{
      const cell=row.cells[i];
      const text=clean(cell.textContent);
      if(text==='—')return null;
      if(cell.classList.contains('num')){
        const value=Number(text.replace(/[,％%]/g,'').replace('−','-'));
        if(text&&Number.isFinite(value))return value;
      }
      const label=cell.querySelector('a.campaign');
      if(label)return label.firstChild.textContent.trim();
      return text;
    }))];
  const nameColumn=indexes.findIndex(i=>['活动','活动名称','Campaign','Campaign name','活動','活動名稱'].includes(clean(columns[i].textContent)));
  if(nameColumn>=0&&tableNode.querySelector('.activity-type-tag')){
    result[1].splice(nameColumn+1,0,localize('活动类型'));
    [...tableNode.querySelectorAll('tbody tr')].forEach((row,i)=>{
      const cell=row.cells[indexes[nameColumn]],tag=cell.querySelector('.activity-type-tag');
      if(tag&&!cell.querySelector('a.campaign'))result[2][i][nameColumn]=cell.querySelector('a')?.textContent.trim()||result[2][i][nameColumn];
      result[2][i].splice(nameColumn+1,0,tag?.textContent.trim()||'');
    });
  }
  return result;
}

function summaryExportSheets(){
  const titles={overview:'数据总览',day:'按日',store:'按门店',activity:'按活动'};
  const view=viewSettings[summaryView];
  const scopeRows=[
    ['页面',titles[summaryView]],['数据来源','太平洋咖啡 FY2026 v9 工作簿'],
    ['开始日期',summaryScope.from],['结束日期',summaryScope.to],
    ['区域',summaryScope.district||'全部'],['门店',summaryScope.store||'全部'],
    ['交易渠道',summaryScope.channel||'全部'],['活动类型',summaryScope.type||'全部'],
    ['排序',(summaryMetricLabels[view.sort]||view.sort)+' · '+(view.direction===1?'升序':'降序')],
    ['金额单位','HKD。空白表示缺数据或不适用。'],
    ['营收与订单','覆盖工作簿中的会员与散客交易。客单价＝总营收 ÷ 总单量。']
  ];
  if(summaryView==='store')scopeRows.push(['门店类型',view.type||'全部']);
  if(summaryView==='activity'){
    scopeRows.push(['统计窗口',summaryScope.limitActivities?'限定活动日期':'活动全期']);
    const labels={query:'活动搜索',month:'结束月份',status:'运行状态',channel:'活动渠道',owner:'负责人'};
    for(const [key,label] of Object.entries(labels))if(filters[key])scopeRows.push([label,filters[key]]);
  }
  if(['activity','overview'].includes(summaryView)){
    scopeRows.push(['活动花费','v9 校准表总投入；ROI、CPM 与花费使用活动全期口径。'],
      ['ROI（校准）',economicsHeaders.roi.help],['广告 CPM',economicsHeaders.cpm.help],['送达率',economicsHeaders.delivery.help]);
  }
  if(summaryView==='overview'){
    const start=revenueData.dates.indexOf(summaryScope.from);
    const count=revenueData.dates.indexOf(summaryScope.to)-start+1;
    scopeRows.push(['对比周期',start>=count?revenueData.dates[start-count]+' 至 '+revenueData.dates[start-1]:'上一等长区间超出数据范围'],
      ['品类归组',Object.entries(overviewProductGroups).map(([group,products])=>group+'（'+products.join('、')+'）').join('；')],
      ['全品类变化','增减量＝本期销量 − 上期销量。变化率＝增减量 ÷ 上期销量 × 100%；上期为零时变化率留空。品类按商品名称归组。']);
  }
  if(summaryView==='overview')scopeRows.push(['商品榜','按交易商品售出件数。增长率＝（当前销量 − 上一等长区间销量）÷ 上一等长区间销量 × 100%；基准至少 10 件。']);
  const cards=[...main.querySelectorAll('.metrics .metric')].map(card=>{
    const label=card.dataset.metricExportLabel||[...(card.querySelector('.muted')?.childNodes||[])].filter(n=>n.nodeName!=='BUTTON').map(n=>n.textContent).join('').trim();
    const value=card.querySelector('.big')?.textContent.trim();
    const numericValue=Number(value?.replace(/,/g,''));
    return [label,value&&Number.isFinite(numericValue)?numericValue:value,card.querySelector('[data-metric-help]')?.dataset.metricHelp||''];
  });
  const result=[['筛选与口径',['项目','内容'],scopeRows],['核心指标',['指标','数值','说明'],cards]];
  if(summaryView==='overview')result.push(...overviewExportSheets);
  const tables=[...main.querySelectorAll('#summary-content table')];
  for(const [index,node] of tables.entries()){
    const group=node.closest('.campaign-group');
    const name=summaryView==='day'?'每日明细':summaryView==='store'?'门店明细':
      group?.classList.contains('permanent-panel')?'常设活动':
      tables.length===1||index===0||node.closest('.seasonal-panel')?'非常设活动':'活动明细';
    const sheet=exportTable(node,name);
    if(summaryView==='day'){
      sheet[1].splice(1,0,'星期');
      for(const row of sheet[2])row.splice(1,0,weekdayLabel(row[0]));
    }
    if(!result.some(item=>item[0]===name))result.push(sheet);
  }
  if(!tables.length&&summaryView!=='overview')result.push(['筛选结果',['状态'],[['当前筛选没有匹配记录']]]);
  return result;
}

function summaryWorkbookParts(sheets){
  const head='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const mainNs='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const relNs='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const packageNs='http://schemas.openxmlformats.org/package/2006/relationships';
  const typesNs='http://schemas.openxmlformats.org/package/2006/content-types';
  const spreadsheet='application/vnd.openxmlformats-officedocument.spreadsheetml.';
  const sheetParts=sheets.map((_,i)=>'worksheets/sheet'+(i+1)+'.xml');
  const relationship=(id,type,target)=>'<Relationship Id="rId'+id+'" Type="'+relNs+'/'+type+'" Target="'+target+'"/>';
  const override=(name,type)=>'<Override PartName="/xl/'+name+'" ContentType="'+spreadsheet+type+'+xml"/>';
  const files={
    '[Content_Types].xml':head+'<Types xmlns="'+typesNs+'"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
      override('workbook.xml','sheet.main')+override('styles.xml','styles')+
      sheetParts.map(part=>override(part,'worksheet')).join('')+'</Types>',
    '_rels/.rels':head+'<Relationships xmlns="'+packageNs+'">'+relationship(1,'officeDocument','xl/workbook.xml')+'</Relationships>',
    'xl/workbook.xml':head+'<workbook xmlns="'+mainNs+'" xmlns:r="'+relNs+'"><sheets>'+
      sheets.map(([name],i)=>'<sheet name="'+escape(localize(name))+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>',
    'xl/_rels/workbook.xml.rels':head+'<Relationships xmlns="'+packageNs+'">'+
      sheetParts.map((part,i)=>relationship(i+1,'worksheet',part)).join('')+relationship(sheets.length+1,'styles','styles.xml')+'</Relationships>',
    'xl/styles.xml':head+'<styleSheet xmlns="'+mainNs+'"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>'+
      '<font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>'+
      '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'+
      '<fill><patternFill patternType="solid"><fgColor rgb="FF84212B"/><bgColor indexed="64"/></patternFill></fill>'+
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF8F1ED"/><bgColor indexed="64"/></patternFill></fill></fills>'+
      '<borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
      '<cellXfs count="6"><xf xfId="0"/><xf xfId="0" fontId="1" fillId="2" applyFont="1" applyFill="1"/>'+
      '<xf xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>'+
      '<xf xfId="0" fillId="3" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>'+
      '<xf xfId="0" numFmtId="4" applyNumberFormat="1"/><xf xfId="0" numFmtId="4" fillId="3" applyNumberFormat="1" applyFill="1"/></cellXfs>'+
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'
  };
  for(const [index,[name,headers,rows]] of sheets.entries()){
    const all=[headers,...rows];
    const narrative=headers.findIndex((label,i)=>(name==='筛选与口径'&&i===1)||/口径|^说明$/.test(label));
    const cols=headers.map((label,i)=>{
      const longest=Math.max(label.length*2+4,...rows.map(row=>String(row[i]??'').length+5));
      const width=i===narrative?85:Math.min(38,Math.max(13,longest));
      return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+width+'" customWidth="1"/>';
    }).join('');
    const xmlRows=all.map((row,i)=>{
      const cells=row.map((value,k)=>{
        if(value==null)return '';
        const ref=String.fromCharCode(65+k)+(i+1);
        const number=Number.isFinite(value);
        const style=i===0?1:number&&!Number.isInteger(value)?(i%2?4:5):(i%2?2:3);
        return '<c r="'+ref+'" s="'+style+'"'+(number?'><v>'+value+'</v>':' t="inlineStr"><is><t xml:space="preserve">'+escape(localize(value))+'</t></is>')+'</c>';
      }).join('');
      return '<row r="'+(i+1)+'" ht="'+(i===0?24:Math.max(21,Math.ceil(String(row[narrative]||'').length/40)*17))+'" customHeight="1">'+cells+'</row>';
    }).join('');
    files['xl/'+sheetParts[index]]=head+'<worksheet xmlns="'+mainNs+'">'+
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+
      '<cols>'+cols+'</cols><sheetData>'+xmlRows+'</sheetData>'+
      (rows.length?'<autoFilter ref="A1:'+String.fromCharCode(64+headers.length)+all.length+'"/>':'')+'</worksheet>';
  }
  return files;
}

let workbookNoticeTimer;
function showWorkbookNotice(message,error=false){
  const notice=document.getElementById('workspace-notice');
  clearTimeout(workbookNoticeTimer);
  notice.textContent=message;
  notice.classList.toggle('notice-error',error);
  notice.classList.add('is-visible');
  workbookNoticeTimer=setTimeout(()=>{
    notice.classList.remove('is-visible');
    notice.textContent='';
  },3600);
}

function downloadWorkbook(sheets,filename){
  try{
    const bytes=zipDocument(summaryWorkbookParts(sheets));
    const href=URL.createObjectURL(new Blob(bytes,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
    const link=document.createElement('a');
    link.href=href;
    link.download=localize(filename)+'.xlsx';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(href),10000);
    showWorkbookNotice('Excel 已生成 · 请查看浏览器下载');
  }catch{
    showWorkbookNotice('无法生成 Excel，请重试。',true);
  }
}

function downloadSummaryWorkbook(){
  const page={overview:'数据总览',day:'按日',store:'按门店',activity:'按活动'}[summaryView];
  downloadWorkbook(summaryExportSheets(),'太平洋咖啡_'+page+'_'+summaryScope.from+'_'+summaryScope.to);
}
