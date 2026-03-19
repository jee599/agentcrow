<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  プロンプトを1つ入力するだけ。AgentCrowが専門エージェントに自動分割して実行します。9つのビルトイン + 外部エージェント。<br>
  <code>npx agentcrow init</code> → <code>claude</code> → 自動ディスパッチ。
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
  日本語 •
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

これだけで完了です。2つのことを行います:

**初回のみ** — エージェントを `~/.agentcrow/` にダウンロード（グローバル、全プロジェクトで共有）

**毎回** — AgentCrowセクションを `.claude/CLAUDE.md` にマージ（既存のルールはそのまま保持）

> [!NOTE]
> エージェントは `~/.agentcrow/` にグローバル保存されます。2つ目のプロジェクト以降はダウンロード不要、即座に完了。

> [!TIP]
> すでにCLAUDE.mdがある場合、AgentCrowは自分のセクションを**追加**するだけ — 既存のルールには触れません。

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
## 🤖 9ビルトインエージェント + 外部エージェント

| 部門 | 例 |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | test_automation, performance_tester |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | qa_engineer, korean_tech_writer, security_auditor |
| + more | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 コマンド

```bash
npx agentcrow init              # エージェント + CLAUDE.md セットアップ（英語デフォルト）
npx agentcrow init --lang ko    # 韓国語テンプレート
npx agentcrow status            # アクティブか確認
npx agentcrow off               # 一時的に無効化
npx agentcrow on                # 再有効化
npx agentcrow agents            # 全エージェント一覧
npx agentcrow agents search ai  # キーワード検索
npx agentcrow compose "prompt"  # 分解プレビュー（dry run）
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
> AgentCrowが触れるのは `.claude/CLAUDE.md` と `.claude/agents/` だけです。依存関係なし、バックグラウンドプロセスなし。`agentcrow off` で両方をバックアップ後、きれいに削除します。

## 🤝 コントリビュート

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 60 tests
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
