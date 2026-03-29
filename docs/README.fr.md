<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Claude génère des sous-agents vides. AgentCrow en fait des spécialistes.<br>
  154 personas d'experts. Appliqué par Hook. Zéro configuration.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-154-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-190_passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/hook-PreToolUse-blue?style=flat-square" alt="Hook" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#install">Installer</a> •
  <a href="#how-it-works">Fonctionnement</a> •
  <a href="#agents">Agents</a> •
  <a href="#commands">Commandes</a> •
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a>
</p>

---

## Le problème

Quand Claude Code génère un sous-agent, c'est un **généraliste vide**. Pas d'expertise, pas de règles, pas de personnalité.

```
Vous : "Construis auth + tests + docs"

Sans AgentCrow :
  Agent 1 : (vide) → écrit l'auth       ← aucun standard de code
  Agent 2 : (vide) → écrit les tests    ← aucune règle de couverture
  Agent 3 : (vide) → écrit les docs     ← aucun guide de style

Avec AgentCrow :
  Agent 1 : → 🏗️ Architecte Backend injecté
             "Paranoïaque sur l'intégrité des données. Ne déploie jamais sans migrations."
  Agent 2 : → 🧪 Ingénieur QA injecté
             "Traite 'ça marche probablement' comme une insulte personnelle."
  Agent 3 : → 📝 Rédacteur Technique injecté
             "Chaque phrase mérite sa place."
```

Un **PreToolUse Hook** intercepte chaque appel au Agent tool et injecte le bon persona d'expert — automatiquement, avant que le sous-agent ne démarre. Pas de sélection manuelle. Pas de prompt engineering.

---

<a id="install"></a>
## ⚡ Installer

```bash
npm i -g agentcrow
agentcrow init --global
```

Deux commandes. Chaque sous-agent reçoit un persona d'expert désormais.

> [!TIP]
> Vérifier : `agentcrow status` devrait montrer les deux hooks (SessionStart + PreToolUse) actifs.

---

<a id="how-it-works"></a>
## ⚙️ Fonctionnement

```
  Vous : "Construis un système d'auth avec JWT, ajoute des tests"
                    │
                    ▼
  Claude appelle l'Agent tool :
    { name: "qa_engineer", prompt: "Write E2E tests" }
                    │
                    ▼
  ┌─────────────────────────────────────────┐
  │  PreToolUse Hook (automatique)          │
  │                                         │
  │  agentcrow-inject.sh → agentcrow inject │
  │    1. Charge catalog-index.json  (~5ms) │
  │    2. Cherche "qa_engineer"      (exact)│
  │    3. Charge le persona QA Engineer     │
  │    4. Préfixe au prompt                 │
  └─────────────────────────────────────────┘
                    │
                    ▼
  Le sous-agent démarre avec le persona complet :
    <AGENTCROW_PERSONA>
    You are QA Engineer — test specialist
    ## MUST
    - Test every public function
    - Cover happy path, edge case, error path
    ## MUST NOT
    - Never test implementation details
    - Never use sleep for async waits
    </AGENTCROW_PERSONA>

    Write E2E tests    ← prompt original préservé
```

### Trois stratégies de correspondance

| Priorité | Stratégie | Exemple |
|----------|----------|---------|
| 1 | Nom exact | `name: "qa_engineer"` → QA Engineer |
| 2 | Type de sous-agent | `subagent_type: "security_auditor"` → Security Auditor |
| 3 | Mot-clé + synonyme | `"kubernetes deploy"` → DevOps Automator |

La correspondance fuzzy utilise une **carte de synonymes** (50+ entrées) et l'**apprentissage de l'historique** — les agents fréquemment utilisés obtiennent la priorité.

---

## 👀 Avant / Après

<table>
<tr>
<td width="50%">

**❌ Sans AgentCrow**
```
Claude génère un sous-agent vide :
  prompt : "Write tests for auth"

  Résultat :
  - Fichier de test générique
  - Pas de structure AAA
  - Cas limites ignorés
  - Pas d'objectifs de couverture
```

</td>
<td width="50%">

**✅ Avec AgentCrow**
```
Persona d'Ingénieur QA injecté :
  MUST : tester chaque fonction publique
  MUST NOT : ne pas tester les détails d'implémentation

  Résultat :
  - Tests structurés AAA
  - Happy path + edge + erreur couverts
  - Rapport de couverture inclus
  - Configuration CI générée
```

</td>
</tr>
</table>

---

<a id="agents"></a>
## 🤖 154 Agents

### 14 agents intégrés faits main

Chaque agent intégré possède une personnalité, des règles MUST/MUST NOT, des livrables et des métriques de succès.

