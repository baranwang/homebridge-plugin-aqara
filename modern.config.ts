import { moduleTools, defineConfig } from '@modern-js/module-tools';
import path from 'path';

const baseOutDir = path.resolve(__dirname, './homebridge-ui');

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      buildType: 'bundle',
      input: ['ui-src/server.ts'],
      outDir: baseOutDir,
      tsconfig: 'ui-src/tsconfig.json',
      externals: ['@homebridge/plugin-ui-utils', '@api/index'],
      dts: false,
      hooks: [
        {
          name: 'renderChunk',
          apply(compiler) {
            compiler.hooks.renderChunk.tapPromise('renderChunk', async (chunk) => {
              if (chunk.type === 'chunk') {
                chunk.contents = chunk.contents.replace(/@api\/index/g, '../dist/api');
              }
              return chunk;
            });
          },
        },
      ],
    },
    {
      buildType: 'bundle',
      input: ['ui-src/index.tsx'],
      outDir: path.resolve(baseOutDir, 'public'),
      autoExternal: false,
      platform: 'browser',
      tsconfig: 'ui-src/tsconfig.json',
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
