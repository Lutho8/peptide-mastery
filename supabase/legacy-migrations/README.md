# Legacy tracker migrations

These migrations describe the tracker project's former standalone Supabase database.
They are preserved for audit history but are not part of the active migration chain.

The tracker now uses the shared Peptide South Africa Supabase project. Active files in
`../migrations` match that production project's recorded migration versions exactly.
Shared store/platform migrations are represented there by no-op history markers and
remain owned by the store repository.
