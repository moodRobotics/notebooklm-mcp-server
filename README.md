<div align="center">
  <img src="./notebooklm_mcp_logo.png" width="200" alt="NotebookLM MCP Server logo">

  <h1>NotebookLM MCP Server</h1>

  <p><b>Give your AI agents full control of Google Gemini Notebook (formerly NotebookLM): grounded answers, deep research, podcasts, quizzes, and more — 47 tools, zero hallucinations.</b></p>

  <p>
    <b>English</b> •
    <a href="./README.es.md">Español</a> •
    <a href="./README.fr.md">Français</a> •
    <a href="./README.pt.md">Português</a> •
    <a href="./README.de.md">Deutsch</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/MCP-Model_Context_Protocol-8A2BE2?style=for-the-badge" alt="MCP">
    <a href="https://www.npmjs.com/package/notebooklm-mcp-server"><img src="https://img.shields.io/npm/v/notebooklm-mcp-server?style=for-the-badge&logo=npm&color=CB3837" alt="npm version"></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows">
    <img src="https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white" alt="macOS">
    <img src="https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black" alt="Linux">
  </p>
  <p>
    <img src="https://img.shields.io/badge/Claude_Code-D97757?style=for-the-badge&logo=claude&logoColor=white" alt="Claude Code">
    <img src="https://img.shields.io/badge/Antigravity-5E35B1?style=for-the-badge" alt="Antigravity">
    <img src="https://img.shields.io/badge/Gemini_CLI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini CLI">
    <img src="https://img.shields.io/badge/Cursor-000000?style=for-the-badge" alt="Cursor">
    <img src="https://img.shields.io/badge/Windsurf-58C4DC?style=for-the-badge" alt="Windsurf">
    <img src="https://img.shields.io/badge/Cline-9C27B0?style=for-the-badge" alt="Cline">
  </p>

  <p>
    <a href="#-installation">Installation</a> •
    <a href="#-authentication">Authentication</a> •
    <a href="#-connect-your-ai-client">Connect Your AI Client</a> •
    <a href="#-tool-reference">Tool Reference</a> •
    <a href="#-recipes">Recipes</a> •
    <a href="#-development">Development</a>
  </p>
</div>

---

## 💡 What is this?

Google's **Gemini Notebook** (renamed from NotebookLM in July 2026) is the best grounded-answer engine on the market: it only answers from the sources you give it, with citations. This MCP server hands that power to your AI agents — Claude, Gemini, Antigravity, Cursor and any other MCP client — so they can build notebooks, run Deep Research, generate podcasts, videos, quizzes, flashcards, reports and mind maps, take notes, and share the results with your team. **All programmatically, with zero hallucinations.**

