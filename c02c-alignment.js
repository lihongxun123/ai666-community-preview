(() => {
  const setActive = (nodes, active) => nodes.forEach((node) => node.classList.toggle("is-active", node === active));

  const workCards = [...document.querySelectorAll("[data-work-card]")];
  const contentFilters = [...document.querySelectorAll("[data-content-filter]")];
  const topicFilters = [...document.querySelectorAll("[data-topic-filter]")];
  const workSearch = document.querySelector("[data-work-search]");
  let contentType = "all";
  let topic = "all";

  const filterWorks = () => {
    const keyword = String(workSearch?.value || "").trim().toLowerCase();
    workCards.forEach((card) => {
      const typeMatch = contentType === "all" || card.dataset.contentType === contentType;
      const topicMatch = topic === "all" || (card.dataset.topics || "").split(",").includes(topic);
      const keywordMatch = !keyword || card.textContent.toLowerCase().includes(keyword);
      card.hidden = !(typeMatch && topicMatch && keywordMatch);
    });
  };

  contentFilters.forEach((button) => button.addEventListener("click", () => {
    contentType = button.dataset.contentFilter;
    setActive(contentFilters, button);
    filterWorks();
  }));
  topicFilters.forEach((button) => button.addEventListener("click", () => {
    topic = button.dataset.topicFilter;
    setActive(topicFilters, button);
    filterWorks();
  }));
  workSearch?.addEventListener("input", filterWorks);

  const detailTitle = document.querySelector("[data-work-detail-title]");
  const detailIntro = document.querySelector("[data-work-detail-intro]");
  const detailMeta = document.querySelector("[data-work-detail-meta]");
  const detailMedia = document.querySelector("[data-work-detail-media]");
  workCards.forEach((card) => card.addEventListener("click", () => {
    if (detailTitle) detailTitle.textContent = card.dataset.title || "作品详情";
    if (detailIntro) detailIntro.textContent = card.dataset.intro || "";
    if (detailMeta) detailMeta.textContent = card.dataset.detailMeta || "";
    if (detailMedia) detailMedia.src = card.querySelector("img")?.src || "";
  }));

  const outputTabs = [...document.querySelectorAll("[data-output-tab]")];
  const outputInput = document.querySelector("[data-output-value]");
  outputTabs.forEach((button) => button.addEventListener("click", () => {
    setActive(outputTabs, button);
    if (outputInput) outputInput.value = button.dataset.outputTab;
    document.querySelectorAll("[data-current-output]").forEach((node) => {
      node.textContent = button.textContent.trim();
    });
  }));

  const generateButton = document.querySelector("[data-generate-demo]");
  const prompt = document.querySelector("[data-generate-prompt]");
  const message = document.querySelector("[data-generate-message]");
  const status = document.querySelector("[data-generation-status]");
  generateButton?.addEventListener("click", () => {
    const value = String(prompt?.value || "").trim();
    if (!value) {
      if (message) message.textContent = "请先输入创作内容。";
      prompt?.focus();
      return;
    }
    if (message) message.textContent = "";
    if (status) status.textContent = "处理中（status 0）";
    window.setTimeout(() => {
      if (status) status.textContent = "原型演示完成（status 1）";
    }, 650);
  });

  const modelTabs = [...document.querySelectorAll("[data-model-tab]")];
  const modelCards = [...document.querySelectorAll("[data-model-card]")];
  const modelSearch = document.querySelector("[data-model-search]");
  const modelEmpty = document.querySelector("[data-model-empty]");
  let modelType = "all";

  const filterModels = () => {
    const keyword = String(modelSearch?.value || "").trim().toLowerCase();
    let visible = 0;
    modelCards.forEach((card) => {
      const typeMatch = modelType === "all" || card.dataset.modelType === modelType;
      const keywordMatch = !keyword || card.textContent.toLowerCase().includes(keyword);
      card.hidden = !(typeMatch && keywordMatch);
      if (!card.hidden) visible += 1;
    });
    modelEmpty?.classList.toggle("is-visible", visible === 0);
  };

  modelTabs.forEach((button) => button.addEventListener("click", () => {
    modelType = button.dataset.modelTab;
    setActive(modelTabs, button);
    filterModels();
  }));
  modelSearch?.addEventListener("input", filterModels);

  const handoffName = document.querySelector("[data-handoff-model-name]");
  const handoffLink = document.querySelector("[data-handoff-model-link]");
  if (handoffName && handoffLink) {
    const model = new URLSearchParams(window.location.search).get("model") || "model";
    handoffName.textContent = model;
    handoffLink.href = `https://ai.ai666.net/pricing/${encodeURIComponent(model)}`;
    document.title = `${model} - 模型服务详情`;
  }
})();
