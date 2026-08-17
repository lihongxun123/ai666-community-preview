(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const state = {
    event: params.get('event') || 'running',
    phase: params.get('phase') || 'collecting',
    auth: params.get('auth') || 'user',
    registration: params.get('registration') || 'registered',
    submission: params.get('submission') || 'new',
    integration: params.get('integration') || 'pending',
    work: params.get('work') || 'public',
    ranking: params.get('ranking') || 'live',
    content: params.get('content') || 'normal',
    list: params.get('list') || 'ready',
    comments: params.get('comments') || 'ready',
    quota: params.get('quota') || 'available',
    claim: params.get('claim') || 'publicity',
    track: params.get('track') || 'short'
  };

  const path = window.location.pathname.split('/').pop() || '';
  const pageType = path.includes('my-submissions') ? 'my-submissions'
    : path.includes('submit') ? 'submit'
      : path.includes('ranking') ? 'ranking'
        : path === 'competition-work.html' ? 'work'
          : path.includes('works') ? 'works'
            : path.includes('rules') ? 'rules'
              : 'detail';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const pageName = {
    detail: '活动介绍', rules: '参赛规则', works: '参赛作品', work: '作品详情',
    ranking: '赛事榜单', submit: '作品投稿', 'my-submissions': '我的投稿'
  }[pageType];

  const buildHref = (file, overrides = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(overrides).forEach(([key, value]) => next.set(key, value));
    return `${file}?${next.toString()}`;
  };

  const phaseIndex = ['unstarted', 'upcoming'].includes(state.event) || ['upcoming', 'preheat'].includes(state.phase) ? 0
    : state.phase === 'collecting' ? 1
      : state.phase === 'judging' || state.phase === 'result-pending' ? 2 : 3;

  const timeline = (active = phaseIndex) => `
    <ol class="competition-state-timeline" aria-label="赛事进程">
      ${['报名预热', '作品征集', '作品评选', '结果公布'].map((label, index) => `
        <li class="${index < active ? 'is-done' : index === active ? 'is-active' : ''}">
          <span>${String(index + 1).padStart(2, '0')}</span><b>${label}</b>
        </li>`).join('')}
    </ol>`;

  const gateModels = {
    draft: {
      tone: 'upcoming', eyebrow: 'COMING SOON', title: '赛事即将上线',
      note: '活动信息正在准备中，开放后可在这里查看赛程、规则与参与方式。',
      action: ['查看社区首页', './index.html'], meta: '尚未对外开放'
    },
    unstarted: {
      tone: 'upcoming', eyebrow: '赛事尚未开放', title: '敬请期待',
      note: '报名将于 2026.08.20 10:00 开放。开放前可先了解活动信息与参赛规则。',
      action: ['查看参赛规则', buildHref('competition-rules.html')], meta: '报名开放时间 2026.08.20 10:00'
    },
    paused: {
      tone: 'processing', eyebrow: '服务提示', title: '赛事暂时停靠',
      note: '活动入口暂时关闭，已保存的投稿与互动数据不会受到影响。恢复后可继续参与。',
      action: ['返回活动介绍', buildHref('competition-detail.html')], meta: '等待恢复开放'
    },
    notFound: {
      tone: 'attention', eyebrow: '未找到赛事', title: '这个赛事暂不可用',
      note: '可能是链接已失效或活动已撤下。请返回社区查看当前可参与的活动。',
      action: ['返回社区', './index.html'], meta: '不展示内部错误信息'
    },
    guest: {
      tone: 'qualification', eyebrow: '需要登录', title: '登录后继续参赛',
      note: '登录后可报名、保存投稿草稿，并在“我的投稿”中查看审核与获奖状态。',
      action: ['登录并继续', '#login'], meta: '登录 · 报名 · 投稿'
    },
    registration: {
      tone: 'qualification', eyebrow: '尚未报名', title: '先完成报名，再提交作品',
      note: '报名只需确认参赛身份与赛事规则，完成后将自动返回投稿流程。',
      action: ['去报名', buildHref('competition-detail.html', { registration: 'unregistered' })], meta: '当前步骤 01 / 02'
    },
    quota: {
      tone: 'attention', eyebrow: '投稿额度已满', title: '本届投稿名额已用完',
      note: '已有投稿不受影响。你可以前往“我的投稿”查看现有作品及其审核状态。',
      action: ['查看我的投稿', buildHref('competition-my-submissions.html')], meta: '不可新建投稿'
    },
    collectingClosed: {
      tone: 'complete', eyebrow: '征集已结束', title: '作品投稿通道已关闭',
      note: '已提交作品将继续参与评选。审核结果、获奖状态与后续操作会在“我的投稿”更新。',
      action: ['查看我的投稿', buildHref('competition-my-submissions.html')], meta: '进入评选阶段'
    },
    worksUpcoming: {
      tone: 'upcoming', eyebrow: '展区未开放', title: `${pageName}将在作品征集开始后开放`,
      note: '开放前不展示作品数量、作品卡片、热度与榜单，避免给用户造成已有投稿的误解。',
      action: ['查看活动介绍', buildHref('competition-detail.html')], meta: '暂无公开作品'
    },
    resultPending: {
      tone: 'processing', eyebrow: '结果确认中', title: '获奖结果正在核对',
      note: '作品评选已结束，结果确认完成后将统一开放获奖名单与领奖入口。',
      action: ['先看看参赛作品', buildHref('competition-works.html')], meta: '名单尚未公布'
    }
  };

  const resolveGate = () => {
    if (state.event === 'draft') return gateModels.draft;
    if (state.event === 'not-found') return gateModels.notFound;
    if (state.event === 'paused') return gateModels.paused;
    if (['unstarted', 'upcoming'].includes(state.event) || state.phase === 'upcoming') return gateModels.unstarted;
    if (pageType === 'submit' || pageType === 'my-submissions') {
      if (state.auth === 'guest') return gateModels.guest;
      if (state.registration === 'unregistered') return gateModels.registration;
    }
    if (pageType === 'submit' && state.phase !== 'collecting') return gateModels.collectingClosed;
    if (pageType === 'submit' && state.quota === 'full' && ['new', 'draft'].includes(state.submission)) return gateModels.quota;
    if (['works', 'work', 'ranking'].includes(pageType) && ['preheat'].includes(state.phase)) return gateModels.worksUpcoming;
    if (pageType === 'ranking' && (state.phase === 'result-pending' || state.ranking === 'pending-result')) return gateModels.resultPending;
    return null;
  };

  const gateMarkup = (model) => `
    <section class="competition-state-scene is-${model.tone}" aria-labelledby="competition-state-title">
      <div class="competition-state-scene-copy">
        <span class="competition-state-eyebrow">${model.eyebrow}</span>
        <h1 id="competition-state-title">${model.title}</h1>
        <p>${model.note}</p>
        <div class="competition-state-scene-actions">
          <a class="competition-btn primary" href="${model.action[1]}">${model.action[0]}</a>
          <span>${model.meta}</span>
        </div>
      </div>
      <div class="competition-state-scene-progress">
        <span>赛事进程</span>
        ${timeline()}
      </div>
    </section>`;

  const renderGate = (model) => {
    if (!model) return false;
    const existing = $('.competition-state-gate');
    if (existing) {
      existing.outerHTML = gateMarkup(model);
      $('.competition-state-gate-shell')?.classList.add('competition-state-gate-shell--designed');
      return true;
    }
    if (['detail', 'rules'].includes(pageType) && !['draft', 'not-found', 'paused'].includes(state.event)) return false;
    const main = $('main');
    if (!main) return false;
    main.classList.add('competition-state-gated-main');
    main.innerHTML = `<div class="competition-state-gate-shell competition-state-gate-shell--designed">${gateMarkup(model)}</div>`;
    return true;
  };

  const nativeState = ({ tone, eyebrow, title, note, action, secondary, detail }) => `
    <section class="competition-native-state is-${tone}" aria-live="polite">
      <div class="competition-native-state-mark"><span></span><i></i><b></b></div>
      <div class="competition-native-state-copy">
        <span>${eyebrow}</span><h2>${title}</h2><p>${note}</p>
        ${detail ? `<small>${detail}</small>` : ''}
      </div>
      ${action ? `<div class="competition-native-state-actions"><a class="competition-btn ${tone === 'attention' ? 'secondary' : 'primary'}" href="${action[1]}">${action[0]}</a>${secondary ? `<a href="${secondary[1]}">${secondary[0]}</a>` : ''}</div>` : ''}
    </section>`;

  const insertStatusLine = (config) => {
    const main = $('main');
    if (!main || $('.competition-state-statusline')) return;
    const heading = $('h1', main);
    const node = document.createElement('section');
    node.className = `competition-state-statusline is-${config.tone}`;
    node.innerHTML = `<div><span>${config.eyebrow}</span><strong>${config.title}</strong><p>${config.note}</p></div>${config.action ? `<a href="${config.action[1]}">${config.action[0]}</a>` : ''}`;
    const target = heading?.closest('section') || heading;
    target?.insertAdjacentElement('afterend', node);
  };

  const disableForm = (form) => {
    $$('input, textarea, select, button', form).forEach((control) => {
      control.disabled = true;
      control.setAttribute('aria-disabled', 'true');
    });
    form.classList.add('is-readonly');
  };

  const designUploadState = (form) => {
    const sourceCard = $$('button, [role="button"]', form).find((item) => item.textContent.includes('生成原片'));
    if (!sourceCard) return;
    const card = sourceCard.closest('button, [role="button"]') || sourceCard;
    const labels = {
      connected: ['已关联', 'light-door-source.mp4', 'success'],
      pending: ['待确认', '上传后将进行来源确认', 'processing'],
      invalid: ['关联失效', '请重新选择生成原片', 'attention']
    };
    const current = labels[state.integration];
    if (!current) return;
    card.classList.add('competition-upload-card--state', `is-${current[2]}`);
    card.insertAdjacentHTML('beforeend', `<span class="competition-upload-state"><b>${current[0]}</b><small>${current[1]}</small></span>`);
    if (state.integration !== 'connected') {
      const submitButton = $$('button', form).find((item) => item.textContent.includes('提交审核'));
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.title = state.integration === 'invalid' ? '请重新关联生成原片' : '生成原片确认后可提交';
      }
    }
  };

  const designSubmit = () => {
    const form = $('.competition-submit-form');
    if (!form) return;
    const states = {
      review: {
        tone: 'processing', eyebrow: '审核中', title: '作品已提交，正在审核',
        note: '当前内容暂不可修改，审核结果会同步到“我的投稿”。', action: ['查看投稿记录', buildHref('competition-my-submissions.html')]
      },
      rejected: {
        tone: 'attention', eyebrow: '需要修改', title: '请调整作品后重新提交',
        note: '作品暂未满足赛事展示要求。修改下方内容后可再次提交审核。'
      },
      public: {
        tone: 'success', eyebrow: '已公开', title: '作品已进入参赛作品展区',
        note: '用户现在可以浏览与互动，作品数据可在“我的投稿”查看。', action: ['查看作品', buildHref('competition-work.html')]
      },
      down: {
        tone: 'attention', eyebrow: '已下架', title: '作品当前未在公开展区展示',
        note: '投稿记录仍会保留。如需处理，请从“我的投稿”查看当前状态。', action: ['查看投稿记录', buildHref('competition-my-submissions.html')]
      }
    };
    const config = states[state.submission];
    if (config) insertStatusLine(config);
    if (['review', 'public', 'down'].includes(state.submission)) disableForm(form);
    if (state.submission === 'rejected') {
      const button = $$('button', form).find((item) => item.textContent.includes('提交审核'));
      if (button) button.textContent = '重新提交审核';
    }
    designUploadState(form);
  };

  const renderCollectionState = () => {
    const section = $('.competition-works-section');
    if (!section || state.list === 'ready') return;
    if (state.list === 'loading') {
      section.innerHTML = `<div class="competition-state-skeleton-grid" aria-label="作品加载中">${Array.from({ length: 8 }, (_, index) => `<i style="--row:${index % 3}"></i>`).join('')}</div>`;
      return;
    }
    const model = state.list === 'error'
      ? { tone: 'attention', eyebrow: '加载失败', title: '作品暂时没有加载出来', note: '网络可能开了个小差，请稍后再试。', action: ['重新加载', window.location.href] }
      : { tone: 'empty', eyebrow: '暂无结果', title: '没有找到符合条件的作品', note: '可以切换赛道或调整排序，看看其他创作者的作品。', action: ['查看全部作品', buildHref('competition-works.html', { track: 'all', view: 'all' })] };
    section.innerHTML = nativeState(model);
  };

  const renderRankingState = () => {
    if (!['empty', 'error'].includes(state.ranking) && !['empty', 'error'].includes(state.list)) return;
    const nodes = $$('.competition-rank-podium, .competition-ranking-list, .competition-result-grid, .competition-result-list');
    if (!nodes.length) return;
    nodes.forEach((node) => node.classList.add('competition-state-hidden'));
    const isError = state.ranking === 'error' || state.list === 'error';
    const model = isError
      ? { tone: 'attention', eyebrow: '榜单加载失败', title: '暂时无法获取榜单', note: '作品数据不会受到影响，请稍后重新加载。', action: ['重新加载', window.location.href] }
      : { tone: 'empty', eyebrow: '榜单待生成', title: '当前赛道还没有可展示的排名', note: '有公开作品并满足榜单规则后，这里会自动展示排名。', action: ['浏览参赛作品', buildHref('competition-works.html')] };
    nodes[0].parentElement.insertAdjacentHTML('afterbegin', nativeState(model));
  };

  const renderWorkState = () => {
    const detail = $('.competition-work-detail-dialog');
    if (!detail) return;
    if (state.content === 'loading') {
      detail.classList.add('competition-work-detail-dialog--loading');
      detail.innerHTML = `<div class="competition-work-state-media"></div><aside><i></i><i></i><i></i><div></div></aside>`;
      return;
    }
    if (['empty', 'error', 'not-found'].includes(state.content) || ['down', 'not-found'].includes(state.work)) {
      const isDown = state.work === 'down';
      const isError = state.content === 'error';
      detail.outerHTML = nativeState(isDown
        ? { tone: 'attention', eyebrow: '作品已下架', title: '这个作品当前不可浏览', note: '作品记录仍由创作者保留，公开展示恢复后可再次访问。', action: ['返回参赛作品', buildHref('competition-works.html')] }
        : isError
          ? { tone: 'attention', eyebrow: '加载失败', title: '作品暂时没有加载出来', note: '请稍后再试，或返回参赛作品浏览其他内容。', action: ['重新加载', window.location.href], secondary: ['返回参赛作品', buildHref('competition-works.html')] }
          : { tone: 'empty', eyebrow: '未找到作品', title: '这个作品可能已被移除', note: '链接可能失效，或作品尚未公开。', action: ['返回参赛作品', buildHref('competition-works.html')] });
      return;
    }
    if (state.work === 'owner-reviewing') {
      detail.classList.add('is-owner-reviewing');
      detail.insertAdjacentHTML('afterbegin', '<span class="competition-work-review-chip">仅自己可见 · 审核中</span>');
    }
    const comments = $('.detail-comments-panel');
    if (comments && state.comments !== 'ready') {
      comments.innerHTML = state.comments === 'error'
        ? nativeState({ tone: 'attention', eyebrow: '评论加载失败', title: '暂时无法显示评论', note: '作品互动不受影响，请稍后重试。' })
        : nativeState({ tone: 'empty', eyebrow: '还没有评论', title: '来留下第一条看法', note: '说说你对画面、叙事或创意的感受。' });
    }
  };

  const renderMySubmissions = () => {
    if (pageType !== 'my-submissions') return;
    if (state.submission === 'new' || state.content === 'empty') {
      const main = $('main');
      const rows = $$('article, .competition-submission-item', main);
      rows.forEach((row) => row.classList.add('competition-state-hidden'));
      main?.insertAdjacentHTML('beforeend', nativeState({
        tone: 'empty', eyebrow: '还没有投稿', title: '从第一个作品开始',
        note: state.phase === 'collecting' ? '选择赛道、上传成片与生成原片，即可提交审核。' : '本届征集已经结束，可以先浏览参赛作品。',
        action: state.phase === 'collecting' ? ['提交作品', buildHref('competition-submit.html')] : ['浏览参赛作品', buildHref('competition-works.html')]
      }));
      return;
    }
  };

  const boot = () => {
    document.documentElement.dataset.competitionStateFamily = resolveGate()?.tone || 'content';
    if (renderGate(resolveGate())) return;
    if (pageType === 'submit') designSubmit();
    if (pageType === 'works') renderCollectionState();
    if (pageType === 'ranking') renderRankingState();
    if (pageType === 'work') renderWorkState();
    renderMySubmissions();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
