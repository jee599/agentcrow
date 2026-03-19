<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  프롬프트 하나 치면, AgentCrow가 전문 에이전트로 쪼개서 실행한다. 9개 빌트인 + 외부 에이전트.<br>
  <code>npx agentcrow init</code> → <code>claude</code> → 자동 디스패치.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-9_builtin-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-60_passing-brightgreen?style=flat-square" alt="Tests" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="../README.md">English</a> •
  한국어 •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a> •
  <a href="README.es.md">Español</a> •
  <a href="README.pt.md">Português</a> •
  <a href="README.de.md">Deutsch</a> •
  <a href="README.fr.md">Français</a> •
  <a href="README.ru.md">Русский</a> •
  <a href="README.hi.md">हिन्दी</a> •
  <a href="README.tr.md">Türkçe</a> •
  <a href="README.vi.md">Tiếng Việt</a>
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

이게 전부다. 두 가지를 한다:

**최초 실행 시** — 에이전트를 `~/.agentcrow/`에 다운로드한다 (글로벌, 모든 프로젝트에서 공유)

**매번 실행 시** — AgentCrow 섹션을 `.claude/CLAUDE.md`에 머지한다 (기존 규칙은 그대로 유지)

> [!NOTE]
> 에이전트는 `~/.agentcrow/`에 글로벌로 저장된다. 두 번째 프로젝트부터는 다운로드 없이 즉시 완료.

> [!TIP]
> 이미 CLAUDE.md가 있다면? AgentCrow는 자기 섹션만 **추가**한다 — 기존 규칙은 건드리지 않는다.

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
## 🤖 9 빌트인 에이전트 + 외부 에이전트

| 부서 | 예시 |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | test_automation, performance_tester |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | qa_engineer, korean_tech_writer, security_auditor |
| + more | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 명령어

```bash
npx agentcrow init              # 에이전트 + CLAUDE.md 설정 (영어 기본)
npx agentcrow init --lang ko    # 한국어 템플릿
npx agentcrow init --max 5      # 디스패치당 최대 에이전트 수
npx agentcrow status            # 활성화 상태 확인
npx agentcrow off               # 임시 비활성화
npx agentcrow on                # 다시 활성화
npx agentcrow agents            # 전체 에이전트 목록
npx agentcrow agents search ai  # 키워드 검색
npx agentcrow compose "prompt"  # 분해 미리보기 (dry run)
```

## 💡 프롬프트 예시

```
커피챗 앱 만들어줘. 매칭 알고리즘이랑 채팅이랑 배포까지
→ frontend_developer + backend_architect + ai_engineer + devops_automator

React로 로그인 만들고 API 연동하고 테스트하고 문서 작성해줘
→ frontend_developer + backend_architect + qa_engineer + korean_tech_writer

사주 분석 서비스 만들어줘. 입력 폼, API, 결과 페이지까지
→ frontend_developer + backend_architect + ai_engineer + qa_engineer
```

단순한 프롬프트는 평소처럼 동작한다. AgentCrow는 멀티 태스크 요청에만 개입한다.

## 🛡️ 오버헤드 제로

| | |
|:---|:---|
| 🟢 복잡한 프롬프트 | 에이전트로 자동 분해 |
| 🔵 단순한 프롬프트 | 평소처럼 실행, 에이전트 없음 |
| 🔴 `agentcrow off` | 완전히 비활성화 |

> [!IMPORTANT]
> AgentCrow는 `.claude/CLAUDE.md`와 `.claude/agents/`만 건드린다. 의존성 없고, 백그라운드 프로세스 없다. `agentcrow off`로 둘 다 백업 후 깔끔하게 제거된다.

## 🤝 기여하기

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 60 tests
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
