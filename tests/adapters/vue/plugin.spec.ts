import { describe, expect, it, vi } from 'vitest';
import type { App } from 'vue';
import { routerKey } from '@/adapters/vue/key';
import { createRouterPlugin } from '@/adapters/vue/plugin';
import type { Router } from '@/core/router';

describe('Vue Plugin', () => {
  it('should install the plugin and provide router context', () => {
    const mockRouter = {} as Router<any, any>;
    const plugin = createRouterPlugin(mockRouter);

    const app = {
      provide: vi.fn(),
    } as unknown as App;

    plugin.install(app);

    expect(app.provide).toHaveBeenCalledWith(routerKey, { router: mockRouter });
  });
});
