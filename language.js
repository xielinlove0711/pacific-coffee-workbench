'use strict';

const languageKey='pacific-workbench-language';
const uiLanguages=['zh-CN','zh-HK','en'];
let uiLanguage='zh-CN';
try{const saved=sessionStorage.getItem(languageKey);if(uiLanguages.includes(saved))uiLanguage=saved}catch{}

const englishTerms={
  '个人主页':'My profile','更换头像':'Change photo','偏好设置':'Preferences','语言设置':'Language','应用到页面与导出表格':'Applies to pages and exported spreadsheets','黑夜模式':'Dark mode','降低界面亮度，适合夜间使用':'Reduce brightness for night-time use','草稿箱':'Drafts','报告草稿':'Report draft','继续编辑':'Continue editing','素材草稿纸':'Material scratchpad','打开草稿纸':'Open scratchpad','关于平台':'About the platform','太平洋咖啡营销复盘工作台':'Pacific Coffee Marketing Workspace','草稿保存在当前浏览器，可在草稿纸中导出备份。':'Drafts are saved in this browser. Export a backup from the scratchpad.','设置已保存':'Settings saved','查看经营数据、分析活动表现、比较活动效果，并整理素材与撰写报告。':'Explore business data, analyze and compare campaign performance, collect materials and write reports.','使用中遇到页面或数据问题，可通过问题反馈联系平台负责人。':'Use Report an Issue to contact the platform owner about page or data problems.',
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
  '会员总营收（HKD）':'Member revenue (HKD)','会员营收（HKD）':'Member revenue (HKD)','会员营收':'Member revenue',
  '会员订单量':'Member orders','会员订单':'Member orders','会员客单价（HKD）':'Average order value (HKD)','会员客单价':'Average order value',
  '客单价（HKD）':'Average order value (HKD)','客单价':'Average order value','会员交易':'Member transactions','订单量':'Orders',
  '活动触达投入（HKD）':'Campaign outreach spend (HKD)','活动触达投入':'Campaign outreach spend',
  '活动花费（HKD）':'Campaign spend (HKD)','活动花费':'Campaign spend','活动投入（HKD）':'Campaign spend (HKD)',
  '总投入（HKD）':'Total spend (HKD)','总投入':'Total spend','校准净增量毛利（HKD）':'Calibrated incremental gross profit (HKD)',
  '校准净增量毛利':'Calibrated incremental gross profit','ROI（校准）':'ROI (calibrated)','校准回收倍数':'Calibrated return multiple',
  '送达 CPM（HKD）':'Delivery CPM (HKD)','送达 CPM':'Delivery CPM','送达率（%）':'Delivery rate (%)','送达率':'Delivery rate',
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
  '同期会员增加量':'New member registrations (all stores)','同期注册消费会员':'Newly registered buyers',
  '较早注册消费会员':'Previously registered buyers','会员人均订单':'Orders per purchasing member','重复购买率':'Repeat purchase rate',
  '购买至少两单':'Two or more orders','购买一单':'One order','历史沉默回购会员':'Returning dormant members',
  '其他消费会员':'Other purchasing members','沉默回购者占比':'Dormant returner share',
  '新品营收':'New product revenue','新品订单渗透率':'New product order penetration',
  '选择基准和指标。每次运行可单独保存到报告。':'Choose a baseline and metric. Each result can be saved to a report.',
  '同期对比':'Same-period comparison','普通活动对比':'Open campaign comparison','同类型活动对比':'Same-type comparison',
  '增量效果评估':'Incrementality Measurement','平行趋势诊断':'Parallel trends check','运行前趋势诊断':'Check pre-campaign trends',
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
  'HKD':'HKD','万HKD':'×10k HKD','万HKD':'×10k HKD','家':' stores','件':' units','单':' orders','条':' messages','人':' people',
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
  'HKD。空白表示缺数据或不适用。':'HKD. Blank cells indicate unavailable or inapplicable data.',
  '增减量＝本期销量 − 上期销量。变化率＝增减量 ÷ 上期销量 × 100%；上期为零时变化率留空。品类按商品名称归组。':'Unit change = current units − previous units. Change % = unit change ÷ previous units × 100%. Blank if the previous period had zero units. Categories are assigned by product name.',
  '按交易商品售出件数。增长率＝（当前销量 − 上一等长区间销量）÷ 上一等长区间销量 × 100%；基准至少 10 件。':'Units sold from transactions. Growth % = (current units − previous equal-length period units) ÷ previous units × 100%, with a minimum baseline of 10 units.',
  '按所选维度组合汇总活动期覆盖门店的会员交易。营收占比以整场活动覆盖范围为分母。':'Group member transactions at covered stores by selected dimensions. Revenue share uses all covered campaign revenue.',
  '当前筛选没有匹配记录':'No records match the current filters','全品类变化':'Category trends','营收与订单':'Revenue and orders','客单价与营收占比':'Order value and revenue share',
  '对比周期':'Comparison period','品类归组':'Category mapping','商品榜':'Product ranking','目标表现':'Objective performance','已选中':'Selected',
  '活动效果':'Campaign performance','缺数':'Missing data','符合条件':'Matching ','共':'Total ','目标':'Objective',
  'HKD，来自校准表':'HKD, from the calibration sheet','v7 messages 中对应活动的消息记录数。':'Message records for the selected campaign in v7.',
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
  '币种为HKD。校准回收倍数沿用工作簿的净 ROI 列。增量 ROI 需另行复核，日投入取自日损益表。':'Currency is HKD. The calibrated return multiple comes from the workbook’s net ROI column. Incremental ROI requires review. Daily spend comes from the daily P&L.',
  '当前工作台采用市场经理视图。':'The workspace is shown in the marketing manager view.',
  '反馈问题':'Report an issue','页面 · ':'Page · ','排序指标':'Sort by','导出交叉分析':'Export cross analysis',
  '未填写':'Not provided','暂时无法确认提交。表单已保留，可以重试。':'Submission could not be confirmed. Your form was kept; please retry.',
  '正在提交':'Submitting','已进入技术工单队列。编号':'Submitted to support. Reference:',
  '已生成':'Generated','请把下载的文件转交技术人员。':'Forward the downloaded file to technical support.',
  '没有符合条件的活动。':'No campaigns match the filters.','匹配活动':'Matching campaigns','详情导航':'Detail navigation'
});

