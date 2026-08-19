<div align="center">
  <img src="./notebooklm_mcp_logo.png" width="200" alt="NotebookLM MCP Server logo">

  <h1>NotebookLM MCP Server</h1>

  <p><b>Donnez à vos agents IA le contrôle total de Google Gemini Notebook (anciennement NotebookLM) : réponses ancrées dans vos sources, recherche approfondie, podcasts, quiz et plus encore — 47 outils, zéro hallucination.</b></p>

  <p>
    <a href="./README.md">English</a> •
    <a href="./README.es.md">Español</a> •
    <b>Français</b> •
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
    <a href="#-authentification">Authentification</a> •
    <a href="#-connectez-votre-client-ia">Connectez votre client IA</a> •
    <a href="#-référence-des-outils">Référence des outils</a> •
    <a href="#-recettes">Recettes</a> •
    <a href="#-développement">Développement</a>
  </p>
</div>

---

## 💡 Qu'est-ce que c'est ?

**Gemini Notebook** de Google (rebaptisé depuis NotebookLM en juillet 2026) est le meilleur moteur de réponses ancrées du marché : il ne répond qu'à partir des sources que vous lui fournissez, citations à l'appui. Ce serveur MCP met cette puissance entre les mains de vos agents IA — Claude, Gemini, Antigravity, Cursor et tout autre client MCP — pour qu'ils puissent créer des notebooks, lancer des Deep Research, générer des podcasts, des vidéos, des quiz, des flashcards, des rapports et des cartes mentales, prendre des notes et partager les résultats avec votre équipe. **Le tout par programmation, avec zéro hallucination.**

> [!NOTE]
> **NotebookLM s'appelle désormais Gemini Notebook.** Google a renommé le produit le 16 juillet 2026 (voir [notebook.google](https://notebook.google/)). Même produit, mêmes notebooks, même surface d'API — ce serveur continue de fonctionner sans changement, et le paquet npm conserve son nom `notebooklm-mcp-server`.

## 🚀 Installation

### Option 1 — Installation globale (recommandée)

```bash
npm install -g notebooklm-mcp-server
```

> [!NOTE]
> Le serveur vérifie les mises à jour au démarrage et se maintient à jour automatiquement.

### Option 2 — Zéro installation avec NPX

```bash
npx -y notebooklm-mcp-server auth   # authenticate
npx -y notebooklm-mcp-server start  # run the server
```

## 🔑 Authentification

1. Lancez la connexion interactive (ouvre une fenêtre Chromium) :

```bash
npx notebooklm-mcp-server auth
```

2. Connectez-vous avec votre compte Google. Lorsque la liste des notebooks apparaît, les cookies de session (y compris le jeton rotatif `__Secure-1PSIDTS` de Google) sont capturés et enregistrés dans `~/.notebooklm-mcp/auth.json`.

3. C'est terminé — le serveur charge la session automatiquement et rafraîchit le jeton rotatif tout seul.

> [!TIP]
> Si la session vient à expirer, relancez `npx notebooklm-mcp-server auth` dans un terminal, puis appelez l'outil MCP `refresh_auth` (ou redémarrez simplement votre client) pour récupérer les nouveaux cookies sans rien reconfigurer.

## ⚡ Connectez votre client IA

### 🤖 Claude Code

```bash
claude mcp add notebooklm -- npx -y notebooklm-mcp-server start
```

### 💬 Claude Desktop

Ajoutez ceci à `claude_desktop_config.json` (Paramètres → Développeur → Modifier la configuration) :

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

La CLI d'Antigravity gère les serveurs MCP via un fichier de configuration JSON :

- **Global :** `~/.gemini/config/mcp_config.json`
- **Par espace de travail :** `.agents/mcp_config.json` dans votre projet

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

Tapez ensuite `/mcp` dans le panneau de saisie d'Antigravity pour ouvrir le **MCP Manager** : vérifiez l'anneau d'état de la connexion, rechargez la configuration ou inspectez les journaux — sans aucun redémarrage. Vos agents peuvent désormais citer de vraies sources dans chaque mission.

### 🖥️ Antigravity IDE

L'IDE lit les mêmes fichiers de configuration que la CLI (`~/.gemini/config/mcp_config.json` ou `.agents/mcp_config.json`). Vous pouvez aussi ouvrir le panneau **MCP Store**, choisir *Add custom server* et coller le même extrait JSON. Rechargez la liste des serveurs et les outils NotebookLM apparaissent dans la boîte à outils de l'agent.

