import { derivRulesGenerators } from './generators/deriv-rules.js';
import { derivBasicsGenerators } from './generators/deriv-basics.js';
import { limitsGenerators } from './generators/limits.js';
import { partialsGenerators } from './generators/partials.js';
import { expLogGenerators } from './generators/exp-log.js';
import { timingGenerators } from './generators/timing.js';
import { optOneGenerators } from './generators/opt-one.js';
import { taylorGenerators } from './generators/taylor.js';
import { optMultiGenerators } from './generators/opt-multi.js';
import { lagrangeGenerators } from './generators/lagrange.js';

export const modules = [
  { id: 'limits', group: 'calculus', title: { en: 'Limits & Continuity', zh: '極限與連續' }, sections: '§§6.2–6.7', generators: limitsGenerators },
  { id: 'deriv-basics', group: 'calculus', title: { en: 'Derivative Basics', zh: '導數基礎' }, sections: '§§6.2–6.3, 7.1', generators: derivBasicsGenerators },
  { id: 'deriv-rules', group: 'calculus', title: { en: 'Product, Quotient & Chain Rules', zh: '乘法、除法與連鎖法則' }, sections: '§§7.2–7.3', generators: derivRulesGenerators },
  { id: 'partials', group: 'calculus', title: { en: 'Partial Derivatives & Comparative Statics', zh: '偏導函數與比較靜態分析' }, sections: '§§7.4–7.6', generators: partialsGenerators },
  { id: 'exp-log', group: 'calculus', title: { en: 'Exponential & Log Functions', zh: '指數與對數函數' }, sections: '§§10.1–10.5, 10.7', generators: expLogGenerators },
  { id: 'timing', group: 'calculus', title: { en: 'Optimal Timing & Growth Rates', zh: '最適時點與成長率' }, sections: '§§10.6–10.7', generators: timingGenerators },
  { id: 'opt-one', group: 'optimization', title: { en: 'One-Variable Optimization', zh: '單變數最適化' }, sections: '§§9.1–9.4, 9.6', generators: optOneGenerators },
  { id: 'taylor', group: 'optimization', title: { en: 'Taylor Approximation', zh: 'Taylor 近似' }, sections: '§9.5', generators: taylorGenerators },
  { id: 'opt-multi', group: 'optimization', title: { en: 'Multivariable Unconstrained Optimization', zh: '多變數無限制最適化' }, sections: '§§11.1–11.7', generators: optMultiGenerators },
  { id: 'lagrange', group: 'optimization', title: { en: 'Equality-Constrained Optimization', zh: '等式限制最適化' }, sections: '§§12.1–12.5, 12.7', generators: lagrangeGenerators }
];

export const moduleById = new Map(modules.map(module => [module.id, module]));
