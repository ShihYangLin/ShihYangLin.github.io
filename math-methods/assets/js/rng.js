// The same seed produces the same problem in every browser and in Node.
export function createRng(seed) {
  if (!Number.isSafeInteger(seed) || seed < 0) throw new RangeError('Seed must be a nonnegative safe integer');
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  return {
    random,
    int(a, b) {
      if (!Number.isInteger(a) || !Number.isInteger(b) || a > b) throw new RangeError('Invalid integer range');
      return a + Math.floor(random() * (b - a + 1));
    },
    pick(items) {
      if (!items.length) throw new RangeError('Cannot pick from an empty array');
      return items[this.int(0, items.length - 1)];
    },
    nonzeroInt(a, b) {
      if (a === 0 && b === 0) throw new RangeError('Range contains only zero');
      let value;
      do { value = this.int(a, b); } while (value === 0);
      return value;
    },
    sign() { return random() < 0.5 ? -1 : 1; },
    shuffle(items) {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = this.int(0, i);
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }
  };
}
