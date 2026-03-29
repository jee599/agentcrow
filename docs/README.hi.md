<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Claude खाली सबएजेंट बनाता है। AgentCrow उन्हें विशेषज्ञ बनाता है।<br>
  154 विशेषज्ञ पर्सोना। Hook द्वारा लागू। शून्य कॉन्फ़िगरेशन।
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-154-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-190_passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/hook-PreToolUse-blue?style=flat-square" alt="Hook" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#install">इंस्टॉल</a> •
  <a href="#how-it-works">कैसे काम करता है</a> •
  <a href="#agents">एजेंट</a> •
  <a href="#commands">कमांड</a> •
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a>
</p>

---

## समस्या

जब Claude Code एक सबएजेंट बनाता है, तो वह एक **खाली जनरलिस्ट** होता है। कोई विशेषज्ञता नहीं, कोई नियम नहीं, कोई व्यक्तित्व नहीं।

```
आप: "Auth + tests + docs बनाओ"

AgentCrow के बिना:
  Agent 1: (खाली) → auth लिखता है       ← कोई कोडिंग मानक नहीं
  Agent 2: (खाली) → tests लिखता है      ← कोई कवरेज नियम नहीं
  Agent 3: (खाली) → docs लिखता है       ← कोई स्टाइल गाइड नहीं

AgentCrow के साथ:
  Agent 1: → 🏗️ Backend Architect इंजेक्ट किया
            "डेटा इंटीग्रिटी के प्रति अत्यधिक सतर्क। माइग्रेशन के बिना कभी डिप्लॉय नहीं करता।"
  Agent 2: → 🧪 QA Engineer इंजेक्ट किया
            "'शायद काम करता है' को व्यक्तिगत अपमान मानता है।"
  Agent 3: → 📝 Technical Writer इंजेक्ट किया
            "हर वाक्य अपनी जगह कमाता है।"
```

एक **PreToolUse Hook** हर Agent tool कॉल को इंटरसेप्ट करता है और सही विशेषज्ञ पर्सोना इंजेक्ट करता है — स्वचालित रूप से, सबएजेंट शुरू होने से पहले। कोई मैनुअल चयन नहीं। कोई प्रॉम्प्ट इंजीनियरिंग नहीं।

---

<a id="install"></a>
## ⚡ इंस्टॉल

```bash
npm i -g agentcrow
agentcrow init --global
```

दो कमांड। अब से हर सबएजेंट को एक विशेषज्ञ पर्सोना मिलता है।

> [!TIP]
> सत्यापित करें: `agentcrow status` में दोनों hooks (SessionStart + PreToolUse) सक्रिय दिखने चाहिए।

---

<a id="how-it-works"></a>
## ⚙️ कैसे काम करता है

```
  आप: "JWT के साथ auth सिस्टम बनाओ, tests जोड़ो"
                    │
                    ▼
  Claude Agent tool कॉल करता है:
    { name: "qa_engineer", prompt: "Write E2E tests" }
                    │
                    ▼
  ┌─────────────────────────────────────────┐
  │  PreToolUse Hook (स्वचालित)             │
  │                                         │
  │  agentcrow-inject.sh → agentcrow inject │
  │    1. catalog-index.json लोड  (~5ms)    │
  │    2. "qa_engineer" खोजें    (सटीक)    │
  │    3. QA Engineer पर्सोना लोड           │
  │    4. प्रॉम्प्ट में जोड़ें              │
  └─────────────────────────────────────────┘
                    │
                    ▼
  सबएजेंट पूर्ण पर्सोना के साथ शुरू होता है:
    <AGENTCROW_PERSONA>
    You are QA Engineer — test specialist
    ## MUST
    - Test every public function
    - Cover happy path, edge case, error path
    ## MUST NOT
    - Never test implementation details
    - Never use sleep for async waits
    </AGENTCROW_PERSONA>

    Write E2E tests    ← मूल प्रॉम्प्ट सुरक्षित
```

### तीन मैचिंग रणनीतियाँ

| प्राथमिकता | रणनीति | उदाहरण |
|-----------|--------|--------|
| 1 | सटीक नाम | `name: "qa_engineer"` → QA Engineer |
| 2 | सबएजेंट टाइप | `subagent_type: "security_auditor"` → Security Auditor |
| 3 | कीवर्ड + समानार्थी | `"kubernetes deploy"` → DevOps Automator |

