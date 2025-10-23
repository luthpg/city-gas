import { browserAdapter } from '@/env/browser';
import { gasAdapter } from '@/env/gas';

export type LocationChangeCallback = (location: string) => void;

export interface Adapter {
  push: (url: string) => void;
  replace: (url: string) => void;
  getLocation: () => Promise<string>;
  onChange: (callback: LocationChangeCallback) => void;
}

export function getAdapter(): Adapter {
  if ('google' in globalThis && google.script) {
    return gasAdapter;
  }
  return browserAdapter;
}
