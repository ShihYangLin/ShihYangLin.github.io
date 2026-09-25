import { modules } from '../../content/modules.js';
import { getLanguage, initLanguage, setLanguage, t } from './i18n.js';
import { parseRoute } from './router.js';
import { mountProblem, typeset } from './render.js';
import { readProgress, resetProgress, exportProgress } from './progress.js';
import { feedbackUrl, pageContext } from './feedback.js';
import { mountLessonInteractives } from './lesson-interactive.js';

const app = document.getElementById('app');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function progressFor(module) {
  try {
    const stored = readProgress();
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
        <h1 id="page-title" tabindex="-1">${t('heroTitle')}</h1>
        <p class="hero-count">${t('moduleCount')}</p>
      </section>
      <section class="topic-section" aria-labelledby="calculus-title"><div class="section-heading"><span class="section-number">01 /</span><h2 id="calculus-title">${t('groupCalculus')}</h2></div><div class="module-list">${cards('calculus')}</div></section>
      <section class="topic-section" aria-labelledby="optimization-title"><div class="section-heading"><span class="section-number">02 /</span><h2 id="optimization-title">${t('groupOptimization')}</h2></div><div class="module-list">${cards('optimization')}</div></section>
    </div>`;
}

let renderVersion = 0;
async function renderModule(route, focus = false) {
  const lang = getLanguage();
  const version = ++renderVersion;
  const selected = route.kind === 'problem' ? route.module.generators.find(item => item.id === route.generator) : route.module.generators[0];
  if (route.kind === 'problem' && (!selected || !selected.levels.includes(route.level))) { renderMap(true); return; }
  app.innerHTML = `<div class="page-shell interior-page">
    <a class="crumb" href="#/">← ${t('backToTopics')}</a>
    <p class="eyebrow">${t('sectionLabel')} · Chiang &amp; Wainwright ${escapeHtml(route.module.sections)}</p>
    <h1 tabindex="-1">${escapeHtml(route.module.title[lang])}</h1>
    <div id="lesson-slot"></div><div id="practice-slot"></div>
  </div>`;
  const lesson = app.querySelector('#lesson-slot');
  try {
    const response = await fetch(`content/lessons/${route.module.id}.${lang}.html`);
    if (response.ok) {
      const html = await response.text();
      if (version !== renderVersion) return;
      lesson.innerHTML = html;
      typeset(lesson);
      mountLessonInteractives(lesson, lang);
    } else lesson.innerHTML = `<div class="placeholder-panel"><p>${t('moduleIntro')}</p></div>`;
  } catch { if (version === renderVersion) lesson.innerHTML = `<div class="placeholder-panel"><p>${t('moduleIntro')}</p></div>`; }
  if (version !== renderVersion) return;
  if (selected) {
    const level = route.kind === 'problem' ? route.level : selected.levels[0];
    const seed = route.kind === 'problem' ? route.seed : (globalThis.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 0x100000000));
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const qa = new URLSearchParams(window.location.search).get('qa') || hashParams.get('qa');
    mountProblem(app.querySelector('#practice-slot'), route.module, selected, level, seed, qa);
  } else app.querySelector('#practice-slot').innerHTML = `<div class="placeholder-panel"><p>${t('moduleIntro')}</p></div>`;
  if (focus) {
    const target = route.kind === 'problem' ? app.querySelector('[data-answer], input[type="radio"]') : app.querySelector('h1');
    target?.focus();
  }
}

function renderProgress() {
  const data = readProgress();
  const lang = getLanguage();
  const rows = modules.filter(module => module.generators.length).map(module => `<section class="progress-module"><h2>${escapeHtml(module.title[lang])}</h2><div class="progress-table-wrap"><table><thead><tr><th>${t('generatorStatus')}</th><th>${t('attempts')}</th><th>${t('firstTryCorrect')}</th><th>${t('streak')}</th><th>${t('bestLevel')}</th><th>${t('status')}</th></tr></thead><tbody>${module.generators.map(generator => {
    const item = data[`${module.id}/${generator.id}`] || {};
    return `<tr><th><a href="#/${module.id}/${generator.id}">${escapeHtml(generator.title[lang])}</a></th><td>${item.attempts || 0}</td><td>${item.firstTryCorrect || 0}</td><td>${item.streak || 0}</td><td>${item.bestLevel || '—'}</td><td>${item.mastered ? t('mastered') : item.attempts ? t('inProgress') : t('notStarted')}</td></tr>`;
  }).join('')}</tbody></table></div></section>`).join('');
  app.innerHTML = `<div class="page-shell interior-page"><a class="crumb" href="#/">← ${t('backToTopics')}</a><p class="eyebrow">${t('progress')}</p><h1 tabindex="-1">${t('progressTitle')}</h1><p>${t('progressIntro')}</p>${rows}<div class="progress-actions"><button type="button" id="export-progress">${t('exportProgress')}</button><button type="button" id="reset-progress">${t('resetProgress')}</button></div><div id="reset-confirm" hidden><p>${t('confirmReset')}</p><button type="button" id="confirm-reset">${t('confirm')}</button><button type="button" id="cancel-reset">${t('cancel')}</button></div></div>`;
  app.querySelector('#export-progress').addEventListener('click', () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'math-methods-progress.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const panel = app.querySelector('#reset-confirm');
  app.querySelector('#reset-progress').addEventListener('click', () => { panel.hidden = false; app.querySelector('#confirm-reset').focus(); });
  app.querySelector('#cancel-reset').addEventListener('click', () => { panel.hidden = true; app.querySelector('#reset-progress').focus(); });
  app.querySelector('#confirm-reset').addEventListener('click', () => { resetProgress(); renderProgress(); });
}

function render(focus = false) {
  const lang = getLanguage();
  document.title = `${t('siteTitle')} · Shih-Yang Lin`;
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  const feedbackLink = document.getElementById('feedback-link');
  const feedbackHref = feedbackUrl(pageContext({ lang: getLanguage(), href: location.href }));
  feedbackLink.hidden = !feedbackHref;
  if (feedbackHref) feedbackLink.href = feedbackHref;
  document.querySelectorAll('[data-lang]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    button.setAttribute('aria-label', t(button.dataset.lang === 'en' ? 'englishButton' : 'chineseButton'));
  });
  document.querySelector('.header-actions').setAttribute('aria-label', t('siteControls'));
  document.querySelector('.language-switch').setAttribute('aria-label', t('languageControls'));
  const route = parseRoute(window.location.hash);
  if (route.kind === 'map' || route.kind === 'unknown' || route.kind === 'progress') renderVersion++;
  if (route.kind === 'map' || route.kind === 'unknown') renderMap(route.kind === 'unknown');
  else if (route.kind === 'progress') renderProgress();
  else renderModule(route, focus);
  if (focus && (route.kind === 'map' || route.kind === 'unknown' || route.kind === 'progress')) app.querySelector('h1')?.focus();
}

initLanguage();
// The theme follows the system setting, like the main site; drop the old manual override.
try { localStorage.removeItem('mm-theme'); } catch { /* Nothing stored. */ }
document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => { setLanguage(button.dataset.lang); render(); }));
// Lesson jump links scroll within the page; following their href would trigger the hash router.
app.addEventListener('click', event => {
  const link = event.target.closest('a[data-jump]');
  if (!link) return;
  event.preventDefault();
  const target = document.getElementById(link.dataset.jump);
  if (!target) return;
  target.scrollIntoView({ block: 'start' });
  target.classList.remove('is-jump-target');
  void target.offsetWidth;
  target.classList.add('is-jump-target');
});
window.addEventListener('hashchange', () => render(true));
render();
