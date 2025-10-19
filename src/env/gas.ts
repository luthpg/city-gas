import type { Adapter } from '.';

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
    let loc: any;
    google.script.url.getLocation((l) => {
      loc = l;
    });
    return loc?.hash ?? '';
  },
  onChange: () => {
    // GAS has no popstate event
  },
};
