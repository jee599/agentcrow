<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Mot prompt duy nhat. AgentCrow tu dong tach va dispatch cac agent chuyen biet chay song song. 9 built-in + agent ben ngoai.<br>
  <code>npx agentcrow init</code> → <code>claude</code> → tu dong dispatch.
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
  <a href="README.ru.md">Русский</a> •
  <a href="README.hi.md">हिन्दी</a> •
  <a href="README.tr.md">Türkçe</a> •
  Tiếng Việt
</p>

---

<p align="center">
  <img src="../assets/demo.gif" alt="AgentCrow demo — auto-dispatching agents" width="720" />
</p>

---

```
  Ban:   "Xây dựng nền tảng tuyển dụng với AI matching và chat"

  AgentCrow phan tach → 5 agent:

    🖥️  frontend_developer  → Giao dien tuyen dung, ho so ung vien, chat UI
    🏗️  backend_architect   → API tuyen dung, he thong xac thuc, co so du lieu
    🤖  ai_engineer         → AI matching ung vien - viec lam, xep hang
    🧪  qa_engineer         → E2E test luong tuyen dung, edge case chat
    📝  technical_writer    → Tai lieu API, huong dan tich hop

  Ban khong chon agent. AgentCrow da chon.
```

<h3 align="center">⬇️ Mot dong lenh. Xong.</h3>

```bash
npx agentcrow init
```

<p align="center">
  Sau do chay <code>claude</code> nhu binh thuong. AgentCrow lo phan con lai.<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ Khong co AgentCrow**
```
Ban: Tao dashboard voi API,
     test va tai lieu

Claude: (mot agent lam tat ca)
        - doc tat ca file
        - viet tat ca code
        - chay tat ca test
        - viet tat ca tai lieu
        = mot context window
        = quen viec da lam truoc
        = 10+ phut
```

</td>
<td width="50%">

**✅ Voi AgentCrow**
```
Ban: cung prompt do

AgentCrow tu dong dispatch:
  @ui_designer     → layout
  @frontend_dev    → React code
  @backend_arch    → API
  @qa_engineer     → test
  @tech_writer     → tai lieu

  = agent song song
  = moi agent tap trung
  = ket qua tot hon
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ Cai dat

```bash
npx agentcrow init
```

Chi vay thoi. Lenh nay lam hai viec:

**Lan dau** — tai agent ve `~/.agentcrow/` (global, dung chung cho moi du an)

**Moi lan chay** — merge phan AgentCrow vao `.claude/CLAUDE.md` (cac rule hien tai cua ban duoc giu nguyen)

> [!NOTE]
> Agent duoc luu global tai `~/.agentcrow/`. Tu du an thu hai tro di = ngay lap tuc, khong can tai lai.

> [!TIP]
> Da co CLAUDE.md? AgentCrow chi **them** phan cua minh — rule hien tai cua ban khong bi thay doi.

<a id="how-it-works"></a>
## ⚙️ Cach hoat dong

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

1. **Chay `claude`** trong du an da khoi tao AgentCrow
2. **Nhap prompt** — bat ky tac vu phuc tap nao
3. **Claude doc CLAUDE.md** — nhan dien danh sach agent va quy tac dispatch
4. **Claude phan tach** — chia prompt thanh cac tac vu tap trung
5. **Claude dispatch** — dung Agent tool de tao sub-agent
6. **Moi agent lam viec** — trong linh vuc chuyen mon cua minh

Khong can API key. Khong can server. Chi can Claude Code + CLAUDE.md.

<a id="agents"></a>
## 🤖 9 Agent Built-in + Agent Ben Ngoai

| Bo phan | Vi du |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | test_automation, performance_tester |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | qa_engineer, korean_tech_writer, security_auditor |
| + more | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 Cac lenh

```bash
npx agentcrow init              # Thiet lap agent + CLAUDE.md (tieng Anh mac dinh)
npx agentcrow init --lang ko    # Template tieng Han
npx agentcrow init --max 5      # So agent dong thoi toi da
npx agentcrow status            # Kiem tra trang thai
npx agentcrow off               # Tam tat
npx agentcrow on                # Bat lai
npx agentcrow agents            # Liet ke tat ca agent
npx agentcrow agents search ai  # Tim theo tu khoa
npx agentcrow compose "prompt"  # Xem truoc phan tach (dry run)
```

## 💡 Vi du Prompt

```
Xây dựng nền tảng tuyển dụng với AI matching và chat
→ frontend_developer + backend_architect + ai_engineer + qa_engineer

Nen tang hoc truc tuyen voi video bai giang, bai kiem tra va chung chi
→ frontend_developer + backend_architect + devops_automator + qa_engineer

He thong quan ly kho hang voi bao cao va canh bao
→ backend_architect + frontend_developer + qa_engineer + technical_writer
```

Prompt don gian chay binh thuong. AgentCrow chi kich hoat voi cac yeu cau nhieu tac vu.

## 🛡️ Zero Overhead

| | |
|:---|:---|
| 🟢 Prompt phuc tap | Tu dong phan tach thanh agent |
| 🔵 Prompt don gian | Chay binh thuong, khong co agent |
| 🔴 `agentcrow off` | Tat hoan toan |

> [!IMPORTANT]
> AgentCrow chi thay doi `.claude/CLAUDE.md` va `.claude/agents/`. Khong co dependency du an, khong co process chay ngam. `agentcrow off` backup va xoa sach ca hai.

## 🤝 Dong gop

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 78 tests
```

## 📜 Giay phep

MIT — Agent ben ngoai tu [agency-agents](https://github.com/msitarzewski/agency-agents).

---

<p align="center">
  <b>🐦 Mot prompt. Nhieu agent. Zero config.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
