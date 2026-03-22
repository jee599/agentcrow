<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Один промпт. AgentCrow разбивает его и запускает специализированных агентов параллельно. 9 встроенных + внешние агенты.<br>
  <code>npx agentcrow init</code> → <code>claude</code> → автоматическая диспетчеризация.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-9_builtin-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-78_passing-brightgreen?style=flat-square" alt="Tests" />
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
  <a href="README.fr.md">Français</a> •
  Русский •
  <a href="README.hi.md">हिन्दी</a> •
  <a href="README.tr.md">Türkçe</a> •
  <a href="README.vi.md">Tiếng Việt</a>
</p>

---

<p align="center">
  <img src="../assets/demo.gif" alt="AgentCrow demo — auto-dispatching agents" width="720" />
</p>

---

```
  Вы:    "Создать платформу для онлайн-курсов с видео и тестами"

  AgentCrow разбивает → 5 агентов:

    🖥️  frontend_developer  → UI курсов, видеоплеер, панель прогресса
    🏗️  backend_architect   → API курсов, система авторизации, база данных
    🤖  ai_engineer         → Рекомендации курсов, автогенерация тестов
    🧪  qa_engineer         → E2E-тесты прохождения курса, edge cases
    📝  technical_writer    → Документация API, руководство для авторов курсов

  Вы не выбирали агентов. AgentCrow сделал это сам.
```

<h3 align="center">⬇️ Одна строка. Всё.</h3>

```bash
npx agentcrow init
```

<p align="center">
  Дальше просто запускайте <code>claude</code> как обычно. AgentCrow позаботится об остальном.<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ Без AgentCrow**
```
Вы: Создай дашборд с API,
    тестами и документацией

Claude: (один агент делает всё)
        - читает все файлы
        - пишет весь код
        - запускает все тесты
        - пишет всю документацию
        = одно контекстное окно
        = забывает предыдущую работу
        = 10+ минут
```

</td>
<td width="50%">

**✅ С AgentCrow**
```
Вы: тот же промпт

AgentCrow автоматически диспетчеризует:
  @ui_designer     → макет
  @frontend_dev    → React-код
  @backend_arch    → API
  @qa_engineer     → тесты
  @tech_writer     → документация

  = параллельные агенты
  = каждый сфокусирован
  = лучший результат
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ Установка

```bash
npx agentcrow init
```

Всё. Происходят две вещи:

**При первом запуске** — агенты скачиваются в `~/.agentcrow/` (глобально, общие для всех проектов)

**При каждом запуске** — секция AgentCrow мержится в `.claude/CLAUDE.md` (ваши существующие правила сохраняются)

> [!NOTE]
> Агенты хранятся глобально в `~/.agentcrow/`. Со второго проекта = мгновенно, без скачивания.

> [!TIP]
> Уже есть CLAUDE.md? AgentCrow **дописывает** свою секцию — ваши существующие правила остаются нетронутыми.

<a id="how-it-works"></a>
## ⚙️ Как это работает

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

1. **Запускаете `claude`** в проекте с инициализированным AgentCrow
2. **Вводите промпт** — любую сложную задачу
3. **Claude читает CLAUDE.md** — определяет список агентов и правила диспетчеризации
4. **Claude декомпозирует** — разбивает промпт на целевые подзадачи
5. **Claude диспетчеризует** — создаёт субагентов через инструмент Agent
6. **Каждый агент работает** — в своей области экспертизы

Без API-ключа. Без сервера. Только Claude Code + CLAUDE.md.

<a id="agents"></a>
## 🤖 9 встроенных агентов + внешние агенты

| Отдел | Примеры |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | test_automation, performance_tester |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | qa_engineer, korean_tech_writer, security_auditor |
| + more | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 Команды

```bash
npx agentcrow init              # Настроить агентов + CLAUDE.md (английский по умолчанию)
npx agentcrow init --lang ko    # Корейский шаблон
npx agentcrow init --max 5      # Максимум одновременных агентов
npx agentcrow status            # Проверить активен ли
npx agentcrow off               # Временно отключить
npx agentcrow on                # Включить снова
npx agentcrow agents            # Список всех агентов
npx agentcrow agents search ai  # Поиск по ключевому слову
npx agentcrow compose "prompt"  # Предпросмотр декомпозиции (dry run)
```

## 💡 Примеры промптов

```
Создать платформу для онлайн-курсов с видео и тестами
→ frontend_developer + backend_architect + ai_engineer + qa_engineer

Платформа для доставки еды с отслеживанием, оплатой и уведомлениями
→ frontend_developer + backend_architect + devops_automator + qa_engineer

Система управления задачами с канбан-доской и аналитикой
→ frontend_developer + backend_architect + ui_designer + qa_engineer
```

Простые промпты выполняются как обычно. AgentCrow активируется только для многозадачных запросов.

## 🛡️ Нулевой Overhead

| | |
|:---|:---|
| 🟢 Сложные промпты | Автоматически разбиваются на агентов |
| 🔵 Простые промпты | Работают как обычно, без агентов |
| 🔴 `agentcrow off` | Полностью отключён |

> [!IMPORTANT]
> AgentCrow затрагивает только `.claude/CLAUDE.md` и `.claude/agents/`. Без зависимостей проекта, без фоновых процессов. `agentcrow off` делает бэкап и чисто удаляет оба.

## 🤝 Участие в разработке

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 78 tests
```

## 📜 Лицензия

MIT — Внешние агенты из [agency-agents](https://github.com/msitarzewski/agency-agents).

---

<p align="center">
  <b>🐦 Один промпт. Много агентов. Ноль конфигурации.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
