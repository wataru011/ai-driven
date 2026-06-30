---
layout: home

hero:
  name: "AI駆動開発ハンドブック"
  text: "AIと共に、より速く・より良く作る"
  tagline: 経験豊富なプログラマーのための、AI駆動開発(AI-Driven Development)の決定版ガイド。概念からツール、ワークフロー、エージェント、品質・セキュリティ、組織導入までを体系的に。
  image:
    src: /logo.svg
    alt: AI駆動開発ハンドブック
  actions:
    - theme: brand
      text: 🚀 30分で実務に導入する
      link: /ready/quickstart-30min
    - theme: alt
      text: AI駆動開発とは？
      link: /guide/what-is-aidd
    - theme: alt
      text: 逆引きレシピ集
      link: /ready/recipes
    - theme: alt
      text: GitHub
      link: https://github.com/wataru011/ai-driven

features:
  - icon: 🧭
    title: 体系的に理解する
    details: バズワードを超えて、AI駆動開発の本質・歴史・従来手法との違いを構造的に整理。経験者がすぐに全体像を掴めます。
    link: /guide/what-is-aidd
    linkText: 概念を学ぶ
  - icon: 🧠
    title: コア技術を押さえる
    details: LLM・コンテキストウィンドウ・RAG・ファインチューニング。ツールを"魔法"ではなく"工学"として扱うための基礎技術。
    link: /concepts/how-llms-work
    linkText: 技術を学ぶ
  - icon: 🧰
    title: ツールを使いこなす
    details: Copilot・Cursor・Claude Code・各種エージェント。乱立するツールを役割で分類し、選定基準まで提示します。
    link: /tools/landscape
    linkText: ツールを比較
  - icon: ✍️
    title: プロンプトを設計する
    details: 行き当たりばったりの指示から脱却。再現性のあるコンテキスト設計と実践テクニックを体系化。
    link: /prompting/fundamentals
    linkText: プロンプトを学ぶ
  - icon: 🔁
    title: ワークフローに統合する
    details: 設計・実装・テスト・レビュー・リファクタリングの各フェーズで、AIをどう組み込むかを具体的に解説。
    link: /workflow/overview
    linkText: ワークフローを見る
  - icon: 🤖
    title: エージェントを構築する
    details: ツール使用・MCP・マルチエージェント。単なる補完を超えた自律的なエージェント開発の勘所。
    link: /agents/what-is-agent
    linkText: エージェントを学ぶ
  - icon: 🛡️
    title: 品質と安全を守る
    details: ハルシネーション・脆弱性・ライセンス。AI生成コードに潜むリスクと、それを抑え込む実務的な対策。
    link: /quality/code-quality
    linkText: 品質を学ぶ
  - icon: 🏢
    title: 組織に展開する
    details: 個人の生産性をチーム・組織の成果へ。導入戦略・ガバナンス・効果測定までをカバー。
    link: /adoption/strategy
    linkText: 導入を学ぶ
  - icon: 🛠️
    title: 手を動かして学ぶ
    details: 機能開発・テスト生成・デバッグ・レガシー移行を、実際のプロンプトと差分つきで追体験できるハンズオン集。
    link: /practice/feature-development
    linkText: ハンズオンへ
  - icon: 🧩
    title: パターンで引き出す
    details: 再利用可能なプロンプトパターンカタログとアンチパターン集。"その都度考える"から"型を使う"へ。
    link: /patterns/prompt-catalog
    linkText: パターン集へ
  - icon: 🧮
    title: モデルとコストを最適化
    details: モデル選定・出力評価(Evals)・トークンコスト最適化。AIを"工学的に"運用するための判断軸。
    link: /models/choosing-models
    linkText: モデルを学ぶ
---

<div style="max-width: 880px; margin: 56px auto 0; padding: 0 24px;">

## 🚀 今すぐ実務で使いたい人へ

理屈は後回しで、**今日から現場に組み込みたい**なら、まずこの「実務ですぐ使う」セクションへ。コピペしてそのまま使えるテンプレートを揃えています。

| すぐ使えるもの | 内容 |
| --- | --- |
| [30分クイックスタート](/ready/quickstart-30min) | 今日の30分でAIを開発に組み込む具体手順 |
| [ルールファイル雛形](/ready/rule-files) | `CLAUDE.md` / `AGENTS.md` / Cursor / Copilot のコピペ雛形 |
| [プロンプトテンプレート集](/ready/prompt-templates) | 実装・レビュー・テスト等のコピペ用プロンプト |
| [逆引きレシピ集](/ready/recipes) | 「○○したい」から引く実務タスク手順 |
| [CI/CD連携(実YAML)](/ready/ci-integration) | PRへの自動AIレビュー等のワークフロー |
| [MCPセットアップ](/ready/mcp-setup) | `.mcp.json` 設定例とサーバー構成 |
| [チーム利用ポリシー雛形](/ready/team-policy) | 社内配布用ガイドラインのテンプレート |
| [PR・レビュー基準](/ready/pr-review-standards) | PRテンプレ・レビュー観点・マージ基準 |

## このサイトについて

**AI駆動開発ハンドブック**は、生成AIを日々の開発に組み込みたい、あるいはすでに使っているが体系立てて理解したい**経験豊富なプログラマー**のための知識サイトです。

「AIにコードを書かせてみた」という入門の段階を越え、**再現性・品質・安全性・チームスケール**を伴った"開発の方法論"としてAIを使いこなすために必要な知識を、1つの場所に集約しています。

### こんな人に向いています

- すでに開発経験は豊富で、AIを"使えるツール"から"戦力"に引き上げたいエンジニア
- チームや組織にAI駆動開発を導入する立場のテックリード・アーキテクト
- ツールの選定や、生成コードの品質・セキュリティ管理に責任を持つ人
- AIエージェントやMCPなど、最新の開発パラダイムをキャッチアップしたい人

### 読み方ガイド

| 目的 | おすすめの入口 |
| --- | --- |
| まず全体像を掴みたい | [AI駆動開発とは](/guide/what-is-aidd) → [従来開発との違い](/guide/vs-traditional) |
| すぐ手を動かしたい | [はじめての一歩](/guide/getting-started) → [機能開発ハンズオン](/practice/feature-development) |
| 技術の中身を知りたい | [LLMの仕組み](/concepts/how-llms-work) → [RAG](/concepts/rag) |
| プロンプトを極めたい | [プロンプト基礎](/prompting/fundamentals) → [パターンカタログ](/patterns/prompt-catalog) |
| 自分のスタックで使いたい | [スタック別ガイド](/stacks/frontend) |
| 新規/既存改修で進め方を知りたい | [新規 vs 既存改修](/approach/greenfield-vs-brownfield) → [既存改修のアプローチ](/approach/brownfield) |
| 業務フローに組み込みたい | [開発ワークフロー](/workflow/overview) |
| モデル/コストを最適化したい | [モデルの選び方](/models/choosing-models) → [コスト最適化](/models/cost-optimization) |
| チームに導入したい | [導入戦略](/adoption/strategy) → [ガバナンス](/adoption/governance) |
| 体系立てて学びたい | [学習ロードマップ](/reference/roadmap) |

::: tip 補足
本サイトは技術トレンドの変化が激しい分野を扱っています。製品名・価格・モデル仕様などは執筆時点の一般的な情報であり、実際の利用時は各ベンダーの一次情報を確認してください。
:::

</div>
