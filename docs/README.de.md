<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Claude erzeugt leere Subagenten. AgentCrow macht sie zu Spezialisten.<br>
  154 Experten-Personas. Hook-erzwungen. Keine Konfiguration.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-154-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-190_passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/hook-PreToolUse-blue?style=flat-square" alt="Hook" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#install">Installieren</a> •
  <a href="#how-it-works">Funktionsweise</a> •
  <a href="#agents">Agenten</a> •
  <a href="#commands">Befehle</a> •
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a>
</p>

---

## Das Problem

Wenn Claude Code einen Subagenten erzeugt, ist dieser ein **leerer Generalist**. Keine Expertise, keine Regeln, keine Persönlichkeit.

```
Du: "Baue Auth + Tests + Docs"

Ohne AgentCrow:
  Agent 1: (leer) → schreibt Auth       ← keine Coding-Standards
  Agent 2: (leer) → schreibt Tests      ← keine Coverage-Regeln
  Agent 3: (leer) → schreibt Docs       ← kein Styleguide

Mit AgentCrow:
  Agent 1: → 🏗️ Backend-Architekt injiziert
            "Paranoid bei Datenintegrität. Deployed nie ohne Migrationen."
  Agent 2: → 🧪 QA-Engineer injiziert
            "Behandelt 'funktioniert wahrscheinlich' als persönliche Beleidigung."
  Agent 3: → 📝 Technical Writer injiziert
            "Jeder Satz verdient seinen Platz."
```

Ein **PreToolUse Hook** fängt jeden Agent-Tool-Aufruf ab und injiziert die richtige Experten-Persona — automatisch, bevor der Subagent startet. Keine manuelle Auswahl. Kein Prompt-Engineering.

---

<a id="install"></a>
## ⚡ Installieren

```bash
npm i -g agentcrow
agentcrow init --global
```

Zwei Befehle. Ab jetzt erhält jeder Subagent eine Experten-Persona.

> [!TIP]
> Überprüfen: `agentcrow status` sollte beide Hooks (SessionStart + PreToolUse) als aktiv anzeigen.

---

<a id="how-it-works"></a>
## ⚙️ Funktionsweise

```
  Du: "Baue ein Auth-System mit JWT, füge Tests hinzu"
                    │
                    ▼
  Claude ruft das Agent-Tool auf:
    { name: "qa_engineer", prompt: "Write E2E tests" }
                    │
                    ▼
  ┌─────────────────────────────────────────┐
  │  PreToolUse Hook (automatisch)          │
  │                                         │
  │  agentcrow-inject.sh → agentcrow inject │
  │    1. Lädt catalog-index.json  (~5ms)   │
  │    2. Sucht "qa_engineer"      (exakt)  │
  │    3. Lädt QA-Engineer-Persona          │
  │    4. Stellt dem Prompt voran           │
  └─────────────────────────────────────────┘
                    │
                    ▼
  Subagent startet mit vollständiger Persona:
    <AGENTCROW_PERSONA>
    You are QA Engineer — test specialist
    ## MUST
    - Test every public function
    - Cover happy path, edge case, error path
    ## MUST NOT
    - Never test implementation details
    - Never use sleep for async waits
    </AGENTCROW_PERSONA>

    Write E2E tests    ← Original-Prompt bleibt erhalten
```

### Drei Matching-Strategien

| Priorität | Strategie | Beispiel |
|-----------|----------|---------|
| 1 | Exakter Name | `name: "qa_engineer"` → QA Engineer |
| 2 | Subagent-Typ | `subagent_type: "security_auditor"` → Security Auditor |
| 3 | Keyword + Synonym | `"kubernetes deploy"` → DevOps Automator |

Fuzzy-Matching verwendet eine **Synonym-Map** (50+ Einträge) und **Verlaufslernen** — häufig genutzte Agenten erhalten Priorität.

---

## 👀 Vorher / Nachher

<table>
<tr>
<td width="50%">

**❌ Ohne AgentCrow**
```
Claude erzeugt leeren Subagenten:
  prompt: "Write tests for auth"

  Ergebnis:
  - Generische Testdatei
  - Keine AAA-Struktur
  - Edge Cases übersprungen
  - Keine Coverage-Ziele
```

</td>
<td width="50%">

**✅ Mit AgentCrow**
```
QA-Engineer-Persona injiziert:
  MUST: jede öffentliche Funktion testen
  MUST NOT: keine Implementierungsdetails testen

  Ergebnis:
  - AAA-strukturierte Tests
  - Happy Path + Edge + Error abgedeckt
  - Coverage-Report enthalten
  - CI-Konfiguration generiert
```

</td>
</tr>
</table>

---

<a id="agents"></a>
## 🤖 154 Agenten

### 14 handgefertigte integrierte Agenten

Jeder integrierte Agent hat Persönlichkeit, MUST/MUST NOT Regeln, Deliverables und Erfolgsmetriken.

