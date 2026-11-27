/* Selection, orders and checkout in the community's membership page. */
(() => {
"use strict";
const membership = window.Membership;
const content = document.querySelector("#content");
const dialog = document.querySelector("#purchase-dialog");
const flashStatus = document.querySelector("#flash-status");
const options = new URLSearchParams(location.search);
const sourcePages = {
  home: ["社区首页","index.html"], member: ["会员中心","membership.html"],
  "generate-capsule": ["首页轻创作","index.html#quick-create"], generate: ["AIGC 创作","aigc.html#aigc-generator"],
  store: ["商城商品","member-store.html"], signin: ["签到","points-center.html"], activity: ["活动","activity-center.html"],
  post: ["帖子","flash.html"], profile: ["个人中心","user-center.html"], author: ["作者主页","user-center.html"], creator: ["作者主页","user-center.html"]
};
const memberSource = Object.hasOwn(sourcePages, options.get("source")) ? options.get("source") : "home";
const embedded = options.get("embedded") === "1" && window.parent !== window;
const reviewing = options.get("review") === "1";
const memberRoot = document.querySelector(".membership-page");
memberRoot.classList.toggle("embedded", embedded);
document.querySelector(".membership-presets").hidden = !reviewing;
const requestCost = options.get("required");
const required = requestCost !== null && /^\d+$/.test(requestCost) ? Number(requestCost) : null;
const generationIntent = ["generate-capsule","generate"].includes(memberSource) && Number.isSafeInteger(required) ? {source:memberSource,required} : null;
const purchaseText = {open:"开通",renew:"续费",upgrade:"升级为"};
const icons = {
  back:"resources/icons/remixicon/svg/Arrows/arrow-left-line.svg", link:"resources/icons/remixicon/svg/Arrows/arrow-right-up-line.svg",
  coins:"resources/icons/remixicon/svg/Finance/coins-line.svg", crown:"resources/icons/remixicon/svg/Finance/vip-crown-2-line.svg",
  gift:"resources/icons/remixicon/svg/Finance/gift-line.svg", charm:"resources/icons/remixicon/svg/Weather/sparkling-2-line.svg",
  lightning:"resources/icons/remixicon/svg/Weather/flashlight-line.svg", close:"resources/icons/remixicon/svg/System/close-line.svg"
};
let selectedTier = options.get("tier") || membership.activeTier();
let currentOrder = null;
let noticeTimer;

function returnUrl() {
  const directory = new URL("./", location.href);
  const fallback = new URL(sourcePages[memberSource][1], directory);
  let dest;
  try { dest = new URL(options.get("returnTo") || fallback.href, directory); } catch { return fallback.href; }
  if (dest.origin !== location.origin || new URL("./",dest).pathname !== directory.pathname || !/\/[\w-]+\.html$/.test(dest.pathname)) return fallback.href;
  if (reviewing) dest.searchParams.set("review","1");
  return dest.href;
}

function returnToSource(target = "source") {
  if (dialog.open) dialog.close();
  if (embedded) {
    window.parent.postMessage({type:"community-membership-return",target},location.origin);
  } else if (target === "orders") {
    location.hash = "orders";
    render();
  } else {
    location.assign(returnUrl());
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function ico(name) {
  return `<span class="ico" style="--icon:url('${icons[name]}')" aria-hidden="true"></span>`;
}

function button(label, action, value = "", type = "", disabled = false) {
  return `<button type="button" class="action ${type}" data-action="${action}" data-value="${escapeHtml(value)}"${disabled ? " disabled" : ""}>${escapeHtml(label)}</button>`;
}

function dateText(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}


function money(amount) {
  return "¥" + new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(amount);
}

function discount(value) {
  return Number(value * 10).toFixed(2).replace(/\.?0+$/, "") + " 折";
}

function showNotice(message) {
  flashStatus.textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { flashStatus.textContent = ""; }, 3600);
}


function memberName(plan) {
  return escapeHtml(plan?.name || "普通用户");
}

function getPlans() {
  return membership.read().plans;
}

function getPlan(id) {
  return getPlans().find((plan) => plan.id === id);
}

function term(item) {
  return item.durationLabel || (item.periodUnit === "day" ? `${item.periodCount} 天` : `${item.periodCount ?? item.months} 个月`);
}

function tierSkin(tier) {
  const skin = getPlan(tier)?.appearance || tier;
  return ["month", "quarter", "year", "jade"].includes(skin) ? skin : "jade";
}

function remainingAfter(points) {
  if (!generationIntent || generationIntent.source !== memberSource) return "";
  const gap = generationIntent.required - membership.balance() - points;
  return gap > 0 ? `购买后还差 ${gap} 积分` : "购买后够本次生成";
}



function tierTag(plan, clickable = false) {
  if (!plan) return "";
  const css = `tier-tag tier-${tierSkin(plan.id)}`;
  if (clickable) return `<button type="button" class="${css}" data-action="from-badge" data-value="${plan.id}">${memberName(plan)}</button>`;
  return `<span class="${css}">${memberName(plan)}</span>`;
}


function offerLabel(value) {
  if (!value || value === "常规价") return "";
  if (typeof value === "string") return value;
  if (value.kind === "first" || value.type === "first") return "首充优惠";
  return value.name || value.label || "限时优惠";
}

function annualUnavailable(snapshot = membership.read()) {
  return !snapshot.codes.some((code) => {
    if (typeof code === "string") return true;
    if (code.status) return ["available", "unused", "ready"].includes(code.status);
    return !code.orderId && !code.used;
  });
}

function planCard(plan, snapshot, active) {
  const quote = membership.quote(plan.id);
  const offer = offerLabel(quote.offer);
  const campaign = snapshot.campaigns.find((item) => item.id === quote.campaignId);
  const effect = quote.allowed ? remainingAfter(quote.points) : "";
  const offerTerms = campaign
    ? `${campaign.actions.map((action) => ({ open: "开通", renew: "续费", upgrade: "升档" })[action]).join("、")}可用 · 至 ${dateText(campaign.end)}`
    : offer ? "限首次购买会员" : "";
  const label = quote.allowed ? `${purchaseText[quote.action]}${plan.name}` : "到期后可购买";
  return `<article class="plan tier-${tierSkin(plan.id)}" id="plan-${plan.id}" data-selected="${selectedTier === plan.id}" tabindex="-1">
    <div class="plan-title"><h3>${memberName(plan)}</h3>
      ${active === plan.id ? '<span class="status-chip">当前档位</span>' : ""}
      <button class="plain preview-control" type="button" data-action="preview-style" data-value="${plan.id}">${window.MemberArt.portrait(tierSkin(plan.id))}预览装扮</button>
    </div>
    <div class="price-line"><strong>${money(quote.amount)}</strong><span>/ ${term(plan)}</span>
      ${quote.amount < quote.regular ? `<del>${money(quote.regular)}</del>` : ""}</div>
    <div class="offer-line">${offer ? `<span class="offer">${escapeHtml(offer)}</span><small>${escapeHtml(offerTerms)}</small>`
        : (!snapshot.user.loggedIn && plan.firstPrice != null ? `<small>首次购买可享 ${money(plan.firstPrice)}</small>` : "")}</div>
    <div class="plan-credit"><p class="plan-points">${ico("coins")}到账 ${plan.points} 永久积分</p>${effect ? `<p class="plan-effect" data-gap>${effect}</p>` : ""}</div>
    <dl class="perk-list">
      <div><dt>商城积分兑换</dt><dd>${discount(plan.discount)}</dd></div>
      <div><dt>每日签到</dt><dd>${plan.signRate} 倍积分</dd></div>
      <div><dt>活动奖励</dt><dd>${plan.activityRate} 倍积分</dd></div>
      ${plan.gift ? `<div><dt>会员赠礼</dt><dd>${escapeHtml(plan.gift)}</dd></div>` : ""}
    </dl>
    ${button(label, "buy", plan.id, "", !quote.allowed)}
  </article>`;
}

function memberPage() {
  const snapshot = membership.read();
  const active = membership.activeTier();
  const current = snapshot.plans.find((plan) => plan.id === active);
  const personal = current ? `${memberName(current)} · 有效期至 ${dateText(snapshot.user.expiresAt)}` : "手动续费，开通积分永久有效";
  return `
    ${button("返回" + sourcePages[memberSource][0],"return-source","","plain back")}
    <header class="member-hero"><div class="hero-copy"><h1>社区会员</h1><p>${personal}</p>
      ${snapshot.user.loggedIn ? '<a class="quiet-link" href="#orders" data-cta-state="查看会员订单">我的会员订单 ↗</a>' : ""}</div></header>
    <section class="section" aria-labelledby="plans-title">
      <div class="section-title"><h2 id="plans-title">选择会员</h2>
        ${generationIntent ? `<small>本次生成需 ${generationIntent.required} 积分 · 当前 ${membership.balance()} 积分</small>` : ""}</div>
      <div class="plans">${snapshot.plans.map((plan) => planCard(plan, snapshot, active)).join("")}</div>
      ${generationIntent ? `${button("返回继续编辑","return-source","","plain edit-return")}` : ""}
    </section>`;
}


function orderCard(order) {
  const paid = order.status === "paid";
  const state = membership.orderState(order.id);
  const status = paid ? (order.completed ? "购买成功" : "已收款，正在处理") :
    ({pending:"待付款",confirming:"正在确认支付结果",expired:"订单已超时",invalid:"购买资格已变化",cancelled:"已取消"})[order.status] || "已关闭";
  const payments = paid ? `<p>${order.memberStatus === "done" ? "会员已生效 · 到期 " + dateText(order.expiry) : "会员开通异常，正在处理"}</p>
    <p>${order.pointsStatus === "done" ? `${order.points} 永久积分已到账` : "积分到账异常，正在处理"}</p>` : "";
  const reselect = ["invalid","expired"].includes(order.status) || (order.status === "pending" && !state.allowed);
  return `<article class="order">
    <div class="section-title"><h3>${escapeHtml(order.planName)} · ${({open:"开通",renew:"续费",upgrade:"升档"})[order.action]}</h3><span class="status-chip">${status}</span></div>
    <p>${dateText(order.createdAt)} · ${term(order)} · ${paid ? "实付" : "订单金额"} ${money(order.amount)}</p>
    ${payments}
    ${reselect ? `<p>${escapeHtml(state.reason || "请重新选择会员档位。")}</p>` : ""}
    ${paid && order.giftStatus === "pending" ? '<p>MakeNow 兑换码待补发，可联系客服。</p>' : ""}
    ${paid && order.giftStatus === "sent" && order.code ? `<p>MakeNow 兑换码 <code>${escapeHtml(order.code)}</code> · 请前往 MakeNow 兑换</p>` : ""}
    ${order.request?.text ? `<p>已提交客服 · ${escapeHtml(order.request.text)}</p>` : ""}
    ${order.note ? `<p>客服回复 · ${escapeHtml(order.note)}</p>` : ""}
    <div class="section-actions">
      ${order.status === "pending" && state.allowed ? button("继续付款", "open-order", order.id, "secondary") : ""}
      ${reselect ? button("重新选档", "membership", "profile", "secondary") : ""}
      ${paid && order.code ? button("复制兑换码", "copy-code", order.id, "secondary") : ""}
      ${paid || order.status === "confirming" ? button("联系客服", "support", order.id, "secondary") : ""}
    </div></article>`;
}


function ordersPage() {
  const state = membership.read();
  const orders = state.orders.map(orderCard).join("");
  return `<a href="#member" class="back" data-cta-state="查看会员档位">${ico("back")}返回会员中心</a><section class="panel">
    <h1>会员订单</h1>${!state.user.loggedIn ? button("登录后查看", "ask-login") : orders ? `<div class="orders">${orders}</div>` : "<p>暂无会员订单。</p>"}</section>`;
}
function render() {
  const orders = location.hash === "#orders";
  content.innerHTML = orders ? ordersPage() : memberPage();
  document.title = (orders ? "会员订单" : "社区会员") + " · 多元拾光";
  document.querySelector('[data-action="receive-payment"]').hidden = !reviewing || !membership.read().orders.some(o=>o.status==="confirming");
}
function showDialog(title, body) {
  dialog.innerHTML = `<div class="section-title">
    <h2 id="dialog-title">${escapeHtml(title)}</h2>
    <button type="button" class="plain" data-action="close-dialog" aria-label="关闭">${ico("close")}</button>
  </div>${body}`;
  if (!dialog.open) dialog.showModal();
}

function renderCheckout(order, requestedTier = order.planId) {
  const conflict = requestedTier !== order.planId;
  const state = membership.orderState(order.id);
  if (!state.allowed) {
    currentOrder = null;
    showDialog(order.status === "confirming" ? "正在确认支付结果" : "当前订单无法继续付款",
      `<p>${escapeHtml(state.reason || "可在会员订单查看处理进度。")}</p><div class="section-actions">${button("查看订单", "back-from-order", "orders", "secondary")}${order.status === "confirming" ? "" : button("重新选档", "membership", memberSource)}</div>`);
    return;
  }
  const rows = [["会员档位", order.planName], ["购买时长", term(order)], ["本次实付", money(order.amount)], ["到账积分", `${order.points} 永久积分`], ["预计到期", dateText(order.expiry)], ["付款有效期", dateText(order.payBy)]];
  const offer = offerLabel(order.offer);
  if (offer) rows.splice(1, 0, ["优惠", offer]);
  currentOrder = order.id;
  showDialog("确认会员订单", `
    ${conflict ? '<p class="callout">已有同一优惠的待支付订单。继续付款或取消后换档。</p>' : ""}
    <dl class="summary-list">${rows.map(([term, description]) => `<div><dt>${term}</dt><dd>${escapeHtml(description)}</dd></div>`).join("")}</dl>
    ${remainingAfter(order.points) ? `<p class="callout" data-gap>${remainingAfter(order.points)}</p>` : ""}
    ${order.gift ? `<p class="callout">${annualUnavailable()
      ? "MakeNow 兑换码暂缺，购买后保留领取资格，可联系客服补发。"
      : "付款后可在会员订单查看 MakeNow 兑换码。"}</p>` : ""}
    <p class="payment-note">一次付款，到期后手动续费。</p>
    <div class="section-actions">
      ${button("取消订单", "cancel-order", order.id, "secondary")}
      ${button("确认支付 " + money(order.amount), "pay-order", order.id)}
    </div>`);
}

function askLogin(tier = null) {
  if (location.origin === "null") {
    showNotice("请通过本地预览地址打开社区页面。");
    return;
  }
  const memberUrl = new URL(location.href);
  if (tier && getPlan(tier)) {
    memberUrl.searchParams.set("tier", tier);
    memberUrl.hash = "member";
  }
  const loginUrl = new URL("./login.html#auth", location.href);
  loginUrl.searchParams.set("returnTo", memberUrl.href);
  loginUrl.searchParams.set("cancelTo", memberUrl.href);
  if (reviewing) loginUrl.searchParams.set("review", "1");
  location.assign(loginUrl.href);
}


function paid(order) {
  currentOrder = null;
  render();
  const gift = order.giftStatus === "pending" ? "<p>MakeNow 兑换码待补发，可在订单中联系客服。</p>" : order.giftStatus === "sent" ? "<p>MakeNow 兑换码已发放，可在会员订单查看。</p>" : "";
  showDialog("购买成功", `<div class="after-payment"><p>${escapeHtml(order.planName)}权益已生效，${order.points} 永久积分已到账。有效期至 ${dateText(order.expiry)}。</p>${gift}</div>
    <div class="section-actions">${button("查看会员订单","back-from-order","orders","secondary")}${button("返回" + sourcePages[memberSource][0],"back-from-order","source")}</div>`);
}

const actions = {
  membership() { dialog.close(); location.hash = "member"; render(); },
  "return-source"() { returnToSource(); },
  "back-from-order"(target) { returnToSource(target); },
  "preview-style"(tier) {
    const plan = getPlan(tier);
    showDialog(plan.name + "装扮", '<div data-member-try></div>');
    window.MemberArt.tryOn(dialog.querySelector("[data-member-try]"), tierSkin(plan.id), plan);
  },
  buy(tier) {
    selectedTier = tier;
    if (!membership.read().user.loggedIn) {
      askLogin(tier);
      return;
    }
    renderCheckout(membership.startOrder(tier, memberSource), tier);
  },
  "ask-login"() { askLogin(); },
  "open-order"(id) {
    const order = membership.read().orders.find((record) => record.id === id);
    if (order) renderCheckout(order);
  },
  "close-dialog"() { dialog.close(); },
  "cancel-order"(id) {
    membership.cancel(id);
    currentOrder = null;
    dialog.close();
    render();
    showNotice("订单已取消");
  },
  "pay-order"(id) {
    const state = membership.orderState(id);
    if (!state.allowed) return renderCheckout(state.order);
    const order = membership.pay(id);
    if (order.completed) paid(order);
    else { currentOrder = null; dialog.close(); location.hash = "orders"; render(); }
  },

  "copy-code"(id) {
    const order = membership.read().orders.find((item) => item.id === id && item.giftStatus === "sent" && item.status === "paid");
    if (!order?.code) return;
    if (!navigator.clipboard) {
      showNotice("请在订单中选中兑换码复制");
      return;
    }
    navigator.clipboard.writeText(order.code).then(() => showNotice("兑换码已复制"), () => showNotice("请在订单中选中兑换码复制"));
  },
  support(id) {
    showDialog("联系社区客服", `
      <p>已关联订单 ${escapeHtml(id)}。</p>
      <div class="form-stack">
        <label>咨询类型
          <select id="support-topic"><option>订单或付款</option><option>积分到账</option><option>MakeNow 兑换码</option><option>退款</option></select>
        </label>
        <label>补充说明（选填） <textarea rows="2" id="support-message" maxlength="120" placeholder="简要说明你需要的帮助"></textarea></label>
      </div>
      <div class="section-actions">
        ${button("返回订单", "close-dialog", "", "secondary")}
        ${button("提交给客服", "send-support", id)}
      </div>`);
  },
  "send-support"(id) {
    const topic = dialog.querySelector("#support-topic").value;
    const detail = dialog.querySelector("#support-message").value.trim();
    membership.contact(id, detail ? `${topic}：${detail}` : topic);
    dialog.close();
    render();
    showNotice("已提交给客服，订单已自动关联");
  },

  "receive-payment"() {
    const order = membership.read().orders.find(o=>o.status === "confirming");
    if (reviewing && order) { membership.confirmPayment(order.id); render(); }
  }
};

document.querySelector("#review-preset").addEventListener("change", event => {
  const choice = event.target.value;
  if (!reviewing || !choice) return;
  const samples = { missingPoints:"points", missingMember:"member", confirming:"confirm" };
  membership.reset(Object.hasOwn(samples,choice) || choice==="gap" ? "new" : choice);
  if (choice === "gap") sessionStorage.setItem("community-membership-review-cost","420");
  else sessionStorage.removeItem("community-membership-review-cost");
  event.target.value = "";
  document.querySelector("[data-v1-walkthrough-drawer]").open = false;
  if (choice === "gap") {
    if (embedded) return returnToSource();
    location.assign("./index.html?review=1#quick-create");
    return;
  }
  if (Object.hasOwn(samples,choice)) {
    const order = membership.startOrder("month","profile");
    if (choice==="confirming") membership.markPaymentPending(order.id,{paidAt:new Date().toISOString()});
    else membership.pay(order.id,{fail:samples[choice]});
    location.hash = "orders";
  } else location.hash = choice==="support" ? "orders" : "member";
  render();
});

document.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  const action = target && actions[target.dataset.action];
  if (!action || target.disabled) return;
  try { action(target.dataset.value); }
  catch (error) {
    if (!dialog.open) { showNotice(error.message); return; }
    let message = dialog.querySelector("[role='alert']");
    if (!message) { message = document.createElement("p"); message.setAttribute("role","alert"); dialog.append(message); }
    message.textContent = error.message;
  }
});
dialog.addEventListener("close", () => { if (!dialog.open) currentOrder = null; });
window.addEventListener("hashchange", render);
window.addEventListener("membership-changed", () => {
  render();
  if (!dialog.open || !currentOrder) return;
  const order = membership.read().orders.find(o=>o.id===currentOrder);
  if (order?.completed) paid(order);
  else if (order) renderCheckout(order);
});
render();
if (options.has("tier") && getPlan(selectedTier)) {
  const chosen = document.getElementById("plan-" + selectedTier);
  chosen?.focus({preventScroll:true});
  chosen?.scrollIntoView({block:"nearest"});
}
})();
