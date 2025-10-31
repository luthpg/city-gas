import type { Adapter } from '@/env';

export const gasAdapter: Adapter = {
  push: (url: string) => {
    const urlObj = new URL(
      url.startsWith('http') ? `http://example.com/${url}` : url,
    );
    const paramsArray = urlObj.searchParams.entries();
    const params = Object.fromEntries(paramsArray);
    const hash = urlObj.hash;
    google.script.history.push({}, params, hash);
  },
  replace: (url: string) => {
    const urlObj = new URL(
      url.startsWith('http') ? `http://example.com/${url}` : url,
    );
    const paramsArray = urlObj.searchParams.entries();
    const params = Object.fromEntries(paramsArray);
    const hash = urlObj.hash;
    google.script.history.replace({}, params, hash);
  },
  getLocation: (callback) =>
    google.script.url.getLocation((l) => {
      const search = new URLSearchParams();
      if (l.parameter) {
        for (const [key, value] of Object.entries(l.parameter)) {
          search.set(key, value);
        }
      }
      callback(`?${search.toString()}`);
    }),
  onChange: (callback) => {
    google.script.history.setChangeHandler((e) => {
      const search = new URLSearchParams();
      if (e.location.parameter) {
        for (const [key, value] of Object.entries(e.location.parameter)) {
          search.set(key, value);
        }
      }
      callback(`?${search.toString()}`);
    });
  },
};
