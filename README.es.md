<div align="center">
  <img src="./notebooklm_mcp_logo.png" width="200" alt="NotebookLM MCP Server logo">

  <h1>NotebookLM MCP Server</h1>

  <p><b>Dale a tus agentes de IA control total de Google Gemini Notebook (antes NotebookLM): respuestas fundamentadas, investigación profunda, podcasts, cuestionarios y mucho más — 47 herramientas, cero alucinaciones.</b></p>

  <p>
    <a href="./README.md">English</a> •
    <b>Español</b> •
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
    <a href="#-instalación">Instalación</a> •
    <a href="#-autenticación">Autenticación</a> •
    <a href="#-conecta-tu-cliente-de-ia">Conecta tu cliente de IA</a> •
    <a href="#-referencia-de-herramientas">Referencia de herramientas</a> •
    <a href="#-recetas">Recetas</a> •
    <a href="#-desarrollo">Desarrollo</a>
  </p>
</div>

---

## 💡 ¿Qué es esto?

**Gemini Notebook** de Google (rebautizado desde NotebookLM en julio de 2026) es el mejor motor de respuestas fundamentadas del mercado: solo responde a partir de las fuentes que tú le proporcionas, con citas. Este servidor MCP pone ese poder en manos de tus agentes de IA — Claude, Gemini, Antigravity, Cursor y cualquier otro cliente MCP — para que puedan crear cuadernos, ejecutar Deep Research, generar podcasts, videos, cuestionarios, tarjetas de estudio, informes y mapas mentales, tomar notas y compartir los resultados con tu equipo. **Todo de forma programática, con cero alucinaciones.**

