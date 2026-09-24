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
