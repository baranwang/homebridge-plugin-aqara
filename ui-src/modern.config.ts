import { moduleTools, defineConfig } from '@modern-js/module-tools';
import path from 'path';

const baseOutDir = path.resolve(__dirname, '../homebridge-ui');

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      buildType: 'bundleless',
      input: ['src/server.ts'],
      outDir: baseOutDir,
      dts: false,
      alias: {
        '@api': './dist/api',
      },
    },
    {
      buildType: 'bundle',
      input: ['src/index.tsx'],
      outDir: path.resolve(baseOutDir, 'public'),
      autoExternal: false,
      copy: {
        patterns: [{ from: './index.html', context: __dirname }],
      },
      define: {
        'process.env.NODE_ENV': process.env.NODE_ENV ?? 'development',
      },
      dts: false,
    },
  ],
});
