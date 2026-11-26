(() => {
  'use strict';

  function sourceTarget(hash) {
    const page = window.location.pathname.split('/').at(-1);
    return page + window.location.search + hash;
  }

  function href(source, hash) {
    const params = new URLSearchParams({ source, returnTo:sourceTarget(hash) });
    if (new URLSearchParams(window.location.search).get('review') === '1') params.set('review', '1');
    return './membership.html?' + params;
  }

  function loginHref(hash) {
    const target = sourceTarget(hash);
    return './login.html?' + new URLSearchParams({returnTo:target,cancelTo:target});
  }

  function labelPlans(plans, calculate) {
    return plans.map(plan => plan.name + ' ' + calculate(plan)).join(' · ');
  }

  function showBalance(membership, target) {
    const balance = membership.balance();
    if (target) target.textContent = String(balance);
    const points = document.querySelector('[data-nav-action="points"] strong');
    if (points) points.textContent = String(balance);
    points?.closest('a')?.setAttribute('data-action-label', '积分 ' + balance);
  }

  function pointsRecordTable(table, entries, today, visibleLimit) {
    table.querySelectorAll('[data-membership-points-record]').forEach(row => row.remove());
    let previous = table.firstElementChild;
    for (const entry of entries) {
      const row = document.createElement('div');
      const time = document.createElement('time');
      const action = document.createElement('span');
      const points = document.createElement('strong');
      row.dataset.membershipPointsRecord = entry.kind;
      if (entry.kind === 'sign') row.dataset.membershipSignRecord = '';
      time.textContent = entry.day === today ? '今天' : entry.day.slice(5).replace('-', ' 月 ') + ' 日';
      action.textContent = entry.label;
      points.textContent = '+' + entry.points;
      row.append(time,action,points);
      previous?.after(row);
      previous = row;
    }
    Array.from(table.children).slice(1).forEach((row,index) => { row.hidden = index >= visibleLimit; });
  }

  const pointsDay = timestamp => Number.isFinite(Date.parse(timestamp))
    ? new Date(Date.parse(timestamp) + 8 * 3600000).toISOString().slice(0,10) : null;
  const pointsSort = (a,b) => b.at.localeCompare(a.at);

  function showPointsHistory(membership, snapshot, today) {
    const {user, orders} = snapshot;
    const orderActions = {open:'开通',renew:'续费',upgrade:'升档'};
    const permanent = orders.filter(order => order.pointsStatus === 'done' && order.points > 0).map(order => {
      const at = order.pointsAwardedAt || order.receivedAt || order.paidAt;
      return {kind:'purchase',label:order.planName + (orderActions[order.action] || '购买') + '赠分',points:order.points,at,day:pointsDay(at)};
    }).filter(entry => entry.day).sort(pointsSort);
    const limited = Object.values(user.tasks || {}).filter(task => task.status === 'awarded').map(task => ({
      kind:'task',label:'活动任务奖励',points:task.points,at:task.awardedAt,day:pointsDay(task.awardedAt)
    })).filter(entry => entry.day);
    for (const [day,points] of Object.entries(user.signAwards || {})) {
      limited.push({kind:'sign',label:'每日签到',points,at:day,day});
    }
    limited.sort(pointsSort);

    const entries = [...permanent,...limited];
    const weekStart = pointsDay(new Date(Date.now() - 6 * 86400000).toISOString());
    const sum = records => records.reduce((total,entry) => total + entry.points,0);
    const todayTotal = sum(entries.filter(entry => entry.day === today));
    const weekTotal = sum(entries.filter(entry => entry.day >= weekStart && entry.day <= today));
    const daily = document.querySelector('.c02f-balance-total [data-points-records-open]');
    const stats = document.querySelectorAll('.c02f-points-stats dd');
    const accountTotals = document.querySelector('[data-membership-points-summary]');
    if (accountTotals) {
      accountTotals.hidden = false;
      accountTotals.textContent = '限时 ' + (membership.balance() - user.permanent) + ' · 永久 ' + user.permanent + ' 积分';
    }
    if (daily) daily.textContent = '今日已获得 ' + todayTotal + ' 积分';
    if (stats[0]) stats[0].textContent = '+' + todayTotal;
    if (stats[1]) stats[1].textContent = '+' + weekTotal;
    for (const section of document.querySelectorAll('[data-membership-permanent-records]')) {
      section.hidden = false;
      section.querySelector('[data-membership-records-empty]').hidden = permanent.length !== 0;
      const table = section.querySelector('.c02f-record-table');
      table.hidden = permanent.length === 0;
      pointsRecordTable(table,permanent,today,section.dataset.membershipPermanentRecords === 'preview' ? 5 : Infinity);
    }
    for (const table of document.querySelectorAll('[data-limited-points-records]')) {
      pointsRecordTable(table,limited,today,table.dataset.limitedPointsRecords === 'preview' ? 5 : Infinity);
    }
  }

  function setSignIn(membership) {
    const sign = document.querySelector('[data-membership-sign-in]');
    if (!sign) return;
    sign.hidden = false;
    const base = Number(sign.dataset.basePoints);
    const button = sign.querySelector('[data-membership-sign-button]');
    const result = sign.querySelector('[data-membership-sign-result]');
    const comparison = sign.querySelector('[data-membership-sign-comparison]');
    const link = sign.querySelector('[data-membership-sign-link]');
    const balance = document.querySelector('.c02f-balance-total > strong');
    link.href = href('signin', '#daily-check-in');

    function render() {
      const snapshot = membership.read();
      const {user, plans} = snapshot;
      const localDay = pointsDay(new Date().toISOString());
      const signed = user.signedDay === localDay;
      const tier = membership.activeTier();
      const amount = signed ? user.signAward : membership.reward(base, 'sign');
      result.textContent = signed ? '今日已到账 ' + amount + ' 积分' : '今日可领 ' + amount + ' 积分';
      button.disabled = signed;
      button.textContent = signed ? '今日已签到' : user.loggedIn ? '签到领 ' + amount + ' 积分' : '登录后签到';
      comparison.hidden = Boolean(tier);
      if (!tier) {
        comparison.textContent = signed ? '下次签到可享会员加成'
          : labelPlans(plans, plan => membership.reward(base, 'sign', plan.id) + ' 积分');
      }
      link.hidden = Boolean(tier);
      showBalance(membership, balance);
      showPointsHistory(membership,snapshot,localDay);
    }
    button.addEventListener('click', () => {
      if (!membership.read().user.loggedIn) {
        window.location.assign(loginHref('#daily-check-in'));
        return;
      }
      membership.sign(base);
      render();
    });
    render();
    if (window.location.hash === '#daily-check-in') {
      window.requestAnimationFrame(() => sign.scrollIntoView({block:'start'}));
    }
    window.addEventListener('membership-changed', render);
    window.addEventListener('pageshow', render);
  }

  function setActivity(membership) {
    const activity = document.querySelector('[data-activity-code][data-page]');
    const cards = [...(activity?.querySelectorAll('[data-task-code]') || [])];
    if (!cards.length) return;
    const rows = cards.map(card => {
      const code = card.dataset.taskCode;
      const points = card.querySelector('.c02e-task-points');
      const status = card.querySelector('.c02e-task-status');
      const head = card.querySelector('.c02e-task-head');
      const caption = document.createElement('span');
      const rates = document.createElement('span');
      const link = document.createElement('a');
      const base = Number(points?.textContent.match(/\d+/)?.[0]);
      const original = status?.textContent.trim() || '';
      const locked = status?.classList.contains('is-locked');
      const completed = status?.classList.contains('is-done') || ['已完成', '待发放', '已到账', '已领奖'].includes(original);
      if (!head || !Number.isFinite(base)) return null;
      card.id = 'task-' + code;
      caption.className = 'membership-task-offer';
      rates.className = 'membership-task-rates';
      link.className = 'membership-perk-link';
      link.textContent = '查看会员加成';
      link.href = href('activity', '#' + card.id);
      caption.append(rates, link);
      head.append(caption);
      return {card, code, key:activity.dataset.activityCode + ':' + code, points, status, caption, rates, base, locked, completed};
    }).filter(Boolean);

    function render() {
      const plans = membership.read().plans;
      for (const row of rows) {
        const reward = membership.task(row.key);
        row.caption.hidden = Boolean(reward || row.completed || row.locked);
        if (!row.caption.hidden) {
          row.rates.textContent = labelPlans(plans, plan => membership.reward(row.base, 'task', plan.id) + ' 积分');
          row.points.textContent = '+' + membership.reward(row.base, 'task') + ' 积分';
        }
        if (reward) {
          row.points.textContent = '+' + reward.points + ' 积分';
          row.status.textContent = reward.status === 'awarded' ? '已到账' : '待发放';
          row.status.classList.toggle('is-done', reward.status === 'awarded');
          row.status.classList.toggle('is-progress', reward.status === 'pending');
          const action = row.card.querySelector('.c02e-task-cta');
          if (action && action.tagName !== 'BUTTON') {
            const statusAction = document.createElement('button');
            statusAction.type = 'button';
            statusAction.className = action.className;
            statusAction.disabled = true;
            statusAction.textContent = row.status.textContent;
            action.replaceWith(statusAction);
          } else if (action) {
            action.disabled = true;
            action.textContent = row.status.textContent;
          }
        }
      }
      const progress = activity.querySelector('.c02e-participation-side b');
      if (progress && rows.some(row => membership.task(row.key))) {
        const complete = rows.filter(row => row.completed || membership.task(row.key)).length;
        progress.textContent = complete + '/' + rows.length;
      }
      showBalance(membership);
    }
    function transition(row, phase) {
      if (!row || row.completed || row.locked) return;
      if (phase === 'achieved') membership.achieveTask(row.base, row.key);
      if (phase === 'awarded' && membership.task(row.key)) membership.releaseTask(row.key);
      render();
    }
    document.addEventListener('community-activity-task-progress', event => {
      const {taskCode, phase} = event.detail || {};
      transition(rows.find(row => row.code === taskCode), phase);
    });
    const panel = document.querySelector('[data-v1-walkthrough-drawer] .v1-walkthrough-panel');
    if (panel) {
      const section = document.createElement('div');
      section.className = 'v1-rule-section';
      section.dataset.walkthroughPane = 'engineering';
      section.hidden = true;
      const heading = document.createElement('strong');
      const description = document.createElement('span');
      heading.textContent = '会员活动奖励';
      description.textContent = '达标时确定这笔奖励，计入待发预算。入账后按确定的金额计入活动支出并关联积分流水。达标后的开通、升档和到期均不改变这笔金额。';
      section.append(heading, description);
      panel.append(section);
      const target = rows.find(row => row.code === 'featured_work') || rows.find(row => !row.completed && !row.locked);
      if (target && new URLSearchParams(window.location.search).get('review') === '1') {
        const controls = document.createElement('div');
        for (const [phase, label] of [['achieved','模拟任务达标'], ['awarded','发放已确定奖励']]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'c02e-task-cta';
          button.textContent = label;
          button.dataset.membershipTaskPhase = phase;
          button.disabled = !membership.read().user.loggedIn;
          button.addEventListener('click', () => transition(target, phase));
          controls.append(button);
        }
        section.append(controls);
      }
    }
    render();
    window.addEventListener('membership-changed', render);
    window.addEventListener('pageshow', render);
    const returnedTask = rows.find(row => '#' + row.card.id === window.location.hash);
    if (returnedTask) returnedTask.card.scrollIntoView({ block: 'center' });
  }

  window.MembershipBenefits = { href, loginHref, labelPlans, showBalance };
  window.addEventListener('DOMContentLoaded', () => {
    const membership = window.Membership;
    if (!membership) return;
    setSignIn(membership);
    setActivity(membership);
  });
})();