| Agent | Spécialité | Règle clé |
|-------|-----------|----------|
| **Backend Architect** | API, auth, base de données, cache | "Ne déploie jamais sans migrations" |
| **Frontend Developer** | React/Next.js, Core Web Vitals | "Composition plutôt qu'héritage, toujours" |
| **QA Engineer** | Unit/intégration/E2E, couverture | "Du code non testé est du code cassé" |
| **Security Auditor** | OWASP, CVSS, PoC pour chaque découverte | "Ne dit jamais 'le code est sécurisé'" |
| **UI Designer** | Systèmes de design, tokens, espacement | "S'il n'est pas dans le système de tokens, il n'existe pas" |
| **DevOps Automator** | CI/CD, Docker, K8s, secrets | "Pas de tags :latest en production" |
| **AI Engineer** | LLM, RAG, optimisation de prompts | "Les LLMs nécessitent des guardrails" |
| **Refactoring Specialist** | Code smells, catalogue Fowler | "Jamais de refactoring sans tests" |
| **Complexity Critic** | Complexité cyclomatique, YAGNI | "Ne jamais qualifier de complexe sans preuve" |
| **Data Pipeline Engineer** | ETL, idempotence, schémas | "L'idempotence n'est pas négociable" |
| **Technical Writer** | Docs d'API, guides, READMEs | "Chaque phrase mérite sa place" |
| **Translator** | i18n, fichiers locale, traduction | "Ne jamais traduire les identifiants de code" |
| **Compose Meta-Reviewer** | Auditer les compositions d'agents | "Bloquer l'exécution en dessous du score 70" |
| **Unreal GAS Specialist** | GameplayAbilitySystem, UE5 | "Pas de calcul de dégâts dans GameplayAbilities" |

### 140 agents externes (13 divisions)

| Division | Nombre | Exemples |
|----------|------:|---------|
| Engineering | 24 | Data Engineer, Mobile Builder, Security Engineer |
| Marketing | 25 | SEO, TikTok, LinkedIn, Douyin Strategist |
| Game Dev | 20 | Godot, Unity, Unreal spécialistes |
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
## 🔧 Commandes

```bash
# Installation & Configuration
agentcrow init [--global] [--lang en|ko] [--max 5] [--mcp]

# Cycle de vie
agentcrow on / off [--global]   # Activer/Désactiver
agentcrow status                # Vérifier l'installation
agentcrow doctor                # Diagnostic en 12 points
agentcrow update                # Récupérer les derniers agents
agentcrow uninstall             # Désinstallation propre

# Gestion des agents
agentcrow agents                # Lister les 154 agents
agentcrow agents search <query> # Recherche par mot-clé
agentcrow add <path|url>        # Ajouter un agent personnalisé (.md/.yaml)
agentcrow remove <role>         # Supprimer un agent personnalisé

# Inspection & Debug
agentcrow compose <prompt>      # Aperçu de la décomposition (dry run)
agentcrow stats                 # Historique de dispatch & analytics
agentcrow inject                # Handler du Hook (interne)

# Serveur MCP
agentcrow serve                 # Démarrer le serveur MCP (stdio)
```

---

## 📊 Statistiques

```bash
$ agentcrow stats

  🐦 AgentCrow Stats

  Match Quality
    exact  106 (55%)   ← nom correspondant directement
    fuzzy   87 (45%)   ← mot-clé + synonyme correspondant
    none     0 (0%)    ← pas de correspondance, passthrough

  Top Agents
    qa_engineer            89 ████████████████████
    frontend_developer     23 █████
    backend_architect      15 ███
```

---

## 🛡️ Sécurité & Performance

| | |
|:---|:---|
| Latence du Hook | **< 50ms** par appel Agent |
| Overhead de tokens | **~350 tokens** par persona |
| Fail-open | Index ou binaire manquant → passthrough (pas de rupture) |
| Types intégrés | `Explore`, `Plan`, `general-purpose` → jamais interceptés |
| Prompts simples | Pas de dispatch d'agents, zéro overhead |
| `agentcrow off` | Complètement désactivé, tout sauvegardé |

> [!IMPORTANT]
> AgentCrow ne bloque jamais Claude. Si quelque chose échoue, le prompt original passe inchangé.

---

## 🏗️ Architecture

```
~/.agentcrow/
  ├── agents/
  │   ├── builtin/          14 YAML (faits main)
  │   ├── external/         140 MD (agency-agents + communauté)
  │   └── md/               154 fichiers .md unifiés
  ├── catalog-index.json    Pré-construit pour lookup <5ms
  └── history.json          Enregistrements de dispatch (1000 derniers)

~/.claude/
  ├── settings.json         SessionStart + PreToolUse hooks
  ├── hooks/
  │   └── agentcrow-inject.sh
  └── agents/
      └── INDEX.md          Catalogue d'agents
```

---

## ➕ Agents personnalisés

```bash
agentcrow add ./my-agent.yaml           # Fichier local
agentcrow add https://example.com/a.md  # URL
agentcrow remove my_agent               # Supprimer (personnalisés uniquement)
```

Format d'agent (`.md` ou `.yaml`) :

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

## 🔌 Serveur MCP (Optionnel)

```bash
agentcrow init --global --mcp
```

Ajoute 3 outils à Claude Code : `agentcrow_match`, `agentcrow_search`, `agentcrow_list`.

---

## 🤝 Contribuer

```bash
git clone https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 190 tests
```

## 📜 Licence

MIT

---

<p align="center">
  <b>🐦 Chaque sous-agent mérite un persona.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