Object.assign(englishTerms,{
  '会员总数':'Total members (all stores)','同期新增注册':'New registrations (all stores)',
  '客户主数据':'Customer master data','日期筛选范围内':'Within the selected dates',
  '窗口内新会员（活动主表）':'New members (campaign sheet)','触达新会员':'New members reached',
  '触后 7 天首单转化率':'7-day first-order conversion','触后 7 天首单':'First orders within 7 days',
  '取自 v7 (5) 活动主表。':'From the v7 (5) campaign sheet.',
  '取自 v7 (5) 活动预算与效果校准表的新会员触达转化记录。':'From the new-member conversion record in the v7 (5) campaign calibration sheet.',
  '按工作簿记录，触达后 7 天内首次下单的新会员数。':'New members placing their first order within 7 days of outreach, as recorded in the workbook.',
  '触后 7 天首单人数 ÷ 触达新会员人数。':'First orders within 7 days ÷ new members reached.'
});
Object.assign(englishTerms,{'下载图表 PNG':'Download chart PNG','图表下载失败，请重试。':'Chart download failed. Please retry.'});
Object.assign(englishTerms,{'AI数据总结':'AI Data Summary','AI帮写':'AI Writing Assistant'});
Object.assign(englishTerms,{"总营收": "Total revenue", "总单量": "Total orders", "新增会员数": "New members", "有记录天数": "Days with data", "营收与活动投入": "Revenue & campaign spend", "活动投入": "Campaign spend", "星期经营表现": "Revenue by weekday", "营收日历": "Revenue calendar", "无记录": "No data", "星期一": "Mon", "星期二": "Tue", "星期三": "Wed", "星期四": "Thu", "星期五": "Fri", "星期六": "Sat", "星期日": "Sun", "一": "M", "二": "T", "三": "W", "四": "T", "五": "F", "六": "S", "日": "Day", "周": "Week", "月": "Month", "低": "Low", "高": "High", "门店POS": "In-store POS", "App预点": "App pre-order", "foodpanda外卖": "foodpanda delivery", "keeta外卖": "keeta delivery", "门店覆盖率": "Store coverage", "App 推送、会员券": "App push & member coupons", "App 推送": "App push", "每周一 App 落单手调饮品 9 折": "10% off handcrafted drinks ordered in the app every Monday", "新会员注册即送首杯 5 折券": "New members receive a 50%-off first-drink coupon", "出示长者八达通/乐悠咭全单 9 折": "10% off with an Elder Octopus or JoyYou Card", "自携盛器减 HK$3": "HKD 3 off with a reusable cup", "生日当月兑换蛋糕或标准装饮品 1 杯": "Redeem a cake or a standard drink during the birthday month", "2 周未消费自动推送 HK$25 现金券": "An HKD 25 coupon is sent after two weeks without a purchase", "App 预点自取全年 9 折，免排队": "10% off app pickup orders year-round; skip the queue", "每周三会员日全场手调饮品 8 折，App 落单生效": "20% off handcrafted drinks for members on Wednesdays when ordered in the app", "环比统计期间": "Previous comparison period", "加入素材草稿纸": "Add to scratchpad", "所选范围内": "Within the selected range", "日均会员营收": "Average daily member revenue", "个有记录日": "days with data", "按星期汇总当前筛选范围的会员营收，再除以该星期有交易记录的天数。单位：HKD。": "Member revenue by weekday divided by the number of recorded trading days for that weekday. Currency: HKD.", "颜色越深，当日营收越高。按当前范围的营收分位数着色，悬停色块可查看当日明细。": "Darker cells indicate higher daily revenue. Colors reflect revenue quartiles within the selected range. Hover for daily details.", "会员订单": "Member orders", "当前期间销量前 5，按件数统计": "Top five products by units sold in the selected period", "较上一等长区间，基准销量至少 10 件": "Compared with the previous period of equal length; at least 10 units sold in the baseline period", "（校准净增量毛利 − 总投入）÷ 总投入 × 100%。毛利和投入取自 活动预算与效果校准表；原表「净 ROI」为回收倍数。投入缺失、为零或缺毛利时显示「—」。": "(Calibrated incremental gross profit − total spend) ÷ total spend × 100%. Profit and spend come from the campaign budget and calibration sheet. The source net ROI is a return multiple. Shown as — if spend is missing or zero, or profit is missing.", "送达记录 ÷ 活动全部消息记录 × 100%。无消息记录时显示「—」，送达记录包括 delivered、opened、clicked。": "Delivered records ÷ all campaign message records × 100%. Delivered includes delivered, opened and clicked statuses. Shown as — when no message records exist.", "活动总投入 ÷ 送达记录 × 1,000。送达记录包括 delivered、opened、clicked。投入缺失或送达记录为零时显示「—」。工作簿缺少广告曝光和独立媒体花费，广告 CPM 暂缺。": "Total campaign spend ÷ delivered message records × 1,000. Delivered includes delivered, opened and clicked statuses. Shown as — if spend is missing or deliveries are zero. Advertising CPM is unavailable because impressions and separate media spend are not recorded.", "参与门店数 ÷ 门店主数据中的全部门店数 × 100%。": "Participating stores ÷ all stores in the store master × 100%.", "实际": "Actual", "趋势按选定日期与门店展示。没有交易记录的日期留空。": "Trends reflect the selected dates and stores. Dates without transaction records are left blank.", "默认展示全年活动目录及各活动的统计期间。勾选「限定活动日期」可按所选日期查看。活动营收为统计期间内参与门店的会员交易。活动可能重叠，各行不可加总，也不表示活动增量。": "The annual campaign list and each reporting window are shown by default. Enable Apply campaign date range to filter by date. Revenue covers member transactions at participating stores during each reporting window. Campaigns may overlap; rows are not additive and do not represent incremental revenue.", "选": "Select", "日期待核": "Check dates", "统计期间": "Reporting window", "核心表现": "Key performance", "新会员首单转化": "New-member first orders", "首单转化率": "First-order conversion", "活动全期总投入。": "Total spend over the full campaign period.", "其他消费会员": "Other purchasing members", "活动覆盖门店内，统计期注册且有消费的去重会员 ÷ 同期有注册日期的去重消费会员。": "Unique members who registered and purchased during the reporting window at participating stores ÷ all unique purchasing members with a known registration date in that window.", "注册与消费均落在统计期，且在覆盖门店有消费的去重会员。": "Unique members who both registered and purchased within the reporting window at participating stores.", "全网同期首次注册记录数。工作簿没有销户变动或注册来源与活动的关联，无法归因或计算会员净增。": "First-time registrations across all stores during the same period. The workbook does not track account closures or link registrations to campaigns, so attribution and net membership growth cannot be calculated.", "取自 活动主表。": "From the campaign master sheet.", "取自 活动预算与效果校准表的新会员触达转化记录。": "From the new-member outreach and conversion records in the campaign calibration sheet.", "按工作簿记录，触达后 7 天内首次下单的新会员数。": "New members who placed their first order within seven days of outreach, as recorded in the workbook.", "触后 7 天首单人数 ÷ 触达新会员人数。": "New members ordering within seven days ÷ new members reached.", "评估活动带来的额外提升": "Estimate the additional impact of a campaign", "DID（双重差分）用处理组活动前后的变化，减去对照组同期的变化，估计活动差异。本页仅允许选择有 Holdout 设计记录的活动。Holdout 是投放前预先留出的对照人群；还需保存分组名单及两组前后交易，并复核平行趋势和同期活动。有设计记录但缺少明细时需补数据才能运行。": "Difference-in-differences (DID) subtracts the control group’s before-to-after change from the treatment group’s change. Only campaigns with a recorded holdout design can be selected. A holdout is a group reserved before launch. Keep group assignments and transactions before and after launch, then review parallel trends and concurrent campaigns. A design record alone is insufficient if transaction details are missing.", "引用素材": "Referenced materials", "调用草稿纸": "Open scratchpad", "AI报告助手": "AI report assistant", "加粗": "Bold", "斜体": "Italic", "下划线": "Underline", "项目列表": "Bulleted list", "编号列表": "Numbered list", "撤销": "Undo", "重做": "Redo", "标题层级": "Text style", "标题 1": "Heading 1", "标题 2": "Heading 2", "标题 3": "Heading 3", "正文排版": "Formatting", "报告正文": "Report body", "写下活动表现、发现与下一步行动": "Write campaign results, findings and next steps", "平台负责人邮箱": "Platform support email", "发送工单": "Send ticket", "填写平台负责人邮箱，供发送工单使用": "Enter the platform owner’s email to send a ticket", "例如：数据总览 › 按门店": "For example: Overview › By Store", "营销活动复盘": "Campaign review", "份引用素材": "referenced materials", "已保存": "Saved", "份素材与笔记": "materials and notes", "固定当前位置": "Pin this position", "解除固定，允许拖动": "Unpin to move", "切换为悬浮窗口": "Switch to floating window", "切换悬浮窗口": "Switch to floating window", "切回左侧边栏": "Switch to left sidebar", "解除固定": "Unpin", "固定": "Pin", "返回按活动": "Back to campaigns", "把草稿纸里的图表拖到这里": "Drag a chart from the scratchpad here", "图片备注": "Image caption", "拖动调整图片宽度": "Drag to resize image", "移除图片": "Remove image", "输入备注，按 Enter 完成": "Enter a caption and press Enter", "正在生成图片…": "Preparing image…", "新笔记": "New note", "写笔记": "Add note", "笔记": "Note", "图表／指标": "Chart / metric", "回到来源": "View source", "素材标题": "Material title", "记录发现、疑问或下一步行动": "Note a finding, question or next step", "在看板中点「＋」收集，写报告时随时调用。": "Collect items with + on the dashboard and use them in your report.", "暂无匹配素材。": "No matching materials.", "导出备份": "Export backup", "搜索素材": "Search materials", "正在生成缩略图…": "Preparing thumbnail…", "素材缩略图": "Material thumbnail", "缩略图暂不可用": "Thumbnail unavailable", "资料来源": "Source", "其他问题": "Other issue", "提交人": "Submitted by", "创建时间": "Created at", "技术支持工单": "Support ticket", "请先填写平台负责人的邮箱。": "Enter the platform owner’s email first.", "已请求打开邮件应用，请核对收件人和内容后发送。若未打开，请检查默认邮件应用设置，或下载工单转交负责人。": "Your mail app has been requested. Review the recipient and content before sending. If it does not open, check your default mail app or download the ticket and forward it.", "总营收（HKD）": "Total revenue (HKD)", "会员总数": "Total members", "总营收（": "Total revenue (", "默认展示": "Shown by default", "活动目标": "Campaign objective", "送达率": "Delivery rate", "送达 CPM": "Delivery CPM"});
Object.assign(englishTerms,{"沉默回购会员": "Reactivated members", "新品表现": "New-product performance", "重复购买会员": "Repeat purchasers", "补充活动与商品的对应关系后，可展示新品销售额、订单渗透率和销量趋势。": "Link campaigns to products to view new-product revenue, order penetration and sales trends.", "未进行 Holdout · 不可选": "No holdout · unavailable", "Holdout · 需补条件": "Holdout · prerequisites missing", "新客占比": "New-customer share", "首单转化": "First-order conversion", "同期新增会员": "New members in period", "个有记录日": "recorded days", "周日": "Sun", "周一": "Mon", "周二": "Tue", "周三": "Wed", "周四": "Thu", "周五": "Fri", "周六": "Sat", "会员营收": "Member revenue", "会员订单": "Member orders", "同期对比": "Period comparison", "普通活动对比": "Campaign comparison", "同类型活动对比": "Similar campaigns", "增量效果评估": "Incrementality", "活动效果分析": "Campaign performance", "报告工作台": "Report workspace", "数据总览": "Overview", "数据分析": "Analysis", "客单价": "Average order value", "活动投入": "Campaign spend", "有记录天数": "Days with data", "订单渠道分布": "Orders by channel", "销量增长最快": "Fastest-growing products", "畅销商品": "Best sellers", "本期": "Current period", "上一周期": "Previous period", "全品类": "All categories", "品类": "Category", "统计起止时间": "Reporting period", "AI数据总结": "AI data summary", "AI帮写": "AI writing assistant", "AI报告助手": "AI report assistant", "行内注释": "Inline note", "输入内容": "Enter text", "份素材": "materials", "未分类": "Uncategorized"});
Object.assign(englishTerms,{"热鲜奶咖啡": "Hot caffè latte", "鸳鸯": "Yuen yeung", "港式奶茶": "Hong Kong milk tea", "洋甘菊茶": "Chamomile tea", "鲜奶咖啡": "Caffè latte", "朱古力": "Chocolate", "伯爵茶": "Earl Grey tea", "牛角包/糕点": "Croissants & pastries", "摩卡": "Mocha", "手冲咖啡": "Pour-over coffee", "冰美式": "Iced Americano", "美式咖啡": "Americano", "卡布奇诺": "Cappuccino", "拿铁": "Latte", "沙律": "Salad", "Nutribite健康餐": "Nutribite meals", "桂花米乳咖啡": "Osmanthus rice-milk coffee", "其乐冰(冷饮)": "Chillers", "芝士蛋糕": "Cheesecake", "三文治": "Sandwich", "月饼(中秋)": "Mid-Autumn mooncakes", "趋势按选定日期与门店展示。无交易记录的日期留空。": "Trends reflect the selected dates and stores. Dates without transaction records are left blank.", "默认展示全年活动目录及各活动的统计窗口。勾选「限定活动日期」可按所选日期查看。活动营收为统计期间内参与门店的会员交易。活动可能重叠，各行不可加总，也不表示活动增量。": "The full-year campaign list and reporting windows are shown by default. Select Apply campaign date range to filter by date. Revenue covers member transactions at participating stores within each reporting window. Campaigns may overlap; rows are not additive and do not represent incremental revenue.", "评估活动带来的额外增长": "Estimate additional campaign impact", "油尖旺区写字楼大堂店01店": "Yau Tsim Mong · Office lobby 01", "东区写字楼大堂店02店": "Eastern · Office lobby 02", "东区写字楼大堂店03店": "Eastern · Office lobby 03", "油尖旺区写字楼大堂店04店": "Yau Tsim Mong · Office lobby 04", "东区写字楼大堂店05店": "Eastern · Office lobby 05", "葵青区写字楼大堂店06店": "Kwai Tsing · Office lobby 06", "观塘区写字楼大堂店07店": "Kwun Tong · Office lobby 07", "东区写字楼大堂店08店": "Eastern · Office lobby 08", "葵青区写字楼大堂店09店": "Kwai Tsing · Office lobby 09", "东区写字楼大堂店10店": "Eastern · Office lobby 10", "油尖旺区写字楼大堂店11店": "Yau Tsim Mong · Office lobby 11", "中西区写字楼大堂店12店": "Central & Western · Office lobby 12", "油尖旺区写字楼大堂店13店": "Yau Tsim Mong · Office lobby 13", "湾仔区写字楼大堂店14店": "Wan Chai · Office lobby 14", "油尖旺区写字楼大堂店15店": "Yau Tsim Mong · Office lobby 15", "东区写字楼大堂店16店": "Eastern · Office lobby 16", "东区写字楼大堂店17店": "Eastern · Office lobby 17", "葵青区写字楼大堂店18店": "Kwai Tsing · Office lobby 18", "观塘区写字楼大堂店19店": "Kwun Tong · Office lobby 19", "湾仔区写字楼大堂店20店": "Wan Chai · Office lobby 20", "中西区写字楼大堂店21店": "Central & Western · Office lobby 21", "油尖旺区写字楼大堂店22店": "Yau Tsim Mong · Office lobby 22", "油尖旺区写字楼大堂店23店": "Yau Tsim Mong · Office lobby 23", "湾仔区写字楼大堂店24店": "Wan Chai · Office lobby 24", "葵青区写字楼大堂店25店": "Kwai Tsing · Office lobby 25", "湾仔区写字楼大堂店26店": "Wan Chai · Office lobby 26", "油尖旺区写字楼大堂店27店": "Yau Tsim Mong · Office lobby 27", "中西区写字楼大堂店28店": "Central & Western · Office lobby 28", "油尖旺区写字楼大堂店29店": "Yau Tsim Mong · Office lobby 29", "东区写字楼大堂店30店": "Eastern · Office lobby 30", "葵青区写字楼大堂店31店": "Kwai Tsing · Office lobby 31", "油尖旺区写字楼大堂店32店": "Yau Tsim Mong · Office lobby 32", "湾仔区写字楼大堂店33店": "Wan Chai · Office lobby 33", "中西区写字楼大堂店34店": "Central & Western · Office lobby 34", "东区写字楼大堂店35店": "Eastern · Office lobby 35", "油尖旺区写字楼大堂店36店": "Yau Tsim Mong · Office lobby 36", "观塘区写字楼大堂店37店": "Kwun Tong · Office lobby 37", "湾仔区写字楼大堂店38店": "Wan Chai · Office lobby 38", "沙田区医院店01店": "Sha Tin · Hospital 01", "沙田区医院店02店": "Sha Tin · Hospital 02", "南区医院店03店": "Southern · Hospital 03", "沙田区医院店04店": "Sha Tin · Hospital 04", "沙田区医院店05店": "Sha Tin · Hospital 05", "沙田区医院店06店": "Sha Tin · Hospital 06", "离岛区景点店01店": "Islands · Tourist site 01", "湾仔区景点店02店": "Wan Chai · Tourist site 02", "东区景点店03店": "Eastern · Tourist site 03", "离岛区景点店04店": "Islands · Tourist site 04", "东区景点店05店": "Eastern · Tourist site 05", "南区景点店06店": "Southern · Tourist site 06", "油尖旺区景点店07店": "Yau Tsim Mong · Tourist site 07", "离岛区景点店08店": "Islands · Tourist site 08", "离岛区机场店01店": "Islands · Airport 01", "离岛区机场店02店": "Islands · Airport 02", "离岛区机场店03店": "Islands · Airport 03", "离岛区机场店04店": "Islands · Airport 04", "沙田区院校店01店": "Sha Tin · Campus 01", "大埔区院校店02店": "Tai Po · Campus 02", "中西区院校店03店": "Central & Western · Campus 03", "九龙城区院校店04店": "Kowloon City · Campus 04", "九龙城区院校店05店": "Kowloon City · Campus 05", "大埔区院校店06店": "Tai Po · Campus 06", "九龙城区院校店07店": "Kowloon City · Campus 07", "沙田区院校店08店": "Sha Tin · Campus 08", "九龙城区院校店09店": "Kowloon City · Campus 09", "大埔区院校店10店": "Tai Po · Campus 10", "沙田区院校店11店": "Sha Tin · Campus 11", "沙田区院校店12店": "Sha Tin · Campus 12", "油尖旺区院校店13店": "Yau Tsim Mong · Campus 13", "沙田区院校店14店": "Sha Tin · Campus 14", "中西区院校店15店": "Central & Western · Campus 15", "油尖旺区院校店16店": "Yau Tsim Mong · Campus 16", "油尖旺区院校店17店": "Yau Tsim Mong · Campus 17", "油尖旺区院校店18店": "Yau Tsim Mong · Campus 18", "湾仔区社区店01店": "Wan Chai · Neighborhood 01", "南区社区店02店": "Southern · Neighborhood 02", "东区社区店03店": "Eastern · Neighborhood 03", "南区社区店04店": "Southern · Neighborhood 04", "东区社区店05店": "Eastern · Neighborhood 05", "屯门区社区店06店": "Tuen Mun · Neighborhood 06", "东区社区店07店": "Eastern · Neighborhood 07", "屯门区社区店08店": "Tuen Mun · Neighborhood 08", "屯门区社区店09店": "Tuen Mun · Neighborhood 09", "西贡区社区店10店": "Sai Kung · Neighborhood 10", "观塘区社区店11店": "Kwun Tong · Neighborhood 11", "湾仔区社区店12店": "Wan Chai · Neighborhood 12", "深水埗区社区店13店": "Sham Shui Po · Neighborhood 13", "观塘区社区店14店": "Kwun Tong · Neighborhood 14", "深水埗区社区店15店": "Sham Shui Po · Neighborhood 15", "深水埗区社区店16店": "Sham Shui Po · Neighborhood 16", "油尖旺区社区店17店": "Yau Tsim Mong · Neighborhood 17", "观塘区社区店18店": "Kwun Tong · Neighborhood 18", "葵青区社区店19店": "Kwai Tsing · Neighborhood 19", "离岛区社区店20店": "Islands · Neighborhood 20", "北区社区店21店": "North · Neighborhood 21", "葵青区社区店22店": "Kwai Tsing · Neighborhood 22", "离岛区社区店23店": "Islands · Neighborhood 23", "大埔区社区店24店": "Tai Po · Neighborhood 24", "西贡区社区店25店": "Sai Kung · Neighborhood 25", "沙田区社区店26店": "Sha Tin · Neighborhood 26", "观塘区社区店27店": "Kwun Tong · Neighborhood 27", "深水埗区社区店28店": "Sham Shui Po · Neighborhood 28", "葵青区社区店29店": "Kwai Tsing · Neighborhood 29", "荃湾区社区店30店": "Tsuen Wan · Neighborhood 30", "东区社区店31店": "Eastern · Neighborhood 31", "沙田区社区店32店": "Sha Tin · Neighborhood 32", "湾仔区社区店33店": "Wan Chai · Neighborhood 33", "大埔区社区店34店": "Tai Po · Neighborhood 34", "深水埗区社区店35店": "Sham Shui Po · Neighborhood 35", "屯门区社区店36店": "Tuen Mun · Neighborhood 36", "元朗区社区店37店": "Yuen Long · Neighborhood 37", "西贡区社区店38店": "Sai Kung · Neighborhood 38", "离岛区社区店39店": "Islands · Neighborhood 39", "西贡区社区店40店": "Sai Kung · Neighborhood 40", "观塘区社区店41店": "Kwun Tong · Neighborhood 41", "九龙城区社区店42店": "Kowloon City · Neighborhood 42", "观塘区社区店43店": "Kwun Tong · Neighborhood 43", "观塘区社区店44店": "Kwun Tong · Neighborhood 44", "九龙城区社区店45店": "Kowloon City · Neighborhood 45", "深水埗区社区店46店": "Sham Shui Po · Neighborhood 46", "九龙城区社区店47店": "Kowloon City · Neighborhood 47", "沙田区社区店48店": "Sha Tin · Neighborhood 48", "深水埗区社区店49店": "Sham Shui Po · Neighborhood 49", "观塘区社区店50店": "Kwun Tong · Neighborhood 50", "南区社区店51店": "Southern · Neighborhood 51", "屯门区社区店52店": "Tuen Mun · Neighborhood 52", "葵青区社区店53店": "Kwai Tsing · Neighborhood 53", "观塘区社区店54店": "Kwun Tong · Neighborhood 54", "黄大仙区社区店55店": "Wong Tai Sin · Neighborhood 55", "油尖旺区社区店56店": "Yau Tsim Mong · Neighborhood 56"});
Object.assign(englishTerms,{"每店每日会员营收": "Revenue per store-day", "每店每日会员订单": "Orders per store-day", "HKD／店日": "HKD/store-day", "单／店日": "Orders/store-day", "HKD／单": "HKD/order", "店日": "store-day", "双方数值": "Campaign values", "差额 / 变化率": "Gap / change", "观察天数": "Observed days", "主要发现": "Key findings", "会员订单频次（每店每日）": "Orders per store-day: ", "，客单价": "; average order value: ", "当前活动每店每日会员营收 ": "Current revenue per store-day: ", "，基准为 ": "; baseline: ", "营收和订单按店日标准化后比较。": "Revenue and orders are normalized per store-day.", "活动期间与门店范围提示": "Period & store scope notes", "同类型活动对比提示": "Comparison scope notes", "活动期间不同，季节、节假日及观察天数可能影响结果。": "Campaign periods differ. Seasonality, holidays and observation length may affect results.", "门店范围不同，店型和地区结构可能影响结果。": "Store coverage differs. Store types and regional mix may affect results.", "按各自活动第几天对齐，使用每店每日指标比较。": "Aligned by day since campaign start, using per-store daily metrics.", "当前筛选内门店": "Stores in the current filter", "共同门店": "Stores in common", "查看目标指标": "View objective metrics", "各自前": "First ", "每店每日": "Per store-day", "每店": "Per store", "高于基准": "above baseline", "低于基准": "below baseline", "持平": "Unchanged", "数据不足": "Insufficient data", "基准为零，变化率暂缺": "The baseline is zero; percentage change is unavailable", "活动期间": "Campaign period", "观察": "Observed", "天；": " days; ", "两场活动覆盖": "Store coverage: ", "基准为": "Baseline: ", "组。": " groups.", "来源活动": "Source campaign", "图片标题": "Image title", "保存结果": "Save result", "运行对比": "Run comparison", "保存到草稿纸": "Save to scratchpad"});
// v9 adds anonymous guest receipts and paid-media measurement.
for(const [key,value] of Object.entries({...englishTerms})){
  const revised=key.replaceAll('会员交易','会员与散客交易').replaceAll('会员营收','总营收').replaceAll('会员订单','总单量').replaceAll('总单量量','总单量');
  if(revised!==key&&!englishTerms[revised])englishTerms[revised]=value.replace(/Member transactions/g,'Member and guest transactions').replace(/member transactions/g,'member and guest transactions').replace(/Member revenue/g,'Total revenue').replace(/member revenue/g,'total revenue').replace(/Member orders/g,'Total orders').replace(/member orders/g,'total orders');
}
Object.assign(englishTerms,{'会员与散客交易':'Member and guest transactions','总营收':'Total revenue','总单量':'Total orders','每店每日总营收':'Revenue per store-day','每店每日总单量':'Orders per store-day','当前活动每店每日总营收 ':'Current revenue per store-day: ','总单量频次（每店每日）':'Orders per store-day: ','广告 CPM':'Ad CPM','广告 CPM（HKD）':'Ad CPM (HKD)','广告投放表现':'Paid media performance','广告投放':'Paid media','广告曝光':'Impressions','广告点击':'Clicks','媒体花费':'Media spend','点击率':'Click-through rate','自助咖啡机':'Self-service coffee','新增活动方案':'Added campaign scenario','计划预算':'Planned budget','目标人群':'Target audience','经营数据截至':'Trading data through','实际投入、ROI 与 CPM 待投放记录补齐。':'Actual spend, ROI and CPM require delivery records.','活动来源':'Campaign source','数据截止':'Data cutoff','v9 活动主表':'v9 campaign master','活动付费媒体花费 ÷ 广告曝光量 × 1,000。来源：广告投放表，按活动编号汇总所有平台与月份。曝光缺失或为零时显示「—」；不使用总投入或触达消息条数替代。':'Paid media spend ÷ impressions × 1,000. Aggregated across all platforms and months for the campaign in the advertising sheet. Shown as — if impressions are missing or zero. Total campaign spend and message counts are not substitutes.','广告投放表中该活动的曝光量合计。':'Total campaign impressions recorded in the advertising sheet.','广告投放表中该活动的点击量合计。':'Total campaign clicks recorded in the advertising sheet.','仅付费广告花费；已包含在活动总投入中，不重复加计。':'Paid media spend only. Already included in total campaign spend; do not add it again.','广告点击 ÷ 广告曝光 × 100%。':'Clicks ÷ impressions × 100%.','覆盖门店已识别会员订单量 ÷ 去重消费会员；不含匿名散客。':'Identified member orders ÷ unique purchasing members at covered stores; anonymous guests are excluded.','活动窗口内覆盖门店的会员与散客实收总额。':'Total member and guest receipts at covered stores during the campaign.','活动窗口内覆盖门店的会员与散客交易笔数。':'Member and guest transactions at covered stores during the campaign.','P1-A 快取通勤族、P3 职场新人':'P1-A commuters and P3 early-career professionals','P4-b 大学在校生、P4-c 成人进修学员':'P4-b university students and P4-c adult learners','P2 社区熟客、P3 职场新人、P5-亲子家庭客':'P2 neighborhood regulars, P3 early-career professionals and P5 families'});
Object.assign(englishTerms,{'选择评估方法':'Choose an assessment method','下载准备清单':'Download checklist','门店对照评估':'Store control assessment','会员随机留出':'Randomized member holdout','运行探索评估':'Run exploratory assessment','门店前趋势诊断':'Store pre-trend diagnostics','门店对照探索评估':'Exploratory store assessment','待准备数据':'Data preparation required','可做门店探索评估':'Store exploration available','待实验质量检查':'Experiment quality checks required','当前缺口':'Missing prerequisites','上线前如何准备':'Prepare before launch','会员随机留出设计':'Member holdout design','有记录':'Recorded','未记录':'Not recorded','没有会员随机留出设计':'No member holdout design','会员分组明细尚未接入':'Member assignments not connected','实验质量检查尚不可执行':'Experiment quality checks unavailable','没有可用门店对照':'No usable store controls','对照门店不足':'Too few control stores','活动前后数据不完整':'Incomplete before/after windows','缺少参与门店':'No participating stores','活动日期倒挂':'Reversed campaign dates','会员 Holdout 不能替代门店对照':'Member holdout cannot replace store controls','1 条件具备':'1 Data available','2 已运行诊断':'2 Diagnostics completed','2 运行前趋势诊断':'2 Run pre-trend diagnostics','3 复核后评估':'3 Review and assess','活动前':'Baseline','活动期':'Campaign period','家活动门店':'campaign stores','家对照门店':'control stores','用于重要活动的专项验证。先检查条件，再诊断与评估；可计算不代表已证实因果效果。':'A dedicated workflow for important campaigns. Check prerequisites, diagnose and assess. Computability does not establish causality.','选择任意非常设活动，可查看条件检查和上线前准备事项。':'Select any limited-time campaign to review prerequisites and preparation steps.','投放前随机保留一部分会员不触达。当前缺少分组明细。':'Randomly withhold outreach from a group of members before launch. Assignment details are currently missing.','我已查看前期趋势与组间差异，并确认已复核同期活动及营业变化；结果仅作探索。':'I have reviewed pre-period trends, group differences, concurrent campaigns and operating changes. Results remain exploratory.','门店对照并非会员随机实验；需核查同期促销、门店营业变化及组间污染。':'Store controls are not a randomized member experiment. Review concurrent promotions, store operations and contamination.','对照门店少于 10 家：仅作小样本探索，不展示当前算法的近似 95% 区间。':'Fewer than 10 control stores: small-sample exploration only; no approximate 95% interval is shown.'});
const traditionalCharacters={"万":"萬","与":"與","专":"專","业":"業","东":"東","两":"兩","严":"嚴","个":"個","临":"臨","义":"義","为":"為","么":"麼","乐":"樂","书":"書","买":"買","于":"於","亏":"虧","亚":"亞","产":"產","亲":"親","仅":"僅","从":"從","们":"們","价":"價","优":"優","会":"會","体":"體","倾":"傾","储":"儲","儿":"兒","兑":"兌","关":"關","内":"內","册":"冊","写":"寫","农":"農","冲":"衝","决":"決","况":"況","净":"淨","减":"減","几":"幾","凭":"憑","击":"擊","则":"則","创":"創","别":"別","剥":"剝","办":"辦","务":"務","动":"動","劳":"勞","势":"勢","区":"區","医":"醫","单":"單","卖":"賣","占":"佔","厂":"廠","历":"歷","厦":"廈","参":"參","双":"雙","发":"發","变":"變","叠":"疊","号":"號","后":"後","吗":"嗎","员":"員","响":"響","唤":"喚","围":"圍","国":"國","图":"圖","圣":"聖","场":"場","处":"處","复":"復","够":"夠","头":"頭","夺":"奪","学":"學","宁":"寧","实":"實","审":"審","宾":"賓","对":"對","导":"導","层":"層","属":"屬","岗":"崗","岛":"島","币":"幣","师":"師","带":"帶","帮":"幫","幂":"冪","干":"乾","并":"並","广":"廣","庆":"慶","库":"庫","应":"應","废":"廢","开":"開","异":"異","张":"張","弹":"彈","归":"歸","当":"當","录":"錄","征":"徵","径":"徑","态":"態","总":"總","恒":"恆","户":"戶","执":"執","报":"報","拟":"擬","拦":"攔","择":"擇","挂":"掛","损":"損","换":"換","据":"據","携":"攜","摊":"攤","撑":"撐","数":"數","断":"斷","无":"無","时":"時","显":"顯","暂":"暫","术":"術","机":"機","杂":"雜","权":"權","条":"條","来":"來","极":"極","构":"構","标":"標","样":"樣","档":"檔","检":"檢","楼":"樓","毕":"畢","气":"氣","汇":"匯","沉":"沈","没":"沒","测":"測","浏":"瀏","涨":"漲","渗":"滲","温":"溫","湾":"灣","满":"滿","灵":"靈","点":"點","热":"熱","状":"狀","独":"獨","环":"環","现":"現","电":"電","畅":"暢","盖":"蓋","盘":"盤","着":"著","码":"碼","确":"確","礼":"禮","视":"視","离":"離","种":"種","积":"積","称":"稱","笔":"筆","筛":"篩","签":"簽","简":"簡","类":"類","约":"約","级":"級","紧":"緊","纸":"紙","线":"線","组":"組","细":"細","终":"終","经":"經","结":"結","给":"給","绝":"絕","统":"統","绩":"績","绪":"緒","续":"續","维":"維","编":"編","网":"網","职":"職","联":"聯","脱":"脫","舍":"捨","节":"節","范":"範","荣":"榮","药":"藥","营":"營","虚":"虛","蚕":"蠶","补":"補","装":"裝","见":"見","观":"觀","规":"規","览":"覽","触":"觸","计":"計","订":"訂","认":"認","让":"讓","议":"議","记":"記","论":"論","设":"設","访":"訪","证":"證","识":"識","诉":"訴","诊":"診","词":"詞","试":"試","话":"話","诞":"誕","该":"該","详":"詳","误":"誤","说":"說","请":"請","诺":"諾","读":"讀","课":"課","谁":"誰","调":"調","谈":"談","负":"負","贡":"貢","财":"財","责":"責","败":"敗","账":"賬","购":"購","费":"費","资":"資","赚":"賺","赠":"贈","趋":"趨","跃":"躍","转":"轉","轮":"輪","轻":"輕","载":"載","较":"較","辅":"輔","辑":"輯","输":"輸","达":"達","过":"過","运":"運","还":"還","这":"這","进":"進","远":"遠","连":"連","适":"適","选":"選","逻":"邏","邮":"郵","邻":"鄰","采":"採","钱":"錢","钻":"鑽","铁":"鐵","铜":"銅","银":"銀","铺":"鋪","链":"鏈","销":"銷","错":"錯","锣":"鑼","键":"鍵","镜":"鏡","长":"長","门":"門","闪":"閃","闭":"閉","问":"問","间":"間","闸":"閘","阁":"閣","阅":"閱","队":"隊","际":"際","随":"隨","难":"難","页":"頁","顶":"頂","项":"項","须":"須","顾":"顧","顿":"頓","预":"預","领":"領","频":"頻","题":"題","额":"額","饮":"飲","饼":"餅","馆":"館","馈":"饋","验":"驗","骤":"驟","鲜":"鮮","鸟":"鳥","鸯":"鴦","鸳":"鴛","黄":"黃","齐":"齊","龙":"龍"};

