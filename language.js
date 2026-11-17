'use strict';

const languageKey='pacific-workbench-language';
const uiLanguages=['zh-CN','zh-HK','en'];
let uiLanguage='zh-CN';
try{const saved=sessionStorage.getItem(languageKey);if(uiLanguages.includes(saved))uiLanguage=saved}catch{}

const englishTerms={
  '太平洋咖啡':'Pacific Coffee','登录营销复盘工作台':'Sign in to the Marketing Workspace',
  '以市场经理身份体验演示平台。':'Explore the demo as a marketing manager.',
  '用户名称':'Display name','请输入用户名称。':'Enter a display name.','登录演示平台':'Sign in to the demo','语言':'Language',
  '市场经理':'Marketing Manager','营销复盘工作台':'Marketing Workspace','营销分析工作区':'Marketing Analytics',
  '课程演示原型':'Course demo','模拟数据':'Demo data','主导航':'Main navigation','折叠':'Collapse ','展开':'Expand ',
  '数据总览':'Overview','按日':'By Day','按门店':'By Store','按活动':'By Campaign','数据分析':'Analytics',
  '活动效果分析':'Campaign Performance','对比分析':'Comparisons','报告工作台':'Reports','帮助与方法':'Help & Methods',
  '项目规则':'Project Rules','问题反馈':'Report an Issue','按活动查看':'View campaigns','看活动效果':'View performance',
  '去对比分析':'Open comparisons','去对比':'Compare','去比较':'Compare','返回按活动':'Back to campaigns',
  '发布':'Publish','开始日期':'Start date','结束日期':'End date','结束月份':'End month','限定活动日期':'Apply campaign date range',
  '门店名称':'Store name','全部门店':'All stores','全部交易渠道':'All transaction channels','全部渠道':'All channels',
  '全部类型':'All types','全部状态':'All statuses','全部时间':'All dates','全部负责人':'All owners','全部':'All',
  '区域':'District','门店':'Store','交易渠道':'Transaction channel','活动渠道':'Campaign channel','渠道':'Channel','负责人':'Owner',
  '活动类型':'Campaign type','活动目标':'Campaign objective','活动名称或编号':'Campaign name or ID',
  '活动名称':'Campaign name','搜索活动名称':'Search by campaign name','搜索活动':'Search campaigns','活动搜索':'Campaign search',
  '搜索':'Search','清除筛选':'Clear filters','更多筛选':'More filters','排序指标':'Sort by','切换排序方向':'Reverse sort order',
  '升序':'Ascending','降序':'Descending','找到':'Found ','场活动':' campaigns','场':' campaigns','已选':'Selected ',
  '日期':'Date','星期日':'Sunday','星期一':'Monday','星期二':'Tuesday','星期三':'Wednesday','星期四':'Thursday','星期五':'Friday','星期六':'Saturday',
  '星期':'Weekday','活动档期与天数':'Campaign dates and duration','档期天数':'Duration (days)','档期':'Campaign dates',
  '活动状态':'Campaign status','运行状态':'Campaign status','未开始':'Upcoming','进行中':'In progress','已结束':'Ended',
  '日期倒挂':'Invalid date range','统计期间':'Reporting window','统计窗口':'Reporting window','活动全期':'Full campaign',
  '常设活动':'Evergreen campaigns','非常设活动':'Limited-time campaigns','结果可用性':'Result availability','操作':'Actions',
  '选择对比活动':'Select campaigns to compare','对比活动':'Comparison campaign','查看详情':'View details','长期在线':'Always on',
  '会员券类促销':'Member coupon promotion','节庆大促':'Holiday promotion','新品推广':'New product promotion','满额赠':'Spend and receive',
  '拉新目标表现':'Acquisition performance','提频目标表现':'Purchase frequency performance','唤醒目标表现':'Reactivation performance',
  '推新品目标表现':'New product performance','拉新':'Acquisition','提频':'Purchase frequency','唤醒':'Reactivation','推新品':'New product launch',
  '会员总营收（港元）':'Member revenue (HKD)','会员营收（港元）':'Member revenue (HKD)','会员营收':'Member revenue',
  '会员订单量':'Member orders','会员订单':'Member orders','会员客单价（港元）':'Average order value (HKD)','会员客单价':'Average order value',
  '客单价（港元）':'Average order value (HKD)','客单价':'Average order value','会员交易':'Member transactions','订单量':'Orders',
  '活动触达投入（港元）':'Campaign outreach spend (HKD)','活动触达投入':'Campaign outreach spend',
  '活动花费（港元）':'Campaign spend (HKD)','活动花费':'Campaign spend','活动投入（港元）':'Campaign spend (HKD)',
  '总投入（港元）':'Total spend (HKD)','总投入':'Total spend','校准净增量毛利（港元）':'Calibrated incremental gross profit (HKD)',
  '校准净增量毛利':'Calibrated incremental gross profit','ROI（校准）':'ROI (calibrated)','校准回收倍数':'Calibrated return multiple',
  '送达 CPM（港元）':'Delivery CPM (HKD)','送达 CPM':'Delivery CPM','送达率（%）':'Delivery rate (%)','送达率':'Delivery rate',
  '送达记录':'Delivered messages','已送达（含打开及点击）':'Delivered (including opens and clicks)','消息记录':'Message records',
  '活动消息送达':'Campaign message delivery','消息触达':'Message delivery','门店类型营收':'Revenue by store type',
  '门店类型':'Store type','覆盖门店':'Covered stores','未分类':'Unclassified','未标注':'Unspecified',
  '每日经营趋势':'Daily trading trends','每日营收与活动支出':'Daily revenue and campaign spend','每日趋势':'Daily trend',
  '每日会员营收':'Daily member revenue','每日会员订单量':'Daily member orders','每日会员客单价':'Daily average order value',
  '有交易记录的天数':'Days with transactions','有交易记录':'Transactions recorded','无交易记录':'No transactions recorded',
  '记录状态':'Data status','交叠期间的活动':'Campaigns overlapping the period','当前活动筛选范围':'Within campaign filters',
  '所选范围内':'Within the selected scope','环比':'Previous-period change','上一等长区间超出数据范围':'Previous equal-length period is outside the dataset',
  '环比对照紧邻的上一等长区间。':'Comparison uses the immediately preceding equal-length period.',
  '营业收入按有记录日汇总，无记录日留空。':'Revenue uses recorded trading days; missing days are blank.',
  '活动触达投入来自工作簿的日损益表。':'Campaign outreach spend comes from the daily P&L sheet.',
  '门店范围内暂无支出明细。':'Spend breakdown is unavailable for this scope.',
  '日投入仅适用于全网范围。':'Daily spend is available only for all stores and channels.',
  '工作簿暂无按门店拆分的花费、ROI 或 CPM。':'The workbook does not include store-level spend, ROI or CPM.',
  '活动效果与计算口径':'Campaign metrics and definitions','核心指标':'Key Metrics','指标口径与缺数说明':'Definitions and missing data',
  '指标使用各活动的全量投入、校准毛利及消息记录。日期、区域、门店和渠道筛选不拆分这些指标。':'Spend, calibrated profit and message metrics use the full campaign. Date, district, store and channel filters do not split these metrics.',
  '畅销商品':'Best sellers','畅销榜':'Best sellers','销量增长最快':'Fastest sales growth','增长榜':'Fastest growth',
  '当前期间销量前 5，按件数统计':'Top 5 by units sold in the selected period',
  '较上一等长区间，基准销量至少 10 件':'Compared with the previous equal-length period, minimum 10 baseline units',
  '暂无符合条件的增长商品。':'No products meet the growth criteria.',
  '订单渠道分布':'Orders by channel','订单渠道':'Order Channels','各渠道订单量及占比':'Orders and share by channel','门店 POS':'In-store POS','App 预点':'App pre-order',
  '交叉分析':'Cross Analysis','交叉维度':'Grouping dimensions','勾选分析维度':'Choose grouping dimensions',
  '按所选维度组合汇总活动期覆盖门店的会员交易。营收占比以整场活动覆盖范围为分母。':'Groups summarize member transactions at covered stores. Revenue share uses total covered campaign revenue.',
  '预览营收前 20 组，导出包含全部。':'previewing the top 20 by revenue; the export includes all groups.',
  '请勾选至少一项分析维度。':'Choose at least one grouping dimension.','请先勾选分析维度，再导出。':'Choose grouping dimensions before exporting.',
  '没有可用的活动交易明细。':'No campaign transactions are available.',
  '导出交叉表':'Export cross-tab','导出 Excel':'Export Excel','Excel 已生成 · 请查看浏览器下载':'Excel generated. Check browser downloads.',
  '无法生成 Excel，请重试。':'Could not generate Excel. Please try again.',
  '新客占比':'New customer share','覆盖门店新注册消费会员':'New members who purchased at covered stores',
  '同期会员增加量（全网）':'New member registrations (all stores)','同期注册消费会员':'Newly registered buyers',
  '较早注册消费会员':'Previously registered buyers','会员人均订单':'Orders per purchasing member','重复购买率':'Repeat purchase rate',
  '购买至少两单':'Two or more orders','购买一单':'One order','历史沉默回购会员':'Returning dormant members',
  '其他消费会员':'Other purchasing members','沉默回购者占比':'Dormant returner share',
  '新品营收':'New product revenue','新品订单渗透率':'New product order penetration',
  '选择基准和指标。每次运行可单独保存到报告。':'Choose a baseline and metric. Each result can be saved to a report.',
  '同期对比':'Same-period comparison','普通活动对比':'Open campaign comparison','同类型活动对比':'Same-type comparison',
  '对照组与 DID':'Control group and DID','平行趋势诊断':'Parallel trends check','运行前趋势诊断':'Check pre-campaign trends',
  '跨年同月或同年同期的活动对比':'Compare campaigns in equivalent periods',
  '任选两场非常设活动':'Choose any two limited-time campaigns','按活动开始后的相同天数比较':'Align by days since campaign start',
  '查看前趋势与前后双差':'Inspect pre-trends and difference-in-differences','活动前天数':'Pre-campaign days',
  '当前时期':'Current period','对比时期':'Baseline period','月份':'Month','当前活动':'Current campaign','基准活动':'Baseline campaign',
  '同类活动':'Same-type campaign','请选择活动':'Select a campaign','请选择基准':'Select a baseline',
  '情景毛利率（%）':'Scenario margin (%)','运行对比':'Run comparison','已保存的比较':'Saved comparisons','保存结果':'Save result',
  '加入报告':'Add to report','保存草稿':'Save draft','编辑草稿':'Edit draft','报告标题':'Report title','报告正文':'Report body',
  '报告素材':'Source material','撰写助手':'Writing assistant','生成数据摘要':'Generate data summary','用本机 AI 起草':'Draft with on-device AI',
  '追加到正文':'Append to report','返回编辑':'Back to editing','预览报告':'Preview report','打印':'Print','导出 Word':'Export Word',
  '营销活动复盘':'Campaign review','报告状态':'Report status','草稿':'Draft','已定稿':'Final','打开对比分析':'Open comparisons',
  '写下活动表现、对比发现与下一步行动':'Write campaign performance, findings and next steps',
  '选用总览图表和对比结果，编辑后预览与导出。':'Choose charts and comparisons, then edit, preview and export.',
  '从总览或对比分析加入素材。':'Add source material from comparisons.',
  '根据报告素材生成可编辑的复盘段落。':'Generate editable paragraphs from the report material.',
  '描述你遇到的问题，提交给技术人员排查。':'Describe the issue for technical support.',
  '问题类型':'Issue category','问题标题':'Issue title','问题描述':'Description','发生页面':'Affected page',
  '回复联系方式（选填）':'Contact (optional)','请选择问题类型':'Select a category','页面不显示或加载异常':'Page missing or not loading',
  '数据有误':'Incorrect data','操作或导出失败':'Action or export failed','其他问题':'Other issue','提交工单':'Submit ticket','下载工单':'Download ticket',
  '当前是本地文件。可下载工单并转交技术人员。':'This local file can generate a ticket for you to forward to support.',
  '提交后会生成工单编号，技术人员可以在工单队列查看。':'Submitted tickets receive a reference and appear in the support queue.',
  '请写明页面或活动、操作步骤、实际结果和预期结果':'Include the page or campaign, steps, actual result and expected result',
  '例如：按活动页面加载后空白':'Example: By Campaign opens to a blank page','例如：工作邮箱':'Example: Work email',
  '请填写问题类型、标题和描述。':'Enter a category, title and description.',
  '筛选与口径':'Scope & Definitions','筛选结果':'Filtered Results','每日经营':'Daily Trading','每日明细':'Daily Detail',
  '门店明细':'Store Detail','目标效果':'Objective Metrics','商品榜单':'Product Rankings','全品类销量':'Category Sales',
  '活动明细':'Campaign Detail','校准净增量毛利':'Calibrated incremental gross profit','计算口径':'Calculation definition',
  '口径或单位':'Definition or unit','数据来源':'Data source','模拟工作簿':'demo workbook','页面':'Page','项目':'Item','内容':'Details',
  '数值':'Value','说明':'Notes','指标':'Metric','编号':'ID','排名':'Rank','榜单':'Ranking','商品':'Product',
  '本期销量（件）':'Current units','上期销量（件）':'Previous units','增长率（%）':'Growth (%)','品类':'Category',
  '增减量（件）':'Unit change','变化率（%）':'Change (%)','变化方向':'Direction','订单占比（%）':'Order share (%)',
  '营收占比（%）':'Revenue share (%)','合计':'Total','增长':'Up','下降':'Down','持平':'Flat','缺上期数据':'No prior period',
  '咖啡':'Coffee','茶饮与鸳鸯':'Tea and Yuanyang','其他饮品':'Other drinks','轻食':'Light meals','糕点与节庆食品':'Bakery and seasonal foods',
  '数据包暂无':'Dataset does not contain','无可用趋势数据。':'No trend data available.','没有符合条件的活动。':'No matching campaigns.',
  '没有符合条件的记录。':'No matching records.','没有匹配活动。':'No matching campaigns.','暂无可用数据。':'No data available.',
  '无可用数据':'No data','待复核':'Pending review','暂不可估':'Unavailable','结果概览':'Results','归因证据':'Attribution evidence',
  '复盘报告':'Review report','活动机制':'Mechanism','证据状态':'Evidence status','数据完整度':'Data completeness',
  '发现':'Findings','当前':'Current','基准':'Baseline','处理组':'Treatment group','对照组':'Control group','观察差异':'Observed difference',
  '探索估计':'Exploratory estimate','覆盖':'Coverage','活动':'Campaign','对比':'Compare','门店':'Store','选择':'Select','查看':'View',
  '截至':'Through','金额单位':'Currency','变化':'Change','保存':'Save','取消':'Cancel','关闭':'Close','打开':'Open','移除':'Remove',
  '排序':'Sort','状态':'Status','上期销量':'Previous units','销量':'Units sold','总投入':'Total spend','工作簿':'workbook',
  '计算':'Calculation','记录':'records','活动期':'Campaign period','相对差异':'Relative difference','绝对差异':'Absolute difference',
  '港元':'HKD','万HKD':'×10k HKD','万港元':'×10k HKD','家':' stores','件':' units','单':' orders','条':' messages','人':' people',
  '天':' days','组':' groups','至':' to ','第':'Day '
};

