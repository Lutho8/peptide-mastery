import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829092646_evidence_companion_journal_confessions.sql'),
  'utf8',
);
const edgeFunction = readFileSync(
  resolve(process.cwd(), 'supabase/functions/peptide-ai-agent/index.ts'),
  'utf8',
);

describe('evidence companion database security', () => {
  it('keeps the journal owner-only and AI usage free of question text', () => {
    expect(migration).toMatch(/research_journal_owner_select[\s\S]*auth\.uid\(\).*user_id/);
    expect(migration).toMatch(/create table tracker\.ai_request_usage/);
    expect(migration).not.toMatch(/ai_request_usage[\s\S]{0,300}\bquestion\b/i);
  });

  it('makes only moderated confessions publicly readable', () => {
    expect(migration).toMatch(/confessions_public_read[\s\S]*moderation_status = 'published'/);
    expect(migration).toMatch(/confessions_owner_submit[\s\S]*moderation_status = 'pending'/);
    expect(migration).toMatch(/grant select on tracker\.community_confessions to anon/);
  });

  it('enforces the dosing and privacy boundaries in the server function', () => {
    expect(edgeFunction).toMatch(/can’t choose or recommend a personal dose, schedule, cycle, route, syringe, stack, or treatment/);
    expect(edgeFunction).toMatch(/requestsMeasurementExplanation\(question\) \? body\.measurementContext : undefined/);
    expect(edgeFunction).toMatch(/userClient\.from\("ai_request_usage"\)\.insert/);
    expect(edgeFunction).not.toMatch(/ai_request_usage"\)\.insert\([\s\S]{0,200}question/);
    expect(edgeFunction).not.toMatch(/openrouter|chatCompletion|OPENROUTER_API_KEY/i);
  });
});
