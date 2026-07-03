# Scripts

## Live tooling (safe to run anytime)

| Script | npm alias | Purpose |
|---|---|---|
| `check-integrity.js` | `npm run check` | Verify DB ↔ storage are in sync; flags placeholder metadata |
| `backfill-image-data.js` | `npm run backfill` | Generate blur placeholders (sharp — Edge Function can't) |
| `sync-from-storage.js` | `npm run sync` | Recovery: rebuild DB rows from storage contents |
| `upload-images.js` | `npm run upload` | Interactive upload from `uploads/` (prompts per image) |
| `batch-upload.js` | — | Bulk upload driven by `uploads/batch.csv` (no prompts) |
| `compress-images.js` | — | Pre-compress images in `uploads/` before uploading |
| `copy-to-uploads.sh` | — | Copy selected artwork from the design folders into `uploads/` |

Normal upload path is neither of the above: **drop files into Supabase Storage**
(`Letters/`, `Words/`, `Miscellaneous/`) and the `ingest-image` Edge Function
creates draft rows automatically. The upload scripts are the bulk/offline path.

## `archive/` — one-shot history (do not run)

Completed migrations and the 2026-07-03 recovery backups, kept for the audit
trail: `migrate-paths.js`, `migrate-integrity.js`, `check-missing-images.js`
(superseded by `check-integrity.js`), `recompress-storage.js`, and the two
`backup-*.json` row snapshots.

## Schema

SQL lives in `supabase/migrations/` (numbered, run in order in the Supabase
SQL editor): `001-schema.sql`, `002-status-workflow-triggers.sql` (includes
the pg_net storage triggers).
