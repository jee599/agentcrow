<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Claude создаёт пустых субагентов. AgentCrow делает их специалистами.<br>
  154 экспертных персоны. Принудительно через Hook. Без настройки.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-154-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-190_passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/hook-PreToolUse-blue?style=flat-square" alt="Hook" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#install">Установка</a> •
  <a href="#how-it-works">Как работает</a> •
  <a href="#agents">Агенты</a> •
  <a href="#commands">Команды</a> •
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a>
</p>

---

## Проблема

Когда Claude Code создаёт субагента, тот оказывается **пустым универсалом**. Без экспертизы, без правил, без личности.

```
Вы: "Построй auth + тесты + документацию"

Без AgentCrow:
  Agent 1: (пустой) → пишет auth       ← без стандартов кода
  Agent 2: (пустой) → пишет тесты      ← без правил покрытия
  Agent 3: (пустой) → пишет доки       ← без гайда по стилю

С AgentCrow:
  Agent 1: → 🏗️ Backend-архитектор внедрён
            "Параноидально относится к целостности данных. Никогда не деплоит без миграций."
  Agent 2: → 🧪 QA-инженер внедрён
            "Воспринимает 'наверное работает' как личное оскорбление."
  Agent 3: → 📝 Технический писатель внедрён
            "Каждое предложение заслуживает своё место."
```

**PreToolUse Hook** перехватывает каждый вызов Agent tool и внедряет нужную экспертную персону — автоматически, до запуска субагента. Без ручного выбора. Без prompt-инженерии.

---

<a id="install"></a>
## ⚡ Установка

```bash
npm i -g agentcrow
agentcrow init --global
```

Две команды. Каждый субагент получает экспертную персону с этого момента.

> [!TIP]
> Проверка: `agentcrow status` должен показать оба хука (SessionStart + PreToolUse) активными.

---

<a id="how-it-works"></a>
## ⚙️ Как это работает

```
  Вы: "Построй систему auth с JWT, добавь тесты"
                    │
                    ▼
  Claude вызывает Agent tool:
    { name: "qa_engineer", prompt: "Write E2E tests" }
                    │
                    ▼
  ┌─────────────────────────────────────────┐
  │  PreToolUse Hook (автоматический)       │
  │                                         │
  │  agentcrow-inject.sh → agentcrow inject │
  │    1. Загружает catalog-index.json (~5ms)│
  │    2. Ищет "qa_engineer"      (точно)   │
  │    3. Загружает персону QA Engineer     │
  │    4. Добавляет в начало промпта        │
  └─────────────────────────────────────────┘
                    │
                    ▼
  Субагент запускается с полной персоной:
    <AGENTCROW_PERSONA>
    You are QA Engineer — test specialist
    ## MUST
    - Test every public function
    - Cover happy path, edge case, error path
    ## MUST NOT
    - Never test implementation details
    - Never use sleep for async waits
    </AGENTCROW_PERSONA>

    Write E2E tests    ← оригинальный промпт сохранён
```

### Три стратегии сопоставления

| Приоритет | Стратегия | Пример |
|-----------|----------|--------|
| 1 | Точное имя | `name: "qa_engineer"` → QA Engineer |
| 2 | Тип субагента | `subagent_type: "security_auditor"` → Security Auditor |
| 3 | Ключевое слово + синоним | `"kubernetes deploy"` → DevOps Automator |

Нечёткое сопоставление использует **карту синонимов** (50+ записей) и **обучение на истории** — часто используемые агенты получают приоритет.

---

## 👀 До / После

<table>
<tr>
<td width="50%">

**❌ Без AgentCrow**
```
Claude создаёт пустого субагента:
  prompt: "Write tests for auth"

  Результат:
  - Типовой файл с тестами
  - Без структуры AAA
  - Граничные случаи пропущены
  - Без целей покрытия
```

</td>
<td width="50%">

**✅ С AgentCrow**
```
Персона QA-инженера внедрена:
  MUST: тестировать каждую публичную функцию
  MUST NOT: не тестировать детали реализации

  Результат:
  - Тесты со структурой AAA
  - Happy path + edge + error покрыты
  - Отчёт о покрытии включён
  - Конфигурация CI сгенерирована
```

</td>
</tr>
</table>

---

<a id="agents"></a>
## 🤖 154 агента

### 14 встроенных агентов ручной работы

Каждый встроенный агент имеет личность, правила MUST/MUST NOT, результаты и метрики успеха.

