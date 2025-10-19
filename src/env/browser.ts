import type { Adapter, LocationChangeCallback } from '.';

export const browserAdapter: Adapter = {
  push: (url: string) => {
    window.history.pushState({}, '', url);
  },
  replace: (url: string) => {
    window.history.replaceState({}, '', url);
  },
  getLocation: () => window.location.search,
  onChange: (callback: LocationChangeCallback) => {
    window.addEventListener('popstate', () => {
      callback(window.location.search);
    });
  },
};
