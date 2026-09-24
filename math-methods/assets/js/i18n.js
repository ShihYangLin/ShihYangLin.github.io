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
    progressTitle: 'Your progress', progressIntro: 'Progress is stored in this browser. Three consecutive correct first attempts at a generator’s highest level mark it mastered.',
    themeToDark: 'Switch to dark theme', themeToLight: 'Switch to light theme',
    moduleCount: '10 topics · 2 tracks',
    practiceLabel: 'PRACTICE', generator: 'Problem type', difficulty: 'Difficulty', level: 'Level', problemSeed: 'SEED',
    check: 'Check', hint: 'Hint', showSolution: 'Show solution', newProblem: 'New problem',
    correct: 'Correct', incorrect: 'Try again. Check each step.', invalid: 'Enter a valid answer.', uncheckable: 'Could not check; please simplify your answer.',
    workedSolution: 'Worked solution', typingHelp: 'How to type math', typingHelpBody: 'Use ^ for powers, parentheses for grouping, and * or adjacency for multiplication. ln and log mean natural log; log(x,b) uses base b.',
    resetProgress: 'Reset progress', confirmReset: 'Reset all local progress?', cancel: 'Cancel', confirm: 'Reset', exportProgress: 'Export JSON',
    generatorStatus: 'Problem type', attempts: 'Attempts', firstTryCorrect: 'First try correct', streak: 'Highest-level streak', bestLevel: 'Best level', status: 'Status'
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
    progressTitle: '學習進度', progressIntro: '進度儲存在此瀏覽器。某題型最高級別連續三次首次作答正確，即標記為精熟。',
    themeToDark: '切換為深色模式', themeToLight: '切換為淺色模式',
    moduleCount: '10 個主題 · 2 個類別',
    practiceLabel: '練習', generator: '題型', difficulty: '難度', level: '級別', problemSeed: '題目種子',
    check: '檢查答案', hint: '提示', showSolution: '顯示詳解', newProblem: '新題目',
    correct: '答對了', incorrect: '再試一次，檢查每個步驟。', invalid: '請輸入有效答案。', uncheckable: '無法判斷，請化簡答案後再試。',
    workedSolution: '解題步驟', typingHelp: '如何輸入數學式', typingHelpBody: '用 ^ 表示次方、括號分組，並以 * 或相鄰符號表示乘法。ln 與 log 代表自然對數；log(x,b) 的底數為 b。',
    resetProgress: '重設進度', confirmReset: '要清除所有本機學習進度嗎？', cancel: '取消', confirm: '重設', exportProgress: '匯出 JSON',
    generatorStatus: '題型', attempts: '作答次數', firstTryCorrect: '首次作答正確', streak: '最高級別連續答對', bestLevel: '最佳級別', status: '狀態'
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
