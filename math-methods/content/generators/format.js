// Small shared formatter for generated algebra. Inputs are numeric coefficients;
// answers can still use explicit * where math.js parsing needs it.
export function term(coefficient, variable = '', power = 1) {
  if (coefficient === 0) return '';
  if (!variable || power === 0) return String(coefficient);
  const magnitude = Math.abs(coefficient);
  return `${coefficient < 0 ? '-' : ''}${magnitude === 1 ? '' : magnitude}${variable}${power === 1 ? '' : `^${power}`}`;
}

export function polynomial(pieces) {
  const terms = pieces.map(([coefficient, variable = '', power = 1]) => term(coefficient, variable, power)).filter(Boolean);
  return terms.map((part, index) => index && !part.startsWith('-') ? `+${part}` : part).join('') || '0';
}

export function linear(coefficient, variable, intercept = 0) {
  return polynomial([[coefficient, variable], [intercept]]);
}

export function product(coefficient, expression) {
  return `${coefficient === 1 ? '' : coefficient === -1 ? '-' : coefficient}(${expression})`;
}

// Parser power syntax uses parentheses; KaTeX expects a braced exponent.
export function texPowers(expression) {
  return String(expression).replace(/\^\(([^()]*)\)/g, '^{$1}');
}

// Display helpers: keep adjacent numeric factors distinct and reduce exact rates.
export function texProduct(coefficient, factor) {
  if (coefficient === 1) return factor;
  if (coefficient === -1) return `-${factor}`;
  return `${coefficient}${/^\s*[\d.]/.test(factor) ? '\\cdot ' : ''}${factor}`;
}

export function derivative(symbol, order, argument = '') {
  if (!Number.isInteger(order) || order < 1) throw new RangeError('Positive derivative order required');
  return `${symbol}${order <= 3 ? "'".repeat(order) : `^{(${order})}`}${argument ? `(${argument})` : ''}`;
}

export function frac(numerator, denominator, tex = false) {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) throw new RangeError('Fraction requires integers and a nonzero denominator');
  const sign = Math.sign(numerator * denominator) < 0 ? '-' : '';
  let p = Math.abs(numerator), q = Math.abs(denominator);
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const divisor = gcd(p, q);
  p /= divisor; q /= divisor;
  return q === 1 ? `${sign}${p}` : tex ? `${sign}\\frac{${p}}{${q}}` : `${sign}${p}/${q}`;
}

export function texRate(numerator, denominator, variable = '') {
  const coefficient = frac(numerator, denominator, true);
  if (!variable) return coefficient;
  if (coefficient === '0') return '0';
  if (coefficient === '1') return variable;
  if (coefficient === '-1') return `-${variable}`;
  return `${coefficient}${variable}`;
}
