<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Un prompt. AgentCrow decompose et dispatche des agents specialises en parallele. 9 builtin + agents externes.<br>
  <code>npx agentcrow init</code> → <code>claude</code> → dispatch automatique.
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
  <a href="README.pt.md">Português</a> •
  <a href="README.de.md">Deutsch</a> •
  Français •
  <a href="README.ru.md">Русский</a> •
  <a href="README.hi.md">हिन्दी</a> •
  <a href="README.tr.md">Türkçe</a> •
  <a href="README.vi.md">Tiếng Việt</a>
</p>

---

```
  Vous:  "Construire un systeme de reservation avec paiement et notifications"

  AgentCrow decompose → 5 agents:

    🖥️  frontend_developer  → Interface de reservation, calendrier, paiement
    🏗️  backend_architect   → API REST, systeme de paiement, base de donnees
    🎨  ui_designer         → Parcours de reservation, design responsive
    🧪  qa_engineer         → Tests E2E du flux de reservation, edge cases
    📝  technical_writer    → Documentation API, guide d'integration

  Vous n'avez pas choisi les agents. AgentCrow l'a fait.
```

<h3 align="center">⬇️ Une ligne. C'est tout.</h3>

```bash
npx agentcrow init
```

<p align="center">
  Ensuite, lancez <code>claude</code> comme d'habitude. AgentCrow s'occupe du reste.<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ Sans AgentCrow**
```
Vous: Creez un dashboard avec API,
      tests et documentation

Claude: (un seul agent fait tout)
        - lit tous les fichiers
        - ecrit tout le code
        - lance tous les tests
        - ecrit toute la doc
        = une fenetre de contexte
        = oublie le travail precedent
        = 10+ minutes
```

</td>
<td width="50%">

**✅ Avec AgentCrow**
```
Vous: meme prompt

AgentCrow dispatche automatiquement:
  @ui_designer     → layout
  @frontend_dev    → code React
  @backend_arch    → API
  @qa_engineer     → tests
  @tech_writer     → documentation

  = agents en parallele
  = chacun concentre
  = meilleurs resultats
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ Installation

```bash
npx agentcrow init
```

C'est tout. Deux choses se passent :

**Premiere execution** — telecharge les agents dans `~/.agentcrow/` (global, partage entre tous les projets)

**Chaque execution** — fusionne la section AgentCrow dans `.claude/CLAUDE.md` (vos regles existantes sont preservees)

> [!NOTE]
> Les agents sont stockes globalement dans `~/.agentcrow/`. A partir du deuxieme projet = instantane, pas de telechargement.

> [!TIP]
> Vous avez deja un CLAUDE.md ? AgentCrow **ajoute** sa section — vos regles existantes restent intactes.

<a id="how-it-works"></a>
## ⚙️ Comment ca marche

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

1. **Vous lancez `claude`** dans un projet ou AgentCrow est initialise
2. **Vous tapez un prompt** — n'importe quelle tache complexe
3. **Claude lit CLAUDE.md** — identifie la liste d'agents et les regles de dispatch
4. **Claude decompose** — divise votre prompt en taches ciblees
5. **Claude dispatche** — utilise l'outil Agent pour creer des sous-agents
6. **Chaque agent travaille** — dans sa specialite

Pas de cle API. Pas de serveur. Juste Claude Code + CLAUDE.md.

<a id="agents"></a>
## 🤖 9 Agents Builtin + Agents Externes

| Division | Exemples |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | test_automation, performance_tester |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | qa_engineer, korean_tech_writer, security_auditor |
| + more | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 Commandes

```bash
npx agentcrow init              # Configurer agents + CLAUDE.md (anglais par defaut)
npx agentcrow init --lang ko    # Template coreen
npx agentcrow init --max 5      # Maximum d'agents simultanes
npx agentcrow status            # Verifier si actif
npx agentcrow off               # Desactiver temporairement
npx agentcrow on                # Reactiver
npx agentcrow agents            # Lister tous les agents
npx agentcrow agents search ai  # Rechercher par mot-cle
npx agentcrow compose "prompt"  # Apercu de la decomposition (dry run)
```

## 💡 Exemples de Prompts

```
Construire un systeme de reservation avec paiement et notifications
→ frontend_developer + backend_architect + ui_designer + qa_engineer

Build a real-time chat app with WebSocket and deploy to Docker
→ frontend_developer + backend_architect + devops_automator + qa_engineer

Plateforme de gestion de projet avec Kanban, suivi du temps et rapports
→ frontend_developer + backend_architect + ui_designer + qa_engineer
```

Les prompts simples s'executent normalement. AgentCrow n'intervient que pour les requetes multi-taches.

## 🛡️ Zero Overhead

| | |
|:---|:---|
| 🟢 Prompts complexes | Decomposes automatiquement en agents |
| 🔵 Prompts simples | Executon normale, pas d'agents |
| 🔴 `agentcrow off` | Completement desactive |

> [!IMPORTANT]
> AgentCrow ne touche que `.claude/CLAUDE.md` et `.claude/agents/`. Pas de dependances projet, pas de processus en arriere-plan. `agentcrow off` sauvegarde et supprime les deux proprement.

## 🤝 Contribuer

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 60 tests
```

## 📜 Licence

MIT — Agents externes provenant de [agency-agents](https://github.com/msitarzewski/agency-agents).

---

<p align="center">
  <b>🐦 Un prompt. Plusieurs agents. Zero configuration.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
