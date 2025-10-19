export type DSL =
  | 'string'
  | 'string?'
  | 'number'
  | 'number?'
  | 'boolean'
  | 'boolean?'
  | { type: 'enum'; values: string[]; optional?: boolean }
  | { type: 'array'; items: DSL; optional?: boolean }
  | { type: 'object'; shape: Record<string, DSL>; optional?: boolean };

export function dslToTs(dsl: DSL): string {
  if (typeof dsl === 'string') {
    const base = dsl.replace('?', '');
    return dsl.endsWith('?') ? `${base} | undefined` : base;
  }
  if (dsl.type === 'enum') {
    const union = dsl.values.map((v) => JSON.stringify(v)).join(' | ');
    return dsl.optional ? `${union} | undefined` : union;
  }
  if (dsl.type === 'array') {
    const item = dslToTs(dsl.items);
    const arr = `(${item})[]`;
    return dsl.optional ? `${arr} | undefined` : arr;
  }
  if (dsl.type === 'object') {
    const fields = Object.entries(dsl.shape)
      .map(([k, v]) => {
        const ts = dslToTs(v);
        const opt =
          (typeof v === 'string' && v.endsWith('?')) ||
          (typeof v === 'object' && v.optional);
        return `${k}${opt ? '?' : ''}: ${ts}`;
      })
      .join('; ');
    const obj = `{ ${fields} }`;
    return dsl.optional ? `${obj} | undefined` : obj;
  }
  throw new Error('Unsupported DSL');
}