| Агент | Специализация | Ключевое правило |
|-------|-----------|-----------------|
| **Backend Architect** | API, auth, база данных, кэширование | "Никогда не деплоить без миграций" |
| **Frontend Developer** | React/Next.js, Core Web Vitals | "Композиция вместо наследования, всегда" |
| **QA Engineer** | Unit/интеграционные/E2E, покрытие | "Непротестированный код — сломанный код" |
| **Security Auditor** | OWASP, CVSS, PoC для каждой находки | "Никогда не говорит 'код безопасен'" |
| **UI Designer** | Дизайн-системы, токены, отступы | "Если нет в системе токенов — не существует" |
| **DevOps Automator** | CI/CD, Docker, K8s, секреты | "Никаких тегов :latest в продакшене" |
| **AI Engineer** | LLM, RAG, оптимизация промптов | "LLM требуют ограждений" |
| **Refactoring Specialist** | Code smells, каталог Фаулера | "Никогда не рефакторить без тестов" |
| **Complexity Critic** | Цикломатическая сложность, YAGNI | "Никогда не называть сложным без доказательств" |
| **Data Pipeline Engineer** | ETL, идемпотентность, схемы | "Идемпотентность не обсуждается" |
| **Technical Writer** | Документация API, руководства, README | "Каждое предложение заслуживает своё место" |
| **Translator** | i18n, файлы локалей, перевод | "Никогда не переводить идентификаторы кода" |
| **Compose Meta-Reviewer** | Аудит составов агентов | "Блокировать выполнение при оценке ниже 70" |
| **Unreal GAS Specialist** | GameplayAbilitySystem, UE5 | "Никакого расчёта урона в GameplayAbilities" |

### 140 внешних агентов (13 подразделений)

| Подразделение | Кол-во | Примеры |
|----------|------:|---------|
| Engineering | 24 | Data Engineer, Mobile Builder, Security Engineer |
| Marketing | 25 | SEO, TikTok, LinkedIn, Douyin Strategist |
| Game Dev | 20 | Godot, Unity, Unreal специалисты |
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
## 🔧 Команды

```bash
# Установка & Настройка
agentcrow init [--global] [--lang en|ko] [--max 5] [--mcp]

# Жизненный цикл
agentcrow on / off [--global]   # Включить/выключить
agentcrow status                # Проверить установку
agentcrow doctor                # 12-пунктная диагностика
agentcrow update                # Получить последних агентов
agentcrow uninstall             # Чистое удаление

# Управление агентами
agentcrow agents                # Список всех 154 агентов
agentcrow agents search <query> # Поиск по ключевому слову
agentcrow add <path|url>        # Добавить пользовательского агента (.md/.yaml)
agentcrow remove <role>         # Удалить пользовательского агента

# Инспекция & Отладка
agentcrow compose <prompt>      # Предпросмотр декомпозиции (dry run)
agentcrow stats                 # История диспетчеризации & аналитика
agentcrow inject                # Обработчик Hook (внутренний)

# MCP-сервер
agentcrow serve                 # Запустить MCP-сервер (stdio)
```

---

## 📊 Статистика

```bash
$ agentcrow stats

  🐦 AgentCrow Stats

  Match Quality
    exact  106 (55%)   ← имя совпало напрямую
    fuzzy   87 (45%)   ← ключевое слово + синоним совпали
    none     0 (0%)    ← нет совпадения, passthrough

  Top Agents
    qa_engineer            89 ████████████████████
    frontend_developer     23 █████
    backend_architect      15 ███
```

---

## 🛡️ Безопасность & Производительность

| | |
|:---|:---|
| Задержка Hook | **< 50мс** на вызов Agent |
| Накладные расходы | **~350 токенов** на персону |
| Fail-open | Отсутствие индекса или бинарника → passthrough (без поломок) |
| Встроенные типы | `Explore`, `Plan`, `general-purpose` → никогда не перехватываются |
| Простые промпты | Без диспетчеризации агентов, нулевые накладные расходы |
| `agentcrow off` | Полностью отключён, всё сохранено |

> [!IMPORTANT]
> AgentCrow никогда не блокирует Claude. Если что-то сломалось, оригинальный промпт проходит без изменений.

---

## 🏗️ Архитектура

```
~/.agentcrow/
  ├── agents/
  │   ├── builtin/          14 YAML (ручная работа)
  │   ├── external/         140 MD (agency-agents + сообщество)
  │   └── md/               154 унифицированных .md файлов
  ├── catalog-index.json    Предварительно собран для поиска <5мс
  └── history.json          Записи диспетчеризации (последние 1000)

~/.claude/
  ├── settings.json         SessionStart + PreToolUse hooks
  ├── hooks/
  │   └── agentcrow-inject.sh
  └── agents/
      └── INDEX.md          Каталог агентов
```

---

## ➕ Пользовательские агенты

```bash
agentcrow add ./my-agent.yaml           # Локальный файл
agentcrow add https://example.com/a.md  # URL
agentcrow remove my_agent               # Удалить (только пользовательские)
```

Формат агента (`.md` или `.yaml`):

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

## 🔌 MCP-сервер (Опционально)

```bash
agentcrow init --global --mcp
```

Добавляет 3 инструмента в Claude Code: `agentcrow_match`, `agentcrow_search`, `agentcrow_list`.

---

## 🤝 Участие в разработке

```bash
git clone https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 190 tests
```

## 📜 Лицензия

MIT

---

<p align="center">
  <b>🐦 Каждый субагент заслуживает персону.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
