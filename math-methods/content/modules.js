export const modules = [
  { id: 'limits', group: 'calculus', title: { en: 'Limits & Continuity', zh: '極限與連續' }, sections: '§§6.2–6.7', generators: [] },
  { id: 'deriv-basics', group: 'calculus', title: { en: 'Derivative Basics', zh: '導數基礎' }, sections: '§§6.2–6.3, 7.1', generators: [] },
  { id: 'deriv-rules', group: 'calculus', title: { en: 'Product, Quotient & Chain Rules', zh: '乘法、除法與連鎖律' }, sections: '§§7.2–7.3', generators: [] },
  { id: 'partials', group: 'calculus', title: { en: 'Partial Derivatives & Comparative Statics', zh: '偏導數與比較靜態分析' }, sections: '§§7.4–7.6', generators: [] },
  { id: 'exp-log', group: 'calculus', title: { en: 'Exponential & Log Functions', zh: '指數與對數函數' }, sections: '§§10.1–10.5, 10.7', generators: [] },
  { id: 'timing', group: 'calculus', title: { en: 'Optimal Timing & Growth Rates', zh: '最適時點與成長率' }, sections: '§§10.6–10.7', generators: [] },
  { id: 'opt-one', group: 'optimization', title: { en: 'One-Variable Optimization', zh: '單變數最適化' }, sections: '§§9.1–9.4, 9.6', generators: [] },
  { id: 'taylor', group: 'optimization', title: { en: 'Taylor Approximation', zh: '泰勒近似' }, sections: '§9.5', generators: [] },
  { id: 'opt-multi', group: 'optimization', title: { en: 'Multivariable Unconstrained Optimization', zh: '多變數無限制最適化' }, sections: '§§11.1–11.7', generators: [] },
  { id: 'lagrange', group: 'optimization', title: { en: 'Equality-Constrained Optimization', zh: '等式限制最適化' }, sections: '§§12.1–12.5, 12.7', generators: [] }
];

export const moduleById = new Map(modules.map(module => [module.id, module]));
