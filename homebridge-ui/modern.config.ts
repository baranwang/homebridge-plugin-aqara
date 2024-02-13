import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      buildType: 'bundleless',
      input: ['src/server.ts'],
      outDir: './',
      dts: false
    },
    {
      buildType: 'bundle',
      input: ['src/index.tsx'],
      outDir: './public/static',
      dts: false
    }
  ]
});
