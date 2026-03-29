<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Claude tạo subagent trống. AgentCrow biến chúng thành chuyên gia.<br>
  154 persona chuyên gia. Bắt buộc qua Hook. Không cần cấu hình.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-154-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-190_passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/hook-PreToolUse-blue?style=flat-square" alt="Hook" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#install">Cài đặt</a> •
  <a href="#how-it-works">Cách hoạt động</a> •
  <a href="#agents">Agent</a> •
  <a href="#commands">Lệnh</a> •
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a>
</p>

---

## Vấn đề

Khi Claude Code tạo một subagent, nó là một **người tổng quát trống rỗng**. Không chuyên môn, không quy tắc, không cá tính.

```
Bạn: "Xây dựng auth + test + docs"

Không có AgentCrow:
  Agent 1: (trống) → viết auth       ← không có tiêu chuẩn code
  Agent 2: (trống) → viết test       ← không có quy tắc coverage
  Agent 3: (trống) → viết docs       ← không có style guide

Với AgentCrow:
  Agent 1: → 🏗️ Kiến trúc sư Backend được tiêm
            "Cực kỳ nghiêm ngặt về tính toàn vẹn dữ liệu. Không bao giờ deploy mà không có migration."
  Agent 2: → 🧪 Kỹ sư QA được tiêm
            "Coi 'có lẽ chạy được' là sự xúc phạm cá nhân."
  Agent 3: → 📝 Kỹ thuật viên được tiêm
            "Mỗi câu phải xứng đáng với vị trí của nó."
```

Một **PreToolUse Hook** chặn mọi lệnh gọi Agent tool và tiêm persona chuyên gia phù hợp — tự động, trước khi subagent bắt đầu. Không cần chọn thủ công. Không cần prompt engineering.

---

<a id="install"></a>
## ⚡ Cài đặt

```bash
npm i -g agentcrow
agentcrow init --global
```

Hai lệnh. Mọi subagent được gán persona chuyên gia từ bây giờ.

> [!TIP]
> Xác minh: `agentcrow status` phải hiển thị cả hai hook (SessionStart + PreToolUse) đang hoạt động.

---

<a id="how-it-works"></a>
## ⚙️ Cách hoạt động

```
  Bạn: "Xây dựng hệ thống auth với JWT, thêm test"
                    │
                    ▼
  Claude gọi Agent tool:
    { name: "qa_engineer", prompt: "Write E2E tests" }
                    │
                    ▼
  ┌─────────────────────────────────────────┐
  │  PreToolUse Hook (tự động)              │
  │                                         │
  │  agentcrow-inject.sh → agentcrow inject │
  │    1. Tải catalog-index.json   (~5ms)   │
  │    2. Tìm "qa_engineer"    (chính xác)  │
  │    3. Tải persona QA Engineer           │
  │    4. Thêm vào đầu prompt              │
  └─────────────────────────────────────────┘
                    │
                    ▼
  Subagent khởi động với persona đầy đủ:
    <AGENTCROW_PERSONA>
    You are QA Engineer — test specialist
    ## MUST
    - Test every public function
    - Cover happy path, edge case, error path
    ## MUST NOT
    - Never test implementation details
    - Never use sleep for async waits
    </AGENTCROW_PERSONA>

    Write E2E tests    ← prompt gốc được giữ nguyên
```

### Ba chiến lược khớp

| Ưu tiên | Chiến lược | Ví dụ |
|---------|----------|-------|
| 1 | Tên chính xác | `name: "qa_engineer"` → QA Engineer |
| 2 | Loại subagent | `subagent_type: "security_auditor"` → Security Auditor |
| 3 | Từ khóa + từ đồng nghĩa | `"kubernetes deploy"` → DevOps Automator |

Khớp mờ sử dụng **bản đồ từ đồng nghĩa** (50+ mục) và **học từ lịch sử** — agent bạn dùng thường xuyên được ưu tiên.

---

## 👀 Trước / Sau

<table>
<tr>
<td width="50%">

**❌ Không có AgentCrow**
```
Claude tạo subagent trống:
  prompt: "Write tests for auth"

  Kết quả:
  - File test chung chung
  - Không có cấu trúc AAA
  - Bỏ qua các trường hợp biên
  - Không có mục tiêu coverage
```

</td>
<td width="50%">

**✅ Với AgentCrow**
```
Persona Kỹ sư QA được tiêm:
  MUST: test mọi hàm public
  MUST NOT: không test chi tiết triển khai

  Kết quả:
  - Test có cấu trúc AAA
  - Happy path + edge + error được cover
  - Báo cáo coverage đi kèm
  - Cấu hình CI được tạo
```

</td>
</tr>
</table>

---

<a id="agents"></a>
## 🤖 154 Agent

### 14 Agent tích hợp thủ công

Mỗi agent tích hợp có cá tính, quy tắc MUST/MUST NOT, sản phẩm bàn giao và chỉ số thành công.

