// Google Form for bug reports and suggestions. Fill both values from the form's
// "Get pre-filled link": `url` is its .../viewform address and `contextEntry` is the
// `entry.<number>` key of the short-answer question that receives the page context.
// While `url` is empty, the feedback links stay hidden.
export const FEEDBACK_FORM = { url: 'https://docs.google.com/forms/d/e/1FAIpQLSewOzm_Zl512ukZei3aeVVfFegWPDC1UOq0DQhI-vUKsef9eQ/viewform', contextEntry: 'entry.514791395' };

export function feedbackUrl(context, form = FEEDBACK_FORM) {
  if (!form.url) return null;
  const url = new URL(form.url);
  if (form.contextEntry && context) {
    url.searchParams.set('usp', 'pp_url');
    url.searchParams.set(form.contextEntry, context);
  }
  return url.href;
}

export function pageContext({ lang, href }) {
  return `page: ${new URL(href).hash || '#/'} | lang: ${lang} | url: ${href}`;
}

// Problem id, level, and seed regenerate exactly the problem the student saw.
export function problemContext({ problemId, level, seed, lang, href }) {
  return `problem: ${problemId} | level: ${level} | seed: ${seed} | lang: ${lang} | url: ${href}`;
}
