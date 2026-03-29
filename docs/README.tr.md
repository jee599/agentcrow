<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Claude boş alt ajanlar oluşturur. AgentCrow onları uzman yapar.<br>
  154 uzman kişiliği. Hook ile zorunlu. Sıfır yapılandırma.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-154-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-190_passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/hook-PreToolUse-blue?style=flat-square" alt="Hook" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#install">Kurulum</a> •
  <a href="#how-it-works">Nasıl Çalışır</a> •
  <a href="#agents">Ajanlar</a> •
  <a href="#commands">Komutlar</a> •
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  <a href="README.ja.md">日本語</a> •
  <a href="README.zh.md">中文</a>
</p>

---

## Sorun

Claude Code bir alt ajan oluşturduğunda, o ajan **boş bir genel uzman** olur. Uzmanlık yok, kural yok, kişilik yok.

```
Siz: "Auth + test + docs oluştur"

AgentCrow Olmadan:
  Agent 1: (boş) → auth yazar       ← kodlama standartları yok
  Agent 2: (boş) → testler yazar    ← kapsam kuralları yok
  Agent 3: (boş) → doküman yazar    ← stil kılavuzu yok

AgentCrow ile:
  Agent 1: → 🏗️ Backend Mimar enjekte edildi
            "Veri bütünlüğü konusunda paranoyak. Migration olmadan asla deploy etmez."
  Agent 2: → 🧪 QA Mühendisi enjekte edildi
            "'Muhtemelen çalışıyor'u kişisel hakaret olarak algılar."
  Agent 3: → 📝 Teknik Yazar enjekte edildi
            "Her cümle yerini hak eder."
```

Bir **PreToolUse Hook** her Agent tool çağrısını yakalar ve doğru uzman kişiliğini enjekte eder — otomatik olarak, alt ajan başlamadan önce. Manuel seçim yok. Prompt mühendisliği yok.

---

<a id="install"></a>
## ⚡ Kurulum

```bash
npm i -g agentcrow
agentcrow init --global
```

İki komut. Bundan sonra her alt ajan bir uzman kişiliği alır.

> [!TIP]
> Doğrulama: `agentcrow status` her iki hook'u da (SessionStart + PreToolUse) aktif göstermelidir.

---

<a id="how-it-works"></a>
## ⚙️ Nasıl Çalışır

```
  Siz: "JWT ile auth sistemi oluştur, testler ekle"
                    │
                    ▼
  Claude Agent tool'u çağırır:
    { name: "qa_engineer", prompt: "Write E2E tests" }
                    │
                    ▼
  ┌─────────────────────────────────────────┐
  │  PreToolUse Hook (otomatik)             │
  │                                         │
  │  agentcrow-inject.sh → agentcrow inject │
  │    1. catalog-index.json yükle  (~5ms)  │
  │    2. "qa_engineer" ara        (tam)    │
  │    3. QA Engineer kişiliğini yükle      │
  │    4. İsteme ekle                       │
  └─────────────────────────────────────────┘
                    │
                    ▼
  Alt ajan tam kişilikle başlar:
    <AGENTCROW_PERSONA>
    You are QA Engineer — test specialist
    ## MUST
    - Test every public function
    - Cover happy path, edge case, error path
    ## MUST NOT
    - Never test implementation details
    - Never use sleep for async waits
    </AGENTCROW_PERSONA>

    Write E2E tests    ← orijinal istem korunur
```

### Üç eşleştirme stratejisi

| Öncelik | Strateji | Örnek |
|---------|----------|-------|
| 1 | Tam isim | `name: "qa_engineer"` → QA Engineer |
| 2 | Alt ajan tipi | `subagent_type: "security_auditor"` → Security Auditor |
| 3 | Anahtar kelime + eş anlamlı | `"kubernetes deploy"` → DevOps Automator |

Bulanık eşleştirme bir **eş anlamlı haritası** (50+ giriş) ve **geçmiş öğrenimi** kullanır — sık kullandığınız ajanlar öncelik kazanır.

---

## 👀 Önce / Sonra

<table>
<tr>
<td width="50%">

**❌ AgentCrow Olmadan**
```
Claude boş alt ajan oluşturur:
  prompt: "Write tests for auth"

  Sonuç:
  - Genel test dosyası
  - AAA yapısı yok
  - Uç durumlar atlandı
  - Kapsam hedefi yok
```

</td>
<td width="50%">

**✅ AgentCrow ile**
```
QA Mühendisi kişiliği enjekte edildi:
  MUST: her public fonksiyonu test et
  MUST NOT: implementasyon detaylarını test etme

  Sonuç:
  - AAA yapılı testler
  - Happy path + edge + error kapsandı
  - Kapsam raporu dahil
  - CI yapılandırması oluşturuldu
```

</td>
</tr>
</table>

---

<a id="agents"></a>
## 🤖 154 Ajan

### 14 El Yapımı Yerleşik Ajan

Her yerleşik ajan; kişilik, MUST/MUST NOT kuralları, çıktılar ve başarı metrikleri içerir.

