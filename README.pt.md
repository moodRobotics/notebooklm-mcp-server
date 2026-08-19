<div align="center">
  <img src="./notebooklm_mcp_logo.png" width="200" alt="NotebookLM MCP Server logo">

  <h1>NotebookLM MCP Server</h1>

  <p><b>Dê aos seus agentes de IA controle total do Google Gemini Notebook (antigo NotebookLM): respostas fundamentadas, pesquisa profunda, podcasts, quizzes e muito mais — 47 ferramentas, zero alucinações.</b></p>

  <p>
    <a href="./README.md">English</a> •
    <a href="./README.es.md">Español</a> •
    <a href="./README.fr.md">Français</a> •
    <b>Português</b> •
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
    <a href="#-instalação">Instalação</a> •
    <a href="#-autenticação">Autenticação</a> •
    <a href="#-conecte-o-seu-cliente-de-ia">Conecte o seu cliente de IA</a> •
    <a href="#-referência-de-ferramentas">Referência de ferramentas</a> •
    <a href="#-receitas">Receitas</a> •
    <a href="#-desenvolvimento">Desenvolvimento</a>
  </p>
</div>

---

## 💡 O que é isto?

O **Gemini Notebook** do Google (renomeado de NotebookLM em julho de 2026) é o melhor motor de respostas fundamentadas do mercado: ele responde apenas a partir das fontes que você fornece, com citações. Este servidor MCP entrega esse poder aos seus agentes de IA — Claude, Gemini, Antigravity, Cursor e qualquer outro cliente MCP — para que eles possam montar notebooks, executar Deep Research, gerar podcasts, vídeos, quizzes, flashcards, relatórios e mapas mentais, tomar notas e compartilhar os resultados com a sua equipe. **Tudo de forma programática, com zero alucinações.**