Object.assign(englishTerms,{
  '（校准净增量毛利 − 总投入）÷ 总投入 × 100%。毛利和投入取自 v7 活动预算与效果校准表；原表「净 ROI」为回收倍数。投入缺失、为零或缺毛利时显示「—」。':'(Calibrated incremental gross profit − total spend) ÷ total spend × 100%. Both inputs use the v7 calibration sheet. The original ROI column is a return multiple. Missing profit or missing/zero spend is shown as a dash.',
  '活动总投入 ÷ 送达记录 × 1,000。送达记录包括 delivered、opened、clicked。投入缺失或送达记录为零时显示「—」。工作簿缺少广告曝光和独立媒体花费，广告 CPM 暂缺。':'Total spend ÷ delivered messages × 1,000. Delivered, opened and clicked messages count as delivered. Missing spend or zero deliveries is shown as a dash. Ad CPM is unavailable because impressions and separate media spend are missing.',
  '送达记录 ÷ 活动全部消息记录 × 100%。无消息记录时显示「—」，送达记录包括 delivered、opened、clicked。':'Delivered messages ÷ all campaign messages × 100%. Delivered, opened and clicked count as delivered. No message records is shown as a dash.',
  '活动窗口内覆盖门店的会员订单实收总额。':'Total receipts from member orders at covered stores during the campaign.',
  '活动窗口内覆盖门店的会员交易笔数。':'Number of member transactions at covered stores during the campaign.',
  '会员营收 ÷ 会员订单量。':'Member revenue ÷ member orders.',
  '活动覆盖门店内，统计期注册且有消费的去重会员 ÷ 同期有注册日期的去重消费会员。':'Unique purchasing members registered in the campaign period ÷ unique purchasing members with a known registration date, at covered stores.',
  '注册与消费均落在统计期，且在覆盖门店有消费的去重会员。':'Unique members who both registered and purchased at covered stores during the campaign period.',
  '全网同期首次注册记录数。工作簿没有销户变动或注册来源与活动的关联，无法归因或计算会员净增。':'First registrations across all stores in the period. Account closures and campaign links are unavailable, so net growth and attribution cannot be calculated.',
  '覆盖门店会员订单量 ÷ 去重消费会员。':'Member orders at covered stores ÷ unique purchasing members.',
  '覆盖门店统计期内至少消费两单的去重会员 ÷ 去重消费会员。':'Unique members with at least two orders ÷ unique purchasing members at covered stores.',
  '活动前连续 30 天在全网无购买、有更早购买记录，且统计期内在覆盖门店消费的去重会员。历史不足 30 天时留空。':'Unique members who purchased at covered stores during the period, after no purchases in the prior 30 days but with earlier purchase history. Blank if pre-period history is too short.',
  '历史沉默回购会员 ÷ 覆盖门店去重消费会员。属于消费观察。':'Returning dormant members ÷ unique purchasing members at covered stores. This is descriptive.',
  '覆盖门店内目标新品的订单行实收金额之和。v7 缺活动与目标 SKU 映射及商品行实收金额。':'Total receipts for targeted new-product lines at covered stores. v7 lacks campaign-to-SKU mapping and item-level receipts.',
  '含目标新品的订单数 ÷ 同期覆盖门店会员订单数。v7 缺活动与目标 SKU 映射。':'Orders including the targeted product ÷ covered member orders in the period. v7 lacks campaign-to-SKU mapping.',
  '送达率＝送达记录 ÷ 活动全部消息记录。门店图按店型加总会员营收。以上数据用于观察活动期间的表现。':'Delivery rate = delivered messages ÷ all campaign messages. The store chart sums member revenue by store type. Figures describe performance during the campaign.',
  '活动期覆盖门店的会员交易。各交叉组按其维度组合汇总，未记录交易的组合不列出。':'Member transactions at covered stores during the campaign. Results are grouped by selected dimensions; combinations with no transactions are omitted.',
  '客单价＝会员营收 ÷ 会员订单量；营收占比＝分组营收 ÷ 全活动覆盖门店会员营收。':'Average order value = member revenue ÷ member orders. Revenue share = group revenue ÷ member revenue across covered stores.',
  '空白代表未观测到数据或指标不适用。观察结果可能包含同期活动影响。':'Blank cells indicate unavailable or inapplicable metrics. Observed results may reflect overlapping campaigns.',
  '活动花费、校准毛利及消息记录':'campaign spend, calibrated profit and message records',
  'v7 校准表总投入；ROI、CPM 与花费使用活动全期口径。':'Total spend comes from the v7 calibration sheet. ROI, CPM and spend use the full campaign.',
  '覆盖工作簿中的会员交易。客单价＝会员营收 ÷ 会员订单量。':'Member transactions in the workbook. Average order value = member revenue ÷ member orders.',
  '港元。空白表示缺数据或不适用。':'HKD. Blank cells indicate unavailable or inapplicable data.',
  '增减量＝本期销量 − 上期销量。变化率＝增减量 ÷ 上期销量 × 100%；上期为零时变化率留空。品类按商品名称归组。':'Unit change = current units − previous units. Change % = unit change ÷ previous units × 100%. Blank if the previous period had zero units. Categories are assigned by product name.',
  '按交易商品售出件数。增长率＝（当前销量 − 上一等长区间销量）÷ 上一等长区间销量 × 100%；基准至少 10 件。':'Units sold from transactions. Growth % = (current units − previous equal-length period units) ÷ previous units × 100%, with a minimum baseline of 10 units.',
  '按所选维度组合汇总活动期覆盖门店的会员交易。营收占比以整场活动覆盖范围为分母。':'Group member transactions at covered stores by selected dimensions. Revenue share uses all covered campaign revenue.',
  '当前筛选没有匹配记录':'No records match the current filters','全品类变化':'Category trends','营收与订单':'Revenue and orders','客单价与营收占比':'Order value and revenue share',
  '对比周期':'Comparison period','品类归组':'Category mapping','商品榜':'Product ranking','目标表现':'Objective performance','已选中':'Selected',
  '活动效果':'Campaign performance','缺数':'Missing data','符合条件':'Matching ','共':'Total ','目标':'Objective',
  '港元，来自校准表':'HKD, from the calibration sheet','v7 messages 中对应活动的消息记录数。':'Message records for the selected campaign in v7.',
  '计入 delivered、opened、clicked 状态。':'Includes delivered, opened and clicked statuses.',
  '写字楼大堂店':'Office lobby','社区店':'Neighborhood store','院校店':'Campus store','医院店':'Hospital store',
  '机场店':'Airport store','景点店':'Tourist site store','证据通过':'Evidence passed','未观察到显著效果':'No significant effect observed',
  '预计':'Estimated','假设毛利率':'Assumed gross margin','毛利差额':'Gross profit difference','营收差额':'Revenue difference',
  '相对基准情景':'Baseline scenario','增量情景':'Incremental scenario','情景 ROI':'Scenario ROI','对比活动每店每日均值':'Baseline per store-day',
  '当前活动每店每日均值':'Current campaign per store-day','当前活动日均值':'Current daily average','基准活动日均值':'Baseline daily average',
  '日历天数':'Calendar days','日期倒挂夹具':'Invalid date sample','更多':'More','备注':'Notes','短期':'Limited-time',
  '查看数据异常与待补事项':'View data issues and pending items','无有效活动窗口':'No valid campaign window',
  '工作簿未覆盖该月份。':'This month is outside the dataset.','该月份没有可选的非常设活动。':'No limited-time campaigns in this month.',
  '请选择两场不同的非常设活动。':'Select two different limited-time campaigns.',
  '请选择两场不同的同类型活动。':'Select two different campaigns of the same type.',
  '请从两个时期各选一场不同的活动。':'Select a different campaign from each period.',
  '跨年同期请选择相同月份。同一年可选同月或相近月份。':'For different years, select the same month. Within one year, use the same or nearby months.',
  '选择基准和指标。每次运行可单独保存到报告。':'Choose the comparison metric and baseline. Results can be saved to a report.',
  '运行比较后可保存到当前浏览器。':'Run a comparison to save it in this browser.',
  '已保存的比较':'Saved comparisons','本次会话已保存':'Saved for this session',
  '请输入 0–100% 的情景毛利率。':'Enter a scenario margin between 0% and 100%.',
  '筛选范围缺少对应投入拆分，暂不计算 ROI。':'Spend is unavailable for this filtered scope, so ROI is blank.',
  '活动投入缺失或为零，暂不计算 ROI。':'Campaign spend is missing or zero, so ROI is blank.',
  '投入取自 v7 校准表的活动总投入。':'Spend is taken from the v7 calibration sheet.',
  '活动间差异仅作基准观察。':'Campaign differences are descriptive benchmarks.',
  '活动检索与列表':'Find campaigns','查看':'View','节庆食品':'Seasonal foods','期间':'period','选择':'Select',
  '覆盖门店数':'Covered stores','开始':'Start','结束':'End','标准误':'Standard error','近似':'Approximate','置信区间':'confidence interval',
  '导出交叉表':'Export cross-tab','订单渠道分布':'Orders by channel'
});

