import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('legacy Supabase Auth compatibility migration', () => {
  it('keeps every GoTrue string token scan-safe without changing credentials', () => {
    const sql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20260827195000_normalize_legacy_auth_user_tokens.sql'),
      'utf8',
    );

    for (const field of [
      'confirmation_token',
      'recovery_token',
      'email_change_token_new',
      'email_change',
      'phone_change_token',
      'phone_change',
      'email_change_token_current',
      'reauthentication_token',
    ]) {
      expect(sql).toContain(`${field} = coalesce(${field}, '')`);
      expect(sql).toContain(`${field} is null`);
    }

    expect(sql).not.toMatch(/encrypted_password\s*=/i);
    expect(sql).not.toMatch(/delete\s+from\s+auth\.users/i);
  });
});
