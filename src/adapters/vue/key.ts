import type { InjectionKey } from 'vue';
import type { RouterContext } from './plugin';

export const routerKey: InjectionKey<RouterContext> = Symbol('city-gas-router');
