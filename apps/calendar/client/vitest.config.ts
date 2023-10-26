import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig(configEnv => mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        exclude: [...configDefaults.exclude],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov']
        },
        reporters: ['default'],
        outputFile: "./coverage/junit.xml"
      },
    }) as never
  ))