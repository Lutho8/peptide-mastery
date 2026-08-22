// Fail hosted builds before they can silently ship against the retired backend.
// Local builds remain possible without secrets so contributors can prerender and test.

const OWNED_SUPABASE_URL = 'https://eutszmrsukoqqeilzrbv.supabase.co';
const isHostedBuild = process.env.VERCEL === '1';

if (!isHostedBuild) {
  console.log('Production environment check skipped outside Vercel.');
  process.exit(0);
}

const configuredUrl = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const configuredKey = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
const keyLooksValid =
  configuredKey.startsWith('sb_publishable_') ||
  /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(configuredKey);

const failures = [];
if (configuredUrl !== OWNED_SUPABASE_URL) {
  failures.push(`VITE_SUPABASE_URL must be ${OWNED_SUPABASE_URL}`);
}
if (!keyLooksValid) {
  failures.push('VITE_SUPABASE_PUBLISHABLE_KEY is missing or malformed');
}

if (failures.length) {
  console.error(`Production environment check failed:\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log('Production environment check passed for the company-owned Supabase project.');
