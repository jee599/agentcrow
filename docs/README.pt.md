<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Um prompt. AgentCrow decompoe e despacha agentes especializados em paralelo. 9 builtin + agentes externos.<br>
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
  <a href="README.es.md">Español</a> •
  Português •
  <a href="README.de.md">Deutsch</a> •
  <a href="README.fr.md">Français</a> •
  <a href="README.ru.md">Русский</a> •
  <a href="README.hi.md">हिन्दी</a> •
  <a href="README.tr.md">Türkçe</a> •
  <a href="README.vi.md">Tiếng Việt</a>
</p>

---

```
  Voce:  "Criar um sistema de agendamento com notificacoes e dashboard"

  AgentCrow decompoe → 5 agentes:

    🖥️  frontend_developer  → Dashboard de agendamentos, calendario, notificacoes
    🏗️  backend_architect   → API REST, sistema de notificacoes, banco de dados
    🎨  ui_designer         → Interface do calendario, fluxo de agendamento
    🧪  qa_engineer         → Testes E2E do fluxo de agendamento, edge cases
    📝  technical_writer    → Documentacao da API, guia de integracao

  Voce nao escolheu os agentes. AgentCrow escolheu.
```

<h3 align="center">⬇️ Uma linha. So isso.</h3>

```bash
npx agentcrow init
```

<p align="center">
  Depois execute <code>claude</code> normalmente. AgentCrow cuida do resto.<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ Sem AgentCrow**
```
Voce: Crie um dashboard com API,
      testes e documentacao

Claude: (um agente faz tudo)
        - le todos os arquivos
        - escreve todo o codigo
        - roda todos os testes
        - escreve toda a doc
        = uma janela de contexto
        = esquece o trabalho anterior
        = 10+ minutos
```

</td>
<td width="50%">

**✅ Com AgentCrow**
```
Voce: mesmo prompt

AgentCrow despacha automaticamente:
  @ui_designer     → layout
  @frontend_dev    → codigo React
  @backend_arch    → API
  @qa_engineer     → testes
  @tech_writer     → documentacao

  = agentes em paralelo
  = cada um focado
  = resultados melhores
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ Instalacao

```bash
npx agentcrow init
```

So isso. Faz duas coisas:

**Primeira execucao** — baixa agentes em `~/.agentcrow/` (global, compartilhado entre todos os projetos)

**Toda execucao** — faz merge da secao AgentCrow no `.claude/CLAUDE.md` (suas regras existentes sao preservadas)

> [!NOTE]
> Agentes ficam armazenados globalmente em `~/.agentcrow/`. Do segundo projeto em diante = instantaneo, sem download.

> [!TIP]
> Ja tem um CLAUDE.md? AgentCrow **adiciona** sua secao — suas regras existentes permanecem intactas.

<a id="how-it-works"></a>
## ⚙️ Como Funciona

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

1. **Voce executa `claude`** em um projeto com AgentCrow inicializado
2. **Digita um prompt** — qualquer tarefa complexa
3. **Claude le o CLAUDE.md** — identifica a lista de agentes e regras de despacho
4. **Claude decompoe** — divide seu prompt em tarefas focadas
5. **Claude despacha** — usa a ferramenta Agent para criar subagentes
6. **Cada agente trabalha** — com sua propria especialidade

Sem API key. Sem servidor. Apenas Claude Code + CLAUDE.md.

<a id="agents"></a>
## 🤖 9 Agentes Builtin + Agentes Externos

| Divisao | Exemplos |
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
npx agentcrow init              # Configurar agentes + CLAUDE.md (ingles por padrao)
npx agentcrow init --lang ko    # Template em coreano
npx agentcrow init --max 5      # Maximo de agentes simultaneos
npx agentcrow status            # Verificar se esta ativo
npx agentcrow off               # Desativar temporariamente
npx agentcrow on                # Reativar
npx agentcrow agents            # Listar todos os agentes
npx agentcrow agents search ai  # Buscar por palavra-chave
npx agentcrow compose "prompt"  # Pre-visualizar decomposicao (dry run)
```

## 💡 Exemplos de Prompts

```
Criar um sistema de agendamento com notificacoes e dashboard
→ frontend_developer + backend_architect + ui_designer + qa_engineer

App de delivery com rastreamento em tempo real, pagamentos e notificacoes
→ frontend_developer + backend_architect + devops_automator + qa_engineer

Plataforma de e-learning com video aulas, quizzes e certificados
→ frontend_developer + backend_architect + ai_engineer + qa_engineer
```

Prompts simples rodam normalmente. AgentCrow so intervem em requisicoes multi-tarefa.

## 🛡️ Zero Overhead

| | |
|:---|:---|
| 🟢 Prompts complexos | Decompostos automaticamente em agentes |
| 🔵 Prompts simples | Rodam normalmente, sem agentes |
| 🔴 `agentcrow off` | Completamente desativado |

> [!IMPORTANT]
> AgentCrow so toca em `.claude/CLAUDE.md` e `.claude/agents/`. Sem dependencias de projeto, sem processos em background. `agentcrow off` faz backup e remove ambos de forma limpa.

## 🤝 Contribuir

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 60 tests
```

## 📜 Licenca

MIT — Agentes externos de [agency-agents](https://github.com/msitarzewski/agency-agents).

---

<p align="center">
  <b>🐦 Um prompt. Varios agentes. Zero configuracao.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