Object.assign(englishTerms,{'一、活动表现与比较':'1. Campaign performance and comparisons','二、下一步':'2. Next steps','核对异常时段、同期活动与数据覆盖，并记录后续行动。':'Review unusual periods, concurrent campaigns and data coverage, then record follow-up actions.','根据报告素材生成可编辑的复盘段落。':'Draft editable review paragraphs from your report materials.','追加到正文':'Append to report'});
Object.assign(englishTerms,{
 '比较活动门店与对照门店的前后变化。当前 ':'Compare before/after changes in campaign and control stores. Currently ',
 ' 场具备计算条件。':' campaigns have sufficient data for calculation.',
 '投放前校正开始、结束日期。':'Correct start and end dates before launch.',
 '维护参与门店编号并冻结名单。':'Maintain store IDs and freeze the participating-store list.',
 '投放前随机分配合资格会员，确定留出比例并冻结分组，不能事后把未购买者当作对照组。':'Randomize eligible members before launch, set the holdout ratio and freeze assignments. Non-buyers must not be selected as controls after the event.',
 '需活动编号、会员编号、处理/留出标签、随机分配时间、计划分配比例，以及两组全部成员的前后交易；保留没有购买的会员。':'Provide campaign and member IDs, treatment/holdout assignment, assignment time, planned allocation and before/after transactions for all assigned members, including non-buyers.',
 '接入明细后需检查实际分配比例、触达串组、数据缺失、样本量与预设观察窗口。当前不能输出会员实验结果。':'After connecting assignments, check allocation ratios, contamination, missing data, sample size and the planned observation window. Member experiment results are currently unavailable.',
 '投放前确定不参与活动的对照门店，保存名单并核对店型、地区、基线销售和同期促销。':'Select non-participating control stores before launch. Save assignments and review store types, regions, baseline sales and concurrent promotions.',
 '至少需要多家独立门店才能检查门店间波动；应在上线前做样本量规划。':'Multiple independent stores are needed to assess between-store variation. Plan sample size before launch.',
 '原始门店名单有组间重叠，已剔除重叠对照；需复核分组。':'The original groups overlap. Overlapping controls were excluded; review assignments.',
 '两组店型构成不同：':'Store-type composition differs: ',
 '。需复核匹配，当前不自动调整门店或宣称可比。':'. Review matching. Stores are not automatically reselected or declared comparable.',
 '需要活动前 ':'Requires ',
 ' 天与完整活动期数据；数据截至 ':' baseline days and the full campaign window. Data ends on ',
 '，不把未来日期补成零。':'; future dates are not filled with zeros.',
 '探索性门店估计，不等同于会员随机实验，也不自动证明活动因果效果。前期差值漂移仅为描述性诊断，不是平行趋势成立的统计证明。':'Exploratory store estimate, not a randomized member experiment or automatic proof of causality. Pre-period gap drift is descriptive and does not statistically establish parallel trends.',
 '重要活动增量评估准备清单':'Incrementality preparation checklist',
 '评估方法':'Assessment method',
 '状态':'Status',
 '待选择':'Not selected',
 '请先运行前趋势诊断，并完成复核确认。':'Run pre-trend diagnostics and complete the review first.'
});
const rawUiText=new WeakMap();
const rawUiAttributes=new WeakMap();
const localizedAttributes=['title','placeholder','aria-label','alt','data-metric-help','data-overview-tip','data-scratch-tip'];
const sourceNames=new Set();
const sourceData=window.MOCK;
for(const activity of sourceData.activity_summaries)sourceNames.add(activity.name);


