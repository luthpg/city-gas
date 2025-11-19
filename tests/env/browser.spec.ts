import { beforeEach, describe, expect, it, vi } from 'vitest';
import { browserAdapter } from '@/env/browser';

describe('Browser Adapter', () => {
  const pushStateSpy = vi.spyOn(window.history, 'pushState');
  const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('push should call window.history.pushState', () => {
    browserAdapter.push('/test');
    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/test');
  });

  it('replace should call window.history.replaceState', () => {
    browserAdapter.replace('/test');
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/test');
  });

  it('getLocation should return a promise that resolves with window.location.search', async () => {
    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      value: {
        search: '?page=/home',
      },
      writable: true,
    });
    const location = await browserAdapter.getLocation();
    expect(location).toBe('?page=/home');
  });

  it('onChange should add a popstate event listener', () => {
    const callback = vi.fn();
    browserAdapter.onChange(callback);
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'popstate',
      expect.any(Function),
    );
  });
});
