<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  프롬프트 하나 치면, AgentCrow가 144개 전문 에이전트로 쪼개서 실행한다.<br>
  <code>npx agentcrow init</code> → <code>claude</code> → 자동 디스패치.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-144_ready-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-70_passing-brightgreen?style=flat-square" alt="Tests" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="../README.md">English</a> •
  한국어 •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a>
</p>

---

```
  나:    "커피챗 앱 만들어줘. 매칭 알고리즘이랑 채팅이랑 배포까지"

  AgentCrow가 분해 → 에이전트 5개:

    🖥️  frontend_developer  → Next.js 채팅 UI, 프로필 카드, 매칭 화면
    🏗️  backend_architect   → 매칭 알고리즘, WebSocket 채팅 서버
    🤖  ai_engineer         → 관심사 기반 매칭 추천 로직
    🧪  qa_engineer         → 매칭/채팅 E2E 테스트
    🚀  devops_automator    → Docker + CI/CD 파이프라인

  Claude가 각 에이전트를 자동으로 디스패치한다.
```

<h3 align="center">⬇️ 한 줄이면 끝이다.</h3>

```bash
npx agentcrow init
```

<p align="center">
  이후 평소처럼 <code>claude</code>만 실행하면 된다. 나머지는 AgentCrow가 알아서 한다.<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ AgentCrow 없이**
```
나: 대시보드 만들어줘.
    API, 테스트, 문서 포함.

Claude: (에이전트 하나가 전부 처리)
        - 파일 전부 읽고
        - 코드 전부 쓰고
        - 테스트 전부 돌리고
        - 문서 전부 작성
        = 컨텍스트 윈도우 하나
        = 앞에서 한 작업을 잊음
        = 10분 이상
```

</td>
<td width="50%">

**✅ AgentCrow 사용**
```
나: 같은 프롬프트

AgentCrow 자동 디스패치:
  @ui_designer     → 레이아웃
  @frontend_dev    → React 코드
  @backend_arch    → API
  @qa_engineer     → 테스트
  @tech_writer     → 문서

  = 병렬 에이전트
  = 각자 전문 영역에 집중
  = 더 나은 결과
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ 설치

```bash
npx agentcrow init
```

이게 전부다. 실행하면 아래 파일들이 생성된다:
- `.agr/agents/` — 144개 에이전트 정의 (빌트인 9개 + 외부 135개)
- `.claude/CLAUDE.md` — Claude용 자동 디스패치 규칙
- `.claude/settings.local.json` — SessionStart 훅

> [!TIP]
> AgentCrow는 첫 init 시 [agency-agents](https://github.com/msitarzewski/agency-agents)에서 외부 에이전트 135개를 내려받는다. `git`이 필요하다.

<a id="how-it-works"></a>
## ⚙️ 동작 원리

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

1. **AgentCrow가 초기화된 프로젝트에서 `claude`를 실행**한다
2. **복잡한 작업을 프롬프트**로 입력한다
3. **Claude가 CLAUDE.md를 읽는다** — 에이전트 목록과 디스패치 규칙을 파악한다
4. **Claude가 분해한다** — 프롬프트를 집중된 개별 태스크로 나눈다
5. **Claude가 디스패치한다** — Agent 도구로 서브에이전트를 생성한다
6. **각 에이전트가 작업한다** — 자기 전문 영역 안에서

API 키 필요 없다. 서버 필요 없다. Claude Code + CLAUDE.md, 그게 전부다.

<a id="agents"></a>
## 🤖 144개 에이전트, 15개 부서

| 부서 | 수 | 예시 |
|:---------|------:|:---------|
| **Engineering** | 23 | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | 20 | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | 18 | content_strategist, seo_specialist, social_media |
| **Testing** | 8 | test_automation, performance_tester |
| **Design** | 8 | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | 9 | qa_engineer, korean_tech_writer, security_auditor |
| + 9개 더 | 58 | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 명령어

```bash
npx agentcrow init              # Set up agents + CLAUDE.md
npx agentcrow status            # Check if active
npx agentcrow off               # Disable temporarily
npx agentcrow on                # Re-enable
npx agentcrow agents            # List all 144 agents
npx agentcrow agents search ai  # Search by keyword
npx agentcrow compose "prompt"  # Preview decomposition (dry run)
```

## 💡 프롬프트 예시

```
React로 로그인 만들고 API 연동하고 테스트하고 문서 작성해줘
→ frontend_developer + backend_architect + qa_engineer + korean_tech_writer

Build a real-time chat app with WebSocket and deploy to Docker
→ frontend_developer + backend_architect + devops_automator + qa_engineer

ゲームのマッチメイキングシステムを設計して実装して
→ game_designer + backend_architect + qa_engineer
```

단순한 프롬프트는 평소처럼 동작한다. AgentCrow는 멀티 태스크 요청에만 개입한다.

## 🛡️ 오버헤드 제로

| | |
|:---|:---|
| 🟢 복잡한 프롬프트 | 에이전트로 자동 분해 |
| 🔵 단순한 프롬프트 | 평소처럼 실행, 에이전트 없음 |
| 🔴 `agentcrow off` | 완전히 비활성화 |

> [!IMPORTANT]
> AgentCrow는 CLAUDE.md 파일 하나만 추가한다. 의존성 없고, 백그라운드 프로세스 없다. `agentcrow off`로 깔끔하게 제거된다.

## 🤝 기여하기

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentochester && npm install && npm test  # 70 tests
```

## 📜 라이선스

MIT — 외부 에이전트 출처: [agency-agents](https://github.com/msitarzewski/agency-agents).

---

<p align="center">
  <b>🐦 프롬프트 하나. 에이전트 여럿. 설정 제로.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