फ़ज़ी मैचिंग एक **समानार्थी मैप** (50+ एंट्री) और **हिस्ट्री लर्निंग** का उपयोग करता है — बार-बार उपयोग किए जाने वाले एजेंट को प्राथमिकता मिलती है।

---

## 👀 पहले / बाद

<table>
<tr>
<td width="50%">

**❌ AgentCrow के बिना**
```
Claude खाली सबएजेंट बनाता है:
  prompt: "Write tests for auth"

  परिणाम:
  - सामान्य टेस्ट फ़ाइल
  - AAA स्ट्रक्चर नहीं
  - एज केसेज़ छोड़ दिए
  - कवरेज लक्ष्य नहीं
```

</td>
<td width="50%">

**✅ AgentCrow के साथ**
```
QA Engineer पर्सोना इंजेक्ट किया:
  MUST: हर पब्लिक फ़ंक्शन टेस्ट करो
  MUST NOT: इम्प्लीमेंटेशन डिटेल्स टेस्ट मत करो

  परिणाम:
  - AAA स्ट्रक्चर वाले टेस्ट
  - हैप्पी पाथ + एज + एरर कवर
  - कवरेज रिपोर्ट शामिल
  - CI कॉन्फ़िग जेनरेट किया
```

</td>
</tr>
</table>

---

<a id="agents"></a>
## 🤖 154 एजेंट

### 14 हाथ से तैयार बिल्ट-इन एजेंट

हर बिल्ट-इन एजेंट में व्यक्तित्व, MUST/MUST NOT नियम, डिलीवरेबल्स और सफलता मेट्रिक्स हैं।

| एजेंट | विशेषज्ञता | मुख्य नियम |
|--------|-----------|-----------|
| **Backend Architect** | API, auth, डेटाबेस, कैशिंग | "माइग्रेशन के बिना कभी डिप्लॉय नहीं" |
| **Frontend Developer** | React/Next.js, Core Web Vitals | "इनहेरिटेंस से पहले कंपोज़िशन, हमेशा" |
| **QA Engineer** | यूनिट/इंटीग्रेशन/E2E, कवरेज | "बिना टेस्ट कोड टूटा हुआ कोड है" |
| **Security Auditor** | OWASP, CVSS, हर खोज के लिए PoC | "कभी नहीं कहता 'कोड सुरक्षित है'" |
| **UI Designer** | डिज़ाइन सिस्टम, टोकन, स्पेसिंग | "अगर टोकन सिस्टम में नहीं है, तो अस्तित्व में नहीं है" |
| **DevOps Automator** | CI/CD, Docker, K8s, सीक्रेट्स | "प्रोडक्शन में :latest टैग नहीं" |
| **AI Engineer** | LLM, RAG, प्रॉम्प्ट ऑप्टिमाइज़ेशन | "LLM को गार्डरेल चाहिए" |
| **Refactoring Specialist** | कोड स्मेल्स, Fowler कैटलॉग | "बिना टेस्ट कभी रिफ़ैक्टर नहीं" |
| **Complexity Critic** | साइक्लोमैटिक कॉम्प्लेक्सिटी, YAGNI | "बिना सबूत कभी कॉम्प्लेक्स नहीं कहना" |
| **Data Pipeline Engineer** | ETL, इडेम्पोटेंसी, स्कीमा | "इडेम्पोटेंसी पर कोई समझौता नहीं" |
| **Technical Writer** | API डॉक्स, गाइड, READMEs | "हर वाक्य अपनी जगह कमाता है" |
| **Translator** | i18n, locale फ़ाइलें, अनुवाद | "कोड आइडेंटिफ़ायर कभी अनुवाद नहीं" |
| **Compose Meta-Reviewer** | एजेंट कंपोज़िशन का ऑडिट | "स्कोर 70 से नीचे हो तो एक्ज़ीक्यूशन ब्लॉक" |
| **Unreal GAS Specialist** | GameplayAbilitySystem, UE5 | "GameplayAbilities में डैमेज कैलकुलेशन नहीं" |

### 140 बाहरी एजेंट (13 डिवीज़न)

| डिवीज़न | संख्या | उदाहरण |
|----------|------:|---------|
| Engineering | 24 | Data Engineer, Mobile Builder, Security Engineer |
| Marketing | 25 | SEO, TikTok, LinkedIn, Douyin Strategist |
| Game Dev | 20 | Godot, Unity, Unreal विशेषज्ञ |
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
## 🔧 कमांड

