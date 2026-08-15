(() => {
  'use strict';

  const storageKey = 'ai666:competition:award-summary';
  const applyConfig = () => {
    const summary = document.querySelector('.competition-hero-details-main');
    if (!summary) return;

    let config;
    try {
      config = JSON.parse(localStorage.getItem(storageKey) || 'null');
    } catch (_) {
      config = null;
    }
    if (!config) return;

    const title = Array.from(summary.children).find((node) => node.textContent.trim() === '竞技奖池') || summary.firstElementChild;
    const headline = summary.querySelector('strong');
    const note = summary.querySelector('p');
    if (title && config.title) title.textContent = config.title;
    if (headline && config.headline) headline.textContent = config.headline;
    if (note && config.note) note.textContent = config.note;
    summary.hidden = config.visible === false;
    summary.dataset.competitionConfigSource = 'award-summary';
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyConfig, { once: true });
  else applyConfig();
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey) applyConfig();
  });
})();
