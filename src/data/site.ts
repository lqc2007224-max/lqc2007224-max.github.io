import { slugify } from "../utils/slug";

export const profile = {
  name: "Chu Luo",
  greetingName: "褚落",
  handle: "Research Portfolio",
  role: "让项目有迹可循，让思考有处安放",
  location: "China",
  email: "chuluo.ai@gmail.com",
  bio:
    "我是一名高度关注 AI 的实践者，并且更偏向用实践理解技术：做项目、搭产品、读论文、记录想法。这个站点会整理我做过的作品、学习过的内容，以及一些还没有完全成型的思考。如果你对某个方向感兴趣，欢迎评论或私聊，也同样欢迎 AI 领域的朋友一起交流合作和探索。",
  currentFocus: ["智慧养老 AI 系统", "ESP-Drone 上位机", "视频隐私脱敏", "AI 生图文字研究"],
  socials: [
    { label: "GitHub", value: "lqc2007224-max", href: "https://github.com/lqc2007224-max" },
    {
      label: "Douyin",
      value: "抖音主页",
      href: "https://www.douyin.com/user/MS4wLjABAAAAaB7stddnMxjCAhoMq3YG4ECnlBcpulvzdcyWw1ff3qVUz4RNpCv5f6J2hu_JLY18?from_tab_name=main",
    },
    { label: "QQ", value: "305835781", href: "tencent://AddContact/?fromId=45&fromSubId=1&subcmd=all&uin=305835781" },
    { label: "WeChat", value: "扫码添加微信", href: "#wechat-qr" },
  ],
  contactQrs: [
    { label: "QQ", caption: "扫码添加 QQ", src: "/assets/contact/qq-qr.jpg", copy: "305835781" },
    { label: "WeChat", caption: "扫码添加微信", src: "/assets/contact/wechat-qr.jpg", copy: "扫码添加微信" },
  ],
};

export const navItems = [
  { label: "首页", href: "/" },
  { label: "博客", href: "/blog/", match: ["/blog/", "/papers/", "/notes/"] },
  { label: "关于", href: "/about/", match: ["/about/", "/projects/", "/timeline/"] },
  { label: "联系", href: "/contact/" },
  { label: "私有库", href: "/private/" },
];

export const stats = [
  { label: "项目档案", value: "02" },
  { label: "论文/研究", value: "06" },
  { label: "竞赛方向", value: "04" },
  { label: "已收录内容", value: "21" },
];

