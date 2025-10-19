import { browserAdapter } from './browser';
import { gasAdapter } from './gas';

export type LocationChangeCallback = (location: string) => void;

export interface Adapter {
  push: (url: string) => void;
  replace: (url: string) => void;
  getLocation: () => string;
  onChange: (callback: LocationChangeCallback) => void;
}

export function getAdapter(): Adapter {
  if (typeof google !== 'undefined' && google.script) {
    return gasAdapter;
  }
  return browserAdapter;
}
