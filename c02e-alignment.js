(() => {
  const normalizeWalkthrough = () => {
    const drawer = document.querySelector('[data-v1-walkthrough-drawer]');
    if (!drawer || !document.querySelector('.c02e-page')) return;
    const panel = drawer.querySelector('.v1-walkthrough-panel');
    const tabs = drawer.querySelectorAll('.v1-walkthrough-tabs > *');
    if (!panel || tabs.length < 2) return;
    tabs[0].textContent = '运营关注';
    tabs[1].textContent = '研发关注';

    const page = document.querySelector('.page');
    const pageName = drawer.querySelector('.v1-walkthrough-head strong')?.textContent.replace('走查', '').trim() || '活动页面';
    const activityCode = page?.dataset.activityCode || 'activity list';
    const originalRules = [...drawer.querySelectorAll('[data-engineering-rule]')]
      .map((node) => node.textContent.trim())
      .filter(Boolean);
    drawer.querySelectorAll('.v1-rule-section').forEach((node) => node.remove());

    const sections = [
      ['页面定位', `${pageName}属于当前 C 端活动域，页面结构以真实路由、组件和 Apifox 响应为准，静态原型只承接可见状态与交互。`],
      ['用户主路径', '用户从活动中心进入目标活动，查看说明和任务后执行可用动作；创作类任务先获取参与上下文，再进入生成或直接发布组件。'],
      ['关键字段', `当前对象键为 ${activityCode}；列表或详情展示字段来自 cover_url、name、status_text、time_label、max_points、tasks 与投稿作品响应。`],
      ['状态规则', '活动状态、解锁状态、任务进度、按钮可用性和投稿展示均由接口字段决定；页面不根据静态日期或固定奖励自行推导业务状态。'],
      ['动作去向', '列表按活动类型进入邀请详情或通用活动详情；任务按钮先执行 join，再按 cta_route 打开现有组件、内部路由或安全的外部目标。'],
      ['运营维护', '运营只维护接口可配置的活动文案、封面、周期、任务、奖励与发布配置；原型中的样例数据用于走查，不作为长期固定规则。'],
      ['研发验收', originalRules.join('；') || '路由、接口字段、任务状态、参与上下文、发布组件与投稿刷新必须遵循当前真实 C 端实现，并覆盖加载、空态、禁用和失败反馈。'],
      ['交付边界', '当前交付为静态高保真原型与交互状态，不连接真实账号或生产写入；真实数据请求、鉴权、审核、奖励结算与异常补偿继续由现有工程和后端负责。'],
    ];

    sections.forEach(([label, detail], index) => {
      const section = document.createElement('div');
      section.className = 'v1-rule-section';
      section.dataset.walkthroughPane = index < 6 ? 'operations' : 'engineering';
      section.hidden = index >= 6;
      const strong = document.createElement('strong');
      strong.textContent = label;
      const span = document.createElement('span');
      span.textContent = detail;
      section.append(strong, span);
      if (label === '研发验收') {
        originalRules.forEach((rule) => {
          const marker = document.createElement('span');
          marker.hidden = true;
          marker.dataset.engineeringRule = '';
          marker.textContent = rule;
          section.append(marker);
        });
      }
      panel.append(section);
    });
  };

  normalizeWalkthrough();

  document.querySelectorAll('.c02e-activity-card-footer strong').forEach((node) => {
    node.textContent = node.textContent.replace('限时积分', '积分');
  });

  const activityCode = document.querySelector('.page')?.dataset.activityCode;
  const detailParagraphs = document.querySelectorAll('[data-c02e-activity-detail] .c02e-detail-block p');
  const userFacingDescriptions = {
    ai_image_challenge: ['围绕当期主题发布 AI 图片作品。请按本期要求选择内容类型、媒体、模型与场景。', '完成任务后，进度和奖励状态会及时更新。'],
    prompt_co_creation: ['发布可复用的 Prompt 作品，并按本期要求补充内容、媒体、模型与场景信息。', '优秀作品会进入活动投稿流，供更多创作者发现和复用。'],
    newbie_task: ['完成账号、互动与创作相关的新手任务，逐步熟悉社区。'],
    growth_7day: ['在当前任务周期内持续完成每日任务，逐步解锁后续成长奖励。'],
  };
  (userFacingDescriptions[activityCode] || []).forEach((value, index) => {
    if (detailParagraphs[index]) detailParagraphs[index].textContent = value;
  });
  const taskDescriptions = {
    homepage_work: '完成任务后会更新状态与对应奖励。',
    add_case: '按活动要求补充能够说明 Prompt 效果的案例媒体。',
    prompt_selected: '优秀作品将进入活动精选或推荐候选。',
    growth_day_7: '第 7 天：发布 1 个 AI 作品',
  };
  Object.entries(taskDescriptions).forEach(([taskCode, value]) => {
    const task = document.querySelector(`[data-task-code="${taskCode}"]`);
    const description = task?.querySelector('.c02e-task-main p');
    if (description) description.textContent = value;
  });

  const modal = document.querySelector('[data-c02e-choice-modal]');
  const result = modal?.querySelector('[data-c02e-choice-result]');
  const choiceHelp = modal?.querySelector('.c02e-choice-head p');
  const choiceDescriptions = modal?.querySelectorAll('.c02e-choice-option span');
  if (choiceHelp) choiceHelp.textContent = '选择继续生成新作品，或直接上传已有作品。';
  if (choiceDescriptions?.[0]) choiceDescriptions[0].textContent = '打开生成工具，完成作品后发布到本次活动';
  if (choiceDescriptions?.[1]) choiceDescriptions[1].textContent = '填写作品内容，并上传已经准备好的素材';
  const openChoice = () => {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('button, a')?.focus();
  };
  const closeChoice = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  };

  document.querySelectorAll('[data-c02e-create-task]').forEach((node) => {
    node.addEventListener('click', (event) => {
      event.preventDefault();
      openChoice();
    });
  });
  document.querySelectorAll('[data-c02e-scroll-tasks]').forEach((node) => {
    node.addEventListener('click', () => document.querySelector('#activity-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  });
  modal?.querySelectorAll('[data-c02e-choice-close]').forEach((node) => node.addEventListener('click', closeChoice));
  modal?.querySelectorAll('[data-c02e-create-mode]').forEach((node) => {
    node.addEventListener('click', () => {
      const mode = node.dataset.c02eCreateMode === 'aigc' ? 'AIGC 生成' : '直接发布';
      if (result) result.textContent = `已选择${mode}，请继续完成作品内容。`;
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeChoice();
      closeSubmission();
    }
  });

  const promptBody = document.querySelector('[data-c02e-prompt-body]');
  const promptRemix = document.querySelector('[data-c02e-prompt-remix]');
  if (promptRemix && promptBody) {
    promptRemix.href = `./aigc.html?prompt=${encodeURIComponent(promptBody.textContent.trim())}#quick-create`;
  }

  const submissionModal = document.querySelector('[data-c02e-submission-modal]');
  const submissionMedia = submissionModal?.querySelector('[data-c02e-submission-media]');
  const submissionTitle = submissionModal?.querySelector('[data-c02e-submission-title]');
  const submissionMeta = submissionModal?.querySelector('[data-c02e-submission-meta]');
  const submissionBody = submissionModal?.querySelector('[data-c02e-submission-body]');
  const submissionWorkNo = submissionModal?.querySelector('[data-c02e-submission-work-no]');
  const submissionCopy = submissionModal?.querySelector('[data-c02e-submission-copy]');
  const submissionRemix = submissionModal?.querySelector('[data-c02e-submission-remix]');
  const openSubmission = (card) => {
    if (!submissionModal || !card) return;
    const workTitle = card.dataset.workTitle || card.querySelector('h3')?.textContent.trim() || '活动作品';
    const workMeta = card.dataset.workMeta || card.querySelector('p')?.textContent.trim() || '';
    const workCopy = card.dataset.workCopy || '';
    const workNo = card.dataset.workNo || '';
    const media = card.dataset.workMedia || card.querySelector('img')?.getAttribute('src') || '';
    const kind = card.dataset.workKind || 'image';
    if (submissionTitle) submissionTitle.textContent = workTitle;
    if (submissionMeta) submissionMeta.textContent = workMeta;
    if (submissionBody) submissionBody.textContent = workCopy;
    if (submissionWorkNo) submissionWorkNo.textContent = workNo ? `作品编号 ${workNo}` : '';
    if (submissionMedia) {
      submissionMedia.src = media;
      submissionMedia.alt = workTitle;
    }
    if (submissionCopy) {
      submissionCopy.hidden = kind !== 'prompt';
      submissionCopy.textContent = '复制 Prompt';
    }
    if (submissionRemix) {
      submissionRemix.href = `./aigc.html?prompt=${encodeURIComponent(workCopy)}#quick-create`;
    }
    submissionModal.classList.add('is-open');
    submissionModal.setAttribute('aria-hidden', 'false');
    submissionModal.querySelector('[data-c02e-submission-close]')?.focus();
  };
  function closeSubmission() {
    if (!submissionModal) return;
    submissionModal.classList.remove('is-open');
    submissionModal.setAttribute('aria-hidden', 'true');
  }
  document.querySelectorAll('[data-c02e-submission-open]').forEach((card) => {
    card.addEventListener('click', () => openSubmission(card));
  });
  submissionModal?.querySelector('[data-c02e-submission-close]')?.addEventListener('click', closeSubmission);
  submissionCopy?.addEventListener('click', async () => {
    const value = submissionBody?.textContent.trim() || '';
    submissionCopy.textContent = '已复制 Prompt';
    try { await navigator.clipboard?.writeText(value); } catch {}
  });

  document.querySelectorAll('[data-c02e-copy-prompt]').forEach((node) => {
    node.addEventListener('click', async () => {
      const value = promptBody?.textContent.trim() || '';
      try { await navigator.clipboard?.writeText(value); } catch {}
      node.textContent = '已复制 Prompt';
      node.dataset.actionType = 'prompt.copy';
    });
  });

  const workForm = document.querySelector('[data-c02e-work-form]');
  if (workForm) {
    const editorSubtitle = workForm.querySelector('.c02e-editor-head p');
    const mediaDrop = workForm.querySelector('.c02e-media-drop');
    const modelPlaceholder = workForm.querySelector('#work-model option');
    if (editorSubtitle) editorSubtitle.textContent = 'Prompt 共创计划';
    if (mediaDrop) mediaDrop.textContent = '选择图片或视频，展示 Prompt 的实际效果';
    if (modelPlaceholder) modelPlaceholder.textContent = '选择关联模型';
    const title = workForm.querySelector('[data-c02e-work-title]');
    const content = workForm.querySelector('[data-c02e-work-content]');
    const titleCount = workForm.querySelector('[data-c02e-title-count]');
    const contentCount = workForm.querySelector('[data-c02e-content-count]');
    const submit = workForm.querySelector('[data-c02e-work-submit]');
    const status = workForm.querySelector('[data-c02e-work-status]');
    const sync = () => {
      if (titleCount) titleCount.textContent = `${title?.value.trim().length || 0} / 100`;
      if (contentCount) contentCount.textContent = `${content?.value.trim().length || 0} / 5000`;
      if (submit) submit.disabled = !(title?.value.trim() && content?.value.trim());
    };
    title?.addEventListener('input', sync);
    content?.addEventListener('input', sync);
    workForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (submit?.disabled) return;
      submit.disabled = true;
      if (status) status.textContent = '已提交，作品进入发布处理流程';
    });
    sync();
  }
})();
