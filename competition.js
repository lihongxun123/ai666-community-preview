document.addEventListener("DOMContentLoaded", () => {
  const page = document.querySelector(".competition-page");
  if (!page) return;

  const params = new URLSearchParams(window.location.search);
  const enums = {
    event: ["draft", "unstarted", "running", "paused", "ended", "not-found"],
    phase: ["preheat", "collecting", "judging", "result-pending", "result"],
    auth: ["guest", "user"],
    registration: ["not-required", "unregistered", "registered"],
    submission: ["new", "draft", "review", "rejected", "public", "down"],
    interaction: ["enabled", "disabled"],
    ranking: ["not-started", "live", "snapshot", "pending-result", "published-result", "empty", "error"],
    track: ["short", "medium", "long", "free"],
    integration: ["pending", "connected", "invalid"],
    work: ["public", "owner-reviewing", "down", "not-found"],
    review: ["0", "1"],
    content: ["loading", "normal", "empty", "error", "not-found"],
    board: ["heat", "result"],
    list: ["ready", "loading", "empty", "error"],
    comments: ["ready", "empty", "error"],
    quota: ["available", "full"],
    view: ["all", "mine"],
    sort: ["heat", "new"],
    format: ["video", "image", "text"],
  };
  const defaults = {
    event: "running",
    phase: "collecting",
    auth: "user",
    registration: "registered",
    submission: "draft",
    interaction: "enabled",
    ranking: "live",
    track: "short",
    integration: "pending",
    work: "public",
    review: "0",
    content: "normal",
    board: "heat",
    list: "ready",
    comments: "ready",
    quota: "available",
    view: "all",
    sort: "heat",
    format: "video",
  };
  const readEnum = (key) => enums[key].includes(params.get(key)) ? params.get(key) : defaults[key];
  const state = Object.fromEntries(Object.keys(defaults).map((key) => [key, readEnum(key)]));
  if (state.content !== "normal") state.list = state.content === "loading" ? "loading" : state.content === "empty" ? "empty" : "error";
  if (state.event === "unstarted") state.phase = "preheat";
  if (state.event === "ended") state.phase = "result";
  if (state.review !== "1") state.integration = "pending";
  if (state.auth === "guest" && state.registration !== "not-required") state.registration = "unregistered";

  const readCompetitionRuleSnapshot = (mode = "published") => {
    const competitionId = params.get("id") || page.dataset.competitionId || "COMP-2026-AIGC-01";
    try {
      const snapshot = JSON.parse(localStorage.getItem(`ai666:competition:${competitionId}:public-rule-${mode}`) || "null");
      return snapshot?.competitionId === competitionId ? snapshot : null;
    } catch {
      return null;
    }
  };

  const competitionSchedule = {
    overall: "2026.08.20 10:00—09.20 23:59",
  };
  const phaseModel = {
    preheat: { index: 0, label: "预热与报名", userLabel: "火热报名中", short: "预热报名", window: "2026.08.20 10:00—08.25 23:59", register: true, submit: false, modify: false, interact: false, result: false },
    collecting: { index: 1, label: "作品征集与热度", userLabel: "作品火热征集中", short: "作品征集", window: "2026.08.26 00:00—09.10 23:59", register: true, submit: true, modify: true, interact: true, result: false },
    judging: { index: 2, label: "专业评审", userLabel: "作品评审中", short: "作品评审", window: "2026.09.11 09:00—09.18 23:59", register: false, submit: false, modify: false, interact: true, result: false },
    "result-pending": { index: 3, label: "结果确认", userLabel: "获奖结果即将公布", short: "结果确认中", window: "2026.09.19 00:00—09.20 09:59", register: false, submit: false, modify: false, interact: false, result: false },
    result: { index: 3, label: "结果公布", userLabel: "获奖结果已公布", short: "结果已公布", window: "2026.09.20 10:00—09.20 23:59", register: false, submit: false, modify: false, interact: true, result: true },
  };
  const tracks = {
    short: { label: "8–30s", title: "瞬间成境", description: "用一个核心画面完成短促而清晰的表达。" },
    medium: { label: "30–90s", title: "未来来信", description: "用完整段落讲述一封来自未来的影像来信。" },
    long: { label: "90s+", title: "世界之外", description: "建立人物、世界与转折，完成一段连续叙事。" },
    free: { label: "自由创作", title: "自由命题", description: "不限制时长主题，展示最具个人辨识度的作品。" },
  };
  const phase = phaseModel[state.phase];
  const eventWritable = state.event === "running";
  const actionState = {
    register: eventWritable && phase.register,
    submit: eventWritable && phase.submit,
    modify: eventWritable && phase.modify,
    interact: eventWritable && phase.interact && state.interaction === "enabled",
    result: (state.event === "ended" || eventWritable) && phase.result,
  };

  const works = [
    { workId: "AIGC-2001", submissionId: "S-001", title: "光之门", author: "空镜", track: "short", format: "video", heat: 9840, score: 89.8, cover: "assets/competition/featured-light-library.png", description: "旅人穿过无尽书库，向光照进来的门扉前行。", createdAt: 9 },
    { workId: "AIGC-2002", submissionId: "S-002", title: "最后的守望", author: "阿青", track: "medium", format: "image", heat: 8920, score: 91.4, cover: "assets/competition/featured-ancient-tree.png", description: "古树与守望者共同等待一场迟来的春天。", createdAt: 8 },
    { workId: "AIGC-2003", submissionId: "S-003", title: "云上有声", author: "司南", track: "free", format: "text", heat: 8560, score: 87.6, cover: "assets/competition/featured-sky-whale-city.png", description: "鲸形飞行器越过城市上空，留下被人听见的回声。", content: "云层之上，城市每天都把一封没有地址的信交给风。直到今天，信封上第一次出现了我的名字。", createdAt: 7 },
    { workId: "AIGC-2004", submissionId: "S-004", title: "人间有味", author: "小野", track: "short", heat: 7910, score: 85.3, cover: "assets/image_assets/7.png", description: "从一顿晚饭看见人与城市之间的温度。", createdAt: 6 },
    { workId: "AIGC-2005", submissionId: "S-005", title: "月面来信", author: "七号", track: "medium", heat: 7420, score: 83.9, cover: "assets/image_assets/9.png", description: "一封跨越月海寄回地球的影像来信。", createdAt: 5 },
    { workId: "AIGC-2006", submissionId: "S-006", title: "不会熄灭的灯", author: "灵感罐头", track: "free", heat: 7080, score: 82.1, cover: "assets/image_assets/11.png", description: "一盏灯在废墟中替所有人保存回家的方向。", createdAt: 4 },
    { workId: "AIGC-2007", submissionId: "S-007", title: "潮汐之后", author: "北岛", track: "long", heat: 6760, score: 80.7, cover: "assets/image_assets/12.png", description: "潮汐退去后，一座城市重新学习与海洋相处。", createdAt: 3 },
    { workId: "AIGC-2008", submissionId: "S-008", title: "像素花园", author: "夏川", track: "short", heat: 6320, score: 79.5, cover: "assets/image_assets/13.png", description: "程序员为旧机器种下一座会呼吸的像素花园。", createdAt: 2 },
    { workId: "AIGC-2009", submissionId: "S-009", title: "末班列车", author: "一零", track: "medium", heat: 5980, score: 77.8, cover: "assets/image_assets/14.png", description: "末班列车穿过无人站台，载着最后一批记忆离开。", createdAt: 1 },
    { workId: "AIGC-2010", submissionId: "S-010", title: "雨停之前", author: "林渡", track: "short", heat: 5710, score: 78.6, cover: "assets/image_assets/4.png", description: "雨停前的三十秒里，城市悄悄交换了颜色。", createdAt: 10 },
    { workId: "AIGC-2011", submissionId: "S-011", title: "纸上星河", author: "向晚", track: "short", heat: 5380, score: 77.4, cover: "assets/image_assets/5.png", description: "纸张折叠成星河，又在掌心缓缓展开。", createdAt: 11 },
    { workId: "AIGC-2012", submissionId: "S-012", title: "风的切片", author: "鹿游", track: "short", heat: 5010, score: 75.8, cover: "assets/image_assets/15.jpg", description: "把看不见的风切成可以收藏的影像。", createdAt: 12 },
    { workId: "AIGC-2013", submissionId: "S-013", title: "深海回信", author: "暮蓝", track: "medium", heat: 5540, score: 81.2, cover: "assets/image_assets/16.png", description: "来自深海站点的回信，记录一场迟到的重逢。", createdAt: 13 },
    { workId: "AIGC-2014", submissionId: "S-014", title: "给明天的你", author: "松子", track: "medium", heat: 5210, score: 79.9, cover: "assets/image_assets/17.png", description: "今天的人把一段普通生活寄给明天。", createdAt: 14 },
    { workId: "AIGC-2015", submissionId: "S-015", title: "零点广播", author: "迟野", track: "medium", heat: 4860, score: 76.8, cover: "assets/image_assets/18.png", description: "零点之后，广播开始播放城市遗失的声音。", createdAt: 15 },
    { workId: "AIGC-2016", submissionId: "S-016", title: "群岛纪事", author: "闻舟", track: "long", heat: 6420, score: 88.6, cover: "assets/image_assets/19.png", description: "一群人在漂移群岛上重新建立彼此的联系。", createdAt: 16 },
    { workId: "AIGC-2017", submissionId: "S-017", title: "记忆修复局", author: "南枝", track: "long", heat: 6090, score: 85.4, cover: "assets/image_assets/20.png", description: "修复师进入陌生人的记忆，寻找缺失的一天。", createdAt: 17 },
    { workId: "AIGC-2018", submissionId: "S-018", title: "迁徙者", author: "原野", track: "long", heat: 5520, score: 82.3, cover: "assets/image_assets/21.png", description: "当城市开始迁徙，人们决定带走哪些共同记忆。", createdAt: 18 },
    { workId: "AIGC-2019", submissionId: "S-019", title: "第七码头", author: "江临", track: "long", heat: 5070, score: 79.7, cover: "assets/image_assets/7.png", description: "第七码头每晚只迎接一艘不存在的船。", createdAt: 19 },
    { workId: "AIGC-2020", submissionId: "S-020", title: "静默之城", author: "周末", track: "long", heat: 4690, score: 76.4, cover: "assets/image_assets/9.png", description: "失去声音的城市，用光重新学会交流。", createdAt: 20 },
    { workId: "AIGC-2021", submissionId: "S-021", title: "梦的博物馆", author: "微尘", track: "free", heat: 6540, score: 86.2, cover: "assets/image_assets/11.png", description: "每件展品都保存着一段没有完成的梦。", createdAt: 21 },
    { workId: "AIGC-2022", submissionId: "S-022", title: "倒生花", author: "秋辞", track: "free", heat: 6170, score: 83.5, cover: "assets/image_assets/12.png", description: "花朵倒着生长，带人回到选择发生之前。", createdAt: 22 },
    { workId: "AIGC-2023", submissionId: "S-023", title: "无重力午后", author: "青禾", track: "free", heat: 5660, score: 80.6, cover: "assets/image_assets/13.png", description: "普通午后忽然失去重力，人们重新认识日常。", createdAt: 23 },
    { workId: "AIGC-2024", submissionId: "S-024", title: "另一个天气", author: "小满", track: "free", heat: 5230, score: 78.2, cover: "assets/image_assets/14.png", description: "一台旧机器每天生成一种不存在的天气。", createdAt: 24 },
  ];

  let toastTimer = 0;
  let lastFocus = null;
  let pendingAction = null;
  let pendingRegistrationAction = null;
  let closeWorkDetailFromUi = null;
  let registrationOutcome = "success";
  let submitOutcome = "success";
  const claimStates = ["publicity", "claim-required", "verification", "pending-delivery", "completed", "appeal-pending"];
  let claimState = claimStates.includes(params.get("claim")) ? params.get("claim") : "publicity";
  const competitionAssistant = {
    title: "联系赛事助手",
    description: "使用微信扫码添加赛事助手，咨询报名、投稿、赛程与申诉问题。",
    service: "服务时间：工作日 10:00—18:00",
    qr: "assets/image_assets/login-qr-v1.png",
  };

  const ensureGlobalUi = () => {
    if (!document.querySelector("[data-competition-toast]")) {
      document.body.insertAdjacentHTML("beforeend", '<div class="competition-toast" data-competition-toast role="status" aria-live="polite" hidden></div>');
    }
    if (!document.querySelector('[data-competition-modal="register"]')) {
      document.body.insertAdjacentHTML("beforeend", `
        <div class="competition-modal" data-competition-modal="register" hidden>
          <section class="competition-modal-card" role="dialog" aria-modal="true" aria-labelledby="register-title">
            <button class="competition-modal-close" type="button" data-competition-modal-close aria-label="关闭"><img src="resources/icons/remixicon/svg/System/close-line.svg" alt=""></button>
            <span class="competition-modal-kicker">报名参赛</span>
            <h2 id="register-title">选择你的首选赛道</h2>
            <p>本届面向持有效社区账号的个人用户，不设年龄与地区限制；完成报名后继续刚才的参赛操作。</p>
            <label class="competition-field"><span>首选赛道</span><select data-registration-track><option value="short">8–30s · 瞬间成境</option><option value="medium">30–90s · 未来来信</option><option value="long">90s+ · 世界之外</option><option value="free">自由创作</option></select></label>
            <label class="competition-check"><input type="checkbox" data-registration-agreement><span>我已阅读并同意<a href="./competition-rules.html" data-competition-link>《赛事规则》</a></span></label>
            <p class="competition-inline-message" data-registration-message aria-live="polite"></p>
            <button class="competition-btn primary full" type="button" data-registration-confirm data-competition-register-confirm>确认报名</button>
          </section>
        </div>`);
    }
    if (!document.querySelector('[data-competition-modal="report"]')) {
      document.body.insertAdjacentHTML("beforeend", `<div class="competition-modal" data-competition-modal="report" hidden><section class="competition-modal-card" role="dialog" aria-modal="true" aria-labelledby="report-title"><button class="competition-modal-close" type="button" data-competition-modal-close aria-label="关闭"><img src="resources/icons/remixicon/svg/System/close-line.svg" alt=""></button><span class="competition-modal-kicker">举报作品</span><h2 id="report-title">请选择举报原因</h2><p>我们会根据社区规范核查，不会向创作者透露举报人信息。</p><label class="competition-field"><span>举报原因</span><select data-report-reason><option value="">请选择</option><option value="illegal">违法或不良内容</option><option value="copyright">疑似侵权或抄袭</option><option value="misleading">虚假或误导信息</option><option value="other">其他问题</option></select></label><p class="competition-inline-message" data-report-message aria-live="polite"></p><button class="competition-btn primary full" type="button" data-report-confirm>提交举报</button></section></div>`);
    }
    if (!document.querySelector('[data-competition-modal="assistant"]')) {
      document.body.insertAdjacentHTML("beforeend", `<div class="competition-modal" data-competition-modal="assistant" hidden><section class="competition-modal-card competition-assistant-modal-card" role="dialog" aria-modal="true" aria-labelledby="competition-assistant-title"><button class="competition-modal-close" type="button" data-competition-modal-close aria-label="关闭"><img src="resources/icons/remixicon/svg/System/close-line.svg" alt=""></button><span class="competition-modal-kicker">微信联系</span><h2 id="competition-assistant-title">${competitionAssistant.title}</h2><p>${competitionAssistant.description}</p><div class="competition-assistant-qr"><img src="${competitionAssistant.qr}" alt="赛事助手微信二维码"></div><small>${competitionAssistant.service}</small></section></div>`);
    }
  };
  ensureGlobalUi();

  const toast = document.querySelector("[data-competition-toast]");
  const showToast = (message, tone = "success") => {
    if (!toast) return;
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
  };
  const setInlineMessage = (node, message = "", tone = "") => {
    if (!node) return;
    node.textContent = message;
    node.dataset.tone = tone;
    node.hidden = !message;
  };
  const openModal = (name) => {
    const modal = document.querySelector(`[data-competition-modal="${name}"]`);
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("competition-modal-open");
    window.requestAnimationFrame(() => modal.querySelector("[data-competition-work-close], input, select, textarea, button")?.focus());
  };
  const closeModal = (modal) => {
    if (!modal) return;
    modal.hidden = true;
    if (!document.querySelector("[data-competition-modal]:not([hidden])")) document.body.classList.remove("competition-modal-open");
    lastFocus?.focus?.();
  };
  const updateUrl = (updates, { replace = true } = {}) => {
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    });
    window.history[replace ? "replaceState" : "pushState"](null, "", url.href);
  };
  const carriedKeys = ["id", ...Object.keys(defaults), "claim", "work_id", "submission_id", "utm_source", "utm_medium", "utm_campaign", "utm_content"];
  const buildHref = (path, overrides = {}) => {
    const url = new URL(path, window.location.href);
    carriedKeys.forEach((key) => {
      const current = key === "claim" ? claimState : key in state ? state[key] : params.get(key);
      if (current && !url.searchParams.has(key)) url.searchParams.set(key, current);
    });
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    });
    return `${url.pathname}${url.search}${url.hash}`;
  };
  const competitionPlatformLinks = [
    { key: "community", label: "社区", href: "./index.html", icon: "resources/icons/remixicon/svg/Buildings/community-line.svg", enabled: false, current: true },
    { key: "manga", label: "漫剧创作", href: "./manga-handoff.html?entry=competition", icon: "resources/icons/remixicon/svg/Media/film-ai-line.svg", enabled: false, current: false },
    { key: "api", label: "API中转", href: "", icon: "resources/icons/remixicon/svg/Development/code-box-line.svg", enabled: false, current: false },
  ];
  const competitionCommunityGroup = {
    enabled: true,
    label: "加入社群",
    title: "加入赛事微信社群",
    description: "扫码加入本届赛事交流群，获取赛程提醒与官方答疑。",
    qr: competitionAssistant.qr,
  };
  const renderCompetitionPlatformNav = () => {
    const isSubmitPage = page.dataset.page === "competition-submit";
    const links = competitionPlatformLinks.filter((item) => item.enabled && item.href).map((item) => `<a href="${item.href}"${item.current ? ' class="is-active" aria-current="location"' : ""}${isSubmitPage ? " data-leave-link" : ""}><img src="${item.icon}" alt=""><span>${item.label}</span></a>`).join("");
    const group = competitionCommunityGroup.enabled && competitionCommunityGroup.qr ? `<span class="competition-community-group" data-competition-community-group-entry><button type="button" aria-haspopup="dialog" aria-expanded="false" data-competition-community-group-trigger><img src="resources/icons/remixicon/svg/Logos/wechat-line.svg" alt=""><span>${competitionCommunityGroup.label}</span></button><span class="competition-community-group-popover" role="dialog" aria-label="${competitionCommunityGroup.title}" data-competition-community-group-popover><strong>${competitionCommunityGroup.title}</strong><img src="${competitionCommunityGroup.qr}" alt="赛事微信社群二维码" data-competition-community-group-qr><small>${competitionCommunityGroup.description}</small></span></span>` : "";
    const markup = `${links}${group}`;
    document.querySelectorAll("[data-competition-platform-nav]").forEach((nav) => { nav.innerHTML = markup; });
    document.querySelectorAll(".competition-site-nav").forEach((nav) => {
      const rankingLink = nav.querySelector("[data-competition-ranking-nav]");
      if (rankingLink) {
        const rankingUnavailable = state.event === "upcoming"
          || ["upcoming", "registration"].includes(state.phase)
          || ["hidden", "not-started"].includes(state.ranking);
        rankingLink.hidden = rankingUnavailable;
      }
      nav.querySelector("[data-competition-community-group-entry]")?.remove();
      if (group) nav.insertAdjacentHTML("beforeend", group);
    });
  };
  const initCompetitionCommunityGroup = () => {
    const closeAll = () => document.querySelectorAll("[data-competition-community-group-entry].is-open").forEach((entry) => {
      entry.classList.remove("is-open");
      entry.querySelector("[data-competition-community-group-trigger]")?.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll("[data-competition-community-group-entry]").forEach((entry) => {
      const trigger = entry.querySelector("[data-competition-community-group-trigger]");
      trigger?.addEventListener("click", (event) => {
        event.stopPropagation();
        const next = !entry.classList.contains("is-open");
        closeAll();
        entry.classList.toggle("is-open", next);
        trigger.setAttribute("aria-expanded", String(next));
      });
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest("[data-competition-community-group-entry]")) closeAll();
    });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeAll(); });
  };
  const updateCompetitionLinks = () => {
    document.querySelectorAll("a[data-competition-link]").forEach((link) => {
      const overrides = {};
      if (link.dataset.track) overrides.track = link.dataset.track;
      if (link.dataset.communityWorkId) overrides.work_id = link.dataset.communityWorkId;
      if (link.dataset.competitionSubmissionId) overrides.submission_id = link.dataset.competitionSubmissionId;
      if (link.dataset.workState) overrides.work = link.dataset.workState;
      if (link.dataset.board) overrides.board = link.dataset.board;
      const rawHref = link.getAttribute("href") || "./competition-detail.html";
      const targetUrl = new URL(rawHref, window.location.href);
      if (targetUrl.pathname.endsWith("/competition-works.html") && !link.dataset.competitionSubmissionId) {
        overrides.work_id = null;
        overrides.submission_id = null;
      }
      link.href = buildHref(rawHref, overrides);
    });
  };

  const syncHomeAnchorNavigation = () => {
    if (page.dataset.page !== "competition-detail") return;
    const currentHash = ["#process", "#tracks", "#awards"].includes(window.location.hash) ? window.location.hash : "";
    document.querySelectorAll(".competition-site-nav a").forEach((link) => {
      const url = new URL(link.href, window.location.href);
      const isHomeRoute = url.pathname.endsWith("/competition-detail.html");
      const isActive = isHomeRoute;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (currentHash) window.requestAnimationFrame(() => document.querySelector(currentHash)?.scrollIntoView({ block: "start" }));
  };

  const applyRootState = () => {
    page.dataset.authState = state.auth;
    page.dataset.auth = state.auth;
    page.dataset.eventState = state.event;
    page.dataset.phase = state.phase;
    page.dataset.registrationState = state.registration;
    page.dataset.interactionState = state.interaction;
    page.classList.toggle("is-review-mode", state.review === "1");
    document.querySelectorAll("[data-auth-name]").forEach((node) => { node.textContent = "空镜"; });
    const userFacingPhaseLabel = state.event === "unstarted"
      ? "报名即将开始"
      : state.event === "paused"
        ? "赛事暂时暂停"
        : state.event === "ended"
          ? "本届赛事已结束"
          : phase.userLabel || phase.label;
    document.querySelectorAll("[data-current-phase-label]").forEach((node) => { node.textContent = userFacingPhaseLabel; });
    document.querySelectorAll("[data-current-phase-window]").forEach((node) => { node.textContent = phase.window; });
    document.querySelectorAll("[data-competition-schedule]").forEach((node) => { node.textContent = competitionSchedule.overall; });
    document.querySelectorAll("[data-competition-timezone]").forEach((node) => { node.remove(); });
    document.querySelectorAll(".competition-stage-item[data-phase], .competition-stage-timeline [data-phase]").forEach((item) => {
      const itemPhase = phaseModel[item.dataset.phase];
      const isCurrent = item.dataset.phase === state.phase || (state.phase === "result-pending" && item.dataset.phase === "result");
      const isComplete = itemPhase.index < phase.index;
      item.dataset.competitionProcessStage = item.dataset.phase;
      item.dataset.stageIndex = String(itemPhase.index + 1).padStart(2, "0");
      item.classList.toggle("is-current", isCurrent);
      item.classList.toggle("is-complete", isComplete);
      if (isCurrent) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
      const detail = item.querySelector("div");
      if (detail) {
        const resultSchedule = detail.querySelector(".competition-result-schedule");
        let stageStatus = detail.querySelector("[data-stage-status]");
        if (!stageStatus) {
          stageStatus = document.createElement("em");
          stageStatus.dataset.stageStatus = "true";
        }
        detail.prepend(stageStatus);
        let stageTime = detail.querySelector("[data-stage-time]");
        if (!stageTime) {
          stageTime = document.createElement("time");
          stageTime.dataset.stageTime = "true";
          if (resultSchedule) detail.insertBefore(stageTime, resultSchedule);
          else detail.append(stageTime);
        }
        const timelineCopy = {
          preheat: { complete: "8月20日—25日", current: "截止 8月25日 23:59", upcoming: "8月20日开放" },
          collecting: { complete: "8月26日—9月10日", current: "截止 9月10日 23:59", upcoming: "8月26日开放" },
          judging: { complete: "9月11日—18日", current: "9月18日 23:59 结束", upcoming: "9月11日—18日" },
          result: { complete: "9月20日已公布", current: state.phase === "result-pending" ? "9月20日 10:00 公布" : "结果已公布", upcoming: "9月20日 10:00 公布" },
        };
        const displayCopy = timelineCopy[item.dataset.phase];
        stageTime.textContent = isComplete ? displayCopy.complete : isCurrent ? displayCopy.current : displayCopy.upcoming;
        stageTime.title = itemPhase.window;
        stageTime.setAttribute("aria-label", itemPhase.window);
        stageStatus.textContent = isComplete ? "已结束" : isCurrent ? (state.phase === "result-pending" ? "待公布" : item.dataset.phase === "result" ? "已公布" : "进行中") : "未开始";
      }
    });
  };

  const renderEventState = () => {
    const main = page.querySelector("main");
    if (!main) return;
    let surface = page.querySelector("[data-event-state-surface]");
    if (!surface) {
      surface = document.createElement("section");
      surface.className = "competition-event-state";
      surface.dataset.eventStateSurface = "true";
      surface.hidden = true;
      page.querySelector(".competition-header")?.after(surface);
    }
    const states = {
      draft: { title: "赛事尚未发布", text: "当前链接暂未开放，请返回活动中心查看已发布活动。" },
      unstarted: { title: "赛事即将开始", text: "赛题与规则已经开放浏览，报名开始后即可参与。" },
      paused: { title: "赛事暂时暂停", text: "赛事内容仍可浏览，报名、投稿和互动暂不可用。" },
      ended: { title: "赛事已结束", text: "获奖名单已经公布。" },
      "not-found": { title: "赛事暂不可用", text: "该赛事可能已撤销或链接已失效，请返回活动中心查看其他活动。" },
    };
    if (state.event === "running") {
      surface.hidden = true;
      main.hidden = false;
      return;
    }
    const copy = states[state.event];
    surface.innerHTML = `<div><strong>${copy.title}</strong><span>${copy.text}</span></div>${["draft", "not-found"].includes(state.event) ? '<a class="competition-btn" href="./activity-center.html">返回活动中心</a>' : ""}`;
    surface.hidden = false;
    main.hidden = ["draft", "not-found"].includes(state.event);
  };

  const continuePendingAction = () => {
    const action = pendingAction;
    pendingAction = null;
    if (!action) return;
    if (action.type === "register") openRegistration();
    if (action.type === "participate") beginParticipation(action.href);
    if (action.type === "navigate" && action.href) window.location.href = action.href;
    if (action.type === "like") action.control?.click();
    if (action.type === "comment") document.querySelector("[data-comment-input]")?.focus();
    if (action.type === "report") openModal("report");
    if (action.type === "appeal") openModal("appeal");
    if (action.type === "claim") openModal("prize-claim");
    if (action.type === "submit") document.querySelector("[data-submit-confirm], [data-competition-submit]")?.click();
  };
  const openCommunityLogin = (action = null) => {
    const loginUrl = new URL("./login.html", window.location.href);
    const returnUrl = action?.href ? new URL(action.href, window.location.href) : new URL(window.location.href);
    new URLSearchParams(window.location.search).forEach((value, key) => {
      if (!returnUrl.searchParams.has(key)) returnUrl.searchParams.set(key, value);
    });
    returnUrl.searchParams.set("auth", "user");
    loginUrl.searchParams.set("cancelTo", window.location.href);
    loginUrl.searchParams.set("returnTo", returnUrl.href);
    loginUrl.hash = "auth";
    window.location.href = loginUrl.href;
  };
  const requireAuth = (action) => {
    if (state.auth === "user") return false;
    openCommunityLogin(action);
    return true;
  };
  const normalizeParticipationHref = (href) => buildHref(href || "./competition-submit.html", {
    auth: "user",
    registration: state.registration,
  });
  const resumeAfterRegistration = () => {
    const action = pendingRegistrationAction;
    pendingRegistrationAction = null;
    if (!action) return;
    if (action.type === "navigate" && action.href) window.location.href = normalizeParticipationHref(action.href);
    if (action.type === "submit-current") renderSubmit();
  };
  const beginParticipation = (href = "./competition-submit.html") => {
    if (requireAuth({ type: "participate", href })) return;
    if (state.registration !== "registered" && state.registration !== "not-required") {
      pendingRegistrationAction = { type: page.dataset.page === "competition-submit" ? "submit-current" : "navigate", href };
      openRegistration();
      return;
    }
    window.location.href = normalizeParticipationHref(href);
  };

  document.querySelectorAll("[data-competition-login-open]").forEach((button) => button.addEventListener("click", () => openCommunityLogin()));
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-competition-assistant]");
    if (!trigger) return;
    event.preventDefault();
    openModal("assistant");
  });
  document.addEventListener("click", (event) => {
    const close = event.target.closest("[data-competition-modal-close]");
    if (close) {
      const modal = close.closest("[data-competition-modal]");
      if (modal?.matches("[data-competition-work-detail-modal]") && closeWorkDetailFromUi) closeWorkDetailFromUi();
      else closeModal(modal);
    }
    const modal = event.target.matches?.("[data-competition-modal]") ? event.target : null;
    if (modal) {
      if (modal.matches("[data-competition-work-detail-modal]") && closeWorkDetailFromUi) closeWorkDetailFromUi();
      else closeModal(modal);
    }
  });
  document.addEventListener("keydown", (event) => {
    const modal = [...document.querySelectorAll("[data-competition-modal]:not([hidden])")].at(-1);
    if (!modal) return;
    if (event.key === "Escape") {
      if (modal.matches("[data-competition-work-detail-modal]") && closeWorkDetailFromUi) closeWorkDetailFromUi();
      else closeModal(modal);
    }
    if (event.key === "Tab") {
      const focusable = [...modal.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const openRegistration = () => {
    if (!actionState.register) {
      showToast(state.event === "paused" ? "赛事暂停期间暂不能报名" : "当前阶段报名已关闭", "warning");
      return;
    }
    if (state.registration === "not-required") {
      showToast("本赛事无需报名，可以直接提交作品");
      return;
    }
    if (state.registration === "registered") {
      showToast("你已完成报名，无需重复报名", "warning");
      return;
    }
    openModal("register");
  };

  const initRegistration = () => {
    const modal = document.querySelector('[data-competition-modal="register"]');
    if (!modal) return;
    const confirm = modal.querySelector("[data-registration-confirm], [data-competition-register-confirm]");
    confirm?.addEventListener("click", () => {
      const agreement = modal.querySelector("[data-registration-agreement]");
      const message = modal.querySelector("[data-registration-message]");
      if (!agreement?.checked) {
        setInlineMessage(message, "请先阅读并同意赛事规则与作品授权说明", "error");
        agreement?.focus();
        return;
      }
      confirm.disabled = true;
      confirm.textContent = "报名中…";
      setInlineMessage(message, "", "");
      window.setTimeout(() => {
        if (registrationOutcome === "failure" || state.interaction === "disabled") {
          confirm.disabled = false;
          confirm.textContent = "重新报名";
          setInlineMessage(message, "报名没有完成，请检查网络后重试", "error");
          return;
        }
        const selectedTrack = modal.querySelector("[data-registration-track]")?.value || state.track;
        const duplicate = registrationOutcome === "duplicate";
        state.registration = "registered";
        state.track = selectedTrack;
        updateUrl({ registration: "registered", track: selectedTrack });
        applyRootState();
        renderHome();
        updateCompetitionLinks();
        const successText = duplicate ? "你已完成报名" : "报名成功";
        showToast(`${successText}，赛事状态已更新`, duplicate ? "warning" : "success");
        if (pendingRegistrationAction) {
          confirm.disabled = false;
          confirm.textContent = "确认报名";
          closeModal(modal);
          resumeAfterRegistration();
          return;
        }
        confirm.disabled = true;
        confirm.textContent = duplicate ? "已完成报名" : "报名成功";
        setInlineMessage(message, `${successText}，期待你的作品！`, "success");
        const refreshedUrl = new URL(window.location.href);
        refreshedUrl.searchParams.set("auth", "user");
        refreshedUrl.searchParams.set("registration", "registered");
        refreshedUrl.searchParams.set("track", selectedTrack);
        window.setTimeout(() => window.location.replace(refreshedUrl.href), 900);
      }, 620);
    });
  };

  const submissionLabels = {
    new: { title: "首次投稿", tag: "尚未提交", text: "填写作品信息并完成两项媒体上传。", editable: true },
    draft: { title: "草稿已保存", tag: "草稿", text: "草稿仅自己可见，可继续编辑后提交审核。", editable: true },
    review: { title: "作品审核中", tag: "审核中", text: "审核完成前作品不会公开展示。", editable: false },
    rejected: { title: "作品需要修改", tag: "需修改", text: "请按退回原因修改后重新提交。", editable: true, rejected: true },
    public: { title: "作品已公开", tag: "已公开", text: "作品正在参与当前阶段的公开展示。", editable: actionState.modify },
    down: { title: "作品已停止展示", tag: "暂不可用", text: "该投稿目前不能修改或参与赛事。", editable: false, blocked: true },
  };

  const renderStageTimeline = () => applyRootState();
  const phaseStatusCopy = () => {
    if (state.event === "unstarted") return "赛事即将开始";
    if (state.event === "paused") return "赛事暂时暂停";
    if (state.event === "ended") return "赛事已结束";
    return `${phase.short}进行中`;
  };

  const renderPublishedContext = () => {
    if (["competition-detail", "competition-rules", "competition-works", "competition-work", "competition-ranking", "competition-submit"].includes(page.dataset.page)) return;
    const main = page.querySelector("main");
    if (!main) return;
    let context = main.querySelector("[data-competition-published-context]");
    if (!context) {
      context = document.createElement("section");
      context.className = "competition-published-context";
      context.dataset.competitionPublishedContext = "true";
      const notice = main.querySelector("[data-event-banner]");
      if (notice) notice.after(context);
      else main.prepend(context);
    }
    context.innerHTML = `<span>当前阶段</span><strong>${phase.label}</strong><time>${phase.window}</time>`;
  };

  const authorStageResult = () => {
    const isRejected = state.submission === "rejected";
    if (state.event === "paused") return { title: "赛事暂停，结果保持不变", note: "历史作品和结果仍可查看；赛事恢复后再按页面提示继续。", label: "查看赛事规则", href: "./competition-rules.html", tone: "warning" };
    if (state.event === "unstarted" || state.phase === "preheat") return state.registration === "registered"
      ? { title: "已完成报名", note: "作品征集将于 2026.08.26 00:00 开放。", label: "查看投稿要求", href: "./competition-rules.html#submission", tone: "success" }
      : { title: "尚未完成报名", note: "报名开放至 2026.09.10 23:59。", label: "前往报名", href: "./competition-detail.html", tone: "warning" };
    if (state.phase === "collecting") {
      if (state.submission === "new") return { title: "尚未提交作品", note: "请在 2026.09.10 23:59 前完成投稿。", label: "提交作品", href: "./competition-submit.html", tone: "warning" };
      if (state.submission === "draft") return { title: "草稿尚未提交", note: "草稿不会参与审核，请在征集截止前提交。", label: "继续编辑", href: "./competition-submit.html", tone: "warning" };
      if (state.submission === "review") return { title: "作品审核中", note: "通常在 2 个工作日内反馈；审核通过后进入作品广场。", label: "查看进度", href: "./competition-submit.html", tone: "processing" };
      if (isRejected) return { title: "作品需要修改", note: "请按退回原因在 2026.09.10 23:59 前修改并重新提交。", label: "继续修改", href: "./competition-submit.html", tone: "warning" };
      return { title: "作品征集中", note: "作品已公开；允许修改阶段内可继续修改，重新提交后回到审核。", label: "查看投稿进度", href: "./competition-submit.html", tone: "success" };
    }
    if (state.phase === "judging") return state.submission === "down"
      ? { title: "未进入专业评审", note: "作品当前不具备参赛资格；如有异议，请联系赛事助手。", label: "联系赛事助手", href: "#", tone: "warning", assistant: true }
      : { title: "专业评审中", note: "评委评分将于 2026.09.18 23:59 结束。", label: "查看我的作品", href: "./competition-works.html?view=mine", tone: "processing" };
    if (state.phase === "result-pending") return { title: "获奖名单待公布", note: "获奖名单将于 2026.09.20 10:00 公布。", label: "查看阶段结果", href: "./competition-ranking.html?board=result&ranking=pending-result", tone: "processing" };
    return state.submission === "down" || isRejected
      ? { title: "本届未获奖", note: "感谢参与；作品和阶段结果仍可回看。", label: "查看获奖名单", href: "./competition-ranking.html?board=result&ranking=published-result", tone: "neutral" }
      : { title: "获得 8–30s 赛道冠军", note: "结果公示至 2026.09.23 10:00；公示结束后请确认领奖信息，赛事方人工核验并记录发放。", label: "查看领奖状态", href: "./competition-ranking.html?board=result&ranking=published-result", tone: "success" };
  };

  const renderAuthorStageResult = () => {
    if (page.dataset.page === "competition-submit") {
      document.querySelectorAll("[data-competition-personal-result]").forEach((node) => node.remove());
      return;
    }
    const result = authorStageResult();
    document.querySelectorAll("[data-home-stage-result], [data-author-stage-result]").forEach((node) => { node.textContent = result.title; node.dataset.tone = result.tone; });
    document.querySelectorAll("[data-home-stage-result-note], [data-author-stage-result-note]").forEach((node) => { node.textContent = result.note; });
    document.querySelectorAll("[data-home-stage-result-link], [data-author-stage-result-link]").forEach((link) => {
      link.textContent = result.label;
      if (result.assistant) {
        link.href = "#";
        link.dataset.competitionAssistant = "true";
        link.setAttribute("aria-haspopup", "dialog");
      } else {
        link.href = buildHref(result.href);
        delete link.dataset.competitionAssistant;
        link.removeAttribute("aria-haspopup");
      }
    });
  };

  const resolveHomePrimaryAction = () => {
    const effectiveRegistration = state.auth === "user" || state.registration === "not-required" ? state.registration : "unregistered";
    const effectiveSubmission = state.auth === "user" ? state.submission : "new";
    const editableDraft = effectiveSubmission === "draft";
    const rejected = effectiveSubmission === "rejected";
    const reviewing = effectiveSubmission === "review";
    const published = effectiveSubmission === "public";
    const hasSubmission = effectiveSubmission !== "new";
    const requiresRegistration = state.registration !== "not-required";
    const needsRegistration = requiresRegistration && effectiveRegistration !== "registered";
    const outcome = (actionStateName, label, action, href = "", disabled = false) => ({ actionStateName, label, action, href, disabled });

    if (["draft", "not-found"].includes(state.event)) return outcome("unavailable", "返回活动中心", "navigate", "./activity-center.html");
    if (state.event === "paused") return outcome("paused", "浏览参赛作品", "navigate", "./competition-works.html");
    if (state.event === "ended" || state.phase === "result") return outcome("view-result", "查看获奖名单", "result");
    if (state.event === "unstarted") return outcome("wait-start", "查看赛事规则", "navigate", "./competition-rules.html");
    if (state.phase === "judging") return hasSubmission
      ? outcome("view-submissions", "查看我的作品", "navigate", "./competition-works.html?view=mine")
      : outcome("browse-works", "浏览参赛作品", "navigate", "./competition-works.html");
    if (state.phase === "result-pending") return outcome("view-ranking", "查看当前榜单", "navigate", "./competition-ranking.html?board=result&ranking=pending-result");
    if (needsRegistration && actionState.register) return outcome("register", "报名参赛", "register");
    if (needsRegistration) return outcome("registration-closed", "浏览参赛作品", "navigate", "./competition-works.html");
    if (state.phase === "preheat") return outcome("wait-submit", "查看投稿要求", "navigate", "./competition-rules.html#submission");
    if (effectiveSubmission === "down") return outcome("view-review", "查看投稿状态", "submit");
    if (rejected) return outcome("revise-rejected", "修改并重提", "submit");
    if (editableDraft) return outcome("edit-draft", "继续编辑", "submit");
    if (reviewing) return outcome("view-review", "查看投稿进度", "submit");
    if (published) return state.quota === "full"
      ? outcome("view-submissions", "管理我的投稿", "submit")
      : outcome("submit-another", "继续投稿", "navigate", "./competition-submit.html?submission=new");
    if (state.quota === "full") return outcome("view-submissions", "查看我的投稿", "navigate", "./competition-works.html?view=mine");
    return outcome("submit-new", "提交作品", "submit");
  };

  const renderHome = () => {
    if (page.dataset.page !== "competition-detail") return;
    document.querySelectorAll("[data-phase-status]").forEach((node) => { node.textContent = phaseStatusCopy(); });
    const primary = document.querySelector("[data-home-primary]");
    const secondary = document.querySelector("[data-home-secondary]");
    const personal = document.querySelector("[data-home-personal-status]");
    const primaryAction = resolveHomePrimaryAction();
    if (primary) {
      primary.textContent = primaryAction.label;
      primary.disabled = primaryAction.disabled;
      primary.dataset.homeAction = primaryAction.action;
      primary.dataset.homeActionState = primaryAction.actionStateName;
      primary.dataset.homeActionHref = primaryAction.href;
      primary.setAttribute("aria-disabled", String(primaryAction.disabled));
    }
    if (secondary) {
      secondary.textContent = state.phase === "result" ? "查看获奖作品 →" : "浏览参赛作品 →";
      secondary.href = state.phase === "result"
          ? buildHref("./competition-ranking.html", { phase: "result", board: "result", ranking: "published-result" })
          : buildHref("./competition-works.html");
    }
    if (personal) {
      personal.hidden = state.auth !== "user" || state.registration === "unregistered";
      personal.textContent = state.registration === "not-required" ? "无需报名" : "已报名";
      personal.dataset.tone = state.registration === "registered" || state.registration === "not-required" ? "success" : "warning";
    }
  };

  document.querySelector("[data-home-primary]")?.addEventListener("click", (event) => {
    const action = event.currentTarget.dataset.homeAction;
    const actionHref = event.currentTarget.dataset.homeActionHref;
    if (action === "register") {
      if (requireAuth({ type: "register" })) return;
      openRegistration();
    }
    if (action === "submit") {
      const href = buildHref("./competition-submit.html");
      beginParticipation(href);
    }
    if (action === "result") window.location.href = buildHref("./competition-ranking.html", { phase: "result", board: "result", ranking: "published-result" });
    if (action === "navigate" && actionHref) {
      const href = buildHref(actionHref);
      if (requireAuth({ type: "navigate", href })) return;
      window.location.href = href;
    }
  });

  const createWorkCard = (work) => {
    const link = buildHref("./competition-work.html", { work_id: work.workId, submission_id: work.submissionId, track: work.track, work: "public" });
    return `<a class="competition-work-card" href="${link}" data-work-card data-competition-work-open data-competition-link data-community-work-id="${work.workId}" data-competition-submission-id="${work.submissionId}" data-track="${work.track}" data-author="${work.author}" data-work-state="public">
      <img class="competition-work-media" src="${work.cover}" alt="作品《${work.title}》">
      <div class="competition-work-card-copy"><h3>${work.title}</h3><p>@ ${work.author}</p><div><span>${tracks[work.track].label}</span><strong>${work.heat.toLocaleString()} 热度</strong></div></div>
    </a>`;
  };

  const renderWorks = () => {
    if (page.dataset.page !== "competition-works") return;
    const list = document.querySelector("[data-works-list]");
    const resultCount = document.querySelector("[data-works-count]");
    const query = (document.querySelector("[data-work-search]")?.value || "").trim().toLowerCase();
    const activeTrack = document.querySelector("[data-work-track]")?.value || state.track;
    const activeSort = document.querySelector("[data-work-sort]")?.value || state.sort;
    const activeView = "all";
    if (!list) return;
    if (state.list === "loading") {
      list.innerHTML = '<div class="competition-loading-grid" aria-label="作品加载中"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
      if (resultCount) resultCount.textContent = "正在加载作品";
      return;
    }
    if (state.list === "error") {
      list.innerHTML = '<section class="competition-empty"><img src="resources/icons/remixicon/svg/System/error-warning-line.svg" alt=""><h2>作品加载失败</h2><p>网络状态可能不稳定，请稍后重试。</p><button class="competition-btn" type="button" data-works-retry>重新加载</button></section>';
      if (resultCount) resultCount.textContent = "加载失败";
      list.querySelector("[data-works-retry]")?.addEventListener("click", () => { state.list = "ready"; updateUrl({ list: "ready" }); renderWorks(); });
      return;
    }
    let result = state.list === "empty" ? [] : works.filter((work) => {
      const matchesTrack = activeTrack === "all" || work.track === activeTrack;
      const matchesSearch = !query || `${work.title}${work.author}${work.description}`.toLowerCase().includes(query);
      return matchesTrack && matchesSearch;
    });
    result.sort((a, b) => activeSort === "new" ? b.createdAt - a.createdAt : b.heat - a.heat);
    if (!result.length) {
      list.innerHTML = '<section class="competition-empty"><img src="resources/icons/remixicon/svg/Media/video-line.svg" alt=""><h2>暂无符合条件的作品</h2><p>更换赛道或关键词后再试试。</p><button class="competition-btn secondary" type="button" data-works-reset>清除筛选</button></section>';
    } else {
      list.innerHTML = result.map(createWorkCard).join("");
      const syncVisibleCount = () => {
        if (resultCount) resultCount.textContent = `共 ${list.querySelectorAll("[data-work-card]").length} 件作品`;
      };
      list.querySelectorAll(".competition-work-media").forEach((image) => {
        const removeBrokenCard = () => {
          image.closest("[data-work-card]")?.remove();
          syncVisibleCount();
        };
        image.addEventListener("error", removeBrokenCard, { once: true });
        if (image.complete && image.naturalWidth === 0) removeBrokenCard();
      });
      syncVisibleCount();
    }
    if (!result.length && resultCount) resultCount.textContent = "共 0 件作品";
    updateCompetitionLinks();
  };

  const initWorks = () => {
    if (page.dataset.page !== "competition-works") return;
    const track = document.querySelector("[data-work-track]");
    const sort = document.querySelector("[data-work-sort]");
    if (track) track.value = state.track;
    if (sort) sort.value = state.sort;
    track?.addEventListener("change", () => {
      if (track.value !== "all") state.track = track.value;
      updateUrl({ track: track.value === "all" ? null : state.track });
      renderWorks();
    });
    sort?.addEventListener("change", () => { state.sort = sort.value; updateUrl({ sort: state.sort }); renderWorks(); });
    document.querySelector("[data-work-search]")?.addEventListener("input", renderWorks);
    document.querySelector("[data-works-list]")?.addEventListener("click", (event) => {
      const reset = event.target.closest("[data-works-reset]");
      if (reset) {
        document.querySelector("[data-work-search]").value = "";
        document.querySelector("[data-work-track]").value = "all";
        state.list = "ready";
        updateUrl({ track: null, view: null, list: "ready" });
        renderWorks();
        return;
      }
      const card = event.target.closest("[data-competition-work-open]");
      if (!card || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openWorkDetail({ workId: card.dataset.communityWorkId, submissionId: card.dataset.competitionSubmissionId }, { trigger: card });
    });
    renderWorks();
  };

  const initMySubmissions = () => {
    if (page.dataset.page !== "competition-my-submissions") return;
    const result = document.querySelector("[data-my-submission-result]");
    if (result) result.textContent = state.phase === "result" ? "获奖名单 · 冠军" : "热度榜 · 01";
    const primary = document.querySelector("[data-my-submission-primary]");
    const edit = document.querySelector("[data-my-submission-edit]");
    const view = document.querySelector("[data-my-submission-view]");
    const removeDraft = document.querySelector("[data-my-submission-delete]");
    const submissionCard = document.querySelector(".competition-my-submission-card");
    const cardStatus = document.querySelector("[data-my-submission-status]")?.textContent.trim();

    if (view && edit) {
      const submissionActions = {
        draft: state.phase === "collecting"
          ? { label: "继续编辑", href: edit.href, primary: true, removable: true }
          : { label: "查看作品", href: view.href, primary: false, removable: false },
        review: { label: "查看审核进度", href: edit.href },
        rejected: { label: "修改并重投", href: edit.href, primary: true, removable: true },
        down: { label: "查看下架原因", href: edit.href },
        public: { label: "查看作品", href: view.href }
      };
      const cardSubmission = cardStatus === "已公开" ? "public" : state.submission;
      const cardAction = submissionActions[cardSubmission] || submissionActions.public;
      view.textContent = cardAction.label;
      view.href = cardAction.href;
      view.classList.toggle("primary", Boolean(cardAction.primary));
      view.classList.toggle("secondary", !cardAction.primary);
      edit.hidden = !cardAction.editable;
      removeDraft.hidden = !cardAction.removable;
    }

    removeDraft?.addEventListener("click", () => {
      if (!window.confirm("确认删除这份草稿？删除后不可恢复。")) return;
      submissionCard?.remove();
      showToast("草稿已删除");
    });
    if (!actionState.submit) {
      const closed = document.createElement("div");
      closed.className = "competition-my-submission-closed";
      closed.innerHTML = '<button class="competition-btn secondary" type="button" disabled aria-disabled="true" title="当前不在作品征集期">投稿作品</button>';
      primary?.replaceWith(closed);
      if (state.submission !== "draft" && state.submission !== "rejected") edit.hidden = true;
    }
    document.querySelector(".competition-my-submissions-head > .competition-my-submission-state")?.remove();
  };

  let uploads = { "video-original": null, "video-final": null, "image-originals": null, "image-final": null };
  let formDirty = false;
  const defaultSubmissionMaterials = {
    video:{ sourceLabel:"生成原片", finalLabel:"最终成片", sourceRequired:true },
    image:{ sourceLabel:"参考原图", finalLabel:"最终作品图", sourceRequired:true },
    text:{ sourceLabel:"提示词", finalLabel:"成文内容", sourceRequired:true },
  };
  const publishedSubmissionMaterials = readCompetitionRuleSnapshot("published")?.sections?.submission?.materials || {};
  const configuredSubmissionMaterials = Object.fromEntries(Object.entries(defaultSubmissionMaterials).map(([type, fallback]) => [
    type,
    { ...fallback, ...(publishedSubmissionMaterials[type] || {}) },
  ]));
  const setUploadState = (type, status, text) => {
    uploads[type] = status === "ready" ? { name: text } : null;
    const slot = document.querySelector(`[data-upload-slot="${type}"]`);
    if (!slot) return;
    slot.dataset.uploadState = status;
    const label = slot.querySelector("[data-upload-label]");
    if (label) label.textContent = text;
  };
  const submissionTypeMeta = {
    video: { label: "视频", title: "视频作品", mark: "VID", note: "提交生成原片与最终成片", materialTitle: "视频材料" },
    image: { label: "图片", title: "图片作品", mark: "IMG", note: "提交参考原图与最终作品图", materialTitle: "图片材料" },
    text: { label: "纯文字", title: "纯文字作品", mark: "TXT", note: "提交提示词与最终成文", materialTitle: "文字内容" },
  };
  const syncSubmissionType = () => {
    if (!submissionTypeMeta[state.format]) state.format = "video";
    const meta = submissionTypeMeta[state.format];
    const materials = configuredSubmissionMaterials[state.format];
    const requiredLabels = [materials.sourceRequired ? materials.sourceLabel : "", materials.finalLabel].filter(Boolean);
    const card = document.querySelector("[data-submission-format-card]");
    if (card) card.dataset.format = state.format;
    const mark = document.querySelector("[data-submission-format-mark]");
    const title = document.querySelector("[data-submission-format-title]");
    const note = document.querySelector("[data-submission-format-note]");
    const materialTitle = document.querySelector("[data-submission-material-title]");
    if (mark) mark.textContent = meta.mark;
    if (title) title.textContent = meta.title;
    if (note) note.textContent = `提交${requiredLabels.join("与")}`;
    if (materialTitle) materialTitle.textContent = meta.materialTitle;
    Object.entries(configuredSubmissionMaterials).forEach(([type, config]) => {
      document.querySelector(`[data-submission-material-key="${type}-source"]`)?.toggleAttribute("hidden", !config.sourceRequired);
    });
    const materialHelp = document.querySelector(`[data-submission-material-help="${state.format}"]`);
    if (materialHelp && state.format === "video") materialHelp.innerHTML = materials.sourceRequired
      ? "<h3>视频材料</h3><ul><li>原片与最终成片的主要内容需对应</li><li>最终成片时长需符合所选赛道</li></ul>"
      : "<h3>视频材料</h3><ul><li>本赛事只需提交最终成片</li><li>最终成片时长需符合所选赛道</li></ul>";
    if (materialHelp && state.format === "image") materialHelp.innerHTML = materials.sourceRequired
      ? "<h3>图片材料</h3><ul><li>参考原图支持多张，最终作品图提交 1 张</li><li>最终作品图需与参考原图具有清晰关联</li></ul>"
      : "<h3>图片材料</h3><ul><li>本赛事只需提交最终作品图</li><li>最终作品图提交 1 张</li></ul>";
    document.querySelectorAll("[data-submission-material-panel]").forEach((panel) => { panel.hidden = panel.dataset.submissionMaterialPanel !== state.format; });
  };
  const validateFile = async (input) => {
    const type = input?.dataset.uploadInput;
    const files = [...(input?.files || [])];
    if (!type || !files.length) return;
    const isVideo = type.startsWith("video-");
    const valid = files.every((file) => isVideo
      ? ["video/mp4", "video/quicktime"].includes(file.type) || /\.(mp4|mov)$/i.test(file.name)
      : ["image/jpeg", "image/png", "image/webp"].includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name));
    if (!valid) { setUploadState(type, "error", isVideo ? "格式不支持，请上传 MP4 或 MOV" : "格式不支持，请上传 JPG、PNG 或 WebP"); return; }
    const maxBytes = isVideo ? 500 * 1024 * 1024 : 20 * 1024 * 1024;
    if (files.some((file) => file.size > maxBytes)) { setUploadState(type, "error", isVideo ? "单个文件超过 500MB" : "单张图片超过 20MB"); return; }
    if (files.some((file) => file.name.toLowerCase().includes("network-fail"))) { setUploadState(type, "error", "上传失败，请检查网络后重试"); return; }
    if (isVideo && files.some((file) => file.name.toLowerCase().includes("duration-fail"))) {
      setUploadState(type, "error", `视频时长需符合 ${tracks[state.track].label} 赛道`);
      return;
    }
    setUploadState(type, "uploading", "上传中…");
    const readyText = files.length > 1 ? `已选择 ${files.length} 张参考原图` : files[0].name;
    window.setTimeout(() => setUploadState(type, "ready", readyText), 520);
  };

  const renderSubmit = () => {
    if (page.dataset.page !== "competition-submit") return;
    const meta = submissionLabels[state.submission];
    const title = document.querySelector("[data-submit-status-title]");
    const text = document.querySelector("[data-submit-status-text]");
    const tag = document.querySelector("[data-submit-status-tag]");
    if (title) title.textContent = meta.title;
    if (text) text.textContent = meta.text;
    if (tag) { tag.textContent = meta.tag; tag.dataset.tone = meta.rejected || meta.blocked ? "warning" : meta.editable ? "processing" : "success"; }
    const quota = document.querySelector("[data-submit-quota]");
    if (quota) quota.textContent = state.quota === "full" ? "投稿额度 3 / 3" : `投稿额度 ${state.submission === "new" ? "0" : "1"} / 3`;
    const form = document.querySelector("[data-submission-form]");
    const gate = document.querySelector("[data-submission-gate]");
    let gateTitle = "";
    let gateText = "";
    if (state.auth === "guest") { gateTitle = "登录后提交作品"; gateText = "登录后可以继续编辑并保留当前填写内容。"; }
    else if (state.registration === "unregistered") { gateTitle = "请先完成报名"; gateText = "完成赛事报名后即可创建或修改投稿。"; }
    else if (state.quota === "full" && ["new", "draft"].includes(state.submission)) { gateTitle = "已达投稿上限"; gateText = "每位用户最多提交 3 件作品，修改已有作品不占新名额。"; }
    else if (!actionState.submit && !actionState.modify && meta.editable) { gateTitle = "当前阶段暂不能提交"; gateText = "可以查看已有版本，下一次开放以赛事页面状态为准。"; }
    else if (meta.blocked) { gateTitle = "投稿暂不可用"; gateText = "该投稿当前不能修改或重新提交。"; }
    if (gate) {
      gate.hidden = !gateTitle;
      gate.innerHTML = gateTitle ? `<img src="resources/icons/remixicon/svg/System/lock-line.svg" alt=""><div><h2>${gateTitle}</h2><p>${gateText}</p></div>${state.auth === "guest" ? '<button class="competition-btn primary" type="button" data-gate-participate>登录并继续</button>' : state.registration === "unregistered" ? '<button class="competition-btn primary" type="button" data-gate-participate>完成报名</button>' : ""}` : "";
      gate.querySelector("[data-gate-participate]")?.addEventListener("click", () => beginParticipation(window.location.href));
    }
    if (form) {
      const disabled = Boolean(gateTitle) || !meta.editable;
      form.classList.toggle("is-disabled", disabled);
      form.querySelectorAll("input, select, textarea, button").forEach((control) => {
        if (!control.matches("[data-competition-modal-close]")) control.disabled = disabled;
      });
    }
    const rejection = document.querySelector("[data-rejection-reason]");
    if (rejection) rejection.hidden = !meta.rejected;
    const source = document.querySelector("[data-source-status]");
    if (source) {
      const sourceCopy = state.integration === "connected"
        ? ["创作来源已关联", "已关联可只读查看的创作记录。", "success"]
        : state.integration === "invalid"
          ? ["创作来源暂不可用", "请重新选择创作记录或上传生成原片。", "warning"]
          : ["请上传生成原片", "生成原片仅用于确认作品的创作来源。", "processing"];
      source.innerHTML = `<img src="resources/icons/remixicon/svg/Media/video-line.svg" alt=""><div><strong>${sourceCopy[0]}</strong><span>${sourceCopy[1]}</span></div><small data-tone="${sourceCopy[2]}">${state.integration === "connected" ? "已关联" : state.integration === "invalid" ? "需处理" : "待提交"}</small>`;
    }
    const inputTitle = document.querySelector("[data-submission-title]");
    const inputDescription = document.querySelector("[data-submission-description]");
    const inputTrack = document.querySelector("[data-submission-track]");
    if (inputTrack) inputTrack.value = state.track;
    syncSubmissionType();
    if (state.submission === "new") {
      if (inputTitle && !formDirty) inputTitle.value = "";
      if (inputDescription && !formDirty) inputDescription.value = "";
      if (!formDirty) {
        setUploadState("video-original", "idle", "上传 AI 生成原始视频");
        setUploadState("video-final", "idle", "MP4 / MOV · 不超过 500MB");
        setUploadState("image-originals", "idle", "可一次选择多张图片");
        setUploadState("image-final", "idle", "JPG / PNG / WebP");
        const prompt = document.querySelector("[data-submission-prompt]");
        const article = document.querySelector("[data-submission-article]");
        if (prompt) prompt.value = "";
        if (article) article.value = "";
      }
    } else if (state.submission === "draft") {
      if (inputTitle && !inputTitle.value) inputTitle.value = "未完成的光影实验";
    } else if (!formDirty) {
      if (state.format === "video" && !uploads["video-final"]) {
        setUploadState("video-original", "ready", "light-door-source.mp4");
        setUploadState("video-final", "ready", "light-door-final.mp4");
      }
      if (state.format === "image" && !uploads["image-final"]) {
        setUploadState("image-originals", "ready", "已选择 3 张参考原图");
        setUploadState("image-final", "ready", "last-watch-final.png");
      }
      if (state.format === "text") {
        const prompt = document.querySelector("[data-submission-prompt]");
        const article = document.querySelector("[data-submission-article]");
        if (prompt && !prompt.value) prompt.value = "以一座漂浮城市为背景，写一封来自未来的短篇书信。";
        if (article && !article.value) article.value = "云层之上，城市每天都把一封没有地址的信交给风。直到今天，信封上第一次出现了我的名字。";
      }
    }
    renderAuthorStageResult();
  };

  const initSubmit = () => {
    if (page.dataset.page !== "competition-submit") return;
    const embeddedSubmit = params.get("embed") === "1" && window.parent !== window;
    document.documentElement.classList.add(embeddedSubmit ? "competition-submit-embedded" : "competition-submit-standalone");
    if (!embeddedSubmit) {
      const shell = document.querySelector("main");
      const closeLink = document.createElement("a");
      closeLink.className = "competition-submit-standalone-close";
      closeLink.href = buildHref("./competition-detail.html", { work_id: null, submission_id: null });
      closeLink.dataset.leaveLink = "";
      closeLink.textContent = "关闭";
      closeLink.setAttribute("aria-label", "关闭投稿");
      shell?.prepend(closeLink);
    }
    renderSubmit();
    const form = document.querySelector("[data-submission-form]");
    form?.addEventListener("input", (event) => {
      if (event.target.matches("input, textarea, select")) formDirty = true;
    });
    document.querySelectorAll("[data-upload-input]").forEach((input) => input.addEventListener("change", () => {
      formDirty = true;
      validateFile(input);
    }));
    document.querySelector("[data-submission-track]")?.addEventListener("change", (event) => {
      state.track = event.target.value;
      updateUrl({ track: state.track });
      const hint = document.querySelector("[data-track-duration-hint]");
      if (hint) hint.textContent = `${tracks[state.track].label} 赛道 · 请确认最终成片时长符合要求`;
    });
    document.querySelector("[data-save-draft]")?.addEventListener("click", () => {
      state.submission = "draft";
      formDirty = false;
      updateUrl({ submission: "draft" });
      renderSubmit();
      showToast("草稿已保存");
    });
    document.querySelector("[data-submit-confirm], [data-competition-submit]")?.addEventListener("click", () => {
      if (requireAuth({ type: "submit" })) return;
      const meta = submissionLabels[state.submission];
      if (!meta.editable) { showToast("当前投稿状态不能重复提交", "warning"); return; }
      const title = document.querySelector("[data-submission-title]");
      const agreement = document.querySelector("[data-submission-agreement]");
      const message = document.querySelector("[data-submit-message]");
      if (!title?.value.trim()) { setInlineMessage(message, "请填写作品标题", "error"); title?.focus(); return; }
      if (state.format === "video" && configuredSubmissionMaterials.video.sourceRequired && !uploads["video-original"]) { setInlineMessage(message, "请上传生成原片", "error"); document.querySelector('[data-upload-slot="video-original"]')?.focus(); return; }
      if (state.format === "video" && !uploads["video-final"]) { setInlineMessage(message, "请上传最终成片", "error"); document.querySelector('[data-upload-slot="video-final"]')?.focus(); return; }
      if (state.format === "image" && configuredSubmissionMaterials.image.sourceRequired && !uploads["image-originals"]) { setInlineMessage(message, "请上传至少一张参考原图", "error"); document.querySelector('[data-upload-slot="image-originals"]')?.focus(); return; }
      if (state.format === "image" && !uploads["image-final"]) { setInlineMessage(message, "请上传最终作品图", "error"); document.querySelector('[data-upload-slot="image-final"]')?.focus(); return; }
      const prompt = document.querySelector("[data-submission-prompt]");
      const article = document.querySelector("[data-submission-article]");
      if (state.format === "text" && configuredSubmissionMaterials.text.sourceRequired && !prompt?.value.trim()) { setInlineMessage(message, "请填写提示词", "error"); prompt?.focus(); return; }
      if (state.format === "text" && !article?.value.trim()) { setInlineMessage(message, "请填写成文内容", "error"); article?.focus(); return; }
      if (!agreement?.checked) { setInlineMessage(message, "请确认作品授权与赛事规则", "error"); agreement?.focus(); return; }
      const button = document.querySelector("[data-submit-confirm], [data-competition-submit]");
      button.disabled = true;
      button.textContent = "提交中…";
      setInlineMessage(message, `正在提交${submissionTypeMeta[state.format].label}作品与对应材料，请稍候`, "processing");
      window.setTimeout(() => {
        if (submitOutcome === "failure" || state.interaction === "disabled") {
          button.disabled = false;
          button.textContent = "重新提交";
          setInlineMessage(message, "提交失败，已保留当前填写内容，请重试", "error");
          return;
        }
        state.submission = "review";
        formDirty = false;
        updateUrl({ submission: state.submission });
        button.disabled = false;
        button.textContent = "提交审核";
        setInlineMessage(message, "", "");
        renderSubmit();
        showToast("作品已提交审核");
      }, 720);
    });
    document.querySelectorAll("[data-leave-link]").forEach((link) => link.addEventListener("click", (event) => {
      if (!formDirty) {
        if (embeddedSubmit) {
          event.preventDefault();
          window.parent.postMessage({ type: "competition-submit-navigate", href: link.href }, window.location.origin);
        }
        return;
      }
      event.preventDefault();
      const modal = document.querySelector('[data-competition-modal="leave"]');
      if (!modal) return;
      modal.dataset.targetHref = link.href;
      modal.dataset.submitCloseAction = "";
      openModal("leave");
    }));
    document.querySelector("[data-leave-discard]")?.addEventListener("click", (event) => {
      formDirty = false;
      const modal = event.currentTarget.closest("[data-competition-modal]");
      const closeEmbedded = modal.dataset.submitCloseAction === "true";
      const targetHref = modal.dataset.targetHref || buildHref("./competition-detail.html");
      if (embeddedSubmit) {
        window.parent.postMessage(closeEmbedded
          ? { type: "competition-submit-close" }
          : { type: "competition-submit-navigate", href: targetHref }, window.location.origin);
        return;
      }
      window.location.href = targetHref;
    });
    window.addEventListener("message", (event) => {
      if (!embeddedSubmit || event.origin !== window.location.origin || event.data?.type !== "competition-submit-request-close") return;
      if (!formDirty) {
        window.parent.postMessage({ type: "competition-submit-close" }, window.location.origin);
        return;
      }
      const modal = document.querySelector('[data-competition-modal="leave"]');
      if (!modal) return;
      modal.dataset.submitCloseAction = "true";
      delete modal.dataset.targetHref;
      openModal("leave");
    });
    window.addEventListener("beforeunload", (event) => {
      if (!formDirty) return;
      event.preventDefault();
      event.returnValue = "";
    });
  };

  const escapeWorkMarkup = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  const resolveWorkIdentity = ({ workId = "", submissionId = "" } = {}) => {
    const byWork = workId ? works.find((item) => item.workId === workId) : null;
    const bySubmission = submissionId ? works.find((item) => item.submissionId === submissionId) : null;
    if (byWork && bySubmission && byWork !== bySubmission) return null;
    return byWork || bySubmission || null;
  };
  const selectedWork = () => {
    const selected = new URLSearchParams(window.location.search);
    const workId = selected.get("work_id") || "";
    const submissionId = selected.get("submission_id") || "";
    return resolveWorkIdentity({ workId, submissionId: submissionId || (workId ? "" : "S-001") });
  };
  const workCanonicalHref = (work) => {
    const url = new URL("./competition-work.html", window.location.href);
    url.searchParams.set("work_id", work.workId);
    url.searchParams.set("submission_id", work.submissionId);
    return `${url.pathname}${url.search}`;
  };
  const workCommentsMarkup = () => {
    if (state.comments === "empty") return '<div class="competition-empty compact"><img src="resources/icons/remixicon/svg/Communication/chat-3-line.svg" alt=""><p>还没有评论，来分享第一条看法吧。</p></div>';
    if (state.comments === "error") return '<div class="competition-empty compact"><img src="resources/icons/remixicon/svg/System/error-warning-line.svg" alt=""><p>评论加载失败，请稍后重试。</p></div>';
    return '<article class="comment-row compact"><img src="assets/image_assets/2.png" alt=""><div><strong>拾光者</strong><p>画面节奏很完整，像在旧机器里重新种出了一小片春天。</p><div class="comment-action-line"><span>5 分钟前</span><button type="button">回复</button><button type="button">赞 7</button></div></div></article><article class="comment-row compact"><img src="assets/image_assets/3.png" alt=""><div><strong>白昼梦</strong><p>声音与光线的切换让这个短片很有记忆点。</p><div class="comment-action-line"><span>21 分钟前</span><button type="button">回复</button><button type="button">赞 5</button></div></div></article>';
  };
  const workDetailMarkup = (work, surface) => {
    const workId = escapeWorkMarkup(work.workId);
    const submissionId = escapeWorkMarkup(work.submissionId);
    const title = escapeWorkMarkup(work.title);
    const author = escapeWorkMarkup(work.author);
    const description = escapeWorkMarkup(work.description);
    const trackLabel = escapeWorkMarkup(tracks[work.track].label);
    const trackRank = [...works].filter((item) => item.track === work.track).sort((a, b) => b.heat - a.heat).findIndex((item) => item.submissionId === work.submissionId) + 1;
    const placement = state.phase === "result" ? (["冠军", "亚军", "季军"][trackRank - 1] || `第 ${trackRank} 名`) : `热度榜 ${String(trackRank).padStart(2, "0")}`;
    const tabName = `competition-work-${surface}-${submissionId}`;
    const isModal = surface === "modal";
    const workFormat = work.format || "video";
    const workFormatLabel = submissionTypeMeta[workFormat]?.label || "视频";
    const workMaterialConfig = configuredSubmissionMaterials[workFormat] || defaultSubmissionMaterials.video;
    const workMaterialLabel = [workMaterialConfig.sourceRequired ? workMaterialConfig.sourceLabel : "", workMaterialConfig.finalLabel].filter(Boolean).join(" + ");
    const finalWorkMarkup = workFormat === "video"
      ? `<div class="case-detail-viewport video-viewport competition-work-detail-viewport"><img data-work-media src="${work.cover}" alt="作品《${title}》"><button class="case-video-play-button" type="button" data-work-play aria-label="播放作品"></button><span class="competition-work-play-status" data-play-status>00:00 / 00:42</span></div>`
      : workFormat === "image"
        ? `<div class="case-detail-viewport competition-work-detail-viewport competition-work-image-final"><img data-work-media src="${work.cover}" alt="作品《${title}》最终作品图"></div>`
        : `<div class="case-detail-viewport competition-work-detail-viewport competition-work-text-final"><article><span>成文内容</span><h2>${title}</h2><p>${escapeWorkMarkup(work.content || work.description)}</p></article></div>`;
    return `<article class="case-detail-dialog competition-work-detail-dialog" data-community-work-id="${workId}" data-competition-submission-id="${submissionId}" data-detail-surface="${surface}" ${isModal ? 'role="dialog" aria-modal="true"' : 'role="article"'} aria-labelledby="${tabName}-title">
      ${isModal ? '<button class="case-detail-close" type="button" data-competition-work-close data-competition-modal-close aria-label="关闭作品详情">关闭</button>' : '<button class="case-detail-close competition-work-detail-page-close" type="button" data-competition-work-page-close aria-label="关闭作品详情"><img src="resources/icons/remixicon/svg/System/close-line.svg" alt=""></button>'}
      <div class="case-detail-media">
        ${finalWorkMarkup}
      </div>
      <aside class="case-detail-aside">
        <div class="competition-work-detail-heading"><div class="competition-work-detail-title-row"><h3 id="${tabName}-title" data-work-title>${title}</h3><div class="competition-work-detail-author"><img src="assets/image_assets/1.png" alt=""><strong data-work-author>${author}</strong></div></div><p data-work-description>${description}</p></div>
        <div class="detail-tags"><span>${workFormatLabel}作品</span><span data-work-track-label>${trackLabel}</span><span>${workMaterialLabel}</span></div>
        <section class="competition-work-owner-note" data-owner-status hidden></section>
        <div class="competition-interaction-disabled" data-interaction-disabled hidden><img src="resources/icons/remixicon/svg/System/lock-line.svg" alt=""><span>当前阶段暂不开放互动</span></div>
        <div class="detail-tabs" data-global-comment-component>
          <input class="detail-tab-radio" type="radio" name="${tabName}-tabs" id="${tabName}-tab-info" checked>
          <input class="detail-tab-radio" type="radio" name="${tabName}-tabs" id="${tabName}-tab-comments">
          <div class="detail-tab-controls" role="tablist" aria-label="作品详情内容"><label class="detail-tab-label detail-tab-label-prompt" for="${tabName}-tab-info">作品信息</label><label class="detail-tab-label detail-tab-label-comments" for="${tabName}-tab-comments">评论 <span data-work-comment-count>${state.comments === "ready" ? "2" : "0"}</span></label></div>
          <div class="detail-tab-content">
            <div class="detail-tab-panel detail-prompt detail-prompt-panel competition-work-public-info"><div class="competition-work-public-facts"><div><span>参赛活动</span><strong>AIGC 创作挑战赛</strong></div><div><span>参赛赛道</span><strong data-work-track-label>${trackLabel}</strong></div><div><span>获得名次</span><strong>${placement}</strong></div></div><a href="${workCanonicalHref(work)}" data-work-canonical-link hidden>作品独立链接</a></div>
            <div class="detail-tab-panel detail-comments-panel"><div class="content-comment-list case-comment-list" data-comment-list>${workCommentsMarkup()}</div><div class="comment-input-bar case-comment-input"><textarea rows="1" maxlength="200" placeholder="写下你的看法" data-comment-input data-interaction-control></textarea><p class="competition-inline-message" data-comment-message aria-live="polite"></p><button class="button" type="button" data-comment-submit data-interaction-control data-requires-auth="comment">发布</button></div></div>
          </div>
        </div>
            <div class="content-action-row"><div class="detail-action-stats" data-content-detail-actions aria-label="作品互动"><span class="detail-action-stat detail-action-stat--metric" aria-label="浏览量 ${Number(work.views ?? Math.max(860, Math.round(work.heat * 0.53))).toLocaleString()}" title="浏览量"><span class="detail-action-icon is-view" aria-hidden="true"></span><strong>${Number(work.views ?? Math.max(860, Math.round(work.heat * 0.53))).toLocaleString()}</strong></span><button class="detail-action-stat" type="button" data-work-like data-interaction-control data-requires-auth="like" aria-pressed="false"><span class="detail-action-icon is-like" aria-hidden="true"></span><strong data-work-like-count>${Math.max(128, Math.round(work.heat / 55)).toLocaleString()}</strong></button><button class="detail-action-stat" type="button" data-work-favorite data-requires-auth="favorite" aria-pressed="false"><span class="detail-action-icon is-favorite" aria-hidden="true"></span><strong>收藏</strong></button><button class="detail-action-stat" type="button" data-work-share><span class="detail-action-icon is-share" aria-hidden="true"></span><strong>分享</strong></button><button class="detail-action-stat" type="button" data-report-open data-interaction-control><span class="detail-action-icon is-report" aria-hidden="true"></span><strong>举报</strong></button></div></div>
      </aside>
    </article>`;
  };
  const copyWorkShareLink = async (value) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const input = document.createElement("textarea");
        input.value = value;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.append(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      showToast("作品链接已复制");
    } catch {
      showToast("复制失败，请使用浏览器地址栏复制链接", "warning");
    }
  };
  const bindWorkDetailSurface = (root, work, surface) => {
    root.querySelector("[data-work-play]")?.addEventListener("click", (event) => {
      const viewport = event.currentTarget.closest(".video-viewport");
      const active = viewport?.classList.toggle("is-playing");
      event.currentTarget.setAttribute("aria-label", active ? "暂停作品" : "播放作品");
      const status = root.querySelector("[data-play-status]");
      if (status) status.textContent = active ? "播放中 · 00:24 / 00:42" : "已暂停 · 00:24 / 00:42";
    });
    const like = root.querySelector("[data-work-like]");
    if (like) {
      like.dataset.count = String(Math.max(128, Math.round(work.heat / 55)));
      like.addEventListener("click", (event) => {
        if (!actionState.interact || requireAuth({ type: "like", control: event.currentTarget })) return;
        const button = event.currentTarget;
        const active = button.dataset.likeState !== "liked";
        button.dataset.likeState = active ? "liked" : "";
        button.setAttribute("aria-pressed", String(active));
        const count = Number(button.dataset.count || 128) + (active ? 1 : -1);
        button.dataset.count = String(count);
        button.querySelector("[data-work-like-count]").textContent = count.toLocaleString();
      });
    }
    root.querySelector("[data-work-favorite]")?.addEventListener("click", (event) => {
      if (requireAuth({ type: "like", control: event.currentTarget })) return;
      const active = event.currentTarget.dataset.favoriteState !== "collected";
      event.currentTarget.dataset.favoriteState = active ? "collected" : "";
      event.currentTarget.setAttribute("aria-pressed", String(active));
      event.currentTarget.querySelector("strong").textContent = active ? "已收藏" : "收藏";
      showToast(active ? "已加入收藏" : "已取消收藏");
    });
    root.querySelector("[data-work-share]")?.addEventListener("click", () => copyWorkShareLink(new URL(workCanonicalHref(work), window.location.href).href));
    root.querySelector("[data-comment-submit]")?.addEventListener("click", (event) => {
      if (!actionState.interact || requireAuth({ type: "comment" })) return;
      const input = root.querySelector("[data-comment-input]");
      const message = root.querySelector("[data-comment-message]");
      if (!input?.value.trim()) { setInlineMessage(message, "请先写下评论内容", "error"); input?.focus(); return; }
      const button = event.currentTarget;
      setInlineMessage(message, "", "");
      button.disabled = true;
      button.textContent = "发表中…";
      window.setTimeout(() => {
        if (input.value.includes("失败") || state.interaction === "disabled") {
          button.disabled = false;
          button.textContent = "重新发表";
          setInlineMessage(message, "评论没有发布成功，请重试", "error");
          return;
        }
        const list = root.querySelector("[data-comment-list]");
        if (state.comments !== "ready") list.innerHTML = "";
        list.insertAdjacentHTML("afterbegin", `<article class="comment-row compact"><img src="assets/image_assets/1.png" alt="空镜"><div><strong>空镜</strong><p>${escapeWorkMarkup(input.value)}</p><div class="comment-action-line"><span>刚刚</span></div></div></article>`);
        state.comments = "ready";
        updateUrl({ comments: "ready" });
        input.value = "";
        button.disabled = false;
        button.textContent = "发布";
        const count = root.querySelector("[data-work-comment-count]");
        if (count) count.textContent = String(Number(count.textContent || 0) + 1);
        setInlineMessage(message, "", "");
        showToast("评论已发表");
      }, 520);
    });
    root.querySelector("[data-report-open]")?.addEventListener("click", () => {
      if (!actionState.interact || requireAuth({ type: "report" })) return;
      openModal("report");
    });
    root.querySelector("[data-source-view]")?.addEventListener("click", () => showToast("已打开只读创作过程预览"));
    root.querySelectorAll("[data-interaction-control]").forEach((control) => { control.disabled = !actionState.interact; });
    root.querySelector("[data-interaction-disabled]")?.toggleAttribute("hidden", actionState.interact);
  };
  function renderWorkDetailInto(root, work, surface = "page") {
    if (!root || !work) return;
    root.innerHTML = workDetailMarkup(work, surface);
    root.dataset.renderedWorkId = work.workId;
    root.dataset.renderedSubmissionId = work.submissionId;
    const isOwnWork = state.auth === "user" && work.author === "空镜";
    const ownerResultCard = root.querySelector("[data-owner-stage-result-card]");
    if (ownerResultCard) ownerResultCard.hidden = !isOwnWork;
    renderAuthorStageResult();
    const owner = root.querySelector("[data-owner-status]");
    if (owner) {
      const ownerMode = isOwnWork && (state.work === "owner-reviewing" || ["review", "rejected"].includes(state.submission));
      owner.hidden = !ownerMode;
      if (ownerMode) {
        const rejected = state.submission === "rejected";
        owner.innerHTML = `<div><strong>${rejected ? "作品需要修改" : "作品审核中"}</strong><span>${rejected ? "请按退回原因修改并重新提交。" : "审核完成前作品不会公开展示。"}</span></div><a href="${buildHref("./competition-submit.html", { submission: rejected ? "rejected" : "review" })}">${rejected ? "继续修改" : "查看进度"}</a>`;
      }
    }
    const source = root.querySelector("[data-work-source]");
    if (source) {
      const format = work.format || "video";
      const materialConfig = configuredSubmissionMaterials[format] || defaultSubmissionMaterials[format];
      const submittedMaterials = [materialConfig.sourceRequired ? materialConfig.sourceLabel : "", materialConfig.finalLabel].filter(Boolean).join("和");
      const manualCopy = `创作者已提交${submittedMaterials}。`;
      const copy = state.integration === "connected" ? ["创作来源已确认", "作品保留可查看的创作过程摘要。", "查看创作过程"] : state.integration === "invalid" ? ["创作来源暂不可用", "部分公开材料当前无法打开。", ""] : ["创作材料已提交", manualCopy, ""];
      source.innerHTML = `<div><span>创作来源</span><strong>${copy[0]}</strong><p>${copy[1]}</p></div>${copy[2] ? `<button type="button" data-source-view>${copy[2]}</button>` : ""}`;
    }
    bindWorkDetailSurface(root, work, surface);
  }
  const renderStandaloneWorkDetail = () => {
    if (page.dataset.page !== "competition-work") return;
    const work = selectedWork();
    const content = document.querySelector("[data-work-content]");
    const unavailable = document.querySelector("[data-work-unavailable]");
    const visibleWorkState = work ? state.work : "not-found";
    if (!work || ["not-found", "down"].includes(visibleWorkState)) {
      if (content) content.hidden = true;
      if (unavailable) {
        unavailable.hidden = false;
        unavailable.innerHTML = `<img src="resources/icons/remixicon/svg/System/${visibleWorkState === "not-found" ? "error-warning-line" : "lock-line"}.svg" alt=""><h1>${visibleWorkState === "not-found" ? "作品不存在" : "作品暂不可见"}</h1><p>${visibleWorkState === "not-found" ? "作品链接可能已失效，请返回参赛作品继续浏览。" : "该作品目前停止公开展示。"}</p><a class="competition-btn primary" href="${buildHref("./competition-works.html", { work: "public", work_id: null, submission_id: null })}">返回参赛作品</a>`;
      }
      return;
    }
    if (content) content.hidden = false;
    if (unavailable) unavailable.hidden = true;
    document.title = `${work.title} - 多元拾光`;
    renderWorkDetailInto(content, work, "page");
  };
  const renderModalUnavailable = (host, missing = false) => {
    host.innerHTML = `<article class="case-detail-dialog competition-work-detail-dialog competition-work-detail-unavailable" role="dialog" aria-modal="true"><button class="case-detail-close" type="button" data-competition-work-close data-competition-modal-close aria-label="关闭作品详情">关闭</button><section class="competition-unavailable"><img src="resources/icons/remixicon/svg/System/${missing ? "error-warning-line" : "lock-line"}.svg" alt=""><h2>${missing ? "作品不存在" : "作品暂不可见"}</h2><p>${missing ? "作品链接可能已失效。" : "该作品目前停止公开展示。"}</p></section></article>`;
  };
  const openWorkDetail = ({ workId = "", submissionId = "" } = {}, { pushHistory = true, trigger = null } = {}) => {
    if (page.dataset.page !== "competition-works") return;
    const modal = document.querySelector("[data-competition-work-detail-modal]");
    const host = modal?.querySelector("[data-competition-work-detail-host]");
    if (!modal || !host) return;
    const work = resolveWorkIdentity({ workId, submissionId });
    if (!work || ["not-found", "down"].includes(state.work)) renderModalUnavailable(host, !work || state.work === "not-found");
    else renderWorkDetailInto(host, work, "modal");
    if (pushHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set("work_id", work?.workId || workId);
      url.searchParams.set("submission_id", work?.submissionId || submissionId);
      url.searchParams.set("work", "public");
      window.history.pushState({ ...(window.history.state || {}), competitionWorkDetail: true, listScrollY: window.scrollY }, "", url.href);
    }
    if (trigger) lastFocus = trigger;
    openModal("work-detail");
  };
  const hideWorkDetail = () => {
    const modal = document.querySelector("[data-competition-work-detail-modal]");
    if (modal && !modal.hidden) closeModal(modal);
  };
  const canReturnFromWorkDetail = () => {
    if (window.history.length <= 1 || !document.referrer) return false;
    try {
      const previous = new URL(document.referrer);
      return previous.origin === window.location.origin && previous.href !== window.location.href;
    } catch (_error) {
      return false;
    }
  };
  const closeWorkDetail = () => {
    if (window.history.state?.competitionWorkDetail || canReturnFromWorkDetail()) {
      window.history.back();
      return;
    }
    hideWorkDetail();
    const url = new URL(window.location.href);
    url.searchParams.delete("work_id");
    url.searchParams.delete("submission_id");
    window.history.replaceState(window.history.state, "", url.href);
  };
  const syncWorkDetailWithHistory = () => {
    if (page.dataset.page !== "competition-works") return;
    const current = new URLSearchParams(window.location.search);
    const workId = current.get("work_id") || "";
    const submissionId = current.get("submission_id") || "";
    if (workId || submissionId) openWorkDetail({ workId, submissionId }, { pushHistory: false });
    else hideWorkDetail();
  };
  const initReportFlow = () => {
    const confirm = document.querySelector("[data-report-confirm]");
    if (!confirm || confirm.dataset.bound === "true") return;
    confirm.dataset.bound = "true";
    confirm.addEventListener("click", (event) => {
      const modal = event.currentTarget.closest("[data-competition-modal]");
      const reason = modal.querySelector("[data-report-reason]");
      const message = modal.querySelector("[data-report-message]");
      if (!reason.value) { setInlineMessage(message, "请选择举报原因", "error"); reason.focus(); return; }
      event.currentTarget.disabled = true;
      event.currentTarget.textContent = "提交中…";
      window.setTimeout(() => {
        closeModal(modal);
        showToast("举报已提交，我们会尽快核查");
        event.currentTarget.disabled = false;
        event.currentTarget.textContent = "提交举报";
        reason.value = "";
      }, 520);
    });
  };
  const initWorkDetail = () => {
    if (!['competition-work', 'competition-works'].includes(page.dataset.page)) return;
    initReportFlow();
    if (page.dataset.page === "competition-work") {
      renderStandaloneWorkDetail();
      document.querySelector("[data-competition-work-page-close]")?.addEventListener("click", () => {
        if (canReturnFromWorkDetail()) window.history.back();
        else window.location.href = buildHref("./competition-works.html", { work_id: null, submission_id: null, work: "public" });
      });
    }
    if (page.dataset.page === "competition-works") {
      closeWorkDetailFromUi = closeWorkDetail;
      window.addEventListener("popstate", syncWorkDetailWithHistory);
      syncWorkDetailWithHistory();
    }
  };

  const trackRanking = {
    short: [
      ["S-001", 9840, 91.4], ["S-004", 7910, 87.8], ["S-008", 6320, 83.2],
      ["S-010", 5710, 80.6], ["S-011", 5380, 78.4], ["S-012", 5010, 76.9],
    ],
    medium: [
      ["S-002", 8920, 92.1], ["S-005", 7420, 88.7], ["S-009", 5980, 84.9],
      ["S-013", 5540, 82.8], ["S-014", 5210, 79.6], ["S-015", 4860, 77.2],
    ],
    long: [
      ["S-007", 6760, 90.2], ["S-016", 6420, 87.1], ["S-017", 6090, 84.6],
      ["S-018", 5520, 82.4], ["S-019", 5070, 79.8], ["S-020", 4690, 76.5],
    ],
    free: [
      ["S-003", 8560, 91.8], ["S-006", 7080, 88.9], ["S-002", 6610, 85.7],
      ["S-021", 6540, 83.6], ["S-022", 6170, 80.3], ["S-023", 5660, 78.1],
    ],
  };
  const supplementalRankSeeds = [
    ["回声停在清晨", "南屿"], ["漂浮的候车室", "青禾"], ["鲸落之后", "程野"], ["城市睡眠指南", "知夏"],
    ["第七码头", "弦月"], ["纸月亮", "白川"], ["风经过旧站", "迟木"], ["失重花园", "安禾"],
    ["夜航手记", "栖迟"], ["岛屿来信", "远山"], ["记忆修复店", "星野"], ["雨的收藏家", "折枝"],
    ["无人区灯塔", "闻川"], ["明日仍会抵达", "洛一"],
  ];
  Object.keys(trackRanking).forEach((track, trackIndex) => {
    const additions = supplementalRankSeeds.map(([title, author], index) => {
      const rank = index + 7;
      const submissionId = `S-R${trackIndex + 1}-${String(rank).padStart(2, "0")}`;
      const workId = `AIGC-R${trackIndex + 1}-${String(rank).padStart(2, "0")}`;
      const safeCoverIndex = [1, 2, 3, 4, 5, 7, 9, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21][index % 17];
      works.push({ workId, submissionId, title, author, track, heat: 4380 - index * 170 - trackIndex * 30, score: 74.8 - index * 1.15 - trackIndex * .1, cover: `assets/image_assets/${safeCoverIndex}.png`, description: `${title}以影像记录一段被忽略的时间与情绪。`, createdAt: 40 - index });
      return [submissionId, 4380 - index * 170 - trackIndex * 30, 74.8 - index * 1.15 - trackIndex * .1];
    });
    trackRanking[track].push(...additions);
  });
  const rankRows = () => trackRanking[state.track].map(([id, heat, result], index) => ({ rank: index + 1, work: works.find((item) => item.submissionId === id) || works[index], heat, result }));
  const boardMeta = {
    heat: { eyebrow: "参赛排行榜", title: "热度榜", unit: "热度" },
    result: { eyebrow: "获奖结果", title: "获奖名单", unit: "综合分" },
  };
  const boardAvailability = () => {
    if (state.ranking === "error") return "error";
    if (state.ranking === "empty") return "empty";
    if (state.ranking === "not-started") return "locked";
    if (state.board === "heat") return state.ranking === "snapshot" || ["judging", "result-pending", "result"].includes(state.phase) ? "snapshot" : "live";
  if (state.board === "result") {
    if (state.ranking === "published-result" || state.phase === "result") return "published";
    if (state.ranking === "pending-result" || state.phase === "result-pending") return "pending";
    if (["hidden", "not-started"].includes(state.ranking)) return "locked";
    return "published";
  }
    return "locked";
  };

  const renderResultClosure = (availability) => {
    const resultPublished = state.board === "result" && availability === "published";
    const publicNotice = document.querySelector("[data-competition-public-notice]");
    if (publicNotice) publicNotice.hidden = !resultPublished;
  };

  const renderRanking = () => {
    if (page.dataset.page !== "competition-ranking") return;
    const meta = boardMeta[state.board];
    const availability = boardAvailability();
    page.dataset.rankingBoard = state.board;
    page.dataset.rankingAvailability = availability;
    document.querySelector("[data-rank-title]").textContent = meta.title;
    document.querySelectorAll("[data-rank-tab], [data-competition-rank-tab]").forEach((button) => {
      const active = button.dataset.rankTab === state.board;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    const note = document.querySelector("[data-rank-note]");
    const notes = {
      live: "热度每 10 分钟更新：有效浏览 × 1 + 点赞 × 3 + 有效评论 × 5；仅用于作品发现",
      snapshot: "热度为对应阶段结束时的作品发现快照，不参与获奖计算",
      published: "获奖名单依据评委评分产生",
      pending: "获奖名单确认后将在这里公布",
      locked: state.board === "result" ? "获奖名单尚未公布" : "榜单尚未开始",
      empty: "当前赛道暂无符合条件的作品",
      error: "榜单加载失败，请稍后重试",
    };
    if (note) note.textContent = notes[availability];
    renderResultClosure(availability);
    const content = document.querySelector("[data-ranking-content]");
    const stateSurface = document.querySelector("[data-ranking-state]");
    if (["locked", "pending", "empty", "error"].includes(availability)) {
      content.hidden = true;
      stateSurface.hidden = false;
      const icon = availability === "error" ? "System/error-warning-line" : availability === "empty" ? "Business/inbox-2-line" : "System/lock-line";
      const title = availability === "error" ? "榜单加载失败" : availability === "empty" ? "暂无上榜作品" : availability === "pending" ? "获奖名单确认中" : `${meta.title}尚未开放`;
      stateSurface.innerHTML = `<img src="resources/icons/remixicon/svg/${icon}.svg" alt=""><h2>${title}</h2><p>${notes[availability]}</p>${availability === "error" ? '<button class="competition-btn" type="button" data-ranking-retry>重新加载</button>' : ""}`;
      stateSurface.querySelector("[data-ranking-retry]")?.addEventListener("click", () => { state.ranking = "live"; updateUrl({ ranking: "live" }); renderRanking(); });
      return;
    }
    content.hidden = false;
    stateSurface.hidden = true;
    const rows = rankRows();
    const valueOf = (row) => state.board === "heat" ? row.heat.toLocaleString() : row.result.toFixed(1);
    const awardNames = ["冠军", "亚军", "季军"];
    const isPublishedResult = state.board === "result" && availability === "published";
    const authorAvatarOf = (work) => `assets/image_assets/${({ "空镜": 1, "小野": 7, "夏川": 13, "阿青": 1, "司南": 9, "七号": 9, "灵感罐头": 11, "北岛": 12, "一零": 14, "林渡": 4 })[work.author] || 1}.png`;
    const podium = document.querySelector("[data-rank-podium]");
    podium.innerHTML = rows.slice(0, 3).map((row) => {
      const href = buildHref("./competition-work.html", { work_id: row.work.workId, submission_id: row.work.submissionId, track: state.track, work: "public" });
      const badge = isPublishedResult ? awardNames[row.rank - 1] : String(row.rank).padStart(2, "0");
      return `<a class="competition-podium-card rank-${row.rank} ${row.rank === 1 ? "is-first" : ""}" href="${href}" data-competition-link data-community-work-id="${row.work.workId}" data-competition-submission-id="${row.work.submissionId}" data-track="${state.track}"><div class="competition-podium-work-media"><img src="${row.work.cover}" alt="作品《${row.work.title}》"><b class="${isPublishedResult ? "is-award" : ""}">${badge}</b><div class="competition-podium-work-copy"><div><h3>${row.work.title}</h3><p><img class="competition-podium-author-avatar" src="${authorAvatarOf(row.work)}" alt=""><span>${row.work.author}</span></p></div><strong>${valueOf(row)}<small>${meta.unit}</small></strong></div></div></a>`;
    }).join("");
    const list = document.querySelector("[data-rank-list]");
    const listHead = document.querySelector(".competition-rank-list-head");
    listHead.hidden = isPublishedResult;
    list.hidden = false;
    list.innerHTML = rows.slice(3).map((row) => {
      const href = buildHref("./competition-work.html", { work_id: row.work.workId, submission_id: row.work.submissionId, track: state.track, work: "public" });
      const isMine = state.auth === "user" && row.work.author === "空镜";
      return `<a class="competition-rank-row${isMine ? " is-mine" : ""}" href="${href}" data-competition-link data-community-work-id="${row.work.workId}" data-competition-submission-id="${row.work.submissionId}" data-track="${state.track}"><b>${String(row.rank).padStart(2, "0")}</b><img src="${row.work.cover}" alt="作品《${row.work.title}》"><span class="rank-work"><span class="rank-title">${row.work.title}${isMine ? '<em class="competition-rank-own">我的作品</em>' : ""}</span><small>创作者 · ${row.work.author}</small></span><span class="rank-track">${tracks[state.track].label}</span><strong class="competition-heat">${valueOf(row)} <small>${meta.unit}</small></strong></a>`;
    }).join("");
    updateCompetitionLinks();
  };

  const initRanking = () => {
    if (page.dataset.page !== "competition-ranking") return;
    const select = document.querySelector("[data-ranking-track]");
    if (select) select.value = state.track;
    select?.addEventListener("change", () => {
      state.track = select.value;
      updateUrl({ track: state.track });
      renderRanking();
    });
    document.querySelectorAll("[data-rank-tab], [data-competition-rank-tab]").forEach((button) => button.addEventListener("click", () => {
      state.board = button.dataset.rankTab;
      updateUrl({ board: state.board });
      renderRanking();
    }));
    document.querySelector("[data-competition-appeal]")?.addEventListener("click", () => {
      if (requireAuth({ type: "appeal" })) return;
      openModal("appeal");
    });
    document.querySelector("[data-appeal-confirm]")?.addEventListener("click", (event) => {
      const modal = event.currentTarget.closest("[data-competition-modal]");
      const type = modal.querySelector("[data-appeal-type]");
      const description = modal.querySelector("[data-appeal-description]");
      const message = modal.querySelector("[data-appeal-message]");
      if (!type.value) { setInlineMessage(message, "请选择异议类型", "error"); type.focus(); return; }
      if (!description.value.trim()) { setInlineMessage(message, "请说明需要复核的问题", "error"); description.focus(); return; }
      claimState = "appeal-pending";
      updateUrl({ claim: claimState });
      closeModal(modal);
      renderRanking();
      showToast("异议已提交，赛事助手将在 2 个工作日内通过站内信回复");
      type.value = "";
      description.value = "";
      setInlineMessage(message, "", "");
    });
    document.querySelector("[data-claim-action]")?.addEventListener("click", () => {
      if (claimState === "claim-required") {
        if (requireAuth({ type: "claim" })) return;
        openModal("prize-claim");
        return;
      }
      if (claimState === "appeal-pending") { showToast("请在站内信查看异议处理进度", "warning"); return; }
      if (claimState === "pending-delivery") { showToast("资格已核验，当前等待赛事方人工发放权益"); return; }
      if (claimState === "completed") { showToast("权益已发放，发放结果已记录"); }
    });
    document.querySelector("[data-claim-confirm]")?.addEventListener("click", (event) => {
      const modal = event.currentTarget.closest("[data-competition-modal]");
      const displayName = modal.querySelector("[data-claim-display-name]");
      const agreement = modal.querySelector("[data-claim-agreement]");
      const message = modal.querySelector("[data-claim-message]");
      if (!displayName.value.trim()) { setInlineMessage(message, "请填写公开署名", "error"); displayName.focus(); return; }
      if (!agreement.checked) { setInlineMessage(message, "请确认参赛资格与作品信息", "error"); agreement.focus(); return; }
      claimState = "verification";
      updateUrl({ claim: claimState });
      closeModal(modal);
      renderRanking();
      showToast("领奖信息已提交，赛事方将人工核验并通过站内信通知结果");
      setInlineMessage(message, "", "");
    });
    renderRanking();
  };

  const renderGuideAndRules = () => {
    if (!["competition-guide", "competition-rules"].includes(page.dataset.page)) return;
    document.querySelectorAll("[data-guide-phase]").forEach((node) => { node.textContent = phase.label; });
    const cta = document.querySelector("[data-guide-cta]");
    if (cta) {
      if (state.registration === "unregistered" && actionState.register) { cta.textContent = "报名参赛"; cta.href = buildHref("./competition-detail.html"); }
      else if (actionState.submit) { cta.textContent = "提交作品"; cta.href = buildHref("./competition-submit.html"); }
      else { cta.textContent = state.phase === "result" ? "查看获奖名单" : "浏览参赛作品"; cta.href = state.phase === "result" ? buildHref("./competition-ranking.html", { board: "result", ranking: "published-result" }) : buildHref("./competition-works.html"); }
    }
  };

  const renderCompetitionRulePreviewContext = () => {
    if (page.dataset.page !== "competition-rules") return;
    const competitionId = params.get("id") || page.dataset.competitionId || "COMP-2026-AIGC-01";
    const fallbackProfiles = {
      "COMP-2026-AIGC-01": { name:"AIGC 创作挑战赛", publicationState:"published", blankDraft:false },
      "COMP-2026-DRAFT-01": { name:"AI 叙事练习赛", publicationState:"draft", blankDraft:true },
    };
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(`ai666:competition:${competitionId}:public-rule-preview-context`) || "null");
    } catch {
      stored = null;
    }
    const fallback = fallbackProfiles[competitionId] || {
      name:params.get("draftName") || "赛事草稿",
      publicationState:competitionId.includes("DRAFT") ? "draft" : "published",
      blankDraft:competitionId.includes("DRAFT"),
    };
    const context = stored && stored.competitionId === competitionId ? { ...fallback, ...stored } : fallback;
    const name = String(context.name || fallback.name).trim() || "赛事草稿";
    const isDraft = context.publicationState !== "published";
    const isBlankDraft = isDraft && Boolean(context.blankDraft);
    page.dataset.competitionId = competitionId;
    page.dataset.competitionRulePreviewMode = isDraft ? "draft" : "published";
    document.title = `参赛规则 - ${name}`;
    document.querySelectorAll("[data-competition-event-name]").forEach((node) => { node.textContent = name; });
    document.querySelectorAll("[data-competition-brand-lockup]").forEach((link) => { link.setAttribute("aria-label", `${name}赛事主页`); });
    const title = document.querySelector("[data-competition-rules-title]");
    if (title) title.textContent = `${name}规则`;
    const previewState = document.querySelector("[data-competition-rule-preview-state]");
    if (previewState) previewState.hidden = !isDraft;
    if (!isBlankDraft) return;
    const emptyCopy = {
      participation:"尚未配置参与方式与赛道；请先在后台维护报名资格和赛道赛题。",
      eligibility:"尚未配置参赛资格；请先在后台维护报名方式和单用户投稿上限。",
      submission:"尚未配置投稿要求；请先在后台维护投稿内容、文件限制、来源材料与修改阶段。",
      judging:"尚未配置评审维度；请先在后台维护评分规则和最终成绩规则。",
      awards:"尚未配置奖项与权益；请先在后台完成奖项配置与结果履约规则。",
    };
    Object.entries(emptyCopy).forEach(([key, copy]) => {
      const body = document.querySelector(`#${key} > div`);
      if (!body) return;
      [...body.children].filter((node) => node.tagName !== "H2").forEach((node) => node.remove());
      const empty = document.createElement("p");
      empty.className = "competition-rule-empty";
      empty.textContent = copy;
      body.append(empty);
    });
  };

  const renderCompetitionRuleSnapshot = () => {
    if (page.dataset.page !== "competition-rules") return;
    const competitionId = params.get("id") || page.dataset.competitionId || "COMP-2026-AIGC-01";
    const mode = page.dataset.competitionRulePreviewMode === "draft" ? "draft" : "published";
    const snapshot = readCompetitionRuleSnapshot(mode);
    if (!snapshot || snapshot.competitionId !== competitionId || !snapshot.sections) return;
    const resetBody = (key) => {
      const body = document.querySelector(`#${key} > div`);
      if (!body) return null;
      [...body.children].filter((node) => node.tagName !== "H2").forEach((node) => node.remove());
      return body;
    };
    const appendList = (body, items, ordered = false) => {
      const values = (Array.isArray(items) ? items : []).map((item) => String(item || "").trim()).filter(Boolean);
      if (!body || !values.length) return;
      const list = document.createElement(ordered ? "ol" : "ul");
      values.forEach((item) => {
        const row = document.createElement("li");
        row.textContent = item;
        list.append(row);
      });
      body.append(list);
    };
    const appendDefinitions = (body, rows, mapRow) => {
      const values = Array.isArray(rows) ? rows : [];
      if (!body || !values.length) return;
      const list = document.createElement("dl");
      values.forEach((item) => {
        const value = mapRow(item);
        if (!value?.title) return;
        const row = document.createElement("div");
        const title = document.createElement("dt");
        const detail = document.createElement("dd");
        title.textContent = value.title;
        detail.textContent = value.detail || "—";
        row.append(title, detail);
        list.append(row);
      });
      if (list.children.length) body.append(list);
    };
    const appendParagraph = (body, text, attribute = "") => {
      const value = String(text || "").trim();
      if (!body || !value) return;
      const paragraph = document.createElement("p");
      paragraph.textContent = value;
      if (attribute) paragraph.setAttribute(attribute, "");
      body.append(paragraph);
    };
    const appendEmpty = (body, copy) => {
      if (!body || body.children.length > 1) return;
      const empty = document.createElement("p");
      empty.className = "competition-rule-empty";
      empty.textContent = copy;
      body.append(empty);
    };

    const participation = snapshot.sections.participation || {};
    const participationBody = resetBody("participation");
    appendList(participationBody, participation.steps, true);
    appendDefinitions(participationBody, participation.tracks, (track) => ({
      title:`${track.duration || "不限"} · ${track.name || "未命名赛道"}`,
      detail:[track.topic, track.description].filter(Boolean).join("；"),
    }));
    appendParagraph(participationBody, participation.sameWorkRule);
    appendEmpty(participationBody, "尚未配置参与方式与赛道；请先在后台维护报名资格和赛道赛题。");

    const eligibilityBody = resetBody("eligibility");
    appendList(eligibilityBody, snapshot.sections.eligibility?.items);
    appendEmpty(eligibilityBody, "尚未配置参赛资格；请先在后台维护报名方式和单用户投稿上限。");

    const submissionBody = resetBody("submission");
    appendList(submissionBody, snapshot.sections.submission?.items);
    appendEmpty(submissionBody, "尚未配置投稿要求；请先在后台维护投稿内容、文件限制、来源材料与修改阶段。");

    const judging = snapshot.sections.judging || {};
    const judgingBody = resetBody("judging");
    appendDefinitions(judgingBody, judging.dimensions, (dimension) => ({
      title:`${dimension.name || "评分维度"}${dimension.score ? ` · ${dimension.score} 分` : ""}`,
      detail:dimension.description || "—",
    }));
    (Array.isArray(judging.items) ? judging.items : []).forEach((item, index) => appendParagraph(judgingBody, item, index === 1 ? "data-competition-score-composition-public-formula" : ""));
    appendEmpty(judgingBody, "尚未配置评审维度；请先在后台维护评分规则和最终成绩规则。");

    const awards = snapshot.sections.awards || {};
    const awardsBody = resetBody("awards");
    appendDefinitions(awardsBody, awards.awards, (award) => {
      if (award.type === "participation") {
        return {
          title:award.name || "有效参赛奖励",
          detail:`${award.eligibility || "达到有效参赛条件"}，可获得 ${award.benefit || "对应权益"}；每个账号限领 ${award.quota || "1"} 次。${award.stacking || ""}`,
        };
      }
      return { title:award.name || "竞技奖项", detail:`${award.track || "全部赛道"} · ${award.quota || "1"} 名 · ${award.benefit || "待配置"}` };
    });
    appendParagraph(awardsBody, awards.claim, "data-competition-prize-claim");
    appendEmpty(awardsBody, "尚未配置奖项与权益；请先在后台完成奖项配置与结果履约规则。");

    const rightsBody = resetBody("rights");
    appendList(rightsBody, snapshot.sections.rights?.items);
    const violations = snapshot.sections.violations || {};
    const violationsBody = resetBody("violations");
    appendList(violationsBody, violations.items);
    if (violationsBody && violations.assistant?.label && !document.querySelector(".competition-rules-nav [data-competition-assistant]")) {
      const assistant = document.createElement("button");
      assistant.className = "competition-btn secondary small";
      assistant.type = "button";
      assistant.dataset.competitionAssistant = "";
      assistant.setAttribute("aria-haspopup", "dialog");
      assistant.textContent = violations.assistant.label;
      violationsBody.append(assistant);
    }
    page.dataset.competitionRuleSnapshot = mode;
  };

  const renderPublishedRuleSupplements = () => {
    if (page.dataset.page !== "competition-rules") return;
    const competitionId = params.get("id") || page.dataset.competitionId || "COMP-2026-AIGC-01";
    const mode = page.dataset.competitionRulePreviewMode === "draft" ? "draft" : "published";
    let supplements = {};
    try {
      const snapshot = JSON.parse(localStorage.getItem(`ai666:competition:${competitionId}:public-rule-${mode}`) || "null");
      const stored = JSON.parse(localStorage.getItem(`ai666:competition:${competitionId}:public-rule-supplements`) || "{}");
      supplements = snapshot && typeof snapshot.supplements === "object"
        ? snapshot.supplements
        : stored && typeof stored.supplements === "object" ? stored.supplements : {};
    } catch {
      supplements = {};
    }
    ["participation", "eligibility", "submission", "judging", "awards", "rights", "violations"].forEach((key) => {
      const section = document.getElementById(key);
      if (!section) return;
      section.querySelector("[data-competition-rule-supplement]")?.remove();
      const text = String(supplements[key] || "").trim();
      if (!text) return;
      const note = document.createElement("p");
      note.className = "competition-rule-supplement";
      note.dataset.competitionRuleSupplement = key;
      const label = document.createElement("strong");
      label.textContent = "补充说明";
      const content = document.createElement("span");
      content.textContent = text;
      note.append(label, content);
      section.querySelector(":scope > div")?.append(note);
    });
  };

  const initRulesNavigation = () => {
    if (page.dataset.page !== "competition-rules") return;
    const links = [...document.querySelectorAll('.competition-rules-nav a[href^="#"]')];
    const sections = [...document.querySelectorAll(".competition-rules-content > section[id]")];
    if (!links.length || !sections.length) return;

    const setActive = (id) => {
      links.forEach((link) => {
        const relatedSections = String(link.dataset.ruleSections || link.hash.slice(1)).split(/\s+/).filter(Boolean);
        const active = relatedSections.includes(id);
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      const stageLink = links.find((link) => link.classList.contains("is-active"));
      page.dataset.competitionRuleStage = stageLink?.querySelector("b")?.textContent.trim() || "";
    };

    let frame = 0;
    const syncActiveSection = () => {
      frame = 0;
      const marker = Math.min(180, window.innerHeight * .28);
      let current = sections[0];
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= marker) current = section;
      });
      setActive(current.id);
    };
    const queueSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncActiveSection);
    };

    links.forEach((link) => link.addEventListener("click", () => setActive(link.hash.slice(1))));
    window.addEventListener("scroll", queueSync, { passive: true });
    window.addEventListener("resize", queueSync);
    window.addEventListener("hashchange", queueSync);
    setActive(window.location.hash.slice(1) || sections[0].id);
    queueSync();
  };

  const appendVisualWalkthroughRule = () => {
    const grid = document.querySelector("[data-competition-walkthrough] .competition-walkthrough-grid");
    if (!grid || grid.querySelector("[data-competition-visual-rule]")) return;
    const notes = {
      "competition-detail": "首页保留电影感 Hero；我的参赛、进程、赛道、奖项和精选使用同一社区黑蓝底与赛事卡片层级。",
      "competition-works": "作品卡沿用活动中心媒体卡；筛选控件使用统一输入高度、焦点环与移动端单列。",
      "competition-ranking": "前三名保留领奖台层级，后续名次使用社区内容行，不呈现后台表格感。",
      "competition-submit": "主表单为一个连续编辑面，三个编号区块以分隔线划分；说明信息收敛到较深侧栏面。",
      "competition-work": "作品媒体是详情页第一视觉层级，作者、来源、互动和个人结果使用社区内容卡尺度。",
      "competition-guide": "六步以序号、标题和动作形成线性节奏；投稿前检查使用独立强调面，FAQ 保持简洁折叠。",
      "competition-rules": "正文控制可读列宽，目录随滚动标识当前位置；公式、奖项和申诉使用赛事强调面。",
    };
    const item = document.createElement("p");
    item.dataset.competitionVisualRule = "true";
    const title = document.createElement("strong");
    title.textContent = "视觉基线";
    item.append(title, document.createTextNode(`赛事七页统一使用堆叠品牌头部、黑蓝社区底色、金色主行动与薄荷完成状态；${notes[page.dataset.page] || "共享视觉组件保持一致。"}`));
    grid.append(item);
  };

  const initCompetitionHeroMedia = () => {
    if (page.dataset.page !== "competition-detail") return;
    const surface = document.querySelector("[data-competition-hero-media]");
    const video = surface?.querySelector("[data-competition-hero-video]");
    if (!surface || !video) return;
    const source = surface.dataset.videoSrc || video.dataset.src || "";
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 820px)");
    const fallbackToPoster = (releaseSource = true) => {
      video.pause();
      if (releaseSource) {
        video.removeAttribute("src");
        video.load();
      }
      surface.dataset.mediaState = "poster";
      video.hidden = true;
    };
    if (!source || reduceMotionQuery.matches || mobileQuery.matches) {
      fallbackToPoster(false);
      return;
    }
    video.src = source;
    video.hidden = false;
    video.play().then(() => { surface.dataset.mediaState = "playing"; }).catch(fallbackToPoster);
    video.addEventListener("play", () => { surface.dataset.mediaState = "playing"; });
    video.addEventListener("error", fallbackToPoster);
    const handlePlaybackPreferenceChange = () => {
      if (reduceMotionQuery.matches || mobileQuery.matches) fallbackToPoster();
    };
    reduceMotionQuery.addEventListener?.("change", handlePlaybackPreferenceChange);
    mobileQuery.addEventListener?.("change", handlePlaybackPreferenceChange);
  };

  const initSubmitModalLauncher = () => {
    if (page.dataset.page === "competition-submit") return;
    let overlay = null;
    let frame = null;
    let returnFocus = null;
    const closeOverlay = () => {
      overlay?.remove();
      overlay = null;
      frame = null;
      document.body.classList.remove("competition-submit-modal-open");
      returnFocus?.focus();
      returnFocus = null;
    };
    const requestClose = () => {
      if (!frame?.contentWindow) {
        closeOverlay();
        return;
      }
      frame.contentWindow.postMessage({ type: "competition-submit-request-close" }, window.location.origin);
    };
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href*="competition-submit.html"]');
      if (!link || link.target === "_blank" || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (overlay) return;
      returnFocus = link;
      const target = new URL(link.href, window.location.href);
      target.searchParams.set("embed", "1");
      overlay = document.createElement("div");
      overlay.className = "competition-submit-overlay";
      overlay.setAttribute("role", "presentation");
      overlay.innerHTML = '<section class="competition-submit-overlay-card" role="dialog" aria-modal="true" aria-label="作品投稿"><button class="competition-submit-overlay-close" type="button" aria-label="关闭投稿">关闭</button><iframe title="作品投稿" loading="eager"></iframe></section>';
      frame = overlay.querySelector("iframe");
      frame.src = target.href;
      overlay.querySelector("[aria-label='关闭投稿']")?.addEventListener("click", requestClose);
      overlay.addEventListener("click", (clickEvent) => { if (clickEvent.target === overlay) requestClose(); });
      overlay.addEventListener("keydown", (keyEvent) => { if (keyEvent.key === "Escape") requestClose(); });
      document.body.append(overlay);
      document.body.classList.add("competition-submit-modal-open");
      overlay.querySelector("[aria-label='关闭投稿']")?.focus();
    });
    window.addEventListener("message", (event) => {
      if (!overlay || event.origin !== window.location.origin || event.source !== frame?.contentWindow) return;
      if (event.data?.type === "competition-submit-close") {
        closeOverlay();
        return;
      }
      if (event.data?.type !== "competition-submit-navigate" || !event.data.href) return;
      const target = new URL(event.data.href, window.location.href);
      if (target.origin !== window.location.origin) return;
      closeOverlay();
      window.location.href = target.href;
    });
  };

  renderCompetitionRulePreviewContext();
  renderCompetitionRuleSnapshot();
  renderCompetitionPlatformNav();
  initCompetitionCommunityGroup();
  initRegistration();
  applyRootState();
  renderEventState();
  renderPublishedContext();
  renderStageTimeline();
  renderHome();
  initWorks();
  initMySubmissions();
  initSubmit();
  initSubmitModalLauncher();
  initWorkDetail();
  initRanking();
  renderGuideAndRules();
  renderPublishedRuleSupplements();
  initRulesNavigation();
  appendVisualWalkthroughRule();
  initCompetitionHeroMedia();
  updateCompetitionLinks();
  syncHomeAnchorNavigation();
  window.addEventListener("hashchange", syncHomeAnchorNavigation);
});
