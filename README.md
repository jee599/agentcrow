# AgentCraw

> One prompt → auto-decompose tasks → match 180+ agents → execute via Claude CLI

## Quick Start (30 seconds)

```bash
git clone --recursive git@github.com:jee599/agentochester.git
cd agentochester/dashboard
npm install
npm run dev
```

Open `http://localhost:3000` → type a prompt → **Compose Team** → **Execute Team**

### Example Prompts

```
Build a React login page with API integration, tests, and Korean docs
AI 뉴스 크롤링해서 분석하고 웹으로 보여줘
用React创建登录页面，连接API，编写测试
Reactでログインページを作り、API連携し、テストを書く
```

## How It Works

```
Prompt → Decomposer → Agent Matcher → Assembler → Claude CLI Executor
                         ↓
              181 agents (15 divisions)
              ├── 9 builtin (YAML)
              └── 172 external (agency-agents submodule)
```

1. **Decompose** — Keywords in your prompt trigger specialized roles (frontend, backend, AI, QA, etc.)
2. **Match** — Each role finds the best agent: external (agency-agents) first, then builtin
3. **Assemble** — Agent identity + rules + task → execution prompt
4. **Execute** — Claude CLI runs each agent sequentially, respecting dependencies

## Dashboard

| Page | Description |
|------|-------------|
| `/` | Compose & Execute — enter prompt, see decomposed tasks, run agents |
| `/agents` | Agent Library — browse 181 agents across 15 divisions |

Language selector in top-right: EN / KR / CN / JP / ES / DE / FR / PT

## Project Structure

```
├── src/core/          # Core engine
│   ├── types.ts       # AgentDefinition, CatalogEntry, Task
│   ├── adapter.ts     # .md → AgentDefinition parser
│   ├── catalog.ts     # Agent catalog (build, search, match)
│   ├── agent-manager.ts  # 3-tier matching
│   ├── assembler.ts   # Prompt assembly
│   ├── bridge.ts      # Claude CLI bridge
│   └── executor.ts    # Task execution engine
├── agents/
│   ├── builtin/       # 9 custom YAML agents
│   └── external/agency-agents/  # 172 agents (git submodule)
├── dashboard/         # Next.js dashboard
└── tests/             # 70 tests (Vitest)
```

## Commands

```bash
npm test              # Run 70 tests
npm run build         # Build core
cd dashboard && npm run dev    # Start dashboard
cd dashboard && npm run build  # Build dashboard
```

---

# AgentCraw (한국어)

> 프롬프트 하나로 태스크 자동 분해 → 180+ 에이전트 매칭 → Claude CLI 실행

## 빠른 시작 (30초)

```bash
git clone --recursive git@github.com:jee599/agentochester.git
cd agentochester/dashboard
npm install
npm run dev
```

`http://localhost:3000` 접속 → 프롬프트 입력 → **팀 구성** → **팀 실행**

### 예시 프롬프트

```
React로 로그인 페이지 만들고 API 연동하고 테스트 작성하고 한국어 문서도 만들어줘
AI 뉴스 크롤링해서 분석하고 웹으로 보여줘
언리얼 GAS 전투 시스템 설계하고 테스트
보안 감사하고 취약점 수정해줘
```

## 동작 방식

```
프롬프트 → 분해기 → 에이전트 매칭 → 조립기 → Claude CLI 실행기
                      ↓
            181개 에이전트 (15개 디비전)
            ├── 9개 builtin (YAML)
            └── 172개 external (agency-agents 서브모듈)
```

1. **분해** — 프롬프트의 키워드가 전문 역할을 트리거 (프론트엔드, 백엔드, AI, QA 등)
2. **매칭** — 각 역할에 최적 에이전트 찾기: external 우선, 그다음 builtin
3. **조립** — 에이전트 정체성 + 규칙 + 태스크 → 실행 프롬프트
4. **실행** — Claude CLI가 의존성 순서대로 각 에이전트 실행

---

# AgentCraw (中文)

> 一个提示词 → 自动分解任务 → 匹配180+代理 → 通过Claude CLI执行

## 快速开始（30秒）

```bash
git clone --recursive git@github.com:jee599/agentochester.git
cd agentochester/dashboard
npm install
npm run dev
```

打开 `http://localhost:3000` → 输入提示词 → **组建团队** → **执行团队**

## 工作原理

1. **分解** — 提示词中的关键词触发专业角色
2. **匹配** — 从181个代理中找到最佳匹配
3. **组装** — 代理身份 + 规则 + 任务 → 执行提示词
4. **执行** — Claude CLI按依赖顺序运行每个代理

---

# AgentCraw (日本語)

> プロンプト1つ → タスク自動分解 → 180+エージェントマッチング → Claude CLIで実行

## クイックスタート（30秒）

```bash
git clone --recursive git@github.com:jee599/agentochester.git
cd agentochester/dashboard
npm install
npm run dev
```

`http://localhost:3000` を開く → プロンプト入力 → **チーム構成** → **チーム実行**

## 仕組み

1. **分解** — プロンプトのキーワードが専門ロールをトリガー
2. **マッチング** — 181エージェントから最適なものを検索
3. **組み立て** — エージェントID + ルール + タスク → 実行プロンプト
4. **実行** — Claude CLIが依存順序に従って各エージェントを実行

---

# AgentCraw (Español)

> Un prompt → descomponer tareas → emparejar 180+ agentes → ejecutar via Claude CLI

```bash
git clone --recursive git@github.com:jee599/agentochester.git
cd agentochester/dashboard && npm install && npm run dev
```

Abrir `http://localhost:3000` → escribir prompt → **Componer Equipo** → **Ejecutar Equipo**

---

# AgentCraw (Deutsch)

> Ein Prompt → Aufgaben zerlegen → 180+ Agenten zuweisen → über Claude CLI ausführen

```bash
git clone --recursive git@github.com:jee599/agentochester.git
cd agentochester/dashboard && npm install && npm run dev
```

`http://localhost:3000` öffnen → Prompt eingeben → **Team zusammenstellen** → **Team ausführen**

---

# AgentCraw (Français)

> Un prompt → décomposer les tâches → assigner 180+ agents → exécuter via Claude CLI

```bash
git clone --recursive git@github.com:jee599/agentochester.git
cd agentochester/dashboard && npm install && npm run dev
```

Ouvrir `http://localhost:3000` → entrer le prompt → **Composer l'équipe** → **Exécuter l'équipe**

---

# AgentCraw (Português)

> Um prompt → decompor tarefas → atribuir 180+ agentes → executar via Claude CLI

```bash
git clone --recursive git@github.com:jee599/agentochester.git
cd agentochester/dashboard && npm install && npm run dev
```

Abrir `http://localhost:3000` → inserir prompt → **Compor Equipe** → **Executar Equipe**
