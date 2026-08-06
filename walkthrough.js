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

  function initCreationCampaignPurpose() {
    const modal = document.querySelector("#quick-create");
    const dialog = modal?.querySelector(".create-dialog");
    const normalPurpose = dialog?.querySelector('[data-create-purpose="normal"]');
    const campaignPurpose = dialog?.querySelector('[data-create-purpose="campaign"]');
    const imageMode = dialog?.querySelector('[data-create-mode="image"]');
    const purposeMenu = dialog?.querySelector("[data-create-purpose-menu]");
    const purposeCampaignOption = dialog?.querySelector('[data-create-purpose-option="campaign"]');
    const purposeClear = dialog?.querySelector(".creation-purpose-clear");
    if (!modal || !dialog || !normalPurpose || !campaignPurpose || !imageMode || dialog.dataset.creationCampaignPurposeReady === "true") {
      return;
    }

    dialog.dataset.creationCampaignPurposeReady = "true";
    const closePurposeMenu = () => {
      if (purposeMenu instanceof HTMLDetailsElement) {
        purposeMenu.open = false;
      }
    };
    const selectCampaign = () => {
      imageMode.checked = true;
      campaignPurpose.checked = true;
      closePurposeMenu();
    };
    const clearCampaign = () => {
      normalPurpose.checked = true;
      closePurposeMenu();
      if (window.location.hash === "#quick-create-campaign") {
        window.history.replaceState(null, "", "#quick-create");
      }
    };
    const syncPurposeRoute = () => {
      if (window.location.hash === "#quick-create-campaign") {
        selectCampaign();
        return;
      }
      if (window.location.hash === "#quick-create") {
        normalPurpose.checked = true;
        closePurposeMenu();
      }
    };

    purposeCampaignOption?.addEventListener("click", () => {
      window.requestAnimationFrame(selectCampaign);
    });
    purposeClear?.addEventListener("click", () => {
      window.requestAnimationFrame(clearCampaign);
    });
    dialog.querySelectorAll("[data-create-mode]").forEach((mode) => {
      mode.addEventListener("change", () => {
        if (mode.checked && mode.value !== "image") {
          clearCampaign();
        }
      });
    });
    window.addEventListener("hashchange", syncPurposeRoute);
    syncPurposeRoute();
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
      nextUrl.hash = isOpen
        ? (window.location.hash === "#quick-create-campaign" ? "quick-create-campaign" : "quick-create")
        : "";
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

    const startsOpen = window.location.hash === "#quick-create" || window.location.hash === "#quick-create-campaign";
    modal.classList.remove("is-quick-create-morph-open", "is-quick-create-morphing");
    setMorphState("closed");
    trigger.dataset.quickCreateHashOpenPending = startsOpen ? "true" : "false";
    const requestHashOpen = () => {
      if (!["#quick-create", "#quick-create-campaign"].includes(window.location.hash) || root.dataset.quickCreateMorphState !== "closed") {
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
    const head = card.querySelector(".prompt-detail-copy-head, .detail-prompt-head");
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

    let head = card.querySelector(".prompt-detail-copy-head, .detail-prompt-head");
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

  function updateDetailCommentState(action) {
    const target = action.dataset.commentTabTarget
      ? document.getElementById(action.dataset.commentTabTarget)
      : action.closest(".case-detail-aside")?.querySelector(".detail-tab-radio:nth-of-type(2)");

    if (target) {
      target.checked = true;
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }

    action.dataset.commentState = "focused";
    action.dataset.ctaState = "comment";
  }

  function updateDetailActionState(action) {
    if (action.matches("[data-detail-like-action]")) {
      updateDetailLikeState(action);
    } else if (action.matches("[data-detail-comment-action]")) {
      updateDetailCommentState(action);
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
    document.querySelectorAll("[data-detail-like-action], [data-detail-comment-action], [data-detail-favorite-action], [data-detail-share-action]").forEach(normalizeDetailStatAction);

    document.addEventListener("click", (event) => {
      const action = event.target.closest("[data-detail-like-action], [data-detail-comment-action], [data-detail-favorite-action], [data-detail-share-action]");
      if (!action) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      updateDetailActionState(action);
    }, true);

    document.addEventListener("keydown", (event) => {
      const action = event.target.closest("[data-detail-like-action], [data-detail-comment-action], [data-detail-favorite-action], [data-detail-share-action]");
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
      { key: "profile", label: "个人中心", href: "./user-center.html", icon: "resources/icons/remixicon/svg/User & Faces/user-3-line.svg" },
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

  const taskGuideDailyStoragePrefix = "ai666-task-guide-daily";
  const taskGuideEventStoragePrefix = "ai666-task-guide-event";
  const taskGuideTestStateKeys = [
    "guest-registration",
    "registration-success",
    "new-user-pending",
    "new-user-task-complete",
    "new-user-complete",
    "seven-day-pending",
    "seven-day-task-complete",
    "seven-day-waiting",
    "seven-day-complete-more",
    "seven-day-complete-empty",
    "reward-processing",
    "reward-unknown",
    "data-unavailable"
  ];
  const taskGuideFormalNewUserTasks = [
    {
      taskCode: "first_visit",
      taskName: "首次访问多元拾光",
      description: "首次进入多元拾光并完成注册",
      rewardPoints: 20,
      progressTarget: 1,
      ctaText: "注册并领取 20 积分",
      ctaRoute: "./login.html?taskGuideScenario=registration#auth"
    },
    {
      taskCode: "browse_aigc_work",
      taskName: "浏览AIGC作品",
      description: "浏览任意一篇 AIGC 作品详情",
      rewardPoints: 30,
      progressTarget: 1,
      ctaText: "去浏览作品",
      ctaRoute: "./aigc.html"
    },
    {
      taskCode: "edit_profile",
      taskName: "完善资料",
      description: "完善个人资料信息",
      rewardPoints: 30,
      progressTarget: 1,
      ctaText: "去完善资料",
      ctaRoute: "./user-center.html#edit-profile"
    },
    {
      taskCode: "first_interaction",
      taskName: "首次互动",
      description: "完成首次点赞、评论、收藏等互动",
      rewardPoints: 30,
      progressTarget: 1,
      ctaText: "去完成互动",
      ctaRoute: "./aigc.html"
    },
    {
      taskCode: "share_work",
      taskName: "分享一条作品",
      description: "浏览最新作品并复制分享链接给好友",
      rewardPoints: 40,
      progressTarget: 1,
      ctaText: "去分享作品",
      ctaRoute: "./aigc.html"
    }
  ];
  const taskGuideFormalSevenDayTasks = [
    { taskCode: "growth_day_1", taskName: "浏览 3 条 AIGC 内容", description: "第 1 天：浏览 3 条 AIGC 内容", rewardPoints: 20, progressTarget: 3, ctaRoute: "./aigc.html" },
    { taskCode: "growth_day_2", taskName: "复制 1 条 Prompt", description: "第 2 天：复制 1 条 Prompt", rewardPoints: 30, progressTarget: 1, ctaRoute: "./aigc.html#case-gallery-prompt" },
    { taskCode: "growth_day_3", taskName: "收藏 1 条 AI 作品", description: "第 3 天：收藏 1 条 AI 作品", rewardPoints: 30, progressTarget: 1, ctaRoute: "./aigc.html" },
    { taskCode: "growth_day_4", taskName: "点赞或评论 1 条内容", description: "第 4 天：点赞或评论 1 条内容", rewardPoints: 40, progressTarget: 1, ctaRoute: "./aigc.html" },
    { taskCode: "growth_day_5", taskName: "转发 1 个 AI 作品", description: "第 5 天：转发 1 个 AI 作品", rewardPoints: 50, progressTarget: 1, ctaRoute: "./aigc.html" },
    { taskCode: "growth_day_6", taskName: "转发 1 条闪念", description: "第 6 天：转发 1 条社区闪念", rewardPoints: 60, progressTarget: 1, ctaRoute: "./flash.html" },
    { taskCode: "growth_day_7", taskName: "发布 1 个 AI 作品", description: "第 7 天：发布 1 个 AI 作品", rewardPoints: 70, progressTarget: 1, ctaRoute: "./aigc.html#quick-create" }
  ];

  function getTaskGuideIndex(params, key, fallback, max) {
    const rawValue = params.get(key);
    if (rawValue === null || rawValue.trim() === "") return fallback;
    const value = Number(rawValue);
    return Number.isInteger(value) ? Math.max(1, Math.min(value, max)) : fallback;
  }

  function createNewUserPendingState(taskIndex = 2) {
    const safeIndex = Math.max(1, Math.min(taskIndex, taskGuideFormalNewUserTasks.length));
    const task = taskGuideFormalNewUserTasks[safeIndex - 1];
    const isRegistration = safeIndex === 1;
    return {
      stateKey: isRegistration ? "guest-registration" : "new-user-pending",
      surface: "bubble",
      variant: isRegistration ? "onboarding" : "",
      frequency: "persistent",
      phaseLabel: `新人任务 · ${safeIndex}/${taskGuideFormalNewUserTasks.length}`,
      title: isRegistration ? "完成注册，领取新人第一笔积分" : `继续完成第 ${safeIndex} 项新人任务`,
      description: task.description,
      taskName: task.taskName,
      progressCurrent: 0,
      progressTarget: task.progressTarget,
      rewardPoints: task.rewardPoints,
      ctaText: task.ctaText,
      ctaRoute: task.ctaRoute,
      secondaryText: isRegistration ? "已有账号，去登录" : "查看全部新手任务",
      secondaryRoute: isRegistration ? "./login.html#auth" : "./campaign-new-user.html",
      icon: isRegistration
        ? "resources/icons/remixicon/svg/Map/rocket-2-line.svg"
        : "resources/icons/remixicon/svg/Document/task-line.svg"
    };
  }

  function createSevenDayPendingState(dayIndex = 2) {
    const safeDay = Math.max(1, Math.min(dayIndex, taskGuideFormalSevenDayTasks.length));
    const task = taskGuideFormalSevenDayTasks[safeDay - 1];
    return {
      stateKey: "seven-day-pending",
      surface: "bubble",
      frequency: "persistent",
      phaseLabel: `七日任务 · D${safeDay}`,
      title: `今天完成 D${safeDay} 任务`,
      description: task.description,
      taskName: task.taskName,
      progressCurrent: 0,
      progressTarget: task.progressTarget,
      rewardPoints: task.rewardPoints,
      ctaText: `去完成 D${safeDay}`,
      ctaRoute: task.ctaRoute,
      secondaryText: "查看七日任务",
      secondaryRoute: "./campaign-seven-day.html",
      icon: "resources/icons/remixicon/svg/Document/task-line.svg"
    };
  }

  function createSevenDayWaitingState(dayIndex = 1) {
    const safeDay = Math.max(1, Math.min(dayIndex, taskGuideFormalSevenDayTasks.length));
    const isFinalDay = safeDay === taskGuideFormalSevenDayTasks.length;
    return {
      stateKey: "seven-day-waiting",
      surface: "bubble",
      frequency: "daily",
      phaseLabel: isFinalDay ? "七日任务完成" : `七日任务 · D${safeDay} 已完成`,
      title: isFinalDay ? "七日成长已经全部完成" : "今天的成长任务已完成",
      description: isFinalDay
        ? "继续去活动中心看看其他可以获得积分的任务。"
        : `D${safeDay + 1} 将在明日解锁，现在可以去活动中心看看其他积分任务。`,
      ctaText: "查看其他积分任务",
      ctaRoute: "./activity-center.html",
      icon: "resources/icons/remixicon/svg/Business/calendar-check-line.svg"
    };
  }

  function createTaskCompletionState(track, taskIndex) {
    const isNewUser = track === "new-user";
    const tasks = isNewUser ? taskGuideFormalNewUserTasks : taskGuideFormalSevenDayTasks;
    const safeIndex = Math.max(1, Math.min(taskIndex, tasks.length));
    const task = tasks[safeIndex - 1];
    const newUserFinished = isNewUser && safeIndex === tasks.length;
    const followupState = isNewUser
      ? (newUserFinished ? createSevenDayPendingState(1) : createNewUserPendingState(safeIndex + 1))
      : createSevenDayWaitingState(safeIndex);
    return {
      stateKey: isNewUser
        ? (safeIndex === 1 ? "registration-success" : (newUserFinished ? "new-user-complete" : "new-user-task-complete"))
        : "seven-day-task-complete",
      surface: "toast",
      frequency: "event",
      eventId: `${task.taskCode}-complete`,
      phaseLabel: isNewUser ? "新人任务完成" : `七日任务 · D${safeIndex} 完成`,
      title: newUserFinished ? "新手任务已经全部完成" : `“${task.taskName}”已完成`,
      description: isNewUser
        ? (newUserFinished ? "新人主线已完成，接下来完成 D1 任务。" : `下一项：${tasks[safeIndex].taskName}`)
        : (safeIndex === tasks.length ? "七日成长已完成，继续探索其他积分任务。" : `D${safeIndex + 1} 将在明日解锁。`),
      rewardStatusText: `+${task.rewardPoints} 积分已到账`,
      followupState,
      autoAdvanceMs: 2600,
      icon: "resources/icons/remixicon/svg/System/checkbox-circle-fill.svg"
    };
  }

  function createSevenDayCompletionBranchState(dayIndex, branch = "default") {
    const state = createTaskCompletionState("seven-day", dayIndex);
    if (branch === "empty") {
      return {
        ...state,
        stateKey: "seven-day-complete-empty",
        eventId: `${state.eventId}-empty`,
        followupState: null
      };
    }
    if (branch === "more") {
      return {
        ...state,
        stateKey: "seven-day-complete-more",
        eventId: `${state.eventId}-more`
      };
    }
    return state;
  }

  const taskGuideDemoStates = {
    "reward-processing": {
      stateKey: "reward-processing",
      surface: "toast",
      frequency: "event",
      eventId: "reward-processing",
      phaseLabel: "奖励处理中",
      title: "任务已完成，奖励发放中",
      description: "积分正在处理中，到账后会在积分记录中显示。",
      rewardStatusText: "奖励发放中",
      ctaText: "查看任务记录",
      ctaRoute: "./activity-center.html",
      icon: "resources/icons/remixicon/svg/Finance/coins-line.svg"
    },
    "reward-unknown": {
      stateKey: "reward-unknown",
      surface: "toast",
      frequency: "event",
      eventId: "reward-unknown",
      phaseLabel: "奖励结果待确认",
      title: "任务已完成，奖励结果请稍后查看",
      description: "可以稍后在积分记录中查看最终结果。",
      rewardStatusText: "奖励结果待确认",
      icon: "resources/icons/remixicon/svg/System/information-line.svg"
    },
    "data-unavailable": {
      stateKey: "data-unavailable",
      surface: "none",
      frequency: "none"
    }
  };

  function resolveTaskGuideDemoState(stateKey, params = new URLSearchParams(window.location.search)) {
    if (stateKey === "guest-registration") return createNewUserPendingState(1);
    if (stateKey === "registration-success") return createTaskCompletionState("new-user", 1);
    if (stateKey === "new-user-pending") return createNewUserPendingState(getTaskGuideIndex(params, "task", 2, taskGuideFormalNewUserTasks.length));
    if (stateKey === "new-user-task-complete") return createTaskCompletionState("new-user", getTaskGuideIndex(params, "task", 2, taskGuideFormalNewUserTasks.length));
    if (stateKey === "new-user-complete") return createTaskCompletionState("new-user", taskGuideFormalNewUserTasks.length);
    if (stateKey === "seven-day-pending") return createSevenDayPendingState(getTaskGuideIndex(params, "day", 2, taskGuideFormalSevenDayTasks.length));
    if (stateKey === "seven-day-task-complete") return createSevenDayCompletionBranchState(getTaskGuideIndex(params, "day", 1, taskGuideFormalSevenDayTasks.length));
    if (stateKey === "seven-day-complete-more") return createSevenDayCompletionBranchState(getTaskGuideIndex(params, "day", 1, taskGuideFormalSevenDayTasks.length), "more");
    if (stateKey === "seven-day-complete-empty") return createSevenDayCompletionBranchState(getTaskGuideIndex(params, "day", 1, taskGuideFormalSevenDayTasks.length), "empty");
    if (stateKey === "seven-day-waiting") return createSevenDayWaitingState(getTaskGuideIndex(params, "day", 1, taskGuideFormalSevenDayTasks.length));
    return taskGuideDemoStates[stateKey] ? { ...taskGuideDemoStates[stateKey] } : null;
  }

  function getTodayKey() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function isTaskGuideHomeSurface() {
    const path = window.location.pathname.replace(/\\/g, "/");
    return path.endsWith("/") || path.endsWith("/index.html") || path === "index.html";
  }

  function createTaskGuideElement(tag, className, text = "") {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text) {
      node.textContent = text;
    }
    return node;
  }

  function cloneTaskGuideState(stateKey, params = new URLSearchParams(window.location.search)) {
    const state = resolveTaskGuideDemoState(stateKey, params);
    return state ? { ...state } : null;
  }

  function getRequestedTaskGuideState() {
    const params = new URLSearchParams(window.location.search);
    const explicitState = params.get("taskGuideTest") || params.get("taskGuideState");
    if (explicitState) {
      return {
        stateKey: taskGuideTestStateKeys.includes(explicitState) ? explicitState : "data-unavailable",
        isTest: params.has("taskGuideTest")
      };
    }
    if (params.get("taskGuide") === "1" || window.location.hash === "#task-guide") {
      return { stateKey: "guest-registration", isTest: true };
    }
    return null;
  }

  function resolveTaskGuideState() {
    const requested = getRequestedTaskGuideState();
    if (requested) {
      return { ...cloneTaskGuideState(requested.stateKey), ...requested };
    }

    const injected = window.ai666TaskGuideState;
    if (injected && typeof injected === "object") {
      if (injected.available === false) {
        return cloneTaskGuideState("data-unavailable");
      }
      const stateKey = taskGuideTestStateKeys.includes(injected.stateKey) ? injected.stateKey : "data-unavailable";
      return { ...cloneTaskGuideState(stateKey), ...injected, stateKey, isTest: false };
    }

    const datasetState = document.documentElement.dataset.taskGuideState || document.body?.dataset.taskGuideState;
    if (datasetState) {
      const stateKey = taskGuideTestStateKeys.includes(datasetState) ? datasetState : "data-unavailable";
      return { ...cloneTaskGuideState(stateKey), stateKey, isTest: false };
    }

    // 首页静态原型默认展示游客注册主线，已登录用户由任务结果注入下一项新手或当天七日任务。
    if (isTaskGuideHomeSurface()) {
      return { ...cloneTaskGuideState("guest-registration"), isPrototypeFallback: true, isTest: false };
    }
    return null;
  }

  function getTaskGuideFrequencyKey(state) {
    if (state.frequency === "daily") {
      return `${taskGuideDailyStoragePrefix}-${state.stateKey}-${getTodayKey()}`;
    }
    if (state.frequency === "event" && state.eventId) {
      return `${taskGuideEventStoragePrefix}-${state.eventId}`;
    }
    return "";
  }

  function hasSeenTaskGuideState(state) {
    if (state.isTest) {
      return false;
    }
    const key = getTaskGuideFrequencyKey(state);
    if (!key) {
      return false;
    }
    try {
      return window.localStorage.getItem(key) === "seen";
    } catch (error) {
      return false;
    }
  }

  function markTaskGuideStateSeen(state) {
    const key = getTaskGuideFrequencyKey(state);
    if (!key || state.isTest) {
      return;
    }
    try {
      window.localStorage.setItem(key, "seen");
    } catch (error) {
      // Static prototype: storage can be unavailable in privacy modes.
    }
  }

  function shouldSuppressTaskGuide() {
    if (window.location.hash === "#quick-create" || window.location.hash === "#quick-create-campaign") {
      return true;
    }
    return Boolean(document.querySelector('[aria-modal="true"]:not([aria-hidden="true"]):not([data-task-guide-dialog])'));
  }

  function createTaskGuideIcon(src, className = "task-guide-icon") {
    const icon = document.createElement("img");
    icon.className = className;
    icon.src = src || "resources/icons/remixicon/svg/Document/task-line.svg";
    icon.alt = "";
    return icon;
  }

  function createTaskGuideCloseButton() {
    const button = createTaskGuideElement("button", "task-guide-close");
    button.type = "button";
    button.dataset.taskGuideDismiss = "true";
    button.setAttribute("aria-label", "关闭任务提示");
    button.append(createTaskGuideIcon("resources/icons/remixicon/svg/System/close-line.svg", ""));
    return button;
  }

  function createTaskGuideProgress(state) {
    const target = Number(state.progressTarget || 0);
    if (target <= 0) {
      return null;
    }
    const current = Math.max(0, Math.min(Number(state.progressCurrent || 0), target));
    const progress = createTaskGuideElement("div", "task-guide-progress");
    const meta = createTaskGuideElement("div", "task-guide-progress-meta");
    meta.append(
      createTaskGuideElement("span", "", "任务进度"),
      createTaskGuideElement("strong", "", `${current}/${target}`)
    );
    const track = createTaskGuideElement("div", "task-guide-progress-track");
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", String(target));
    track.setAttribute("aria-valuenow", String(current));
    const bar = createTaskGuideElement("span", "task-guide-progress-bar");
    bar.style.width = `${Math.round((current / target) * 100)}%`;
    track.append(bar);
    progress.append(meta, track);
    return progress;
  }

  function createTaskGuideTaskRow(state) {
    if (!state.taskName) {
      return null;
    }
    const row = createTaskGuideElement("div", "task-guide-task-row");
    const copy = createTaskGuideElement("div", "");
    copy.append(
      createTaskGuideElement("span", "", "当前任务"),
      createTaskGuideElement("strong", "", state.taskName)
    );
    row.append(createTaskGuideIcon("resources/icons/remixicon/svg/Document/task-line.svg", "task-guide-task-icon"), copy);
    if (Number(state.rewardPoints || 0) > 0) {
      row.append(createTaskGuideElement("em", "task-guide-reward-chip", `+${Number(state.rewardPoints)} 积分`));
    }
    return row;
  }

  function createTaskGuideStatus(state) {
    if (!state.rewardStatusText) {
      return null;
    }
    const status = createTaskGuideElement("div", "task-guide-status", state.rewardStatusText);
    status.prepend(createTaskGuideIcon("resources/icons/remixicon/svg/Finance/coins-line.svg", ""));
    return status;
  }

  function createTaskGuideActions(state) {
    if (!state.ctaText && !state.secondaryText) {
      return null;
    }
    const actions = createTaskGuideElement("div", "task-guide-actions");
    if (state.ctaText && state.ctaRoute) {
      const primary = createTaskGuideElement("a", "task-guide-primary", state.ctaText);
      primary.href = state.ctaRoute;
      primary.dataset.taskGuideAction = "primary";
      primary.append(createTaskGuideIcon("resources/icons/remixicon/svg/Arrows/arrow-right-line.svg", ""));
      actions.append(primary);
    }
    if (state.secondaryText && state.secondaryRoute) {
      const secondary = createTaskGuideElement("a", "task-guide-secondary", state.secondaryText);
      secondary.href = state.secondaryRoute;
      secondary.dataset.taskGuideAction = "secondary";
      actions.append(secondary);
    }
    return actions;
  }

  function createTaskGuideContent(state, compact = false) {
    const content = createTaskGuideElement("div", compact ? "task-guide-content is-compact" : "task-guide-content");
    const head = createTaskGuideElement("div", "task-guide-content-head");
    const iconWrap = createTaskGuideElement("span", "task-guide-icon-wrap");
    iconWrap.append(createTaskGuideIcon(state.icon));
    const copy = createTaskGuideElement("div", "task-guide-copy");
    copy.append(
      createTaskGuideElement("span", "task-guide-phase", state.phaseLabel || "成长任务"),
      createTaskGuideElement("h2", "", state.title || "继续完成成长任务")
    );
    if (state.description) {
      copy.append(createTaskGuideElement("p", "", state.description));
    }
    head.append(iconWrap, copy);
    content.append(head);

    const taskRow = createTaskGuideTaskRow(state);
    const progress = createTaskGuideProgress(state);
    const status = createTaskGuideStatus(state);
    const actions = createTaskGuideActions(state);
    if (taskRow) content.append(taskRow);
    if (progress) content.append(progress);
    if (status) content.append(status);
    if (actions) content.append(actions);
    return content;
  }

  function createTaskGuideToastContent(state) {
    const content = createTaskGuideElement("div", "task-guide-toast-content");
    const iconWrap = createTaskGuideElement("span", "task-guide-toast-icon-wrap");
    iconWrap.append(createTaskGuideIcon(state.icon, "task-guide-toast-icon"));
    const copy = createTaskGuideElement("div", "task-guide-toast-copy");
    const primaryText = state.rewardStatusText || state.title || "任务状态已更新";
    const secondaryText = state.title && state.title !== primaryText && !state.title.includes(primaryText)
      ? state.title
      : state.description;
    copy.append(createTaskGuideElement("strong", "", primaryText));
    if (secondaryText) {
      copy.append(createTaskGuideElement("span", "", secondaryText));
    }
    content.append(iconWrap, copy);
    return content;
  }

  function createTaskGuideModal(state) {
    const layer = createTaskGuideElement("div", "task-guide-surface task-guide-modal-layer");
    layer.dataset.taskGuideSurface = "modal";
    layer.dataset.taskGuideState = state.stateKey;
    const backdrop = createTaskGuideElement("div", "task-guide-modal-backdrop");
    const dialog = createTaskGuideElement("section", "task-guide-modal");
    dialog.dataset.taskGuideDialog = "true";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", `task-guide-title-${state.stateKey}`);
    const close = createTaskGuideCloseButton();
    const content = createTaskGuideContent(state);
    content.querySelector("h2").id = `task-guide-title-${state.stateKey}`;
    dialog.append(close, content);
    layer.append(backdrop, dialog);
    return layer;
  }

  function createTaskGuideBubble(state) {
    const bubble = createTaskGuideElement("aside", "task-guide-surface task-guide-bubble");
    if (state.variant === "onboarding") {
      bubble.classList.add("is-onboarding");
    }
    bubble.dataset.taskGuideSurface = "bubble";
    bubble.dataset.taskGuideState = state.stateKey;
    bubble.setAttribute("role", "status");
    bubble.setAttribute("aria-live", "polite");
    bubble.append(createTaskGuideCloseButton(), createTaskGuideContent(state, true));
    return bubble;
  }

  function createTaskGuideToast(state) {
    const toast = createTaskGuideElement("aside", "task-guide-surface task-guide-toast");
    toast.dataset.taskGuideSurface = "toast";
    toast.dataset.taskGuideState = state.stateKey;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.append(createTaskGuideToastContent(state));
    return toast;
  }

  function positionTaskGuideBubble(bubble, anchor) {
    if (window.matchMedia("(max-width: 820px)").matches) {
      bubble.style.removeProperty("left");
      bubble.style.removeProperty("top");
      bubble.style.removeProperty("--task-guide-arrow-left");
      return;
    }
    const anchorRect = anchor.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    const left = Math.max(12, Math.min(window.innerWidth - bubbleRect.width - 12, anchorRect.right - bubbleRect.width));
    const top = Math.min(window.innerHeight - bubbleRect.height - 12, anchorRect.bottom + 12);
    bubble.style.left = `${left}px`;
    bubble.style.top = `${Math.max(12, top)}px`;
    bubble.style.setProperty("--task-guide-arrow-left", `${Math.max(20, Math.min(bubbleRect.width - 20, anchorRect.left + anchorRect.width / 2 - left))}px`);
  }

  function mountTaskGuideSurface(state) {
    const anchor = document.querySelector('[data-nav-action="activity-center"], .activity-center-link');
    const followupState = state.followupState ? { ...state.followupState, isTest: state.isTest } : null;
    let surface = null;
    if (state.surface === "modal") {
      surface = createTaskGuideModal(state);
    } else if (state.surface === "bubble" && anchor) {
      surface = createTaskGuideBubble(state);
    } else if (state.surface === "toast") {
      surface = createTaskGuideToast(state);
    }
    if (!surface) {
      return;
    }

    const focusReturn = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let autoDismissTimer = 0;
    let positionHandler = null;
    const close = (persist = true, revealFollowup = false) => {
      if (!surface.isConnected) {
        return;
      }
      if (persist) {
        markTaskGuideStateSeen(state);
      }
      if (autoDismissTimer) {
        window.clearTimeout(autoDismissTimer);
      }
      if (positionHandler) {
        window.removeEventListener("resize", positionHandler);
        window.removeEventListener("scroll", positionHandler, true);
      }
      surface.classList.add("is-leaving");
      document.body.classList.remove("task-guide-modal-open");
      window.setTimeout(() => {
        surface.remove();
        if (revealFollowup && followupState && !shouldSuppressTaskGuide()) {
          mountTaskGuideSurface(followupState);
        }
      }, 180);
      focusReturn?.focus?.();
    };

    surface.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.closest("[data-task-guide-dismiss]")) {
        event.preventDefault();
        close(true, state.surface === "toast" && Boolean(followupState));
        return;
      }
      if (target.closest("[data-task-guide-action]")) {
        markTaskGuideStateSeen(state);
      }
    });
    if (state.surface !== "toast") {
      document.addEventListener("keydown", function handleTaskGuideEscape(event) {
        if (event.key === "Escape" && surface.isConnected) {
          close(true, false);
          document.removeEventListener("keydown", handleTaskGuideEscape);
        }
      });
    }

    document.body.append(surface);
    window.requestAnimationFrame(() => surface.classList.add("is-open"));
    if (state.surface === "modal") {
      document.body.classList.add("task-guide-modal-open");
      window.requestAnimationFrame(() => surface.querySelector(".task-guide-primary")?.focus());
    }
    if (state.surface === "bubble" && anchor) {
      positionHandler = () => positionTaskGuideBubble(surface, anchor);
      positionHandler();
      if (state.variant === "onboarding") {
        anchor.classList.add("is-task-guide-highlighted");
        window.setTimeout(() => anchor.classList.remove("is-task-guide-highlighted"), 2600);
      }
      window.addEventListener("resize", positionHandler);
      window.addEventListener("scroll", positionHandler, true);
    }
    if (state.surface === "toast") {
      autoDismissTimer = window.setTimeout(
        () => close(true, Boolean(followupState)),
        Number(state.autoAdvanceMs || 2600)
      );
    }
  }

  function initActivityTaskGuide() {
    if (document.documentElement.dataset.taskGuideReady === "true" || document.querySelector('[data-page="login"]')) {
      return;
    }
    document.documentElement.dataset.taskGuideReady = "true";
    const state = resolveTaskGuideState();
    document.documentElement.dataset.taskGuideResolvedState = state?.stateKey || "none";
    if (!state || state.surface === "none" || shouldSuppressTaskGuide() || hasSeenTaskGuideState(state)) {
      return;
    }
    mountTaskGuideSurface(state);
  }

  function initLoginPrototype() {
    const root = document.querySelector("[data-login-modal-root]");
    const form = root?.querySelector("[data-login-form]");
    if (!root || !form || root.dataset.loginPrototypeReady === "true") {
      return;
    }

    root.dataset.loginPrototypeReady = "true";
    const phoneInput = form.elements.phone;
    const codeInput = form.elements["verification-code"];
    const inviteInput = form.elements["invite-code"];
    const sendCodeButton = root.querySelector("[data-send-code]");
    const submitButton = root.querySelector("[data-login-complete-target]");
    const message = root.querySelector("[data-login-message]");
    const registrationScenario = new URLSearchParams(window.location.search).get("taskGuideScenario") === "registration";
    let cooldownTimer = 0;
    let cooldownActive = false;

    const setMessage = (text, type = "") => {
      if (!message) return;
      message.textContent = text;
      message.dataset.type = type;
    };

    const phoneIsValid = () => /^1[3-9]\d{9}$/.test(phoneInput?.value.trim() || "");

    const syncSendCodeState = () => {
      if (!sendCodeButton || cooldownActive) return;
      const disabled = !phoneIsValid();
      sendCodeButton.disabled = disabled;
      sendCodeButton.setAttribute("aria-disabled", String(disabled));
    };

    if (inviteInput) {
      const inviteCode = new URLSearchParams(window.location.search).get("invite");
      if (inviteCode) inviteInput.value = inviteCode;
    }

    phoneInput?.addEventListener("input", () => {
      phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 11);
      phoneInput.closest(".login-field")?.classList.remove("is-invalid");
      if (message?.dataset.type === "error") setMessage("");
      syncSendCodeState();
    });

    codeInput?.addEventListener("input", () => {
      codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
      codeInput.closest(".login-field")?.classList.remove("is-invalid");
      if (message?.dataset.type === "error") setMessage("");
    });

    sendCodeButton?.addEventListener("click", () => {
      if (!phoneIsValid()) {
        phoneInput?.closest(".login-field")?.classList.add("is-invalid");
        phoneInput?.focus();
        setMessage("请输入正确的 11 位手机号", "error");
        return;
      }

      setMessage("验证码发送状态仅用于原型走查", "success");
      let remaining = 60;
      cooldownActive = true;
      sendCodeButton.disabled = true;
      sendCodeButton.setAttribute("aria-disabled", "true");
      sendCodeButton.textContent = `${remaining}s 后重试`;
      window.clearInterval(cooldownTimer);
      cooldownTimer = window.setInterval(() => {
        remaining -= 1;
        sendCodeButton.textContent = remaining > 0 ? `${remaining}s 后重试` : "获取验证码";
        if (remaining <= 0) {
          window.clearInterval(cooldownTimer);
          cooldownActive = false;
          syncSendCodeState();
        }
      }, 1000);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.querySelectorAll(".is-invalid").forEach((field) => field.classList.remove("is-invalid"));
      if (!phoneIsValid()) {
        phoneInput?.closest(".login-field")?.classList.add("is-invalid");
        phoneInput?.focus();
        setMessage("请输入正确的 11 位手机号", "error");
        return;
      }
      if (!/^\d{6}$/.test(codeInput?.value.trim() || "")) {
        codeInput?.closest(".login-field")?.classList.add("is-invalid");
        codeInput?.focus();
        setMessage("请输入 6 位验证码", "error");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = registrationScenario ? "注册并登录中…" : "登录中…";
      window.setTimeout(() => {
        submitButton.textContent = registrationScenario ? "注册成功" : "登录成功";
        setMessage(
          registrationScenario ? "注册成功，正在自动登录并返回首页" : "登录成功，正式产品将返回登录前页面",
          "success"
        );
        if (registrationScenario) {
          window.setTimeout(() => {
            window.location.href = "./index.html?taskGuideTest=registration-success";
          }, 720);
        }
      }, 480);
    });

    root.querySelectorAll("[data-login-agreement]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        setMessage("协议内容由正式页面承接");
      });
    });

    syncSendCodeState();
  }

  function init() {
    const gsap = window.gsap;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-v1-walkthrough-drawer]").forEach(enhanceDrawer);
    enhanceCreationModelSelects();
    initCreationCampaignPurpose();
    enhanceUserMenus();
    initLoginPrototype();
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
