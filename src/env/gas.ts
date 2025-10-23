import type { Adapter } from '@/env';
import type { WebAppLocationType } from '~/types/appsscript';

export const gasAdapter: Adapter = {
  push: (url: string) => {
    const urlObj = new URL(url);
    const paramsArray = urlObj.searchParams.entries();
    const params = Object.fromEntries(paramsArray);
    const hash = urlObj.hash;
    google.script.history.push({}, params, hash);
  },
  replace: (url: string) => {
    const urlObj = new URL(url);
    const paramsArray = urlObj.searchParams.entries();
    const params = Object.fromEntries(paramsArray);
    const hash = urlObj.hash;
    google.script.history.replace({}, params, hash);
  },
  getLocation: async () => {
    const getLocation = () =>
      new Promise<WebAppLocationType>((resolve) => {
        google.script.url.getLocation((l) => {
          resolve(l);
        });
      });
    const loc = await getLocation();
    return loc?.hash ?? '';
  },
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
