import { chromium } from 'playwright-extra';
import { describe, expect, it } from 'vitest';
import { enableStealth } from '../stealth-injector';

describe('Stealth Injector', () => {
  it('should return a browser launcher for valid engines', () => {
    const launcher = enableStealth('chromium');
    expect(launcher).toBeDefined();
    // playwright-extra objects usually have a name or executablePath,
    // but mainly we just want to ensure it's the chromium object
    expect(launcher).toBe(chromium);
  });

  it('should throw error for invalid engine', () => {
    // @ts-expect-error - Testing invalid input
    expect(() => enableStealth('invalid')).toThrow(
      'Unsupported browser engine: invalid',
    );
  });

  it('should register the stealth plugin', () => {
    const launcher = enableStealth('chromium');
    // playwright-extra exposes .plugins property
    // We cast to any because the type definition might not expose plugins publicly in all versions,
    // but it exists at runtime.
    // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
                const plugins = (launcher as any).plugins;
    
    // If plugins is undefined, maybe we are checking the wrong object?
    if (plugins) {
        // plugins is a PluginList object, not an array directly.
        // It has a .list getter that returns the array of plugins.
        // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
                        const pluginList = (plugins as any).list || (plugins as any)._plugins;
        expect(Array.isArray(pluginList)).toBe(true);
        // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
        const hasStealth = pluginList.some((p: any) => p.name === 'stealth');
        expect(hasStealth).toBe(true);
    } else {
        // Fallback check or fail
        // It might be that we need to access it differently
        expect(plugins).toBeDefined();
    }
  });
});
