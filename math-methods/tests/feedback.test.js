import test from 'node:test';
import assert from 'node:assert/strict';
import { feedbackUrl, pageContext, problemContext } from '../assets/js/feedback.js';

const form = { url: 'https://docs.google.com/forms/d/e/FORM_ID/viewform', contextEntry: 'entry.123456' };
const href = 'https://shihyanglin.github.io/math-methods/?lang=zh#/taylor/maclaurin-coef?level=2&seed=81723';

test('feedback links stay hidden until a form is configured', () => {
  assert.equal(feedbackUrl('anything', { url: '', contextEntry: '' }), null);
});

test('a configured form gets a pre-filled context answer', () => {
  const url = new URL(feedbackUrl('page: #/ | lang: en', form));
  assert.equal(url.origin + url.pathname, form.url);
  assert.equal(url.searchParams.get('usp'), 'pp_url');
  assert.equal(url.searchParams.get('entry.123456'), 'page: #/ | lang: en');
  assert.equal(feedbackUrl('ctx', { url: form.url, contextEntry: '' }), form.url);
});

test('problem context carries what is needed to regenerate the problem', () => {
  const context = problemContext({ problemId: 'taylor/maclaurin-coef', level: 2, seed: 81723, lang: 'zh', href });
  for (const part of ['problem: taylor/maclaurin-coef', 'level: 2', 'seed: 81723', 'lang: zh', `url: ${href}`]) {
    assert.ok(context.includes(part), part);
  }
  assert.ok(pageContext({ lang: 'zh', href }).startsWith('page: #/taylor/maclaurin-coef?level=2&seed=81723 | lang: zh'));
  assert.equal(new URL(feedbackUrl(context, form)).searchParams.get('entry.123456'), context);
});