const quotePattern=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const englishPattern=new RegExp([...new Set([...sourceNames,...Object.keys(englishTerms)])]
  .sort((a,b)=>b.length-a.length).map(key=>key.length===1?'(?<![\\u3400-\\u9fff])'+quotePattern(key)+'(?![\\u3400-\\u9fff])':quotePattern(key)).join('|'),'g');
const originalNamesPattern=new RegExp([...sourceNames].sort((a,b)=>b.length-a.length).map(quotePattern).join('|'),'g');

function displayDateRange(from,to){
  const start=from.slice(0,10),end=to.slice(0,10);
  const full=value=>value.replaceAll('-','/');
  if(start===end)return full(start);
  return full(start)+'–'+full(start.slice(0,4)===end.slice(0,4)?end.slice(5):end);
}

function normalizeDateRanges(text){
  if(typeof text!=='string')return text;
  return text.replace(/(\d{4}[-/]\d{2}[-/]\d{2})\s*(?:至|—|–| to )\s*(\d{4}[-/]\d{2}[-/]\d{2})/g,
    (_,a,b)=>displayDateRange(a.replaceAll('/','-'),b.replaceAll('/','-')));
}

function localize(text){
  text=normalizeDateRanges(text);
  if(typeof text!=='string'||uiLanguage==='zh-CN'||!/[\u3400-\u9fff]/.test(text))return text;
  if(uiLanguage==='en'){
    text=text.replace(/第\s*(\d+)\s*天/g,'Day $1')
      .replace(/(\d+)\s*日(?=$|\s)/g,'Day $1')
      .replace(/各自前\s*(\d+)\s*天/g,'first $1 days of each campaign')
      .replace(/两场活动覆盖\s*(\d+)\s*\/\s*(\d+)\s*家门店，观察\s*(\d+)\s*\/\s*(\d+)\s*天；营收和订单按店日标准化后比较。/g,'The campaigns cover $1 / $2 stores over $3 / $4 days. Revenue and orders are normalized per store-day.')
      .replace(/(高于|低于)基准\s*([\d,.]+)（([\d.]+%)）/g,(_,direction,value,rate)=>value+' ('+rate+') '+(direction==='高于'?'above':'below')+' baseline');
    return text.replace(englishPattern,key=>sourceNames.has(key)?key:englishTerms[key])
      .replace(/，/g,', ').replace(/；/g,'; ').replace(/。/g,'.').replace(/（/g,' (').replace(/）/g,')').replace(/：/g,': ');
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
    state.output=uiLanguage==='en'&&root.parentElement?.matches('.calendar-day-label')?({一:'M',二:'T',三:'W',四:'T',五:'F',六:'S',日:'S'}[state.source.trim()]||localize(state.source)):localize(state.source);
    rawUiText.set(root,state);
    if(root.nodeValue!==state.output)root.nodeValue=state.output;
    return;
  }
  if(root.nodeType!==Node.ELEMENT_NODE||root.matches('script,style,[contenteditable],#login-language'))return;
  if(root.tagName==='INPUT'&&(root.type==='month'||root.dataset.localeMonth)){
    root.dataset.localeMonth='true';root.type=uiLanguage==='en'?'text':'month';
    if(uiLanguage==='en'){if(root.placeholder!=='YYYY-MM')root.placeholder='YYYY-MM';root.pattern='[0-9]{4}-(0[1-9]|1[0-2])';root.setAttribute('inputmode','numeric')}else{root.removeAttribute('pattern');root.removeAttribute('inputmode')}
  }
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
