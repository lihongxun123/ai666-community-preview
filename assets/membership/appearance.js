(() => {
  "use strict";
  const base = new URL(".", document.currentScript.src);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const art = {
    month: ["疾光轨道", "冰蓝光标"],
    quarter: ["悬浮棱镜", "折光立方"],
    year: ["日冕双环", "聚光星核"],
    jade: ["碧绿头像框", "碧绿挂件"]
  };
  const sample = new URL("../image_assets/c02f-user-avatar.webp", base).href;
  const motions = new Map();
  const skinFor = key => Object.hasOwn(art, key) ? key : "jade";

  function part(skin, type) {
    return `<i class="member-art-part" data-membership-${type} data-art-skin="${skin}" role="img" aria-label="${art[skin][type === "frame" ? 0 : 1]}"></i>`;
  }

  function portrait(key) {
    const skin = skinFor(key);
    return `<span class="member-art-avatar"><img src="${sample}" alt="">${part(skin, "frame")}${part(skin, "charm")}</span>`;
  }

  async function play(layer, type) {
    const skin = layer.dataset.artSkin;
    if (reduced.matches || skin === "jade") return;
    const url = new URL(`${skin}/${type}-motion.png`, base).href;
    const take = Symbol();
    layer.currentTake = take;
    let objectURL;
    try {
      if (location.protocol === "file:") {
        layer.style.setProperty("--art-motion", `url("${url}?take=${performance.now()}")`);
        layer.classList.add("art-moving");
        await new Promise(resolve => setTimeout(resolve, 2500));
        return;
      }
      if (!motions.has(url)) motions.set(url, fetch(url).then(response => {
        if (!response.ok) throw new Error("装扮动图暂时无法加载");
        return response.blob();
      }).catch(error => { motions.delete(url); throw error; }));
      const blob = await motions.get(url);
      if (layer.currentTake !== take || !layer.isConnected || reduced.matches) return;
      objectURL = URL.createObjectURL(blob);
      const image = new Image();
      image.src = objectURL;
      await image.decode();
      if (layer.currentTake !== take || !layer.isConnected || reduced.matches) return;
      layer.style.setProperty("--art-motion", `url("${objectURL}")`);
      layer.classList.add("art-moving");
      await new Promise(resolve => setTimeout(resolve, 2500));
    } catch {
      // The still artwork remains visible if the animated resource is unavailable.
    } finally {
      if (layer.currentTake === take) {
        layer.classList.remove("art-moving");
        layer.style.removeProperty("--art-motion");
      }
      if (objectURL) URL.revokeObjectURL(objectURL);
    }
  }

  function dress(avatar, key, frame, charm, motion, replay = false) {
    const skin = skinFor(key);
    for (const [type, worn] of [["frame", frame], ["charm", charm]]) {
      let layer = avatar.querySelector(`[data-membership-${type}]`);
      if (!worn) { layer?.remove(); continue; }
      if (layer?.dataset.artSkin !== skin) {
        layer?.remove();
        avatar.insertAdjacentHTML("beforeend", part(skin, type));
        layer = avatar.lastElementChild;
      }
      const started = layer.classList.contains("is-playing");
      layer.classList.toggle("is-playing", motion);
      if (motion && (!started || replay)) play(layer, type);
      if (!motion && started) {
        layer.currentTake = null;
        layer.classList.remove("art-moving");
        layer.style.removeProperty("--art-motion");
      }
    }
  }

  function tryOn(host, key, plan) {
    const skin = skinFor(key);
    host.innerHTML = `<div class="member-try-stage" data-art-tier="${skin}">${portrait(skin)}<div class="member-try-author">拾光创作者 <span data-try-badge></span></div></div>
      <fieldset class="member-try-controls"><legend>试戴装扮</legend>
        <label><input type="checkbox" data-try-frame checked>头像框 · ${art[skin][0]}</label>
        <label><input type="checkbox" data-try-charm checked>动态挂件 · ${art[skin][1]}</label>
      </fieldset><button type="button" class="member-try-replay" data-art-replay>重播动效</button>`;
    host.querySelector("[data-try-badge]").textContent = [plan.name, plan.style].filter(Boolean).join(" · ");
    const frame = host.querySelector("[data-try-frame]");
    const charm = host.querySelector("[data-try-charm]");
    const repeat = host.querySelector("[data-art-replay]");
    const update = (replay = false) => {
      dress(host.querySelector(".member-art-avatar"), skin, frame.checked, charm.checked, true, replay);
      repeat.disabled = reduced.matches || skin === "jade" || !(frame.checked || charm.checked);
    };
    frame.onchange = charm.onchange = () => update();
    repeat.onclick = () => update(true);
    update();
  }

  window.MemberArt = { portrait, dress, tryOn };
})();
