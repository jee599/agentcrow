<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Claude gera subagentes vazios. AgentCrow os transforma em especialistas.<br>
  154 personas especialistas. Aplicado por Hook. Zero configuração.
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
  <a href="#how-it-works">Como funciona</a> •
  <a href="#agents">Agentes</a> •
  <a href="#commands">Comandos</a> •
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a>
</p>

---

## O problema

Quando o Claude Code gera um subagente, ele é um **generalista em branco**. Sem expertise, sem regras, sem personalidade.

```
Você: "Construa auth + tests + docs"

Sem AgentCrow:
  Agent 1: (vazio) → escreve auth       ← sem padrões de código
  Agent 2: (vazio) → escreve tests      ← sem regras de cobertura
  Agent 3: (vazio) → escreve docs       ← sem guia de estilo

Com AgentCrow:
  Agent 1: → 🏗️ Arquiteto Backend injetado
            "Paranoico com integridade de dados. Nunca faz deploy sem migrações."
  Agent 2: → 🧪 Engenheiro QA injetado
            "Trata 'provavelmente funciona' como insulto pessoal."
  Agent 3: → 📝 Escritor Técnico injetado
            "Cada frase conquista seu lugar."
```

Um **PreToolUse Hook** intercepta cada chamada ao Agent tool e injeta a persona especialista correta — automaticamente, antes do subagente iniciar. Sem seleção manual. Sem engenharia de prompts.

---

<a id="install"></a>
## ⚡ Instalar

```bash
npm i -g agentcrow
agentcrow init --global
```

Dois comandos. Cada subagente recebe uma persona especialista a partir de agora.

> [!TIP]
> Verificar: `agentcrow status` deve mostrar ambos os hooks (SessionStart + PreToolUse) ativos.

---

<a id="how-it-works"></a>
## ⚙️ Como funciona

```
  Você: "Construa um sistema de auth com JWT, adicione tests"
                    │
                    ▼
  Claude chama o Agent tool:
    { name: "qa_engineer", prompt: "Write E2E tests" }
                    │
                    ▼
  ┌─────────────────────────────────────────┐
  │  PreToolUse Hook (automático)           │
  │                                         │
  │  agentcrow-inject.sh → agentcrow inject │
  │    1. Carrega catalog-index.json (~5ms) │
  │    2. Busca "qa_engineer"      (exato)  │
  │    3. Carrega persona QA Engineer       │
  │    4. Prefixa no prompt                 │
  └─────────────────────────────────────────┘
                    │
                    ▼
  Subagente inicia com persona completa:
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

### Três estratégias de correspondência

| Prioridade | Estratégia | Exemplo |
|-----------|----------|---------|
| 1 | Nome exato | `name: "qa_engineer"` → QA Engineer |
| 2 | Tipo de subagente | `subagent_type: "security_auditor"` → Security Auditor |
| 3 | Keyword + sinônimo | `"kubernetes deploy"` → DevOps Automator |

A correspondência fuzzy usa um **mapa de sinônimos** (50+ entradas) e **aprendizado do histórico** — agentes que você usa com frequência ganham prioridade.

---

## 👀 Antes / Depois

<table>
<tr>
<td width="50%">

**❌ Sem AgentCrow**
```
Claude gera subagente vazio:
  prompt: "Write tests for auth"

  Resultado:
  - Arquivo de teste genérico
  - Sem estrutura AAA
  - Casos limite ignorados
  - Sem metas de cobertura
```

</td>
<td width="50%">

**✅ Com AgentCrow**
```
Persona de Engenheiro QA injetada:
  MUST: testar cada função pública
  MUST NOT: não testar detalhes de implementação

  Resultado:
  - Testes com estrutura AAA
  - Happy path + edge + error cobertos
  - Relatório de cobertura incluído
  - Configuração CI gerada
