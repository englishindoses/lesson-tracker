// Runs src/lib/ledger.check.ts.
//
// No test framework: esbuild already ships with Vite, so we bundle the checks
// in memory and run them. Nothing is written to disk.
import { build } from 'esbuild'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const result = await build({
  entryPoints: [resolve(root, 'src/lib/ledger.check.ts')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  logLevel: 'error',
})

const code = result.outputFiles[0].text
await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))

// Non-zero exit when anything failed, so this is usable in a build pipeline.
process.exitCode = globalThis.__ledgerCheckFailures ? 1 : 0
