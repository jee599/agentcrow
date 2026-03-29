<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Claude genera subagentes vacíos. AgentCrow los convierte en especialistas.<br>
  154 personas expertas. Aplicado por Hook. Cero configuración.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-154-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-190_passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/hook-PreToolUse-blue?style=flat-square" alt="Hook" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#install">Instalar</a> •
  <a href="#how-it-works">Cómo funciona</a> •
  <a href="#agents">Agentes</a> •
  <a href="#commands">Comandos</a> •
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a>
</p>

---

## El problema

Cuando Claude Code genera un subagente, es un **generalista en blanco**. Sin experiencia, sin reglas, sin personalidad.

```
Tú: "Construye auth + tests + docs"

Sin AgentCrow:
  Agent 1: (vacío) → escribe auth       ← sin estándares de código
  Agent 2: (vacío) → escribe tests      ← sin reglas de cobertura
  Agent 3: (vacío) → escribe docs       ← sin guía de estilo

Con AgentCrow:
  Agent 1: → 🏗️ Arquitecto Backend inyectado
            "Paranoico con la integridad de datos. Nunca despliega sin migraciones."
  Agent 2: → 🧪 Ingeniero QA inyectado
            "Trata 'probablemente funciona' como un insulto personal."
  Agent 3: → 📝 Escritor Técnico inyectado
            "Cada oración se gana su lugar."
```

Un **PreToolUse Hook** intercepta cada llamada al Agent tool e inyecta la persona experta correcta — automáticamente, antes de que el subagente arranque. Sin selección manual. Sin ingeniería de prompts.

---

<a id="install"></a>
## ⚡ Instalar

```bash
npm i -g agentcrow
agentcrow init --global
```

Dos comandos. Cada subagente recibe una persona experta a partir de ahora.

> [!TIP]
> Verificar: `agentcrow status` debería mostrar ambos hooks (SessionStart + PreToolUse) activos.

---

<a id="how-it-works"></a>
## ⚙️ Cómo funciona

```
  Tú: "Construye un sistema de auth con JWT, agrega tests"
                    │
                    ▼
  Claude llama al Agent tool:
    { name: "qa_engineer", prompt: "Write E2E tests" }
                    │
                    ▼
  ┌─────────────────────────────────────────┐
  │  PreToolUse Hook (automático)           │
  │                                         │
  │  agentcrow-inject.sh → agentcrow inject │
  │    1. Carga catalog-index.json  (~5ms)  │
  │    2. Busca "qa_engineer"      (exacto) │
  │    3. Carga persona QA Engineer         │
  │    4. Antepone al prompt                │
  └─────────────────────────────────────────┘
                    │
                    ▼
  Subagente arranca con persona completa:
    <AGENTCROW_PERSONA>
    You are QA Engineer — test specialist
    ## MUST
    - Test every public function
    - Cover happy path, edge case, error path
    ## MUST NOT
    - Never test implementation details
    - Never use sleep for async waits
    </AGENTCROW_PERSONA>

    Write E2E tests    ← prompt original preservado
```

### Tres estrategias de coincidencia

| Prioridad | Estrategia | Ejemplo |
|-----------|----------|---------|
| 1 | Nombre exacto | `name: "qa_engineer"` → QA Engineer |
| 2 | Tipo de subagente | `subagent_type: "security_auditor"` → Security Auditor |
| 3 | Keyword + sinónimo | `"kubernetes deploy"` → DevOps Automator |

La coincidencia fuzzy usa un **mapa de sinónimos** (50+ entradas) y **aprendizaje del historial** — los agentes que usas con frecuencia obtienen prioridad.

---

## 👀 Antes / Después

<table>
<tr>
<td width="50%">

**❌ Sin AgentCrow**
```
Claude genera subagente vacío:
  prompt: "Write tests for auth"

  Resultado:
  - Archivo de test genérico
  - Sin estructura AAA
  - Casos límite omitidos
  - Sin objetivos de cobertura
```

</td>
<td width="50%">

**✅ Con AgentCrow**
```
Persona de Ingeniero QA inyectada:
  MUST: testear cada función pública
  MUST NOT: no testear detalles de implementación

  Resultado:
  - Tests con estructura AAA
  - Happy path + edge + error cubiertos
  - Reporte de cobertura incluido
  - Configuración CI generada
```

</td>
</tr>
</table>

---

<a id="agents"></a>
## 🤖 154 Agentes

### 14 Agentes integrados hechos a mano

Cada agente integrado tiene personalidad, reglas MUST/MUST NOT, entregables y métricas de éxito.

| Agente | Especialidad | Regla clave |
|--------|-----------|----------|
| **Backend Architect** | API, auth, base de datos, caché | "Nunca despliega sin migraciones" |
| **Frontend Developer** | React/Next.js, Core Web Vitals | "Composición sobre herencia, siempre" |
| **QA Engineer** | Unit/integración/E2E, cobertura | "Código no testeado es código roto" |
| **Security Auditor** | OWASP, CVSS, PoC para cada hallazgo | "Nunca dice 'el código es seguro'" |
| **UI Designer** | Sistemas de diseño, tokens, espaciado | "Si no está en el sistema de tokens, no existe" |
| **DevOps Automator** | CI/CD, Docker, K8s, secretos | "Sin tags :latest en producción" |
| **AI Engineer** | LLM, RAG, optimización de prompts | "Los LLMs necesitan guardarraíles" |
| **Refactoring Specialist** | Code smells, catálogo Fowler | "Nunca refactorizar sin tests" |
| **Complexity Critic** | Complejidad ciclomática, YAGNI | "Nunca llamar algo complejo sin pruebas" |
| **Data Pipeline Engineer** | ETL, idempotencia, schemas | "La idempotencia no es negociable" |
| **Technical Writer** | Docs de API, guías, READMEs | "Cada oración se gana su lugar" |
| **Translator** | i18n, archivos locale, traducción | "Nunca traducir identificadores de código" |
| **Compose Meta-Reviewer** | Auditar composiciones de agentes | "Bloquear ejecución por debajo de puntuación 70" |
| **Unreal GAS Specialist** | GameplayAbilitySystem, UE5 | "Sin cálculo de daño en GameplayAbilities" |