| Agent | Spezialgebiet | Kernregel |
|-------|-----------|----------|
| **Backend Architect** | API, Auth, Datenbank, Caching | "Deployed nie ohne Migrationen" |
| **Frontend Developer** | React/Next.js, Core Web Vitals | "Komposition über Vererbung, immer" |
| **QA Engineer** | Unit/Integration/E2E, Coverage | "Ungetesteter Code ist fehlerhafter Code" |
| **Security Auditor** | OWASP, CVSS, PoC für jeden Fund | "Sagt nie 'der Code ist sicher'" |
| **UI Designer** | Design-Systeme, Tokens, Spacing | "Was nicht im Token-System ist, existiert nicht" |
| **DevOps Automator** | CI/CD, Docker, K8s, Secrets | "Keine :latest Tags in Produktion" |
| **AI Engineer** | LLM, RAG, Prompt-Optimierung | "LLMs brauchen Guardrails" |
| **Refactoring Specialist** | Code Smells, Fowler-Katalog | "Nie refactorn ohne Tests" |
| **Complexity Critic** | Zyklomatische Komplexität, YAGNI | "Nie etwas komplex nennen ohne Beweis" |
| **Data Pipeline Engineer** | ETL, Idempotenz, Schemas | "Idempotenz ist nicht verhandelbar" |
| **Technical Writer** | API-Docs, Guides, READMEs | "Jeder Satz verdient seinen Platz" |
| **Translator** | i18n, Locale-Dateien, Übersetzung | "Nie Code-Bezeichner übersetzen" |
| **Compose Meta-Reviewer** | Agenten-Kompositionen auditieren | "Ausführung unter Score 70 blockieren" |
| **Unreal GAS Specialist** | GameplayAbilitySystem, UE5 | "Keine Schadensberechnung in GameplayAbilities" |

### 140 externe Agenten (13 Abteilungen)

| Abteilung | Anzahl | Beispiele |
|----------|------:|---------|
| Engineering | 24 | Data Engineer, Mobile Builder, Security Engineer |
| Marketing | 25 | SEO, TikTok, LinkedIn, Douyin Strategist |
| Game Dev | 20 | Godot, Unity, Unreal Spezialisten |
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
## 🔧 Befehle

```bash
# Installation & Setup
agentcrow init [--global] [--lang en|ko] [--max 5] [--mcp]

# Lebenszyklus
agentcrow on / off [--global]   # Aktivieren/Deaktivieren
agentcrow status                # Installation prüfen
agentcrow doctor                # 12-Punkte-Diagnose
agentcrow update                # Neueste Agenten abrufen
agentcrow uninstall             # Saubere Deinstallation

# Agenten-Verwaltung
agentcrow agents                # Alle 154 Agenten auflisten
agentcrow agents search <query> # Keyword-Suche
agentcrow add <path|url>        # Benutzerdefinierten Agenten hinzufügen (.md/.yaml)
agentcrow remove <role>         # Benutzerdefinierten Agenten entfernen

# Inspektion & Debug
agentcrow compose <prompt>      # Zerlegung vorschauen (Dry Run)
agentcrow stats                 # Dispatch-Verlauf & Analytics
agentcrow inject                # Hook-Handler (intern)

# MCP-Server
agentcrow serve                 # MCP-Server starten (stdio)
```

---

## 📊 Statistiken

```bash
$ agentcrow stats

  🐦 AgentCrow Stats

  Match Quality
    exact  106 (55%)   ← Name direkt übereinstimmend
    fuzzy   87 (45%)   ← Keyword + Synonym übereinstimmend
    none     0 (0%)    ← kein Match, Passthrough

  Top Agents
    qa_engineer            89 ████████████████████
    frontend_developer     23 █████
    backend_architect      15 ███
```

---

## 🛡️ Sicherheit & Performance

| | |
|:---|:---|
| Hook-Latenz | **< 50ms** pro Agent-Aufruf |
| Token-Overhead | **~350 Tokens** pro Persona |
| Fail-open | Fehlender Index oder Binary → Passthrough (kein Bruch) |
| Integrierte Typen | `Explore`, `Plan`, `general-purpose` → nie abgefangen |
| Einfache Prompts | Kein Agenten-Dispatch, null Overhead |
| `agentcrow off` | Vollständig deaktiviert, alles gesichert |

> [!IMPORTANT]
> AgentCrow blockiert Claude nie. Bei einem Fehler wird der Original-Prompt unverändert durchgelassen.

---

## 🏗️ Architektur

```
~/.agentcrow/
  ├── agents/
  │   ├── builtin/          14 YAML (handgefertigt)
  │   ├── external/         140 MD (agency-agents + Community)
  │   └── md/               154 vereinheitlichte .md Dateien
  ├── catalog-index.json    Vorgebaut für <5ms Lookup
  └── history.json          Dispatch-Aufzeichnungen (letzte 1000)

~/.claude/
  ├── settings.json         SessionStart + PreToolUse hooks
  ├── hooks/
  │   └── agentcrow-inject.sh
  └── agents/
      └── INDEX.md          Agenten-Katalog
```

---

## ➕ Benutzerdefinierte Agenten

```bash
agentcrow add ./my-agent.yaml           # Lokale Datei
agentcrow add https://example.com/a.md  # URL
agentcrow remove my_agent               # Entfernen (nur benutzerdefinierte)
```

Agenten-Format (`.md` oder `.yaml`):

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

## 🔌 MCP-Server (Optional)

```bash
agentcrow init --global --mcp
```

Fügt 3 Tools zu Claude Code hinzu: `agentcrow_match`, `agentcrow_search`, `agentcrow_list`.

---

## 🤝 Mitwirken

```bash
git clone https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 190 tests
```

## 📜 Lizenz

MIT

---

<p align="center">
  <b>🐦 Jeder Subagent verdient eine Persona.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
