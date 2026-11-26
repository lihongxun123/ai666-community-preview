/* The original community header reflects the same account as checkout and the admin preview. */
(() => {
  const store = window.Membership;
  if (!store) return;
  const params = new URLSearchParams(location.search);
  if (document.querySelector('[data-page="login"]')) {
    if (params.get("logout") === "1" && store.read().user.loggedIn) store.logout();
    applyMembershipLoginLayout();
  }

  function applyMembershipLoginLayout() {
    const href = params.get("returnTo");
    if (!href) return;
    let target;
    try { target = new URL(href, location.href); } catch { return; }
    if (target.origin !== location.origin) return;
    const isMembership = target.pathname === new URL("./membership.html", location.href).pathname;
    const isGeneration = target.pathname === location.pathname && target.searchParams.get("generationLoginReturn") === "1";
    if (!isMembership && !isGeneration) return;

    const layout = document.createElement("style");
    layout.textContent = `
      ${params.get("review") === "1" ? "" : "[data-v1-walkthrough-drawer] { display: none !important; }"}
      @media (max-width: 620px), (max-height: 600px) {
        .login-detail-page > .site-header { display: none; }
        .login-prototype-stage { position: relative; inset: auto; min-height: 100dvh; padding: 10px; }
        .login-prototype-modal { min-height: auto; }
        .c02b-login-dialog { max-width: 100%; overflow: hidden; }
      }
    `;
    document.head.append(layout);
  }

  function refresh() {
    const user = store.read().user;
    const points = document.querySelector('.site-header [data-nav-action="points"]');
    if (!points) return;
    // Explicit walkthrough cases own their sample header.
    const params = new URLSearchParams(location.search);
    if (params.has("taskGuideTest") || params.has("taskGuideState")) return;
    const amount = user.loggedIn ? store.balance() : "--";
    const value = points.querySelector("strong");
    if (value) value.textContent = amount;
    points.dataset.actionLabel = "积分 " + amount;
    points.setAttribute("aria-label", points.dataset.actionLabel);
  }
  const memberLink = document.querySelector('.site-header [data-nav-action="membership"]');
  if (memberLink && new URLSearchParams(location.search).get("review") === "1") {
    memberLink.href = "./membership.html?review=1";
  }
  window.addEventListener("membership-changed", refresh);
  window.addEventListener("community-membership-updated", refresh);
  window.addEventListener("pageshow", refresh);
  document.addEventListener("DOMContentLoaded", refresh);
  refresh();
})();
