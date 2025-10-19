import { describe, expect, it } from 'vitest';
import { dslToTs } from '../../src/plugin/dslToTs';

describe('dslToTs', () => {
  describe('primitives', () => {
    it('should handle string', () => {
      expect(dslToTs('string')).toBe('string');
      expect(dslToTs('string?')).toBe('string | undefined');
    });

    it('should handle number', () => {
      expect(dslToTs('number')).toBe('number');
      expect(dslToTs('number?')).toBe('number | undefined');
    });

    it('should handle boolean', () => {
      expect(dslToTs('boolean')).toBe('boolean');
      expect(dslToTs('boolean?')).toBe('boolean | undefined');
    });
  });

  describe('enum', () => {
    it('should handle required enum', () => {
      expect(dslToTs({ type: 'enum', values: ['a', 'b'] })).toBe('"a" | "b"');
    });

    it('should handle optional enum', () => {
      expect(
        dslToTs({ type: 'enum', values: ['a', 'b'], optional: true }),
      ).toBe('"a" | "b" | undefined');
    });
  });

  describe('array', () => {
    it('should handle required array of primitives', () => {
      expect(dslToTs({ type: 'array', items: 'number' })).toBe('(number)[]');
    });

    it('should handle optional array', () => {
      expect(dslToTs({ type: 'array', items: 'string', optional: true })).toBe(
        '((string)[]) | undefined',
      );
    });

    it('should handle array of objects', () => {
      expect(
        dslToTs({
          type: 'array',
          items: { type: 'object', shape: { id: 'number' } },
        }),
      ).toBe('({ id: number })[]');
    });

    it('should handle nested arrays', () => {
      expect(
        dslToTs({
          type: 'array',
          items: { type: 'array', items: 'string' },
        }),
      ).toBe('((string)[])[]');
    });
  });

  describe('object', () => {
    it('should handle required object', () => {
      expect(
        dslToTs({
          type: 'object',
          shape: { id: 'string', flag: 'boolean?' },
        }),
      ).toBe('{ id: string; flag?: boolean | undefined }');
    });

    it('should handle optional object', () => {
      expect(
        dslToTs({
          type: 'object',
          shape: { id: 'string' },
          optional: true,
        }),
      ).toBe('({ id: string }) | undefined');
    });

    it('should handle nested objects', () => {
      expect(
        dslToTs({
          type: 'object',
          shape: {
            user: {
              type: 'object',
              shape: { name: 'string', age: 'number?' },
            },
          },
        }),
      ).toBe('{ user: { name: string; age?: number | undefined } }');
    });
  });

  describe('complex nested structures', () => {
    it('should handle deeply nested DSL', () => {
      const complexDsl = {
        type: 'object',
        shape: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              shape: {
                id: 'string',
                roles: {
                  type: 'enum',
                  values: ['admin', 'editor', 'viewer'],
                },
                settings: {
                  type: 'object',
                  shape: {
                    notifications: 'boolean?',
                    tags: {
                      type: 'array',
                      items: 'string',
                      optional: true,
                    },
                  },
                  optional: true,
                },
              },
            },
          },
        },
      };
      const expected =
        '{ users: ({ id: string; roles: "admin" | "editor" | "viewer"; settings?: ({ notifications?: boolean | undefined; tags?: (string)[] | undefined }) | undefined })[] }';
      expect(dslToTs(complexDsl)).toBe(expected);
    });
  });
});
