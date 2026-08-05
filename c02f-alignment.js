(() => {
  const page = document.querySelector('.c02f-page');
  if (!page) return;

  const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('button:not(.c02f-modal-backdrop), input, select, textarea')?.focus();
  };

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  };

  document.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.closest('.c02f-modal')));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.c02f-modal.is-open').forEach(closeModal);
  });

  const normalizeWalkthrough = () => {
    const drawer = page.querySelector('[data-v1-walkthrough-drawer]');
    const sections = [...(drawer?.querySelectorAll('.v1-rule-section') || [])];
    const tabs = drawer?.querySelectorAll('.v1-walkthrough-tabs > *') || [];
    if (!drawer || sections.length < 8 || tabs.length < 2) return;
    sections.forEach((section, index) => {
      section.dataset.walkthroughPane = index < 6 ? 'operations' : 'engineering';
      section.hidden = index >= 6;
    });
    tabs[0].textContent = '运营关注';
    tabs[1].textContent = '研发关注';
    tabs.forEach((tab, index) => {
      tab.tabIndex = 0;
      tab.setAttribute('role', 'button');
      tab.addEventListener('click', () => {
        const pane = index === 0 ? 'operations' : 'engineering';
        sections.forEach((section) => { section.hidden = section.dataset.walkthroughPane !== pane; });
        tabs.forEach((item, tabIndex) => item.classList.toggle('is-active', tabIndex === index));
      });
    });
    tabs[0].classList.add('is-active');
  };
  normalizeWalkthrough();

  const initMessages = () => {
    const channelButtons = [...page.querySelectorAll('[data-message-channel]')];
    if (!channelButtons.length) return;
    const filterButtons = [...page.querySelectorAll('[data-message-filter]')];
    const cards = [...page.querySelectorAll('[data-message-card]')];
    const list = page.querySelector('[data-message-list]');
    const empty = page.querySelector('[data-message-empty]');
    const workspace = page.querySelector('.c02f-message-workspace');
    const total = page.querySelector('[data-message-total]');
    const readAll = page.querySelector('[data-message-read-all]');
    const heroEnglish = page.querySelector('.c02f-message-hero p');
    const heroTitle = page.querySelector('.c02f-message-hero h1');
    const heroCopy = page.querySelector('.c02f-message-hero span');
    let activeChannel = 'message';
    let activeFilter = 'all';

    const apply = () => {
      let visible = 0;
      cards.forEach((card) => {
        const channelMatches = card.dataset.messageChannelValue === activeChannel;
        const filterMatches = activeChannel !== 'message' || activeFilter === 'all' || card.dataset.messageType === activeFilter;
        const show = channelMatches && filterMatches;
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (total) total.textContent = String(visible);
      if (list) list.style.display = visible ? 'flex' : 'none';
      if (empty) empty.style.display = visible ? 'none' : 'grid';
      if (workspace) workspace.classList.toggle('is-announcement-channel', activeChannel === 'announcement');
      const sidebar = page.querySelector('.c02f-message-filters');
      if (sidebar) sidebar.hidden = activeChannel === 'announcement';
      if (readAll) {
        readAll.hidden = activeChannel === 'announcement';
        readAll.disabled = !cards.some((card) => !card.hidden && card.classList.contains('is-unread'));
      }
      if (heroEnglish) heroEnglish.textContent = activeChannel === 'announcement' ? 'ANNOUNCEMENTS' : 'NOTIFICATIONS';
      if (heroTitle) heroTitle.textContent = activeChannel === 'announcement' ? '公告中心' : '通知中心';
      if (heroCopy) heroCopy.textContent = activeChannel === 'announcement' ? '查看社区发布的官方公告。' : '及时查看社区互动与系统提醒。';
    };

    channelButtons.forEach((button) => button.addEventListener('click', () => {
      activeChannel = button.dataset.messageChannel;
      channelButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      apply();
    }));

    filterButtons.forEach((button) => button.addEventListener('click', () => {
      activeFilter = button.dataset.messageFilter;
      filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      apply();
    }));

    const announcementModal = page.querySelector('[data-announcement-modal]');
    cards.forEach((card) => card.addEventListener('click', () => {
      if (card.dataset.messageChannelValue === 'announcement') {
        const title = announcementModal?.querySelector('[data-announcement-modal-title]');
        const body = announcementModal?.querySelector('[data-announcement-modal-body]');
        if (title) title.textContent = card.dataset.announcementTitle || '公告详情';
        if (body) body.textContent = card.dataset.announcementBody || '';
        openModal(announcementModal);
        return;
      }
      card.classList.remove('is-unread');
      card.querySelector('.c02f-message-meta b, .c02f-message-meta i')?.remove();
      apply();
    }));

    readAll?.addEventListener('click', () => {
      cards.filter((card) => !card.hidden).forEach((card) => {
        card.classList.remove('is-unread');
        card.querySelector('.c02f-message-meta b, .c02f-message-meta i')?.remove();
      });
      apply();
    });
    apply();
  };

  const initPoints = () => {
    const modal = page.querySelector('[data-points-records-modal]');
    page.querySelectorAll('[data-points-records-open]').forEach((button) => button.addEventListener('click', () => openModal(modal)));
  };

  const writeClipboard = async (text) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const initInvite = () => {
    const copyButton = page.querySelector('[data-invite-copy]');
    const copyStatus = page.querySelector('[data-invite-copy-status]');
    copyButton?.addEventListener('click', async () => {
      const value = page.querySelector('#invite-link')?.value || '';
      await writeClipboard(value);
      if (copyStatus) copyStatus.textContent = copyButton.dataset.inviteCopyMessage || '邀请链接已复制';
      copyButton.textContent = '已复制';
    });

    const bindButton = page.querySelector('[data-invite-referrer-bind-action]');
    const bindInput = page.querySelector('[data-invite-referrer-code-field]');
    const bindMessage = page.querySelector('[data-invite-bind-message]');
    bindButton?.addEventListener('click', () => {
      const code = String(bindInput?.value || '').trim();
      if (!code) {
        if (bindMessage) bindMessage.textContent = '请输入邀请人的邀请码';
        return;
      }
      if (code.toUpperCase() === 'SG2026') {
        if (bindMessage) bindMessage.textContent = '不能绑定自己的邀请码';
        return;
      }
      page.querySelector('[data-invite-referrer-state="empty"]')?.setAttribute('hidden', '');
      page.querySelector('[data-invite-referrer-state="bound"]')?.removeAttribute('hidden');
      if (bindMessage) bindMessage.textContent = '绑定成功，邀请关系已更新';
    });

    const rulesModal = page.querySelector('[data-invite-rules-modal]');
    page.querySelector('[data-invite-rule-modal-entry]')?.addEventListener('click', () => openModal(rulesModal));
  };

  const initStore = () => {
    const redeemModal = page.querySelector('[data-ai-store-redeem-modal]');
    const successModal = page.querySelector('[data-ai-store-success-modal]');
    const recordsModal = page.querySelector('[data-ai-store-record-modal]');
    let selectedProduct = null;

    page.querySelectorAll('[data-redeem-open]').forEach((button) => button.addEventListener('click', () => {
      selectedProduct = button.closest('[data-ai-store-product]');
      const name = selectedProduct?.dataset.productName || '--';
      const price = Number(selectedProduct?.dataset.productPrice || 0);
      const productNode = redeemModal?.querySelector('[data-redeem-product]');
      const priceNode = redeemModal?.querySelector('[data-redeem-price]');
      const balanceNode = redeemModal?.querySelector('[data-redeem-balance]');
      if (productNode) productNode.textContent = name;
      if (priceNode) priceNode.textContent = `${price} 积分`;
      if (balanceNode) balanceNode.textContent = `${Math.max(0, 1280 - price)} 积分`;
      openModal(redeemModal);
    }));

    redeemModal?.querySelector('[data-redeem-confirm]')?.addEventListener('click', () => {
      closeModal(redeemModal);
      const name = selectedProduct?.dataset.productName || '商品权益';
      const successName = successModal?.querySelector('[data-redeem-success-product]');
      if (successName) successName.textContent = name;
      openModal(successModal);
    });

    page.querySelector('[data-ai-store-record-entry]')?.addEventListener('click', () => openModal(recordsModal));
    if (window.location.hash === '#ai-store-records') openModal(recordsModal);
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#ai-store-records') openModal(recordsModal);
    });
    page.querySelector('[data-secret-copy]')?.addEventListener('click', async (event) => {
      await writeClipboard('[CARD_CODE]');
      event.currentTarget.textContent = '已复制';
      const status = successModal?.querySelector('[data-redeem-status]');
      if (status) status.textContent = '权益凭证已复制，请妥善保管';
    });
  };

  const initProfile = () => {
    const routeButtons = [...page.querySelectorAll('[data-profile-route]')];
    const panels = [...page.querySelectorAll('[data-profile-panel]')];
    if (!routeButtons.length || !panels.length) return;
    const routeMap = {
      profile: '/personalCenter/personalProfile/personalProfileIndex',
      posts: '/personalCenter/myPost/myPostIndex',
      works: '/personalCenter/myWork/myWorkIndex',
      favorites: '/personalCenter/myFavorite/myFavoriteIndex',
    };

    const activatePanel = (key, syncHash = false) => {
      const resolvedKey = routeMap[key] ? key : 'profile';
      routeButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.profileRoute === resolvedKey));
      panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.profilePanel === resolvedKey));
      page.dataset.realRoute = routeMap[resolvedKey];
      if (syncHash && window.location.hash !== `#${resolvedKey}`) window.history.replaceState(null, '', `#${resolvedKey}`);
    };
    routeButtons.forEach((button) => button.addEventListener('click', () => activatePanel(button.dataset.profileRoute, true)));
    activatePanel(window.location.hash.slice(1) || 'profile');
    window.addEventListener('hashchange', () => activatePanel(window.location.hash.slice(1) || 'profile'));

    const applyListFilter = (panel) => {
      const list = panel.querySelector('[data-profile-list]');
      if (!list) return;
      const key = list.dataset.profileList;
      const status = panel.querySelector('[data-list-status].is-active')?.dataset.listStatus || 'all';
      const keyword = String(panel.querySelector(`[data-list-search="${key}"]`)?.value || '').trim().toLowerCase();
      let visible = 0;
      list.querySelectorAll('[data-personal-item]').forEach((item) => {
        const statusMatch = status === 'all' || item.dataset.status === status;
        const keywordMatch = !keyword || String(item.dataset.searchText || '').toLowerCase().includes(keyword);
        item.hidden = !(statusMatch && keywordMatch);
        if (!item.hidden) visible += 1;
      });
      list.style.display = visible ? 'flex' : 'none';
      const empty = panel.querySelector(`[data-list-empty="${key}"]`);
      if (empty) empty.style.display = visible ? 'none' : 'grid';
    };

    panels.forEach((panel) => {
      panel.querySelectorAll('[data-list-status]').forEach((button) => button.addEventListener('click', () => {
        panel.querySelectorAll('[data-list-status]').forEach((item) => item.classList.toggle('is-active', item === button));
        applyListFilter(panel);
      }));
      panel.querySelector('[data-list-search]')?.addEventListener('input', () => applyListFilter(panel));
      applyListFilter(panel);
    });

    const editModal = page.querySelector('[data-profile-edit-modal]');
    page.querySelector('[data-profile-edit-open]')?.addEventListener('click', () => openModal(editModal));
    editModal?.querySelector('form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = String(editModal.querySelector('[data-profile-name]')?.value || '').trim();
      const status = editModal.querySelector('[data-profile-edit-status]');
      if (!name) {
        if (status) status.textContent = '请填写昵称';
        return;
      }
      if (status) status.textContent = '资料已保存，页面信息已刷新';
    });

    const accountStatus = page.querySelector('[data-account-status]');
    page.querySelectorAll('[data-account-action]').forEach((button) => button.addEventListener('click', () => {
      if (accountStatus) accountStatus.textContent = button.dataset.accountAction === 'wechat' ? '已打开微信绑定流程' : '已打开手机号换绑流程';
    }));
    page.querySelector('[data-account-unbind]')?.addEventListener('click', () => {
      if (accountStatus) accountStatus.textContent = '至少保留一种登录方式；解绑前需要再次确认';
    });
    page.querySelector('[data-check-in-open]')?.addEventListener('click', () => {
      if (accountStatus) accountStatus.textContent = '已打开签到与任务面板';
    });
    page.querySelector('[data-copy-user-no]')?.addEventListener('click', async () => {
      await writeClipboard('AI666-SG20****');
      if (accountStatus) accountStatus.textContent = '用户编号已复制';
    });

    const previewModal = page.querySelector('[data-profile-preview-modal]');
    page.querySelectorAll('[data-preview-title]').forEach((button) => button.addEventListener('click', () => {
      const title = previewModal?.querySelector('[data-preview-modal-title]');
      const body = previewModal?.querySelector('[data-preview-modal-body]');
      if (title) title.textContent = button.dataset.previewTitle || '内容预览';
      if (body) body.textContent = button.dataset.previewBody || '';
      openModal(previewModal);
    }));
    page.querySelectorAll('[data-reason-action]').forEach((button) => button.addEventListener('click', () => {
      const title = previewModal?.querySelector('[data-preview-modal-title]');
      const body = previewModal?.querySelector('[data-preview-modal-body]');
      if (title) title.textContent = '未通过原因';
      if (body) body.textContent = button.dataset.reasonAction || '请按要求修改后重新提交。';
      openModal(previewModal);
    }));

    const confirmModal = page.querySelector('[data-profile-confirm-modal]');
    let pendingAction = '';
    page.querySelectorAll('[data-danger-action]').forEach((button) => button.addEventListener('click', () => {
      pendingAction = button.dataset.dangerAction || '确认操作';
      const title = confirmModal?.querySelector('[data-confirm-title]');
      const copy = confirmModal?.querySelector('[data-confirm-copy]');
      const status = confirmModal?.querySelector('[data-confirm-status]');
      if (title) title.textContent = pendingAction;
      if (copy) copy.textContent = `${pendingAction}后，列表会按真实接口返回结果刷新。`;
      if (status) status.textContent = '';
      openModal(confirmModal);
    }));
    confirmModal?.querySelector('[data-confirm-submit]')?.addEventListener('click', () => {
      const status = confirmModal.querySelector('[data-confirm-status]');
      if (status) status.textContent = `${pendingAction}已进入处理流程`;
    });
  };

  initMessages();
  initPoints();
  initInvite();
  initStore();
  initProfile();
})();