const allProjects = [
  {
    title: "多模态 AI 老年人关怀系统",
    status: "进行中",
    year: "2026",
    tags: ["Python", "FastAPI", "SQLite", "Edge AI"],
    summary:
      "基于挑战杯揭榜挂帅 XH-202617 赛题，整理居家养老里的跌倒风险、心理健康和诈骗识别三条线，目标是做出一套能预判、能识别、能分级预警的系统。",
    problem: "养老安全不应该只在跌倒之后报警。更难的是把传感器、视频、行为变化和预警链路接起来，让风险在发生前就被看见。",
    contribution: "我负责把萤石开放平台、边缘端采集、Python 后端和 AI 模型工程化拆成可执行任务，并沉淀接口、数据结构和部署思路。",
    evidence: "Obsidian 已整理赛题总览、萤石平台分析、总体系统架构、边缘端方案、云端方案、云边协同和个人分工分析。",
    next: "把萤石真实接口、硬件清单和演示数据补齐，形成可以跑通的最小闭环：采集、识别、告警、记录。",
    origin: "Obsidian: 03-Project/elderly-care-ai",
    highlights: ["XH-202617", "前置预判", "云边协同", "适老化闭环"],
    metrics: [
      { label: "研究维度", value: "3 条" },
      { label: "架构层级", value: "边缘/云端/用户" },
      { label: "提交要求", value: "报告 + 代码 + 部署" },
    ],
    caseSections: [
      {
        kicker: "赛题",
        title: "从事后响应转向事前预判",
        body:
          "原始笔记把赛题拆成三条主线：跌倒风险、心理健康、诈骗识别。它们不是三个孤立功能，而是同一个居家安全问题的不同入口。系统要做到前置预判、过程识别和分级预警，而不只是检测到事故后推送一条消息。",
        points: ["跌倒风险：步态、环境、生理指标融合", "心理健康：连续感知和行为变化追踪", "诈骗识别：陌生人接触、电话/网络风险、多维干预"],
      },
      {
        kicker: "架构",
        title: "边缘端负责现场，云端负责长期判断",
        body:
          "总体架构采用用户层、云端、边缘端三级结构。树莓派侧接入毫米波雷达、激光雷达、摄像头、麦克风等设备，完成预处理、本地 AI 推理和低功耗策略；云端负责时序数据、深度分析、知识图谱、萤石平台对接和预警服务。",
        points: ["边缘端：传感器驱动、数据预处理、本地推理、能效管理", "云端：数据存储、知识图谱、设备管理、预警推送", "用户层：家属 App、社区管理端、医疗机构端、老人端"],
      },
      {
        kicker: "平台",
        title: "萤石不是装饰，而是项目的硬约束",
        body:
          "赛题要求基于萤石开放平台开发。笔记中已经把设备管理、视频服务、AI 算法、消息推送、云存储和智慧居家养老看护套件列为重点调研对象。后续要确认开放平台能否接入自定义模型、能否本地获取设备数据，以及 API 权限和 QPS 限制。",
        points: ["重点关注居家养老看护套件", "确认已有跌倒检测能力和接口边界", "处理数据隐私和本地处理支持程度"],
      },
    ],
    sourceNotes: ["000-主页-赛题总览.md", "004-萤石平台分析.md", "010-系统架构设计.md", "023-个人分工分析-Python后端.md"],
    openQuestions: ["萤石硬件清单和开放接口权限", "本地模型是否能稳定接入", "误报后的家属/社区/医疗分级处理流程"],
    href: "/projects/#elderly-care-ai",
  },
  {
    title: "基于码流运动矢量的视频隐私快速脱敏",
    status: "研究中",
    year: "2026",
    tags: ["Computer Vision", "Privacy", "Video Coding"],
    summary:
      "围绕视频隐私保护，尝试直接利用 H.264/H.265 压缩码流中的运动矢量传播隐私掩膜，减少逐帧检测、全解码和像素域光流带来的算力开销。",
    problem: "公共监控、车载影像、会议直播都需要隐私遮挡，但逐帧 AI 检测和深度光流太重，规模化部署会被算力、功耗和成本卡住。",
    contribution: "我把方案拆成关键帧检测、非关键帧 MV 传播、场景分类、仿射补偿、边界修正和自适应重检测，整理成专利交底书结构。",
    evidence: "Obsidian 中已有完整专利交底书，包含现有技术缺陷、系统架构、模块流程、权利要求和实验指标思路。",
    next: "补一个小型实验：同一段视频对比逐帧检测、传统跟踪和 MV 掩膜传播的速度、遮挡稳定性和误差累积。",
    origin: "Obsidian: 03-Project/专利1-视频隐私脱敏",
    highlights: ["Motion Vector", "Privacy Mask", "H.264/H.265", "低算力脱敏"],
    metrics: [
      { label: "应用场景", value: "5 类" },
      { label: "核心分支", value: "I 帧 / P/B 帧" },
      { label: "目标", value: "低解码开销" },
    ],
    caseSections: [
      {
        kicker: "背景",
        title: "隐私遮挡的问题不在能不能做，而在能不能实时做",
        body:
          "逐帧检测能得到较准的 Mask，但 1080p@30fps 意味着每秒 30 次推理；关键帧检测加传统跟踪仍需要解码到像素域；深度光流本身也很重。这些路线在单路演示里可行，放到多路视频就会变成成本问题。",
        points: ["安防监控：人脸、车牌实时脱敏", "车载影像：行人面部和车牌遮挡", "会议/直播：背景人物和屏幕敏感信息保护"],
      },
      {
        kicker: "方法",
        title: "把编码器已经算过的运动矢量用起来",
        body:
          "方案将视频帧分为关键帧和非关键帧。关键帧执行完整 AI 检测生成隐私 Mask；P/B 帧不再重复完整推理，而是从压缩码流里提取运动矢量场，用它传播上一帧 Mask，再结合残差能量、块类型和场景分类修正边界。",
        points: ["码流解析：NAL、帧类型、SPS/PPS", "MV 提取：仅熵解码，不做完整像素重建", "Mask 传播：加权仿射拟合 + 时域平滑"],
      },
      {
        kicker: "质量",
        title: "不能只追速度，还要有重检测闭环",
        body:
          "运动矢量会有噪声，目标遮挡或快速形变会让误差累积。因此笔记里专门设计了场景分类、置信度图、边界修正和自适应触发关键帧检测，让系统在速度和遮挡质量之间保持可控。",
        points: ["静态场景、全局运动场景、屏幕录制场景分别处理", "用残差能量和局部一致性估计 MV 可信度", "误差超过阈值时重新触发关键帧检测"],
      },
    ],
    sourceNotes: ["专利交底书_视频隐私脱敏.md"],
    openQuestions: ["MV 传播在小目标上的边界稳定性", "与 ByteTrack/光流方案的速度和质量对比", "真实码流解析工具链的落地选择"],
    href: "/projects/#video-privacy",
  },
  {
    title: "ESP-Drone 上位机学习与架构拆解",
    status: "学习中",
    year: "2026",
    tags: ["Python", "PyQt6", "cflib", "ZMQ"],
    summary:
      "围绕 esp-drone/crazyflie 上位机代码，按启动流程、MainUI、连接、Tab 插件、输入设备、参数日志、通信和 ZMQ 桥接做两周拆解。",
    problem: "开源上位机能跑起来不等于能改。真正要复用它，必须知道窗口、连接状态、插件系统和通信链路各自在哪里。",
    contribution: "我把 14 天学习路线拆到每天要读的文件、要画的流程图和要动手改的小功能，避免只停留在看代码。",
    evidence: "Obsidian 已有 000 索引、两周学习计划、主窗口、连接流程、Tab 插件、输入设备、参数系统、日志系统、ZMQ 桥接等笔记。",
    next: "将学习路线落实成一张上位机架构图，并做一个最小控制面板 Demo 来验证理解。",
    origin: "Obsidian: 03-Project/espdrone-study",
    highlights: ["14 天路线", "MainUI", "TabToolbox", "ZMQ"],
    metrics: [
      { label: "计划周期", value: "14 天" },
      { label: "每日投入", value: "4-6 h" },
      { label: "目标", value: "能改上位机" },
    ],
    caseSections: [
      {
        kicker: "路线",
        title: "先把入口和窗口摸清楚",
        body:
          "第一周从环境搭建、启动流程、MainUI 主窗口、连接/断开、Tab 插件和输入设备开始。每天不是泛读，而是跟踪调用链、画流程图、记录关键文件，再动手改一个小点验证。",
        points: ["Day 1: setup.py、README、gui.py", "Day 2: cfclient -> gui.main() -> MainUI.__init__()", "Day 5: TabToolbox、tabs 注册和 QDockWidget/QTabWidget"],
      },
      {
        kicker: "通信",
        title: "第二周进入参数、日志和链路",
        body:
          "后半程集中在 ParamTab、LogTab、CRTP 通信、ZMQ 桥接和配置系统。这个顺序符合上位机真正的工作方式：先理解 UI 壳，再理解如何读写飞控状态和发送控制命令。",
        points: ["参数系统：TOC、ParamBlockModel、读写回调", "输入设备：Reader -> Interface -> Mux -> commander", "ZMQ：为远程控制和外部程序接入留接口"],
      },
    ],
    sourceNotes: ["000-主页-索引.md", "002-两周学习计划.md", "005-主窗口MainUI.md", "013-ZMQ桥接.md"],
    openQuestions: ["ESP-Drone fork 与 Crazyflie 原版差异", "可视化控制面板的最小功能范围", "如何把笔记转成可复用代码注释/架构图"],
    href: "/projects/#esp-drone",
  },
  {
    title: "GPT Image 2 中文文字渲染研究",
    status: "研究稿",
    year: "2026",
    tags: ["Deep Research", "Image Generation", "Chinese Text"],
    summary:
      "研究 AI 生图汉字乱码为什么会发生，以及 GPT Image 2 可能通过自回归范式把文字从被“画出来”变成被“写出来”。",
    problem: "AI 图像模型能生成漂亮画面，却经常在中文文字、标注图和科学插图中失败。问题不是单纯画得差，而是离散符号进入连续像素生成后的系统性失真。",
    contribution: "我用多源文献检索、claims 抽取和对抗性交叉验证整理技术脉络，形成论文稿、技术图和关键参考线索。",
    evidence: "Obsidian 中有研究总览、研究过程、三层根因、架构范式转换、FEPBench、AnyText、GlyphDraw、完整论文稿等材料。",
    next: "把完整论文拆成几篇更适合公开阅读的文章：根因篇、论文脉络篇、GPT Image 2 篇和评测局限篇。",
    origin: "Obsidian: 03-Project/gpt-image2-chinese-text",
    highlights: ["90 claims", "25 个验证", "FEPBench", "自回归范式"],
    metrics: [
      { label: "arXiv 论文", value: "6 篇" },
      { label: "媒体/评测", value: "14 篇" },
      { label: "验证通过", value: "7 / 25" },
    ],
    caseSections: [
      {
        kicker: "问题",
        title: "汉字乱码不是小 bug",
        body:
          "研究把问题拆成 Tokenization、视觉语言对齐、扩散生成和训练数据偏差的协同结果。中文字符数量多、字形细节密集，扩散模型在连续像素空间里很难稳定落到正确字形。",
        points: ["BPE 会破坏字形级信息", "CLIP embedding 会把文字压成模糊语义", "扩散模型更擅长纹理，不擅长离散字符选择"],
      },
      {
        kicker: "方法",
        title: "从 90 个 claims 收敛到可相信的结论",
        body:
          "研究流程不是把网上观点拼起来，而是先按五个角度检索，再抓取来源、抽取 claims、交给三个独立验证视角投票。没有证据支撑的说法不直接写成结论。",
        points: ["五角度检索：根因、方案、脉络、横评、局限", "25 个 claims 进入对抗验证", "被否决不等于错误，而是证据不足"],
      },
    ],
    sourceNotes: ["GPT Image 2 汉字乱码研究.md", "研究过程.md", "论文-FEPBench.md", "论文全文-GPT-Image-2如何终结AI生图汉字乱码.md"],
    openQuestions: ["GPT Image 2 官方技术论文何时发布", "中文密集标注图是否需要独立 benchmark", "自回归图像生成在长文本场景里的成本上限"],
    href: "/projects/#gpt-image-text",
  },
  {
    title: "个人知识博客系统",
    status: "迭代中",
    year: "2026",
    tags: ["Astro", "Markdown", "Portfolio"],
    summary:
      "把公开作品集、论文笔记、学习记录、联系入口和音乐播放器整合到一个可以长期维护的个人站点，同时保留私有成长记录的边界。",
    problem: "项目、论文、笔记和个人经历如果散在不同软件里，很难展示，也很难长期回看。",
    contribution: "我搭建 Astro 静态站，整理数据结构、页面导航、动态首页、音乐播放器、联系页和可点击的项目/论文/笔记详情页。",
    evidence: "当前站点已经能本地预览，项目、论文、笔记、联系、音乐和私有库入口都已成型。",
    next: "继续接入真实 Markdown 内容流、线上评论系统、域名部署和更稳定的内容发布流程。",
    origin: "Local: personal-blog-studio",
    highlights: ["Astro", "静态站", "音乐播放器", "作品集"],
    metrics: [
      { label: "页面类型", value: "7+" },
      { label: "内容来源", value: "Obsidian" },
      { label: "部署方式", value: "静态托管" },
    ],
    caseSections: [
      {
        kicker: "定位",
        title: "这个站点不是简历，而是持续更新的工作台",
        body:
          "首页负责建立个人识别；项目页展示做过什么和怎么做；论文页沉淀阅读判断；笔记页保留学习过程；联系页让别人能找到你。私有成长内容不直接公开，只保留入口和边界提醒。",
        points: ["公开内容强调项目、论文、学习记录", "私密经历不直接暴露到静态页面", "联系入口以复制和跳转为主"],
      },
    ],
    sourceNotes: ["src/data/site.ts", "src/pages/*.astro", "src/styles/global.css"],
    openQuestions: ["域名和托管平台选择", "真实评论系统接入方式", "Obsidian 到网站的自动发布流程"],
    href: "/projects/#personal-blog",
  },
];