| Agent | Chuyên môn | Quy tắc chính |
|-------|-----------|---------------|
| **Backend Architect** | API, auth, cơ sở dữ liệu, cache | "Không bao giờ deploy mà không có migration" |
| **Frontend Developer** | React/Next.js, Core Web Vitals | "Composition thay vì inheritance, luôn luôn" |
| **QA Engineer** | Unit/integration/E2E, coverage | "Code chưa test là code hỏng" |
| **Security Auditor** | OWASP, CVSS, PoC cho mọi phát hiện | "Không bao giờ nói 'code an toàn'" |
| **UI Designer** | Hệ thống thiết kế, token, spacing | "Nếu không có trong hệ thống token, nó không tồn tại" |
| **DevOps Automator** | CI/CD, Docker, K8s, secret | "Không có tag :latest trên production" |
| **AI Engineer** | LLM, RAG, tối ưu prompt | "LLM cần guardrail" |
| **Refactoring Specialist** | Code smell, danh mục Fowler | "Không bao giờ refactor mà không có test" |
| **Complexity Critic** | Cyclomatic complexity, YAGNI | "Không gọi là phức tạp mà không có bằng chứng" |
| **Data Pipeline Engineer** | ETL, idempotency, schema | "Idempotency không thể thương lượng" |
| **Technical Writer** | Tài liệu API, hướng dẫn, README | "Mỗi câu phải xứng đáng với vị trí của nó" |
| **Translator** | i18n, file locale, dịch thuật | "Không bao giờ dịch code identifier" |
| **Compose Meta-Reviewer** | Kiểm toán thành phần agent | "Chặn thực thi khi điểm dưới 70" |
| **Unreal GAS Specialist** | GameplayAbilitySystem, UE5 | "Không tính damage trong GameplayAbilities" |

### 140 Agent bên ngoài (13 bộ phận)

| Bộ phận | Số lượng | Ví dụ |
|----------|------:|---------|
| Engineering | 24 | Data Engineer, Mobile Builder, Security Engineer |
| Marketing | 25 | SEO, TikTok, LinkedIn, Douyin Strategist |
| Game Dev | 20 | Godot, Unity, Unreal chuyên gia |
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
## 🔧 Lệnh

```bash
# Cài đặt & Thiết lập
agentcrow init [--global] [--lang en|ko] [--max 5] [--mcp]

# Vòng đời
agentcrow on / off [--global]   # Bật/Tắt
agentcrow status                # Kiểm tra cài đặt
agentcrow doctor                # Chẩn đoán 12 điểm
agentcrow update                # Lấy agent mới nhất
agentcrow uninstall             # Gỡ cài đặt sạch

# Quản lý Agent
agentcrow agents                # Liệt kê tất cả 154 agent
agentcrow agents search <query> # Tìm kiếm theo từ khóa
agentcrow add <path|url>        # Thêm agent tùy chỉnh (.md/.yaml)
agentcrow remove <role>         # Xóa agent tùy chỉnh

# Kiểm tra & Gỡ lỗi
agentcrow compose <prompt>      # Xem trước phân tách (dry run)
agentcrow stats                 # Lịch sử dispatch & phân tích
agentcrow inject                # Hook handler (nội bộ)

# MCP Server
agentcrow serve                 # Khởi động MCP server (stdio)
```

---

## 📊 Thống kê

```bash
$ agentcrow stats

  🐦 AgentCrow Stats

  Match Quality
    exact  106 (55%)   ← tên khớp trực tiếp
    fuzzy   87 (45%)   ← từ khóa + từ đồng nghĩa khớp
    none     0 (0%)    ← không khớp, passthrough

  Top Agents
    qa_engineer            89 ████████████████████
    frontend_developer     23 █████
    backend_architect      15 ███
```

---

## 🛡️ An toàn & Hiệu suất

| | |
|:---|:---|
| Độ trễ Hook | **< 50ms** mỗi lệnh gọi Agent |
| Token overhead | **~350 token** mỗi persona |
| Fail-open | Thiếu index hoặc binary → passthrough (không gián đoạn) |
| Loại tích hợp | `Explore`, `Plan`, `general-purpose` → không bao giờ bị chặn |
| Prompt đơn giản | Không dispatch agent, không overhead |
| `agentcrow off` | Tắt hoàn toàn, mọi thứ được sao lưu |

> [!IMPORTANT]
> AgentCrow không bao giờ chặn Claude. Nếu có lỗi, prompt gốc được chuyển qua không thay đổi.

---

## 🏗️ Kiến trúc

```
~/.agentcrow/
  ├── agents/
  │   ├── builtin/          14 YAML (thủ công)
  │   ├── external/         140 MD (agency-agents + cộng đồng)
  │   └── md/               154 file .md hợp nhất
  ├── catalog-index.json    Dựng sẵn để tra cứu <5ms
  └── history.json          Bản ghi dispatch (1000 gần nhất)

~/.claude/
  ├── settings.json         SessionStart + PreToolUse hooks
  ├── hooks/
  │   └── agentcrow-inject.sh
  └── agents/
      └── INDEX.md          Danh mục agent
```

---

## ➕ Agent tùy chỉnh

```bash
agentcrow add ./my-agent.yaml           # File cục bộ
agentcrow add https://example.com/a.md  # URL
agentcrow remove my_agent               # Xóa (chỉ tùy chỉnh)
```

Định dạng agent (`.md` hoặc `.yaml`):

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

## 🔌 MCP Server (Tùy chọn)

```bash
agentcrow init --global --mcp
```

Thêm 3 công cụ vào Claude Code: `agentcrow_match`, `agentcrow_search`, `agentcrow_list`.

---

## 🤝 Đóng góp

```bash
git clone https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 190 tests
```

## 📜 Giấy phép

MIT

---

<p align="center">
  <b>🐦 Mọi subagent đều xứng đáng có một persona.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
