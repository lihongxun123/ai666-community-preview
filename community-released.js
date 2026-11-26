(async function () {
  const base = new URL(".", document.currentScript.src);
  const page = location.pathname.split("/").pop(),
    params = new URLSearchParams(location.search);
  const load = (name) =>
    new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = new URL(name, base);
      s.onload = resolve;
      s.onerror = reject;
      document.head.append(s);
    });
  if (document.readyState === "loading")
    await new Promise((resolve) =>
      document.addEventListener("DOMContentLoaded", resolve, { once: true }),
    );
  const $ = (s, root = document) => root.querySelector(s);
  const create = (tag, value = "", cls = "") => {
    const el = document.createElement(tag);
    el.textContent = value;
    if (cls) el.className = cls;
    return el;
  };
  const button = (label, action) => {
    const el = create("button", label, "released-action");
    el.type = "button";
    el.onclick = action;
    return el;
  };
  const dialog = (title) => {
    const el = create("dialog", "", "released-dialog");
    el.append(create("h2", title));
    document.body.append(el);
    el.addEventListener("close", () => el.remove(), { once: true });
    el.showModal();
    return el;
  };
  if (!$('link[href$="community-released.css"]')) {
    const link = create("link");
    link.rel = "stylesheet";
    link.href = new URL("community-released.css", base);
    document.head.append(link);
  }
  const mobile = matchMedia("(max-width:767px)").matches;
  const home = () =>
    location.replace(new URL(mobile ? "mobile-home.html" : "index.html", base));
  const workPages = {
    "mobile-image": "mobile-image-detail.html",
    "mobile-video": "mobile-video-detail.html",
  };
  const pcWorks = [
    "case-detail-image",
    "case-detail-video",
    "case-detail-manga",
    "case-detail-prompt-text",
    "case-detail-prompt-media",
  ];
  const linkFor = (key, id) => {
    const url = new URL("share.html", base);
    url.searchParams.set(key, id);
    return url.href;
  };
  const unknown = () => {
    const root = $(".released-form");
    root.replaceChildren(
      create("h1", "内容不存在或暂不可查看"),
      button("返回首页", home),
    );
  };
  async function workStore() {
    if (!window.PreviewWorks) await load("mobile-work-publish.js");
    return window.PreviewWorks;
  }
  if (page === "share.html") {
    const work = params.get("work_no")?.trim(),
      post = params.get("post_no")?.trim();
    if (!work && !post) {
      home();
      return;
    }
    if (work && workPages[work]) {
      location.replace(new URL(workPages[work] + "?shared=1", base));
      return;
    }
    if (work && pcWorks.includes(work)) {
      location.replace(new URL("index.html?shared=1#" + work, base));
      return;
    }
    if (
      post &&
      !work &&
      (/^AIP20260805030[789]$|^AIP202608050310$/.test(post) ||
        /^mobile-post-[1-3]$/.test(post))
    ) {
      const route = post.startsWith("mobile-")
        ? "mobile-community.html?module=flash&"
        : "flash.html?";
      location.replace(
        new URL(route + "shared_post=" + encodeURIComponent(post), base),
      );
      return;
    }
    const item = work && (await (await workStore()).get(work));
    if (!item) {
      unknown();
      return;
    }
    const root = $(".released-form");
    root.replaceChildren(create("h1", item.title), create("p", item.intro));
    for (const file of item.media) {
      const node = create(item.type === "video" ? "video" : "img");
      node.src = typeof file === "string" ? file : URL.createObjectURL(file);
      if (item.type === "video") node.controls = true;
      else node.alt = item.title;
      root.append(node);
    }
    if (item.prompt) root.append(create("p", item.prompt));
    root.append(
      button("复制分享链接", async () => {
        try {
          await navigator.clipboard.writeText(linkFor("work_no", work));
          root.append(create("p", "链接已复制"));
        } catch {
          const field = create("input");
          field.readOnly = true;
          field.value = linkFor("work_no", work);
          root.append(field);
          field.select();
        }
      }),
      button("关闭", home),
    );
    return;
  }
  const mobilePosts = [...document.querySelectorAll(".mobile-flash-post-card")];
  mobilePosts.forEach((card, i) => {
    card.dataset.postNo = "mobile-post-" + (i + 1);
    const action = button("分享", () => {});
    action.dataset.shareAction = "";
    card.querySelector("footer")?.append(action);
  });
  if (params.has("shared_post")) {
    const id = params.get("shared_post"),
      card = [...document.querySelectorAll("[data-post-no]")].find(
        (c) => c.dataset.postNo === id,
      );
    const el = dialog(card ? "闪念详情" : "内容不存在或暂不可查看");
    el.classList.add("released-shared-post");
    if (card) {
      const content = card.cloneNode(true);
      content
        .querySelectorAll(
          "button,details,.flash-actions,.flash-post-actions,footer",
        )
        .forEach((n) => n.remove());
      el.append(content);
    }
    el.append(button("关闭", () => el.close()));
    el.addEventListener("close", home);
  }
  if (params.get("shared") === "1") {
    document.addEventListener(
      "click",
      (event) => {
        if (
          event.target.closest(
            ".case-detail-close,.modal-backdrop,[data-mobile-back]",
          )
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          home();
        }
      },
      true,
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") home();
    });
    window.addEventListener("hashchange", () => {
      if (!pcWorks.includes(location.hash.slice(1))) home();
    });
  }
  document.addEventListener(
    "click",
    async (event) => {
      const trigger = event.target.closest(
        "[data-detail-share-action],[data-share-action],[data-mobile-share]",
      );
      if (!trigger) return;
      const work =
        trigger.closest(".case-detail-modal")?.id ||
        Object.keys(workPages).find((key) => workPages[key] === page);
      const post = trigger.closest("[data-post-no]")?.dataset.postNo;
      if (!work && !post) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const url = linkFor(work ? "work_no" : "post_no", work || post);
      try {
        if (mobile && navigator.share) {
          await navigator.share({ title: document.title, url });
          return;
        }
        await navigator.clipboard.writeText(url);
        const status = create("div", "链接已复制", "mobile-toast is-visible");
        status.setAttribute("role", "status");
        document.body.append(status);
        setTimeout(() => status.remove(), 2000);
      } catch (error) {
        if (error.name !== "AbortError") {
          const el = dialog("分享链接"),
            field = create("input");
          field.value = url;
          field.readOnly = true;
          el.append(
            field,
            button("关闭", () => el.close()),
          );
          field.select();
        }
      }
    },
    true,
  );

  if (!window.Membership) await load("membership-state.js");
  const identity = () => {
    const s = Membership.read();
    return s.user.loggedIn
      ? s.accountId === "demo"
        ? "AI666-U1001"
        : s.accountId
      : null;
  };
  if (page === "mobile-my-works.html") {
    const grid = $('[data-mobile-my-panel="works"] .mobile-work-grid');
    const items = await (await workStore()).all();
    items
      .filter((w) => w.owner === Membership.read().accountId)
      .sort((a, b) => a.created - b.created)
      .forEach((w) => {
        const a = create("a", w.title, "mobile-work-card released-action");
        a.href = linkFor("work_no", w.id);
        grid.prepend(a);
      });
  }
  if (["mobile-my.html", "mobile-home.html"].includes(page))
    await load("mobile-next-action.js");

  const key = "ai666.preview.targeted-notices.v1",
    records = () => JSON.parse(localStorage.getItem(key) || "[]");
  const recipient = (record) =>
    record.recipients.find((r) => r.user_no === identity());
  const listArea =
    page === "mobile-messages.html"
      ? $("#main")
      : page === "message-center.html"
        ? $("[data-message-list]")
        : null;
  const list = create("section");
  list.setAttribute("aria-label", "定向站内通知");
  if (listArea) {
    if (page === "message-center.html") listArea.before(list);
    else listArea.prepend(list);
  }
  let popup = null;
  function render() {
    list.replaceChildren();
    records()
      .filter(recipient)
      .forEach((record) => {
        const action = button(
          (recipient(record).status ? "已读 · " : "未读 · ") + record.title,
          () => open(record.id),
        );
        action.append(
          create(
            "small",
            record.content.slice(0, 90) +
              " · " +
              new Date(record.created_at).toLocaleString("zh-CN"),
          ),
        );
        action.className = "released-notice";
        list.append(action);
      });
  }
  async function open(id) {
    const update = () => {
      const all = records(),
        item = all.find((r) => r.id === id),
        user = item && recipient(item);
      if (!user) return;
      if (!user.status) {
        user.status = 1;
        user.read_at = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(all));
      }
      return item;
    };
    const item = navigator.locks
      ? await navigator.locks.request(key, update)
      : update();
    if (!item || !recipient(item)) return;
    popup?.remove();
    popup = null;
    const el = dialog(item.title);
    el.dataset.noticeFull = "";
    const exit = button("×", () => el.close());
    exit.setAttribute("aria-label", "关闭");
    el.prepend(exit);
    el.append(create("p", item.content));
    el.addEventListener("close", refresh);
    render();
  }
  function notify(item) {
    popup?.remove();
    const el = create("aside", "", "released-bubble");
    el.setAttribute("aria-label", "站内通知提醒");
    document.body.append(el);
    popup = el;
    el.append(
      create("strong", item.title),
      button("查看全文", () => open(item.id)),
      button("稍后查看", () => {
        el.remove();
        popup = null;
      }),
    );
  }
  let current,
    seen = new Set();
  function refresh() {
    const account = identity();
    if (current !== account) {
      if (current)
        sessionStorage.removeItem("community.notice.shown." + current);
      popup?.remove();
      popup = null;
      document.querySelector("[data-notice-full]")?.close();
      current = account;
      seen = new Set(
        JSON.parse(
          sessionStorage.getItem("community.notice.shown." + account) || "[]",
        ),
      );
    }
    render();
    if (
      !account ||
      document.hidden ||
      document.querySelector("dialog[open],.mobile-bottom-sheet.is-open") ||
      popup
    )
      return;
    const unread = records().filter(
      (n) => recipient(n)?.status === 0 && !seen.has(n.id),
    );
    if (!unread.length) return;
    unread.forEach((n) => seen.add(n.id));
    sessionStorage.setItem(
      "community.notice.shown." + account,
      JSON.stringify([...seen]),
    );
    notify(unread[0]);
  }
  async function readAll() {
    function update() {
      const all = records();
      for (const item of all) {
        const r = recipient(item);
        if (r && !r.status) {
          r.status = 1;
          r.read_at = new Date().toISOString();
        }
      }
      localStorage.setItem(key, JSON.stringify(all));
    }
    if (navigator.locks) await navigator.locks.request(key, update);
    else update();
    popup?.remove();
    popup = null;
    render();
  }
  if (listArea) {
    const controls = create("div");
    controls.append(button("刷新", refresh));
    if (page === "mobile-messages.html")
      controls.append(button("全部已读", readAll));
    list.before(controls);
    document
      .querySelector("[data-message-read-all]")
      ?.addEventListener("click", readAll);
  }
  refresh();
  window.addEventListener("community-membership-updated", refresh);
  window.addEventListener("online", refresh);
  document.addEventListener("visibilitychange", refresh);
  window.setInterval(refresh, 30000);
  document.addEventListener("click", (event) => {
    const filter = event.target.closest("[data-message-filter]"),
      channel = event.target.closest("[data-message-channel]");
    if (filter)
      list.hidden = !["all", "0", "5", ""].includes(
        filter.dataset.messageFilter,
      );
    if (channel) list.hidden = channel.dataset.messageChannel !== "message";
    if (
      page === "mobile-messages.html" &&
      event.target.closest(".mobile-home-filter-tab")
    )
      list.hidden = event.target.textContent.trim() === "互动";
  });
  window.addEventListener("storage", (event) => {
    render();
    if (event.key !== key) return;
    const before = new Set(JSON.parse(event.oldValue || "[]").map((n) => n.id));
    const next = records().find(
      (n) => !before.has(n.id) && recipient(n) && !recipient(n).status,
    );
    if (next) refresh();
  });
  window.addEventListener("pageshow", refresh);
})();