| Ajan | Uzmanlık | Temel Kural |
|------|-----------|----------|
| **Backend Architect** | API, auth, veritabanı, önbellek | "Migration olmadan asla deploy etme" |
| **Frontend Developer** | React/Next.js, Core Web Vitals | "Kalıtım yerine bileşim, her zaman" |
| **QA Engineer** | Birim/entegrasyon/E2E, kapsam | "Test edilmemiş kod bozuk koddur" |
| **Security Auditor** | OWASP, CVSS, her bulgu için PoC | "Asla 'kod güvenli' demez" |
| **UI Designer** | Tasarım sistemleri, tokenlar, aralık | "Token sisteminde yoksa, var değildir" |
| **DevOps Automator** | CI/CD, Docker, K8s, gizli bilgiler | "Üretimde :latest etiketi yok" |
| **AI Engineer** | LLM, RAG, istem optimizasyonu | "LLM'ler korkuluk gerektirir" |
| **Refactoring Specialist** | Kod kokuları, Fowler kataloğu | "Test olmadan asla yeniden düzenleme yapma" |
| **Complexity Critic** | Döngüsel karmaşıklık, YAGNI | "Kanıt olmadan asla karmaşık deme" |
| **Data Pipeline Engineer** | ETL, idempotentlik, şemalar | "İdempotentlik pazarlık konusu değil" |
| **Technical Writer** | API belgeleri, kılavuzlar, README'ler | "Her cümle yerini hak eder" |
| **Translator** | i18n, yerel ayar dosyaları, çeviri | "Kod tanımlayıcılarını asla çevirme" |
| **Compose Meta-Reviewer** | Ajan bileşimlerini denetle | "Puan 70'in altındaysa yürütmeyi engelle" |
| **Unreal GAS Specialist** | GameplayAbilitySystem, UE5 | "GameplayAbilities'de hasar hesabı yok" |

### 140 Harici Ajan (13 Bölüm)

| Bölüm | Sayı | Örnekler |
|----------|------:|---------|
| Engineering | 24 | Data Engineer, Mobile Builder, Security Engineer |
| Marketing | 25 | SEO, TikTok, LinkedIn, Douyin Strategist |
| Game Dev | 20 | Godot, Unity, Unreal uzmanları |
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
## 🔧 Komutlar

```bash
# Kurulum & Ayar
agentcrow init [--global] [--lang en|ko] [--max 5] [--mcp]

# Yaşam Döngüsü
agentcrow on / off [--global]   # Etkinleştir/Devre dışı bırak
agentcrow status                # Kurulumu kontrol et
agentcrow doctor                # 12 noktalı tanılama
agentcrow update                # En son ajanları getir
agentcrow uninstall             # Temiz kaldırma

# Ajan Yönetimi
agentcrow agents                # Tüm 154 ajanı listele
agentcrow agents search <query> # Anahtar kelime araması
agentcrow add <path|url>        # Özel ajan ekle (.md/.yaml)
agentcrow remove <role>         # Özel ajanı kaldır

# İnceleme & Hata Ayıklama
agentcrow compose <prompt>      # Ayrıştırma önizlemesi (dry run)
agentcrow stats                 # Gönderim geçmişi & analitik
agentcrow inject                # Hook işleyicisi (dahili)

# MCP Sunucusu
agentcrow serve                 # MCP sunucusunu başlat (stdio)
```

---

## 📊 İstatistikler

```bash
$ agentcrow stats

  🐦 AgentCrow Stats

  Match Quality
    exact  106 (55%)   ← isim doğrudan eşleşti
    fuzzy   87 (45%)   ← anahtar kelime + eş anlamlı eşleşti
    none     0 (0%)    ← eşleşme yok, passthrough

  Top Agents
    qa_engineer            89 ████████████████████
    frontend_developer     23 █████
    backend_architect      15 ███
```

---

## 🛡️ Güvenlik & Performans

| | |
|:---|:---|
| Hook gecikmesi | Agent çağrısı başına **< 50ms** |
| Token yükü | Kişilik başına **~350 token** |
| Fail-open | Eksik dizin veya ikili → passthrough (kesinti yok) |
| Yerleşik tipler | `Explore`, `Plan`, `general-purpose` → asla yakalanmaz |
| Basit istemler | Ajan gönderimi yok, sıfır yük |
| `agentcrow off` | Tamamen devre dışı, her şey yedeklendi |

> [!IMPORTANT]
> AgentCrow asla Claude'u engellemez. Bir şey başarısız olursa, orijinal istem değişmeden geçer.

---

## 🏗️ Mimari

```
~/.agentcrow/
  ├── agents/
  │   ├── builtin/          14 YAML (el yapımı)
  │   ├── external/         140 MD (agency-agents + topluluk)
  │   └── md/               154 birleşik .md dosyası
  ├── catalog-index.json    <5ms arama için önceden oluşturulmuş
  └── history.json          Gönderim kayıtları (son 1000)

~/.claude/
  ├── settings.json         SessionStart + PreToolUse hooks
  ├── hooks/
  │   └── agentcrow-inject.sh
  └── agents/
      └── INDEX.md          Ajan kataloğu
```

---

## ➕ Özel Ajanlar

```bash
agentcrow add ./my-agent.yaml           # Yerel dosya
agentcrow add https://example.com/a.md  # URL
agentcrow remove my_agent               # Kaldır (yalnızca özel)
```

Ajan formatı (`.md` veya `.yaml`):

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

## 🔌 MCP Sunucusu (İsteğe Bağlı)

```bash
agentcrow init --global --mcp
```

Claude Code'a 3 araç ekler: `agentcrow_match`, `agentcrow_search`, `agentcrow_list`.

---

## 🤝 Katkıda Bulunma

```bash
git clone https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 190 tests
```

## 📜 Lisans

MIT

---

<p align="center">
  <b>🐦 Her alt ajan bir kişiliği hak eder.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
