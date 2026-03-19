<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Un prompt. AgentCrow lo descompone y despacha agentes especializados en paralelo. 9 builtin + agentes externos.<br>
  <code>npx agentcrow init</code> → <code>claude</code> → despacho automatico.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-9_builtin-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-60_passing-brightgreen?style=flat-square" alt="Tests" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a> •
  Español •
  <a href="README.pt.md">Português</a> •
  <a href="README.de.md">Deutsch</a> •
  <a href="README.fr.md">Français</a> •
  <a href="README.ru.md">Русский</a> •
  <a href="README.hi.md">हिन्दी</a> •
  <a href="README.tr.md">Türkçe</a> •
  <a href="README.vi.md">Tiếng Việt</a>
</p>

---

```
  Tu:    "Crear una tienda online con carrito, pagos y panel admin"

  AgentCrow descompone → 5 agentes:

    🖥️  frontend_developer  → Catalogo de productos, carrito, checkout responsive
    🏗️  backend_architect   → API REST, pasarela de pagos, base de datos
    🎨  ui_designer         → Diseno de tienda, flujo de compra, panel admin
    🧪  qa_engineer         → Tests E2E del flujo de compra, edge cases de pago
    📝  technical_writer    → Documentacion de API, guia de despliegue

  Tu no elegiste los agentes. AgentCrow lo hizo.
```

<h3 align="center">⬇️ Una linea. Eso es todo.</h3>

```bash
npx agentcrow init
```

<p align="center">
  Despues ejecuta <code>claude</code> como siempre. AgentCrow se encarga del resto.<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ Sin AgentCrow**
```
Tu: Crea un dashboard con API,
    tests y documentacion

Claude: (un solo agente lo hace todo)
        - lee todos los archivos
        - escribe todo el codigo
        - ejecuta todos los tests
        - escribe toda la doc
        = una ventana de contexto
        = olvida el trabajo previo
        = 10+ minutos
```

</td>
<td width="50%">

**✅ Con AgentCrow**
```
Tu: mismo prompt

AgentCrow despacha automaticamente:
  @ui_designer     → layout
  @frontend_dev    → codigo React
  @backend_arch    → API
  @qa_engineer     → tests
  @tech_writer     → documentacion

  = agentes en paralelo
  = cada uno enfocado
  = mejores resultados
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ Instalacion

```bash
npx agentcrow init
```

Eso es todo. Hace dos cosas:

**Primera ejecucion** — descarga agentes en `~/.agentcrow/` (global, compartido entre todos los proyectos)

**Cada ejecucion** — fusiona la seccion de AgentCrow en `.claude/CLAUDE.md` (tus reglas existentes se mantienen intactas)

> [!NOTE]
> Los agentes se almacenan globalmente en `~/.agentcrow/`. Del segundo proyecto en adelante = instantaneo, sin descarga.

> [!TIP]
> Ya tienes un CLAUDE.md? AgentCrow **agrega** su seccion — tus reglas existentes no se tocan.

<a id="how-it-works"></a>
## ⚙️ Como funciona

```
  ┌─────────────────────────────────────┐
  │  Your prompt                        │
  │           ↓                         │
  │  ┌────────────────────────────┐     │
  │  │ CLAUDE.md reads agent list │     │
  │  │ Claude decomposes prompt   │     │
  │  │ Dispatches Agent tool      │     │
  │  │ Each agent works in scope  │     │
  │  └────────────────────────────┘     │
  │           ↓                         │
  │  Files created, tests written,      │
  │  docs generated — by specialists    │
  └─────────────────────────────────────┘
```

1. **Ejecutas `claude`** en un proyecto con AgentCrow inicializado
2. **Escribes un prompt** — cualquier tarea compleja
3. **Claude lee CLAUDE.md** — identifica el roster de agentes y las reglas de despacho
4. **Claude descompone** — divide tu prompt en tareas enfocadas
5. **Claude despacha** — usa la herramienta Agent para crear subagentes
6. **Cada agente trabaja** — con su propia especialidad

Sin API key. Sin servidor. Solo Claude Code + CLAUDE.md.

<a id="agents"></a>
## 🤖 9 Agentes Builtin + Agentes Externos

| Division | Ejemplos |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | test_automation, performance_tester |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | qa_engineer, korean_tech_writer, security_auditor |
| + more | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 Comandos

```bash
npx agentcrow init              # Configurar agentes + CLAUDE.md (ingles por defecto)
npx agentcrow init --lang ko    # Plantilla en coreano
npx agentcrow init --max 5      # Maximo de agentes simultaneos
npx agentcrow status            # Verificar si esta activo
npx agentcrow off               # Desactivar temporalmente
npx agentcrow on                # Reactivar
npx agentcrow agents            # Listar todos los agentes
npx agentcrow agents search ai  # Buscar por palabra clave
npx agentcrow compose "prompt"  # Vista previa de descomposicion (dry run)
```

## 💡 Ejemplos de Prompts

```
Crear una tienda online con carrito, pagos y panel admin
→ frontend_developer + backend_architect + ui_designer + qa_engineer

Build a real-time chat app with WebSocket and deploy to Docker
→ frontend_developer + backend_architect + devops_automator + qa_engineer

Sistema de gestion de inventario con reportes y alertas
→ backend_architect + frontend_developer + qa_engineer + technical_writer
```

Los prompts simples se ejecutan normalmente. AgentCrow solo interviene en solicitudes multi-tarea.

## 🛡️ Cero Overhead

| | |
|:---|:---|
| 🟢 Prompts complejos | Descompuestos automaticamente en agentes |
| 🔵 Prompts simples | Se ejecutan normalmente, sin agentes |
| 🔴 `agentcrow off` | Completamente desactivado |

> [!IMPORTANT]
> AgentCrow solo toca `.claude/CLAUDE.md` y `.claude/agents/`. Sin dependencias de proyecto, sin procesos en segundo plano. `agentcrow off` respalda y elimina ambos limpiamente.

## 🤝 Contribuir

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 60 tests
```

## 📜 Licencia

MIT — Agentes externos de [agency-agents](https://github.com/msitarzewski/agency-agents).

---

<p align="center">
  <b>🐦 Un prompt. Muchos agentes. Cero configuracion.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
