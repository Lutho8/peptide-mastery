import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type JournalEntry = Database['tracker']['Tables']['research_journal_entries']['Row'];
export type JournalEntryInsert = Database['tracker']['Tables']['research_journal_entries']['Insert'];
export type CommunityConfession = Database['tracker']['Tables']['community_confessions']['Row'];
export type CommunityConfessionInsert = Database['tracker']['Tables']['community_confessions']['Insert'];

export async function listJournalEntries(): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('research_journal_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function createJournalEntry(entry: JournalEntryInsert): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('research_journal_entries')
    .insert(entry)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase.from('research_journal_entries').delete().eq('id', id);
  if (error) throw error;
}

export async function listConfessions(): Promise<CommunityConfession[]> {
  const { data, error } = await supabase
    .from('community_confessions')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function submitConfession(entry: CommunityConfessionInsert): Promise<CommunityConfession> {
  const { data, error } = await supabase
    .from('community_confessions')
    .insert({
      ...entry,
      moderation_status: 'pending',
      published_at: null,
      moderation_note: null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteConfession(id: string): Promise<void> {
  const { error } = await supabase.from('community_confessions').delete().eq('id', id);
  if (error) throw error;
}

export async function moderateConfession(
  id: string,
  status: 'published' | 'rejected',
  moderationNote: string | null = null,
): Promise<CommunityConfession> {
  const { data, error } = await supabase
    .from('community_confessions')
    .update({
      moderation_status: status,
      moderation_note: moderationNote?.trim() || null,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function recordCompanionEvent(
  userId: string,
  eventName:
    | 'ai_question_asked'
    | 'ai_answer_saved'
    | 'journal_entry_created'
    | 'confession_submitted'
    | 'confession_feed_viewed',
  context: Record<string, string | number | boolean | null> = {},
): Promise<void> {
  const { error } = await supabase.from('journey_events').insert({
    user_id: userId,
    event_name: eventName,
    source: 'evidence_companion',
    context,
  });
  if (error) console.warn('[Journey] Companion event was not recorded:', error.message);
}
