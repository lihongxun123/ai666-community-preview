document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const membership = window.Membership;
  if (!membership) return;

  const publicAuthor = new URLSearchParams(location.search).get('author');
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });

  const membershipLink = (source, returnTo, tier) => {
    const params = new URLSearchParams({ source, returnTo });
    if (tier) params.set('tier', tier);
    return `./membership.html?${params}`;
  };

  const currentPage = () => `${location.pathname.split('/').pop()}${location.search}${location.hash}`;

  const renderProfile = (snapshot) => {
    const area = document.querySelector('[data-membership-profile]');
    if (!area) return;

    const activeTier = snapshot.user.loggedIn ? membership.activeTier() : null;
    const plan = snapshot.plans.find((item) => item.id === activeTier);
    const status = area.querySelector('[data-membership-profile-status]');
    const date = area.querySelector('[data-membership-profile-date]');
    const primary = area.querySelector('[data-membership-profile-primary]');
    const upgrade = area.querySelector('[data-membership-profile-upgrade]');
    const wear = area.querySelector('[data-membership-profile-wear]');
    const orders = area.querySelector('[data-membership-profile-orders]');
    const expired = snapshot.user.loggedIn && !plan && Boolean(snapshot.user.expiresAt);
    const returnTo = 'user-center.html#profile';

    status.textContent = plan?.name || (expired ? '会员已到期' : '尚未开通会员');
    date.hidden = !plan || !snapshot.user.expiresAt;
    date.textContent = date.hidden ? '' : `有效期至 ${dateFormatter.format(new Date(snapshot.user.expiresAt))}`;
    primary.textContent = plan ? '同档续费' : expired ? '重新开通' : '开通会员';
    primary.href = membershipLink('profile', returnTo, plan?.id);

    const higher = plan && snapshot.plans.find((item) => item.order > plan.order);
    upgrade.hidden = !higher;
    if (higher) upgrade.href = membershipLink('profile', returnTo, higher.id);
    else upgrade.removeAttribute('href');

    wear.hidden = !plan;
    wear.textContent = snapshot.user.wear ? '摘下动态挂件' : '佩戴动态挂件';
    orders.hidden = !snapshot.user.loggedIn;
  };

  const renderIdentity = (root, snapshot) => {
    const accountId = root.dataset.membershipIdentity === 'viewer'
      ? (snapshot.user.loggedIn ? snapshot.accountId : null)
      : root.dataset.membershipIdentity;
    const identity = accountId ? membership.publicIdentity(accountId) : null;
    const plan = snapshot.plans.find((item) => item.id === identity?.tier);
    const skin = plan && ['month', 'quarter', 'year', 'jade'].includes(plan.appearance) ? plan.appearance : 'jade';
    const badge = root.querySelector('[data-membership-badge]');
    const avatar = root.querySelector('[data-membership-avatar]');
    const mode = root.dataset.membershipMotion;
    const comment = root.closest('details');
    const inDrawer = Boolean(root.closest('#all-comments'));
    const playing = mode === 'profile' || (mode === 'detail'
      && (!comment || comment.open)
      && (!inDrawer || location.hash === '#all-comments' || location.hash.startsWith('#comment-')));

    if (plan) {
      root.dataset.membershipAppearance = skin;
      if (badge) {
        badge.hidden = false;
        badge.textContent = plan.name;
        const source = document.querySelector('[data-membership-profile-view]') && !publicAuthor ? 'profile' : 'post';
        badge.href = membershipLink(source, currentPage(), plan.id);
        badge.setAttribute('aria-label', `查看${plan.name}会员权益`);
      }
    } else {
      delete root.dataset.membershipAppearance;
      if (badge) {
        badge.hidden = true;
        badge.removeAttribute('href');
      }
    }

    if (avatar) {
      let charm = avatar.querySelector('[data-membership-charm]');
      if (plan && identity.wear) {
        if (!charm) {
          charm = document.createElement('i');
          charm.dataset.membershipCharm = '';
          charm.setAttribute('role', 'img');
          charm.setAttribute('aria-label', '动态挂件');
          avatar.append(charm);
        }
        charm.classList.toggle('is-playing', playing);
      } else {
        charm?.remove();
      }
    }
  };

  const refresh = () => {
    const snapshot = membership.read();
    if (!publicAuthor) renderProfile(snapshot);
    document.querySelectorAll('[data-membership-identity]').forEach((root) => renderIdentity(root, snapshot));
  };

  if (document.querySelector('[data-membership-profile-view]') && publicAuthor !== null) {
    const person = document.querySelector('[data-membership-public-profile]');
    const empty = document.querySelector('[data-membership-public-missing]');
    const knownAuthor = publicAuthor === 'demo';
    document.querySelectorAll('[data-membership-profile-private]').forEach((node) => { node.hidden = true; });
    document.querySelector('.user-avatar-link.is-active')?.classList.remove('is-active');
    person.hidden = !knownAuthor;
    empty.hidden = knownAuthor;
    document.title = knownAuthor ? '拾光创作者的主页 - 多元拾光' : '创作者主页 - 多元拾光';
  }

  document.querySelector('[data-membership-profile-wear]')?.addEventListener('click', () => {
    if (membership.activeTier()) membership.toggleWear();
    refresh();
  });

  document.querySelectorAll('[data-membership-identity] a').forEach((link) => {
    link.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
    });
  });

  document.querySelectorAll('.flash-comments-inline').forEach((details) => {
    details.addEventListener('toggle', refresh);
  });
  window.addEventListener('hashchange', refresh);
  window.addEventListener('pageshow', refresh);
  window.addEventListener('focus', refresh);
  window.addEventListener('storage', refresh);
  window.addEventListener('membership:change', refresh);
  refresh();
}, { once: true });
