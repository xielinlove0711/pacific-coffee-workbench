'use strict';

function styleActivityTables(){
  document.querySelectorAll('main table').forEach(table=>{
    const headers=[...table.querySelectorAll('thead th')];
    const text=cell=>cell.textContent.trim();
    const names=['活动','活动名称','Campaign','Campaign name','活動','活動名稱'];
    const types=['活动类型','活動類型','Campaign type'];
    const nameIndex=headers.findIndex(cell=>names.includes(text(cell)));
    let typeIndex=headers.findIndex(cell=>types.includes(text(cell)));
    if(nameIndex<0)return;
    if(typeIndex>=0){
      for(const row of table.rows){
        if(row.parentElement.tagName==='TBODY'){
          const name=row.cells[nameIndex],type=row.cells[typeIndex];
          if(name&&type&&!name.querySelector('.activity-type-tag')){
            const tag=document.createElement('span');
            tag.className='activity-type-tag';
            tag.textContent=type.textContent.trim();
            name.append(tag);
          }
        }
        row.cells[typeIndex]?.remove();
      }
      typeIndex=-1;
    }

    table.classList.add('activity-list-table');
    const hasCheck=headers.some(cell=>cell.classList.contains('checkcell'));
    table.classList.toggle('has-check-column',hasCheck);
    const nameWidth=190,checkWidth=hasCheck?40:0;
    for(const row of table.rows){
      const name=row.cells[nameIndex];
      if(name){
        name.classList.add('frozen-activity');
        name.style.left=checkWidth+'px';
      }
      if(typeIndex>=0&&row.cells[typeIndex]){
        row.cells[typeIndex].classList.add('frozen-type');
        row.cells[typeIndex].style.left=(checkWidth+nameWidth)+'px';
      }
      if(hasCheck&&row.cells[0])row.cells[0].classList.add('frozen-check');
    }
    headers.forEach((header,index)=>{
      const label=text(header);
      const metric=/ROI/.test(label)?'roi':null;
      if(!metric)return;
      header.classList.add('important-metric-header','metric-'+metric);
      table.querySelectorAll('tbody tr').forEach(row=>{
        const cell=row.cells[index];
        if(!cell)return;
        cell.classList.add('important-metric','metric-'+metric);
        const value=Number(cell.textContent.trim().replace(/[,％%]/g,'').replace('−','-'));
        const valid=cell.textContent.trim()!==''&&Number.isFinite(value);
        if(metric==='roi'){
          cell.classList.toggle('roi-positive',valid&&value>0);
          cell.classList.toggle('roi-negative',valid&&value<0);
        }

      });
    });
  });
}
let tableStylePending=false;
new MutationObserver(()=>{
  if(tableStylePending)return;
  tableStylePending=true;
  queueMicrotask(()=>{tableStylePending=false;styleActivityTables()});
}).observe(document.querySelector('main'),{childList:true,subtree:true});
styleActivityTables();