### 💎 Gemini CLI

```bash
gemini mcp add notebooklm --scope user -- npx -y notebooklm-mcp-server start
```

### ⌨️ Cursor

Ajoutez ceci à `.cursor/mcp.json` dans votre projet (ou à `~/.cursor/mcp.json` pour une portée globale) :

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

Ajoutez le même bloc `mcpServers` à `~/.codeium/windsurf/mcp_config.json`.

### 🧩 VS Code (Cline)

Dans Cline : **MCP Servers → Configure**, puis ajoutez le même bloc `mcpServers` que ci-dessus.

## 📖 Référence des outils

47 outils, regroupés par fonction. Les signatures complètes des paramètres se trouvent dans [docs/TOOLS.md](./docs/TOOLS.md).

### 📒 Notebooks

| Outil | Description |
|------|-------------|
| `notebook_list` | Lister tous les notebooks avec leurs sources et métadonnées |
| `notebook_create` | Créer un nouveau notebook |
| `notebook_get` | Obtenir les détails d'un notebook et les identifiants de ses sources |
| `notebook_rename` | Renommer un notebook |
| `notebook_delete` | Supprimer un notebook (nécessite `confirm`) |
| `notebook_summarize` | Guide IA du notebook : résumé + questions suggérées |
| `prompts_suggest` | Prompts suggérés par l'IA à poser sur les sources |

### 🔗 Partage

| Outil | Description |
|------|-------------|
| `notebook_share` | Activer/désactiver le lien public et/ou gérer les collaborateurs par e-mail |
| `notebook_share_status` | Consulter la configuration de partage actuelle |

### 🖇️ Sources

| Outil | Description |
|------|-------------|
| `notebook_add_url` | Ajouter un site web ou une vidéo YouTube comme source |
| `notebook_add_text` | Ajouter du texte collé comme source |
| `notebook_add_drive` | Ajouter un document Google Drive comme source |
| `notebook_add_local_file` | Téléverser un fichier local PDF / TXT / Markdown |
| `source_get_guide` | Guide IA d'une source : résumé + sujets clés |
| `source_rename` | Renommer une source |
| `source_check_freshness` | Vérifier si une source URL/Drive dispose d'un contenu plus récent |
| `source_sync` | Resynchroniser une source Drive avec le contenu le plus récent |
| `source_delete` | Supprimer une source (nécessite `confirm`) |

### 💬 Chat

