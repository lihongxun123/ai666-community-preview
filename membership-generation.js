"use strict";

(() => {
  const modal = document.querySelector("#quick-create");
  if (!modal) return;
  const isCapsule = modal.classList.contains("create-modal");
  const source = isCapsule ? "generate-capsule" : "generate";
  const reviewing = new URLSearchParams(window.location.search).get("review") === "1";
  const isLocalFile = window.location.origin === "null";
  const submitSelector = isCapsule ? "[data-create-submit], [data-create-followup-submit]" : "[data-generate-demo]";
  const priceSelector = isCapsule
    ? "[data-create-model-cost], [data-model-current-cost], [data-submit-cost]"
    : submitSelector;

  function install() {
    const membership = window.Membership;
    const submits = [...modal.querySelectorAll(submitSelector)];
    if ((!membership && !isLocalFile) || !submits.length) return;

    const prices = new Map([...modal.querySelectorAll(priceSelector)].map((node) => [node, node.textContent]));
    const summaries = submits.map((submit) => {
      const summary = document.createElement("p");
      summary.className = "membership-generation-quote";
      summary.dataset.membershipGenerationBalance = "";
      summary.setAttribute("aria-live", "polite");
      const anchor = isCapsule && submit.hasAttribute("data-create-submit") ? modal.querySelector(".creation-bottom-bar") : submit;
      anchor.before(summary);
      return summary;
    });
    const dialog = document.createElement("dialog");
    dialog.className = "membership-generation-dialog";
    dialog.setAttribute("aria-labelledby", "membership-generation-title");
    document.body.append(dialog);

    const style = document.createElement("style");
    style.textContent = `
      .membership-generation-quote { margin: 0 0 6px; color: rgba(255,247,230,.82); font-size: 12px; line-height: 1.45; }
      .membership-generation-dialog {
        width: min(460px, calc(100% - 28px)); border: 1px solid rgba(255,247,230,.17);
        border-radius: 14px; padding: 20px; color: #fff7e6; background: #10151d; max-height: calc(100dvh - 28px);
      }
      .membership-generation-dialog::backdrop { background: rgba(0,0,0,.72); backdrop-filter: blur(3px); }
      .membership-generation-dialog h2 { margin: 0; font-size: 21px; }
      .membership-generation-dialog p { margin: 10px 0 0; color: rgba(255,247,230,.79); }
      .membership-generation-dialog .membership-generation-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
      .membership-generation-dialog .membership-generation-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; margin-top: 16px; }
      .membership-generation-dialog button { border-radius: 7px; padding: 7px 12px; border: 1px solid rgba(255,247,230,.18); background: #171e29; color: inherit; font: inherit; cursor: pointer; }
      .membership-generation-dialog button[data-primary] { background: #f4c95d; color: #211900; font-weight: 700; }
      .membership-generation-dialog[data-embedded] { width: min(1160px, calc(100% - 20px)); padding: 0; overflow: hidden; }
      .membership-generation-dialog[data-embedded] .membership-generation-head { padding: 9px 13px; border-bottom: 1px solid rgba(255,247,230,.15); }
      .membership-generation-dialog[data-embedded] h2 { font-size: 16px; }
      .membership-generation-dialog iframe { display: block; width: 100%; border: 0; height: min(780px, calc(100dvh - 77px)); background: #05070b; }
    `;
    document.head.append(style);

    let frame = null;
    let editorToFocus = null;
    let recentApproval = null;

    function currentMode() {
      return modal.querySelector("[data-create-mode]:checked")?.value || "image";
    }

    function originalPrice(node) {
      const number = prices.get(node)?.match(/\d+/);
      return number ? Number(number[0]) : null;
    }

    function reviewCost() {
      if (!reviewing) return null;
      const value = Number(sessionStorage.getItem("community-membership-review-cost"));
      return Number.isSafeInteger(value) && value > 0 ? value : null;
    }

    function selectedPrice() {
      return isCapsule
        ? modal.querySelector(`[data-create-model-select][data-create-mode-panel="${currentMode()}"] [data-create-model-option]:has(input:checked) [data-create-model-cost]`)
        : submits[0];
    }

    function currentQuote() {
      return reviewCost() ?? originalPrice(selectedPrice());
    }

    function syncQuote() {
      if (isLocalFile) {
        summaries.forEach((summary) => { summary.textContent = "请通过本地预览地址体验生成和会员购买。"; });
        return;
      }
      const override = reviewCost();
      const base = currentQuote();
      const signedIn = membership.read().user.loggedIn;
      const balance = membership.balance();
      const amount = base === null ? null : membership.cost(base, "generate");
      prices.forEach((text, node) => {
        const original = override ?? originalPrice(node);
        if (original === null) return;
        const value = membership.cost(original, "generate");
        node.textContent = node.hasAttribute("data-submit-cost") ? String(value) : text.replace(/\d+\s*(?:限时)?积分/, `${value} 积分`);
      });
      const gap = amount === null ? 0 : Math.max(0, amount - balance);
      const balanceLabel = signedIn ? `当前 ${balance} 积分` : "登录后查看余额";
      for (const summary of summaries) {
        summary.textContent = amount === null ? balanceLabel
          : `本次需 ${amount} 积分 · ${balanceLabel}${signedIn && gap > 0 ? ` · 还差 ${gap} 积分` : ""}`;
      }
      if (isCapsule && amount !== null) {
        submits.forEach((control) => {
          const action = control.querySelector(`[data-submit-label="${currentMode()}"]`)?.textContent.trim();
          if (action) control.setAttribute("aria-label", `${action}，预计消耗 ${amount} 积分`);
        });
      }
    }

    function changed() {
      window.dispatchEvent(new Event("membership-changed"));
    }

    function button(label, onClick, primary = false) {
      const control = document.createElement("button");
      control.type = "button";
      control.textContent = label;
      if (primary) control.dataset.primary = "";
      control.addEventListener("click", onClick);
      return control;
    }

    function fillDialog(title) {
      const head = document.createElement("div");
      head.className = "membership-generation-head";
      const heading = document.createElement("h2");
      heading.id = "membership-generation-title";
      heading.textContent = title;
      head.append(heading, button("关闭", () => dialog.close()));
      dialog.replaceChildren(head);
      if (!dialog.open) dialog.showModal();
    }

    function notice(title, message, actionLabel, action) {
      dialog.removeAttribute("data-embedded");
      fillDialog(title);
      const copy = document.createElement("p");
      copy.textContent = message;
      dialog.append(copy);
      const actions = document.createElement("div");
      actions.className = "membership-generation-actions";
      actions.append(button("继续编辑", () => dialog.close()));
      if (action) actions.append(button(actionLabel, action, true));
      dialog.append(actions);
    }

    function memberUrl(required) {
      const url = new URL("./membership.html", window.location.href);
      if (reviewing) url.searchParams.set("review", "1");
      if (required !== undefined) {
        url.searchParams.set("source", source);
        url.searchParams.set("required", String(required));
        url.searchParams.set("embedded", "1");
      }
      return url;
    }

    function openMembership(required) {
      dialog.dataset.embedded = "";
      fillDialog("社区会员");
      frame = document.createElement("iframe");
      frame.title = "社区会员";
      frame.src = memberUrl(required).href;
      dialog.append(frame);
    }

    function openLogin() {
      const loginUrl = new URL("./login.html#auth", window.location.href);
      if (reviewing) loginUrl.searchParams.set("review", "1");
      const resultUrl = new URL(loginUrl.href);
      resultUrl.searchParams.set("generationLoginReturn", "1");
      loginUrl.searchParams.set("returnTo", resultUrl.href);
      loginUrl.searchParams.set("cancelTo", resultUrl.href);
      dialog.dataset.embedded = "";
      fillDialog("登录社区账号");
      const loginFrame = document.createElement("iframe");
      loginFrame.title = "登录或注册";
      loginFrame.src = loginUrl.href;
      loginFrame.addEventListener("load", () => {
        if (frame !== loginFrame || loginFrame.contentDocument?.URL !== resultUrl.href) return;
        dialog.close();
        changed();
      });
      frame = loginFrame;
      dialog.append(frame);
    }

    function membershipLabel() {
      const active = membership.activeTier();
      if (!active) return "开通会员得积分";
      const plans = membership.read().plans;
      const current = plans.find(plan => plan.id === active);
      const canUpgrade = current && plans.some(plan => plan.order > current.order);
      return canUpgrade ? "续费或升档得积分" : "续费得积分";
    }

    function stopSubmission(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    document.addEventListener("click", (event) => {
      const submit = event.target.closest?.(submitSelector);
      if (!submit || !modal.contains(submit)) return;
      if (isLocalFile) {
        stopSubmission(event);
        notice("请使用本地预览", "通过本地预览地址打开社区页面，即可体验生成和会员购买。");
        return;
      }
      if (dialog.open || (recentApproval?.control === submit && performance.now() - recentApproval.time < 650)
        || (!isCapsule && modal.querySelector("[data-generation-status]")?.textContent === "生成中")) {
        stopSubmission(event);
        return;
      }
      const followup = submit.hasAttribute("data-create-followup-submit");
      const editor = isCapsule
        ? modal.querySelector(followup ? ".creation-followup-input" : `[data-create-prompt][data-create-mode-panel="${currentMode()}"]`)
        : modal.querySelector("[data-generate-prompt]");
      if (!editor?.value.trim()) {
        if (isCapsule) {
          stopSubmission(event);
          editorToFocus = editor;
          notice("填写创作内容", "请输入想生成或调整的内容。");
        }
        return;
      }
      editorToFocus = editor;
      if (!membership.read().user.loggedIn) {
        stopSubmission(event);
        notice("登录后生成", "登录后可查看积分余额并继续生成。", "登录", openLogin);
        return;
      }
      const base = currentQuote();
      if (base === null) {
        stopSubmission(event);
        notice("暂时无法读取生成价格", "可以返回编辑器重新选择模型。");
        return;
      }
      const required = membership.cost(base, "generate");
      const balance = membership.balance();
      if (required > balance) {
        stopSubmission(event);
        notice("积分不足", `本次生成需要 ${required} 积分，你有 ${balance} 积分，还差 ${required - balance} 积分。`,
          membershipLabel(), () => openMembership(required));
        return;
      }
      try {
        membership.spend(base, "generate");
        recentApproval = { control: submit, time: performance.now() };
        changed();
      } catch (error) {
        stopSubmission(event);
        notice("暂时无法生成", error.message);
      }
    }, true);

    dialog.addEventListener("close", () => {
      frame?.remove();
      frame = null;
      dialog.removeAttribute("data-embedded");
      syncQuote();
      editorToFocus?.focus({ preventScroll: true });
      editorToFocus = null;
    });
    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin || event.source !== frame?.contentWindow) return;
      if (event.data?.type !== "community-membership-return") return;
      if (event.data.target === "source") dialog.close();
      if (event.data.target === "orders") {
        const url = memberUrl();
        url.hash = "orders";
        window.location.href = url.href;
      }
    });
    modal.addEventListener("change", syncQuote);
    window.addEventListener("membership-changed", syncQuote);
    window.addEventListener("pageshow", syncQuote);
    syncQuote();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
