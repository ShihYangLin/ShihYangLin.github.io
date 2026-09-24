import katex from '../../vendor/katex/katex.mjs';
import renderMathInElement from '../../vendor/katex/contrib/auto-render.mjs';
import { ambiguityNotice, checkMulti, matchMisconception, parseAnswer, parseSetEntries } from './checker.js';
import { getLanguage, t } from './i18n.js';
import { createRng } from './rng.js';
import { breakStreak, recordAttempt } from './progress.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export function localizedError(message, lang) {
  if (lang !== 'zh') return message;
  if (message.startsWith('Unknown symbol:')) return `不支援的符號：${message.slice(15)}`;
  const known = {
    'Enter an answer': '請輸入答案。', 'Expression is too long': '算式過長。',
    'Only finite numbers are allowed': '只能輸入有限數值。', 'Wrong number of function arguments': '函數的參數個數不正確。',
    'This expression contains an unsupported operation': '算式包含不支援的運算。',
    'Enter a finite number': '請輸入有限數值。', 'Choose an answer': '請選擇答案。',
    'Enter a set such as {-1, 3}': '請輸入集合，例如 {-1, 3}。',
    'Use parentheses, e.g. ln(x)': '函數請加括號，例如 ln(x)。',
    'Check the expression syntax and parentheses': '請檢查算式語法與括號。'
  };
  return known[message] || '算式格式不正確。';
}

export function invalidDisplay(outcome, problem, lang, generic) {
  const single = outcome.status === 'invalid' && problem.fields.length === 1;
  return {
    summary: single ? localizedError(outcome.fields[problem.fields[0].key].message, lang) : generic,
    suppressField: single
  };
}

export function typeset(element) {
  renderMathInElement(element, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: true });
}

function freshSeed() {
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 0x100000000);
}

function routeFor(module, generator, level, seed) {
  return `#/${module.id}/${generator.id}?level=${level}&seed=${seed}`;
}

function fieldHtml(field, lang) {
  const key = escapeHtml(field.key);
  if (field.type === 'choice') return `<fieldset class="answer-field"><legend>${escapeHtml(field.label[lang])}</legend>${field.options.map(option => `<label><input type="radio" name="${key}" value="${escapeHtml(option.value)}">${escapeHtml(option.label[lang])}</label>`).join('')}</fieldset>`;
  return `<div class="answer-field"><label for="answer-${key}">${escapeHtml(field.label[lang])}</label><input id="answer-${key}" name="${key}" data-answer="${key}" autocomplete="off" spellcheck="false" aria-describedby="preview-${key} notice-${key}"><div class="answer-preview" id="preview-${key}" aria-live="off"></div><p class="answer-notice" id="notice-${key}"></p><p class="field-feedback" data-field-feedback="${key}"></p></div>`;
}