> [!NOTE]
> **NotebookLM is now Gemini Notebook.** Google renamed the product on July 16, 2026 (see [notebook.google](https://notebook.google/)). Same product, same notebooks, same API surface — this server keeps working unchanged, and the npm package keeps its `notebooklm-mcp-server` name.

## 🚀 Installation

### Option 1 — Global install (recommended)

```bash
npm install -g notebooklm-mcp-server
```

> [!NOTE]
> The server checks for updates on startup and keeps itself current automatically.

### Option 2 — Zero-install with NPX

```bash
npx -y notebooklm-mcp-server auth   # authenticate
npx -y notebooklm-mcp-server start  # run the server
```

## 🔑 Authentication

1. Run the interactive login (opens a Chromium window):

```bash
npx notebooklm-mcp-server auth
```

2. Sign in with your Google account. When the notebook list appears, the session cookies (including Google's rotating `__Secure-1PSIDTS` token) are captured and saved to `~/.notebooklm-mcp/auth.json`.

3. Done — the server loads the session automatically and refreshes the rotating token by itself.

> [!TIP]
> If the session ever expires, run `npx notebooklm-mcp-server auth` again in a terminal, then call the `refresh_auth` MCP tool (or just restart your client) to pick up the new cookies without reconfiguring anything.

## ⚡ Connect Your AI Client

### 🤖 Claude Code

```bash
claude mcp add notebooklm -- npx -y notebooklm-mcp-server start
```

### 💬 Claude Desktop

Add to `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "notebooklm": {
      "command": "npx",
      "args": ["-y", "notebooklm-mcp-server", "start"]
    }
  }
}
```

### 🌌 Antigravity CLI

Antigravity's CLI manages MCP servers through a JSON config file:

- **Global:** `~/.gemini/config/mcp_config.json`
- **Per-workspace:** `.agents/mcp_config.json` in your project

```json
{
  "mcpServers": {
    "notebooklm": {
      "command": "npx",
      "args": ["-y", "notebooklm-mcp-server", "start"]
    }
  }
}
```

Then type `/mcp` in the Antigravity prompt panel to open the **MCP Manager**: check the connection status ring, reload the config, or inspect logs — no restart needed. Your agents can now cite real sources in every mission.

### 🖥️ Antigravity IDE

The IDE reads the same config files as the CLI (`~/.gemini/config/mcp_config.json` or `.agents/mcp_config.json`). Alternatively, open the **MCP Store** panel, choose *Add custom server*, and paste the same JSON snippet. Reload the server list and the NotebookLM tools appear in the agent's toolbox.

### 💎 Gemini CLI

```bash
gemini mcp add notebooklm --scope user -- npx -y notebooklm-mcp-server start
```

### ⌨️ Cursor

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "notebooklm": {
      "command": "npx",
      "args": ["-y", "notebooklm-mcp-server", "start"]
    }
  }
}
```

### 🏄 Windsurf

Add the same `mcpServers` block to `~/.codeium/windsurf/mcp_config.json`.

### 🧩 VS Code (Cline)

In Cline: **MCP Servers → Configure** and add the same `mcpServers` block shown above.

## 📖 Tool Reference

47 tools, grouped by what they do. Full parameter signatures live in [docs/TOOLS.md](./docs/TOOLS.md).

### 📒 Notebooks

| Tool | Description |
|------|-------------|
| `notebook_list` | List all notebooks with sources and metadata |
| `notebook_create` | Create a new notebook |
| `notebook_get` | Get one notebook's details and source IDs |
| `notebook_rename` | Rename a notebook |
| `notebook_delete` | Delete a notebook (requires `confirm`) |
| `notebook_summarize` | AI notebook guide: summary + suggested questions |
| `prompts_suggest` | AI-suggested prompts to ask about the sources |

### 🔗 Sharing

| Tool | Description |
|------|-------------|
| `notebook_share` | Toggle public link and/or manage collaborators by email |
| `notebook_share_status` | Read the current sharing configuration |

### 🖇️ Sources

| Tool | Description |
|------|-------------|
| `notebook_add_url` | Add a website or YouTube video as a source |
| `notebook_add_text` | Add pasted text as a source |
| `notebook_add_drive` | Add a Google Drive document as a source |
| `notebook_add_local_file` | Upload a local PDF / TXT / Markdown file |
| `source_get_guide` | AI guide for one source: summary + key topics |
| `source_rename` | Rename a source |
| `source_check_freshness` | Check if a URL/Drive source has newer content |
| `source_sync` | Re-sync a Drive source to the latest content |
| `source_delete` | Delete a source (requires `confirm`) |

### 💬 Chat

| Tool | Description |
|------|-------------|
| `notebook_query` | Ask questions about the sources, with citations |
| `chat_history_get` | Read the latest conversation's Q&A turns |
| `chat_history_delete` | Clear the chat history (requires `confirm`) |
| `chat_configure` | Set the chat persona (default / learning guide / custom) and response length |

### 🔍 Research

| Tool | Description |
|------|-------------|
| `research_start` | Launch web or Drive research (fast ≈30s / deep ≈5min) |
| `research_poll` | Check research progress and discovered sources |
| `research_import` | Import the discovered sources into the notebook |

### 🎨 Studio

| Tool | Description |
|------|-------------|
| `audio_overview_create` | Podcast-style Audio Overview (formats: deep dive, brief, critique, debate) |
| `video_overview_create` | Video Overview (9 visual styles, from whiteboard to anime) |
| `report_create` | Written report from the sources |
| `flashcards_create` | Flashcards (quantity and difficulty options) |
| `quiz_create` | Interactive quiz (quantity and difficulty options) |
| `infographic_create` | Infographic (landscape / portrait / square) |
| `slide_deck_create` | Slide deck |
| `data_table_create` | Structured data table |
| `studio_poll` | Check generation status of all artifacts |
| `studio_delete` | Delete a studio artifact |

### 📦 Artifacts

| Tool | Description |
|------|-------------|
| `artifact_content_get` | Fetch generated content (quiz/flashcards HTML, mind map JSON) |
| `artifact_rename` | Rename an artifact |
| `artifact_export` | Export an artifact to Google Drive (Docs or Sheets) |

### 📝 Notes & Mind Maps

| Tool | Description |
|------|-------------|
| `note_create` | Create a note |
| `note_list` | List all notes |
| `note_update` | Update a note's content/title |
| `note_delete` | Delete a note (requires `confirm`) |
| `mind_map_generate` | Generate a mind map JSON from sources |
| `mind_map_save` | Save a mind map to the notebook |
| `mind_map_list` | List saved mind maps |
| `mind_map_delete` | Delete a mind map |

### ⚙️ System

| Tool | Description |
|------|-------------|
| `refresh_auth` | Reload session cookies from disk after re-running `auth` |

## 🧪 Recipes

Real prompts you can paste into any connected agent — it picks the right tools by itself.

### 🎙️ From research question to podcast

> *"Research the latest on solid-state batteries with deep research, build a notebook called 'Solid State 2026' with the best sources, and generate a brief audio overview in English. Give me the link when it's done."*

The agent chains `notebook_create` → `research_start(mode: deep)` → `research_poll` → `research_import` → `audio_overview_create(format: brief)` → `studio_poll`, and returns the notebook URL with the finished podcast.

### 🎓 Study kit from your PDFs

> *"Take the three PDFs in ./lectures, put them in a new notebook, and make me a hard quiz plus flashcards on the key concepts. Show me the quiz questions here."*

The agent runs `notebook_add_local_file` per PDF, then `quiz_create(difficulty: hard)` + `flashcards_create`, polls with `studio_poll`, and pulls the questions out with `artifact_content_get`.

### 👥 Team briefing, shared

> *"Build a briefing notebook from these five links about our competitor, write a report, export it to Google Docs, and share the notebook with ana@example.com as a viewer."*

The agent chains `notebook_add_url` ×5 → `report_create` → `studio_poll` → `artifact_export(format: docs)` → `notebook_share(user_email, user_role: viewer)` — and your teammate finds the notebook and the Doc waiting.

## 🛠️ Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Authentication expired` right after logging in | Update to ≥ 3.0.8 — older versions missed Google's rotating `__Secure-1PSIDTS` token. The server now captures and auto-refreshes it. |
| `Authentication failed` after weeks of use | Google sessions eventually expire. Run `npx notebooklm-mcp-server auth`, then call the `refresh_auth` tool. |
| Studio generation stuck on `pending` | Long sources take a while — keep polling `studio_poll`; audio/video can take several minutes. |
| RPC errors after a Google update | Google occasionally rotates internal build labels. Update the package; if it persists, open an issue. |

## 🧑‍💻 Development

```bash
git clone https://github.com/moodRobotics/notebooklm-mcp-server.git
cd notebooklm-mcp-server
npm install
npm run build
npm run typecheck
```

Architecture notes live in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), the roadmap in [docs/ROADMAP.md](./docs/ROADMAP.md).

## 🌐 Localization

This README is available in [English](./README.md), [Español](./README.es.md), [Français](./README.fr.md), [Português](./README.pt.md) and [Deutsch](./README.de.md). If you edit one, please keep the others in sync (`npm run docs:check`).

## 📄 License

MIT — Developed with ❤️ by [moodRobotics](https://github.com/moodRobotics).

> [!IMPORTANT]
> This is an unofficial community project. It is not affiliated with or endorsed by Google. It relies on reverse-engineered internal APIs that may change without notice; use it with a Google account you are comfortable automating.
