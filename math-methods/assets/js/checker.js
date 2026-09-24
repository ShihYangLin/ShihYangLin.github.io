// Browser: index.html loads the vendored UMD bundle as a classic script before app.js.
// Node: tests load those same bytes through createRequire (as a temporary .cjs copy,
// because this package's "type": "module" makes the original .js an ES module),
// then pass the resulting math object to createChecker. No vendor file is changed.
const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'exp', 'log', 'sqrt', 'abs']);
const CONSTANTS = new Set(['e', 'pi']);
const OPERATORS = new Set(['add', 'subtract', 'multiply', 'divide', 'pow', 'unaryMinus', 'unaryPlus']);
const ABS = 1e-8;
const REL = 1e-6;

export function normalizeInput(input, vars = []) {
  let value = String(input ?? '').normalize('NFKC').replace(/[−–—]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/ln\s*\(/gi, 'log(').trim();
  // math.js reads "xy" as one name. Split only strings wholly made of the declared
  // single-letter variables; function names and unknown identifiers stay intact.
  if (vars.every(name => /^[A-Za-z]$/.test(name))) {
    value = value.replace(/[A-Za-z]+/g, token => {
      if (FUNCTIONS.has(token) || CONSTANTS.has(token)) return token;
      const letters = [...token];
      if (letters.length > 1 && letters.every(char => vars.includes(char) || (char === 'e' && !vars.includes('e')))) return letters.join('*');
      return token;
    });
    value = value.replace(/([A-Za-z]+)\s*\(/g, (match, name) => vars.includes(name) ? `${name}*(` : match);
  }
  return value;
}

export function ambiguityNotice(input, lang = 'en') {
  const source = String(input ?? '').normalize('NFKC');
  if (/e\^2x/.test(source)) return lang === 'zh' ? 'e^2x 讀作 (e^2)·x；若要輸入 e^(2x)，請加括號。' : 'e^2x is read as (e^2)·x. For e^(2x), add parentheses.';
  if (/1\/2x/.test(source)) return lang === 'zh' ? '1/2x 讀作 (1/2)·x；若要輸入 1/(2x)，請加括號。' : '1/2x is read as (1/2)·x. For 1/(2x), add parentheses.';
  const match = source.match(/([\^\/])\s*(\d+(?:\.\d+)?)\s*(?=[A-Za-z(])/);
  if (!match) return '';
  const [, operator, value] = match;
  return lang === 'zh'
    ? `請確認括號：${operator}${value}x 讀作「先${operator === '^' ? '次方' : '除以'} ${value}，再乘 x」；若要將 x 一起運算，請加括號。`
    : `Check grouping: ${operator}${value}x is read as “apply ${operator}${value}, then multiply by x.” Add parentheses to include x.`;
}

function friendlyParseError(message) {
  if (/Unknown symbol:/.test(message)) return message;
  if (/Unexpected|Parenthesis|End of expression|Syntax|Value expected|Function expected|Unexpected end/i.test(message)) return 'Check the expression syntax and parentheses';
  return 'Check the expression syntax and parentheses';
}

function validate(node, allowedVars) {
  let count = 0;
  node.traverse((child, _path, parent) => {
    if (++count > 150) throw new Error('Expression is too long');
    if (child.isParenthesisNode) return;
    if (child.isConstantNode) {
      if (typeof child.value !== 'number' || !Number.isFinite(child.value)) throw new Error('Only finite numbers are allowed');
      return;
    }
    if (child.isSymbolNode) {
      if (FUNCTIONS.has(child.name)) {
        if (!parent?.isFunctionNode || parent.fn !== child) throw new Error('Use parentheses, e.g. ln(x)');
        return;
      }
      if (child.name === 'ln') throw new Error('Use parentheses, e.g. ln(x)');
      if (!allowedVars.has(child.name) && !CONSTANTS.has(child.name)) {
        if (/^(?:ln|log|sqrt|sin|cos|tan|exp|abs)[A-Za-z]+$/i.test(child.name)) throw new Error('Use parentheses, e.g. ln(x)');
        if (/^[A-Za-z]exp(?:\(.+\))?$/.test(child.name)) throw new Error('Write x*exp(x) with a multiplication sign');
        throw new Error(`Unknown symbol: ${child.name}`);
      }
      return;
    }
    if (child.isOperatorNode && OPERATORS.has(child.fn)) return;
    if (child.isFunctionNode && child.fn?.isSymbolNode && FUNCTIONS.has(child.fn.name)) {
      const count = child.fn.name === 'log' ? [1, 2] : [1];
      if (!count.includes(child.args.length)) throw new Error('Wrong number of function arguments');
      return;
    }
    if (child.isFunctionNode && /^[A-Za-z]exp$/.test(child.fn?.name || '')) throw new Error('Write x*exp(x) with a multiplication sign');
    throw new Error('This expression contains an unsupported operation');
  });
}

function result(status, message, extra = {}) { return { status, message, ...extra }; }

export function parseSetEntries(value) {
  const source = String(value ?? '').normalize('NFKC').trim();
  if (!source) return null;
  const wrapped = /^\{.*\}$/.test(source);
  if (source.startsWith('{') !== source.endsWith('}')) return null;
  const body = (wrapped ? source.slice(1, -1) : source).trim();
  if (!body) return [];
  const entries = []; let depth = 0, start = 0;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '(') depth++;
    if (body[i] === ')') depth--;
    if (depth < 0) return null;
    if (body[i] === ',' && depth === 0) { entries.push(body.slice(start, i)); start = i + 1; }
  }
  if (depth !== 0) return null;
  entries.push(body.slice(start));
  return entries.every(entry => entry.trim()) ? entries : null;
}

export function createChecker(library = globalThis.math) {
  if (!library?.create || !library?.parse) throw new Error('Load the vendored math.js UMD bundle before checker.js');
  const math = library.create();
  const parse = math.parse.bind(math);
  // Defense in depth: expression ASTs are whitelisted below; the instance also
  // removes evaluation, code-generation, mutation and symbolic helper entry points.
  const blocked = () => { throw new Error('Function unavailable in student expressions'); };
  math.import({ import: blocked, createUnit: blocked, evaluate: blocked, parse: blocked,
    simplify: blocked, derivative: blocked, resolve: blocked }, { override: true });
  // Only compiled whitelisted ASTs run against this private instance.

  function parseAnswer(input, vars = []) {
    if (!Array.isArray(vars) || vars.some(name => !/^[A-Za-z][A-Za-z0-9]*$/.test(name) || CONSTANTS.has(name) || FUNCTIONS.has(name))) {
      return { ok: false, node: null, tex: '', error: 'Invalid variable declaration' };
    }
    const source = normalizeInput(input, vars);
    if (!source || source.length > 300) return { ok: false, node: null, tex: '', error: source ? 'Expression is too long' : 'Enter an answer' };
    let node;
    try {
      node = parse(source);
    } catch (error) {
      return { ok: false, node: null, tex: '', error: friendlyParseError(error.message || '') };
    }
    try {
      validate(node, new Set(vars));
      return { ok: true, node, tex: node.toTex(), error: null };
    } catch (error) {
      return { ok: false, node: null, tex: '', error: error.message || 'Invalid expression' };
    }
  }

  function compilePair(student, reference, vars) {
    const left = parseAnswer(student, vars);
    if (!left.ok) return { error: result('invalid', left.error) };
    const right = parseAnswer(reference, vars);
    if (!right.ok) throw new Error(`Invalid reference answer: ${right.error}`);
    return { left: left.node.compile(), right: right.node.compile() };
  }

  function checkExpr(student, reference, vars = [], domain = {}, opts = {}) {
    const pair = compilePair(student, reference, vars);
    if (pair.error) return pair.error;
    const { left, right } = pair;
    for (const variable of vars) {
      const interval = domain[variable];
      if (!Array.isArray(interval) || interval.length !== 2 || !interval.every(Number.isFinite) || interval[0] >= interval[1]) {
        throw new Error(`Invalid domain for ${variable}`);
      }
    }
    let valid = 0;
    let wrong = false;
    const count = opts.points ?? 10;
    if (!Number.isInteger(count) || count < 8) throw new Error('At least eight points are required');
    // Independent irrational steps prevent all coordinates from tracing
    // parallel diagonal lines. Independent phases avoid a fixed offset.
    const steps = [Math.SQRT2 - 1, Math.sqrt(3) - 1, Math.sqrt(5) - 2, Math.sqrt(7) - 2];
    const phases = vars.map(() => Math.random());
    for (let attempt = 0; attempt < 50 && valid < count; attempt++) {
      const scope = Object.fromEntries(vars.map((name, index) => {
        const [low, high] = domain[name];
        const fraction = (phases[index] + attempt * (steps[index] ?? (Math.sqrt(11 + 2 * index) % 1))) % 1;
        return [name, low + (high - low) * fraction];
      }));
      let b;
      try { b = right.evaluate(scope); } catch { continue; }
      if (typeof b !== 'number' || !Number.isFinite(b)) continue;
      valid++;
      let a;
      try { a = left.evaluate(scope); } catch { wrong = true; continue; }
      if (typeof a !== 'number' || !Number.isFinite(a)) { wrong = true; continue; }
      if (Math.abs(a - b) > (opts.absTol ?? ABS) + (opts.relTol ?? REL) * Math.max(Math.abs(a), Math.abs(b))) wrong = true;
    }
    if (valid < 6) return result('uncheckable', 'Could not check; please simplify your answer');
    return result(wrong ? 'incorrect' : 'correct', wrong ? 'Not equivalent' : 'Correct');
  }

  function checkNumber(student, reference, opts = {}) {
    const pair = compilePair(student, String(reference), []);
    if (pair.error) return pair.error;
    let a, b;
    try { a = pair.left.evaluate({}); b = pair.right.evaluate({}); } catch { return result('invalid', 'Enter a finite number'); }
    if (typeof a !== 'number' || typeof b !== 'number' || !Number.isFinite(a) || !Number.isFinite(b)) return result('invalid', 'Enter a finite number');
    const correct = Math.abs(a - b) <= (opts.absTol ?? 1e-6) + (opts.relTol ?? 1e-6) * Math.max(Math.abs(a), Math.abs(b));
    return result(correct ? 'correct' : 'incorrect', correct ? 'Correct' : 'Not equal');
  }

  function checkChoice(student, reference) {
    if (typeof student !== 'string' || !student.trim()) return result('invalid', 'Choose an answer');
    const correct = student === reference;
    return result(correct ? 'correct' : 'incorrect', correct ? 'Correct' : 'Not equal');
  }

  function checkSet(student, reference, opts = {}) {
    const a = parseSetEntries(student), b = parseSetEntries(reference);
    if (!a) return result('invalid', 'Enter a set such as {-1, 3}');
    if (!b) throw new Error('Invalid reference set');
    const used = new Set();
    for (const entry of a) {
      const parsed = parseAnswer(entry, []);
      if (!parsed.ok) return result('invalid', parsed.error);
      let found = false;
      for (let i = 0; i < b.length; i++) {
        if (!used.has(i) && checkNumber(entry, b[i], opts).status === 'correct') { used.add(i); found = true; break; }
      }
      if (!found) return result('incorrect', 'Set does not match');
    }
    const correct = a.length === b.length;
    return result(correct ? 'correct' : 'incorrect', correct ? 'Correct' : 'Set does not match');
  }

  function checkField(student, field, problem) {
    if (field.type === 'expr') return checkExpr(student, field.answer, problem.vars, problem.domain, field.tol || {});
    if (field.type === 'number') return checkNumber(student, field.answer, field.tol || {});
    if (field.type === 'set') return checkSet(student, field.answer, field.tol || {});
    if (field.type === 'choice') return checkChoice(student, field.answer);
    throw new Error(`Unknown answer type: ${field.type}`);
  }

  function checkMulti(answers, problem) {
    const fields = Object.fromEntries(problem.fields.map(field => [field.key, field.gradeWhen && problem.fields.find(item => item.key === field.gradeWhen.key)?.answer !== field.gradeWhen.value
      ? result('skipped', 'Not graded for this behavior')
      : checkField(answers?.[field.key], field, problem)]));
    const statuses = Object.values(fields).map(field => field.status);
    const status = ['invalid', 'uncheckable', 'incorrect'].find(value => statuses.includes(value)) || 'correct';
    return result(status, status === 'correct' ? 'Correct' : 'Check the marked fields', { fields });
  }

  function matchMisconception(answers, problem) {
    for (const item of problem.misconceptions || []) {
      const field = problem.fields.find(candidate => candidate.key === (item.key || problem.fields[0].key));
      if (!field) continue;
      const student = typeof answers === 'object' ? answers[field.key] : answers;
      if (checkField(student, { ...field, answer: item.answer }, problem).status === 'correct') return item;
    }
    return null;
  }

  return { math, parseAnswer, checkExpr, checkNumber, checkChoice, checkSet, checkMulti, checkField, matchMisconception };
}

let defaultChecker;
function current() { return defaultChecker ||= createChecker(); }
export const parseAnswer = (...args) => current().parseAnswer(...args);
export const checkExpr = (...args) => current().checkExpr(...args);
export const checkNumber = (...args) => current().checkNumber(...args);
export const checkChoice = (...args) => current().checkChoice(...args);
export const checkSet = (...args) => current().checkSet(...args);
export const checkMulti = (...args) => current().checkMulti(...args);
export const matchMisconception = (...args) => current().matchMisconception(...args);