export function mountProblem(host, module, selected, level, seed, qa = null) {
  const lang = getLanguage();
  const problem = selected.generate(createRng(seed), level);
  const generators = module.generators;
  const generatorOptions = generators.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === selected.id ? 'selected' : ''}>${escapeHtml(item.title[lang])}</option>`).join('');
  const levelOptions = selected.levels.map(value => `<option value="${value}" ${value === level ? 'selected' : ''}>${t('level')} ${value}</option>`).join('');
  host.innerHTML = `<section class="practice" aria-labelledby="practice-title"><div class="practice-head"><div><p class="eyebrow">${t('practiceLabel')}</p><h2 id="practice-title">${escapeHtml(selected.title[lang])}</h2></div><div class="practice-selectors"><label>${t('generator')}<select id="generator-select">${generatorOptions}</select></label><label>${t('difficulty')}<select id="level-select">${levelOptions}</select></label></div></div><p class="problem-seed">${t('problemSeed')} ${seed}</p><div class="problem-prompt">${escapeHtml(problem.prompt[lang])}</div><form id="answer-form" novalidate>${problem.fields.map(field => fieldHtml(field, lang)).join('')}<div class="problem-actions"><button class="action-primary" type="submit">${t('check')}</button><button type="button" id="hint-button">${t('hint')}</button><button type="button" id="solution-button">${t('showSolution')}</button><button type="button" id="new-button">${t('newProblem')}</button></div></form><div id="feedback" class="problem-feedback" role="status" aria-live="polite"></div><div id="hint-region" class="hint-region" hidden></div><div id="solution-region" class="solution-region" hidden></div><details class="typing-help"><summary>${t('typingHelp')}</summary><p>${t('typingHelpBody')}</p><p><code>2x</code> · <code>3xy</code> · <code>ln(x)</code> · <code>sqrt(x)</code> · <code>e^x</code> · <code>{-1, 3}</code></p></details></section>`;
  typeset(host.querySelector('.problem-prompt'));
  const form = host.querySelector('#answer-form');
  const feedback = host.querySelector('#feedback');
  let checked = false, firstTry = true, hintIndex = 0;
  const readAnswers = () => Object.fromEntries(problem.fields.map(field => [field.key, field.type === 'choice' ? (form.querySelector(`input[name="${field.key}"]:checked`)?.value || '') : form.elements[field.key]?.value || '']));
  const setAnswer = (field, value) => {
    if (field.type === 'choice') {
      const radio = [...form.querySelectorAll(`input[name="${field.key}"]`)].find(input => input.value === value);
      if (radio) radio.checked = true;
    } else form.elements[field.key].value = value;
  };
  const updatePreview = field => {
    if (field.type === 'choice') return;
    const input = form.elements[field.key];
    const preview = host.querySelector(`#preview-${field.key}`);
    const notice = host.querySelector(`#notice-${field.key}`);
    notice.textContent = ambiguityNotice(input.value, lang);
    if (!input.value.trim()) { preview.innerHTML = ''; return; }
    if (field.type === 'set') {
      const entries = parseSetEntries(input.value);
      const parsedEntries = entries?.map(entry => parseAnswer(entry, []));
      preview.innerHTML = parsedEntries?.every(item => item.ok)
        ? katex.renderToString(`\\{${parsedEntries.map(item => item.tex).join(', ')}\\}`, { throwOnError: true })
        : `<span class="preview-error">${escapeHtml(localizedError(parsedEntries?.find(item => !item.ok)?.error || 'Enter a set such as {-1, 3}', lang))}</span>`;
      return;
    }
    const parsed = parseAnswer(input.value, field.type === 'expr' ? problem.vars : []);
    preview.innerHTML = parsed.ok ? katex.renderToString(parsed.tex, { throwOnError: true }) : `<span class="preview-error">${escapeHtml(localizedError(parsed.error, lang))}</span>`;
  };
  for (const field of problem.fields) {
    if (field.type !== 'choice') form.elements[field.key].addEventListener('input', () => updatePreview(field));
  }
  const runCheck = (record = true) => {
    const answers = readAnswers();
    const outcome = checkMulti(answers, problem);
    const misconception = outcome.status === 'incorrect' ? matchMisconception(answers, problem) : null;
    const messages = { correct: t('correct'), incorrect: misconception ? misconception.feedback[lang] : t('incorrect'), invalid: t('invalid'), uncheckable: t('uncheckable') };
    feedback.className = `problem-feedback is-${outcome.status}`;
    const invalid = invalidDisplay(outcome, problem, lang, messages[outcome.status]);
    feedback.textContent = `${outcome.status === 'correct' ? '✓' : outcome.status === 'incorrect' ? '✕' : '!'} ${invalid.summary}`;
    for (const field of problem.fields) {
      const node = host.querySelector(`[data-field-feedback="${field.key}"]`);
      if (node) {
        const fieldResult = outcome.fields[field.key];
        node.textContent = invalid.suppressField ? '' : fieldResult.status === 'correct' ? `✓ ${t('correct')}` : fieldResult.status === 'incorrect' ? t('incorrect') : fieldResult.status === 'uncheckable' ? t('uncheckable') : localizedError(fieldResult.message, lang);
      }
    }
    if (record && !checked && outcome.status !== 'invalid' && outcome.status !== 'uncheckable') {
      recordAttempt(problem.id, level, firstTry && outcome.status === 'correct', Math.max(...selected.levels));
      checked = true;
    }
    if (outcome.status === 'correct' || outcome.status === 'incorrect') firstTry = false;
    return outcome;
  };
  form.addEventListener('submit', event => { event.preventDefault(); runCheck(); });
  const hintRegion = host.querySelector('#hint-region');
  const showHint = () => {
    hintRegion.hidden = false;
    hintRegion.innerHTML = `<p>${escapeHtml(problem.hints[Math.min(hintIndex, problem.hints.length - 1)][lang])}</p>`;
    typeset(hintRegion);
    hintIndex++;
  };
  const showSolution = () => {
    if (!checked && !qa) { recordAttempt(problem.id, level, false, Math.max(...selected.levels)); checked = true; }
    else if (!qa) breakStreak(problem.id);
    firstTry = false;
    const node = host.querySelector('#solution-region');
    node.hidden = false;
    node.innerHTML = `<h3>${t('workedSolution')}</h3><ol>${problem.solution.map(step => `<li>${escapeHtml(step[lang])}</li>`).join('')}</ol>`;
    typeset(node);
  };
  host.querySelector('#hint-button').addEventListener('click', showHint);
  host.querySelector('#solution-button').addEventListener('click', showSolution);
  host.querySelector('#new-button').addEventListener('click', () => { location.hash = routeFor(module, selected, level, freshSeed()); });
  host.querySelector('#generator-select').addEventListener('change', event => {
    const next = generators.find(item => item.id === event.target.value);
    location.hash = routeFor(module, next, next.levels[0], freshSeed());
  });
  host.querySelector('#level-select').addEventListener('change', event => { location.hash = routeFor(module, selected, Number(event.target.value), freshSeed()); });

  // QA state is a review-only URL switch. It changes nothing when absent and
  // never writes learning progress.
  if (['correct', 'incorrect', 'misconception', 'invalid', 'solution', 'hint'].includes(qa)) {
    for (const field of problem.fields) setAnswer(field, field.answer);
    const first = problem.fields[0];
    if (qa === 'incorrect') setAnswer(first, first.type === 'expr' ? `(${first.answer})+1` : first.type === 'number' ? `(${first.answer})+1` : '');
    if (qa === 'misconception') {
      const item = problem.misconceptions[0];
      if (item) setAnswer(problem.fields.find(field => field.key === item.key) || first, item.answer);
    }
    if (qa === 'invalid') setAnswer(first, 'x++');
    for (const field of problem.fields) updatePreview(field);
    runCheck(false);
    if (qa === 'solution') showSolution();
    if (qa === 'hint') showHint();
  }
  return problem;
}
