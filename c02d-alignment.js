(() => {
  const root = document.querySelector(".flash-page");
  if (!root) return;

  const content = root.querySelector("[data-flash-compose-content]");
  const contentCounter = root.querySelector("[data-flash-compose-counter]");
  const mediaInput = root.querySelector("[data-flash-media-input]");
  const mediaAdd = root.querySelector("[data-flash-media-add]");
  const mediaStrip = root.querySelector("[data-flash-media-strip]");
  const mediaCounter = root.querySelector("[data-flash-media-counter]");
  const publishButton = root.querySelector("[data-flash-publish]");
  const publishMessage = root.querySelector("[data-flash-publish-message]");
  const mediaFiles = [];
  const mediaLimit = 4;
  const imageLimit = 32 * 1024 * 1024;
  const videoLimit = 200 * 1024 * 1024;
  const imageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  const videoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

  const setPublishMessage = (message, state = "") => {
    if (!publishMessage) return;
    publishMessage.textContent = message;
    publishMessage.classList.toggle("is-error", state === "error");
    publishMessage.classList.toggle("is-success", state === "success");
  };

  const canPublish = () => Boolean(content?.value.trim() || mediaFiles.length);

  const refreshState = () => {
    if (contentCounter && content) contentCounter.textContent = `${content.value.length} / 600`;
    if (mediaCounter) mediaCounter.textContent = `${mediaFiles.length} / ${mediaLimit}`;
    if (publishButton) publishButton.disabled = !canPublish();
    if (mediaAdd) mediaAdd.hidden = mediaFiles.length >= mediaLimit;
    if (!canPublish()) setPublishMessage("正文或媒体至少填写一项");
  };

  const revokeMediaUrl = (item) => {
    if (item?.url) URL.revokeObjectURL(item.url);
  };

  const renderMedia = () => {
    if (!mediaStrip || !mediaAdd) return;
    mediaStrip.querySelectorAll("[data-flash-media-item]").forEach((node) => node.remove());
    mediaFiles.forEach((item, index) => {
      const holder = document.createElement("div");
      holder.className = "flash-media-item";
      holder.dataset.flashMediaItem = String(index);

      const preview = document.createElement(item.kind === "video" ? "video" : "img");
      preview.className = "flash-media-preview";
      preview.src = item.url;
      preview.setAttribute("aria-label", item.file.name);
      if (item.kind === "video") {
        preview.muted = true;
        preview.playsInline = true;
      } else {
        preview.alt = item.file.name;
      }
      holder.append(preview);

      const type = document.createElement("span");
      type.className = "flash-media-type";
      type.textContent = item.kind === "video" ? "视频" : "图片";
      holder.append(type);

      const remove = document.createElement("button");
      remove.className = "flash-media-remove";
      remove.type = "button";
      remove.setAttribute("aria-label", `移除 ${item.file.name}`);
      remove.innerHTML = '<img src="resources/icons/remixicon/svg/System/close-line.svg" alt="">';
      remove.addEventListener("click", () => {
        const [removed] = mediaFiles.splice(index, 1);
        revokeMediaUrl(removed);
        renderMedia();
      });
      holder.append(remove);
      mediaStrip.insertBefore(holder, mediaAdd);
    });
    refreshState();
  };

  const validateMedia = (file) => {
    const isImage = imageTypes.has(file.type);
    const isVideo = videoTypes.has(file.type);
    if (!isImage && !isVideo) return { error: "仅支持 png、jpg、jpeg、webp、mp4、webm、mov 文件" };
    if (isImage && file.size > imageLimit) return { error: `${file.name} 超过图片 32MB 上限` };
    if (isVideo && file.size > videoLimit) return { error: `${file.name} 超过视频 200MB 上限` };
    return { kind: isVideo ? "video" : "image" };
  };

  content?.addEventListener("input", refreshState);
  mediaAdd?.addEventListener("click", () => mediaInput?.click());
  mediaInput?.addEventListener("change", () => {
    const selected = [...(mediaInput.files || [])];
    for (const file of selected) {
      if (mediaFiles.length >= mediaLimit) {
        setPublishMessage("最多添加 4 个媒体文件", "error");
        break;
      }
      const result = validateMedia(file);
      if (result.error) {
        setPublishMessage(result.error, "error");
        continue;
      }
      mediaFiles.push({ file, kind: result.kind, url: URL.createObjectURL(file) });
    }
    mediaInput.value = "";
    renderMedia();
  });

  publishButton?.addEventListener("click", () => {
    if (!canPublish()) {
      setPublishMessage("正文或媒体至少填写一项", "error");
      return;
    }
    publishButton.disabled = true;
    publishButton.textContent = "发布中…";
    setPublishMessage("正在提交闪念…");
    window.setTimeout(() => {
      publishButton.textContent = "发布闪念";
      setPublishMessage("已提交，正在审核中，通过后即可查看", "success");
      content?.setAttribute("disabled", "disabled");
      if (mediaAdd) mediaAdd.disabled = true;
    }, 520);
  });

  root.querySelectorAll("[data-like-action]").forEach((action) => {
    action.addEventListener("click", (event) => {
      event.preventDefault();
      const active = action.getAttribute("aria-pressed") === "true";
      const count = Number.parseInt(action.textContent.trim(), 10) || 0;
      action.setAttribute("aria-pressed", active ? "false" : "true");
      action.lastChild.textContent = String(Math.max(0, count + (active ? -1 : 1)));
      const icon = action.querySelector("img");
      if (icon) icon.src = active
        ? "resources/icons/remixicon/svg/System/thumb-up-line.svg"
        : "resources/icons/remixicon/svg/System/thumb-up-fill.svg";
    });
  });

  root.querySelectorAll("[data-share-action]").forEach((action) => {
    action.addEventListener("click", async (event) => {
      event.preventDefault();
      const card = action.closest("[data-post-no]");
      const url = new URL(location.href);
      url.hash = "";
      if (card?.dataset.postNo) url.searchParams.set("post_no", card.dataset.postNo);
      try {
        await navigator.clipboard.writeText(url.toString());
      } catch {
        const helper = document.createElement("textarea");
        helper.value = url.toString();
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.append(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      const label = action.lastChild;
      const previous = label.textContent;
      label.textContent = "已复制";
      window.setTimeout(() => { label.textContent = previous; }, 1200);
    });
  });

  const posts = [...root.querySelectorAll("[data-flash-card][data-post-no]")];
  const selectPost = (card, updateUrl = true) => {
    posts.forEach((item) => item.classList.toggle("is-post-previewed", item === card));
    if (!card || !updateUrl) return;
    const url = new URL(location.href);
    url.searchParams.set("post_no", card.dataset.postNo);
    history.replaceState({}, "", url);
  };
  posts.forEach((card) => {
    card.tabIndex = 0;
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button, summary, details")) return;
      selectPost(card);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      selectPost(card);
    });
  });
  const requestedPostNo = new URLSearchParams(location.search).get("post_no");
  if (requestedPostNo) selectPost(posts.find((card) => card.dataset.postNo === requestedPostNo), false);

  window.addEventListener("beforeunload", () => mediaFiles.forEach(revokeMediaUrl));
  refreshState();
})();