### 140 Agentes externos (13 divisiones)

| División | Cantidad | Ejemplos |
|----------|------:|---------|
| Engineering | 24 | Data Engineer, Mobile Builder, Security Engineer |
| Marketing | 25 | SEO, TikTok, LinkedIn, Douyin Strategist |
| Game Dev | 20 | Godot, Unity, Unreal specialists |
| Design | 8 | Brand Guardian, UX Architect, Visual Storyteller |
| Testing | 8 | Accessibility, API, Performance |
| Sales | 7 | Account, Deal, Outbound Strategist |
| Support | 6 | Analytics, Finance, Customer Support |
| Project Mgmt | 6 | Project Shepherd, Jira Steward |
| Academic | 5 | Anthropologist, Historian, Psychologist |
| Spatial Computing | 4 | XR, Metal, WebXR |
| Specialized | 25 | MCP Builder, Workflow Architect, Data Extraction |
| Product | 1 | Behavioral Nudge Engine |
| Strategy | 1 | NEXUS Handoff Templates |

---

<a id="commands"></a>
## 🔧 Comandos

```bash
# Instalación & Configuración
agentcrow init [--global] [--lang en|ko] [--max 5] [--mcp]

# Ciclo de vida
agentcrow on / off [--global]   # Habilitar/deshabilitar
agentcrow status                # Verificar instalación
agentcrow doctor                # Diagnóstico de 12 puntos
agentcrow update                # Obtener últimos agentes
agentcrow uninstall             # Desinstalación limpia

# Gestión de agentes
agentcrow agents                # Listar los 154 agentes
agentcrow agents search <query> # Búsqueda por palabra clave
agentcrow add <path|url>        # Agregar agente personalizado (.md/.yaml)
agentcrow remove <role>         # Eliminar agente personalizado

# Inspección & Debug
agentcrow compose <prompt>      # Vista previa de descomposición (dry run)
agentcrow stats                 # Historial de despacho & analíticas
agentcrow inject                # Handler del Hook (interno)

# Servidor MCP
agentcrow serve                 # Iniciar servidor MCP (stdio)
```

---

## 📊 Estadísticas

```bash
$ agentcrow stats

  🐦 AgentCrow Stats

  Match Quality
    exact  106 (55%)   ← nombre coincidió directamente
    fuzzy   87 (45%)   ← keyword + sinónimo coincidió
    none     0 (0%)    ← sin coincidencia, passthrough

  Top Agents
    qa_engineer            89 ████████████████████
    frontend_developer     23 █████
    backend_architect      15 ███
```

---

## 🛡️ Seguridad & Rendimiento

| | |
|:---|:---|
| Latencia del Hook | **< 50ms** por llamada al Agent |
| Overhead de tokens | **~350 tokens** por persona |
| Fail-open | Índice o binario faltante → passthrough (sin ruptura) |
| Tipos integrados | `Explore`, `Plan`, `general-purpose` → nunca interceptados |
| Prompts simples | Sin despacho de agentes, cero overhead |
| `agentcrow off` | Completamente deshabilitado, todo respaldado |

> [!IMPORTANT]
> AgentCrow nunca bloquea a Claude. Si algo falla, el prompt original pasa sin cambios.

---

## 🏗️ Arquitectura

```
~/.agentcrow/
  ├── agents/
  │   ├── builtin/          14 YAML (hechos a mano)
  │   ├── external/         140 MD (agency-agents + comunidad)
  │   └── md/               154 archivos .md unificados
  ├── catalog-index.json    Pre-construido para búsqueda <5ms
  └── history.json          Registros de despacho (últimos 1000)

~/.claude/
  ├── settings.json         SessionStart + PreToolUse hooks
  ├── hooks/
  │   └── agentcrow-inject.sh
  └── agents/
      └── INDEX.md          Catálogo de agentes
```

---

## ➕ Agentes personalizados

```bash
agentcrow add ./my-agent.yaml           # Archivo local
agentcrow add https://example.com/a.md  # URL
agentcrow remove my_agent               # Eliminar (solo personalizados)
```

Formato de agente (`.md` o `.yaml`):

```markdown
# My Custom Agent

> One-line mission statement

**Role:** my_custom_agent

## Identity
How this agent thinks and works.

## MUST
- Rule 1
- Rule 2

## MUST NOT
- Anti-pattern 1
- Anti-pattern 2
```

---

## 🔌 Servidor MCP (Opcional)

```bash
agentcrow init --global --mcp
```

Agrega 3 herramientas a Claude Code: `agentcrow_match`, `agentcrow_search`, `agentcrow_list`.

---

## 🤝 Contribuir

```bash
git clone https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 190 tests
```

## 📜 Licencia

MIT

---

<p align="center">
  <b>🐦 Cada subagente merece una persona.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
