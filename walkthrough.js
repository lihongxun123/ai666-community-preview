(function () {
  const prototypeLabels = new Set(["页面定位", "用户主路径", "关键字段", "状态规则"]);
  const businessLabels = new Set(["动作去向", "运营维护", "研发关注", "交付边界"]);

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

  function markManualPane(drawer) {
    drawer.dataset.walkthroughManualPane = "true";
  }

  function resetToPrototype(drawer) {
    delete drawer.dataset.walkthroughManualPane;
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
      event.stopPropagation();
      markManualPane(drawer);
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
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
          return;
        }
        event.preventDefault();
        const nextPane = pane === "prototype" ? "business" : "prototype";
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
    activatePane(drawer, "prototype");
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

      const currentRadio = () => flow.querySelector(".creation-flow-radio:checked");
      const activeMode = () => dialog?.querySelector("[data-create-mode]:checked")?.value || "image";
      const promptForActiveMode = () => dialog?.querySelector(`[data-create-prompt][data-create-mode-panel="${activeMode()}"]`);
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
        }

        const fromRect = dialog?.getBoundingClientRect();
        stopGenerationLoop();
        targetRadio.checked = true;
        setStateData();
        syncPromptPreview();
        const nextPanel = visiblePanel();
        const toRect = dialog?.getBoundingClientRect();

        if (!gsap || reduceMotion || !dialog || !hasUsableRect(fromRect) || !hasUsableRect(toRect)) {
          startGenerationLoop();
          return;
        }

        const parts = Array.from(nextPanel?.querySelectorAll("[data-creation-motion-part], .creation-live-stage, .creation-state-aside, .creation-result-preview, .creation-destination-card") || []);
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
            startGenerationLoop();
          }
        });
        activeTween
          .to(dialog, { scaleX: 1, scaleY: 1, duration: 0.46, ease: "power3.inOut" }, 0)
          .to(nextPanel, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: "power2.out" }, 0.12)
          .to(parts, { autoAlpha: 1, y: 0, duration: 0.26, stagger: 0.035, ease: "power2.out" }, 0.18);
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
        transformOrigin: "50% 100%"
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
            duration: 0.52,
            ease: "power3.inOut"
          },
          0
        )
        .to(shell, { autoAlpha: 0, duration: 0.16, ease: "power1.out" }, 0.38)
        .to(dialog, { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "power2.out" }, 0.34)
        .to(revealParts, { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.035, ease: "power2.out" }, 0.38);
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
        .to(backdrop, { autoAlpha: 0, duration: 0.2, ease: "power1.out" }, 0)
        .to(
          shell,
          {
            scaleX: toRect.width / fromRect.width,
            scaleY: toRect.height / fromRect.height,
            borderRadius: radiusOf(trigger, "999px"),
            duration: 0.44,
            ease: "power3.inOut"
          },
          0
        )
        .to(shell, { autoAlpha: 0, duration: 0.14, ease: "power1.out" }, 0.34)
        .to(trigger, { autoAlpha: 1, duration: 0.16, ease: "power1.out" }, 0.34);
    };

    const startsOpen = window.location.hash === "#quick-create";
    modal.classList.toggle("is-quick-create-morph-open", startsOpen);
    setMorphState(startsOpen ? "open" : "closed");

    if (reduceMotion) {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        finishOpenWithoutMotion();
      });
      modal.addEventListener("click", (event) => {
        const closeTarget = event.target.closest(".modal-backdrop, .modal-close-icon");
        if (!closeTarget || !modal.contains(closeTarget)) {
          return;
        }
        event.preventDefault();
        finishCloseWithoutMotion();
      });
      return;
    }

    trigger.addEventListener("click", openQuickCreate);
    modal.addEventListener("click", (event) => {
      const closeTarget = event.target.closest(".modal-backdrop, .modal-close-icon");
      if (!closeTarget || !modal.contains(closeTarget)) {
        return;
      }
      closeQuickCreate(event);
    });
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

  function init() {
    const gsap = window.gsap;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-v1-walkthrough-drawer]").forEach(enhanceDrawer);
    enhanceCreationModelSelects();
    initCreationFlowMotion(gsap, reduceMotion);
    initFloatingCreateMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
