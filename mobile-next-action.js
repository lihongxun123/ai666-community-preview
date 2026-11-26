(() => {
  const slot = document.querySelector("[data-mobile-next-action]"),
    mine = document.querySelector("[data-mobile-sign]");
  const tasks = "./mobile-tasks.html",
    points = "./mobile-points.html",
    publish = "./mobile-work-publish.html";
  const samples = {
    newcomer: { name: "新手任务可做", newbie: "active" },
    locked: { name: "新手任务未解锁", newbie: "locked" },
    returning: {
      name: "已完成新手任务 · 七日成长进行中",
      activities: [
        ["image", "ready"],
        ["growth", "active"],
      ],
    },
    prompt: {
      name: "已完成新手任务 · Prompt 共创待参加",
      activities: [["prompt", "ready"]],
    },
    direct: { name: "已完成新手任务 · 暂无可做活动", activities: [] },
    unavailable: { name: "活动规则读取失败", failed: true },
  };
  const activities = {
    growth: ["七日成长", "./mobile-activity-detail.html?activity=seven-day"],
    image: ["生图挑战", "./mobile-campaign-detail.html"],
    prompt: ["Prompt 共创", "./mobile-activity-detail.html?activity=prompt"],
  };
  const key = () =>
    "community.preview.next-action." + Membership.read().accountId;
  const day = (date = new Date()) =>
    new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 10);
  const isSigned = () => Membership.read().user.signedDay === day();
  // Default weekly plan from the released backend. Consecutive days restart on Monday.
  const milestones = { 3: 20, 5: 30, 7: 50 };
  function todayBase() {
    const cursor = new Date(day() + "T12:00:00Z"),
      awards = Membership.read().user.signAwards;
    let streak = 1;
    const weekday = (cursor.getUTCDay() + 6) % 7;
    for (let i = 0; i < weekday; i++) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      if (!Object.hasOwn(awards, cursor.toISOString().slice(0, 10))) break;
      streak++;
    }
    return 20 + (milestones[streak] || 0);
  }
  const sample = () => samples[localStorage.getItem(key())] || samples.newcomer;
  let selector;
  function next() {
    if (!Membership.read().user.loggedIn) return ["新手任务", tasks];
    const state = sample();
    if (state.failed) return ["积分任务", points];
    if (state.newbie) return ["新手任务", tasks];
    if (!isSigned()) return ["每日签到", "#daily-check-in"];
    const list = state.activities || [],
      action =
        list.find((a) => a[1] === "active") ||
        list.find((a) => a[1] === "ready");
    return action ? activities[action[0]] : ["直接发布", publish];
  }
  function render() {
    if (slot) {
      const [label, href] = next();
      slot.querySelector("strong").textContent = label;
      slot.href = href;
    }
    if (mine)
      mine.querySelector("div span").textContent = isSigned()
        ? "今日已签到"
        : "领取签到积分";
    if (selector) selector.value = localStorage.getItem(key()) || "newcomer";
  }
  function open() {
    if (!Membership.read().user.loggedIn) {
      const returnTo = location.pathname.split("/").pop() + "#daily-check-in";
      location.assign(
        "./login.html?" +
          new URLSearchParams({ returnTo, cancelTo: returnTo.split("#")[0] }),
      );
      return;
    }
    if (document.querySelector("[data-week-sign]")) return;
    const panel = document.createElement("dialog");
    panel.className = "released-dialog";
    panel.dataset.weekSign = "";
    panel.innerHTML =
      '<h2>每日签到</h2><div class="released-week" aria-label="本周签到"></div><p>本周连签 3、5、7 天，分别可再得 20、30、50 积分。</p><p role="status"></p><button type="button" class="released-action primary" data-claim>立即签到</button> <button type="button" class="released-action" data-close>关闭</button>';
    const claim = panel.querySelector("[data-claim]"),
      status = panel.querySelector('[role="status"]');
    function calendar() {
      const today = day(),
        start = new Date(today + "T12:00:00Z");
      start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
      const { user } = Membership.read(),
        week = panel.querySelector(".released-week");
      week.replaceChildren();
      for (const label of ["一", "二", "三", "四", "五", "六", "日"]) {
        const date = start.toISOString().slice(0, 10),
          cell = document.createElement("span"),
          value = document.createElement("b");
        cell.textContent = "周" + label;
        cell.title = date;
        value.textContent = Object.hasOwn(user.signAwards, date)
          ? "已签"
          : "＋20";
        if (date === today) cell.setAttribute("aria-current", "date");
        cell.append(value);
        week.append(cell);
        start.setUTCDate(start.getUTCDate() + 1);
      }
      claim.disabled = isSigned();
      claim.textContent = isSigned() ? "今日已签到" : "立即签到";
      status.textContent = isSigned()
        ? "今日已到账 " + user.signAward + " 积分"
        : "今日签到可领 " + Membership.reward(todayBase(), "sign") + " 积分";
    }
    claim.onclick = () => {
      try {
        Membership.sign(todayBase());
        calendar();
        render();
      } catch {
        status.textContent = "签到失败，请重试";
      }
    };
    panel.querySelector("[data-close]").onclick = () => panel.close();
    panel.onclose = () => panel.remove();
    document.body.append(panel);
    calendar();
    panel.showModal();
  }
  slot?.addEventListener("click", (e) => {
    if (next()[1] === "#daily-check-in") {
      e.preventDefault();
      open();
    }
  });
  mine?.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });
  const info = document.querySelector("[data-mobile-walkthrough]");
  if (slot && info) {
    const label = document.createElement("label");
    label.className = "mobile-rule-card";
    label.textContent = "第四格演示账号的任务与活动";
    selector = document.createElement("select");
    selector.className = "released-scenario";
    Object.entries(samples).forEach(([key, s]) =>
      selector.add(new Option(s.name, key)),
    );
    label.append(selector);
    info.append(label);
    selector.onchange = () => {
      localStorage.setItem(key(), selector.value);
      render();
    };
  }
  for (const event of [
    "pageshow",
    "storage",
    "community-membership-updated",
    "membership-changed",
  ])
    window.addEventListener(event, render);
  render();
  if (location.hash === "#daily-check-in") open();
})();
