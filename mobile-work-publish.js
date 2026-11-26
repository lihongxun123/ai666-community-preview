(() => {
  const database = new Promise((resolve, reject) => {
    const request = indexedDB.open("community-preview-published-works", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("works", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function access(mode, operation) {
    const db = await database;
    return new Promise((resolve, reject) => {
      const tx = db.transaction("works", mode),
        request = operation(tx.objectStore("works"));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  window.PreviewWorks = {
    add: (work) => access("readwrite", (s) => s.add(work)),
    get: (id) => access("readonly", (s) => s.get(id)),
    all: () => access("readonly", (s) => s.getAll()),
  };
  const form = document.querySelector(".released-form form");
  if (!form) return;
  const query = new URLSearchParams(location.search),
    generation = query.get("generation_no");
  const activity = query.get("activity_code"),
    retry = document.querySelector("[data-retry]"),
    context = document.querySelector("[data-context]");
  const fields = form.elements,
    mediaBox = form.querySelector("[data-media]"),
    alert = form.querySelector('[role="alert"]');
  const activityUrl = (code) =>
    code === "prompt"
      ? "./mobile-activity-detail.html?activity=prompt"
      : "./mobile-campaign-detail.html";
  const desktop = matchMedia("(min-width: 768px)").matches;
  function creationUrl() {
    const draft = record();
    const restored = new URLSearchParams({
      generation_no: generation,
      mode: generationMode(),
    });
    if (draft) {
      restored.set("state", "success");
      restored.set("prompt", draft.prompt || "");
      restored.set("model", draft.model || "");
    }
    return "./mobile-create.html?" + restored;
  }
  function record() {
    return JSON.parse(
      sessionStorage.getItem("community.preview.generations") || "{}",
    )[generation];
  }
  function generationMode() {
    const type = record()?.type;
    return type === "text" ? "script" : type || "image";
  }
  if (desktop && query.get("preview") !== "mobile") {
    const dest = generation
      ? "./aigc.html?generation_no=" + encodeURIComponent(generation)
      : activity
        ? activity === "prompt"
          ? "./campaign-prompt.html"
          : "./campaign-detail.html"
        : "./index.html";
    location.replace(dest);
    return;
  }
  document.querySelector("[data-back]").onclick = () => {
    if (generation) {
      location.replace(creationUrl());
      return;
    }
    if (
      document.referrer &&
      new URL(document.referrer).origin === location.origin &&
      history.length > 1
    ) {
      history.back();
      return;
    }
    location.replace(activity ? activityUrl(activity) : "./mobile-home.html");
  };
  const sourceNames = {
    image: "图片作品",
    video: "视频作品",
    text: "文本作品",
  };
  let media = [],
    urls = [],
    busy = false,
    originActivity = "";
  function renderMedia() {
    urls.forEach(URL.revokeObjectURL);
    urls = [];
    mediaBox.replaceChildren();
    for (const [index, item] of media.entries()) {
      const el = document.createElement(
        fields.type.value === "video" ? "video" : "img",
      );
      if (typeof item === "string") el.src = item;
      else {
        el.src = URL.createObjectURL(item);
        urls.push(el.src);
      }
      if (el.tagName === "VIDEO") el.controls = true;
      else el.alt = "作品图片";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "released-action";
      remove.textContent = "移除";
      remove.onclick = () => {
        media.splice(index, 1);
        renderMedia();
      };
      mediaBox.append(el, remove);
    }
  }
  function mediaType() {
    const type = fields.type.value;
    form.querySelector("[data-media-label]").hidden = type === "text";
    fields.files.multiple = type === "image";
    fields.files.accept =
      type === "video"
        ? "video/mp4,video/quicktime,video/webm"
        : "image/png,image/jpeg,image/webp";
    fields.intro.required = type === "text";
    renderMedia();
  }
  fields.type.onchange = () => {
    media = [];
    alert.textContent = "";
    mediaType();
  };
  fields.files.onchange = () => {
    alert.textContent = "";
    const type = fields.type.value,
      picked = [...fields.files.files],
      limit = type === "video" ? 1 : 4;
    if (media.length + picked.length > limit)
      alert.textContent = "最多上传 " + limit + " 个媒体文件";
    else if (
      picked.some(
        (file) =>
          !file.type.startsWith(type + "/") ||
          file.size > (type === "video" ? 50 : 20) * 1024 * 1024,
      )
    )
      alert.textContent =
        "请检查文件格式和大小，图片上限 20 MiB，视频上限 50 MiB";
    else media.push(...picked);
    fields.files.value = "";
    renderMedia();
  };
  function prepare() {
    retry.hidden = true;
    form.hidden = true;
    const draft = generation ? record() : null;
    if (
      generation &&
      (!draft ||
        draft.status !== "success" ||
        !(draft.type === "text" ? draft.intro : draft.media?.length))
    ) {
      context.textContent = "生成记录不可用，请重试或返回创作。";
      retry.hidden = false;
      return;
    }
    // A review link can reproduce a transient loading failure once without changing other sessions.
    if (
      activity &&
      query.get("review_error") === "1" &&
      !retry.dataset.attempted
    ) {
      context.textContent = "活动发布规则加载失败";
      retry.hidden = false;
      return;
    }
    const active = activity || draft?.activity || "";
    const valid = ["prompt", "campaign", "competition"].includes(active);
    if (activity && !valid) {
      context.textContent = "没有找到这个活动的发布规则";
      retry.hidden = false;
      return;
    }
    const allowed =
      active === "prompt"
        ? ["image", "video", "text"]
        : active
          ? ["image"]
          : ["image", "video"];
    originActivity =
      valid && (!draft || allowed.includes(draft.type)) ? active : "";
    context.textContent = originActivity
      ? "参与活动 · " + (active === "prompt" ? "Prompt 共创" : "生图创作挑战赛")
      : draft?.activity
        ? "原活动不可参与，可发布到社区。"
        : "";
    fields.type.replaceChildren(
      ...(draft ? [draft.type] : allowed).map(
        (type) => new Option(sourceNames[type], type),
      ),
    );
    fields.type.disabled = Boolean(draft) || allowed.length === 1;
    for (const name of ["title", "intro", "prompt", "model"])
      fields[name].value = draft?.[name] || "";
    media = [...(draft?.media || [])];
    mediaType();
    form.hidden = false;
  }
  retry.onclick = () => {
    retry.dataset.attempted = "yes";
    prepare();
  };
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    alert.textContent = "";
    if (!fields.title.value.trim()) {
      alert.textContent = "请输入作品标题";
      return;
    }
    if (!fields.prompt.value.trim()) {
      alert.textContent = "请填写提示词";
      return;
    }
    if (fields.type.value !== "text" && !media.length) {
      alert.textContent = "请上传媒体文件";
      return;
    }
    if (fields.type.value === "text" && !fields.intro.value.trim()) {
      alert.textContent = "请输入作品正文";
      return;
    }
    busy = true;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await window.PreviewWorks.add({
        id: "W-" + crypto.randomUUID(),
        owner: window.Membership?.read().accountId || "demo",
        type: fields.type.value,
        media,
        title: fields.title.value.trim(),
        intro: fields.intro.value.trim(),
        model: fields.model.value.trim(),
        prompt: fields.prompt.value.trim(),
        activity: originActivity,
        generation,
        created: Date.now(),
      });
      location.replace(
        activity ? activityUrl(activity) : "./mobile-my-works.html?tab=works",
      );
    } catch {
      alert.textContent = "保存作品失败，请重试。";
      busy = false;
      submit.disabled = false;
    }
  };
  prepare();
})();
