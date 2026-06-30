---
title: リソース集
description: AI駆動開発をさらに学ぶための、実在する良質な一次情報を分類して紹介します。公式ドキュメント、プロンプト、エージェント・MCP、セキュリティ、生産性測定、コミュニティを、信頼できるURLのみで整理します。
---

# リソース集

AI駆動開発をさらに深めるための、信頼できる一次情報を分類して紹介します。本ページは **実在が確実なURLのみ** を掲載し、推測や記憶頼りのリンクは避けています。

::: tip 読み方
ツールやモデルの仕様は変化が速いため、**最終的な真実は常に公式ドキュメント** にあります。本ハンドブックの解説と公式情報が食い違う場合は、公式を優先してください。
:::

## モデル・プラットフォーム公式ドキュメント

| リソース | URL | 概要 |
| --- | --- | --- |
| Anthropic ドキュメント | https://docs.anthropic.com | Claudeモデル(Opus / Sonnet / Haiku)とAPIの公式ドキュメント。プロンプト設計やツール使用の一次情報。 |
| Anthropic Engineering Blog | https://www.anthropic.com/engineering | Anthropic公式の技術ブログ。エージェント設計・コンテキスト管理・評価などの実践的知見。 |
| Claude Code | https://docs.claude.com/en/docs/claude-code | ターミナルで動作するAnthropic公式のコーディングエージェントの公式ドキュメント。 |
| OpenAI Platform Docs | https://platform.openai.com/docs | OpenAIのモデルとAPIの公式ドキュメント。 |

## プロンプト

| リソース | URL | 概要 |
| --- | --- | --- |
| Prompt Engineering Guide | https://www.promptingguide.ai | プロンプト技法を体系的にまとめた解説サイト。CoT・Few-shot・ReAct などの技法を網羅。→ [プロンプトの基礎](/prompting/fundamentals) |
| Anthropic ドキュメント(Prompt engineering) | https://docs.anthropic.com | Claude向けのプロンプト設計ガイドとベストプラクティスを含む公式ドキュメント。 |

## エージェント・MCP

| リソース | URL | 概要 |
| --- | --- | --- |
| Model Context Protocol | https://modelcontextprotocol.io | AIアプリと外部ツール・データを接続するオープン標準(MCP)の公式サイト。仕様とSDK。 |
| Anthropic Engineering Blog | https://www.anthropic.com/engineering | エージェント構築・ツール使用・マルチエージェント設計の実践的な解説記事。→ [エージェントとは](/agents/what-is-agent) |

## コーディングツール

| リソース | URL | 概要 |
| --- | --- | --- |
| GitHub Copilot Docs | https://docs.github.com/copilot | GitHub Copilotの公式ドキュメント。エディタ統合とエンタープライズ運用。 |
| Cursor | https://docs.cursor.com | AI統合エディタ Cursor の公式ドキュメント。 |
| Aider | https://aider.chat | ターミナルで動くAIペアプログラミングツール Aider の公式サイト。 |
| Continue | https://continue.dev | VS Code / JetBrains向けのオープンソースAIコーディング拡張 Continue の公式サイト。 |
| Cline | https://github.com/cline/cline | VS Code向けの自律型AIコーディングエージェント Cline のGitHubリポジトリ。 |

## セキュリティ

| リソース | URL | 概要 |
| --- | --- | --- |
| OWASP Top 10 for LLM Applications | https://genai.owasp.org | LLMアプリ特有のリスク(プロンプトインジェクション等)を整理したOWASPの公式プロジェクト。→ [セキュリティ](/quality/security) |
| OWASP | https://owasp.org | Webアプリケーションセキュリティの定番リファレンスを提供する非営利団体の公式サイト。 |

## 生産性測定

| リソース | URL | 概要 |
| --- | --- | --- |
| DORA | https://dora.dev | DevOps Research and Assessment の公式サイト。4つの主要指標と研究レポート(State of DevOps)。→ [生産性の測定](/adoption/metrics) |
| SPACEフレームワーク(論文) | https://queue.acm.org/detail.cfm?id=3454124 | "The SPACE of Developer Productivity"(ACM Queue掲載)。生産性を多次元で捉える枠組みの原典。 |

::: info SPACEについて
SPACEフレームワークは、開発者生産性を単一指標で測ることの誤りを指摘し、Satisfaction / Performance / Activity / Communication / Efficiency の5次元で捉えることを提案した論文に由来します。上記はACM Queueに掲載された一次情報です。
:::

## コミュニティ

| リソース | URL | 概要 |
| --- | --- | --- |
| arXiv | https://arxiv.org | LLM・エージェント研究の論文プレプリントが集まるリポジトリ。一次研究を当たりたいときに。 |
| Hugging Face | https://huggingface.co | オープンウェイトのモデル・データセット・デモが集まるプラットフォーム。ローカル/オンプレ検討の起点。 |

## このサイト内の関連ページ

外部リソースに進む前に、本ハンドブックの該当ページで全体像を押さえると理解が早まります。

- [AI駆動開発とは](/guide/what-is-aidd) — 全体像と成熟度モデル。
- [LLMの仕組み](/concepts/how-llms-work) — なぜそう振る舞うかのメンタルモデル。
- [ツールの全体像](/tools/landscape) — 上記ツール群をどう位置づけるか。
- [学習ロードマップ](/reference/roadmap) — 段階的な学習パス。
- [FAQ](/reference/faq) — 経験者が抱く疑問への回答。
- [用語集](/reference/glossary) — 本ページで出てくる用語の定義。
- [チートシート](/reference/cheatsheet) — すぐ使えるプロンプト/レビューの早見表。

::: warning URLの鮮度について
本ページのリンクは実在する公式情報源を厳選していますが、各サイトのURL構成や提供内容は提供者の都合で変わることがあります。リンク切れに気づいた場合は、各提供者のトップページから目的のドキュメントをたどってください。
:::

<div style="margin-top: 32px; padding: 16px 20px; border-radius: 12px; background: var(--vp-c-bg-soft);">

**次に読む** → [用語集](/reference/glossary) / [学習ロードマップ](/reference/roadmap)

</div>
