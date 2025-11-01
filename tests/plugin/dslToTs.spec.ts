import { describe, expect, it } from 'vitest';
import { type DSL, dslToTs } from '@/plugin/dslToTs';

describe('dslToTs', () => {
  it('should convert primitive types', () => {
    expect(dslToTs('string')).toBe('string');
    expect(dslToTs('string?')).toBe('string | undefined');
    expect(dslToTs('number')).toBe('number');
    expect(dslToTs('number?')).toBe('number | undefined');
    expect(dslToTs('boolean')).toBe('boolean');
    expect(dslToTs('boolean?')).toBe('boolean | undefined');
  });

  it('should convert enum types', () => {
    const dsl = { type: 'enum', values: ['a', 'b', 'c'] } as DSL;
    expect(dslToTs(dsl)).toBe('"a" | "b" | "c"');
  });

  it('should convert optional enum types', () => {
    const dsl = { type: 'enum', values: ['a', 'b'], optional: true } as DSL;
    expect(dslToTs(dsl)).toBe('"a" | "b" | undefined');
  });

  it('should convert array types', () => {
    const dsl = { type: 'array', items: 'string' } as DSL;
    expect(dslToTs(dsl)).toBe('string[]');
  });

  it('should convert optional array types', () => {
    const dsl = { type: 'array', items: 'number', optional: true } as DSL;
    expect(dslToTs(dsl)).toBe('number[] | undefined');
  });

  it('should convert array of objects', () => {
    const dsl = {
      type: 'array',
      items: { type: 'object', shape: { id: 'string' } },
    } as DSL;
    expect(dslToTs(dsl)).toBe('{ id: string; }[]');
  });

  it('should convert object types', () => {
    const dsl = {
      type: 'object',
      shape: {
        name: 'string',
        age: 'number?',
      },
    } as DSL;
    expect(dslToTs(dsl)).toBe('{ name: string; age?: number; }');
  });

  it('should convert optional object types', () => {
    const dsl = {
      type: 'object',
      shape: { name: 'string' },
      optional: true,
    } as DSL;
    expect(dslToTs(dsl)).toBe('{ name: string; } | undefined');
  });

  it('should handle nested objects', () => {
    const dsl = {
      type: 'object',
      shape: {
        user: {
          type: 'object',
          shape: {
            id: 'string',
            profile: {
              type: 'object',
              shape: { email: 'string?' },
              optional: true,
            },
          },
        },
      },
    } as DSL;
    expect(dslToTs(dsl)).toBe(
      '{ user: { id: string; profile?: { email?: string; }; }; }',
    );
  });

  it('should handle complex nested structures', () => {
    const dsl = {
      type: 'object',
      shape: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            shape: {
              id: 'number',
              tags: { type: 'array', items: 'string', optional: true },
              status: { type: 'enum', values: ['active', 'inactive'] },
            },
          },
        },
      },
    } as DSL;
    expect(dslToTs(dsl)).toBe(
      '{ items: { id: number; tags?: string[]; status: "active" | "inactive"; }[]; }',
    );
  });
});