export const projects = [] as typeof allProjects;

const allPapers = [
  {
    title: "FEPBench 与科学插图文本忠实度评测",
    venue: "Research Note",
    year: "2026",
    status: "已收录",
    tags: ["Benchmark", "Text Fidelity", "Evaluation"],
    takeaway:
      "FEPBench 把 AI 生图文字能力放到 Nature 级科学插图里考，提醒我：通用海报文字变好，不代表密集标注、箭头和术语都已经可靠。",
    question: "图像生成模型怎样在复杂科学插图中同时保持文字、箭头、布局和语义一致？",
    method: "围绕 IF_t、IF_v、IF_r 三个指标整理评测框架，并把它作为 GPT Image 2 研究中的证据层。",
    thought: "它的价值在于把“看起来不错”变成可讨论的指标；局限在于测试对象是英文科学插图，不能直接等同中文汉字渲染。",
    source: "Obsidian: 03-Project/gpt-image2-chinese-text/论文-FEPBench.md",
    coreClaim: "即使 GPT Image 2 在 FEPBench 上领先，IF_t 也只有 0.389，说明科学插图里的文字忠实度仍是硬问题。",
    readings: [
      {
        title: "它评什么",
        body: "FEPBench 关注视觉科学图生成里的 instruction following，不只看画面美观，还看文字、布局、标注和推理是否跟指令一致。",
        bullets: ["IF_t: 文字内容准确率", "IF_v: 视觉质量", "IF_r: 推理丰富度"],
      },
      {
        title: "它给我的提醒",
        body: "GPT Image 2 在三项指标上都领先，但 IF_t=0.389 仍然很低。这说明当前模型视觉质量提升很快，文字忠实度却仍然是瓶颈。",
        bullets: ["不要把通用场景 99% 宣传当成所有场景结论", "科学插图是文字、布局和推理的综合测试", "中文密集标注图还需要单独基准"],
      },
    ],
    references: ["arXiv:2606.05949v2", "术语-FEPBench.md", "核心发现-数据与评测.md"],
  },
  {
    title: "DALL-E 2 / Parti / AnyText / GlyphDraw 技术脉络",
    venue: "Literature Thread",
    year: "2026",
    status: "脉络整理",
    tags: ["Diffusion", "Tokenizer", "OCR"],
    takeaway:
      "文字渲染问题经历了从发现缺陷、改 tokenizer、注入 OCR、字符级建模到自回归范式的演进；每条路线都解决一部分，也留下自己的边界。",
    question: "文字渲染失败到底来自扩散模型、文本编码、训练数据，还是视觉语言对齐方式？",
    method: "按论文时间线和技术路线拆解：DALL-E 2 自我诊断、Parti 验证 tokenizer、GlyphDraw 关注中文、AnyText 尝试 OCR 注入。",
    thought: "这条脉络适合写成一篇面向初学者的文章：为什么“乱码”不是简单修一个字体库就能解决。",
    source: "Obsidian: 03-Project/gpt-image2-chinese-text",
    coreClaim: "扩散框架内的补丁能改善局部场景，但难以从根上解决离散文字和连续像素生成之间的冲突。",
    readings: [
      {
        title: "旧范式的共同难点",
        body: "Prompt 经 tokenizer 和文本编码器后变成连续 embedding，再由扩散模型在像素空间迭代去噪。文字在这个链路里很容易被当作纹理，而不是离散字符。",
        bullets: ["BPE 会拆碎字符信息", "CLIP/T5 压缩后难保留字形细节", "扩散模型不擅长精确选择某一个汉字"],
      },
    ],
    references: ["论文-DALL-E 2.md", "论文-Parti.md", "论文-AnyText.md", "论文-GlyphDraw.md"],
  },
  {
    title: "老年人跌倒风险、心理健康与诈骗识别方向调研",
    venue: "Project Research",
    year: "2026",
    status: "项目调研",
    tags: ["Elderly Care", "Sensor Fusion", "Edge AI"],
    takeaway:
      "智慧养老项目不能只堆模型名。真正要落地，需要把设备能力、风险识别、家属通知、社区响应和长期记录连成闭环。",
    question: "养老场景里哪些 AI 能真正提升安全性，而不是只停留在展示层？",
    method: "从跌倒风险、心理健康、诈骗识别三条线出发，结合萤石开放平台和边缘端传感器能力筛选方案。",
    thought: "项目价值不只在模型准确率，还在误报处理、隐私边界、家属沟通和可持续记录。",
    source: "Obsidian: 03-Project/elderly-care-ai",
    coreClaim: "养老 AI 的难点是系统闭环，不是单个识别模型。",
    readings: [
      {
        title: "三条线不是并列功能",
        body: "跌倒、心理健康和诈骗识别都服务同一个目标：让风险在变严重之前被发现，并把合适的人拉进处理链路。",
        bullets: ["跌倒风险需要前置预判", "心理健康需要连续观察", "诈骗识别需要事前干预"],
      },
    ],
    references: ["000-主页-赛题总览.md", "004-萤石平台分析.md", "010-系统架构设计.md"],
  },
  {
    title: "视频压缩域隐私脱敏方案研究",
    venue: "Patent / Technical Research",
    year: "2026",
    status: "技术研究",
    tags: ["Motion Vector", "H.264/H.265", "Privacy Mask"],
    takeaway:
      "压缩码流里的运动矢量本来就是编码器为预测而计算的运动线索，如果能用它传播隐私掩膜，就可能显著降低视频脱敏成本。",
    question: "能不能利用压缩码流里的已有信息，降低视频隐私处理的实时成本？",
    method: "梳理逐帧 AI 检测、关键帧跟踪、像素域光流和压缩域方案的缺陷，再设计 MV 传播、边界修正和重检测闭环。",
    thought: "这条路线的关键是实验，必须同时证明速度优势和遮挡质量，而不是只在专利文字里成立。",
    source: "Obsidian: 03-Project/专利1-视频隐私脱敏/专利交底书_视频隐私脱敏.md",
    coreClaim: "MV 传播可以把隐私 Mask 从关键帧延伸到非关键帧，但需要置信度、场景分类和重检测机制控制误差。",
    readings: [
      {
        title: "为什么不用逐帧检测",
        body: "逐帧检测准确但昂贵，多路视频部署时会被 GPU、功耗和成本卡住。传统跟踪和光流方案也往往需要完整解码到像素域。",
        bullets: ["1080p@30fps 单路视频即每秒 30 次推理", "像素域光流本身也是深度推理", "Mask 抖动和 ID Switch 会影响隐私遮挡质量"],
      },
    ],
    references: ["专利交底书_视频隐私脱敏.md"],
  },
];

