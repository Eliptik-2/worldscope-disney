# Worldscope family notes: security and launch plan
Status: UI prototype in v1.7 development preview, **NOT CLOUD SYNCED**.

## What works now
- First-use name prompt with skip, editable display name.
- Local notes list: user name, time, location tag, note text.
- Save/reopen on the same device, and export a JSON backup.
- Data is stored in browser localStorage (separate for /preview/), **not shared**.
- Usernames are unverified display labels. Another visitor could choose the same name.

## Requirements before enabling family-wide notes
1. Use a managed backend (Supabase Postgres + Auth is suitable) with member authentication; no writing shared notes as anonymous public users.
2. Establish one private group/trip with membership restricted by invitation (email or authenticated invitation tokens).
3. Store notes keyed by group_id and author_user_id (not just editable display names) with creation timestamps and optional place IDs.
4. Add row-level security on every table: read only if auth.uid() belongs to trip members; insert only as yourself and in your group; update/delete only for the author or owner.
5. Keep a server-side service role key OFF GitHub Pages. The browser may hold a publishable/anon key only when RLS and authentication are correctly configured.
6. Add rate limits, content length limits, report/delete controls and an 'Export my notes' option.
7. Do not store GPS history or precise live locations in shared notes by default.
8. Notify visitors clearly that authenticated notes are visible to the invited family group.
9. Test with two separate devices/accounts before switching the main site.

## Suggested database schema (conceptual; NOT deployed)
- family_groups(id uuid primary key, name text, created_by uuid)
- family_members(group_id uuid, user_id uuid, display_name text, role text, unique(group_id,user_id))
- notes(id uuid, group_id uuid, author_user_id uuid, place_id text, body text, created_at timestamptz, updated_at timestamptz)
- optional reactions or pinned posts later.

Never expose unrestricted anonymous insert/update policies on a public website.
