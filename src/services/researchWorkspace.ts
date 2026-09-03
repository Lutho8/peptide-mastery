import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

export type ResearchSave = Database['tracker']['Tables']['research_saves']['Row'];
export type ResearchSaveInsert = Database['tracker']['Tables']['research_saves']['Insert'];
export type UserCoaDocument = Database['tracker']['Tables']['user_coa_documents']['Row'];
export type UserCoaDocumentInsert = Database['tracker']['Tables']['user_coa_documents']['Insert'];

export async function listResearchSaves(): Promise<ResearchSave[]> {
  const { data, error } = await supabase
    .from('research_saves')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveResearchItems(items: ResearchSaveInsert[]): Promise<ResearchSave[]> {
  const { data, error } = await supabase
    .from('research_saves')
    .upsert(items, { onConflict: 'user_id,peptide_id,goal_id' })
    .select('*');
  if (error) throw error;
  return data ?? [];
}

export async function deleteResearchSave(id: string): Promise<void> {
  const { error } = await supabase.from('research_saves').delete().eq('id', id);
  if (error) throw error;
}

export async function listCoaDocuments(): Promise<UserCoaDocument[]> {
  const { data, error } = await supabase
    .from('user_coa_documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCoaDocument(document: UserCoaDocumentInsert): Promise<UserCoaDocument> {
  const { data, error } = await supabase
    .from('user_coa_documents')
    .insert(document)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCoaDocument(document: UserCoaDocument): Promise<void> {
  const { error: objectError } = await supabase.storage.from('coa-vault').remove([document.file_path]);
  if (objectError) throw objectError;
  const { error: rowError } = await supabase.from('user_coa_documents').delete().eq('id', document.id);
  if (rowError) throw rowError;
}

export async function createCoaSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('coa-vault').createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export async function recordResearchWorkspaceEvent(
  userId: string,
  eventName:
    | 'evidence_passport_viewed'
    | 'research_comparison_viewed'
    | 'research_plan_saved'
    | 'coa_document_uploaded'
    | 'coa_document_deleted',
  context: Record<string, Json | undefined> = {},
): Promise<void> {
  const { error } = await supabase.from('journey_events').insert({
    user_id: userId,
    event_name: eventName,
    source: 'research_workspace',
    context,
  });
  if (error) console.warn('[Journey] Research workspace event was not recorded:', error.message);
}