const allNotes = [
  {
    title: "ESP-Drone 两周学习路线",
    type: "学习计划",
    date: "2026-06-19",
    summary: "从 Python 基础到 PyQt6、MainUI、Tab 插件、通信层和 ZMQ 桥接的系统化拆解。",
    status: "已收录",
    action: "补模块图",
    source: "Obsidian: 03-Project/espdrone-study/002-两周学习计划.md",
    lead:
      "这不是一份“看完就算学过”的路线，而是每天都要读代码、画流程、写笔记、动手改一点东西的训练计划。",
    sections: [
      {
        title: "第一周：把上位机壳子摸清楚",
        body: "先跑起来，再沿着 cfclient -> gui.main() -> MainUI.__init__() 跟启动链路。随后看连接状态机、Tab 插件系统和输入设备，让 GUI 不是黑箱。",
        items: ["Day 1 环境搭建与项目总览", "Day 2 启动流程深入", "Day 3 MainUI 主窗口", "Day 4 连接/断开流程", "Day 5 Tab 插件系统"],
      },
      {
        title: "第二周：进入通信与功能模块",
        body: "参数、日志、CRTP、ZMQ、配置系统是上位机真正跟飞控发生关系的地方。第二周的重点是弄清数据如何被读取、展示和发送。",
        items: ["ParamTab 与参数 TOC", "JoystickReader 到 commander 的控制链", "ZMQ 远程控制接口", "配置和日志如何落盘"],
      },
    ],
  },
  {
    title: "智慧养老项目个人工作台",
    type: "项目管理",
    date: "2026-06-20",
    summary: "按萤石平台对接、数据层、AI 工程化三条线组织交付物和周计划。",
    status: "整理中",
    action: "补周报",
    source: "Obsidian: 03-Project/elderly-care-ai",
    lead:
      "这份工作台的作用是把比赛资料变成每天能推进的任务：哪些接口要查，哪些数据要落表，哪些模型要先做最小验证。",
    sections: [
      {
        title: "三条执行线",
        body: "萤石平台决定外部设备和数据入口；数据层决定后续能不能分析；AI 工程化决定演示是否能跑通。",
        items: ["萤石开放平台 API 和硬件清单", "时序数据、事件记录、预警状态表", "边缘端轻量推理和云端深度分析"],
      },
    ],
  },
  {
    title: "AI 生图汉字乱码研究过程",
    type: "研究日志",
    date: "2026-06-29",
    summary: "用多源检索、claims 抽取和对抗性交叉验证整理一条技术解释链。",
    status: "已收录",
    action: "整理成文",
    source: "Obsidian: 03-Project/gpt-image2-chinese-text/研究过程.md",
    lead:
      "这次研究最重要的不是结论本身，而是把资料从“网上说法”筛成“可以写进文章的判断”。",
    sections: [
      {
        title: "研究流程",
        body: "先定义研究问题，再从五个角度检索，抓取 20 个来源，抽取 90 个 claims，最后让 25 个关键 claims 进入对抗验证。",
        items: ["旧模型技术根因", "GPT Image 2 技术方案", "学术研究脉络", "横向对比评测", "怀疑与局限审视"],
      },
    ],
  },
];