Object.assign(englishTerms,{
  '离岛区':'Islands','湾仔区':'Wan Chai','南区':'Southern','东区':'Eastern','屯门区':'Tuen Mun',
  '西贡区':'Sai Kung','观塘区':'Kwun Tong','深水埗区':'Sham Shui Po','油尖旺区':'Yau Tsim Mong',
  '葵青区':'Kwai Tsing','北区':'North','大埔区':'Tai Po','沙田区':'Sha Tin','荃湾区':'Tsuen Wan',
  '元朗区':'Yuen Long','九龙城区':'Kowloon City','黄大仙区':'Wong Tai Sin','中西区':'Central and Western',
  '营收 ÷ 订单':'Revenue ÷ orders','家覆盖门店':' covered stores','家门店明细':' store details','家门店':' stores',
  '可比较跨年同月，或同年同月／相近月份的两场活动。':'Compare the same month across years, or the same or nearby months within a year.',
  '数据覆盖':'Data coverage','打印 / 导出 PDF':'Print / export PDF','项目规则、数据来源与市场经理工作区':'Project rules, sources and the marketing manager workspace',
  '证据与报告规则':'Evidence and reporting rules','检查':'Check','未通过后的处理':'If the check fails',
  '阻断正式报告，保留草稿预览。':'Formal reporting is blocked; draft preview remains available.',
  '活动前趋势相关系数':'Pre-campaign trend correlation','结果仅供参考，复核对照组。':'Use results as reference only and review the control group.',
  '活动前均值偏差':'Pre-campaign mean difference','最大分层偏差':'Maximum stratum imbalance',
  '结果仅供参考，复核分层匹配。':'Use results as reference only and review matching by stratum.',
  '归因成立后的显著性':'Significance after attribution checks','95% 置信区间排除 0':'The 95% confidence interval excludes zero',
  '区间包含 0 时显示「未观察到显著效果」。':'If the interval includes zero, show “No significant effect observed.”',
  '营收与订单覆盖工作簿中的会员交易。':'Revenue and orders cover member transactions in the workbook.',
  'v7 非唤回活动的效果来自档位校准。唤回活动的参考净增量按触后康复消费 × 68% 毛利率 ×（1 − 35% 自然回流假设）计算。':'v7 estimates for non-reactivation campaigns use tier calibration. The reactivation estimate uses post-contact recovered spend × 68% gross margin × (1 − 35% assumed organic return).',
  '币种为港元。校准回收倍数沿用工作簿的净 ROI 列。增量 ROI 需另行复核，日投入取自日损益表。':'Currency is HKD. The calibrated return multiple comes from the workbook’s net ROI column. Incremental ROI requires review. Daily spend comes from the daily P&L.',
  '当前工作台采用市场经理视图。':'The workspace is shown in the marketing manager view.',
  '反馈问题':'Report an issue','页面 · ':'Page · ','排序指标':'Sort by','导出交叉分析':'Export cross analysis',
  '未填写':'Not provided','暂时无法确认提交。表单已保留，可以重试。':'Submission could not be confirmed. Your form was kept; please retry.',
  '正在提交':'Submitting','已进入技术工单队列。编号':'Submitted to support. Reference:',
  '已生成':'Generated','请把下载的文件转交技术人员。':'Forward the downloaded file to technical support.',
  '没有符合条件的活动。':'No campaigns match the filters.','匹配活动':'Matching campaigns','详情导航':'Detail navigation'
});

