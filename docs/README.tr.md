<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Tek bir prompt. AgentCrow parcalara ayirir ve uzman ajanlari paralel olarak calistirir. 9 yerlesik + harici ajanlar.<br>
  <code>npx agentcrow init</code> → <code>claude</code> → otomatik dispatch.
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
  <a href="README.hi.md">हिन्दी</a> •
  Türkçe •
  <a href="README.vi.md">Tiếng Việt</a>
</p>

---

```
  Sen:   "Gerçek zamanlı sohbet uygulaması yap, bildirimler ve dosya paylaşımı ile"

  AgentCrow parcalar → 5 ajan:

    🖥️  frontend_developer  → Sohbet arayuzu, dosya yukleme, bildirim paneli
    🏗️  backend_architect   → WebSocket sunucusu, dosya depolama, veritabani
    🎨  ui_designer         → Mesaj baloncuklari, responsive tasarim
    🧪  qa_engineer         → Mesajlasma E2E testleri, dosya paylasim edge case'leri
    📝  technical_writer    → API dokumantasyonu, entegrasyon rehberi

  Ajanlari sen secmedin. AgentCrow secti.
```

<h3 align="center">⬇️ Tek satir. Hepsi bu.</h3>

```bash
npx agentcrow init
```

<p align="center">
  Sonra her zamanki gibi <code>claude</code> calistir. Gerisini AgentCrow halleder.<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ AgentCrow Olmadan**
```
Sen: Bir dashboard yap,
     API, test ve dokumantasyon ile

Claude: (tek ajan her seyi yapar)
        - tum dosyalari okur
        - tum kodu yazar
        - tum testleri calistirir
        - tum dokumanlariyazar
        = tek context penceresi
        = onceki isleri unutur
        = 10+ dakika
```

</td>
<td width="50%">

**✅ AgentCrow ile**
```
Sen: ayni prompt

AgentCrow otomatik dispatch eder:
  @ui_designer     → layout
  @frontend_dev    → React kodu
  @backend_arch    → API
  @qa_engineer     → testler
  @tech_writer     → dokumantasyon

  = paralel ajanlar
  = her biri odakli
  = daha iyi sonuclar
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ Kurulum

```bash
npx agentcrow init
```

Bu kadar. Iki sey yapar:

**Ilk calistirmada** — ajanlar `~/.agentcrow/` dizinine indirilir (global, tum projeler arasinda paylasilir)

**Her calistirmada** — AgentCrow bolumu `.claude/CLAUDE.md` dosyasina merge edilir (mevcut kurallariniz korunur)

> [!NOTE]
> Ajanlar global olarak `~/.agentcrow/` altinda saklanir. Ikinci projeden itibaren = aninda, indirme yok.

> [!TIP]
> Zaten CLAUDE.md'niz var mi? AgentCrow kendi bolumunu **ekler** — mevcut kurallariniza dokunmaz.

<a id="how-it-works"></a>
## ⚙️ Nasil Calisir

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

1. **AgentCrow baslatilmis projede `claude` calistirirsin**
2. **Karmasik bir prompt yazarsin**
3. **Claude CLAUDE.md'yi okur** — ajan listesini ve dispatch kurallarini belirler
4. **Claude parcalar** — promptu odakli alt gorevlere boler
5. **Claude dispatch eder** — Agent araciyla alt ajanlar olusturur
6. **Her ajan calisir** — kendi uzmanlik alaninda

API anahtari yok. Sunucu yok. Sadece Claude Code + CLAUDE.md.

<a id="agents"></a>
## 🤖 9 Yerlesik Ajan + Harici Ajanlar

| Bolum | Ornekler |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | test_automation, performance_tester |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | qa_engineer, korean_tech_writer, security_auditor |
| + more | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 Komutlar

```bash
npx agentcrow init              # Ajanlar + CLAUDE.md kur (Ingilizce varsayilan)
npx agentcrow init --lang ko    # Korece sablon
npx agentcrow init --max 5      # Maksimum esajanli ajan sayisi
npx agentcrow status            # Aktif mi kontrol et
npx agentcrow off               # Gecici olarak devre disi birak
npx agentcrow on                # Tekrar etkinlestir
npx agentcrow agents            # Tum ajanlari listele
npx agentcrow agents search ai  # Anahtar kelimeyle ara
npx agentcrow compose "prompt"  # Ayristirma onizlemesi (dry run)
```

## 💡 Prompt Ornekleri

```
Gerçek zamanlı sohbet uygulaması yap, bildirimler ve dosya paylaşımı ile
→ frontend_developer + backend_architect + ui_designer + qa_engineer

Online egitim platformu yap, video dersler, quizler ve sertifikalar ile
→ frontend_developer + backend_architect + devops_automator + qa_engineer

E-ticaret sitesi yap, stok yonetimi ve admin paneli ile
→ frontend_developer + backend_architect + ui_designer + qa_engineer
```

Basit promptlar normal calisir. AgentCrow sadece coklu gorev isteklerinde devreye girer.

## 🛡️ Sifir Overhead

| | |
|:---|:---|
| 🟢 Karmasik promptlar | Otomatik olarak ajanlara ayrilir |
| 🔵 Basit promptlar | Normal calisir, ajan yok |
| 🔴 `agentcrow off` | Tamamen devre disi |

> [!IMPORTANT]
> AgentCrow sadece `.claude/CLAUDE.md` ve `.claude/agents/` dosyalarina dokunur. Proje bagimililigi yok, arka plan sureci yok. `agentcrow off` ikisini de yedekleyip temiz bir sekilde kaldirir.

## 🤝 Katki

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 60 tests
```

## 📜 Lisans

MIT — Harici ajanlar [agency-agents](https://github.com/msitarzewski/agency-agents) kaynakli.

---

<p align="center">
  <b>🐦 Tek prompt. Birden fazla ajan. Sifir konfigurayon.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
