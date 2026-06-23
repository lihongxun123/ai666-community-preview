(function () {
  const prototypeLabels = new Set(["页面定位", "用户主路径", "关键字段", "状态规则"]);
  const businessLabels = new Set(["CTA 闭环", "运营配置", "研发验收", "边界"]);

  function getSectionLabel(section) {
    return section.querySelector("strong")?.textContent.trim() || "";
  }

  function classifySections(drawer) {
    return Array.from(drawer.querySelectorAll(".v1-rule-section")).map((section, index) => {
      const label = getSectionLabel(section);
      const pane = businessLabels.has(label) || (!prototypeLabels.has(label) && index >= 4)
        ? "business"
        : "prototype";
      section.dataset.walkthroughPane = pane;
      return section;
    });
  }

  function activatePane(drawer, pane) {
    const tabs = Array.from(drawer.querySelectorAll(".v1-walkthrough-tabs button"));
    const sections = Array.from(drawer.querySelectorAll(".v1-rule-section"));

    tabs.forEach((tab) => {
      const isActive = tab.dataset.walkthroughTab === pane;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    sections.forEach((section) => {
      section.hidden = section.dataset.walkthroughPane !== pane;
    });
  }

  function resetToPrototype(drawer) {
    activatePane(drawer, "prototype");
    const panel = drawer.querySelector(".v1-walkthrough-panel");
    if (panel) {
      panel.scrollTop = 0;
    }
  }

  function enhanceTabs(drawer) {
    const tabGroup = drawer.querySelector(".v1-walkthrough-tabs");
    if (!tabGroup || tabGroup.dataset.walkthroughEnhanced === "true") {
      return;
    }

    const labels = ["运营关注", "研发关注"];
    const existing = Array.from(tabGroup.children);
    tabGroup.setAttribute("role", "tablist");
    tabGroup.dataset.walkthroughEnhanced = "true";
    tabGroup.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-walkthrough-tab]");
      if (!tab || !tabGroup.contains(tab)) {
        return;
      }
      event.preventDefault();
      activatePane(drawer, tab.dataset.walkthroughTab);
    });

    labels.forEach((label, index) => {
      const pane = index === 0 ? "prototype" : "business";
      const oldNode = existing[index];
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.walkthroughTab = pane;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", index === 0 ? "true" : "false");
      button.onclick = () => activatePane(drawer, pane);
      button.addEventListener("click", () => activatePane(drawer, pane));
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
          return;
        }
        event.preventDefault();
        const nextPane = pane === "prototype" ? "business" : "prototype";
        activatePane(drawer, nextPane);
        drawer.querySelector(`[data-walkthrough-tab="${nextPane}"]`)?.focus();
      });

      if (oldNode) {
        oldNode.replaceWith(button);
      } else {
        tabGroup.append(button);
      }
    });

    existing.slice(labels.length).forEach((node) => node.remove());
  }

  function enhanceClose(drawer) {
    const summary = drawer.querySelector("summary");
    if (!summary) {
      return;
    }

    const existingClose = drawer.querySelector(".v1-walkthrough-close");
    if (existingClose) {
      if (existingClose.parentElement !== summary) {
        summary.append(existingClose);
      }
      return;
    }

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "v1-walkthrough-close";
    closeButton.textContent = "关闭";
    closeButton.setAttribute("aria-label", "关闭走查面板");
    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      resetToPrototype(drawer);
      drawer.open = false;
      summary.focus();
    });
    summary.append(closeButton);
  }

  function resetOnOpen(drawer) {
    if (drawer.dataset.walkthroughResetBound === "true") {
      return;
    }

    drawer.dataset.walkthroughResetBound = "true";
    const summary = drawer.querySelector("summary");
    summary?.addEventListener("click", () => {
      if (!drawer.open) {
        resetToPrototype(drawer);
      }
    });

    drawer.addEventListener("toggle", () => {
      if (!drawer.open) {
        return;
      }

      resetToPrototype(drawer);
    });
  }

  function enhanceDrawer(drawer) {
    if (drawer.dataset.walkthroughReady === "true") {
      return;
    }

    drawer.dataset.walkthroughReady = "true";
    classifySections(drawer);
    enhanceClose(drawer);
    enhanceTabs(drawer);
    resetOnOpen(drawer);
    activatePane(drawer, "prototype");
  }

  function init() {
    document.querySelectorAll("[data-v1-walkthrough-drawer]").forEach(enhanceDrawer);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
