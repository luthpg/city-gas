import type { Adapter, LocationChangeCallback } from '@/env';

export const browserAdapter: Adapter = {
  push: (url: string) => {
    window.history.pushState({}, '', url);
  },
  replace: (url: string) => {
    window.history.replaceState({}, '', url);
  },
  getLocation: async () => window.location.search,
  onChange: (callback: LocationChangeCallback) => {
    window.addEventListener('popstate', () => {
      callback(window.location.search);
    });
  },
};
