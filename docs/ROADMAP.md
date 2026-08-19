# Project Roadmap: notebooklm-mcp-server

## ✅ Shipped

### v3.0.x — Foundation

- [x] Reverse-engineered batchexecute RPC layer
- [x] Notebook CRUD (`notebook_list/create/get/rename/delete`)
- [x] Sources: URL, YouTube, pasted text, Google Drive, local PDF/TXT/MD
- [x] Grounded chat (`notebook_query`) with conversation follow-ups
- [x] Deep/fast research pipeline (start → poll → import)
- [x] Studio: audio, video, report, flashcards, infographic, slide deck, data table
- [x] Mind maps (generate, save, list, delete)
- [x] Playwright-based interactive auth
- [x] npm release with esbuild bundle + auto-update on startup
- [x] `__Secure-1PSIDTS` capture at login + RotateCookies auto-recovery at runtime (v3.0.8)
- [x] Multi-language documentation (EN/ES/FR/PT/DE)

### v4.0.0 — Gemini Notebook feature wave

- [x] Notes CRUD (`note_create/list/update/delete`)
- [x] Interactive quizzes (`quiz_create`) with quantity/difficulty options
- [x] Artifact content retrieval (`artifact_content_get` — quiz/flashcards HTML, mind-map trees)
- [x] Artifact rename + export to Google Drive (Docs/Sheets)
- [x] Notebook sharing: public link toggle, collaborator management, share status
- [x] Chat history read/delete; fixed `chat_configure` wire format
- [x] Source insights: per-source AI guide, rename, freshness check
- [x] Notebook guide (`notebook_summarize`) + AI prompt suggestions (`prompts_suggest`)
- [x] Studio option enums exposed: audio format/length, video style, infographic orientation, quiz/flashcards quantity+difficulty
- [x] Payload migration for Gemini-3.5-era backends (nested template block on create/add-source)

## 🚧 Next (v4.1)

- [ ] Batch source addition (multiple files/URLs in one call)
- [ ] Slide revision via natural-language prompts (`REVISE_SLIDE` RPC is mapped)
- [ ] Artifact media download to local files (audio/video/PPTX/PDF)
- [ ] Source labels / topic grouping (RPCs mapped: create/list/update/delete label)
- [ ] Streaming responses for `notebook_query`
- [ ] Retry failed artifacts in place (`RETRY_ARTIFACT`)
- [ ] User settings tools (output language)

## 🔭 Later

- [ ] Multi-account support (switch cookie profiles)
- [ ] Docker image for headless environments
- [ ] Unit tests for RPC payload builders/parsers
- [ ] Save chat answers as citation-rich notes

## ⛔ Blocked on Google

These Gemini Notebook capabilities have **no public/reverse-engineered API surface yet**; they ship when RPCs become observable:

- Code execution over sources (announced with the July 2026 Gemini Notebook rename; Ultra/enterprise rollout)
- "Deliverables" generation workflows
- Notebooks in Google Search AI Mode

---

*Roadmap subject to change based on Google API updates — this project tracks a private, unversioned API.*
