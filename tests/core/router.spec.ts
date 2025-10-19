import { describe, expect, it, vi } from 'vitest';
import { createRouter, serializeParams } from '../../src/core/router';

describe('serializeParams', () => {
  it('should serialize simple key-value pairs', () => {
    const params = { id: '123', user: 'test', count: 5, active: true };
    expect(serializeParams(params)).toBe(
      'id=123&user=test&count=5&active=true',
    );
  });

  it('should ignore undefined values', () => {
    const params = { id: '123', user: undefined, count: 0 };
    expect(serializeParams(params)).toBe('id=123&count=0');
  });

  it('should handle an empty params object', () => {
    const params = {};
    expect(serializeParams(params)).toBe('');
  });

  it('should serialize array values', () => {
    const params = { tags: ['a', 'b', 'c'], ids: [1, 2] };
    expect(serializeParams(params)).toBe('tags=a&tags=b&tags=c&ids=1&ids=2');
  });

  it('should serialize object values as JSON strings', () => {
    const params = { filter: { tab: 'general', show: false } };
    const expected = `filter=${encodeURIComponent('{"tab":"general","show":false}')}`;
    expect(serializeParams(params)).toBe(expected);
  });

  it('should handle a mix of types', () => {
    const params = {
      id: 'user-1',
      roles: ['admin', 'editor'],
      prefs: { theme: 'dark', lang: 'en' },
      lastLogin: undefined,
    };
    const expected = `id=user-1&roles=admin&roles=editor&prefs=${encodeURIComponent(
      '{"theme":"dark","lang":"en"}',
    )}`;
    expect(serializeParams(params)).toBe(expected);
  });
});

describe('router.navigate', () => {
  it('serializes simple params', () => {
    const router = createRouter<{ detail: { id: string } }, 'detail'>({
      detail: () => null,
    });
    const spy = vi.spyOn(window.history, 'pushState');
    router.navigate('detail', { id: '123' });
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      '',
      '?page=detail&id=123',
    );
  });

  it('serializes array params', () => {
    const router = createRouter<{ list: { tags: string[] } }, 'list'>({
      list: () => null,
    });
    const spy = vi.spyOn(window.history, 'pushState');
    router.navigate('list', { tags: ['a', 'b'] });
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      '',
      '?page=list&tags=a&tags=b',
    );
  });

  it('serializes nested object params', () => {
    const router = createRouter<
      { profile: { filter: { tab: string } } },
      'profile'
    >({ profile: () => null });
    const spy = vi.spyOn(window.history, 'pushState');
    router.navigate('profile', { filter: { tab: 'general' } });
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      '',
      `?page=profile&filter=${encodeURIComponent('{"tab":"general"}')}`,
    );
  });
});
