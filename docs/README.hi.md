<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  एक प्रॉम्प्ट दो। AgentCrow उसे तोड़कर स्पेशलिस्ट एजेंट्स को पैरेलल में भेजता है। 9 बिल्ट-इन + एक्सटर्नल एजेंट्स।<br>
  <code>npx agentcrow init</code> → <code>claude</code> → ऑटो-डिस्पैच।
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
  <a href="README.de.md">Deutsch</a> •
  <a href="README.fr.md">Français</a> •
  <a href="README.ru.md">Русский</a> •
  हिन्दी •
  <a href="README.tr.md">Türkçe</a> •
  <a href="README.vi.md">Tiếng Việt</a>
</p>

---

```
  आप:   "एक फ़ूड डिलीवरी ऐप बनाओ ट्रैकिंग और पेमेंट के साथ"

  AgentCrow डीकंपोज़ करता है → 5 एजेंट्स:

    🖥️  frontend_developer  → रेस्टोरेंट लिस्टिंग, कार्ट UI, ऑर्डर ट्रैकिंग
    🏗️  backend_architect   → ऑर्डर API, पेमेंट इंटीग्रेशन, डेटाबेस
    🗺️  ui_designer         → मैप व्यू, डिलीवरी ट्रैकिंग इंटरफ़ेस
    🧪  qa_engineer         → ऑर्डर फ़्लो E2E टेस्ट, पेमेंट edge cases
    📝  technical_writer    → API डॉक्यूमेंटेशन, इंटीग्रेशन गाइड

  आपने एजेंट्स नहीं चुने। AgentCrow ने चुने।
```

<h3 align="center">⬇️ एक लाइन। बस।</h3>

```bash
npx agentcrow init
```

<p align="center">
  फिर हमेशा की तरह <code>claude</code> चलाओ। बाकी AgentCrow सँभाल लेगा।<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ AgentCrow के बिना**
```
आप: एक डैशबोर्ड बनाओ
    API, टेस्ट और डॉक्स के साथ

Claude: (एक एजेंट सब कुछ करता है)
        - सारी फ़ाइलें पढ़ता है
        - सारा कोड लिखता है
        - सारे टेस्ट चलाता है
        - सारे डॉक्स लिखता है
        = एक कॉन्टेक्स्ट विंडो
        = पहले का काम भूल जाता है
        = 10+ मिनट
```

</td>
<td width="50%">

**✅ AgentCrow के साथ**
```
आप: वही प्रॉम्प्ट

AgentCrow ऑटो-डिस्पैच करता है:
  @ui_designer     → लेआउट
  @frontend_dev    → React कोड
  @backend_arch    → API
  @qa_engineer     → टेस्ट
  @tech_writer     → डॉक्यूमेंटेशन

  = पैरेलल एजेंट्स
  = हर एक फ़ोकस्ड
  = बेहतर रिज़ल्ट
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ इंस्टॉल

```bash
npx agentcrow init
```

बस इतना। ये दो काम करता है:

**पहली बार** — एजेंट्स `~/.agentcrow/` में डाउनलोड होते हैं (ग्लोबल, सभी प्रोजेक्ट्स में शेयर्ड)

**हर बार** — AgentCrow सेक्शन `.claude/CLAUDE.md` में मर्ज होता है (आपके मौजूदा रूल्स बरकरार रहते हैं)

> [!NOTE]
> एजेंट्स ग्लोबली `~/.agentcrow/` में स्टोर होते हैं। दूसरे प्रोजेक्ट से = इंस्टैंट, कोई डाउनलोड नहीं।

> [!TIP]
> पहले से CLAUDE.md है? AgentCrow अपना सेक्शन **जोड़ता** है — आपके मौजूदा रूल्स को छूता नहीं।

<a id="how-it-works"></a>
## ⚙️ कैसे काम करता है

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

1. **AgentCrow इनिशियलाइज़्ड प्रोजेक्ट में `claude` चलाओ**
2. **कोई भी कॉम्प्लेक्स प्रॉम्प्ट टाइप करो**
3. **Claude CLAUDE.md पढ़ता है** — एजेंट लिस्ट और डिस्पैच रूल्स पहचानता है
4. **Claude डीकंपोज़ करता है** — प्रॉम्प्ट को फ़ोकस्ड टास्क्स में बाँटता है
5. **Claude डिस्पैच करता है** — Agent टूल से सब-एजेंट्स बनाता है
6. **हर एजेंट काम करता है** — अपनी एक्सपर्टीज़ में

कोई API key नहीं। कोई सर्वर नहीं। बस Claude Code + CLAUDE.md।

<a id="agents"></a>
## 🤖 9 बिल्ट-इन एजेंट्स + एक्सटर्नल एजेंट्स

| डिवीज़न | उदाहरण |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | test_automation, performance_tester |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | qa_engineer, korean_tech_writer, security_auditor |
| + more | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 कमांड्स

```bash
npx agentcrow init              # एजेंट्स + CLAUDE.md सेटअप (अंग्रेज़ी डिफ़ॉल्ट)
npx agentcrow init --lang ko    # कोरियन टेम्पलेट
npx agentcrow init --max 5      # मैक्सिमम एक साथ एजेंट्स
npx agentcrow status            # एक्टिव है या नहीं चेक करो
npx agentcrow off               # अस्थायी रूप से बंद करो
npx agentcrow on                # फिर से चालू करो
npx agentcrow agents            # सभी एजेंट्स की लिस्ट
npx agentcrow agents search ai  # कीवर्ड से खोजो
npx agentcrow compose "prompt"  # डीकंपोज़िशन प्रीव्यू (dry run)
```

## 💡 प्रॉम्प्ट उदाहरण

```
एक फ़ूड डिलीवरी ऐप बनाओ ट्रैकिंग और पेमेंट के साथ
→ frontend_developer + backend_architect + ui_designer + qa_engineer

ऑनलाइन शिक्षा प्लेटफ़ॉर्म बनाओ वीडियो कोर्स, क्विज़ और सर्टिफ़िकेट के साथ
→ frontend_developer + backend_architect + devops_automator + qa_engineer

इन्वेंटरी मैनेजमेंट सिस्टम बनाओ रिपोर्ट्स और अलर्ट्स के साथ
→ backend_architect + frontend_developer + qa_engineer + technical_writer
```

सिंपल प्रॉम्प्ट नॉर्मली चलते हैं। AgentCrow सिर्फ़ मल्टी-टास्क रिक्वेस्ट में एक्टिवेट होता है।

## 🛡️ ज़ीरो ओवरहेड

| | |
|:---|:---|
| 🟢 कॉम्प्लेक्स प्रॉम्प्ट | एजेंट्स में ऑटो-डीकंपोज़ |
| 🔵 सिंपल प्रॉम्प्ट | नॉर्मली चलता है, कोई एजेंट नहीं |
| 🔴 `agentcrow off` | पूरी तरह बंद |

> [!IMPORTANT]
> AgentCrow सिर्फ़ `.claude/CLAUDE.md` और `.claude/agents/` को छूता है। कोई प्रोजेक्ट डिपेंडेंसी नहीं, कोई बैकग्राउंड प्रोसेस नहीं। `agentcrow off` दोनों का बैकअप लेकर साफ़-सुथरा हटाता है।

## 🤝 योगदान

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 60 tests
```

## 📜 लाइसेंस

MIT — एक्सटर्नल एजेंट्स [agency-agents](https://github.com/msitarzewski/agency-agents) से।

---

<p align="center">
  <b>🐦 एक प्रॉम्प्ट। कई एजेंट्स। ज़ीरो कॉन्फ़िग।</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
