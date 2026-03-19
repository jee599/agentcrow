<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Ein Prompt. AgentCrow zerlegt ihn und verteilt spezialisierte Agenten parallel. 9 builtin + externe Agenten.<br>
  <code>npx agentcrow init</code> → <code>claude</code> → automatisches Dispatching.
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
  Deutsch •
  <a href="README.fr.md">Français</a> •
  <a href="README.ru.md">Русский</a> •
  <a href="README.hi.md">हिन्दी</a> •
  <a href="README.tr.md">Türkçe</a> •
  <a href="README.vi.md">Tiếng Việt</a>
</p>

---

```
  Du:    "Erstelle ein CRM mit Kundenverwaltung, Berichten und API"

  AgentCrow zerlegt → 5 Agenten:

    🖥️  frontend_developer  → CRM-Dashboard, Kundenlisten, Diagramme
    🏗️  backend_architect   → REST API, Datenbank-Schema, Authentifizierung
    🎨  ui_designer         → Responsive Layout, Formular-Design, Berichte
    🧪  qa_engineer         → E2E-Tests fuer Kundenflows, API-Tests
    📝  technical_writer    → API-Dokumentation, Benutzerhandbuch

  Du hast die Agenten nicht gewaehlt. AgentCrow hat es getan.
```

<h3 align="center">⬇️ Eine Zeile. Das war's.</h3>

```bash
npx agentcrow init
```

<p align="center">
  Danach einfach <code>claude</code> wie gewohnt ausfuehren. AgentCrow erledigt den Rest.<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ Ohne AgentCrow**
```
Du: Erstelle ein Dashboard mit API,
    Tests und Dokumentation

Claude: (ein Agent macht alles)
        - liest alle Dateien
        - schreibt allen Code
        - fuehrt alle Tests aus
        - schreibt alle Doku
        = ein Kontextfenster
        = vergisst fruehere Arbeit
        = 10+ Minuten
```

</td>
<td width="50%">

**✅ Mit AgentCrow**
```
Du: selber Prompt

AgentCrow dispatcht automatisch:
  @ui_designer     → Layout
  @frontend_dev    → React-Code
  @backend_arch    → API
  @qa_engineer     → Tests
  @tech_writer     → Dokumentation

  = parallele Agenten
  = jeder fokussiert
  = bessere Ergebnisse
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

Das war's. Zwei Dinge passieren:

**Beim ersten Mal** — Agenten werden nach `~/.agentcrow/` heruntergeladen (global, projektuebergreifend)

**Bei jedem Aufruf** — AgentCrow-Abschnitt wird in `.claude/CLAUDE.md` gemergt (bestehende Regeln bleiben erhalten)

> [!NOTE]
> Agenten werden global unter `~/.agentcrow/` gespeichert. Ab dem zweiten Projekt = sofort, kein Download.

> [!TIP]
> Du hast bereits eine CLAUDE.md? AgentCrow **haengt** seinen Abschnitt an — deine bestehenden Regeln bleiben unangetastet.

<a id="how-it-works"></a>
## ⚙️ So funktioniert es

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

1. **Du startest `claude`** in einem Projekt mit initialisiertem AgentCrow
2. **Du gibst einen Prompt ein** — eine beliebig komplexe Aufgabe
3. **Claude liest CLAUDE.md** — erkennt die Agentenliste und Dispatch-Regeln
4. **Claude zerlegt** — teilt deinen Prompt in fokussierte Teilaufgaben
5. **Claude dispatcht** — erstellt Subagenten ueber das Agent-Tool
6. **Jeder Agent arbeitet** — in seinem Fachgebiet

Kein API-Key. Kein Server. Nur Claude Code + CLAUDE.md.

<a id="agents"></a>
## 🤖 9 Builtin-Agenten + Externe Agenten

| Abteilung | Beispiele |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | test_automation, performance_tester |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | qa_engineer, korean_tech_writer, security_auditor |
| + more | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 Befehle

```bash
npx agentcrow init              # Agenten + CLAUDE.md einrichten (Englisch Standard)
npx agentcrow init --lang ko    # Koreanisches Template
npx agentcrow init --max 5      # Maximum gleichzeitiger Agenten
npx agentcrow status            # Pruefen ob aktiv
npx agentcrow off               # Voruebergehend deaktivieren
npx agentcrow on                # Wieder aktivieren
npx agentcrow agents            # Alle Agenten auflisten
npx agentcrow agents search ai  # Nach Stichwort suchen
npx agentcrow compose "prompt"  # Zerlegungsvorschau (Dry Run)
```

## 💡 Prompt-Beispiele

```
Erstelle ein CRM mit Kundenverwaltung, Berichten und API
→ frontend_developer + backend_architect + ui_designer + qa_engineer

Rezepte-App mit Bildupload, Suche und Bewertungssystem erstellen
→ frontend_developer + backend_architect + devops_automator + qa_engineer

Projektmanagement-Tool mit Kanban-Board, Zeiterfassung und Reporting
→ frontend_developer + backend_architect + ui_designer + qa_engineer
```

Einfache Prompts laufen normal. AgentCrow greift nur bei Multi-Task-Anfragen ein.

## 🛡️ Null Overhead

| | |
|:---|:---|
| 🟢 Komplexe Prompts | Automatisch in Agenten zerlegt |
| 🔵 Einfache Prompts | Laufen normal, keine Agenten |
| 🔴 `agentcrow off` | Vollstaendig deaktiviert |

> [!IMPORTANT]
> AgentCrow beruehrt nur `.claude/CLAUDE.md` und `.claude/agents/`. Keine Projektabhaengigkeiten, keine Hintergrundprozesse. `agentcrow off` sichert und entfernt beides sauber.

## 🤝 Mitwirken

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 60 tests
```

## 📜 Lizenz

MIT — Externe Agenten von [agency-agents](https://github.com/msitarzewski/agency-agents).

---

<p align="center">
  <b>🐦 Ein Prompt. Viele Agenten. Null Konfiguration.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
