// esbuild.config.js
const { build } = require('esbuild');

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/index.js',
  external: ['playwright', 'playwright-core'], // exclude native modules
  sourcemap: true,
  logLevel: 'info',
}).catch(() => process.exit(1));