const traditionalCharacters={"万":"萬","与":"與","专":"專","业":"業","东":"東","两":"兩","严":"嚴","个":"個","临":"臨","义":"義","为":"為","么":"麼","乐":"樂","书":"書","买":"買","于":"於","亏":"虧","亚":"亞","产":"產","亲":"親","仅":"僅","从":"從","们":"們","价":"價","优":"優","会":"會","体":"體","倾":"傾","储":"儲","儿":"兒","兑":"兌","关":"關","内":"內","册":"冊","写":"寫","农":"農","冲":"衝","决":"決","况":"況","净":"淨","减":"減","几":"幾","凭":"憑","击":"擊","则":"則","创":"創","别":"別","剥":"剝","办":"辦","务":"務","动":"動","劳":"勞","势":"勢","区":"區","医":"醫","单":"單","卖":"賣","占":"佔","厂":"廠","历":"歷","厦":"廈","参":"參","双":"雙","发":"發","变":"變","叠":"疊","号":"號","后":"後","吗":"嗎","员":"員","响":"響","唤":"喚","围":"圍","国":"國","图":"圖","圣":"聖","场":"場","处":"處","复":"復","够":"夠","头":"頭","夺":"奪","学":"學","宁":"寧","实":"實","审":"審","宾":"賓","对":"對","导":"導","层":"層","属":"屬","岗":"崗","岛":"島","币":"幣","师":"師","带":"帶","帮":"幫","幂":"冪","干":"乾","并":"並","广":"廣","庆":"慶","库":"庫","应":"應","废":"廢","开":"開","异":"異","张":"張","弹":"彈","归":"歸","当":"當","录":"錄","征":"徵","径":"徑","态":"態","总":"總","恒":"恆","户":"戶","执":"執","报":"報","拟":"擬","拦":"攔","择":"擇","挂":"掛","损":"損","换":"換","据":"據","携":"攜","摊":"攤","撑":"撐","数":"數","断":"斷","无":"無","时":"時","显":"顯","暂":"暫","术":"術","机":"機","杂":"雜","权":"權","条":"條","来":"來","极":"極","构":"構","标":"標","样":"樣","档":"檔","检":"檢","楼":"樓","毕":"畢","气":"氣","汇":"匯","沉":"沈","没":"沒","测":"測","浏":"瀏","涨":"漲","渗":"滲","温":"溫","湾":"灣","满":"滿","灵":"靈","点":"點","热":"熱","状":"狀","独":"獨","环":"環","现":"現","电":"電","畅":"暢","盖":"蓋","盘":"盤","着":"著","码":"碼","确":"確","礼":"禮","视":"視","离":"離","种":"種","积":"積","称":"稱","笔":"筆","筛":"篩","签":"簽","简":"簡","类":"類","约":"約","级":"級","紧":"緊","纸":"紙","线":"線","组":"組","细":"細","终":"終","经":"經","结":"結","给":"給","绝":"絕","统":"統","绩":"績","绪":"緒","续":"續","维":"維","编":"編","网":"網","职":"職","联":"聯","脱":"脫","舍":"捨","节":"節","范":"範","荣":"榮","药":"藥","营":"營","虚":"虛","蚕":"蠶","补":"補","装":"裝","见":"見","观":"觀","规":"規","览":"覽","触":"觸","计":"計","订":"訂","认":"認","让":"讓","议":"議","记":"記","论":"論","设":"設","访":"訪","证":"證","识":"識","诉":"訴","诊":"診","词":"詞","试":"試","话":"話","诞":"誕","该":"該","详":"詳","误":"誤","说":"說","请":"請","诺":"諾","读":"讀","课":"課","谁":"誰","调":"調","谈":"談","负":"負","贡":"貢","财":"財","责":"責","败":"敗","账":"賬","购":"購","费":"費","资":"資","赚":"賺","赠":"贈","趋":"趨","跃":"躍","转":"轉","轮":"輪","轻":"輕","载":"載","较":"較","辅":"輔","辑":"輯","输":"輸","达":"達","过":"過","运":"運","还":"還","这":"這","进":"進","远":"遠","连":"連","适":"適","选":"選","逻":"邏","邮":"郵","邻":"鄰","采":"採","钱":"錢","钻":"鑽","铁":"鐵","铜":"銅","银":"銀","铺":"鋪","链":"鏈","销":"銷","错":"錯","锣":"鑼","键":"鍵","镜":"鏡","长":"長","门":"門","闪":"閃","闭":"閉","问":"問","间":"間","闸":"閘","阁":"閣","阅":"閱","队":"隊","际":"際","随":"隨","难":"難","页":"頁","顶":"頂","项":"項","须":"須","顾":"顧","顿":"頓","预":"預","领":"領","频":"頻","题":"題","额":"額","饮":"飲","饼":"餅","馆":"館","馈":"饋","验":"驗","骤":"驟","鲜":"鮮","鸟":"鳥","鸯":"鴦","鸳":"鴛","黄":"黃","齐":"齊","龙":"龍"};

