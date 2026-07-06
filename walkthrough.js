(function () {
  const operationsLabels = new Set(["页面定位", "用户主路径", "关键字段", "状态规则", "动作去向", "运营维护"]);
  const engineeringLabels = new Set(["研发关注", "研发验收", "交互与状态", "数据与资源", "验证关注", "交付边界"]);

  function getSectionLabel(section) {
    return section.querySelector("strong")?.textContent.trim() || "";
  }

  function classifySections(drawer) {
    return Array.from(drawer.querySelectorAll(".v1-rule-section")).map((section, index) => {
      const label = getSectionLabel(section);
      const pane = engineeringLabels.has(label) || (!operationsLabels.has(label) && index >= 6)
        ? "engineering"
        : "operations";
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

  function markManualPane(drawer) {
    drawer.dataset.walkthroughManualPane = "true";
  }

  function resetToPrototype(drawer) {
    delete drawer.dataset.walkthroughManualPane;
    activatePane(drawer, "operations");
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
      event.stopPropagation();
      markManualPane(drawer);
      activatePane(drawer, tab.dataset.walkthroughTab);
    });

    labels.forEach((label, index) => {
      const pane = index === 0 ? "operations" : "engineering";
      const oldNode = existing[index];
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.walkthroughTab = pane;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", index === 0 ? "true" : "false");
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
          return;
        }
        event.preventDefault();
        const nextPane = pane === "operations" ? "engineering" : "operations";
        markManualPane(drawer);
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

      if (drawer.dataset.walkthroughManualPane === "true") {
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
    activatePane(drawer, "operations");
  }

  function closeCreationModelSelect(event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const option = event.target.closest("[data-create-model-option]");
    if (!option) {
      return;
    }

    const select = option.closest("[data-create-model-select]");
    if (!(select instanceof HTMLDetailsElement)) {
      return;
    }

    window.requestAnimationFrame(() => {
      select.open = false;
    });
  }

  function enhanceCreationModelSelects() {
    if (document.documentElement.dataset.creationModelSelectReady === "true") {
      return;
    }

    document.documentElement.dataset.creationModelSelectReady = "true";
    document.addEventListener("click", closeCreationModelSelect);
  }

  function initCreationFlowMotion(gsap, reduceMotion) {
    document.querySelectorAll("[data-creation-flow]").forEach((flow) => {
      if (flow.dataset.creationFlowMotionReady === "true") {
        return;
      }

      flow.dataset.creationFlowMotionReady = "true";
      const dialog = flow.closest(".create-dialog");
      let activeTween = null;
      let generationLoop = null;
      const stateMotionDuration = (value) => reduceMotion ? Math.min(value * 1.35, 0.48) : value;
      const stateMotionStagger = reduceMotion ? 0.018 : 0.035;

      const currentRadio = () => flow.querySelector(".creation-flow-radio:checked");
      const activeMode = () => dialog?.querySelector("[data-create-mode]:checked")?.value || "image";
      const promptForActiveMode = () => dialog?.querySelector(`[data-create-prompt][data-create-mode-panel="${activeMode()}"]`);
      const modeTitles = {
        image: "图片生成",
        script: "剧本创作",
        video: "视频生成"
      };
      const syncResultModeTitle = () => {
        const title = modeTitles[activeMode()] || "图片生成";
        dialog?.querySelectorAll("[data-result-mode-title]").forEach((node) => {
          node.textContent = title;
        });
      };
      const syncPromptPreview = () => {
        const prompt = promptForActiveMode();
        const promptValue = prompt?.value.trim();
        const fallback = prompt?.getAttribute("placeholder") || "返回调整后可继续补充输入。";
        const previewText = promptValue || fallback;
        dialog?.querySelectorAll("[data-creation-prompt-preview]").forEach((node) => {
          node.textContent = previewText;
          node.dataset.creationPromptPreviewEmpty = promptValue ? "false" : "true";
        });
      };
      const setStateData = () => {
        const state = currentRadio()?.value || "input";
        const isLocked = state !== "input";
        flow.dataset.creationFlowState = state;
        if (dialog) {
          dialog.dataset.creationFlowState = state;
          dialog.dataset.creationModeLocked = String(isLocked);
          dialog.querySelectorAll("[data-create-mode-tab]").forEach((tab) => {
            tab.setAttribute("aria-disabled", String(isLocked));
          });
          syncResultModeTitle();
        }
      };
      const visiblePanel = () => {
        const state = currentRadio()?.value || "input";
        return flow.querySelector(`[data-creation-step-panel="${state}"]`);
      };
      const stopGenerationLoop = () => {
        if (generationLoop) {
          generationLoop.kill();
          generationLoop = null;
        }
      };
      const setTransitionState = (state) => {
        flow.dataset.creationFlowTransition = state;
        if (dialog) {
          dialog.dataset.creationFlowTransition = state;
        }
      };
      const startGenerationLoop = () => {
        stopGenerationLoop();
        if (!gsap || reduceMotion || currentRadio()?.value !== "generating") {
          return;
        }

        const panel = visiblePanel();
        const spinner = panel?.querySelector("[data-generation-spinner]");
        const progress = panel?.querySelector("[data-generation-progress]");
        generationLoop = gsap.timeline({ repeat: -1, defaults: { overwrite: "auto" } });
        if (spinner) {
          generationLoop.to(spinner, { rotate: 360, duration: 1, ease: "none" }, 0);
        }
        if (progress) {
          generationLoop
            .to(progress, { scaleX: 0.82, duration: 1.8, ease: "power1.inOut" }, 0)
            .to(progress, { scaleX: 0.28, duration: 1.2, ease: "power1.inOut" }, 1.8);
        }
      };
      const hasUsableRect = (rect) => rect && rect.width > 0 && rect.height > 0;
      const findTargetRadio = (control) => {
        const targetId = control.getAttribute("for");
        if (!targetId) {
          return null;
        }
        const target = document.getElementById(targetId);
        return target?.classList.contains("creation-flow-radio") && flow.contains(target) ? target : null;
      };
      const switchState = (targetRadio, event) => {
        if (!targetRadio || targetRadio.checked) {
          return;
        }

        event?.preventDefault();
        if (activeTween) {
          activeTween.kill();
          activeTween = null;
          setTransitionState("idle");
        }

        const fromState = currentRadio()?.value || "input";
        const fromRect = dialog?.getBoundingClientRect();
        stopGenerationLoop();
        targetRadio.checked = true;
        setStateData();
        syncPromptPreview();
        const toState = targetRadio.value || currentRadio()?.value || "input";
        const nextPanel = visiblePanel();
        const toRect = dialog?.getBoundingClientRect();

        if (!gsap || !dialog || !hasUsableRect(fromRect) || !hasUsableRect(toRect)) {
          setTransitionState("idle");
          startGenerationLoop();
          return;
        }

        setTransitionState(`${fromState}:${toState}`);
        const parts = Array.from(nextPanel?.querySelectorAll("[data-creation-motion-part], .creation-conversation-panel, .creation-generation-rail, .creation-live-stage, .creation-state-aside, .creation-result-preview, .creation-destination-card") || []);
        gsap.set(dialog, {
          transformOrigin: "50% 100%",
          scaleX: fromRect.width / toRect.width,
          scaleY: fromRect.height / toRect.height,
          willChange: "transform"
        });
        gsap.set(nextPanel, { autoAlpha: 0, y: 16, scale: 0.985 });
        gsap.set(parts, { autoAlpha: 0, y: 12 });

        activeTween = gsap.timeline({
          defaults: { overwrite: "auto" },
          onComplete: () => {
            activeTween = null;
            gsap.set(dialog, { clearProps: "transform,willChange" });
            gsap.set([nextPanel, ...parts], { clearProps: "opacity,visibility,transform" });
            setTransitionState("idle");
            startGenerationLoop();
          }
        });
        activeTween
          .to(dialog, { scaleX: 1, scaleY: 1, duration: stateMotionDuration(0.42), ease: "power3.inOut" }, 0)
          .to(nextPanel, { autoAlpha: 1, y: 0, scale: 1, duration: stateMotionDuration(0.26), ease: "power2.out" }, stateMotionDuration(0.08))
          .to(parts, { autoAlpha: 1, y: 0, duration: stateMotionDuration(0.24), stagger: stateMotionStagger, ease: "power2.out" }, stateMotionDuration(0.12));
      };

      setStateData();
      syncPromptPreview();
      startGenerationLoop();
      dialog?.addEventListener("input", (event) => {
        if (event.target.matches("[data-create-prompt]")) {
          syncPromptPreview();
        }
      });
      dialog?.addEventListener(
        "click",
        (event) => {
          const tab = event.target.closest("[data-create-mode-tab]");
          if (!tab || !dialog.contains(tab) || currentRadio()?.value === "input") {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
        },
        true
      );
      flow.addEventListener("click", (event) => {
        const control = event.target.closest("[data-create-submit], [data-creation-next]");
        if (!control || !flow.contains(control)) {
          return;
        }
        switchState(findTargetRadio(control), event);
      });
    });
  }

  function initQuickCreateMorph(trigger, gsap, reduceMotion) {
    const modal = document.querySelector("#quick-create");
    const dialog = modal?.querySelector(".create-dialog");
    const backdrop = modal?.querySelector(".modal-backdrop");
    if (!modal || !dialog || !backdrop || modal.dataset.quickCreateMorphReady === "true") {
      return;
    }

    modal.dataset.quickCreateMorphReady = "true";
    const root = document.documentElement;
    const revealParts = [
      dialog.querySelector(".create-dialog-head"),
      dialog.querySelector(".experience-tabs"),
      dialog.querySelector(".experience-canvas")
    ].filter(Boolean);
    let morphTimeline = null;
    const motionDuration = (value) => value;
    const shellEase = "power3.inOut";
    const revealEase = "power2.out";

    const setQuickCreateHash = (isOpen) => {
      const nextUrl = new URL(window.location.href);
      nextUrl.hash = isOpen ? "quick-create" : "";
      window.history.replaceState(null, "", nextUrl.href);
    };

    const setMorphState = (state) => {
      root.dataset.quickCreateMorphState = state;
      modal.dataset.quickCreateMorph = state;
    };

    const clearDialogMotion = () => {
      gsap.set([dialog, backdrop, ...revealParts], { clearProps: "transform,opacity,visibility" });
    };

    const removeMorphShells = () => {
      document.querySelectorAll("[data-quick-create-morph-shell]").forEach((shell) => shell.remove());
    };

    const hasUsableRect = (rect) => rect.width > 0 && rect.height > 0;
    const radiusOf = (node, fallback) => getComputedStyle(node).borderRadius || fallback;

    const createMorphShell = (rect, borderRadius, scaleX = 1, scaleY = 1) => {
      removeMorphShells();
      const shell = document.createElement("div");
      shell.className = "quick-create-morph-shell";
      shell.dataset.quickCreateMorphShell = "true";
      shell.setAttribute("aria-hidden", "true");
      document.body.appendChild(shell);
      gsap.set(shell, {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        scaleX,
        scaleY,
        autoAlpha: 1,
        borderRadius,
        transformOrigin: "50% 100%",
        "--quick-create-shell-sheen-x": "-72%"
      });
      return shell;
    };

    const finishOpenWithoutMotion = () => {
      modal.classList.add("is-quick-create-morph-open");
      modal.classList.remove("is-quick-create-morphing");
      clearDialogMotion();
      setQuickCreateHash(true);
      setMorphState("open");
    };

    const finishCloseWithoutMotion = () => {
      setQuickCreateHash(false);
      modal.classList.remove("is-quick-create-morph-open", "is-quick-create-morphing");
      clearDialogMotion();
      gsap.set(trigger, { autoAlpha: 1, clearProps: "visibility" });
      setMorphState("closed");
    };

    const openQuickCreate = (event) => {
      event?.preventDefault();
      if (morphTimeline || root.dataset.quickCreateMorphState === "open") {
        finishOpenWithoutMotion();
        return;
      }

      const fromRect = trigger.getBoundingClientRect();
      if (!hasUsableRect(fromRect)) {
        finishOpenWithoutMotion();
        return;
      }

      modal.classList.add("is-quick-create-morph-open", "is-quick-create-morphing");
      setMorphState("opening");
      gsap.set(backdrop, { autoAlpha: 0 });
      gsap.set(dialog, { autoAlpha: 0, clearProps: "transform" });

      const toRect = dialog.getBoundingClientRect();
      if (!hasUsableRect(toRect)) {
        finishOpenWithoutMotion();
        return;
      }

      gsap.set(dialog, { autoAlpha: 0, y: 12, scale: 0.985, transformOrigin: "50% 50%" });
      gsap.set(revealParts, { autoAlpha: 0, y: 8 });

      const shell = createMorphShell(
        toRect,
        radiusOf(trigger, "999px"),
        fromRect.width / toRect.width,
        fromRect.height / toRect.height
      );
      gsap.set(trigger, { autoAlpha: 0 });
      morphTimeline = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
          morphTimeline = null;
          shell.remove();
          modal.classList.remove("is-quick-create-morphing");
          clearDialogMotion();
          setQuickCreateHash(true);
          setMorphState("open");
        }
      });

      morphTimeline
        .to(backdrop, { autoAlpha: 1, duration: 0.2, ease: "power1.out" }, 0)
        .to(
          shell,
          {
            scaleX: 1,
            scaleY: 1,
            borderRadius: radiusOf(dialog, "18px"),
            duration: motionDuration(0.72),
            ease: shellEase
          },
          0
        )
        .to(shell, { "--quick-create-shell-sheen-x": "86%", duration: motionDuration(0.56), ease: "power2.inOut" }, motionDuration(0.04))
        .to(shell, { autoAlpha: 0, duration: motionDuration(0.16), ease: "power1.out" }, motionDuration(0.62))
        .to(dialog, { autoAlpha: 1, y: 0, scale: 1, duration: motionDuration(0.2), ease: revealEase }, motionDuration(0.52))
        .to(revealParts, { autoAlpha: 1, y: 0, duration: motionDuration(0.2), stagger: reduceMotion ? 0.008 : 0.018, ease: revealEase }, motionDuration(0.56));
    };

    const closeQuickCreate = (event) => {
      event?.preventDefault();
      if (morphTimeline || root.dataset.quickCreateMorphState === "closed") {
        finishCloseWithoutMotion();
        return;
      }

      const fromRect = dialog.getBoundingClientRect();
      const toRect = trigger.getBoundingClientRect();
      if (!hasUsableRect(fromRect) || !hasUsableRect(toRect)) {
        finishCloseWithoutMotion();
        return;
      }

      modal.classList.add("is-quick-create-morph-open", "is-quick-create-morphing");
      setMorphState("closing");
      const shell = createMorphShell(fromRect, radiusOf(dialog, "18px"));
      gsap.set([dialog, ...revealParts], { autoAlpha: 0, y: 8 });
      gsap.set(trigger, { autoAlpha: 0 });

      morphTimeline = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
          morphTimeline = null;
          shell.remove();
          finishCloseWithoutMotion();
        }
      });

      morphTimeline
        .to(backdrop, { autoAlpha: 0, duration: 0.16, ease: "power1.out" }, 0)
        .to(
          shell,
          {
            scaleX: toRect.width / fromRect.width,
            scaleY: toRect.height / fromRect.height,
            borderRadius: radiusOf(trigger, "999px"),
            duration: motionDuration(0.5),
            ease: shellEase
          },
          0
        )
        .to(shell, { "--quick-create-shell-sheen-x": "72%", duration: motionDuration(0.44), ease: "power2.inOut" }, 0)
        .to(shell, { autoAlpha: 0, duration: motionDuration(0.12), ease: "power1.out" }, motionDuration(0.44))
        .to(trigger, { autoAlpha: 1, duration: motionDuration(0.14), ease: "power1.out" }, motionDuration(0.4));
    };

    const startsOpen = window.location.hash === "#quick-create";
    modal.classList.remove("is-quick-create-morph-open", "is-quick-create-morphing");
    setMorphState("closed");
    trigger.dataset.quickCreateHashOpenPending = startsOpen ? "true" : "false";
    const requestHashOpen = () => {
      if (window.location.hash !== "#quick-create" || root.dataset.quickCreateMorphState !== "closed") {
        return;
      }
      trigger.dispatchEvent(new CustomEvent("quick-create:morph-open", { cancelable: true }));
    };

    trigger.addEventListener("quick-create:morph-open", openQuickCreate);
    trigger.addEventListener("click", openQuickCreate);
    modal.addEventListener("click", (event) => {
      const closeTarget = event.target.closest(".modal-backdrop, .modal-close-icon, .creation-side-close");
      if (!closeTarget || !modal.contains(closeTarget)) {
        return;
      }
      closeQuickCreate(event);
    });
    window.addEventListener("hashchange", requestHashOpen);
  }

  function initFloatingCreateMotion() {
    const trigger = document.querySelector('[data-gsap-motion="floating-create"]');
    const gsap = window.gsap;
    if (!trigger || !gsap || trigger.dataset.gsapMotionReady === "true") {
      return;
    }

    trigger.dataset.gsapMotionReady = "true";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    initQuickCreateMorph(trigger, gsap, reduceMotion);
    if (reduceMotion) {
      trigger.dataset.gsapMotionState = "reduced";
      gsap.set(trigger, { autoAlpha: 1, clearProps: "visibility" });
      if (trigger.dataset.quickCreateHashOpenPending === "true") {
        requestAnimationFrame(() => {
          trigger.dataset.quickCreateHashOpenPending = "false";
          trigger.dispatchEvent(new CustomEvent("quick-create:morph-open", { cancelable: true }));
        });
      }
      return;
    }

    const input = trigger.querySelector(".floating-create-input");
    const cta = trigger.querySelector(".floating-create-cta");
    const animatedParts = [input, cta].filter(Boolean);

    gsap.set(trigger, {
      autoAlpha: 0,
      "--floating-create-sheen-x": "-260%",
      "--floating-create-sheen-opacity": 0
    });
    gsap.set(animatedParts, { y: 8, autoAlpha: 0 });
    if (cta) {
      gsap.set(cta, { scale: 0.94 });
    }

    const intro = gsap.timeline({
      defaults: { ease: "power2.out", overwrite: "auto" },
      onComplete: () => {
        trigger.dataset.gsapMotionState = "ready";
        if (trigger.dataset.quickCreateHashOpenPending === "true") {
          trigger.dataset.quickCreateHashOpenPending = "false";
          trigger.dispatchEvent(new CustomEvent("quick-create:morph-open", { cancelable: true }));
        }
      }
    });

    intro
      .to(trigger, { autoAlpha: 1, duration: 0.16 })
      .to(input, { y: 0, autoAlpha: 1, duration: 0.24 }, "<0.04")
      .to(cta, { y: 0, autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(1.35)" }, "<0.06");

    let sheenTimeline = null;
    const playSheen = () => {
      if (sheenTimeline) {
        sheenTimeline.kill();
      }
      gsap.set(trigger, {
        "--floating-create-sheen-x": "-260%",
        "--floating-create-sheen-opacity": 0
      });
      sheenTimeline = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
          sheenTimeline = null;
        }
      });
      sheenTimeline
        .to(trigger, { "--floating-create-sheen-opacity": 1, duration: 0.04, ease: "none" })
        .to(trigger, { "--floating-create-sheen-x": "520%", duration: 0.52, ease: "none" }, "<")
        .to(trigger, { "--floating-create-sheen-opacity": 0, duration: 0.2, ease: "power1.out" }, "-=0.18");
    };

    const lift = () => {
      if (cta) {
        gsap.to(cta, { scale: 1.04, duration: 0.18, ease: "power2.out", overwrite: "auto" });
      }
    };
    const settle = () => {
      if (cta) {
        gsap.to(cta, { scale: 1, duration: 0.22, ease: "power2.out", overwrite: "auto" });
      }
    };
    const activate = () => {
      playSheen();
      lift();
    };

    trigger.addEventListener("pointerenter", activate);
    trigger.addEventListener("focus", activate);
    trigger.addEventListener("pointerleave", settle);
    trigger.addEventListener("blur", settle);
    if (cta) {
      cta.dataset.gsapMotionState = "hover-ready";
    }
  }

  function fallbackCopyText(value) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.append(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      textarea.remove();
    }
    return Promise.resolve();
  }

  function writeClipboardText(value) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(value).catch(() => fallbackCopyText(value));
    }

    return fallbackCopyText(value);
  }

  function initResultPromptCopy() {
    if (document.documentElement.dataset.resultPromptCopyReady === "true") {
      return;
    }

    document.documentElement.dataset.resultPromptCopyReady = "true";
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-result-copy-prompt]");
      if (!button) {
        return;
      }

      const prompt = button.closest(".creation-result-prompt-card")?.querySelector("[data-result-prompt]");
      const value = prompt?.textContent.trim();
      if (!value) {
        return;
      }

      event.preventDefault();
      writeClipboardText(value).finally(() => {
        const originalLabel = button.dataset.copyLabel || button.getAttribute("aria-label") || "复制提示词";
        button.dataset.copyLabel = originalLabel;
        button.dataset.copyState = "copied";
        button.setAttribute("aria-label", "已复制提示词");
        button.title = "已复制";
        window.clearTimeout(button.resultCopyTimer);
        button.resultCopyTimer = window.setTimeout(() => {
          button.dataset.copyState = "idle";
          button.setAttribute("aria-label", originalLabel);
          button.title = "";
        }, 1200);
      });
    });
  }

  function getContentCopyIconSrc() {
    return document.querySelector("[data-prompt-free-copy] img")?.getAttribute("src")
      || "./resources/icons/remixicon/svg/Document/file-copy-line.svg";
  }

  function createContentCopyButton(label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "content-copy-icon-button";
    button.dataset.contentCopy = "";
    button.setAttribute("aria-label", `复制${label || "内容"}`);
    button.title = "复制";

    return button;
  }

  function normalizeContentCopyButton(button) {
    Array.from(button.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE || node.nodeName === "IMG") {
        node.remove();
      }
    });
  }

  function removeContentCopyHead(card, label) {
    const head = card.querySelector(".prompt-detail-copy-head");
    if (!head) {
      return;
    }

    head.querySelectorAll("button").forEach((button) => button.remove());
    if (label.parentElement === head) {
      card.insertBefore(label, head);
    }
    if (!head.children.length && !head.textContent.trim()) {
      head.remove();
    }
  }

  function ensureContentCopyHead(card) {
    const label = card.querySelector("strong");
    if (!label) {
      return;
    }

    const labelText = label.textContent.trim();
    if (card.classList.contains("prompt-modal-summary") || card.matches("[data-prompt-model-info], .prompt-model-panel")) {
      removeContentCopyHead(card, label);
      return;
    }

    let head = card.querySelector(".prompt-detail-copy-head");
    if (!head) {
      head = document.createElement("div");
      head.className = "prompt-detail-copy-head";
      card.insertBefore(head, label);
      head.append(label);
    }

    const button = head.querySelector("button");
    if (button) {
      button.classList.add("content-copy-icon-button");
      button.dataset.contentCopy = "";
      button.setAttribute("aria-label", button.getAttribute("aria-label") || `复制${labelText || "内容"}`);
      button.title = button.title || "复制";
      normalizeContentCopyButton(button);
      return;
    }

    head.append(createContentCopyButton(labelText));
  }

  function getContentCopyValue(button) {
    const explicitValue = button.dataset.copyText || button.dataset.promptCopyText;
    if (explicitValue) {
      return explicitValue.trim();
    }

    const card = button.closest(".detail-prompt, .prompt-modal-summary");
    const content = card?.querySelector("p, span");
    return content?.textContent.trim() || "";
  }

  function initContentCardCopy() {
    if (document.documentElement.dataset.contentCardCopyReady === "true") {
      return;
    }

    document.documentElement.dataset.contentCardCopyReady = "true";
    document.querySelectorAll(".case-detail-aside .detail-prompt, .prompt-text-panel .detail-prompt, .case-detail-aside .prompt-modal-summary").forEach(ensureContentCopyHead);

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-content-copy], [data-prompt-free-copy]");
      if (!button) {
        return;
      }

      const value = getContentCopyValue(button);
      if (!value) {
        return;
      }

      event.preventDefault();
      writeClipboardText(value).finally(() => {
        button.dataset.copyState = "copied";
        window.clearTimeout(button.contentCopyTimer);
        button.contentCopyTimer = window.setTimeout(() => {
          button.dataset.copyState = "idle";
        }, 1200);
      });
    });
  }

  function showContentActionToast(message) {
    let toast = document.querySelector("[data-content-action-toast]");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "content-action-toast";
      toast.dataset.contentActionToast = "";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toast.contentActionToastTimer);
    toast.contentActionToastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 1400);
  }

  function getInviteCopyValue(action) {
    const linkBox = action.closest(".invite-link-box");
    const scopedLink = linkBox?.querySelector("[data-invite-login-link]")
      || action.closest(".invite-landing-layout, [data-profile-invite-mirror], [data-page='invite'], main")?.querySelector("[data-invite-login-link]")
      || document.querySelector("[data-invite-login-link]");

    return (scopedLink?.textContent || scopedLink?.getAttribute("href") || "").trim();
  }

  function initInviteCopyActions() {
    if (document.documentElement.dataset.inviteCopyReady === "true") {
      return;
    }

    document.documentElement.dataset.inviteCopyReady = "true";
    document.addEventListener("click", (event) => {
      const action = event.target.closest("[data-invite-copy]");
      if (!action) {
        return;
      }

      const value = getInviteCopyValue(action);
      if (!value) {
        return;
      }

      event.preventDefault();
      writeClipboardText(value).finally(() => {
        action.dataset.copyState = "copied";
        action.setAttribute("aria-label", "已复制邀请链接");
        showContentActionToast(action.dataset.inviteCopyMessage || "已复制邀请链接，快起分享给朋友吧");
        window.clearTimeout(action.inviteCopyTimer);
        action.inviteCopyTimer = window.setTimeout(() => {
          action.dataset.copyState = "idle";
          action.removeAttribute("aria-label");
        }, 1400);
      });
    });
  }

  function normalizeDetailFavoriteAction(action) {
    if (action.tagName === "A") {
      action.removeAttribute("href");
      action.setAttribute("role", "button");
      action.tabIndex = 0;
    }
    action.setAttribute("aria-pressed", action.dataset.favoriteState === "collected" ? "true" : "false");
  }

  function updateDetailFavoriteState(action) {
    const wasCollected = action.dataset.favoriteState === "collected";
    if (!wasCollected) {
      const count = action.querySelector("strong");
      const value = Number.parseInt(count?.textContent.trim() || "", 10);
      if (count && Number.isFinite(value)) {
        count.textContent = String(value + 1);
      }
    }

    action.dataset.favoriteState = "collected";
    action.dataset.ctaState = "收藏状态：已收藏";
    action.setAttribute("aria-pressed", "true");
    showContentActionToast(wasCollected ? "已收藏" : "收藏成功");
  }

  function initDetailFavoriteActions() {
    if (document.documentElement.dataset.detailFavoriteReady === "true") {
      return;
    }

    document.documentElement.dataset.detailFavoriteReady = "true";
    document.querySelectorAll("[data-detail-favorite-action]").forEach(normalizeDetailFavoriteAction);

    document.addEventListener("click", (event) => {
      const action = event.target.closest("[data-detail-favorite-action]");
      if (!action) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      updateDetailFavoriteState(action);
    }, true);

    document.addEventListener("keydown", (event) => {
      const action = event.target.closest("[data-detail-favorite-action]");
      if (!action || (event.key !== "Enter" && event.key !== " ")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      updateDetailFavoriteState(action);
    }, true);
  }

  function normalizeDetailStatAction(action) {
    if (action.tagName === "A") {
      action.removeAttribute("href");
      action.setAttribute("role", "button");
      action.tabIndex = 0;
    }

    if (action.matches("[data-detail-like-action]")) {
      action.setAttribute("aria-pressed", action.dataset.likeState === "liked" ? "true" : "false");
    } else if (action.matches("[data-detail-favorite-action]")) {
      action.setAttribute("aria-pressed", action.dataset.favoriteState === "collected" ? "true" : "false");
    }
  }

  function incrementDetailStat(action) {
    const count = action.querySelector("strong");
    const value = Number.parseInt(count?.textContent.trim() || "", 10);
    if (count && Number.isFinite(value)) {
      count.textContent = String(value + 1);
    }
  }

  function updateDetailLikeState(action) {
    const wasLiked = action.dataset.likeState === "liked";
    if (!wasLiked) {
      incrementDetailStat(action);
    }

    action.dataset.likeState = "liked";
    action.dataset.ctaState = "liked";
    action.setAttribute("aria-pressed", "true");
    showContentActionToast(wasLiked ? "\u5df2\u70b9\u8d5e" : "\u70b9\u8d5e\u6210\u529f");
  }

  function updateUnifiedDetailFavoriteState(action) {
    const wasCollected = action.dataset.favoriteState === "collected";
    if (!wasCollected) {
      incrementDetailStat(action);
    }

    action.dataset.favoriteState = "collected";
    action.dataset.ctaState = "collected";
    action.setAttribute("aria-pressed", "true");
    showContentActionToast(wasCollected ? "\u5df2\u6536\u85cf" : "\u6536\u85cf\u6210\u529f");
  }

  function updateDetailShareState(action) {
    incrementDetailStat(action);
    action.dataset.shareState = "shared";
    action.dataset.ctaState = "shared";
    writeClipboardText(window.location.href).finally(() => {
      showContentActionToast("\u5df2\u590d\u5236\uff0c\u5feb\u53bb\u5206\u4eab\u7ed9\u597d\u53cb\u5427\u3002");
    });
  }

  function updateDetailActionState(action) {
    if (action.matches("[data-detail-like-action]")) {
      updateDetailLikeState(action);
    } else if (action.matches("[data-detail-favorite-action]")) {
      updateUnifiedDetailFavoriteState(action);
    } else {
      updateDetailShareState(action);
    }
  }

  function initDetailActions() {
    if (document.documentElement.dataset.detailActionsReady === "true") {
      return;
    }

    document.documentElement.dataset.detailActionsReady = "true";
    document.querySelectorAll("[data-detail-like-action], [data-detail-favorite-action], [data-detail-share-action]").forEach(normalizeDetailStatAction);

    document.addEventListener("click", (event) => {
      const action = event.target.closest("[data-detail-like-action], [data-detail-favorite-action], [data-detail-share-action]");
      if (!action) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      updateDetailActionState(action);
    }, true);

    document.addEventListener("keydown", (event) => {
      const action = event.target.closest("[data-detail-like-action], [data-detail-favorite-action], [data-detail-share-action]");
      if (!action || (event.key !== "Enter" && event.key !== " ")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      updateDetailActionState(action);
    }, true);
  }

  function closeUserMenus(exceptMenu) {
    document.querySelectorAll("[data-user-menu]").forEach((menu) => {
      if (menu === exceptMenu) {
        return;
      }
      menu.classList.remove("is-open");
      menu.querySelector(".user-avatar-link")?.setAttribute("aria-expanded", "false");
    });
  }

  function setUserMenuOpen(menu, open) {
    menu.classList.toggle("is-open", open);
    menu.querySelector(".user-avatar-link")?.setAttribute("aria-expanded", String(open));
  }

  function createUserMenuLink(item) {
    const link = document.createElement("a");
    link.href = item.href;
    link.dataset.userMenuItem = item.key;
    if (item.logout) {
      link.dataset.logoutAction = "true";
    }
    if (item.setting) {
      link.dataset.userMenuSetting = "true";
    }
    if (item.ctaState) {
      link.dataset.ctaState = item.ctaState;
    }
    link.setAttribute("role", "menuitem");

    const icon = document.createElement("img");
    icon.src = item.icon;
    icon.alt = "";
    link.append(icon);

    const text = document.createElement("span");
    text.textContent = item.label;
    link.append(text);

    return link;
  }

  function enhanceUserMenus() {
    if (document.documentElement.dataset.userMenuReady === "true") {
      return;
    }

    document.documentElement.dataset.userMenuReady = "true";
    const items = [
      { key: "profile", label: "我的主页", href: "./user-center.html", icon: "resources/icons/remixicon/svg/User & Faces/user-3-line.svg" },
      { key: "invite", label: "邀请有礼", href: "./invite.html", icon: "resources/icons/remixicon/svg/Finance/gift-2-line.svg" },
      { key: "points", label: "积分中心", href: "./points-center.html", icon: "resources/icons/remixicon/svg/Finance/coins-line.svg" },
      { key: "logout", label: "退出登录", href: "./login.html?logout=1", icon: "resources/icons/remixicon/svg/System/logout-box-r-line.svg", logout: true },
    ];

    document.querySelectorAll(".site-header .user-avatar-link").forEach((avatar, index) => {
      if (avatar.closest("[data-user-menu]")) {
        return;
      }

      const menu = document.createElement("div");
      menu.className = "user-menu";
      menu.dataset.userMenu = "true";

      const target = document.createElement("span");
      target.id = index === 0 ? "user-menu" : `user-menu-${index + 1}`;
      target.className = "user-menu-target";
      target.setAttribute("aria-hidden", "true");

      const dropdown = document.createElement("div");
      dropdown.className = "user-menu-dropdown";
      dropdown.dataset.userMenuDropdown = "true";
      dropdown.setAttribute("role", "menu");
      dropdown.setAttribute("aria-label", "用户快捷菜单");
      items.forEach((item) => dropdown.append(createUserMenuLink(item)));

      avatar.parentElement?.insertBefore(menu, avatar);
      menu.append(target, avatar, dropdown);
      avatar.href = `#${target.id}`;
      avatar.dataset.ctaState = "open-user-menu";
      avatar.setAttribute("aria-haspopup", "menu");
      avatar.setAttribute("aria-expanded", "false");

      avatar.addEventListener("click", (event) => {
        event.preventDefault();
        const shouldOpen = !menu.classList.contains("is-open");
        closeUserMenus(menu);
        setUserMenuOpen(menu, shouldOpen);
      });
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-user-menu]")) {
        return;
      }
      closeUserMenus();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeUserMenus();
      }
    });
  }

  const taskGuideStorageKey = "ai666-task-guide-dismissed-date";
  const taskGuideDefaultOrder = "new-user,seven-day,image,prompt,invite";
  const taskGuideTasks = [
    {
      key: "new-user",
      datasetKey: "NewUser",
      label: "新手任务",
      state: "未完成",
      reward: "110 积分",
      cover: "assets/image_assets/18.png",
      title: "新手任务，先拿 110 积分",
      description: "几分钟完成基础动作，建立账号信用，解锁后续活动承接。",
      href: "./campaign-new-user.html",
      cta: "查看新手任务",
      entry: "成长入口"
    },
    {
      key: "seven-day",
      datasetKey: "SevenDay",
      label: "七日任务",
      state: "今日待做",
      reward: "320 积分",
      cover: "assets/image_assets/11.png",
      title: "七日成长，最高 320 积分",
      description: "每天完成一个关键动作，把浏览、收藏、发布和兑换串成稳定习惯。",
      href: "./campaign-seven-day.html",
      cta: "查看七日任务",
      entry: "连续成长"
    },
    {
      key: "image",
      datasetKey: "Image",
      label: "AI 生图",
      state: "可投稿",
      reward: "最高 1200 积分",
      cover: "assets/image_assets/2.png",
      title: "生图挑战，最高 1200 积分",
      description: "按主题发布作品，前 2 次有效发布有基础奖励，优质作品争取精选和首页曝光。",
      href: "./campaign-detail.html#image-challenge-tasks",
      cta: "去看活动详情",
      entry: "主题投稿"
    },
    {
      key: "prompt",
      datasetKey: "Prompt",
      label: "Prompts",
      state: "可投稿",
      reward: "最高 680 积分",
      cover: "assets/image_assets/4.png",
      title: "Prompt 共创，最高 680 积分",
      description: "发布可复用提示词，补充图文案例后更容易获得复用、精选和首页推荐。",
      href: "./campaign-prompt.html",
      cta: "去看活动详情",
      entry: "Prompt 投稿"
    },
    {
      key: "invite",
      datasetKey: "Invite",
      label: "邀请",
      state: "长期有效",
      reward: "单人最高 90 积分",
      cover: "assets/image_assets/15.jpg",
      title: "邀请好友，单人最高 90 积分",
      description: "把社区发给合适的创作者，好友注册、互动和首次发布后分阶段解锁奖励。",
      href: "./invite.html",
      cta: "查看邀请详情",
      entry: "邀请增长",
      inviteUrl: "duoyuan-shiguang.local/login?invite=SG2026",
      inviteLabel: "邀请链接"
    }
  ];

  function getTodayKey() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function getTaskGuideDatasetValue(task, suffix) {
    const key = `taskGuide${task.datasetKey}${suffix}`;
    return document.documentElement.dataset[key] || document.body?.dataset[key] || "";
  }

  function getTaskGuideStoredValue(task, suffix) {
    try {
      return window.localStorage.getItem(`ai666-task-guide-${task.key}-${suffix}`) || "";
    } catch (error) {
      return "";
    }
  }

  function isTaskGuideTaskComplete(task) {
    const explicit = getTaskGuideDatasetValue(task, "Complete") || getTaskGuideStoredValue(task, "complete");
    return explicit === "true";
  }

  function isTaskGuideTaskAvailable(task) {
    const explicit = getTaskGuideDatasetValue(task, "Available") || getTaskGuideStoredValue(task, "available");
    return explicit === "" || explicit === "true";
  }

  function selectDefaultTaskGuideTask() {
    return taskGuideTasks.find((task) => isTaskGuideTaskAvailable(task) && !isTaskGuideTaskComplete(task)) || taskGuideTasks[0];
  }

  function hasDismissedTaskGuideToday() {
    try {
      return window.localStorage.getItem(taskGuideStorageKey) === getTodayKey();
    } catch (error) {
      return false;
    }
  }

  function dismissTaskGuideForToday() {
    try {
      window.localStorage.setItem(taskGuideStorageKey, getTodayKey());
    } catch (error) {
      // Static prototype: storage can be unavailable in privacy modes.
    }
  }

  function shouldForceTaskGuideOpen() {
    const params = new URLSearchParams(window.location.search);
    return window.location.hash === "#task-guide" || params.get("taskGuide") === "1" || params.has("taskGuideTest");
  }

  function shouldSuppressTaskGuideForHash() {
    return window.location.hash === "#quick-create" || window.location.hash === "#quick-create-campaign";
  }

  function isTaskGuideHomeSurface() {
    const path = window.location.pathname.replace(/\\/g, "/");
    return path.endsWith("/") || path.endsWith("/index.html") || path === "index.html";
  }

  function createTaskGuideElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text) {
      node.textContent = text;
    }
    return node;
  }

  function createTaskGuideInviteLink(task) {
    if (!task.inviteUrl) {
      return null;
    }

    const box = createTaskGuideElement("div", "activity-task-guide-invite-link", "");
    const caption = createTaskGuideElement("span", "", task.inviteLabel || "邀请链接");
    const link = createTaskGuideElement("a", "", task.inviteUrl);
    link.href = "./login.html?invite=SG2026";
    link.dataset.taskGuideLink = "true";
    const button = createTaskGuideElement("button", "", "复制");
    button.type = "button";
    button.dataset.taskGuideCopy = "true";
    button.dataset.copyValue = task.inviteUrl;
    box.append(caption, link, button);
    return box;
  }

  function createTaskGuideMetric(label, value) {
    const item = createTaskGuideElement("div", "activity-task-guide-metric", "");
    item.append(createTaskGuideElement("span", "", label), createTaskGuideElement("strong", "", value));
    return item;
  }

  function createTaskGuideVisualPanel(task) {
    const visual = createTaskGuideElement("div", "activity-task-guide-visual", "");
    visual.style.setProperty("--task-guide-cover", `url("${task.cover}")`);

    const content = createTaskGuideElement("div", "activity-task-guide-visual-content", "");
    const title = createTaskGuideElement("h2", "", task.title);
    const description = createTaskGuideElement("p", "activity-task-guide-description", task.description);

    const metrics = createTaskGuideElement("div", "activity-task-guide-metrics", "");
    metrics.append(
      createTaskGuideMetric("奖励", task.reward)
    );

    const actionRow = createTaskGuideElement("div", "activity-task-guide-actions", "");
    const primary = createTaskGuideElement("a", "activity-task-guide-primary", task.cta);
    primary.href = task.href;
    primary.dataset.taskGuideLink = "true";
    actionRow.append(primary);

    const inviteLink = createTaskGuideInviteLink(task);
    content.append(title, description, metrics);
    if (inviteLink) {
      content.append(inviteLink);
    }
    content.append(actionRow);
    visual.append(content);
    return visual;
  }

  async function copyTaskGuideValue(button) {
    const value = button.dataset.copyValue || "";
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard?.writeText(value);
      button.textContent = "已复制";
    } catch (error) {
      button.textContent = "已选中";
    }

    window.setTimeout(() => {
      button.textContent = "复制";
    }, 1600);
  }

  function setActiveTaskGuideTask(modal, key) {
    const task = taskGuideTasks.find((item) => item.key === key) || selectDefaultTaskGuideTask();
    modal.dataset.taskGuideActive = task.key;

    modal.querySelectorAll("[data-task-guide-tab]").forEach((tab) => {
      const isActive = tab.dataset.taskGuideTab === task.key;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    const panel = modal.querySelector("[data-task-guide-panel]");
    if (!panel) {
      return;
    }

    panel.replaceChildren();
    panel.append(createTaskGuideVisualPanel(task));
  }

  function closeTaskGuide(modal, persist = true) {
    if (persist) {
      dismissTaskGuideForToday();
    }
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("activity-task-guide-open");
  }

  function openTaskGuide(modal, force = false) {
    if (!force && hasDismissedTaskGuideToday()) {
      return;
    }
    setActiveTaskGuideTask(modal, selectDefaultTaskGuideTask().key);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("activity-task-guide-open");
    window.requestAnimationFrame(() => {
      modal.querySelector(".activity-task-guide-primary")?.focus();
    });
  }

  function createTaskGuideModal() {
    const modal = createTaskGuideElement("section", "activity-task-guide", "");
    modal.setAttribute("data-task-guide-modal", "true");
    modal.setAttribute("data-task-guide-default-order", taskGuideDefaultOrder);
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("aria-label", "任务强引导");

    const backdrop = createTaskGuideElement("div", "activity-task-guide-backdrop", "");
    const dialog = createTaskGuideElement("div", "activity-task-guide-dialog", "");

    const head = createTaskGuideElement("div", "activity-task-guide-head", "");
    const headingBlock = createTaskGuideElement("div", "", "");
    headingBlock.append(
      createTaskGuideElement("h1", "", "参与活动，最高赚 2400 积分")
    );
    const closeButton = createTaskGuideElement("button", "activity-task-guide-close", "");
    closeButton.type = "button";
    closeButton.dataset.taskGuideDismiss = "true";
    closeButton.setAttribute("aria-label", "关闭任务引导");
    const closeIcon = document.createElement("img");
    closeIcon.src = "resources/icons/remixicon/svg/System/close-line.svg";
    closeIcon.alt = "";
    closeButton.append(closeIcon);
    head.append(headingBlock, closeButton);

    const body = createTaskGuideElement("div", "activity-task-guide-body", "");
    const tabs = createTaskGuideElement("div", "activity-task-guide-tabs", "");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "可切换任务");
    taskGuideTasks.forEach((task) => {
      const tab = createTaskGuideElement("button", "activity-task-guide-tab", "");
      tab.type = "button";
      tab.dataset.taskGuideTab = task.key;
      tab.setAttribute("role", "tab");
      tab.append(
        createTaskGuideElement("span", "", task.label),
        createTaskGuideElement("em", "", task.reward)
      );
      tabs.append(tab);
    });

    const panel = createTaskGuideElement("article", "activity-task-guide-panel", "");
    panel.dataset.taskGuidePanel = "true";
    panel.setAttribute("role", "tabpanel");
    body.append(tabs, panel);

    dialog.append(head, body);
    modal.append(backdrop, dialog);
    return modal;
  }

  function initActivityTaskGuide() {
    if (document.documentElement.dataset.taskGuideReady === "true") {
      return;
    }
    if (document.querySelector('[data-page="login"]')) {
      return;
    }

    document.documentElement.dataset.taskGuideReady = "true";
    const modal = createTaskGuideModal();
    document.body.append(modal);

    modal.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const tab = target.closest("[data-task-guide-tab]");
      if (tab) {
        event.preventDefault();
        setActiveTaskGuideTask(modal, tab.dataset.taskGuideTab);
        return;
      }
      const copyButton = target.closest("[data-task-guide-copy]");
      if (copyButton) {
        event.preventDefault();
        copyTaskGuideValue(copyButton);
        return;
      }
      if (target.closest("[data-task-guide-dismiss]")) {
        event.preventDefault();
        closeTaskGuide(modal, true);
        return;
      }
      if (target.closest("[data-task-guide-link]")) {
        dismissTaskGuideForToday();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeTaskGuide(modal, true);
      }
    });

    const forceOpen = shouldForceTaskGuideOpen();
    const shouldAutoOpenOnHome = isTaskGuideHomeSurface() && !shouldSuppressTaskGuideForHash();
    if (forceOpen || shouldAutoOpenOnHome) {
      openTaskGuide(modal, forceOpen || shouldAutoOpenOnHome);
    }
  }

  function init() {
    const gsap = window.gsap;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-v1-walkthrough-drawer]").forEach(enhanceDrawer);
    enhanceCreationModelSelects();
    enhanceUserMenus();
    initActivityTaskGuide();
    initResultPromptCopy();
    initContentCardCopy();
    initInviteCopyActions();
    initDetailActions();
    initCreationFlowMotion(gsap, reduceMotion);
    initFloatingCreateMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