| Outil | Description |
|------|-------------|
| `notebook_query` | Poser des questions sur les sources, avec citations |
| `chat_history_get` | Lire les échanges question/réponse de la dernière conversation |
| `chat_history_delete` | Effacer l'historique du chat (nécessite `confirm`) |
| `chat_configure` | Définir la persona du chat (par défaut / guide d'apprentissage / personnalisée) et la longueur des réponses |

### 🔍 Recherche

| Outil | Description |
|------|-------------|
| `research_start` | Lancer une recherche web ou Drive (rapide ≈30 s / approfondie ≈5 min) |
| `research_poll` | Suivre la progression de la recherche et les sources découvertes |
| `research_import` | Importer les sources découvertes dans le notebook |

### 🎨 Studio

| Outil | Description |
|------|-------------|
| `audio_overview_create` | Audio Overview façon podcast (formats : deep dive, brief, critique, debate) |
| `video_overview_create` | Video Overview (9 styles visuels, du tableau blanc à l'anime) |
| `report_create` | Rapport écrit à partir des sources |
| `flashcards_create` | Flashcards (options de quantité et de difficulté) |
| `quiz_create` | Quiz interactif (options de quantité et de difficulté) |
| `infographic_create` | Infographie (paysage / portrait / carré) |
| `slide_deck_create` | Diaporama |
| `data_table_create` | Tableau de données structuré |
| `studio_poll` | Vérifier l'état de génération de tous les artefacts |
| `studio_delete` | Supprimer un artefact du studio |

### 📦 Artefacts

| Outil | Description |
|------|-------------|
| `artifact_content_get` | Récupérer le contenu généré (HTML des quiz/flashcards, JSON des cartes mentales) |
| `artifact_rename` | Renommer un artefact |
| `artifact_export` | Exporter un artefact vers Google Drive (Docs ou Sheets) |

### 📝 Notes et cartes mentales

| Outil | Description |
|------|-------------|
| `note_create` | Créer une note |
| `note_list` | Lister toutes les notes |
| `note_update` | Mettre à jour le contenu/titre d'une note |
| `note_delete` | Supprimer une note (nécessite `confirm`) |
| `mind_map_generate` | Générer une carte mentale au format JSON à partir des sources |
| `mind_map_save` | Enregistrer une carte mentale dans le notebook |
| `mind_map_list` | Lister les cartes mentales enregistrées |
| `mind_map_delete` | Supprimer une carte mentale |

### ⚙️ Système

| Outil | Description |
|------|-------------|
| `refresh_auth` | Recharger les cookies de session depuis le disque après avoir relancé `auth` |

## 🧪 Recettes

De vrais prompts à coller dans n'importe quel agent connecté — il choisit les bons outils tout seul.

### 🎙️ De la question de recherche au podcast

> *« Fais des recherches sur les dernières avancées des batteries à électrolyte solide avec la recherche approfondie, construis un notebook nommé 'Solid State 2026' avec les meilleures sources et génère un résumé audio bref en anglais. Donne-moi le lien quand c'est prêt. »*

L'agent enchaîne `notebook_create` → `research_start(mode: deep)` → `research_poll` → `research_import` → `audio_overview_create(format: brief)` → `studio_poll`, puis renvoie l'URL du notebook avec le podcast terminé.

### 🎓 Kit de révision à partir de vos PDF

> *« Prends les trois PDF du dossier ./lectures, mets-les dans un nouveau notebook et prépare-moi un quiz difficile plus des flashcards sur les concepts clés. Affiche-moi les questions du quiz ici. »*

L'agent exécute `notebook_add_local_file` pour chaque PDF, puis `quiz_create(difficulty: hard)` + `flashcards_create`, surveille l'avancement avec `studio_poll` et extrait les questions avec `artifact_content_get`.

### 👥 Briefing d'équipe, partagé

> *« Construis un notebook de briefing à partir de ces cinq liens sur notre concurrent, rédige un rapport, exporte-le vers Google Docs et partage le notebook avec ana@example.com en tant que lecteur. »*

L'agent enchaîne `notebook_add_url` ×5 → `report_create` → `studio_poll` → `artifact_export(format: docs)` → `notebook_share(user_email, user_role: viewer)` — et votre collègue trouve le notebook et le Doc qui l'attendent.

## 🛠️ Dépannage

| Symptôme | Solution |
|---------|-----|
| `Authentication expired` juste après la connexion | Mettez à jour vers ≥ 3.0.8 — les versions antérieures ne capturaient pas le jeton rotatif `__Secure-1PSIDTS` de Google. Le serveur le capture et le rafraîchit désormais automatiquement. |
| `Authentication failed` après des semaines d'utilisation | Les sessions Google finissent par expirer. Lancez `npx notebooklm-mcp-server auth`, puis appelez l'outil `refresh_auth`. |
| Génération studio bloquée sur `pending` | Les sources longues prennent du temps — continuez d'interroger `studio_poll` ; l'audio et la vidéo peuvent prendre plusieurs minutes. |
| Erreurs RPC après une mise à jour de Google | Google fait parfois tourner ses étiquettes de build internes. Mettez à jour le paquet ; si le problème persiste, ouvrez une issue. |

## 🧑‍💻 Développement

```bash
git clone https://github.com/moodRobotics/notebooklm-mcp-server.git
cd notebooklm-mcp-server
npm install
npm run build
npm run typecheck
```

Les notes d'architecture se trouvent dans [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), la feuille de route dans [docs/ROADMAP.md](./docs/ROADMAP.md).

## 🌐 Localisation

Ce README est disponible en [English](./README.md), [Español](./README.es.md), [Français](./README.fr.md), [Português](./README.pt.md) et [Deutsch](./README.de.md). Si vous en modifiez un, merci de garder les autres synchronisés (`npm run docs:check`).

## 📄 Licence

MIT — Développé avec ❤️ par [moodRobotics](https://github.com/moodRobotics).

> [!IMPORTANT]
> Ceci est un projet communautaire non officiel. Il n'est ni affilié à Google ni approuvé par Google. Il repose sur des API internes obtenues par rétro-ingénierie qui peuvent changer sans préavis ; utilisez-le avec un compte Google que vous acceptez d'automatiser.