const rawUiText=new WeakMap();
const rawUiAttributes=new WeakMap();
const localizedAttributes=['title','placeholder','aria-label','alt'];
const sourceNames=new Set();
const sourceData=window.MOCK;
for(const activity of sourceData.activity_summaries)sourceNames.add(activity.name);
for(const store of sourceData.revenue_summary.stores)sourceNames.add(store.name);
for(const product of sourceData.revenue_summary.products)sourceNames.add(product);
const quotePattern=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const englishPattern=new RegExp([...new Set([...sourceNames,...Object.keys(englishTerms)])]
  .sort((a,b)=>b.length-a.length).map(key=>key.length===1?'(?<![\\u3400-\\u9fff])'+quotePattern(key)+'(?![\\u3400-\\u9fff])':quotePattern(key)).join('|'),'g');
const originalNamesPattern=new RegExp([...sourceNames].sort((a,b)=>b.length-a.length).map(quotePattern).join('|'),'g');

function localize(text){
  if(typeof text!=='string'||uiLanguage==='zh-CN'||!/[\u3400-\u9fff]/.test(text))return text;
  if(uiLanguage==='en'){
    return text.replace(englishPattern,key=>sourceNames.has(key)?key:englishTerms[key]);
  }
  let start=0,result='';
  const convert=value=>value.replace(/[\u3400-\u9fff]/g,key=>traditionalCharacters[key]||key);
  for(const match of text.matchAll(originalNamesPattern)){
    result+=convert(text.slice(start,match.index))+match[0];
    start=match.index+match[0].length;
  }
  return result+convert(text.slice(start));
}

