'use strict';

function decorateCurrency(root){
  if(root.nodeType===Node.TEXT_NODE){
    const parent=root.parentElement;
    if(!parent||parent.closest('script,style,textarea,option,select,input,svg,.currency-unit,.change-up,.change-down,[contenteditable],[data-language-original],#workspace-user'))return;
    const text=root.nodeValue;
    if(!/HKD|↑|↓|高于基准|低于基准/.test(text))return;
    const fragment=document.createDocumentFragment();
    let start=0;
    for(const match of text.matchAll(/HKD|高于基准|低于基准|↑|↓/g)){
      fragment.append(document.createTextNode(text.slice(start,match.index)));
      const token=document.createElement('span');
      token.className=match[0]==='HKD'?'currency-unit':
        /高于|↑/.test(match[0])?'change-up':'change-down';
      token.textContent=match[0]==='高于基准'?'↑':match[0]==='低于基准'?'↓':match[0];
      fragment.append(token);
      start=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(start)));
    root.replaceWith(fragment);
    return;
  }
  if(root.nodeType!==Node.ELEMENT_NODE||root.matches('script,style,textarea,select,input,svg,.currency-unit,.change-up,.change-down'))return;
  for(const child of [...root.childNodes])decorateCurrency(child);
}
let currencyStylePending=false;
new MutationObserver(()=>{
  if(currencyStylePending)return;
  currencyStylePending=true;
  queueMicrotask(()=>{
    currencyStylePending=false;
    decorateCurrency(document.body);
  });
}).observe(document.body,{childList:true,subtree:true,characterData:true});
decorateCurrency(document.body);
