# Supplied data import handoff

The Manus-managed schema is prepared in `db/migrations/001_initial_schema.sql`, but the database is shared by development and published runtime. The approved workflow is:

1. Export the source database from the existing provider as SQL or CSV with schema-compatible data, without sending credentials in chat.
2. Place the export in this workspace or provide a secure file path.
3. Review table/column mapping and row counts before importing.
4. Run the additive schema migration with `npm run db:migrate`.
5. Import data in foreign-key order, preserving IDs and timestamps, and verify counts and key relationships.
6. Remove the export from the workspace after verification unless retention is explicitly requested.

No data import is performed by this migration until the export is provided and the mapping has been reviewed.
