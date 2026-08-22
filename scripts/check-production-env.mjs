// Verify that every build is pinned to the owned backend without depending on
// Vercel settings. Publishable keys are public browser identifiers; privileged
// service-role credentials remain exclusively in Supabase Edge Functions.
import { readFileSync } from 'node:fs';

const source = readFileSync('src/integrations/supabase/public-config.ts', 'utf8');
const requiredUrl = 'https://eutszmrsukoqqeilzrbv.supabase.co';
const hasOwnedUrl = source.includes(`OWNED_SUPABASE_URL = '${requiredUrl}'`);
const hasModernPublishableKey = /OWNED_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_[A-Za-z0-9_-]+'/u.test(source);

if (!hasOwnedUrl || !hasModernPublishableKey) {
  console.error('Production environment check failed: owned Supabase public configuration is missing.');
  process.exit(1);
}

console.log('Production environment check passed for the company-owned Supabase project.');