```bash
# इंस्टॉल और सेटअप
agentcrow init [--global] [--lang en|ko] [--max 5] [--mcp]

# लाइफसाइकल
agentcrow on / off [--global]   # सक्षम/अक्षम
agentcrow status                # इंस्टॉलेशन जाँचें
agentcrow doctor                # 12-पॉइंट डायग्नोस्टिक
agentcrow update                # नवीनतम एजेंट प्राप्त करें
agentcrow uninstall             # साफ़ अनइंस्टॉल

# एजेंट प्रबंधन
agentcrow agents                # सभी 154 एजेंट सूचीबद्ध करें
agentcrow agents search <query> # कीवर्ड खोज
agentcrow add <path|url>        # कस्टम एजेंट जोड़ें (.md/.yaml)
agentcrow remove <role>         # कस्टम एजेंट हटाएँ

# निरीक्षण और डिबग
agentcrow compose <prompt>      # डिकंपोज़िशन का प्रीव्यू (dry run)
agentcrow stats                 # डिस्पैच हिस्ट्री और एनालिटिक्स
agentcrow inject                # Hook हैंडलर (आंतरिक)

# MCP सर्वर
agentcrow serve                 # MCP सर्वर शुरू करें (stdio)
```

---

## 📊 आँकड़े

```bash
$ agentcrow stats

  🐦 AgentCrow Stats

  Match Quality
    exact  106 (55%)   ← नाम सीधे मैच हुआ
    fuzzy   87 (45%)   ← कीवर्ड + समानार्थी मैच
    none     0 (0%)    ← कोई मैच नहीं, passthrough

  Top Agents
    qa_engineer            89 ████████████████████
    frontend_developer     23 █████
    backend_architect      15 ███
```

---

## 🛡️ सुरक्षा और प्रदर्शन

| | |
|:---|:---|
| Hook लेटेंसी | प्रति Agent कॉल **< 50ms** |
| टोकन ओवरहेड | प्रति पर्सोना **~350 टोकन** |
| Fail-open | इंडेक्स या बाइनरी गायब → passthrough (कोई ब्रेक नहीं) |
| बिल्ट-इन टाइप | `Explore`, `Plan`, `general-purpose` → कभी इंटरसेप्ट नहीं |
| सरल प्रॉम्प्ट | कोई एजेंट डिस्पैच नहीं, शून्य ओवरहेड |
| `agentcrow off` | पूरी तरह अक्षम, सब बैकअप |

> [!IMPORTANT]
> AgentCrow कभी Claude को ब्लॉक नहीं करता। अगर कुछ भी विफल होता है, तो मूल प्रॉम्प्ट बिना बदलाव के पास हो जाता है।

---

## 🏗️ आर्किटेक्चर

```
~/.agentcrow/
  ├── agents/
  │   ├── builtin/          14 YAML (हाथ से तैयार)
  │   ├── external/         140 MD (agency-agents + समुदाय)
  │   └── md/               154 एकीकृत .md फ़ाइलें
  ├── catalog-index.json    <5ms लुकअप के लिए प्री-बिल्ट
  └── history.json          डिस्पैच रिकॉर्ड (अंतिम 1000)

~/.claude/
  ├── settings.json         SessionStart + PreToolUse hooks
  ├── hooks/
  │   └── agentcrow-inject.sh
  └── agents/
      └── INDEX.md          एजेंट कैटलॉग
```

---

## ➕ कस्टम एजेंट

```bash
agentcrow add ./my-agent.yaml           # लोकल फ़ाइल
agentcrow add https://example.com/a.md  # URL
agentcrow remove my_agent               # हटाएँ (केवल कस्टम)
```

एजेंट फ़ॉर्मेट (`.md` या `.yaml`):

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

## 🔌 MCP सर्वर (वैकल्पिक)

```bash
agentcrow init --global --mcp
```

Claude Code में 3 टूल जोड़ता है: `agentcrow_match`, `agentcrow_search`, `agentcrow_list`।

---

## 🤝 योगदान

```bash
git clone https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 190 tests
```

## 📜 लाइसेंस

MIT

---

<p align="center">
  <b>🐦 हर सबएजेंट एक पर्सोना का हक़दार है।</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
