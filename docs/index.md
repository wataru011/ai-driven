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
      text: AI駆動開発とは？
      link: /guide/what-is-aidd
    - theme: alt
      text: ツールの全体像を見る
      link: /tools/landscape
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
---

<div style="max-width: 880px; margin: 56px auto 0; padding: 0 24px;">

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
| すぐ手を動かしたい | [はじめての一歩](/guide/getting-started) → [プロンプト基礎](/prompting/fundamentals) |
| 技術の中身を知りたい | [LLMの仕組み](/concepts/how-llms-work) → [RAG](/concepts/rag) |
| 業務フローに組み込みたい | [開発ワークフロー](/workflow/overview) |
| チームに導入したい | [導入戦略](/adoption/strategy) → [ガバナンス](/adoption/governance) |

::: tip 補足
本サイトは技術トレンドの変化が激しい分野を扱っています。製品名・価格・モデル仕様などは執筆時点の一般的な情報であり、実際の利用時は各ベンダーの一次情報を確認してください。
:::

</div>