> [!NOTE]
> **NotebookLM ahora es Gemini Notebook.** Google renombró el producto el 16 de julio de 2026 (ver [notebook.google](https://notebook.google/)). El mismo producto, los mismos cuadernos, la misma superficie de API — este servidor sigue funcionando sin cambios, y el paquete de npm conserva su nombre `notebooklm-mcp-server`.

## 🚀 Instalación

### Opción 1 — Instalación global (recomendada)

```bash
npm install -g notebooklm-mcp-server
```

> [!NOTE]
> El servidor comprueba si hay actualizaciones al arrancar y se mantiene al día automáticamente.

### Opción 2 — Sin instalación con NPX

```bash
npx -y notebooklm-mcp-server auth   # authenticate
npx -y notebooklm-mcp-server start  # run the server
```

## 🔑 Autenticación

1. Ejecuta el inicio de sesión interactivo (abre una ventana de Chromium):

```bash
npx notebooklm-mcp-server auth
```

2. Inicia sesión con tu cuenta de Google. Cuando aparezca la lista de cuadernos, las cookies de sesión (incluido el token rotatorio `__Secure-1PSIDTS` de Google) se capturan y se guardan en `~/.notebooklm-mcp/auth.json`.

3. Listo — el servidor carga la sesión automáticamente y refresca el token rotatorio por sí solo.

> [!TIP]
> Si la sesión llega a expirar, vuelve a ejecutar `npx notebooklm-mcp-server auth` en una terminal y luego llama a la herramienta MCP `refresh_auth` (o simplemente reinicia tu cliente) para cargar las nuevas cookies sin reconfigurar nada.

## ⚡ Conecta tu cliente de IA

### 🤖 Claude Code

```bash
claude mcp add notebooklm -- npx -y notebooklm-mcp-server start
```

### 💬 Claude Desktop

Añade esto a `claude_desktop_config.json` (Settings → Developer → Edit Config):

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

La CLI de Antigravity gestiona los servidores MCP mediante un archivo de configuración JSON:

- **Global:** `~/.gemini/config/mcp_config.json`
- **Por espacio de trabajo:** `.agents/mcp_config.json` en tu proyecto

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

Luego escribe `/mcp` en el panel de prompts de Antigravity para abrir el **MCP Manager**: comprueba el anillo de estado de la conexión, recarga la configuración o inspecciona los registros — sin necesidad de reiniciar. Tus agentes ya pueden citar fuentes reales en cada misión.

### 🖥️ Antigravity IDE

El IDE lee los mismos archivos de configuración que la CLI (`~/.gemini/config/mcp_config.json` o `.agents/mcp_config.json`). Como alternativa, abre el panel **MCP Store**, elige *Add custom server* y pega el mismo fragmento JSON. Recarga la lista de servidores y las herramientas de NotebookLM aparecerán en la caja de herramientas del agente.

### 💎 Gemini CLI

```bash
gemini mcp add notebooklm --scope user -- npx -y notebooklm-mcp-server start
```

### ⌨️ Cursor

Añade esto a `.cursor/mcp.json` en tu proyecto (o a `~/.cursor/mcp.json` de forma global):

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

Añade el mismo bloque `mcpServers` a `~/.codeium/windsurf/mcp_config.json`.

### 🧩 VS Code (Cline)

En Cline: **MCP Servers → Configure** y añade el mismo bloque `mcpServers` mostrado arriba.

## 📖 Referencia de herramientas

47 herramientas, agrupadas según lo que hacen. Las firmas completas de parámetros están en [docs/TOOLS.md](./docs/TOOLS.md).

### 📒 Cuadernos

| Herramienta | Descripción |
|------|-------------|
| `notebook_list` | Lista todos los cuadernos con sus fuentes y metadatos |
| `notebook_create` | Crea un cuaderno nuevo |
| `notebook_get` | Obtiene los detalles de un cuaderno y los IDs de sus fuentes |
| `notebook_rename` | Renombra un cuaderno |
| `notebook_delete` | Elimina un cuaderno (requiere `confirm`) |
| `notebook_summarize` | Guía del cuaderno con IA: resumen + preguntas sugeridas |
| `prompts_suggest` | Prompts sugeridos por IA para preguntar sobre las fuentes |

### 🔗 Compartir

| Herramienta | Descripción |
|------|-------------|
| `notebook_share` | Activa o desactiva el enlace público y/o gestiona colaboradores por email |
| `notebook_share_status` | Consulta la configuración de compartición actual |

### 🖇️ Fuentes

| Herramienta | Descripción |
|------|-------------|
| `notebook_add_url` | Añade un sitio web o un video de YouTube como fuente |
| `notebook_add_text` | Añade texto pegado como fuente |
| `notebook_add_drive` | Añade un documento de Google Drive como fuente |
| `notebook_add_local_file` | Sube un archivo local PDF / TXT / Markdown |
| `source_get_guide` | Guía con IA de una fuente: resumen + temas clave |
| `source_rename` | Renombra una fuente |
| `source_check_freshness` | Comprueba si una fuente URL/Drive tiene contenido más reciente |
| `source_sync` | Vuelve a sincronizar una fuente de Drive con el contenido más reciente |
| `source_delete` | Elimina una fuente (requiere `confirm`) |

### 💬 Chat

| Herramienta | Descripción |
|------|-------------|
| `notebook_query` | Haz preguntas sobre las fuentes, con citas |
| `chat_history_get` | Lee los turnos de preguntas y respuestas de la conversación más reciente |
| `chat_history_delete` | Borra el historial del chat (requiere `confirm`) |
| `chat_configure` | Configura la personalidad del chat (predeterminada / guía de aprendizaje / personalizada) y la longitud de las respuestas |

### 🔍 Investigación

| Herramienta | Descripción |
|------|-------------|
| `research_start` | Lanza una investigación en la web o en Drive (rápida ≈30 s / profunda ≈5 min) |
| `research_poll` | Comprueba el progreso de la investigación y las fuentes descubiertas |
| `research_import` | Importa las fuentes descubiertas al cuaderno |

### 🎨 Studio

| Herramienta | Descripción |
|------|-------------|
| `audio_overview_create` | Resumen de audio estilo podcast (formatos: análisis en profundidad, breve, crítica, debate) |
| `video_overview_create` | Resumen en video (9 estilos visuales, desde pizarra hasta anime) |
| `report_create` | Informe escrito a partir de las fuentes |
| `flashcards_create` | Tarjetas de estudio (opciones de cantidad y dificultad) |
| `quiz_create` | Cuestionario interactivo (opciones de cantidad y dificultad) |
| `infographic_create` | Infografía (horizontal / vertical / cuadrada) |
| `slide_deck_create` | Presentación de diapositivas |
| `data_table_create` | Tabla de datos estructurada |
| `studio_poll` | Comprueba el estado de generación de todos los artefactos |
| `studio_delete` | Elimina un artefacto de Studio |

### 📦 Artefactos

| Herramienta | Descripción |
|------|-------------|
| `artifact_content_get` | Obtiene el contenido generado (HTML de cuestionarios/tarjetas, JSON de mapas mentales) |
| `artifact_rename` | Renombra un artefacto |
| `artifact_export` | Exporta un artefacto a Google Drive (Docs o Sheets) |

### 📝 Notas y mapas mentales

| Herramienta | Descripción |
|------|-------------|
| `note_create` | Crea una nota |
| `note_list` | Lista todas las notas |
| `note_update` | Actualiza el contenido/título de una nota |
| `note_delete` | Elimina una nota (requiere `confirm`) |
| `mind_map_generate` | Genera un mapa mental en JSON a partir de las fuentes |
| `mind_map_save` | Guarda un mapa mental en el cuaderno |
| `mind_map_list` | Lista los mapas mentales guardados |
| `mind_map_delete` | Elimina un mapa mental |

### ⚙️ Sistema

| Herramienta | Descripción |
|------|-------------|
| `refresh_auth` | Recarga las cookies de sesión desde el disco tras volver a ejecutar `auth` |

## 🧪 Recetas

Prompts reales que puedes pegar en cualquier agente conectado — él mismo elige las herramientas adecuadas.

### 🎙️ De la pregunta de investigación al podcast

> *"Investiga lo último sobre baterías de estado sólido con investigación profunda, crea un cuaderno llamado 'Solid State 2026' con las mejores fuentes y genera un resumen de audio breve en inglés. Dame el enlace cuando esté listo."*

El agente encadena `notebook_create` → `research_start(mode: deep)` → `research_poll` → `research_import` → `audio_overview_create(format: brief)` → `studio_poll`, y devuelve la URL del cuaderno con el podcast terminado.

### 🎓 Kit de estudio a partir de tus PDF

> *"Toma los tres PDF de ./lectures, ponlos en un cuaderno nuevo y prepárame un cuestionario difícil más tarjetas de estudio sobre los conceptos clave. Muéstrame aquí las preguntas del cuestionario."*

El agente ejecuta `notebook_add_local_file` por cada PDF, luego `quiz_create(difficulty: hard)` + `flashcards_create`, consulta el estado con `studio_poll` y extrae las preguntas con `artifact_content_get`.

### 👥 Briefing de equipo, compartido

> *"Crea un cuaderno de briefing a partir de estos cinco enlaces sobre nuestro competidor, redacta un informe, expórtalo a Google Docs y comparte el cuaderno con ana@example.com como lectora."*

El agente encadena `notebook_add_url` ×5 → `report_create` → `studio_poll` → `artifact_export(format: docs)` → `notebook_share(user_email, user_role: viewer)` — y tu compañera de equipo encontrará el cuaderno y el Doc esperándola.

## 🛠️ Solución de problemas

| Síntoma | Solución |
|---------|-----|
| `auth` avisa de que la API rechazó tus cookies justo tras iniciar sesión | Tu cuenta de Google aplica **Device Bound Session Credentials (DBSC)** — activado por defecto en Workspace y en la mayoría de cuentas personales. DBSC vincula la sesión a una clave del dispositivo, así que las cookies exportadas del navegador son rechazadas por la API. Los clientes basados en extracción de cookies no pueden saltárselo; usa una cuenta de Google sin DBSC. |
| `Authentication expired` justo después de iniciar sesión | Actualiza a ≥ 3.0.8 — las versiones anteriores no capturaban el token rotatorio `__Secure-1PSIDTS` de Google. El servidor ahora lo captura y lo refresca automáticamente. |
| `Authentication failed` tras semanas de uso | Las sesiones de Google acaban expirando. Ejecuta `npx notebooklm-mcp-server auth` y luego llama a la herramienta `refresh_auth`. |
| La generación en Studio se queda en `pending` | Las fuentes largas tardan lo suyo — sigue consultando `studio_poll`; el audio/video puede tardar varios minutos. |
| Errores RPC tras una actualización de Google | Google rota ocasionalmente sus etiquetas de compilación internas. Actualiza el paquete; si persiste, abre un issue. |

## 🧑‍💻 Desarrollo

```bash
git clone https://github.com/moodRobotics/notebooklm-mcp-server.git
cd notebooklm-mcp-server
npm install
npm run build
npm run typecheck
```

Las notas de arquitectura están en [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) y la hoja de ruta en [docs/ROADMAP.md](./docs/ROADMAP.md).

## 🌐 Localización

Este README está disponible en [English](./README.md), [Español](./README.es.md), [Français](./README.fr.md), [Português](./README.pt.md) y [Deutsch](./README.de.md). Si editas uno, por favor mantén los demás sincronizados (`npm run docs:check`).

## 📄 Licencia

MIT — Desarrollado con ❤️ por [moodRobotics](https://github.com/moodRobotics).

> [!IMPORTANT]
> Este es un proyecto comunitario no oficial. No está afiliado a Google ni cuenta con su respaldo. Se basa en APIs internas obtenidas mediante ingeniería inversa que pueden cambiar sin previo aviso; úsalo con una cuenta de Google que te sientas cómodo automatizando.
