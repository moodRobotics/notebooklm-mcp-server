# Tools Reference

Complete reference for all 47 MCP tools exposed by `notebooklm-mcp-server` v3.1.0.

Conventions:

- **bold** parameters are required.
- `confirm` parameters must be `true` for destructive operations to run.
- `source_ids` arrays may usually be omitted or empty to target all sources in the notebook.

---

## Notebook Management

### `notebook_list`

List all notebooks with their sources and metadata.

- **Parameters**: none
- **Returns**: Markdown list with title, share flag, source count and notebook ID per notebook.

### `notebook_create`

Create a new notebook.

- **Parameters**: **`title`** (string)
- **Returns**: `{ status, notebook_id, title }`

### `notebook_get`

Get one notebook's details, including every source ID (needed by most studio tools).

- **Parameters**: **`notebook_id`** (string)
- **Returns**: `{ notebook_id, title, source_count, sources: [{ id, title }] }`

### `notebook_rename`

Rename a notebook.

- **Parameters**: **`notebook_id`** (string), **`title`** (string)

### `notebook_delete`

Delete a notebook permanently. IRREVERSIBLE.

- **Parameters**: **`notebook_id`** (string), **`confirm`** (boolean)

### `notebook_summarize`

Get the AI-generated notebook guide.

- **Parameters**: **`notebook_id`** (string)
- **Returns**: `{ summary, suggested_topics: [{ question, prompt }] }`

### `prompts_suggest`

Get AI-suggested prompts/questions for a notebook's sources.

- **Parameters**: **`notebook_id`** (string), `source_ids` (string[]), `surface` (`chat` | `quiz` | `flashcards`, default `chat`), `query` (string — free-text steer)

## Sharing

### `notebook_share`

Manage notebook sharing. Provide `access` to toggle the public link, and/or `user_email` + `user_role` to manage a collaborator (the grant is an upsert).

- **Parameters**: **`notebook_id`** (string), `access` (`private` | `anyone_with_link`), `user_email` (string), `user_role` (`viewer` | `editor` | `remove`), `notify` (boolean, default `true`), `message` (string — welcome message)
- **Returns**: The resulting share status.

### `notebook_share_status`

Read the current sharing configuration (public link state and collaborators).

- **Parameters**: **`notebook_id`** (string)

## Source Management

### `notebook_add_url`

Add a website or YouTube video as a source.

- **Parameters**: **`notebook_id`** (string), **`url`** (string)
- **Returns**: `{ status, source_id }`

### `notebook_add_text`

Add pasted text as a source.

- **Parameters**: **`notebook_id`** (string), **`title`** (string), **`content`** (string)

### `notebook_add_drive`

Add a Google Drive document as a source.

- **Parameters**: **`notebook_id`** (string), **`document_id`** (string), **`title`** (string), `doc_type` (`doc` | `slides` | `sheets` | `pdf`, default `doc`)

### `notebook_add_local_file`

Upload a local file as a source.

- **Parameters**: **`notebook_id`** (string), **`path`** (string — absolute path to a `.pdf`, `.txt` or `.md` file)

### `source_get_guide`

Get the AI-generated guide for one source (summary and key topics).

- **Parameters**: **`source_id`** (string)

### `source_rename`

Rename a source.

- **Parameters**: **`source_id`** (string), **`title`** (string)

### `source_check_freshness`

Check whether a URL/Drive source has newer content available. Use `source_sync` to refresh it.

- **Parameters**: **`source_id`** (string)

### `source_sync`

Re-sync a Google Drive source to its latest content.

- **Parameters**: **`source_id`** (string)

### `source_delete`

Delete a source permanently. IRREVERSIBLE. Note: takes only the source ID, no notebook ID.

- **Parameters**: **`source_id`** (string), **`confirm`** (boolean)

## Chat & Query

### `notebook_query`

Ask the AI about EXISTING sources in a notebook (grounded, with citations). Not for discovering new sources — use the research tools for that.

