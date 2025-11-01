import { describe, expect, it } from 'vitest';
import { parseLocation, serializeParams } from '../../src/core/router';

describe('Core Composables', () => {
  describe('serializeParams', () => {
    it('should serialize basic objects', () => {
      const params = { a: 1, b: 'hello' };
      expect(serializeParams(params)).toBe('a=1&b=hello');
    });

    it('should handle array values', () => {
      const params = { tags: ['a', 'b'] };
      expect(serializeParams(params)).toBe('tags=a&tags=b');
    });

    it('should handle object values by JSON.stringifying them', () => {
      const params = { filter: { type: 'user', active: true } };
      const expected =
        'filter=%7B%22type%22%3A%22user%22%2C%22active%22%3Atrue%7D';
      expect(serializeParams(params)).toBe(expected);
    });

    it('should ignore undefined values', () => {
      const params = { a: 1, b: undefined };
      expect(serializeParams(params)).toBe('a=1');
    });
  });

  describe('parseLocation', () => {
    it('should parse basic location', () => {
      const route = parseLocation('?page=/about');
      expect(route.name).toBe('/about');
      expect(route.params).toEqual({});
    });

    it('should handle /index as root', () => {
      const route = parseLocation('?page=/index');
      expect(route.name).toBe('/');
    });

    it('should parse array values', () => {
      const route = parseLocation('?page=/&tags=a&tags=b');
      expect(route.params).toEqual({ tags: ['a', 'b'] });
    });

    it('should parse object values', () => {
      const route = parseLocation(
        '?page=/&filter=%7B%22type%22%3A%22user%22%7D',
      );
      expect(route.params).toEqual({ filter: { type: 'user' } });
    });

    it('should handle invalid JSON as string', () => {
      const route = parseLocation('?page=/&filter={type:user}');
      expect(route.params).toEqual({ filter: '{type:user}' });
    });
  });
});
