<div align="center">
  <img src="./notebooklm_mcp_logo.png" width="200" alt="NotebookLM MCP Server logo">

  <h1>NotebookLM MCP Server</h1>

  <p><b>Volle Kontrolle über Google Gemini Notebook (ehemals NotebookLM) für Ihre KI-Agenten: fundierte Antworten, Deep Research, Podcasts, Quizze und mehr — 47 Tools, null Halluzinationen.</b></p>

  <p>
    <a href="./README.md">English</a> •
    <a href="./README.es.md">Español</a> •
    <a href="./README.fr.md">Français</a> •
    <a href="./README.pt.md">Português</a> •
    <b>Deutsch</b>
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
    <a href="#-authentifizierung">Authentifizierung</a> •
    <a href="#-ki-client-verbinden">KI-Client verbinden</a> •
    <a href="#-tool-referenz">Tool-Referenz</a> •
    <a href="#-rezepte">Rezepte</a> •
    <a href="#-entwicklung">Entwicklung</a>
  </p>
</div>

---

## 💡 Was ist das?

Googles **Gemini Notebook** (im Juli 2026 von NotebookLM umbenannt) ist die beste Engine für fundierte Antworten am Markt: Es antwortet ausschließlich auf Basis der bereitgestellten Quellen — mit Zitaten. Dieser MCP-Server gibt diese Stärke an Ihre KI-Agenten weiter — Claude, Gemini, Antigravity, Cursor und jeden anderen MCP-Client —, damit sie Notizbücher aufbauen, Deep Research durchführen, Podcasts, Videos, Quizze, Karteikarten, Berichte und Mindmaps generieren, Notizen anlegen und die Ergebnisse mit dem Team teilen können. **Alles programmatisch, mit null Halluzinationen.**

