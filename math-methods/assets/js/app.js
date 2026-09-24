import { modules } from '../../content/modules.js';
import { getLanguage, initLanguage, setLanguage, t } from './i18n.js';
import { parseRoute } from './router.js';

const app = document.getElementById('app');
const themeButton = document.getElementById('theme-toggle');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function progressFor(module) {
  try {
    const stored = JSON.parse(localStorage.getItem('mm-progress-v1') || '{}');
    if (!module.generators.length) return t('notStarted');
    const statuses = module.generators.map(generator => stored[`${module.id}/${generator.id}`] || {});
    if (statuses.every(status => status.mastered)) return t('mastered');
    if (statuses.some(status => status.attempts > 0)) return t('inProgress');
  } catch { /* Progress is advisory and storage may be unavailable. */ }
  return t('notStarted');
}

function cards(group) {
  const lang = getLanguage();
  return modules.filter(module => module.group === group).map((module, index) => `
    <a class="module-card" href="#/${module.id}">
      <span class="card-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="card-main"><span class="card-title">${escapeHtml(module.title[lang])}</span><span class="card-sections">${escapeHtml(module.sections)}</span></span>
      <span class="card-status">${escapeHtml(progressFor(module))}</span>
      <span class="card-arrow" aria-hidden="true">↗</span>
    </a>`).join('');
}

function renderMap(notice = false) {
  app.innerHTML = `
    <div class="page-shell">
      ${notice ? `<p class="route-notice" role="status">${t('unknownRoute')}</p>` : ''}
      <section class="hero" aria-labelledby="page-title">
        <p class="eyebrow">${t('heroEyebrow')}</p>
        <h1 id="page-title">${t('heroTitle')}</h1>
        <p class="hero-intro">${t('heroIntro')}</p>
        <p class="hero-count">${t('moduleCount')}</p>
      </section>
      <section class="topic-section" aria-labelledby="calculus-title"><div class="section-heading"><span class="section-number">01 /</span><h2 id="calculus-title">${t('groupCalculus')}</h2></div><div class="module-list">${cards('calculus')}</div></section>
      <section class="topic-section" aria-labelledby="optimization-title"><div class="section-heading"><span class="section-number">02 /</span><h2 id="optimization-title">${t('groupOptimization')}</h2></div><div class="module-list">${cards('optimization')}</div></section>
    </div>`;
}

function renderModule(route) {
  const lang = getLanguage();
  const problem = route.kind === 'problem';
  app.innerHTML = `<div class="page-shell interior-page">
    <a class="crumb" href="#/">← ${t('backToTopics')}</a>
    <p class="eyebrow">${t('sectionLabel')} · Chiang &amp; Wainwright ${escapeHtml(route.module.sections)}</p>
    <h1>${escapeHtml(route.module.title[lang])}</h1>
    <div class="placeholder-panel"><p>${problem ? t('problemPending') : t('moduleIntro')}</p></div>
  </div>`;
}

function renderProgress() {
  app.innerHTML = `<div class="page-shell interior-page"><a class="crumb" href="#/">← ${t('backToTopics')}</a><p class="eyebrow">${t('progress')}</p><h1>${t('progressTitle')}</h1><div class="placeholder-panel"><p>${t('progressIntro')}</p></div></div>`;
}

function render() {
  const lang = getLanguage();
  document.title = `${t('siteTitle')} · Shih-Yang Lin`;
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll('[data-lang]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
  });
  const route = parseRoute(window.location.hash);
  if (route.kind === 'map' || route.kind === 'unknown') renderMap(route.kind === 'unknown');
  else if (route.kind === 'progress') renderProgress();
  else renderModule(route);
  updateThemeButton();
}

function effectiveTheme() {
  const explicit = document.documentElement.dataset.theme;
  return explicit || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function updateThemeButton() {
  const dark = effectiveTheme() === 'dark';
  themeButton.textContent = dark ? '☼' : '☾';
  themeButton.setAttribute('aria-label', dark ? t('themeToLight') : t('themeToDark'));
  themeButton.setAttribute('title', dark ? t('themeToLight') : t('themeToDark'));
}

initLanguage();
try {
  const savedTheme = localStorage.getItem('mm-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;
} catch { /* Theme still follows the system preference. */ }
document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => { setLanguage(button.dataset.lang); render(); }));
themeButton.addEventListener('click', () => {
  document.documentElement.dataset.theme = effectiveTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('mm-theme', document.documentElement.dataset.theme); } catch { /* Theme still works for this session. */ }
  updateThemeButton();
});
window.addEventListener('hashchange', render);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButton);
render();
