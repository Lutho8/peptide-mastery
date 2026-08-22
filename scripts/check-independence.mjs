// Prevent a runtime or build dependency on Lovable from returning unnoticed.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve('.');
const files = [resolve('package.json'), resolve('package-lock.json'), resolve('vite.config.ts')];
const sourceRoots = [resolve('src'), resolve('supabase/functions')];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json']);

function collect(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const stat = statSync(path);
    if (stat.isDirectory()) collect(path);
    else if (sourceExtensions.has(extname(path))) files.push(path);
  }
}

sourceRoots.forEach(collect);

const forbidden = [
  { name: 'Lovable package import', pattern: /(?:from|import)\s*(?:\([^)]*)?\s*["'](?:npm:)?@lovable\.dev\// },
  { name: 'Lovable build plugin', pattern: /(?:from\s*["']lovable-tagger["']|["']lovable-tagger["']\s*:)/ },
  { name: 'Lovable gateway request', pattern: /fetch\s*\(\s*["']https:\/\/(?:ai\.gateway|connector-gateway)\.lovable\.dev/ },
  { name: 'Lovable server secret', pattern: /(?:Deno\.env\.get\s*\(\s*["']|process\.env\.)LOVABLE_/ },
];

const failures = [];
for (const file of new Set(files)) {
  const source = readFileSync(file, 'utf8');
  for (const check of forbidden) {
    if (check.pattern.test(source)) failures.push(`${relative(root, file)}: ${check.name}`);
  }
}

if (failures.length) {
  console.error(`Independence check failed:\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log(`Independence check passed (${new Set(files).size} active files scanned).`);
