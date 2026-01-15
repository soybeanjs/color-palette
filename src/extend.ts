import type { Parsers } from './types';
import { Colord } from './colord';
import { parsers } from './shared/parse';

export type Plugin = (ColordClass: typeof Colord, parsers: Parsers) => void;

const activePlugins: Plugin[] = [];

export const extend = (plugins: Plugin[]): void => {
  plugins.forEach(plugin => {
    if (!activePlugins.includes(plugin)) {
      plugin(Colord, parsers);
      activePlugins.push(plugin);
    }
  });
};
