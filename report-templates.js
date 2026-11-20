'use strict';

const marketingReportTemplates=[
 {id:'review',name:['活动复盘','Campaign review'],scenario:['活动结束后汇报效果、总结经验','Review results and lessons after a campaign'],sections:[
  ['一、活动概况','1. Campaign overview','[填写活动名称、目标、档期、覆盖门店和目标人群。]','[Add campaign name, objective, dates, stores and audience.]'],
  ['二、核心表现','2. Key results','[填写总营收、总单量、客单价、活动投入及目标完成情况；与原定目标或可比活动对照。]','[Summarize revenue, orders, average order value, spend and progress against targets or a comparable campaign.]'],
  ['三、趋势与门店差异','3. Trends and store differences','[插入每日经营趋势和门店类型营收图，说明高低点及主要差异。]','[Insert daily trends and store-type revenue charts. Explain peaks, troughs and major differences.]'],
  ['四、主要发现','4. Key findings','[列出最重要的 2–3 项发现，每项附对应数据或图表。]','[List the two or three most important findings, supported by data or charts.]'],
  ['五、后续行动','5. Next actions','[填写继续、优化或停止的建议，以及负责人、时间和衡量指标。]','[Recommend what to continue, improve or stop. Specify owners, timing and success metrics.]']
 ]},
 {id:'acquisition',name:['拉新效果分析','Customer acquisition analysis'],scenario:['迎新、联乘等以新客或新增会员为目标的活动','Campaigns aimed at new customers or membership growth'],sections:[
  ['一、拉新目标与范围','1. Acquisition objective and scope','[填写活动、目标人群、目标人数，以及新客和新增会员的定义。]','[Describe the campaign, audience, target counts, and definitions of new customers and new members.]'],
  ['二、新客与会员增长','2. New customers and member growth','[填写同期注册消费会员、新客占比及新增会员数；注明统计范围，不将同期增长直接当作活动带来的增长。]','[Record newly registered purchasing members, new-customer share and member additions. State scope and distinguish observed growth from attributed impact.]'],
  ['三、渠道与门店表现','3. Channels and stores','[插入相关图表，比较不同渠道、区域或店型的新客表现；缺少归因数据时写明待补。]','[Compare available acquisition results by channel, region or store type. Identify missing attribution data.]'],
  ['四、获客成本与后续质量','4. Acquisition cost and customer quality','[填写有数据支持的获客成本、首购或复购表现；缺少成本或跟踪数据时保留待补，不估造数值。]','[Report acquisition cost, first purchases or repeat purchases where supported. Leave unavailable measures pending.]'],
  ['五、优化建议','5. Recommendations','[提出人群、权益和渠道优化建议，并填写下一次活动的验证目标。]','[Recommend audience, offer and channel changes, with validation targets for the next campaign.]']
 ]},
 {id:'incremental',name:['重点活动增量评估','Incremental impact assessment'],scenario:['为重点活动判断额外增长及预算依据','Assess additional growth from an important campaign'],sections:[
  ['一、评估问题与设计','1. Question and design','[填写活动、主要指标、评估方法（门店对照或会员随机留出）、分组及预设观察窗口。]','[State the campaign, primary metric, store-control or randomized-member design, groups and predefined observation windows.]'],
  ['二、数据与分组检查','2. Data and group checks','[简述检查结果：门店对照核查店型与前期趋势；会员留出核查分层配额、名单冻结及触达串组。]','[Summarize checks: store mix and pre-trends for store controls; allocation quotas, frozen assignments and contamination for member holdouts.]'],
  ['三、增量结果','3. Incremental results','[插入评估结果图，填写增量估计、相对差异、95% 区间及是否包含零；合成验证结果需明确标记。]','[Insert assessment charts. Report estimated lift, relative difference, the 95% interval and whether it includes zero. Label synthetic validation results.]'],
  ['四、结论与适用边界','4. Conclusion and limitations','[用一句话说明是否观察到明确增量，再列出影响解释的数据或设计限制。]','[State whether clear additional growth was observed, followed by material data or design limitations.]'],
  ['五、决策与下一步','5. Decision and next steps','[填写继续投入、扩大验证或调整方案的建议；成本与毛利数据不足时，不填增量 ROI。]','[Recommend investment, further validation or changes. Do not report incremental ROI without adequate cost and margin data.]']
 ]}
];
let selectedReportTemplate='review';
function templateLanguage(zh,en){return uiLanguage==='en'?en:localize(zh)}
function templateBodyHTML(template){return template.sections.map(([zh,en,pzh,pen])=>'<h2>'+escape(templateLanguage(zh,en))+'</h2><p>'+escape(templateLanguage(pzh,pen))+'</p>').join('')}
function openReportTemplateLibrary(){
 const template=marketingReportTemplates.find(t=>t.id===selectedReportTemplate)||marketingReportTemplates[0];
 showDialog(localize('模板库'),'<div class="report-template-layout"><div class="report-template-options">'+marketingReportTemplates.map(t=>'<button type="button" class="report-template-choice '+(t.id===template.id?'active':'')+'" data-template-select="'+t.id+'" aria-pressed="'+(t.id===template.id)+'"><strong>'+escape(templateLanguage(...t.name))+'</strong><small>'+escape(templateLanguage(...t.scenario))+'</small></button>').join('')+'</div><div class="report-template-preview"><h3>'+escape(templateLanguage(...template.name))+'</h3><div class="report-template-document">'+templateBodyHTML(template)+'</div></div></div><div class="report-template-footer"><p class="sub">'+escape(templateLanguage('应用时替换正文结构，原内容先存为草稿版本；已引用的图表与备注保留。','Applying replaces the report structure and backs up existing content as a draft version. Referenced charts and captions are retained.'))+'</p><button type="button" class="primary" data-template-apply="'+template.id+'">'+localize('应用到当前报告')+'</button></div>');
}
document.addEventListener('click',event=>{
 if(event.target.closest('[data-report-templates]')){openReportTemplateLibrary();return}
 const select=event.target.closest('[data-template-select]');
 if(select){selectedReportTemplate=select.dataset.templateSelect;dialog.close();openReportTemplateLibrary();return}
 const apply=event.target.closest('[data-template-apply]');if(!apply)return;
 const template=marketingReportTemplates.find(t=>t.id===apply.dataset.templateApply);if(!template)return;
 if(document.querySelector('#report-body-editor'))saveRichReport();
 const draft=workspaceDraft(),before=structuredClone(draft);
 if((draft.text||'').trim()||(draft.bodyHTML||'').replace(/<[^>]*>/g,'').trim()||draft.evidence.length){if(!saveReportVersion('应用模板前备份'))return}
 rememberReportChange();
 draft.bodyHTML=templateBodyHTML(template);draft.text=reportPlainText(draft.bodyHTML);draft.templateId=template.id;
 if(!draft.title||draft.title==='营销活动复盘'||marketingReportTemplates.some(t=>t.name.includes(draft.title)))draft.title=templateLanguage(...template.name);
 const result=saveWorkspace();
 if(result.startsWith('自动保存失败')){for(const key of Object.keys(draft))delete draft[key];Object.assign(draft,before);showWorkbookNotice(result,true);return}
 dialog.close();renderWorkspace();showWorkbookNotice(localize('模板已应用到当前报告'));
});
