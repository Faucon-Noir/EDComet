import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      reporters: ['default', 'html'],
      outputFile: {
        html: './test-report/index.html',
      },
    },
  }),
);