export const papers = [] as typeof allPapers;
export const notes = [] as typeof allNotes;

export const timeline = [
  {
    date: "2026",
    title: "建立个人公开作品档案",
    visibility: "公开",
    detail: "搭建个人博客，把项目、论文笔记和学习记录结构化沉淀。",
  },
  {
    date: "2026",
    title: "智慧养老 AI 竞赛项目",
    visibility: "可选择公开",
    detail: "围绕萤石平台、数据层、知识图谱和 AI 工程化承担 Python 后端相关工作。",
  },
  {
    date: "2026",
    title: "视频隐私保护与信息安全竞赛",
    visibility: "可选择公开",
    detail: "整理视频隐私脱敏专利交底书与竞赛作品材料。",
  },
  {
    date: "2026",
    title: "ESP-Drone 上位机学习",
    visibility: "公开",
    detail: "系统拆解 Python + PyQt6 + cflib + ZMQ 的地面站控制软件架构。",
  },
  {
    date: "Private",
    title: "个人成长记录",
    visibility: "仅自己可见",
    detail: "这部分建议放到私有知识库或加登录的 private 子域名。",
  },
];

export const recommendations = [
  "为每个项目写一份复盘：问题、方案、证据、结果、反思。",
  "论文笔记固定模板，避免每次从空白页开始。",
  "公开内容和私密内容分开存储，适合展示的内容再进入网站。",
  "联系页保留邮箱、抖音、QQ、微信二维码和可复制账号。",
  "音乐播放器只放有版权或你自己拥有使用权的音频。",
];

export const searchEntries = [
  ...projects.map((project) => ({
    type: "项目",
    title: project.title,
    summary: project.summary,
    href: `/projects/${slugify(project.title)}/`,
    keywords: [...project.tags, project.status, project.year, project.origin].join(" "),
  })),
  ...papers.map((paper) => ({
    type: "博客 · 论文",
    title: paper.title,
    summary: paper.takeaway,
    href: `/papers/${slugify(paper.title)}/`,
    keywords: [...paper.tags, paper.venue, paper.status, paper.year, paper.source].join(" "),
  })),
  ...notes.map((note) => ({
    type: `博客 · ${note.type}`,
    title: note.title,
    summary: note.summary,
    href: `/notes/${slugify(note.title)}/`,
    keywords: `${note.type} ${note.status} ${note.action} ${note.date} ${note.source}`,
  })),
  ...timeline.map((item) => ({
    type: "成长",
    title: item.title,
    summary: item.detail,
    href: "/about/#timeline",
    keywords: `${item.date} ${item.visibility}`,
  })),
];