```

</td>
</tr>
</table>

---

<a id="agents"></a>
## 🤖 154 Agentes

### 14 Agentes integrados feitos à mão

Cada agente integrado tem personalidade, regras MUST/MUST NOT, entregáveis e métricas de sucesso.

| Agente | Especialidade | Regra chave |
|--------|-----------|----------|
| **Backend Architect** | API, auth, banco de dados, cache | "Nunca faz deploy sem migrações" |
| **Frontend Developer** | React/Next.js, Core Web Vitals | "Composição sobre herança, sempre" |
| **QA Engineer** | Unit/integração/E2E, cobertura | "Código não testado é código quebrado" |
| **Security Auditor** | OWASP, CVSS, PoC para cada achado | "Nunca diz 'o código é seguro'" |
| **UI Designer** | Sistemas de design, tokens, espaçamento | "Se não está no sistema de tokens, não existe" |
| **DevOps Automator** | CI/CD, Docker, K8s, secrets | "Sem tags :latest em produção" |
| **AI Engineer** | LLM, RAG, otimização de prompts | "LLMs precisam de guardrails" |
| **Refactoring Specialist** | Code smells, catálogo Fowler | "Nunca refatorar sem testes" |
| **Complexity Critic** | Complexidade ciclomática, YAGNI | "Nunca chamar algo de complexo sem prova" |
| **Data Pipeline Engineer** | ETL, idempotência, schemas | "Idempotência não é negociável" |
| **Technical Writer** | Docs de API, guias, READMEs | "Cada frase conquista seu lugar" |
| **Translator** | i18n, arquivos locale, tradução | "Nunca traduzir identificadores de código" |
| **Compose Meta-Reviewer** | Auditar composições de agentes | "Bloquear execução abaixo da pontuação 70" |
| **Unreal GAS Specialist** | GameplayAbilitySystem, UE5 | "Sem cálculo de dano em GameplayAbilities" |

### 140 Agentes externos (13 divisões)

| Divisão | Quantidade | Exemplos |
|----------|------:|---------|
| Engineering | 24 | Data Engineer, Mobile Builder, Security Engineer |
| Marketing | 25 | SEO, TikTok, LinkedIn, Douyin Strategist |
| Game Dev | 20 | Godot, Unity, Unreal especialistas |
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
# Instalação & Configuração
agentcrow init [--global] [--lang en|ko] [--max 5] [--mcp]

# Ciclo de vida
agentcrow on / off [--global]   # Habilitar/desabilitar
agentcrow status                # Verificar instalação
agentcrow doctor                # Diagnóstico de 12 pontos
agentcrow update                # Obter agentes mais recentes
agentcrow uninstall             # Remoção limpa

# Gestão de agentes
agentcrow agents                # Listar todos os 154 agentes
agentcrow agents search <query> # Busca por palavra-chave
agentcrow add <path|url>        # Adicionar agente personalizado (.md/.yaml)
agentcrow remove <role>         # Remover agente personalizado

# Inspeção & Debug
agentcrow compose <prompt>      # Preview da decomposição (dry run)
agentcrow stats                 # Histórico de despacho & analytics
agentcrow inject                # Handler do Hook (interno)

# Servidor MCP
agentcrow serve                 # Iniciar servidor MCP (stdio)
```

---

## 📊 Estatísticas

```bash
$ agentcrow stats

  🐦 AgentCrow Stats

  Match Quality
    exact  106 (55%)   ← nome correspondeu diretamente
    fuzzy   87 (45%)   ← keyword + sinônimo correspondeu
    none     0 (0%)    ← sem correspondência, passthrough

  Top Agents
    qa_engineer            89 ████████████████████
    frontend_developer     23 █████
    backend_architect      15 ███
```

---

## 🛡️ Segurança & Performance

| | |
|:---|:---|
| Latência do Hook | **< 50ms** por chamada Agent |
| Overhead de tokens | **~350 tokens** por persona |
| Fail-open | Índice ou binário ausente → passthrough (sem quebra) |
| Tipos integrados | `Explore`, `Plan`, `general-purpose` → nunca interceptados |
| Prompts simples | Sem despacho de agentes, zero overhead |
| `agentcrow off` | Completamente desabilitado, tudo com backup |

> [!IMPORTANT]
> AgentCrow nunca bloqueia o Claude. Se algo falhar, o prompt original passa sem alterações.

---

## 🏗️ Arquitetura

```
~/.agentcrow/
  ├── agents/
  │   ├── builtin/          14 YAML (feitos à mão)
  │   ├── external/         140 MD (agency-agents + comunidade)
  │   └── md/               154 arquivos .md unificados
  ├── catalog-index.json    Pré-construído para busca <5ms
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
agentcrow add ./my-agent.yaml           # Arquivo local
agentcrow add https://example.com/a.md  # URL
agentcrow remove my_agent               # Remover (apenas personalizados)
```

Formato de agente (`.md` ou `.yaml`):

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

Adiciona 3 ferramentas ao Claude Code: `agentcrow_match`, `agentcrow_search`, `agentcrow_list`.

---

## 🤝 Contribuindo

```bash
git clone https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 190 tests
```

## 📜 Licença

MIT

---

<p align="center">
  <b>🐦 Cada subagente merece uma persona.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
