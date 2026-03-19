# Claude Code Agent Teams에 빠진 한 조각을 만들었다

Claude Code의 Agent Teams는 진짜 대단하다. 복잡한 프롬프트를 넣으면 서브에이전트를 spawn하고, 각자 독립 컨텍스트에서 작업하고, 결과를 합친다. 아키텍처 자체는 완성되어 있다.

근데 아무도 말 안 하는 문제가 하나 있다.

Agent Teams는 **어떤 에이전트를 써야 하는지 모른다.**

게임 프로젝트에 game designer가 필요한지, SaaS 대시보드에 Stripe 전문가가 필요한지, 크롤링 프로젝트에 data pipeline engineer가 필요한지 — Agent Teams는 판단하지 않는다. 빈 서브에이전트를 spawn할 뿐이다. 정체성도 없고, 규칙도 없고, 전문성도 없다.

매번 `--agents` JSON을 직접 작성해야 한다. 매 프로젝트마다.

그래서 빠진 조각을 만들었다.


## npx 한 줄이면 끝이다

```bash
npx agentcrow init
```

이 명령 하나로 144개 에이전트가 프로젝트에 설치된다. 직접 작성한 builtin 9개에는 MUST/MUST NOT 규칙이 빡빡하게 들어가 있고, 커뮤니티에서 관리하는 external 135개는 engineering부터 game dev, marketing, spatial computing까지 15개 분야를 커버한다.

설치 후 `claude`를 실행하면 끝이다. AgentCrow가 `.claude/CLAUDE.md`에 에이전트 명단과 디스패치 규칙을 써놨기 때문에, Claude가 복잡한 프롬프트를 받으면 알아서 분해하고, 맞는 에이전트를 찾고, 각각에게 일을 넘긴다.

API 키 없다. 별도 서버 없다. 설정 없다. Claude Code가 원래 하는 일을 그대로 하는데, 이제 **누구를 불러야 하는지 아는 것**뿐이다.


## 실제로 이렇게 동작한다

이런 프롬프트를 넣었다.

```
커피챗 앱 만들어줘. 매칭 알고리즘이랑 채팅이랑 배포까지
```

Claude가 5개 태스크로 분해하고 5개 전문 에이전트를 디스패치했다.

```
🐦 AgentCrow — 5개 에이전트 분배:
1. @frontend_developer  → Next.js 채팅 UI, 프로필 카드, 매칭 화면
2. @backend_architect   → 매칭 알고리즘, WebSocket 채팅 서버
3. @ai_engineer         → 관심사 기반 매칭 추천 로직
4. @qa_engineer         → 매칭/채팅 E2E 테스트
5. @devops_automator    → Docker + CI/CD 파이프라인
```

각 에이전트는 정의된 성격과 규칙을 갖고 있다. QA 엔지니어 에이전트는 "반드시 happy path, edge case, error path를 모두 커버한다"와 "구현 세부사항이 아니라 동작을 테스트한다"는 규칙이 박혀 있다. 제안이 아니라 에이전트의 정체성이다.

AgentCrow 없으면 Claude는 빈 서브에이전트를 만든다. AgentCrow 있으면 각 서브에이전트가 자기 역할을 안다. 차이는 크다.


## 뭘 했고 뭘 안 했는지

솔직히 말하면 이 프로젝트에서 가장 어려웠던 건 에이전트 매칭 로직이 아니었다. **뭘 자동화하지 않을지** 결정하는 게 어려웠다.

처음에는 모든 프롬프트를 가로채서 LLM으로 분해하고 자동 디스패치하려 했다. 분해만 15초 걸렸다. "이 오타 고쳐줘" 같은 단순한 요청에 15초 대기는 말이 안 된다.

지금 설계는 다르다. CLAUDE.md에 "복잡한 요청만 분해하라"고 써놨다. "버그 고쳐줘"는 평소대로 실행되고, "대시보드 만들고 인증 넣고 테스트하고 문서 작성해줘"만 에이전트 시스템이 작동한다. 이 판단을 Claude한테 맡겼는데, 놀랍게도 잘 한다.

에이전트 정체성이 생각보다 중요하다는 것도 배웠다. "테스트 작성해"라고 빈 서브에이전트한테 시키면 Generic한 테스트가 나온다. "MUST: edge case 커버", "MUST NOT: sleep으로 비동기 대기"라는 규칙이 박힌 QA 에이전트한테 시키면 프로페셔널한 테스트가 나온다. 규칙이 모델을 올바른 방향으로 제약한다.


## Agent Teams 혼자 vs. AgentCrow 추가

| | Agent Teams 혼자 | + AgentCrow |
|:---|:---:|:---:|
| 서브에이전트 spawn | O | O |
| 어떤 에이전트 쓸지 판단 | X (직접 결정) | O (자동 매칭) |
| 144개 사전 정의 에이전트 | X (직접 작성) | O (바로 사용) |
| 프롬프트 자동 분해 | X (수동 분할) | O (한 프롬프트) |
| 에이전트 정체성/규칙 | X (빈 서브에이전트) | O (MUST/MUST NOT) |
| 설정 없이 동작 | X (`--agents` JSON 필요) | O (`npx agentcrow init`) |

Agent Teams가 엔진이라면, AgentCrow는 그 엔진에 두뇌를 얹은 것이다.


## 끄고 켜기

```bash
npx agentcrow off       # 끄기 (CLAUDE.md 백업 후 제거)
npx agentcrow on        # 다시 켜기
npx agentcrow status    # 상태 확인
npx agentcrow agents    # 144개 에이전트 목록
```

`agentcrow off` 하면 CLAUDE.md가 제거되고 Claude는 평소대로 동작한다. 다시 필요하면 `on`. 전체 시스템이 CLAUDE.md 파일 하나와 YAML 몇 개다. 런타임 의존성 없고, 백그라운드 프로세스 없고, API 키 없다.


## 설치하고 써봐

```bash
npx agentcrow init
claude
```

복잡한 걸 시켜봐. 분해되고 디스패치되는 걸 볼 수 있다.

소스는 [GitHub](https://github.com/jee599/agentcrow), npm 패키지는 [agentcrow](https://www.npmjs.com/package/agentcrow).

> Agent Teams는 강력하다. 그냥 누구를 불러야 하는지 몰랐을 뿐이다.

---

- [AgentCrow GitHub](https://github.com/jee599/agentcrow)
- [agency-agents](https://github.com/msitarzewski/agency-agents) — 135개 커뮤니티 에이전트
