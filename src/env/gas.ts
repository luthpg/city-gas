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
  getLocation: () => {
    let loc: WebAppLocationType = { hash: '', parameter: {}, parameters: {} };
    google.script.url.getLocation((l) => {
      loc = l;
    });
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