function localizeUi(root){
  if(root.nodeType===Node.TEXT_NODE){
    if(root.parentElement?.closest('script,style,textarea,#workspace-user,[data-language-original],[contenteditable]'))return;
    let state=rawUiText.get(root);
    if(!state||root.nodeValue!==state.output)state={source:root.nodeValue};
    state.output=localize(state.source);
    rawUiText.set(root,state);
    if(root.nodeValue!==state.output)root.nodeValue=state.output;
    return;
  }
  if(root.nodeType!==Node.ELEMENT_NODE||root.matches('script,style,[contenteditable],#login-language'))return;
  if(root.tagName==='OPTION'&&!root.hasAttribute('value'))root.value=root.textContent;
  let fields=rawUiAttributes.get(root);
  if(!fields){fields={};rawUiAttributes.set(root,fields)}
  for(const key of localizedAttributes){
    if(!root.hasAttribute(key))continue;
    const value=root.getAttribute(key);
    const state=fields[key]&&fields[key].output===value?fields[key]:{source:value};
    state.output=localize(state.source);
    fields[key]=state;
    if(state.output!==value)root.setAttribute(key,state.output);
  }
  for(const child of root.childNodes)localizeUi(child);
}

function setUiLanguage(value){
  uiLanguage=uiLanguages.includes(value)?value:'zh-CN';
  document.documentElement.lang=uiLanguage;
  document.title=localize('太平洋咖啡｜营销复盘工作台');
  try{sessionStorage.setItem(languageKey,uiLanguage)}catch{}
  localizeUi(document.body);
}

new MutationObserver(records=>{
  for(const record of records){
    if(record.type==='characterData')localizeUi(record.target);
    else if(record.type==='attributes')localizeUi(record.target);
    else for(const node of record.addedNodes)localizeUi(node);
  }
}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:localizedAttributes});
