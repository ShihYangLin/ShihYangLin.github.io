export const strings = {
  en: {
    siteTitle: 'Math Methods Practice', progress: 'Progress', footer: 'Calculus and optimization practice',
    heroEyebrow: 'ECONOMICS · MATHEMATICAL METHODS', heroTitle: 'Practice the math behind economic choices.',
    heroIntro: 'A bilingual practice space for calculus and optimization. Choose a topic to review key ideas and work through new problems.',
    groupCalculus: 'Calculus', groupOptimization: 'Optimization', sectionLabel: 'READING',
    notStarted: 'Not started', inProgress: 'In progress', mastered: 'Mastered',
    unknownRoute: 'That page was not found. Browse the topics below.',
    moduleIntro: 'This module is being prepared. The lesson and practice problems will appear after review.',
    moduleRead: 'Reference sections', backToTopics: 'All topics',
    problemPending: 'This problem generator is being prepared.',
    progressTitle: 'Your progress', progressIntro: 'Practice progress will appear here when exercises are available.',
    themeToDark: 'Switch to dark theme', themeToLight: 'Switch to light theme',
    moduleCount: '10 topics · 2 tracks'
  },
  zh: {
    siteTitle: '數學方法練習', progress: '學習進度', footer: '微積分與最適化練習',
    heroEyebrow: '經濟學 · 數學方法', heroTitle: '練習經濟學中的數學方法。',
    heroIntro: '以中英雙語練習微積分與最適化。選擇主題，複習核心概念並練習新題目。',
    groupCalculus: '微積分', groupOptimization: '最適化', sectionLabel: '延伸閱讀',
    notStarted: '尚未開始', inProgress: '練習中', mastered: '已精熟',
    unknownRoute: '找不到此頁面。請從下方選擇主題。',
    moduleIntro: '此單元正在準備中。教學重點與練習題將於審閱後加入。',
    moduleRead: '參考章節', backToTopics: '所有主題',
    problemPending: '此題型正在準備中。',
    progressTitle: '學習進度', progressIntro: '練習題上線後，這裡會顯示你的學習進度。',
    themeToDark: '切換為深色模式', themeToLight: '切換為淺色模式',
    moduleCount: '10 個主題 · 2 個類別'
  }
};

let currentLanguage = 'en';

export function resolveLanguage(search = '', stored = null, browser = 'en') {
  const requested = new URLSearchParams(search).get('lang');
  if (requested === 'en' || requested === 'zh') return requested;
  if (stored === 'en' || stored === 'zh') return stored;
  return browser.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function getLanguage() { return currentLanguage; }
export function t(key) { return strings[currentLanguage][key] ?? key; }

function storedLanguage() {
  try { return localStorage.getItem('mm-lang'); } catch { return null; }
}

export function initLanguage() {
  currentLanguage = resolveLanguage(window.location.search, storedLanguage(), navigator.language || 'en');
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-Hant' : 'en';
  return currentLanguage;
}

export function setLanguage(language) {
  if (language !== 'en' && language !== 'zh') return;
  currentLanguage = language;
  const url = new URL(window.location.href);
  url.searchParams.set('lang', language);
  window.history.replaceState(null, '', url);
  try { localStorage.setItem('mm-lang', language); } catch { /* Storage is optional. */ }
  document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
}
