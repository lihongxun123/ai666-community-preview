(() => {
  const page = document.querySelector('.competition-page');
  if (!page) return;

  const params = new URLSearchParams(window.location.search);
  const requested = {
    event: params.get('event') || 'running',
    phase: params.get('phase') || 'collecting',
    auth: params.get('auth') || 'user',
    registration: params.get('registration') || 'registered',
    submission: params.get('submission') || 'draft',
  };

  const state = { ...requested };
  if (state.event === 'unstarted') state.phase = 'preheat';
  if (state.event === 'ended') state.phase = 'result';

  const resolveCapabilities = ({ event, phase }) => {
    const capabilities = {
      intro: true,
      register: false,
      submit: false,
      works: false,
      ranking: false,
      result: false,
      claim: false,
    };

    if (event === 'draft' || event === 'not-found') return { ...capabilities, intro: false };
    if (event === 'unstarted' || event === 'paused') return capabilities;
    if (event === 'ended') return { ...capabilities, works: true, ranking: true, result: true, claim: true };
    if (event !== 'running') return capabilities;

    if (phase === 'preheat') return { ...capabilities, register: true };
    if (phase === 'collecting') return { ...capabilities, register: true, submit: true, works: true, ranking: true };
    if (phase === 'judging') return { ...capabilities, works: true, ranking: true };
    if (phase === 'result-pending') return { ...capabilities, works: true, ranking: true };
    if (phase === 'result') return { ...capabilities, works: true, ranking: true, result: true, claim: true };
    return capabilities;
  };

  const capabilities = resolveCapabilities(state);
  const pageName = page.dataset.page || '';
  const hide = (node) => {
    if (!node) return;
    node.hidden = true;
    node.classList.add('competition-state-hidden');
    node.setAttribute('aria-hidden', 'true');
  };
  const buildHref = (path) => {
    const url = new URL(path, window.location.href);
    params.forEach((value, key) => {
      if (key !== 'submission_id') url.searchParams.set(key, value);
    });
    return `${url.pathname.split('/').pop()}${url.search}`;
  };
  const replaceMainWithGate = ({ eyebrow, title, note, action = '返回活动介绍' }) => {
    const main = page.querySelector('main');
    if (!main) return;
    main.classList.add('competition-state-gated-main');
    main.innerHTML = `
      <section class="competition-state-gate-shell" aria-live="polite">
        <article class="competition-state-gate">
          <span>${eyebrow}</span>
          <h1>${title}</h1>
          <p>${note}</p>
          <a class="competition-state-gate-action" href="${buildHref('./competition-detail.html')}">${action}</a>
        </article>
      </section>`;
  };
  const gateForEvent = () => {
    if (state.event === 'draft') return { eyebrow: '赛事状态', title: '赛事暂未发布', note: '当前赛事仍在准备中，正式发布后可查看活动详情。' };
    if (state.event === 'not-found') return { eyebrow: '赛事状态', title: '未找到该赛事', note: '赛事可能已下线或地址有误，请返回活动列表查看其他活动。' };
    if (state.event === 'paused') return { eyebrow: '赛事状态', title: '赛事暂时中止', note: '赛事恢复后将重新开放对应功能，请留意活动公告。' };
    return null;
  };

  document.documentElement.dataset.competitionLifecycle = state.event;
  document.documentElement.dataset.competitionPhase = state.phase;
  page.dataset.competitionCanRegister = String(capabilities.register);
  page.dataset.competitionCanSubmit = String(capabilities.submit);
  page.dataset.competitionCanViewWorks = String(capabilities.works);
  page.dataset.competitionCanViewRanking = String(capabilities.ranking);
  page.dataset.competitionCanViewResult = String(capabilities.result);
  window.__competitionStateCapabilities = { state, capabilities };

  const eventGate = gateForEvent();
  if (eventGate) {
    replaceMainWithGate(eventGate);
    return;
  }

  document.querySelectorAll('.competition-site-nav a').forEach((link) => {
    if (link.textContent.trim() === '参赛作品' && !capabilities.works) hide(link);
  });

  const configureHeroAction = () => {
    const actions = Array.from(document.querySelectorAll('[data-competition-hero-action]'));
    if (!actions.length) return;
    actions.forEach(hide);

    let type = 'register';
    let label = '立即报名';
    let action = 'register';
    let actionState = 'register';
    let href = '';
    let disabled = false;

    if (state.event === 'unstarted') {
      label = '赛事尚未开放';
      action = 'wait-start';
      actionState = 'wait-start';
      disabled = true;
    } else if (state.phase === 'preheat') {
      if (state.registration === 'registered' || state.registration === 'not-required') {
        label = '已报名，等待投稿';
        action = 'wait-submit';
        actionState = 'wait-submit';
        disabled = true;
      }
    } else if (state.phase === 'collecting') {
      if (state.auth !== 'user' || (state.registration !== 'registered' && state.registration !== 'not-required')) {
        type = 'register';
      } else if (state.submission === 'new') {
        type = 'submit';
        label = '投稿作品';
        action = 'submit';
        actionState = 'submit';
        href = buildHref('./competition-submit.html');
      } else if (state.submission === 'draft' || state.submission === 'rejected') {
        type = 'submit';
        label = state.phase === 'collecting'
          ? (state.submission === 'draft' ? '继续投稿' : '修改后重新提交')
          : '查看作品';
        action = 'submit';
        actionState = state.submission === 'draft' ? 'edit-draft' : 'revise-rejected';
        href = buildHref('./competition-submit.html');
      } else {
        type = 'mine';
        label = state.submission === 'review' ? '查看审核进度' : '查看我的投稿';
        action = 'navigate';
        actionState = state.submission === 'review' ? 'view-review' : 'view-submissions';
        href = buildHref('./competition-my-submissions.html');
      }
    } else if (state.phase === 'result-pending') {
      type = 'result';
      label = '查看结果进度';
      action = 'navigate';
      actionState = 'pending-result';
      href = buildHref('./competition-ranking.html?board=result&ranking=pending-result');
    } else if (state.phase === 'result' || state.event === 'ended') {
      type = 'result';
      label = '查看获奖名单';
      action = 'result';
      actionState = 'view-result';
      href = buildHref('./competition-ranking.html?board=result&ranking=published-result');
    } else {
      type = 'result';
      label = '浏览参赛作品';
      action = 'navigate';
      actionState = 'browse-works';
      href = buildHref('./competition-works.html');
    }

    const selected = actions.find((node) => node.dataset.competitionHeroAction === type) || actions[0];
    selected.hidden = false;
    selected.classList.remove('competition-state-hidden');
    selected.removeAttribute('aria-hidden');
    selected.dataset.homePrimary = 'true';
    selected.dataset.homeAction = action;
    selected.dataset.homeActionState = actionState;
    selected.dataset.homeActionHref = href;
    selected.textContent = label;
    selected.setAttribute('aria-disabled', String(disabled));
    if ('disabled' in selected) selected.disabled = disabled;
    if (disabled && selected.tagName === 'A') {
      selected.removeAttribute('href');
      selected.tabIndex = -1;
    } else if (href && selected.tagName === 'A') {
      selected.href = href;
    }
  };
  if (pageName === 'competition-detail') {
    configureHeroAction();
    if (!capabilities.works) {
      const participantCard = Array.from(document.querySelectorAll('.competition-hero-detail-card'))
        .find((node) => node.textContent.includes('参赛作品'));
      hide(participantCard);
      hide(document.querySelector('[data-home-secondary]'));
      document.querySelectorAll('[data-competition-track-action]').forEach(hide);
    }
    if (state.event === 'unstarted') {
      const primary = document.querySelector('[data-home-primary]');
      const personal = document.querySelector('[data-home-personal-status]');
      if (primary) {
        primary.textContent = '赛事尚未开放';
        primary.disabled = true;
        primary.setAttribute('aria-disabled', 'true');
        primary.dataset.homeAction = 'wait-start';
      }
      hide(personal);
    }
    return;
  }

  if (pageName === 'competition-works' && !capabilities.works) {
    replaceMainWithGate({
      eyebrow: state.event === 'unstarted' ? '赛事未开始' : '报名阶段',
      title: '参赛作品暂未开放',
      note: state.event === 'unstarted'
        ? '赛事开放后可先了解规则；作品征集开始后，这里展示审核通过并公开的作品。'
        : '当前仅开放报名。作品征集开始后，这里展示审核通过并公开的作品。',
    });
    return;
  }

  if (pageName === 'competition-ranking' && !capabilities.ranking) {
    replaceMainWithGate({
      eyebrow: state.event === 'unstarted' ? '赛事未开始' : '报名阶段',
      title: '排行榜暂未开放',
      note: '作品公开并产生有效互动后开放热度榜；获奖名单只在结果公布阶段展示。',
    });
    return;
  }

  if (pageName === 'competition-work' && !capabilities.works) {
    replaceMainWithGate({
      eyebrow: state.event === 'unstarted' ? '赛事未开始' : '报名阶段',
      title: '作品暂不可查看',
      note: '作品征集开始并通过审核公开后，才可进入作品详情。',
    });
    return;
  }

  if (pageName === 'competition-submit') {
    if (!capabilities.submit) {
      replaceMainWithGate({
        eyebrow: state.phase === 'preheat' ? '报名阶段' : '赛事进度',
        title: state.phase === 'preheat' ? '投稿尚未开始' : '本阶段不开放投稿',
        note: state.phase === 'preheat'
          ? '当前仅开放报名，作品征集开始后可提交作品。'
          : '作品征集已经结束，可前往“我的投稿”查看已有作品状态。',
      });
      return;
    }
    if (state.auth !== 'user' || (state.registration !== 'registered' && state.registration !== 'not-required')) {
      replaceMainWithGate({
        eyebrow: '投稿资格',
        title: state.auth !== 'user' ? '登录后参与投稿' : '完成报名后参与投稿',
        note: state.auth !== 'user' ? '登录并完成赛事报名后，才可提交作品。' : '请先返回活动介绍完成报名，再提交作品。',
      });
      return;
    }
    if (state.submission === 'review') {
      replaceMainWithGate({
        eyebrow: '投稿状态',
        title: '作品审核中',
        note: '审核完成前无需重复提交，可在“我的投稿”查看最新状态。',
      });
    }
    return;
  }

  if (pageName === 'competition-my-submissions') {
    const noAccount = state.auth !== 'user';
    const noRegistration = state.registration !== 'registered' && state.registration !== 'not-required';
    const noSubmission = state.submission === 'new' || state.phase === 'preheat' || state.event === 'unstarted';
    if (noAccount || noRegistration || noSubmission) {
      let title = '暂无投稿';
      let note = '完成报名并提交作品后，可在这里统一查看审核、公开和获奖状态。';
      if (noAccount) {
        title = '登录后查看我的投稿';
        note = '登录后可查看本人报名和投稿记录。';
      } else if (state.event === 'unstarted') {
        title = '赛事尚未开放';
        note = '赛事开放后可报名，作品征集开始后可提交作品。';
      } else if (state.phase === 'preheat') {
        title = '尚未开始征集作品';
        note = noRegistration ? '当前可先完成报名，作品征集开始后再提交作品。' : '你已完成报名，作品征集开始后可在这里提交并管理作品。';
      }
      replaceMainWithGate({ eyebrow: '我的投稿', title, note });
    }
  }
})();
;(() => {
  if (document.querySelector('[data-competition-state-design]')) return;
  const current = document.currentScript && document.currentScript.src ? document.currentScript.src : window.location.href;
  const base = current.slice(0, current.lastIndexOf('/') + 1);
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = base + 'competition-state-design.css?v=20260814-state-cleanup';
  style.dataset.competitionStateDesign = 'style';
  const script = document.createElement('script');
  script.src = base + 'competition-state-design.js?v=20260814-state-cleanup';
  script.dataset.competitionStateDesign = 'script';
  document.head.appendChild(style);
  document.body.appendChild(script);
})();

;(() => {
  if (document.querySelector('[data-competition-award-summary-script]')) return;
  const current = document.currentScript && document.currentScript.src ? document.currentScript.src : window.location.href;
  const script = document.createElement('script');
  script.src = current.slice(0, current.lastIndexOf('/') + 1) + 'competition-award-summary.js';
  script.dataset.competitionAwardSummaryScript = '';
  document.body.appendChild(script);
})();
