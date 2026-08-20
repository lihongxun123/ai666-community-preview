(() => {
  const body = document.body;
  const params = new URLSearchParams(window.location.search);
  document.querySelectorAll("[data-mobile-walkthrough-review-only]").forEach((trigger) => {
    trigger.hidden = params.get("review") !== "1";
  });
  body.dataset.mobileClean = params.get("clean") === "1" ? "true" : "false";
  if (body.dataset.mobileClean === "true") document.documentElement.classList.add("mobile-clean-document");

  if (body.dataset.mobilePage === "generation-progress") {
    window.location.replace(`./mobile-create.html${params.toString() ? `?${params.toString()}` : ""}`);
    return;
  }

  const showToast = (message) => {
    const toast = document.querySelector("[data-mobile-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  const createLaunchers = [...document.querySelectorAll(".mobile-nav-create")];
  let createActionSheet = null;
  const setCreateActionSheet = (open) => {
    if (!createActionSheet) return;
    createActionSheet.classList.toggle("is-open", open);
    createActionSheet.setAttribute("aria-hidden", open ? "false" : "true");
    createLaunchers.forEach((launcher) => launcher.setAttribute("aria-expanded", open ? "true" : "false"));
  };
  if (createLaunchers.length) {
    createActionSheet = document.createElement("section");
    createActionSheet.id = "mobile-create-action-sheet";
    createActionSheet.className = "mobile-bottom-sheet mobile-create-action-sheet";
    createActionSheet.dataset.mobileCreateActionSheet = "";
    createActionSheet.setAttribute("aria-hidden", "true");
    createActionSheet.innerHTML = `
      <button class="mobile-sheet-backdrop" type="button" data-mobile-create-action-close aria-label="关闭创作方式"></button>
      <div class="mobile-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="mobile-create-action-title">
        <header class="mobile-sheet-head"><h2 id="mobile-create-action-title">选择创作方式</h2><button class="mobile-icon-button" type="button" data-mobile-create-action-close aria-label="关闭创作方式"><img class="mobile-icon" src="resources/icons/remixicon/svg/System/close-line.svg" alt=""></button></header>
        <div class="mobile-create-action-list">
          <a class="mobile-create-action-option" href="./mobile-create.html"><span><img class="mobile-icon" src="resources/icons/remixicon/svg/Design/quill-pen-ai-line.svg" alt=""></span><strong>AIGC 生成</strong><img class="mobile-icon" src="resources/icons/remixicon/svg/Arrows/arrow-right-s-line.svg" alt=""></a>
          <a class="mobile-create-action-option" href="./mobile-community.html?module=flash&amp;compose=1"><span><img class="mobile-icon" src="resources/icons/remixicon/svg/Document/sticky-note-add-line.svg" alt=""></span><strong>发布闪念</strong><img class="mobile-icon" src="resources/icons/remixicon/svg/Arrows/arrow-right-s-line.svg" alt=""></a>
        </div>
      </div>`;
    body.append(createActionSheet);
    createLaunchers.forEach((launcher) => {
      launcher.setAttribute("aria-haspopup", "dialog");
      launcher.setAttribute("aria-controls", "mobile-create-action-sheet");
      launcher.setAttribute("aria-expanded", "false");
      launcher.addEventListener("click", (event) => {
        event.preventDefault();
        setCreateActionSheet(true);
      });
    });
    createActionSheet.querySelectorAll("[data-mobile-create-action-close]").forEach((button) => button.addEventListener("click", () => setCreateActionSheet(false)));
  }

  const updatePressedLabel = (button, pressed) => {
    const idle = button.dataset.idleLabel;
    const active = button.dataset.activeLabel;
    const label = button.querySelector("[data-action-label]");
    if (label && idle && active) label.textContent = pressed ? active : idle;
  };

  document.querySelectorAll("[data-mobile-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const pressed = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", pressed ? "false" : "true");
      updatePressedLabel(button, !pressed);
      showToast(pressed ? (button.dataset.offMessage || "已取消") : (button.dataset.onMessage || "已完成"));
    });
  });

  document.querySelectorAll("[data-mobile-share]").forEach((button) => {
    button.addEventListener("click", async () => {
      const payload = { title: document.title, url: window.location.href };
      try {
        if (navigator.share) {
          await navigator.share(payload);
          return;
        }
        await navigator.clipboard.writeText(payload.url);
        showToast("链接已复制");
      } catch (error) {
        if (error?.name !== "AbortError") showToast("分享失败，请重试");
      }
    });
  });

  document.querySelectorAll("[data-mobile-copy-invite-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = document.querySelector("[data-mobile-invite-code]")?.textContent.trim();
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        showToast("邀请码已复制");
      } catch (error) {
        showToast("复制失败，请长按邀请码复制");
      }
    });
  });

  const inviteRulesSheet = document.querySelector("[data-mobile-invite-rules-sheet]");
  const setInviteRulesSheet = (open) => {
    if (!inviteRulesSheet) return;
    inviteRulesSheet.classList.toggle("is-open", open);
    inviteRulesSheet.setAttribute("aria-hidden", open ? "false" : "true");
  };
  document.querySelectorAll("[data-mobile-invite-rules-open]").forEach((button) => button.addEventListener("click", () => setInviteRulesSheet(true)));
  inviteRulesSheet?.querySelectorAll("[data-mobile-invite-rules-close]").forEach((button) => button.addEventListener("click", () => setInviteRulesSheet(false)));

  const bannerTrack = document.querySelector("[data-mobile-banner-track]");
  const bannerSlides = [...document.querySelectorAll("[data-mobile-banner-slide]")];
  const bannerDots = [...document.querySelectorAll("[data-mobile-banner-dot]")];
  const setActiveBanner = (index) => {
    bannerDots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
  };
  bannerDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number(dot.dataset.mobileBannerDot || 0);
      bannerTrack?.scrollTo({ left: (bannerTrack.clientWidth || 0) * index, behavior: "smooth" });
      setActiveBanner(index);
    });
  });
  let bannerFrame = 0;
  bannerTrack?.addEventListener("scroll", () => {
    if (bannerFrame) return;
    bannerFrame = window.requestAnimationFrame(() => {
      bannerFrame = 0;
      const width = bannerTrack.clientWidth || 1;
      const index = Math.max(0, Math.min(bannerSlides.length - 1, Math.round(bannerTrack.scrollLeft / width)));
      setActiveBanner(index);
    });
  }, { passive: true });

  const appbar = document.querySelector("[data-mobile-appbar]");
  let appbarFrame = 0;
  const syncAppbar = () => {
    appbarFrame = 0;
    appbar?.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  const requestAppbarSync = () => {
    if (appbarFrame) return;
    appbarFrame = window.requestAnimationFrame(syncAppbar);
  };
  syncAppbar();
  window.addEventListener("scroll", requestAppbarSync, { passive: true });

  document.querySelectorAll("[data-mobile-focus-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.mobileFocusTarget);
      if (!target) return;
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(() => target.focus(), 180);
    });
  });

  const setupMobileMasonry = (masonry, cardSelector) => {
    let masonryFrame = 0;
    const syncMasonry = () => {
      masonryFrame = 0;
      if (!masonry) return;
      const cards = [...masonry.querySelectorAll(cardSelector)];
      masonry.classList.remove("is-masonry-ready");
      cards.forEach((card) => card.style.removeProperty("grid-row-end"));
      const visibleCards = cards.filter((card) => !card.hidden);
      const rowGap = Number.parseFloat(getComputedStyle(masonry).rowGap) || 0;
      const rowHeight = 1;
      const heights = visibleCards.map((card) => card.getBoundingClientRect().height);
      masonry.classList.add("is-masonry-ready");
      visibleCards.forEach((card, index) => {
        const span = Math.max(1, Math.ceil((heights[index] + rowGap) / (rowHeight + rowGap)));
        card.style.gridRowEnd = `span ${span}`;
      });
    };
    const requestMasonrySync = () => {
      if (!masonry || masonryFrame) return;
      masonryFrame = window.requestAnimationFrame(syncMasonry);
    };
    window.addEventListener("resize", requestMasonrySync);
    masonry?.querySelectorAll("img").forEach((image) => {
      if (!image.complete) image.addEventListener("load", requestMasonrySync, { once: true });
    });
    document.fonts?.ready.then(requestMasonrySync);
    return requestMasonrySync;
  };

  const homeMasonry = document.querySelector("[data-mobile-home-masonry]");
  const requestHomeMasonrySync = setupMobileMasonry(homeMasonry, ".mobile-work-card");
  const communityMasonry = document.querySelector("[data-mobile-community-masonry]");
  const requestCommunityMasonrySync = setupMobileMasonry(communityMasonry, ".mobile-community-card");

  const applyFeedFilter = () => {
    const active = document.querySelector("[data-mobile-filter].is-active")?.dataset.mobileFilter || "all";
    const query = document.querySelector("[data-mobile-search-input]")?.value.trim().toLowerCase() || "";
    let visibleCount = 0;
    document.querySelectorAll("[data-mobile-content-type]").forEach((card) => {
      const types = (card.dataset.mobileContentType || "").split(/\s+/).filter(Boolean);
      const typeMatch = active === "all" || types.includes(active);
      const textMatch = !query || card.textContent.toLowerCase().includes(query);
      const visible = typeMatch && textMatch;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    const empty = document.querySelector("[data-mobile-filter-empty]");
    if (empty) empty.hidden = visibleCount > 0;
    requestHomeMasonrySync();
    requestCommunityMasonrySync();
  };

  document.querySelectorAll("[data-mobile-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-mobile-filter]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      applyFeedFilter();
    });
  });
  document.querySelector("[data-mobile-search-input]")?.addEventListener("input", applyFeedFilter);
  applyFeedFilter();

  const communityTabs = [...document.querySelectorAll("[data-mobile-community-tab]")];
  const communityPanels = [...document.querySelectorAll("[data-mobile-community-panel]")];
  const setCommunityModule = (moduleName, updateUrl = false) => {
    if (!communityTabs.length || !communityPanels.length) return;
    const next = communityTabs.some((tab) => tab.dataset.mobileCommunityTab === moduleName) ? moduleName : "recommend";
    communityTabs.forEach((tab) => {
      const active = tab.dataset.mobileCommunityTab === next;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    communityPanels.forEach((panel) => { panel.hidden = panel.dataset.mobileCommunityPanel !== next; });
    if (next === "aigc") applyFeedFilter();
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("module", next);
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };
  communityTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setCommunityModule(tab.dataset.mobileCommunityTab, true));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const nextTab = communityTabs[(index + offset + communityTabs.length) % communityTabs.length];
      setCommunityModule(nextTab.dataset.mobileCommunityTab, true);
      nextTab.focus();
    });
  });
  document.querySelectorAll("[data-mobile-community-open-module]").forEach((button) => {
    button.addEventListener("click", () => {
      setCommunityModule(button.dataset.mobileCommunityOpenModule, true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  if (communityTabs.length) setCommunityModule(params.get("compose") === "1" ? "flash" : (params.get("module") || "recommend"));

  const flashComposeSheet = document.querySelector("[data-mobile-flash-compose-sheet]");
  const flashComposeForm = document.querySelector("[data-mobile-flash-compose]");
  if (flashComposeSheet && flashComposeForm) {
    const flashContent = flashComposeForm.querySelector("[data-mobile-flash-compose-content]");
    const flashCounter = flashComposeForm.querySelector("[data-mobile-flash-compose-counter]");
    const flashMediaInput = flashComposeForm.querySelector("[data-mobile-flash-media-input]");
    const flashMediaAdd = flashComposeForm.querySelector("[data-mobile-flash-media-add]");
    const flashMediaCounter = flashComposeForm.querySelector("[data-mobile-flash-media-counter]");
    const flashMediaList = flashComposeForm.querySelector("[data-mobile-flash-media-list]");
    const flashPublish = flashComposeForm.querySelector("[data-mobile-flash-publish]");
    const flashStatus = flashComposeForm.querySelector("[data-mobile-flash-compose-status]");
    const flashMediaFiles = [];
    const flashMediaLimit = 4;
    const flashImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
    const flashVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
    const setFlashComposeSheet = (open, updateUrl = true) => {
      flashComposeSheet.classList.toggle("is-open", open);
      flashComposeSheet.setAttribute("aria-hidden", open ? "false" : "true");
      if (!open && updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.delete("compose");
        history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      }
      if (open) window.setTimeout(() => flashContent?.focus(), 180);
    };
    document.querySelectorAll("[data-mobile-flash-compose-open]").forEach((button) => button.addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("compose", "1");
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      setFlashComposeSheet(true, false);
    }));
    const canPublishFlash = () => Boolean(flashContent?.value.trim() || flashMediaFiles.length);
    const refreshFlashCompose = () => {
      if (flashCounter && flashContent) flashCounter.textContent = `${flashContent.value.length}/600`;
      if (flashMediaCounter) flashMediaCounter.textContent = `${flashMediaFiles.length}/4`;
      if (flashPublish) flashPublish.disabled = !canPublishFlash();
      if (flashMediaAdd) flashMediaAdd.disabled = flashMediaFiles.length >= flashMediaLimit;
      if (canPublishFlash() && flashStatus) flashStatus.textContent = "";
    };
    const renderFlashMedia = () => {
      if (!flashMediaList) return;
      flashMediaList.replaceChildren();
      flashMediaFiles.forEach((item, index) => {
        const holder = document.createElement("div");
        holder.className = "mobile-flash-compose-media-item";
        const preview = document.createElement(item.kind === "video" ? "video" : "img");
        preview.src = item.url;
        if (item.kind === "video") {
          preview.muted = true;
          preview.playsInline = true;
          preview.setAttribute("aria-label", item.file.name);
        } else preview.alt = item.file.name;
        const remove = document.createElement("button");
        remove.className = "mobile-flash-compose-media-remove";
        remove.type = "button";
        remove.setAttribute("aria-label", `移除 ${item.file.name}`);
        remove.innerHTML = '<img class="mobile-icon" src="resources/icons/remixicon/svg/System/close-line.svg" alt="">';
        remove.addEventListener("click", () => {
          const [removed] = flashMediaFiles.splice(index, 1);
          if (removed?.url) URL.revokeObjectURL(removed.url);
          renderFlashMedia();
        });
        holder.append(preview, remove);
        flashMediaList.append(holder);
      });
      refreshFlashCompose();
    };
    flashContent?.addEventListener("input", refreshFlashCompose);
    flashMediaAdd?.addEventListener("click", () => flashMediaInput?.click());
    flashMediaInput?.addEventListener("change", () => {
      const selectedFiles = [...(flashMediaInput.files || [])];
      for (const file of selectedFiles) {
        if (flashMediaFiles.length >= flashMediaLimit) break;
        const isImage = flashImageTypes.has(file.type);
        const isVideo = flashVideoTypes.has(file.type);
        if (!isImage && !isVideo) {
          if (flashStatus) flashStatus.textContent = "文件格式不支持";
          continue;
        }
        flashMediaFiles.push({ file, kind: isVideo ? "video" : "image", url: URL.createObjectURL(file) });
      }
      flashMediaInput.value = "";
      renderFlashMedia();
    });
    flashComposeSheet.querySelectorAll("[data-mobile-flash-compose-close]").forEach((button) => button.addEventListener("click", () => setFlashComposeSheet(false)));
    flashComposeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!canPublishFlash()) {
        if (flashStatus) flashStatus.textContent = "正文或媒体至少填写一项";
        return;
      }
      if (flashPublish) {
        flashPublish.disabled = true;
        flashPublish.textContent = "发布中…";
      }
      window.setTimeout(() => {
        showToast("闪念已提交，正在审核中");
        setFlashComposeSheet(false);
        if (flashPublish) flashPublish.textContent = "发布闪念";
      }, 420);
    });
    if (params.get("compose") === "1") setFlashComposeSheet(true, false);
    window.addEventListener("beforeunload", () => flashMediaFiles.forEach((item) => URL.revokeObjectURL(item.url)));
    refreshFlashCompose();
  }

  const tutorialSheet = document.querySelector("[data-mobile-tutorial-sheet]");
  const setTutorialSheet = (open, sourceButton = null) => {
    if (!tutorialSheet) return;
    tutorialSheet.classList.toggle("is-open", open);
    tutorialSheet.setAttribute("aria-hidden", open ? "false" : "true");
    if (open && sourceButton) {
      const title = sourceButton.dataset.tutorialTitle || "教程预览";
      const meta = sourceButton.dataset.tutorialMeta || "官方教程";
      const image = sourceButton.dataset.tutorialImage || "assets/image_assets/tutorial-cover-TU000101.jpg";
      const titleNode = tutorialSheet.querySelector("[data-mobile-tutorial-title]");
      const metaNode = tutorialSheet.querySelector("[data-mobile-tutorial-meta]");
      const imageNode = tutorialSheet.querySelector("[data-mobile-tutorial-image]");
      if (titleNode) titleNode.textContent = title;
      if (metaNode) metaNode.textContent = meta;
      if (imageNode) {
        imageNode.src = image;
        imageNode.alt = `${title}封面`;
      }
    }
  };
  document.querySelectorAll("[data-mobile-tutorial-open]").forEach((button) => button.addEventListener("click", () => setTutorialSheet(true, button)));
  tutorialSheet?.querySelectorAll("[data-mobile-tutorial-close]").forEach((button) => button.addEventListener("click", () => setTutorialSheet(false)));

  const myContentTabs = [...document.querySelectorAll("[data-mobile-my-tab]")];
  const myContentPanels = [...document.querySelectorAll("[data-mobile-my-panel]")];
  const myContentTitle = document.querySelector("[data-mobile-my-content-title]");
  const myFlashTab = document.querySelector('[data-mobile-my-tab="flash"]');
  const setMyContentTab = (tabName, updateHash = false) => {
    if (!myContentTabs.length || !myContentPanels.length) return;
    const next = myContentTabs.some((tab) => tab.dataset.mobileMyTab === tabName) ? tabName : "works";
    if (myContentTitle) myContentTitle.textContent = next === "favorites" ? "我的收藏" : "我的内容";
    if (myFlashTab) myFlashTab.hidden = next === "favorites";
    myContentTabs.forEach((tab) => {
      const active = tab.dataset.mobileMyTab === next;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
    myContentPanels.forEach((panel) => { panel.hidden = panel.dataset.mobileMyPanel !== next; });
    if (updateHash) history.replaceState(null, "", next === "works" ? window.location.pathname : `#${next}`);
  };
  myContentTabs.forEach((tab) => tab.addEventListener("click", () => setMyContentTab(tab.dataset.mobileMyTab, true)));
  if (myContentTabs.length) {
    setMyContentTab(window.location.hash.slice(1) || "works");
    window.addEventListener("hashchange", () => setMyContentTab(window.location.hash.slice(1) || "works"));
  }

  document.querySelector("[data-mobile-profile-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    showToast("资料已保存");
    window.setTimeout(() => window.location.assign("./mobile-my.html"), 650);
  });

  const activityDetail = document.querySelector("[data-mobile-activity-detail]");
  if (activityDetail) {
    const activityKey = params.get("activity") || "prompt";
    const activityData = {
      prompt: {
        title: "Prompt 共创计划",
        status: "进行中",
        reward: "最高可得 3,000 积分",
        progress: "0/2",
        description: "分享经过验证的 Prompt，让更多人直接复用你的创作方法。每日发布奖励最高 100 积分，活动内自动发放积分最高 3,000 积分。",
        cover: "assets/image_assets/activity-live-prompt.png",
        action: "./mobile-create.html?source=prompt&mode=image",
        actionLabel: "立即参与",
        tasks: [
          { name: "发布带图 Prompt", description: "每天前 2 条满足要求的 Prompt 作品 · 进度 0/2", reward: "+50 积分" },
          { name: "首页推荐加奖", description: "内容被推荐至首页 · 进度 0/1", reward: "+500 积分" },
        ],
      },
      "seven-day": {
        title: "七日成长",
        status: "进行中",
        reward: "最高可得 300 积分",
        progress: "0/7",
        description: "完成新手任务后开启七日成长挑战，连续完成每日任务赢取积分。",
        cover: "assets/image_assets/activity-live-growth.png",
        action: "./mobile-home.html",
        actionLabel: "开始任务",
        tasks: [
          { name: "浏览 3 条 AIGC 内容", description: "第 1 天 · 进度 0/3", reward: "+20 积分" },
          { name: "复制 3 条 Prompt", description: "第 2 天 · 进度 0/3", reward: "+30 积分" },
          { name: "收藏 3 个 AI 作品", description: "第 3 天 · 进度 0/3", reward: "+30 积分" },
          { name: "点赞或评论 5 条内容", description: "第 4 天 · 进度 0/5", reward: "+40 积分" },
          { name: "转发 3 个 AI 作品", description: "第 5 天 · 进度 0/3", reward: "+50 积分" },
          { name: "转发 1 条社区闪念", description: "第 6 天 · 进度 0/1", reward: "+60 积分" },
          { name: "发布 1 个 AI 作品", description: "第 7 天 · 进度 0/1", reward: "+70 积分" },
        ],
      },
    };
    const data = activityData[activityKey] || activityData.prompt;
    const promptChoiceSheet = document.querySelector("[data-mobile-prompt-choice-sheet]");
    const promptPublishSheet = document.querySelector("[data-mobile-prompt-publish-sheet]");
    const promptPublishForm = document.querySelector("[data-mobile-prompt-publish-form]");
    const setPromptSheet = (sheet, open) => {
      if (!sheet) return;
      sheet.classList.toggle("is-open", open);
      sheet.setAttribute("aria-hidden", open ? "false" : "true");
    };
    const bindings = {
      "[data-mobile-activity-title]": data.title,
      "[data-mobile-activity-status]": data.status,
      "[data-mobile-activity-reward]": data.reward,
      "[data-mobile-activity-progress]": data.progress,
      "[data-mobile-activity-description]": data.description,
    };
    Object.entries(bindings).forEach(([selector, value]) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = value;
    });
    const cover = document.querySelector("[data-mobile-activity-cover]");
    if (cover) { cover.src = data.cover; cover.alt = data.title; }
    document.querySelectorAll("[data-mobile-activity-action]").forEach((action) => {
      action.href = data.action;
      const icon = action.querySelector(".mobile-icon");
      action.textContent = "";
      if (icon) action.append(icon);
      action.append(data.actionLabel);
      if (activityKey === "prompt") {
        action.addEventListener("click", (event) => {
          event.preventDefault();
          setPromptSheet(promptChoiceSheet, true);
        });
      }
    });
    const taskList = document.querySelector("[data-mobile-activity-task-list]");
    if (taskList) {
      taskList.innerHTML = data.tasks.map((task) => `<article><span class="mobile-status-badge">待完成</span><div><h3>${task.name}</h3><p>${task.description}</p></div><strong>${task.reward}</strong></article>`).join("");
    }
    if (promptChoiceSheet && promptPublishSheet && promptPublishForm) {
      promptChoiceSheet.querySelectorAll("[data-mobile-prompt-choice-close]").forEach((button) => button.addEventListener("click", () => setPromptSheet(promptChoiceSheet, false)));
      promptChoiceSheet.querySelector("[data-mobile-prompt-direct-publish]")?.addEventListener("click", () => {
        setPromptSheet(promptChoiceSheet, false);
        setPromptSheet(promptPublishSheet, true);
      });
      promptPublishSheet.querySelectorAll("[data-mobile-prompt-publish-close]").forEach((button) => button.addEventListener("click", () => setPromptSheet(promptPublishSheet, false)));
      const promptTitle = promptPublishForm.querySelector("[data-mobile-prompt-publish-title-input]");
      const promptContent = promptPublishForm.querySelector("[data-mobile-prompt-publish-content]");
      const promptModel = promptPublishForm.querySelector("[data-mobile-prompt-publish-model]");
      const promptMedia = promptPublishForm.querySelector("[data-mobile-prompt-publish-media]");
      const promptMediaLabel = promptPublishForm.querySelector("[data-mobile-prompt-publish-media-label]");
      const promptError = promptPublishForm.querySelector("[data-mobile-prompt-publish-error]");
      promptMedia?.addEventListener("change", () => {
        const file = promptMedia.files?.[0];
        if (promptMediaLabel && file) promptMediaLabel.textContent = file.name;
        if (promptError && file) promptError.textContent = "";
      });
      promptPublishForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!promptTitle?.value.trim()) {
          if (promptError) promptError.textContent = "请填写作品标题";
          promptTitle?.focus();
          return;
        }
        if (!promptContent?.value.trim()) {
          if (promptError) promptError.textContent = "请填写 Prompt 内容";
          promptContent?.focus();
          return;
        }
        if (!promptModel?.value) {
          if (promptError) promptError.textContent = "请选择关联模型";
          promptModel?.focus();
          return;
        }
        if (!promptMedia?.files?.[0]) {
          if (promptError) promptError.textContent = "请上传案例图片或视频";
          promptMedia?.focus();
          return;
        }
        setPromptSheet(promptPublishSheet, false);
        showToast("Prompt 作品已提交审核");
      });
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        setPromptSheet(promptChoiceSheet, false);
        setPromptSheet(promptPublishSheet, false);
      });
    }
    document.title = `${data.title} - 多元拾光`;
  }

  const exchangePage = document.querySelector("[data-mobile-exchange-page]");
  if (exchangePage) {
    const balanceNode = exchangePage.querySelector("[data-mobile-store-balance]");
    const productCards = [...exchangePage.querySelectorAll("[data-mobile-redeem-product]")];
    const confirmSheet = document.querySelector("[data-mobile-exchange-confirm-sheet]");
    const successSheet = document.querySelector("[data-mobile-exchange-success-sheet]");
    const confirmButton = document.querySelector("[data-mobile-exchange-confirm]");
    const confirmLabel = document.querySelector("[data-mobile-exchange-confirm-label]");
    const error = document.querySelector("[data-mobile-exchange-error]");
    let availablePoints = Number(balanceNode?.dataset.balance || balanceNode?.textContent || 0);
    let selectedProduct = null;
    let selectedTrigger = null;
    let redeeming = false;

    const setExchangeSheet = (sheet, open) => {
      if (!sheet) return;
      sheet.classList.toggle("is-open", open);
      sheet.setAttribute("aria-hidden", open ? "false" : "true");
    };
    const productFromCard = (card) => ({
      id: card?.dataset.productId || "",
      name: card?.dataset.productName || "商品权益",
      price: Number(card?.dataset.productPrice || 0),
      site: card?.dataset.productSite || "其他商品",
      description: card?.dataset.productDescription || "--",
    });
    const updateProductAvailability = () => {
      productCards.forEach((card) => {
        const button = card.querySelector("[data-mobile-redeem-open]");
        const product = productFromCard(card);
        const disabled = !product.id || product.price > availablePoints;
        if (button) {
          button.disabled = disabled;
          button.textContent = disabled ? "积分不足" : "兑换";
        }
      });
    };
    const updateBalance = () => {
      if (balanceNode) {
        balanceNode.textContent = String(availablePoints);
        balanceNode.dataset.balance = String(availablePoints);
      }
      updateProductAvailability();
    };
    const closeConfirm = () => {
      if (redeeming) return;
      setExchangeSheet(confirmSheet, false);
      if (error) error.textContent = "";
      selectedTrigger?.focus();
    };
    const closeSuccess = () => {
      setExchangeSheet(successSheet, false);
      selectedTrigger?.focus();
    };
    const openConfirm = (card, trigger) => {
      const product = productFromCard(card);
      if (!product.id) {
        showToast("商品信息不完整，暂时无法兑换");
        return;
      }
      if (product.price > availablePoints) {
        showToast(`还差 ${product.price - availablePoints} 积分`);
        return;
      }
      selectedProduct = product;
      selectedTrigger = trigger;
      const bindings = {
        "[data-mobile-exchange-confirm-site]": product.site,
        "[data-mobile-exchange-confirm-name]": product.name,
        "[data-mobile-exchange-confirm-description]": product.description,
        "[data-mobile-exchange-current-balance]": `${availablePoints} 积分`,
        "[data-mobile-exchange-price]": `${product.price} 积分`,
        "[data-mobile-exchange-after-balance]": `${availablePoints - product.price} 积分`,
      };
      Object.entries(bindings).forEach(([selector, value]) => {
        const node = confirmSheet?.querySelector(selector);
        if (node) node.textContent = value;
      });
      if (error) error.textContent = "";
      setExchangeSheet(confirmSheet, true);
      window.setTimeout(() => confirmButton?.focus(), 80);
    };

    productCards.forEach((card) => {
      const trigger = card.querySelector("[data-mobile-redeem-open]");
      trigger?.addEventListener("click", () => openConfirm(card, trigger));
    });
    confirmSheet?.querySelectorAll("[data-mobile-exchange-confirm-close]").forEach((button) => button.addEventListener("click", closeConfirm));
    successSheet?.querySelectorAll("[data-mobile-exchange-success-close]").forEach((button) => button.addEventListener("click", closeSuccess));
    confirmButton?.addEventListener("click", () => {
      if (!selectedProduct || redeeming) return;
      if (selectedProduct.price > availablePoints) {
        if (error) error.textContent = `积分不足，还差 ${selectedProduct.price - availablePoints} 积分`;
        return;
      }
      redeeming = true;
      confirmButton.disabled = true;
      if (confirmLabel) confirmLabel.textContent = "兑换中…";
      window.setTimeout(() => {
        availablePoints = Math.max(0, availablePoints - selectedProduct.price);
        updateBalance();
        const successName = successSheet?.querySelector("[data-mobile-exchange-success-product]");
        const successSummary = successSheet?.querySelector("[data-mobile-exchange-success-summary]");
        if (successName) successName.textContent = selectedProduct.name;
        if (successSummary) successSummary.textContent = `已扣除 ${selectedProduct.price} 积分，剩余 ${availablePoints} 积分。`;
        sessionStorage.setItem("mobile-exchange:recent", JSON.stringify({
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
        }));
        setExchangeSheet(confirmSheet, false);
        setExchangeSheet(successSheet, true);
        redeeming = false;
        confirmButton.disabled = false;
        if (confirmLabel) confirmLabel.textContent = "确认兑换";
      }, 520);
    });
    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || redeeming) return;
      if (successSheet?.classList.contains("is-open")) closeSuccess();
      else if (confirmSheet?.classList.contains("is-open")) closeConfirm();
    });
    updateProductAvailability();
  }

  const exchangeRecordList = document.querySelector("[data-mobile-exchange-record-list]");
  if (exchangeRecordList) {
    try {
      const recentRecord = JSON.parse(sessionStorage.getItem("mobile-exchange:recent") || "null");
      if (recentRecord?.id && recentRecord?.name && Number(recentRecord.price) > 0) {
        const card = document.createElement("article");
        card.className = "mobile-exchange-record-card is-recent";
        card.dataset.mobileExchangeRecord = "";
        card.dataset.mobileExchangeStatus = "success";
        card.dataset.mobileExchangeProductId = String(recentRecord.id);
        card.innerHTML = `<div class="mobile-exchange-record-head"><h2></h2><span class="mobile-status-badge is-success">兑换成功</span></div><div class="mobile-exchange-record-meta"><span>刚刚</span><span>积分兑换</span><strong></strong></div>`;
        const name = card.querySelector("h2");
        const points = card.querySelector("strong");
        if (name) name.textContent = recentRecord.name;
        if (points) points.textContent = `−${Number(recentRecord.price)} 积分`;
        exchangeRecordList.prepend(card);
      }
    } catch (error) {
      console.warn("Unable to restore the latest exchange record", error);
    }
  }

  document.querySelectorAll("[data-mobile-toast-message]").forEach((button) => {
    button.addEventListener("click", () => showToast(button.dataset.mobileToastMessage));
  });

  const pointsFilters = document.querySelectorAll("[data-mobile-points-filter]");
  const pointsRecords = document.querySelectorAll("[data-mobile-points-record]");
  const pointsRecordGroups = document.querySelectorAll(".mobile-points-record-group");
  const pointsRecordEmpty = document.querySelector("[data-mobile-points-record-empty]");
  pointsFilters.forEach((button) => {
    button.addEventListener("click", () => {
      const active = button.dataset.mobilePointsFilter;
      pointsFilters.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-selected", selected ? "true" : "false");
      });
      pointsRecords.forEach((record) => {
        record.hidden = active !== "all" && record.dataset.mobilePointsRecord !== active;
      });
      pointsRecordGroups.forEach((group) => {
        group.hidden = [...group.querySelectorAll("[data-mobile-points-record]")].every((record) => record.hidden);
      });
      if (pointsRecordEmpty) pointsRecordEmpty.hidden = [...pointsRecords].some((record) => !record.hidden);
    });
  });

  document.querySelector("[data-mobile-checkin]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    if (button.dataset.checked === "true") {
      showToast("今日已签到");
      return;
    }
    button.dataset.checked = "true";
    button.textContent = "今日已签到";
    const points = document.querySelector("[data-mobile-points-value]");
    if (points) points.textContent = String(Number(points.textContent) + 20);
    showToast("签到成功，积分 +20");
  });

  const commentSheet = document.querySelector("[data-mobile-comment-sheet]");
  const setCommentSheet = (open) => {
    if (!commentSheet) return;
    commentSheet.classList.toggle("is-open", open);
    commentSheet.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) window.setTimeout(() => commentSheet.querySelector("input")?.focus(), 180);
  };
  document.querySelectorAll("[data-mobile-comments-open]").forEach((button) => button.addEventListener("click", () => setCommentSheet(true)));
  document.querySelectorAll("[data-mobile-comments-close]").forEach((button) => button.addEventListener("click", () => setCommentSheet(false)));

  document.querySelector("[data-mobile-comment-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector("input");
    if (!input?.value.trim()) return;
    const list = document.querySelector("[data-mobile-comment-list]");
    if (list) {
      const article = document.createElement("article");
      article.className = "mobile-comment";
      article.innerHTML = `<img src="assets/image_assets/1.png" alt=""><div class="mobile-comment-copy"><strong>我</strong><p></p></div>`;
      article.querySelector("p").textContent = input.value.trim();
      list.prepend(article);
    }
    input.value = "";
    showToast("评论已发布");
  });

  document.querySelectorAll("[data-mobile-back]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const fallback = button.dataset.fallback || "./mobile-community.html";
      if (window.history.length > 1) window.history.back();
      else window.location.href = fallback;
    });
  });

  const walkthrough = document.querySelector("[data-mobile-walkthrough]");
  const setWalkthrough = (open) => {
    if (!walkthrough) return;
    walkthrough.classList.toggle("is-open", open);
    walkthrough.setAttribute("aria-hidden", open ? "false" : "true");
  };
  document.querySelector("[data-mobile-walkthrough-open]")?.addEventListener("click", () => setWalkthrough(true));
  document.querySelector("[data-mobile-walkthrough-close]")?.addEventListener("click", () => setWalkthrough(false));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setCommentSheet(false);
    setWalkthrough(false);
    setCreateActionSheet(false);
    setInviteRulesSheet(false);
    document.querySelector("[data-mobile-flash-compose-sheet]")?.querySelector("[data-mobile-flash-compose-close]")?.click();
    setTutorialSheet(false);
  });

  const createWorkspace = document.querySelector("[data-mobile-create-workspace]");
  const createComposer = document.querySelector("[data-mobile-create-composer]");
  if (createWorkspace && createComposer) {
    const createPrompt = createComposer.querySelector("[data-mobile-create-prompt]");
    const createCount = createComposer.querySelector("[data-mobile-create-prompt-count]");
    const createLimit = createComposer.querySelector("[data-mobile-create-prompt-limit]");
    const createError = createComposer.querySelector("[data-mobile-create-error]");
    const createModeInput = createComposer.querySelector("[data-mobile-create-mode-input]");
    const createAttachment = createComposer.querySelector("[data-mobile-create-attachment]");
    const createInputRow = createComposer.querySelector(".mobile-create-input-row");
    const createSettingsSummary = createComposer.querySelector("[data-mobile-create-settings-summary]");
    const createSettingsCost = createComposer.querySelector("[data-mobile-create-settings-cost]");
    const createEmpty = createWorkspace.querySelector("[data-mobile-create-empty]");
    const createSource = createWorkspace.querySelector("[data-mobile-create-source]");
    const settingsSheet = document.querySelector("[data-mobile-create-settings-sheet]");
    const historySheet = document.querySelector("[data-mobile-create-history-sheet]");
    const requestedCreateMode = params.get("mode");
    const createState = {
      mode: ["image", "script", "video"].includes(requestedCreateMode) ? requestedCreateMode : "image",
      image: { model: "Flux Pro 1.1", cost: 20, ratio: "1:1" },
      script: { model: "gemini-3-flash-preview", cost: 8, format: "Markdown 文本" },
      video: { model: "Seedance 2.0", cost: 64, ratio: "16:9", duration: "8 秒" },
    };
    const sourceType = params.get("source") || "";
    const sourceData = {
      "same-work:image": {
        kind: "同款来源",
        title: "凤冠神女",
        meta: "Flux Pro 1.1 · 1:1",
        cover: "assets/image_assets/15.jpg",
        prompt: "凤冠神女站在暗红色殿堂入口，金色逆光勾勒轮廓，电影感人物海报。",
      },
      "same-work:video": {
        kind: "同款来源",
        title: "海灯守望",
        meta: "Seedance 2.0 · 16:9 · 8 秒",
        cover: "assets/image_assets/4.png",
        prompt: "海边灯塔被薄雾包围，镜头缓慢抬升，最后停在灯塔亮起的瞬间。",
      },
      "campaign:image": {
        kind: "活动创作",
        title: "AI 生图创作挑战",
        meta: "图片生成 · 活动投稿",
        cover: "assets/image_assets/activity-image-challenge-c02e.webp",
        prompt: "",
      },
      "competition:image": {
        kind: "活动创作",
        title: "AIGC 创作挑战赛",
        meta: "图片生成 · 活动投稿",
        cover: "assets/competition/aigc-competition-hero-ocean-pod.png",
        prompt: "",
      },
      "prompt:image": {
        kind: "Prompt 共创",
        title: "Prompt 共创计划",
        meta: "图片生成 · Prompt 投稿",
        cover: "assets/image_assets/activity-prompt-cocreate-cover-c02e.png",
        prompt: "",
      },
      "prompt:script": {
        kind: "Prompt 共创",
        title: "Prompt 共创计划",
        meta: "剧本创作 · Prompt 投稿",
        cover: "assets/image_assets/activity-prompt-cocreate-cover-c02e.png",
        prompt: "",
      },
    };

    const setCreateSheet = (sheet, open) => {
      if (!sheet) return;
      sheet.classList.toggle("is-open", open);
      sheet.setAttribute("aria-hidden", open ? "false" : "true");
    };
    const syncCreatePrompt = () => {
      if (!createPrompt) return;
      createPrompt.style.height = "auto";
      createPrompt.style.height = `${Math.min(createPrompt.scrollHeight, 96)}px`;
      if (createCount) createCount.textContent = String(createPrompt.value.length);
      if (createPrompt.value.trim() && createError) createError.textContent = "";
    };
    const syncCreateSummary = () => {
      const state = createState[createState.mode];
      if (createSettingsSummary) {
        createSettingsSummary.textContent = createState.mode === "video"
          ? `${state.model} · ${state.ratio} · ${state.duration}`
          : createState.mode === "script"
            ? `${state.model} · ${state.format}`
            : `${state.model} · ${state.ratio}`;
      }
      if (createSettingsCost) createSettingsCost.textContent = `预计消耗 ${state.cost} 积分`;
    };
    const syncCreateMode = (mode) => {
      createState.mode = ["image", "script", "video"].includes(mode) ? mode : "image";
      if (createModeInput) createModeInput.value = createState.mode;
      if (createPrompt) {
        const promptConfig = {
          image: { placeholder: "描述你想生成的图片", limit: 1000 },
          script: { placeholder: "输入故事设定、人物关系或短片想法", limit: 5000 },
          video: { placeholder: "描述你想生成的视频", limit: 1000 },
        }[createState.mode];
        createPrompt.placeholder = promptConfig.placeholder;
        createPrompt.maxLength = promptConfig.limit;
        if (createPrompt.value.length > promptConfig.limit) createPrompt.value = createPrompt.value.slice(0, promptConfig.limit);
        if (createLimit) createLimit.textContent = String(promptConfig.limit);
        syncCreatePrompt();
      }
      if (createAttachment) {
        createAttachment.hidden = createState.mode === "script";
        const attachmentLabel = createAttachment.classList.contains("is-selected")
          ? (createState.mode === "video" ? "移除首帧图片" : "移除参考图")
          : (createState.mode === "video" ? "添加首帧图片" : "添加参考图");
        createAttachment.setAttribute("aria-label", attachmentLabel);
        createAttachment.setAttribute("title", attachmentLabel);
      }
      createInputRow?.classList.toggle("is-script", createState.mode === "script");
      createComposer.querySelectorAll("[data-mobile-create-mode]").forEach((button) => {
        const selected = button.dataset.mobileCreateMode === createState.mode;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      document.querySelectorAll("[data-mobile-create-setting-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.mobileCreateSettingPanel !== createState.mode;
      });
      syncCreateSummary();
    };
    const renderCreateSource = () => {
      if (!createSource || !sourceType) return;
      const data = sourceData[`${sourceType}:${createState.mode}`];
      if (!data) {
        createSource.hidden = true;
        if (createEmpty) createEmpty.hidden = false;
        return;
      }
      createSource.hidden = false;
      if (createEmpty) createEmpty.hidden = true;
      const cover = createSource.querySelector("[data-mobile-create-source-cover]");
      const kind = createSource.querySelector("[data-mobile-create-source-kind]");
      const title = createSource.querySelector("[data-mobile-create-source-title]");
      const meta = createSource.querySelector("[data-mobile-create-source-meta]");
      if (cover) { cover.src = data.cover; cover.alt = data.title; }
      if (kind) kind.textContent = data.kind;
      if (title) title.textContent = data.title;
      if (meta) meta.textContent = data.meta;
      if (createPrompt && data.prompt) createPrompt.value = data.prompt;
      syncCreatePrompt();
    };

    createComposer.querySelectorAll("[data-mobile-create-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        syncCreateMode(button.dataset.mobileCreateMode);
        renderCreateSource();
      });
    });
    document.querySelectorAll("[data-mobile-create-choice-group]").forEach((group) => {
      group.querySelectorAll("[data-mobile-create-choice]").forEach((button) => {
        button.addEventListener("click", () => {
          group.querySelectorAll("[data-mobile-create-choice]").forEach((item) => item.classList.toggle("is-selected", item === button));
          const key = group.dataset.mobileCreateChoiceGroup;
          if (key === "video-ratio") createState.video.ratio = button.dataset.mobileCreateChoice;
          else createState[createState.mode][key] = button.dataset.mobileCreateChoice;
          syncCreateSummary();
        });
      });
    });
    document.querySelectorAll("[data-mobile-create-setting-panel]").forEach((panel) => {
      panel.querySelectorAll("[data-mobile-create-model]").forEach((button) => {
        button.addEventListener("click", () => {
          const selectedModel = button.dataset.mobileCreateModel;
          const selectedCost = Number(button.dataset.mobileCreateCost);
          if (!selectedModel || !Number.isFinite(selectedCost)) return;
          panel.querySelectorAll("[data-mobile-create-model]").forEach((item) => {
            const selected = item === button;
            item.classList.toggle("is-selected", selected);
            item.setAttribute("aria-pressed", selected ? "true" : "false");
            const stateIcon = item.querySelector(":scope > .mobile-icon");
            if (stateIcon) stateIcon.alt = selected ? "已选择" : "";
          });
          const mode = panel.dataset.mobileCreateSettingPanel;
          createState[mode].model = selectedModel;
          createState[mode].cost = selectedCost;
          syncCreateSummary();
        });
      });
    });
    createAttachment?.addEventListener("click", () => {
      const selected = createAttachment.classList.toggle("is-selected");
      createAttachment.setAttribute("aria-pressed", selected ? "true" : "false");
      createAttachment.setAttribute("aria-label", selected ? (createState.mode === "video" ? "移除首帧图片" : "移除参考图") : (createState.mode === "video" ? "添加首帧图片" : "添加参考图"));
      createAttachment.setAttribute("title", createAttachment.getAttribute("aria-label"));
      showToast(selected ? (createState.mode === "video" ? "已添加首帧图片" : "已添加参考图") : "已移除图片");
    });
    document.querySelector("[data-mobile-create-settings-open]")?.addEventListener("click", () => setCreateSheet(settingsSheet, true));
    document.querySelectorAll("[data-mobile-create-settings-close]").forEach((button) => button.addEventListener("click", () => setCreateSheet(settingsSheet, false)));
    document.querySelector("[data-mobile-create-history-open]")?.addEventListener("click", () => setCreateSheet(historySheet, true));
    document.querySelectorAll("[data-mobile-create-history-close]").forEach((button) => button.addEventListener("click", () => setCreateSheet(historySheet, false)));
    createPrompt?.addEventListener("input", syncCreatePrompt);
    const createTaskStates = {
      queue: { status: "排队中 · 18%", title: (kind) => `正在等待${kind}生成`, meta: (model) => `${model} · 任务后台继续`, action: "刷新状态" },
      running: { status: "生成中 · 68%", title: (kind) => `正在生成${kind}`, meta: (model) => `${model} · 任务后台继续`, action: "刷新状态" },
      success: { status: "生成成功", title: (kind) => `${kind}已生成`, meta: (model) => `${model} · 点击预览查看结果`, action: "查看结果" },
      failed: { status: "生成失败", title: () => "请调整提示词后重试", meta: () => "本次未生成作品", action: "返回修改" },
      unknown: { status: "状态待确认", title: (kind) => `${kind}任务仍在处理`, meta: (model) => `${model} · 可稍后刷新`, action: "刷新状态" },
    };
    const createResultUrl = (mode, model) => {
      const query = new URLSearchParams({ mode });
      if (model) query.set("model", model);
      if (sourceType) query.set("source", sourceType);
      return `./mobile-generation-result.html?${query.toString()}`;
    };
    const syncCreateTaskUrl = ({ mode, state, prompt, model }) => {
      const query = new URLSearchParams({ mode, state, prompt, model });
      if (sourceType) query.set("source", sourceType);
      window.history.replaceState(null, "", `${window.location.pathname}?${query.toString()}`);
    };
    const appendCreateTask = (submittedPrompt, initialState = "running", { scroll = false, restored = false } = {}) => {
      const taskMode = createState.mode;
      const taskKind = taskMode === "video" ? "视频" : taskMode === "script" ? "剧本" : "图片";
      const taskModel = restored && params.get("model") ? params.get("model") : createState[taskMode].model;
      let taskState = createTaskStates[initialState] ? initialState : "running";
      const createThread = createWorkspace.querySelector(".mobile-create-thread");
      const userTurn = document.createElement("article");
      userTurn.className = "mobile-create-turn is-user";
      const userPrompt = document.createElement("p");
      userPrompt.textContent = submittedPrompt;
      const userMeta = document.createElement("small");
      userMeta.textContent = taskMode === "script" ? "剧本创作" : `${taskKind}生成`;
      userTurn.append(userPrompt, userMeta);

      const taskTurn = document.createElement("article");
      taskTurn.className = "mobile-create-turn is-task";
      taskTurn.dataset.mobileCreateTask = "";
      const taskPreview = document.createElement("button");
      taskPreview.className = `mobile-create-task-preview${taskMode === "video" ? " is-video" : taskMode === "script" ? " is-script" : ""}`;
      taskPreview.type = "button";
      taskPreview.hidden = true;
      const taskPreviewContent = document.createElement(taskMode === "script" ? "article" : "img");
      if (taskMode === "script") {
        taskPreviewContent.className = "mobile-create-script-preview";
        taskPreviewContent.innerHTML = "<span>Markdown 预览</span><strong>雨夜霓虹街头 · 分镜设定</strong><p>主角在雨幕中确认追踪者，镜头切入手部道具和远处剪影。</p><ul><li>人物与冲突已拆解</li><li>三段分镜节奏已生成</li></ul>";
      } else {
        taskPreviewContent.src = taskMode === "video" ? "assets/image_assets/4.png" : "assets/image_assets/15.jpg";
        taskPreviewContent.alt = `${taskKind}生成结果预览`;
      }
      const taskPreviewLabel = document.createElement("span");
      taskPreviewLabel.className = "mobile-create-task-preview-label";
      const taskPreviewIcon = document.createElement("img");
      taskPreviewIcon.className = "mobile-icon";
      taskPreviewIcon.src = "resources/icons/remixicon/svg/System/eye-line.svg";
      taskPreviewIcon.alt = "";
      taskPreviewLabel.append(taskPreviewIcon, document.createTextNode("查看结果"));
      taskPreview.append(taskPreviewContent, taskPreviewLabel);

      const taskIcon = document.createElement("span");
      taskIcon.className = "mobile-create-task-icon";
      const taskIconImage = document.createElement("img");
      taskIconImage.className = "mobile-icon";
      taskIconImage.src = "resources/icons/remixicon/svg/Design/magic-line.svg";
      taskIconImage.alt = "";
      taskIcon.append(taskIconImage);
      const taskCopy = document.createElement("span");
      taskCopy.className = "mobile-create-task-copy";
      const taskStatus = document.createElement("small");
      taskStatus.className = "mobile-create-task-status";
      const taskTitle = document.createElement("strong");
      const taskMeta = document.createElement("span");
      taskCopy.append(taskStatus, taskTitle, taskMeta);
      const taskAction = document.createElement("button");
      taskAction.className = "mobile-create-task-action";
      taskAction.type = "button";
      const taskActionIcon = document.createElement("img");
      taskActionIcon.className = "mobile-icon";
      taskActionIcon.alt = "";
      taskAction.append(taskActionIcon);
      taskTurn.append(taskPreview, taskIcon, taskCopy, taskAction);

      const openTaskResult = () => {
        if (taskState !== "success") {
          showToast("生成完成后可查看结果");
          return;
        }
        window.location.href = createResultUrl(taskMode, taskModel);
      };
      const renderCreateTask = () => {
        const state = createTaskStates[taskState];
        taskTurn.dataset.state = taskState;
        taskStatus.textContent = state.status;
        const scriptStateTitles = {
          queue: "正在等待剧本创作",
          running: "正在拆解故事与分镜",
          success: "剧本已生成",
          failed: "请调整故事设定后重试",
          unknown: "剧本任务仍在处理",
        };
        taskTitle.textContent = taskMode === "script" ? scriptStateTitles[taskState] : state.title(taskKind);
        taskMeta.textContent = state.meta(taskModel);
        taskPreview.hidden = taskState !== "success";
        taskActionIcon.src = taskState === "success"
          ? "resources/icons/remixicon/svg/System/eye-line.svg"
          : "resources/icons/remixicon/svg/System/refresh-line.svg";
        taskAction.setAttribute("aria-label", state.action);
        syncCreateTaskUrl({ mode: taskMode, state: taskState, prompt: submittedPrompt, model: taskModel });
      };
      taskPreview.addEventListener("click", openTaskResult);
      taskAction.addEventListener("click", () => {
        if (taskState === "success") {
          openTaskResult();
          return;
        }
        if (taskState === "failed") {
          createPrompt.value = submittedPrompt;
          syncCreatePrompt();
          createPrompt.focus();
          showToast("已恢复原提示词");
          return;
        }
        taskState = "success";
        renderCreateTask();
        showToast("生成完成，可点击结果预览");
      });
      renderCreateTask();
      if (createEmpty) createEmpty.hidden = true;
      if (createThread) {
        const turnAnchor = createThread.querySelector("[data-mobile-create-empty]");
        createThread.insertBefore(userTurn, turnAnchor);
        createThread.insertBefore(taskTurn, turnAnchor);
      }
      createPrompt.value = "";
      syncCreatePrompt();
      if (scroll) taskTurn.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    createComposer.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!createPrompt?.value.trim()) {
        if (createError) createError.textContent = "请输入提示词";
        createPrompt?.focus();
        return;
      }
      const submittedPrompt = createPrompt.value.trim();
      appendCreateTask(submittedPrompt, "running", { scroll: true });
      showToast(createState.mode === "script" ? "剧本创作任务已创建" : "生成任务已创建");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      setCreateSheet(settingsSheet, false);
      setCreateSheet(historySheet, false);
    });
    const restoredModel = params.get("model");
    if (restoredModel) {
      const restoredPanel = [...document.querySelectorAll("[data-mobile-create-setting-panel]")]
        .find((panel) => panel.dataset.mobileCreateSettingPanel === createState.mode);
      const restoredModelButton = [...(restoredPanel?.querySelectorAll("[data-mobile-create-model]") || [])]
        .find((button) => button.dataset.mobileCreateModel === restoredModel);
      if (restoredModelButton) {
        createState[createState.mode].model = restoredModel;
        createState[createState.mode].cost = Number(restoredModelButton.dataset.mobileCreateCost);
        restoredPanel.querySelectorAll("[data-mobile-create-model]").forEach((button) => {
          const selected = button === restoredModelButton;
          button.classList.toggle("is-selected", selected);
          button.setAttribute("aria-pressed", selected ? "true" : "false");
          const stateIcon = button.querySelector(":scope > .mobile-icon");
          if (stateIcon) stateIcon.alt = selected ? "已选择" : "";
        });
      }
    }
    syncCreateMode(createState.mode);
    renderCreateSource();
    const restoredPrompt = params.get("prompt") || (params.get("state")
      ? (createState.mode === "video"
        ? "雷云中金龙与白虎对峙，镜头环绕战场。"
        : createState.mode === "script"
          ? "雨夜霓虹街头，少年发现自己被跟踪，手中藏着一件不能暴露的关键道具。"
          : "凤冠神女站在金色逆光中，电影感人物海报。")
      : "");
    if (restoredPrompt) {
      createPrompt.value = restoredPrompt;
      syncCreatePrompt();
      appendCreateTask(restoredPrompt, params.get("state") || "running", { restored: true });
    } else {
      syncCreatePrompt();
    }
  }

  const campaignChoiceSheet = document.querySelector("[data-mobile-campaign-choice-sheet]");
  const campaignUploadSheet = document.querySelector("[data-mobile-campaign-upload-sheet]");
  const campaignUploadForm = document.querySelector("[data-mobile-campaign-upload-form]");
  if (campaignChoiceSheet && campaignUploadSheet && campaignUploadForm) {
    const campaignUploadInput = campaignUploadForm.querySelector("[data-mobile-campaign-upload-input]");
    const campaignUploadPreview = campaignUploadForm.querySelector("[data-mobile-campaign-upload-preview]");
    const campaignUploadLabel = campaignUploadForm.querySelector("[data-mobile-campaign-upload-label]");
    const campaignUploadTitle = campaignUploadForm.querySelector("[data-mobile-campaign-upload-title]");
    const campaignUploadDescription = campaignUploadForm.querySelector("[data-mobile-campaign-upload-description]");
    const campaignUploadError = campaignUploadForm.querySelector("[data-mobile-campaign-upload-error]");
    let campaignUploadObjectUrl = "";
    const setCampaignSheet = (sheet, open) => {
      sheet.classList.toggle("is-open", open);
      sheet.setAttribute("aria-hidden", open ? "false" : "true");
    };
    document.querySelectorAll("[data-mobile-campaign-participate]").forEach((button) => button.addEventListener("click", () => setCampaignSheet(campaignChoiceSheet, true)));
    campaignChoiceSheet.querySelectorAll("[data-mobile-campaign-choice-close]").forEach((button) => button.addEventListener("click", () => setCampaignSheet(campaignChoiceSheet, false)));
    campaignChoiceSheet.querySelector("[data-mobile-campaign-direct-upload]")?.addEventListener("click", () => {
      setCampaignSheet(campaignChoiceSheet, false);
      setCampaignSheet(campaignUploadSheet, true);
    });
    campaignUploadSheet.querySelectorAll("[data-mobile-campaign-upload-close]").forEach((button) => button.addEventListener("click", () => setCampaignSheet(campaignUploadSheet, false)));
    campaignUploadInput?.addEventListener("change", () => {
      const file = campaignUploadInput.files?.[0];
      if (!file) return;
      if (campaignUploadObjectUrl) URL.revokeObjectURL(campaignUploadObjectUrl);
      campaignUploadObjectUrl = URL.createObjectURL(file);
      if (campaignUploadPreview) {
        campaignUploadPreview.src = campaignUploadObjectUrl;
        campaignUploadPreview.hidden = false;
      }
      if (campaignUploadLabel) campaignUploadLabel.textContent = file.name;
      if (campaignUploadError) campaignUploadError.textContent = "";
    });
    campaignUploadForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = campaignUploadTitle?.value.trim() || "";
      const description = campaignUploadDescription?.value.trim() || "";
      const file = campaignUploadInput?.files?.[0];
      if (!file) {
        if (campaignUploadError) campaignUploadError.textContent = "请选择要投稿的原创图片";
        campaignUploadInput?.focus();
        return;
      }
      if (title.length < 4) {
        if (campaignUploadError) campaignUploadError.textContent = "作品标题不少于 4 个字";
        campaignUploadTitle?.focus();
        return;
      }
      if (description.length < 30) {
        if (campaignUploadError) campaignUploadError.textContent = "作品说明不少于 30 个字";
        campaignUploadDescription?.focus();
        return;
      }
      setCampaignSheet(campaignUploadSheet, false);
      showToast("作品已提交活动审核");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      setCampaignSheet(campaignChoiceSheet, false);
      setCampaignSheet(campaignUploadSheet, false);
    });
  }

  document.querySelectorAll("[data-mobile-choice-group]").forEach((group) => {
    const name = group.dataset.choiceName;
    const form = group.closest("form");
    const ensureValue = () => {
      if (!name || !form) return;
      let hidden = form.querySelector(`input[type="hidden"][name="${name}"]`);
      if (!hidden) {
        hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = name;
        form.append(hidden);
      }
      hidden.value = group.querySelector("[data-mobile-choice].is-selected")?.dataset.mobileChoice || "";
    };
    ensureValue();
    group.querySelectorAll("[data-mobile-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        group.querySelectorAll("[data-mobile-choice]").forEach((item) => item.classList.toggle("is-selected", item === button));
        ensureValue();
      });
    });
  });

  document.querySelectorAll("[data-mobile-upload]").forEach((button) => {
    button.addEventListener("click", () => {
      const uploaded = button.classList.toggle("is-uploaded");
      const label = button.querySelector("[data-mobile-upload-label]");
      if (label) label.textContent = uploaded ? "已添加参考图" : "上传图片";
      showToast(uploaded ? "已添加参考图" : "已移除参考图");
    });
  });

  document.querySelectorAll("[data-mobile-prompt]").forEach((input) => {
    const count = input.closest(".mobile-form-section")?.querySelector("[data-mobile-prompt-count]");
    const syncCount = () => {
      if (count) count.textContent = String(input.value.length);
    };
    if (params.get("prompt")) {
      input.value = params.get("prompt");
    } else if (params.get("source") === "same-work") {
      input.value = body.dataset.mobilePage === "create-video"
        ? "海边灯塔被薄雾包围，镜头缓慢抬升，最后停在灯塔亮起的瞬间。"
        : "凤冠神女站在暗红色殿堂入口，金色逆光勾勒轮廓，电影感人物海报。";
    }
    syncCount();
    input.addEventListener("input", syncCount);
  });

  document.querySelectorAll("[data-mobile-generator-form]").forEach((form) => {
    const generationMode = form.dataset.generatorMode === "video" ? "video" : "image";
    const generationKind = generationMode === "video" ? "视频" : "图片";
    const generationModel = generationMode === "video" ? "Seedance 2.0" : "Flux Pro 1.1";
    const generationSource = params.get("source") || "";
    const taskCard = document.querySelector("[data-mobile-inline-generation]");
    const badge = taskCard?.querySelector("[data-mobile-inline-generation-badge]");
    const stateTitle = taskCard?.querySelector("[data-mobile-inline-generation-state]");
    const stateMessage = taskCard?.querySelector("[data-mobile-inline-generation-message]");
    const progress = taskCard?.querySelector("[data-mobile-inline-generation-progress]");
    const preview = taskCard?.querySelector("[data-mobile-inline-generation-preview]");
    const previewLabel = taskCard?.querySelector("[data-mobile-inline-generation-preview-label]");
    const spinner = taskCard?.querySelector("[data-mobile-inline-generation-spinner]");
    const model = taskCard?.querySelector("[data-mobile-inline-generation-model]");
    const taskAction = taskCard?.querySelector("[data-mobile-inline-generation-action]");
    const taskActionLabel = taskCard?.querySelector("[data-mobile-inline-generation-action-label]");
    const submitButton = document.querySelector(`[data-mobile-generator-submit][form="${form.id}"]`);
    const submitLabel = submitButton?.querySelector("[data-mobile-generator-submit-label]");
    const costLabel = submitButton?.closest(".mobile-form-action-bar")?.querySelector(".mobile-cost span");
    let generationState = params.get("state") || "";
    const stateMap = {
      queue: { badge: "排队中", badgeClass: "is-running", title: `正在等待${generationKind}生成`, message: "当前进度 18%", progress: 18, action: "刷新状态" },
      running: { badge: "生成中", badgeClass: "is-running", title: `正在生成${generationKind}`, message: "已完成 68%", progress: 68, action: "刷新状态" },
      success: { badge: "生成成功", badgeClass: "is-success", title: `${generationKind}已生成`, message: "点击结果预览进入结果页", progress: 100, action: "查看结果" },
      failed: { badge: "生成失败", badgeClass: "is-warning", title: "生成失败", message: "内容未通过安全校验，请调整提示词", progress: 100, action: "返回修改" },
      unknown: { badge: "状态未知", badgeClass: "is-warning", title: "状态暂不可确认", message: "任务仍在后台处理，可稍后刷新", progress: 42, action: "刷新状态" },
    };
    const resultUrl = () => {
      const query = new URLSearchParams({ mode: generationMode });
      if (generationSource) query.set("source", generationSource);
      return `./mobile-generation-result.html?${query.toString()}`;
    };
    const syncTaskUrl = () => {
      const query = new URLSearchParams(new FormData(form));
      if (generationState) query.set("state", generationState);
      query.set("model", generationModel);
      if (generationSource) query.set("source", generationSource);
      window.history.replaceState(null, "", `${window.location.pathname}?${query.toString()}`);
    };
    const renderTask = ({ focus = false } = {}) => {
      if (!taskCard || !generationState) {
        if (taskCard) taskCard.hidden = true;
        if (submitButton) submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = "发起生成";
        if (costLabel) costLabel.textContent = "预计 20 积分";
        return;
      }
      const data = stateMap[generationState] || stateMap.running;
      taskCard.hidden = false;
      taskCard.dataset.state = generationState;
      if (badge) {
        badge.textContent = data.badge;
        badge.className = `mobile-status-badge ${data.badgeClass}`;
      }
      if (stateTitle) stateTitle.textContent = data.title;
      if (stateMessage) stateMessage.textContent = data.message;
      if (progress) progress.style.width = `${data.progress}%`;
      if (model) model.textContent = `${params.get("model") || generationModel} · ${generationKind}生成`;
      if (taskActionLabel) taskActionLabel.textContent = data.action;
      if (spinner) spinner.hidden = generationState === "success" || generationState === "failed";
      if (previewLabel) previewLabel.hidden = generationState !== "success";
      if (preview) {
        const ready = generationState === "success";
        preview.setAttribute("aria-disabled", ready ? "false" : "true");
        preview.setAttribute("aria-label", ready ? `查看${generationKind}生成结果` : `${generationKind}生成中，结果暂不可查看`);
      }
      if (submitButton) submitButton.disabled = generationState === "running" || generationState === "queue" || generationState === "unknown";
      if (submitLabel) submitLabel.textContent = generationState === "success" ? "再次生成" : generationState === "failed" ? "调整后重试" : "生成中";
      if (costLabel) costLabel.textContent = generationState === "success" ? "结果已生成" : generationState === "failed" ? "本次未生成" : "任务生成中";
      if (focus) taskCard.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const openResult = () => {
      if (generationState !== "success") {
        showToast("生成完成后可查看结果");
        return;
      }
      window.location.href = resultUrl();
    };
    if (generationState) renderTask();
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const prompt = form.querySelector("[data-mobile-prompt]");
      const error = form.querySelector("[data-mobile-generator-error]");
      if (!prompt?.value.trim()) {
        if (error) error.textContent = "请输入提示词";
        prompt?.focus();
        return;
      }
      if (error) error.textContent = "";
      generationState = "running";
      syncTaskUrl();
      renderTask({ focus: true });
      showToast("生成任务已创建，可留在当前页查看进度");
    });
    preview?.addEventListener("click", openResult);
    taskAction?.addEventListener("click", () => {
      if (generationState === "success") {
        openResult();
        return;
      }
      if (generationState === "failed") {
        generationState = "";
        syncTaskUrl();
        renderTask();
        form.querySelector("[data-mobile-prompt]")?.focus();
        return;
      }
      generationState = "success";
      syncTaskUrl();
      renderTask();
      showToast("生成完成，可点击结果预览");
    });
  });

  const resultScreen = document.querySelector("[data-mobile-result-screen]");
  if (resultScreen) {
    document.documentElement.classList.add("mobile-result-document");
    const requestedResultMode = params.get("mode");
    const resultMode = ["image", "script", "video"].includes(requestedResultMode) ? requestedResultMode : "image";
    const resultSource = params.get("source") || "";
    const resultModel = params.get("model") || "";
    const activitySources = new Set(["campaign", "competition", "prompt"]);
    const activityResult = activitySources.has(resultSource);
    const image = document.querySelector("[data-mobile-result-image]");
    const video = document.querySelector("[data-mobile-result-video]");
    const script = document.querySelector("[data-mobile-result-script]");
    const resultMedia = document.querySelector(".mobile-result-media");
    const title = document.querySelector("[data-mobile-result-title]");
    const meta = document.querySelector("[data-mobile-result-meta]");
    const prompt = document.querySelector("[data-mobile-result-prompt]");
    const promptRegion = document.querySelector("[data-mobile-result-prompt-region]");
    const promptToggle = document.querySelector("[data-mobile-result-prompt-toggle]");
    const promptToggleLabel = document.querySelector("[data-mobile-result-prompt-toggle-label]");
    const retry = document.querySelector("[data-mobile-result-retry]");
    if (resultMode === "image" && resultModel && meta) meta.textContent = `${resultModel} · 3:4`;
    if (resultMode === "video") {
      if (image) image.hidden = true;
      if (video) video.hidden = false;
      if (title) title.textContent = "海灯守望";
      if (meta) meta.textContent = `${resultModel || "Seedance 2.0"} · 16:9 · 8 秒`;
      if (prompt) prompt.textContent = "暮色中的海边灯塔被潮湿薄雾包围，远处海浪反射出零碎的冷蓝色月光。镜头从礁石与翻涌浪花开始，缓慢向上抬升并绕过塔身，掠过被海风吹动的旧旗与斑驳墙面。最后灯塔暖黄色光束点亮，在雾中旋转扫过海面，画面停留在光束与远方船影交汇的瞬间，整体保持克制、孤独又温暖的电影质感。";
    }
    if (resultMode === "script") {
      if (image) image.hidden = true;
      if (video) video.hidden = true;
      if (script) script.hidden = false;
      resultMedia?.classList.add("is-script");
      if (title) title.textContent = "雨夜霓虹街头 · 分镜设定";
      if (meta) meta.textContent = `${resultModel || "gemini-3-flash-preview"} · Markdown 文本`;
      if (prompt) prompt.textContent = "雨夜霓虹街头，少年发现自己被跟踪，手中藏着一件不能暴露的关键道具。请拆解人物关系、核心冲突、三幕节奏和可执行分镜，并保留悬念式结尾。";
    }
    if (retry) {
      const retryQuery = new URLSearchParams({ mode: resultMode });
      if (resultModel) retryQuery.set("model", resultModel);
      if (resultSource) retryQuery.set("source", resultSource);
      retry.href = `./mobile-create.html?${retryQuery.toString()}`;
    }
    promptToggle?.addEventListener("click", () => {
      const expanded = promptToggle.getAttribute("aria-expanded") === "true";
      promptToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      promptRegion?.setAttribute("aria-expanded", expanded ? "false" : "true");
      if (promptToggleLabel) promptToggleLabel.textContent = expanded ? "展开创作信息" : "收起创作信息";
    });
    const resultPrimary = document.querySelector("[data-mobile-result-primary]");
    const resultPrimaryLabel = document.querySelector("[data-mobile-result-primary-label]");
    const resultPrimaryIcon = document.querySelector("[data-mobile-result-primary-icon]");
    const destinationSheet = document.querySelector("[data-mobile-result-destination-sheet]");
    const destinationList = document.querySelector("[data-mobile-result-destination-list]");
    const communityDestination = document.querySelector('[data-mobile-result-destination="community"]');
    const activityDestination = document.querySelector('[data-mobile-result-destination="activity"]');
    const activityDestinationLabel = document.querySelector("[data-mobile-result-activity-label]");
    const setDestinationSheet = (open) => {
      if (!destinationSheet) return;
      destinationSheet.classList.toggle("is-open", open);
      destinationSheet.setAttribute("aria-hidden", open ? "false" : "true");
    };
    if (activityResult) {
      if (activityDestinationLabel) activityDestinationLabel.textContent = "提交到当前活动";
      if (destinationList && activityDestination) destinationList.prepend(activityDestination);
      if (resultPrimaryIcon) resultPrimaryIcon.src = "resources/icons/remixicon/svg/Document/file-check-line.svg";
    }
    destinationSheet?.querySelectorAll("[data-mobile-result-destination-close]").forEach((button) => button.addEventListener("click", () => setDestinationSheet(false)));
    const publishResult = () => {
      if (!resultPrimary || resultPrimary.getAttribute("aria-disabled") === "true") return;
      setDestinationSheet(false);
      resultPrimary.setAttribute("aria-disabled", "true");
      if (resultPrimaryLabel) resultPrimaryLabel.textContent = "发布审核中";
      showToast("作品已提交发布");
    };
    communityDestination?.addEventListener("click", publishResult);
    activityDestination?.addEventListener("click", () => {
      setDestinationSheet(false);
      if (resultSource === "prompt") {
        window.location.assign("./mobile-activity-detail.html#mobile-activity-participation");
        return;
      }
      window.location.assign("./mobile-campaign-detail.html#mobile-campaign-participation");
    });
    resultPrimary?.addEventListener("click", () => {
      if (resultPrimary.getAttribute("aria-disabled") === "true") {
        showToast("作品已提交发布");
        return;
      }
      setDestinationSheet(true);
    });
  }

  const submissionScreen = document.querySelector("[data-mobile-submission-screen]");
  if (submissionScreen) {
    const editButton = document.querySelector("[data-mobile-submission-edit]");
    const editor = document.querySelector("[data-mobile-submission-editor]");
    const copy = document.querySelector("[data-mobile-submission-copy]");
    const count = document.querySelector("[data-mobile-submission-count]");
    const error = document.querySelector("[data-mobile-submission-error]");
    copy?.addEventListener("input", () => {
      if (count) count.textContent = String(copy.value.length);
    });
    editButton?.addEventListener("click", () => {
      if (editor?.hidden) {
        editor.hidden = false;
        editButton.querySelector("span").textContent = "确认重投";
        editor.scrollIntoView({ block: "center", behavior: "smooth" });
        window.setTimeout(() => copy?.focus(), 180);
        return;
      }
      if (!copy?.value.trim()) {
        if (error) error.textContent = "请输入作品说明";
        copy?.focus();
        return;
      }
      if (error) error.textContent = "";
      editor.hidden = true;
      const badge = document.querySelector("[data-mobile-submission-status]");
      const statusText = document.querySelector("[data-mobile-submission-status-text]");
      const title = document.querySelector("#mobile-submission-status-title");
      const reason = document.querySelector("[data-mobile-submission-reason]");
      if (badge) {
        badge.textContent = "审核中";
        badge.className = "mobile-status-badge is-running";
      }
      if (statusText) statusText.textContent = "审核中";
      if (title) title.textContent = "作品已重新提交";
      if (reason) reason.textContent = "审核结果将在消息中心同步。";
      editButton.querySelector("span").textContent = "审核中";
      editButton.disabled = true;
      const history = document.querySelector(".mobile-submission-history ol");
      if (history) {
        const item = document.createElement("li");
        item.innerHTML = "<span></span><div><strong>已重新提交</strong><p>刚刚</p></div>";
        history.prepend(item);
      }
      showToast("投稿已重新提交");
    });
  }

  const scrollKey = `mobile-scroll:${window.location.pathname}`;
  const savedScroll = Number(sessionStorage.getItem(scrollKey) || 0);
  if (savedScroll > 0 && !window.location.hash) window.requestAnimationFrame(() => window.scrollTo(0, savedScroll));
  window.addEventListener("pagehide", () => sessionStorage.setItem(scrollKey, String(window.scrollY)));
})();
