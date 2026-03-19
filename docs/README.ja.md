<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  プロンプトを1つ入力するだけ。AgentCrowが144の専門エージェントに自動分割して実行します。<br>
  <code>npx agentcrow init</code> → <code>claude</code> → 自動ディスパッチ。
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-144_ready-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-70_passing-brightgreen?style=flat-square" alt="Tests" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  日本語 •
  <a href="README.zh.md">中文</a>
</p>

---

```
  あなた:  "ブログプラットフォームを作って。Markdown対応、コメント、RSS付きで"

  AgentCrowが分解 → エージェント4つ:

    🖥️  frontend_developer  → Next.js MDXレンダリング、コメントUI
    🏗️  backend_architect   → 記事API、認証、コメントシステム
    🎨  ui_designer         → レスポンシブレイアウト、ダークモード
    🧪  qa_engineer         → Markdown変換テスト、RSS検証

  Claudeが各エージェントを自動的にディスパッチします。
```

<h3 align="center">⬇️ たった1行。以上。</h3>

```bash
npx agentcrow init
```

<p align="center">
  あとはいつも通り <code>claude</code> を実行するだけ。残りはAgentCrowにお任せ。<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ AgentCrowなし**
```
あなた: ダッシュボードを作って。
       API、テスト、ドキュメント込みで。

Claude: (1つのエージェントが全部やる)
        - 全ファイルを読み
        - 全コードを書き
        - 全テストを実行し
        - 全ドキュメントを作成
        = コンテキストウィンドウ1つ
        = 前半の作業を忘れる
        = 10分以上
```

</td>
<td width="50%">

**✅ AgentCrowあり**
```
あなた: 同じプロンプト

AgentCrowが自動ディスパッチ:
  @ui_designer     → レイアウト
  @frontend_dev    → Reactコード
  @backend_arch    → API
  @qa_engineer     → テスト
  @tech_writer     → ドキュメント

  = 並列エージェント
  = それぞれ専門領域に集中
  = より良い結果
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ インストール

```bash
npx agentcrow init
```

これだけで完了です。以下のファイルが生成されます:
- `.agr/agents/` — 144エージェント定義（ビルトイン9 + 外部135）
- `.claude/CLAUDE.md` — Claude向け自動ディスパッチルール
- `.claude/settings.local.json` — SessionStartフック

> [!TIP]
> AgentCrowは初回init時に[agency-agents](https://github.com/msitarzewski/agency-agents)から外部エージェント135個をダウンロードします。`git`が必要です。

<a id="how-it-works"></a>
## ⚙️ 仕組み

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

1. **AgentCrowが初期化されたプロジェクトで`claude`を実行**する
2. **複雑なタスクをプロンプト**として入力する
3. **ClaudeがCLAUDE.mdを読み取る** — エージェント一覧とディスパッチルールを把握
4. **Claudeが分解する** — プロンプトを専門的な個別タスクに分割
5. **Claudeがディスパッチする** — Agentツールでサブエージェントを生成
6. **各エージェントが作業する** — それぞれの専門領域の中で

APIキー不要。サーバー不要。Claude Code + CLAUDE.md、それだけです。

<a id="agents"></a>
## 🤖 144エージェント、15部門

| 部門 | 数 | 例 |
|:---------|------:|:---------|
| **Engineering** | 23 | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | 20 | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | 18 | content_strategist, seo_specialist, social_media |
| **Testing** | 8 | test_automation, performance_tester |
| **Design** | 8 | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | 9 | qa_engineer, korean_tech_writer, security_auditor |
| + 他9部門 | 58 | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 コマンド

```bash
npx agentcrow init              # Set up agents + CLAUDE.md
npx agentcrow status            # Check if active
npx agentcrow off               # Disable temporarily
npx agentcrow on                # Re-enable
npx agentcrow agents            # List all 144 agents
npx agentcrow agents search ai  # Search by keyword
npx agentcrow compose "prompt"  # Preview decomposition (dry run)
```

## 💡 プロンプト例

```
React로 로그인 만들고 API 연동하고 테스트하고 문서 작성해줘
→ frontend_developer + backend_architect + qa_engineer + korean_tech_writer

Build a real-time chat app with WebSocket and deploy to Docker
→ frontend_developer + backend_architect + devops_automator + qa_engineer

ゲームのマッチメイキングシステムを設計して実装して
→ game_designer + backend_architect + qa_engineer
```

シンプルなプロンプトは通常通り動作します。AgentCrowはマルチタスクリクエストの場合のみ起動します。

## 🛡️ オーバーヘッドゼロ

| | |
|:---|:---|
| 🟢 複雑なプロンプト | エージェントに自動分解 |
| 🔵 シンプルなプロンプト | 通常通り実行、エージェントなし |
| 🔴 `agentcrow off` | 完全に無効化 |

> [!IMPORTANT]
> AgentCrowが追加するのはCLAUDE.mdファイル1つだけです。依存関係なし、バックグラウンドプロセスなし。`agentcrow off`できれいに削除できます。

## 🤝 コントリビュート

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentochester && npm install && npm test  # 70 tests
```

## 📜 ライセンス

MIT — 外部エージェントの出典: [agency-agents](https://github.com/msitarzewski/agency-agents)。

---

<p align="center">
  <b>🐦 プロンプト1つ。エージェント多数。設定ゼロ。</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