> [!NOTE]
> **NotebookLM heißt jetzt Gemini Notebook.** Google hat das Produkt am 16. Juli 2026 umbenannt (siehe [notebook.google](https://notebook.google/)). Gleiches Produkt, gleiche Notizbücher, gleiche API-Oberfläche — dieser Server funktioniert unverändert weiter, und das npm-Paket behält seinen Namen `notebooklm-mcp-server`.

## 🚀 Installation

### Option 1 — Globale Installation (empfohlen)

```bash
npm install -g notebooklm-mcp-server
```

> [!NOTE]
> Der Server prüft beim Start auf Updates und hält sich automatisch aktuell.

### Option 2 — Ohne Installation mit NPX

```bash
npx -y notebooklm-mcp-server auth   # authenticate
npx -y notebooklm-mcp-server start  # run the server
```

## 🔑 Authentifizierung

1. Den interaktiven Login starten (öffnet ein Chromium-Fenster):

```bash
npx notebooklm-mcp-server auth
```

2. Mit dem Google-Konto anmelden. Sobald die Notizbuchliste erscheint, werden die Sitzungs-Cookies (einschließlich Googles rotierendem `__Secure-1PSIDTS`-Token) erfasst und in `~/.notebooklm-mcp/auth.json` gespeichert.

3. Fertig — der Server lädt die Sitzung automatisch und aktualisiert das rotierende Token selbstständig.

> [!TIP]
> Falls die Sitzung einmal abläuft, einfach `npx notebooklm-mcp-server auth` erneut im Terminal ausführen und anschließend das MCP-Tool `refresh_auth` aufrufen (oder schlicht den Client neu starten), um die neuen Cookies zu übernehmen — ganz ohne Neukonfiguration.

## ⚡ KI-Client verbinden

### 🤖 Claude Code

```bash
claude mcp add notebooklm -- npx -y notebooklm-mcp-server start
```

### 💬 Claude Desktop

In `claude_desktop_config.json` eintragen (Settings → Developer → Edit Config):

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

Die Antigravity-CLI verwaltet MCP-Server über eine JSON-Konfigurationsdatei:

- **Global:** `~/.gemini/config/mcp_config.json`
- **Pro Workspace:** `.agents/mcp_config.json` im Projekt

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

Anschließend `/mcp` im Antigravity-Prompt-Panel eingeben, um den **MCP Manager** zu öffnen: Verbindungsstatus-Ring prüfen, Konfiguration neu laden oder Logs einsehen — ganz ohne Neustart. Die Agenten können nun in jeder Mission echte Quellen zitieren.

### 🖥️ Antigravity IDE

Die IDE liest dieselben Konfigurationsdateien wie die CLI (`~/.gemini/config/mcp_config.json` oder `.agents/mcp_config.json`). Alternativ das Panel **MCP Store** öffnen, *Add custom server* wählen und denselben JSON-Schnipsel einfügen. Nach dem Neuladen der Serverliste erscheinen die NotebookLM-Tools im Werkzeugkasten des Agenten.

### 💎 Gemini CLI

```bash
gemini mcp add notebooklm --scope user -- npx -y notebooklm-mcp-server start
```

### ⌨️ Cursor

In `.cursor/mcp.json` im Projekt eintragen (oder global in `~/.cursor/mcp.json`):

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

Denselben `mcpServers`-Block in `~/.codeium/windsurf/mcp_config.json` eintragen.

### 🧩 VS Code (Cline)

In Cline: **MCP Servers → Configure** öffnen und den oben gezeigten `mcpServers`-Block hinzufügen.

## 📖 Tool-Referenz

47 Tools, gruppiert nach Aufgabe. Die vollständigen Parameter-Signaturen stehen in [docs/TOOLS.md](./docs/TOOLS.md).

### 📒 Notizbücher

| Tool | Beschreibung |
|------|-------------|
| `notebook_list` | Alle Notizbücher mit Quellen und Metadaten auflisten |
| `notebook_create` | Ein neues Notizbuch erstellen |
| `notebook_get` | Details und Quellen-IDs eines Notizbuchs abrufen |
| `notebook_rename` | Ein Notizbuch umbenennen |
| `notebook_delete` | Ein Notizbuch löschen (erfordert `confirm`) |
| `notebook_summarize` | KI-Notizbuchguide: Zusammenfassung + vorgeschlagene Fragen |
| `prompts_suggest` | KI-vorgeschlagene Prompts zu den Quellen |

### 🔗 Freigabe

| Tool | Beschreibung |
|------|-------------|
| `notebook_share` | Öffentlichen Link umschalten und/oder Mitwirkende per E-Mail verwalten |
| `notebook_share_status` | Die aktuelle Freigabekonfiguration auslesen |

### 🖇️ Quellen

| Tool | Beschreibung |
|------|-------------|
| `notebook_add_url` | Eine Website oder ein YouTube-Video als Quelle hinzufügen |
| `notebook_add_text` | Eingefügten Text als Quelle hinzufügen |
| `notebook_add_drive` | Ein Google-Drive-Dokument als Quelle hinzufügen |
| `notebook_add_local_file` | Eine lokale PDF- / TXT- / Markdown-Datei hochladen |
| `source_get_guide` | KI-Leitfaden für eine Quelle: Zusammenfassung + Kernthemen |
| `source_rename` | Eine Quelle umbenennen |
| `source_check_freshness` | Prüfen, ob eine URL-/Drive-Quelle neuere Inhalte hat |
| `source_sync` | Eine Drive-Quelle auf den neuesten Inhalt synchronisieren |
| `source_delete` | Eine Quelle löschen (erfordert `confirm`) |

### 💬 Chat

| Tool | Beschreibung |
|------|-------------|
| `notebook_query` | Fragen zu den Quellen stellen, mit Zitaten |
| `chat_history_get` | Die Frage-Antwort-Runden der letzten Unterhaltung auslesen |
| `chat_history_delete` | Den Chatverlauf löschen (erfordert `confirm`) |
| `chat_configure` | Chat-Persona (Standard / Lernbegleiter / benutzerdefiniert) und Antwortlänge festlegen |

### 🔍 Recherche

| Tool | Beschreibung |
|------|-------------|
| `research_start` | Web- oder Drive-Recherche starten (schnell ≈30 s / tief ≈5 min) |
| `research_poll` | Recherchefortschritt und gefundene Quellen prüfen |
| `research_import` | Die gefundenen Quellen in das Notizbuch importieren |

### 🎨 Studio

| Tool | Beschreibung |
|------|-------------|
| `audio_overview_create` | Audiozusammenfassung im Podcast-Stil (Formate: Deep Dive, Kurzfassung, Kritik, Debatte) |
| `video_overview_create` | Videozusammenfassung (9 visuelle Stile, von Whiteboard bis Anime) |
| `report_create` | Schriftlicher Bericht aus den Quellen |
| `flashcards_create` | Karteikarten (Optionen für Anzahl und Schwierigkeitsgrad) |
| `quiz_create` | Interaktives Quiz (Optionen für Anzahl und Schwierigkeitsgrad) |
| `infographic_create` | Infografik (Quer- / Hoch- / Quadratformat) |
| `slide_deck_create` | Foliensatz |
| `data_table_create` | Strukturierte Datentabelle |
| `studio_poll` | Generierungsstatus aller Artefakte prüfen |
| `studio_delete` | Ein Studio-Artefakt löschen |

### 📦 Artefakte

| Tool | Beschreibung |
|------|-------------|
| `artifact_content_get` | Generierte Inhalte abrufen (Quiz-/Karteikarten-HTML, Mindmap-JSON) |
| `artifact_rename` | Ein Artefakt umbenennen |
| `artifact_export` | Ein Artefakt nach Google Drive exportieren (Docs oder Sheets) |

### 📝 Notizen & Mindmaps

| Tool | Beschreibung |
|------|-------------|
| `note_create` | Eine Notiz erstellen |
| `note_list` | Alle Notizen auflisten |
| `note_update` | Inhalt/Titel einer Notiz aktualisieren |
| `note_delete` | Eine Notiz löschen (erfordert `confirm`) |
| `mind_map_generate` | Ein Mindmap-JSON aus den Quellen generieren |
| `mind_map_save` | Eine Mindmap im Notizbuch speichern |
| `mind_map_list` | Gespeicherte Mindmaps auflisten |
| `mind_map_delete` | Eine Mindmap löschen |

### ⚙️ System

| Tool | Beschreibung |
|------|-------------|
| `refresh_auth` | Sitzungs-Cookies nach erneutem `auth`-Lauf von der Festplatte neu laden |

## 🧪 Rezepte

Echte Prompts zum direkten Einfügen in jeden verbundenen Agenten — die passenden Tools wählt er selbst aus.

### 🎙️ Von der Forschungsfrage zum Podcast

> *„Recherchiere per Deep Research den neuesten Stand zu Festkörperbatterien, baue ein Notizbuch namens ‚Solid State 2026' mit den besten Quellen und generiere eine kurze Audiozusammenfassung auf Englisch. Gib mir den Link, sobald sie fertig ist."*

Der Agent verkettet `notebook_create` → `research_start(mode: deep)` → `research_poll` → `research_import` → `audio_overview_create(format: brief)` → `studio_poll` und liefert die Notizbuch-URL mit dem fertigen Podcast zurück.

### 🎓 Lernpaket aus den eigenen PDFs

> *„Nimm die drei PDFs in ./lectures, lege sie in ein neues Notizbuch und erstelle mir ein schweres Quiz plus Karteikarten zu den Kernkonzepten. Zeig mir die Quizfragen hier an."*

Der Agent führt `notebook_add_local_file` für jedes PDF aus, dann `quiz_create(difficulty: hard)` + `flashcards_create`, pollt mit `studio_poll` und extrahiert die Fragen mit `artifact_content_get`.

### 👥 Team-Briefing, geteilt

> *„Baue aus diesen fünf Links ein Briefing-Notizbuch über unseren Wettbewerber, verfasse einen Bericht, exportiere ihn nach Google Docs und teile das Notizbuch mit ana@example.com als Betrachterin."*

Der Agent verkettet `notebook_add_url` ×5 → `report_create` → `studio_poll` → `artifact_export(format: docs)` → `notebook_share(user_email, user_role: viewer)` — und die Kollegin findet das Notizbuch samt Doc schon vor.

## 🛠️ Fehlerbehebung

| Symptom | Lösung |
|---------|-----|
| `Authentication expired` direkt nach dem Login | Auf ≥ 3.0.8 aktualisieren — ältere Versionen erfassten Googles rotierendes `__Secure-1PSIDTS`-Token nicht. Der Server erfasst und erneuert es jetzt automatisch. |
| `Authentication failed` nach wochenlanger Nutzung | Google-Sitzungen laufen irgendwann ab. `npx notebooklm-mcp-server auth` ausführen und anschließend das Tool `refresh_auth` aufrufen. |
| Studio-Generierung hängt bei `pending` | Lange Quellen brauchen ihre Zeit — weiter mit `studio_poll` abfragen; Audio/Video kann mehrere Minuten dauern. |
| RPC-Fehler nach einem Google-Update | Google rotiert gelegentlich interne Build-Labels. Das Paket aktualisieren; falls das Problem bestehen bleibt, bitte ein Issue eröffnen. |

## 🧑‍💻 Entwicklung

```bash
git clone https://github.com/moodRobotics/notebooklm-mcp-server.git
cd notebooklm-mcp-server
npm install
npm run build
npm run typecheck
```

Architektur-Notizen stehen in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), die Roadmap in [docs/ROADMAP.md](./docs/ROADMAP.md).

## 🌐 Lokalisierung

Diese README ist auf [English](./README.md), [Español](./README.es.md), [Français](./README.fr.md), [Português](./README.pt.md) und [Deutsch](./README.de.md) verfügbar. Wer eine Version bearbeitet, hält die anderen bitte synchron (`npm run docs:check`).

## 📄 Lizenz

MIT — Entwickelt mit ❤️ von [moodRobotics](https://github.com/moodRobotics).

> [!IMPORTANT]
> Dies ist ein inoffizielles Community-Projekt. Es ist weder mit Google verbunden noch von Google unterstützt. Es basiert auf per Reverse Engineering ermittelten internen APIs, die sich ohne Vorankündigung ändern können; die Nutzung sollte mit einem Google-Konto erfolgen, dessen Automatisierung unbedenklich ist.