- **Parameters**: **`notebook_id`** (string), **`query`** (string), `source_ids` (string[] — omit for all), `conversation_id` (string — pass the previous response's ID for follow-ups)
- **Returns**: `{ answer, conversation_id }`

### `chat_history_get`

Get the notebook's most recent conversation.

- **Parameters**: **`notebook_id`** (string), `limit` (number, default 50)
- **Returns**: `{ conversation_id, turns }`

### `chat_history_delete`

Delete the notebook's chat history. IRREVERSIBLE.

- **Parameters**: **`notebook_id`** (string), **`confirm`** (boolean)

### `chat_configure`

Configure the chat persona and response length for a notebook. Writes the whole settings block (no partial merge).

- **Parameters**: **`notebook_id`** (string), `goal` (`default` | `learning_guide` | `custom`), `custom_prompt` (string — required when `goal=custom`, max 10 000 chars), `response_length` (`default` | `longer` | `shorter`)

## Research

### `research_start`

Start web or Drive research to find NEW sources. Workflow: `research_start` → `research_poll` → `research_import`.

- **Parameters**: **`notebook_id`** (string), **`query`** (string), `source` (`web` | `drive`, default `web`), `mode` (`fast` ≈30s/~10 sources | `deep` ≈5min/~40 sources, web only)

### `research_poll`

Poll research status and discovered sources.

- **Parameters**: **`notebook_id`** (string)
- **Returns**: `{ task_id, status, sources: [...] }` — pass `task_id` and `sources` to `research_import`.

### `research_import`

Import discovered sources into the notebook.

- **Parameters**: **`notebook_id`** (string), **`task_id`** (string), **`sources`** (array from `research_poll`)

## Studio Generation

All creators return `{ status, artifact: { artifact_id, type, status } }`. Poll with `studio_poll` until `completed`; audio/video can take minutes.

### `audio_overview_create`

Generate a podcast-style Audio Overview.

- **Parameters**: **`notebook_id`** (string), `source_ids` (string[]), `language` (BCP-47 code, default `en`), `focus_prompt` (string), `format` (`deep_dive` | `brief` | `critique` | `debate`, default `deep_dive`), `length` (`short` | `default` | `long`)

### `video_overview_create`

Generate a Video Overview.

- **Parameters**: **`notebook_id`** (string), `source_ids` (string[]), `language` (string), `focus_prompt` (string), `style` (`auto` | `classic` | `whiteboard` | `heritage` | `paper_craft` | `watercolor` | `anime` | `retro_print` | `kawaii`, default `auto`)

### `report_create`

Generate a written report.

- **Parameters**: **`notebook_id`** (string), `source_ids` (string[]), `language` (string), `focus_prompt` (string)

### `flashcards_create`

Generate flashcards. Retrieve the content with `artifact_content_get` once completed. Output language follows the account's settings.

- **Parameters**: **`notebook_id`** (string), `source_ids` (string[]), `focus_prompt` (string), `quantity` (`fewer` | `standard` | `more`), `difficulty` (`easy` | `medium` | `hard`)

### `quiz_create`

Generate an interactive quiz. Retrieve the content with `artifact_content_get` once completed.

- **Parameters**: **`notebook_id`** (string), `source_ids` (string[]), `focus_prompt` (string), `quantity` (`fewer` | `standard` | `more`), `difficulty` (`easy` | `medium` | `hard`)

### `infographic_create`

Generate an infographic.

- **Parameters**: **`notebook_id`** (string), `source_ids` (string[]), `language` (string), `focus_prompt` (string), `orientation` (`landscape` | `portrait` | `square`, default `landscape`)

### `slide_deck_create`

Generate a slide deck.

- **Parameters**: **`notebook_id`** (string), `source_ids` (string[]), `language` (string), `focus_prompt` (string)

### `data_table_create`

Generate a structured data table.

- **Parameters**: **`notebook_id`** (string), `source_ids` (string[]), `language` (string), `focus_prompt` (string)

### `studio_poll`

Check generation status of all artifacts in a notebook.

- **Parameters**: **`notebook_id`** (string)
- **Returns**: `{ artifacts: [{ artifact_id, title, type, status, content, media_url }] }` — `status` is one of `pending`, `in_progress`, `completed`, `failed`, `unknown`.

### `studio_delete`

Delete a studio artifact.

- **Parameters**: **`notebook_id`** (string), **`artifact_id`** (string)

## Artifact Management

### `artifact_content_get`

Fetch a completed artifact's generated content: interactive HTML for quizzes/flashcards, JSON node tree for interactive mind maps.

- **Parameters**: **`notebook_id`** (string), **`artifact_id`** (string)
- **Returns**: `{ artifact_id, html, mind_map_tree }`

### `artifact_rename`

Rename a studio artifact.

- **Parameters**: **`notebook_id`** (string), **`artifact_id`** (string), **`title`** (string)

### `artifact_export`

Export an artifact to the user's Google Drive as a Docs or Sheets file. Reports export well to `docs`, data tables to `sheets`.

- **Parameters**: **`notebook_id`** (string), **`artifact_id`** (string), `format` (`docs` | `sheets`, default `docs`), `title` (string — Drive file title)

## Notes

Notes are user-written content, distinct from AI-generated artifacts.

### `note_create`

Create a note.

- **Parameters**: **`notebook_id`** (string), **`title`** (string), **`content`** (string)
- **Returns**: `{ status, note: { note_id, title, notebook_id } }`

### `note_list`

List all notes in a notebook (mind maps are excluded — see `mind_map_list`).

- **Parameters**: **`notebook_id`** (string)
- **Returns**: `{ notes: [{ id, title, content, created_at }] }`

### `note_update`

Update a note's content and title. If `title` is omitted, the existing title is preserved.

- **Parameters**: **`notebook_id`** (string), **`note_id`** (string), **`content`** (string), `title` (string)

### `note_delete`

Delete a note. IRREVERSIBLE.

- **Parameters**: **`notebook_id`** (string), **`note_id`** (string), **`confirm`** (boolean)

## Mind Maps

### `mind_map_generate`

Generate a mind map JSON structure from sources (does not save it).

- **Parameters**: **`source_ids`** (string[])
- **Returns**: `{ mind_map_json, generation_id }`

### `mind_map_save`

Save a generated mind map to a notebook.

- **Parameters**: **`notebook_id`** (string), **`mind_map_json`** (string), **`source_ids`** (string[]), `title` (string, default "Mind Map")

### `mind_map_list`

List saved mind maps in a notebook.

- **Parameters**: **`notebook_id`** (string)

### `mind_map_delete`

Delete a mind map from a notebook.

- **Parameters**: **`notebook_id`** (string), **`mind_map_id`** (string)

## System

### `refresh_auth`

Reload authentication cookies from `~/.notebooklm-mcp/auth.json` (or the `NOTEBOOKLM_COOKIES` environment variable). Does NOT open a browser — run `notebooklm-mcp-server auth` in a terminal first, then call this tool so the running server picks up the new session.

- **Parameters**: none
