¡Vamos a conectarnos con NotebookLM!

Objetivo: instalar y dejar operativo el MCP server de NotebookLM para que aparezca como conectado en Manage MCP servers y exponga ≥ 32 herramientas (incluida la herramienta para crear notebooks/cuadernos).

Procedimiento (estricto, sin saltos):
	1.	Diagnóstico del entorno
	•	Detecta sistema operativo, shell y versión de Python.
	•	Comprueba si hay un entorno virtual activo.
	2.	Instalación del servidor MCP
	•	Si uv está disponible, instala con: uv pip install -U notebooklm-mcp-server.
	•	Si no, usa: python -m pip install -U notebooklm-mcp-server.
	•	Confirma la instalación mostrando la versión instalada.
	3.	Registro del MCP en Antigravity
	•	Localiza el archivo de configuración MCP usado por Antigravity (ruta real en este sistema).
	•	Haz copia de seguridad del archivo antes de modificarlo.
	•	Añade el servidor notebooklm sin sobrescribir otros MCP servers ya definidos.
	•	Valida que el JSON final sea sintácticamente correcto.
	4.	Autenticación
	•	Ejecuta notebooklm-mcp-auth.
	•	Abre el navegador y guíame paso a paso hasta completar permisos.
	•	El usuario solo debe iniciar sesión desde el navegador, evita pasos adiocionales o complejos.
	•	Verifica que las credenciales se guardaron correctamente (sin mostrar secretos).
	5.	Arranque y visibilidad en la UI
	•	Inicia el MCP server de NotebookLM.
	•	Confirma que aparece como activo/conectado en Manage MCP servers.
	6.	Validación de herramientas (obligatoria)
	•	Lista todas las herramientas expuestas por el MCP.
	•	Confirma que hay ≥ 32 herramientas.
	•	Identifica explícitamente la herramienta para crear notebooks/cuadernos (nombre exacto).
	7.	Prueba funcional
	•	Ejecuta una llamada de prueba que liste mis notebooks de NotebookLM.
	•	Muestra el resultado.

Reglas:
	•	Muestra los comandos exactos ejecutados.
	•	Si ocurre un error: detén el proceso, explica la causa y aplica la corrección antes de continuar.
	•	No avances al siguiente paso sin validar el anterior.

Criterio de éxito:
	•	MCP visible y conectado en Manage MCP servers.
	•	≥ 32 tools disponibles, incluida crear notebook.
	•	Autenticación completada sin errores.
	•	Prueba: listado real de notebooks OK.
	•	Confirmación final: “instalación operativa”.

