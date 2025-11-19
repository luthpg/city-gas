import type { Adapter } from '@/env';
import type { WebAppLocationType } from '~/types/appsscript';

/**
 * GASのlocationオブジェクトをクエリ文字列に変換
 */
function locationToQuery(loc: WebAppLocationType): string {
  const search = new URLSearchParams();

  // parameters (配列対応版) を優先して使用
  if (loc.parameters) {
    for (const [key, values] of Object.entries(loc.parameters)) {
      for (const value of values) {
        search.append(key, value);
      }
    }
  } else if (loc.parameter) {
    // fallback
    for (const [key, value] of Object.entries(loc.parameter)) {
      search.set(key, value);
    }
  }

  const queryString = search.toString();
  return queryString ? `?${queryString}` : '';
}

export const gasAdapter: Adapter = {
  push: (url: string) => {
    const urlObj = new URL(url, 'http://example.com');
    const paramsArray = urlObj.searchParams.entries();
    const params = Object.fromEntries(paramsArray);
    const hash = urlObj.hash;
    google.script.history.push({}, params, hash);
  },
  replace: (url: string) => {
    const urlObj = new URL(url, 'http://example.com');
    const paramsArray = urlObj.searchParams.entries();
    const params = Object.fromEntries(paramsArray);
    const hash = urlObj.hash;
    google.script.history.replace({}, params, hash);
  },
  getLocation: () => {
    return new Promise((resolve) => {
      google.script.url.getLocation((loc) => {
        resolve(locationToQuery(loc));
      });
    });
  },
  onChange: (callback) => {
    google.script.history.setChangeHandler((e) => {
      callback(locationToQuery(e.location));
    });
  },
};
