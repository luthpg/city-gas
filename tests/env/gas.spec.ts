import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gasAdapter } from '@/env/gas';

describe('GAS Adapter', () => {
  const mockGoogleScript = {
    history: {
      push: vi.fn(),
      replace: vi.fn(),
      setChangeHandler: vi.fn(),
    },
    url: {
      getLocation: vi.fn(),
    },
  };

  vi.stubGlobal('google', { script: mockGoogleScript });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('push should call google.script.history.push', () => {
    gasAdapter.push('?page=/test&id=123#hash');
    expect(mockGoogleScript.history.push).toHaveBeenCalledWith(
      {},
      { page: '/test', id: '123' },
      '#hash',
    );
  });

  it('replace should call google.script.history.replace', () => {
    gasAdapter.replace('?page=/test&id=123#hash');
    expect(mockGoogleScript.history.replace).toHaveBeenCalledWith(
      {},
      { page: '/test', id: '123' },
      '#hash',
    );
  });

  it('getLocation should call google.script.url.getLocation and callback with search string', () => {
    const callback = vi.fn();
    mockGoogleScript.url.getLocation.mockImplementation((cb) => {
      cb({ parameter: { page: '/home', id: '456' } });
    });
    gasAdapter.getLocation(callback);
    expect(callback).toHaveBeenCalledWith('?page=%2Fhome&id=456');
  });

  it('onChange should call google.script.history.setChangeHandler', () => {
    const callback = vi.fn();
    gasAdapter.onChange(callback);
    expect(mockGoogleScript.history.setChangeHandler).toHaveBeenCalledWith(
      expect.any(Function),
    );

    // Also test the change handler callback
    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];
    changeHandler({ location: { parameter: { page: '/about' } } });
    expect(callback).toHaveBeenCalledWith('?page=%2Fabout');
  });
});