> [!NOTE]
> **O NotebookLM agora é o Gemini Notebook.** O Google renomeou o produto em 16 de julho de 2026 (veja [notebook.google](https://notebook.google/)). Mesmo produto, mesmos notebooks, mesma superfície de API — este servidor continua funcionando sem alterações, e o pacote npm mantém o nome `notebooklm-mcp-server`.

## 🚀 Instalação

### Opção 1 — Instalação global (recomendada)

```bash
npm install -g notebooklm-mcp-server
```

> [!NOTE]
> O servidor verifica se há atualizações na inicialização e se mantém atualizado automaticamente.

### Opção 2 — Sem instalação, com NPX

```bash
npx -y notebooklm-mcp-server auth   # authenticate
npx -y notebooklm-mcp-server start  # run the server
```

## 🔑 Autenticação

1. Execute o login interativo (abre uma janela do Chromium):

```bash
npx notebooklm-mcp-server auth
```

2. Faça login com a sua conta Google. Quando a lista de notebooks aparecer, os cookies de sessão (incluindo o token rotativo `__Secure-1PSIDTS` do Google) são capturados e salvos em `~/.notebooklm-mcp/auth.json`.

3. Pronto — o servidor carrega a sessão automaticamente e renova o token rotativo por conta própria.

> [!TIP]
> Se a sessão expirar em algum momento, execute `npx notebooklm-mcp-server auth` novamente em um terminal e depois chame a ferramenta MCP `refresh_auth` (ou simplesmente reinicie o seu cliente) para carregar os novos cookies sem reconfigurar nada.

## ⚡ Conecte o seu cliente de IA

### 🤖 Claude Code

```bash
claude mcp add notebooklm -- npx -y notebooklm-mcp-server start
```

### 💬 Claude Desktop

Adicione ao `claude_desktop_config.json` (Settings → Developer → Edit Config):

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

A CLI do Antigravity gerencia servidores MCP por meio de um arquivo de configuração JSON:

- **Global:** `~/.gemini/config/mcp_config.json`
- **Por workspace:** `.agents/mcp_config.json` no seu projeto

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

Em seguida, digite `/mcp` no painel de prompt do Antigravity para abrir o **MCP Manager**: verifique o anel de status da conexão, recarregue a configuração ou inspecione os logs — sem precisar reiniciar. Seus agentes agora podem citar fontes reais em cada missão.

### 🖥️ Antigravity IDE

A IDE lê os mesmos arquivos de configuração da CLI (`~/.gemini/config/mcp_config.json` ou `.agents/mcp_config.json`). Como alternativa, abra o painel **MCP Store**, escolha *Add custom server* e cole o mesmo trecho de JSON. Recarregue a lista de servidores e as ferramentas do NotebookLM aparecerão na caixa de ferramentas do agente.

### 💎 Gemini CLI

```bash
gemini mcp add notebooklm --scope user -- npx -y notebooklm-mcp-server start
```

### ⌨️ Cursor

Adicione ao `.cursor/mcp.json` no seu projeto (ou ao `~/.cursor/mcp.json` para uso global):

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

Adicione o mesmo bloco `mcpServers` ao `~/.codeium/windsurf/mcp_config.json`.

### 🧩 VS Code (Cline)

No Cline: **MCP Servers → Configure** e adicione o mesmo bloco `mcpServers` mostrado acima.

## 📖 Referência de ferramentas

47 ferramentas, agrupadas pelo que fazem. As assinaturas completas de parâmetros estão em [docs/TOOLS.md](./docs/TOOLS.md).

### 📒 Notebooks

| Ferramenta | Descrição |
|------|-------------|
| `notebook_list` | Lista todos os notebooks com fontes e metadados |
| `notebook_create` | Cria um novo notebook |
| `notebook_get` | Obtém os detalhes e os IDs das fontes de um notebook |
| `notebook_rename` | Renomeia um notebook |
| `notebook_delete` | Exclui um notebook (requer `confirm`) |
| `notebook_summarize` | Guia de IA do notebook: resumo + perguntas sugeridas |
| `prompts_suggest` | Prompts sugeridos por IA para perguntar sobre as fontes |

### 🔗 Compartilhamento

| Ferramenta | Descrição |
|------|-------------|
| `notebook_share` | Ativa/desativa o link público e/ou gerencia colaboradores por e-mail |
| `notebook_share_status` | Lê a configuração de compartilhamento atual |

### 🖇️ Fontes

| Ferramenta | Descrição |
|------|-------------|
| `notebook_add_url` | Adiciona um site ou vídeo do YouTube como fonte |
| `notebook_add_text` | Adiciona texto colado como fonte |
| `notebook_add_drive` | Adiciona um documento do Google Drive como fonte |
| `notebook_add_local_file` | Faz upload de um arquivo local PDF / TXT / Markdown |
| `source_get_guide` | Guia de IA para uma fonte: resumo + tópicos principais |
| `source_rename` | Renomeia uma fonte |
| `source_check_freshness` | Verifica se uma fonte de URL/Drive tem conteúdo mais recente |
| `source_sync` | Ressincroniza uma fonte do Drive com o conteúdo mais recente |
| `source_delete` | Exclui uma fonte (requer `confirm`) |

### 💬 Chat

| Ferramenta | Descrição |
|------|-------------|
| `notebook_query` | Faz perguntas sobre as fontes, com citações |
| `chat_history_get` | Lê as perguntas e respostas da conversa mais recente |
| `chat_history_delete` | Limpa o histórico do chat (requer `confirm`) |
| `chat_configure` | Define a persona do chat (padrão / guia de aprendizado / personalizada) e o tamanho das respostas |

### 🔍 Pesquisa

| Ferramenta | Descrição |
|------|-------------|
| `research_start` | Inicia uma pesquisa na web ou no Drive (rápida ≈30s / profunda ≈5min) |
| `research_poll` | Verifica o progresso da pesquisa e as fontes descobertas |
| `research_import` | Importa as fontes descobertas para o notebook |

### 🎨 Studio

| Ferramenta | Descrição |
|------|-------------|
| `audio_overview_create` | Audio Overview em estilo podcast (formatos: deep dive, brief, critique, debate) |
| `video_overview_create` | Video Overview (9 estilos visuais, do quadro branco ao anime) |
| `report_create` | Relatório escrito a partir das fontes |
| `flashcards_create` | Flashcards (opções de quantidade e dificuldade) |
| `quiz_create` | Quiz interativo (opções de quantidade e dificuldade) |
| `infographic_create` | Infográfico (paisagem / retrato / quadrado) |
| `slide_deck_create` | Apresentação de slides |
| `data_table_create` | Tabela de dados estruturada |
| `studio_poll` | Verifica o status de geração de todos os artefatos |
| `studio_delete` | Exclui um artefato do Studio |

### 📦 Artefatos

| Ferramenta | Descrição |
|------|-------------|
| `artifact_content_get` | Busca o conteúdo gerado (HTML de quiz/flashcards, JSON de mapa mental) |
| `artifact_rename` | Renomeia um artefato |
| `artifact_export` | Exporta um artefato para o Google Drive (Docs ou Sheets) |

### 📝 Notas e mapas mentais

| Ferramenta | Descrição |
|------|-------------|
| `note_create` | Cria uma nota |
| `note_list` | Lista todas as notas |
| `note_update` | Atualiza o conteúdo/título de uma nota |
| `note_delete` | Exclui uma nota (requer `confirm`) |
| `mind_map_generate` | Gera um JSON de mapa mental a partir das fontes |
| `mind_map_save` | Salva um mapa mental no notebook |
| `mind_map_list` | Lista os mapas mentais salvos |
| `mind_map_delete` | Exclui um mapa mental |

### ⚙️ Sistema

| Ferramenta | Descrição |
|------|-------------|
| `refresh_auth` | Recarrega os cookies de sessão do disco após executar `auth` novamente |

## 🧪 Receitas

Prompts reais que você pode colar em qualquer agente conectado — ele escolhe as ferramentas certas sozinho.

### 🎙️ Da pergunta de pesquisa ao podcast

> *"Pesquise as últimas novidades sobre baterias de estado sólido com deep research, monte um notebook chamado 'Solid State 2026' com as melhores fontes e gere um audio overview breve em inglês. Envie-me o link quando estiver pronto."*

O agente encadeia `notebook_create` → `research_start(mode: deep)` → `research_poll` → `research_import` → `audio_overview_create(format: brief)` → `studio_poll` e retorna a URL do notebook com o podcast pronto.

### 🎓 Kit de estudo a partir dos seus PDFs

> *"Pegue os três PDFs em ./lectures, coloque-os em um novo notebook e crie para mim um quiz difícil e flashcards sobre os conceitos-chave. Mostre-me aqui as perguntas do quiz."*

O agente executa `notebook_add_local_file` para cada PDF, depois `quiz_create(difficulty: hard)` + `flashcards_create`, acompanha com `studio_poll` e extrai as perguntas com `artifact_content_get`.

### 👥 Briefing de equipe, compartilhado

> *"Monte um notebook de briefing a partir destes cinco links sobre o nosso concorrente, escreva um relatório, exporte-o para o Google Docs e compartilhe o notebook com ana@example.com como visualizadora."*

O agente encadeia `notebook_add_url` ×5 → `report_create` → `studio_poll` → `artifact_export(format: docs)` → `notebook_share(user_email, user_role: viewer)` — e o seu colega de equipe encontra o notebook e o Doc já à sua espera.

## 🛠️ Solução de problemas

| Sintoma | Solução |
|---------|-----|
| `Authentication expired` logo após o login | Atualize para ≥ 3.0.8 — versões anteriores não capturavam o token rotativo `__Secure-1PSIDTS` do Google. O servidor agora o captura e o renova automaticamente. |
| `Authentication failed` após semanas de uso | As sessões do Google acabam expirando. Execute `npx notebooklm-mcp-server auth` e depois chame a ferramenta `refresh_auth`. |
| Geração do Studio parada em `pending` | Fontes longas demoram um pouco — continue consultando `studio_poll`; áudio/vídeo podem levar vários minutos. |
| Erros de RPC após uma atualização do Google | O Google ocasionalmente troca rótulos internos de build. Atualize o pacote; se o problema persistir, abra uma issue. |

## 🧑‍💻 Desenvolvimento

```bash
git clone https://github.com/moodRobotics/notebooklm-mcp-server.git
cd notebooklm-mcp-server
npm install
npm run build
npm run typecheck
```

As notas de arquitetura estão em [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) e o roadmap em [docs/ROADMAP.md](./docs/ROADMAP.md).

## 🌐 Localização

Este README está disponível em [English](./README.md), [Español](./README.es.md), [Français](./README.fr.md), [Português](./README.pt.md) e [Deutsch](./README.de.md). Se você editar um deles, mantenha os outros sincronizados (`npm run docs:check`).

## 📄 Licença

MIT — Desenvolvido com ❤️ pela [moodRobotics](https://github.com/moodRobotics).

> [!IMPORTANT]
> Este é um projeto comunitário não oficial. Não é afiliado ao Google nem endossado por ele. Ele depende de APIs internas obtidas por engenharia reversa, que podem mudar sem aviso prévio; use-o com uma conta Google que você se sinta confortável em automatizar.
